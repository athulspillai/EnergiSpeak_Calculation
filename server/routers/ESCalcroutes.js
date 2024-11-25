import express from 'express';
import ESCalc from '../models/ESCalc.js';
import ESTerminal from '../models/ESTerminal.js';
import CDNuts from '../models/CDNuts.js';
import axios from 'axios';

const router = express.Router();

router.post('/add-calc', async (req, res) => {
    try {
        const { calcName, items, outputs, calculationtype, resetinterval, subinterval, delay } = req.body;

        if (!calcName || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: "Invalid input data. 'calcName' and 'items' are required." });
        }

        if (!Array.isArray(outputs) || outputs.length === 0) {
            return res.status(400).json({ error: "Invalid input data. 'outputs' must be a non-empty array." });
        }

        // Generate unique IDs
        const lastCalc = await ESCalc.findOne().sort({ CalculationId: -1 });
        let newCalculationId = 1;  // Default to 1 if no records are found

        if (lastCalc && !isNaN(lastCalc.CalculationId)) {
            newCalculationId = Number(lastCalc.CalculationId) + 1;
        }
        let lastMeasurandId = 1000;

        if (lastCalc) {
            const maxMeasurandId = Math.max(...lastCalc.OutputList.map(output => output.MeasurandId));
            lastMeasurandId = Math.max(lastMeasurandId, maxMeasurandId);
        }

        const inputList = items.map((item, index) => ({
            InputId: `I${index + 1}`,
            TerminalId: item.terminalId,
            MeasurandId: item.measurandId,
            MeasurandName: item.measurand,
        }));

        const outputList = outputs.map((output, index) => ({
            MeasurandId: lastMeasurandId + index + 1,
            Formula: output.formula,
            MeasurandName: output.outputName,
            TerminalId: output.terminalId
        }));

        const newCalculation = new ESCalc({
            CalculationId: newCalculationId.toString(),
            CalculationName: calcName,
            InputList: inputList,
            OutputList: outputList,
            CalculationType: calculationtype,
            ResetInterval: resetinterval,
            SubInterval: subinterval,
            Delay: delay
        });

        await newCalculation.save();

        const updateDelay = delay * 1000;
        const updateSubInterval = subinterval * 1000;
        const updateResetInterval = resetinterval * 1000;

        const evaluateFormula = (formula, currentValues) => {
            try {
                const evaluatedFormula = formula.replace(/I(\d+)/g, (match, p1) => {
                    const inputId = `I${p1}`;
                    return currentValues[inputId] !== undefined ? currentValues[inputId] : 0;
                });
                return eval(evaluatedFormula);
            } catch (error) {
                console.error(`Error evaluating formula ${formula}:`, error);
                return 0;
            }
        };

        setTimeout(async () => {
            try {
                const currentValues = {};
        
                // Step 1: Fetch current values for each item in the inputs (items list)
                for (const item of items) {
                    const measurandResponse = await axios.get(`${process.env.REACT_APP_SERVER_URL}/cdnuts/${item.terminalId}`);
                    const measurandDataArray = measurandResponse.data.MeasurandData;
        
                    // Find the specific measurand based on MeasurandName
                    const measurandData = measurandDataArray.find(measurand => measurand.MeasurandName === item.measurand);
        
                    if (measurandData) {
                        currentValues[`I${items.indexOf(item) + 1}`] = parseFloat(measurandData.MeasurandValue); // Ensure value is numeric
                    } else {
                        console.warn(`Measurand ${item.measurand} not found for TerminalId ${item.terminalId}`);
                    }
                }
        
                // Step 2: Evaluate each output formula using the fetched current values
                for (const output of outputs) {
                    const calculatedValue = evaluateFormula(output.formula, currentValues);
        
                    // Step 3: Store the result back into CDNuts for the specific TerminalId
                    await axios.put(`${process.env.REACT_APP_SERVER_URL}/cdnuts/${output.terminalId}`, {
                        MeasurandName: output.outputName,
                        MeasurandValue: calculatedValue,
                    });
                    console.log(`Stored Delay: Updated CDNuts for TerminalId ${output.terminalId} with MeasurandName ${output.outputName} and MeasurandValue ${calculatedValue}`);
                }
            } catch (error) {
                console.error("Error during delayed CDNuts update:", error);
            }
        }, updateDelay);
        

        const startCalculationLoop = async () => {
            let delayTaskCompleted = false; // Flag to check if delay task has completed

            const executeTasks = async () => {
                console.log("Starting calculation loop");

                // Delay Task - Executes once after `updateDelay`
                setTimeout(async () => {
                    await delayTask();
                    // Mark delay task as completed
                    delayTaskCompleted = true;
                    // Check if it's time to run subIntervalTask after delayTask completes
                    if (delayTaskCompleted) {
                        console.log("Delay task completed, executing subIntervalTask.");
                        // await subIntervalTask(); // Execute subIntervalTask after delayTask completes
                    }
                }, updateDelay);

                // Sub-interval Task - Executes repeatedly every `updateSubInterval`
                const subIntervalId = setInterval(async () => {
                    if (!delayTaskCompleted) {
                        console.log("Skipping sub-interval task as delay task is not completed yet");
                        return; // Skip the subIntervalTask if delayTask is not completed
                    }
                    // If delayTask is completed, execute subIntervalTask
                    await subIntervalTask();
                    // After each sub-interval task, you may reset the delayTaskCompleted flag 
                    // if needed, depending on your logic for handling subsequent delay tasks.
                }, updateSubInterval);

                // Reset Task - Executes once after `updateResetInterval`
                setTimeout(async () => {
                    // Mark delay task as completed
                    delayTaskCompleted = false;
                    await resetIntervalTask();
                    // Restart the loop after reset
                    clearInterval(subIntervalId);
                    executeTasks(); // Restart the loop for the next cycle
                }, updateResetInterval);
            };

            executeTasks();
        };

        async function delayTask() {
            console.log("Running delay task");
            await delayIntervalrunTask(items, outputs, evaluateFormula);
        }

        async function subIntervalTask() {
            console.log("Running sub-interval task");
            await subIntervalrunTask(items, outputs, evaluateFormula);
        }

        async function resetIntervalTask() {
            console.log("Running reset-interval task");
            for (const output of outputList) {
                await resetIntervalrunTask(output);
            }
        }

        async function delayIntervalrunTask(items, outputs, evaluateFormula) {
            try {
                const currentValues = {};
        
                // Define a function to get the MeasurandValue based on MeasurandName
                function getMeasurandValue(measurandName, measurandData) {
                    const measurand = measurandData.find(item => item.MeasurandName === measurandName);
                    return measurand ? parseFloat(measurand.MeasurandValue) : null; // Return the MeasurandValue or null if not found
                }
        
                for (const item of items) {
                    const itemTerminalId = item.terminalId;
                    const measurandResponse = await axios.get(`${process.env.REACT_APP_SERVER_URL}/cdnuts/${itemTerminalId}`);
                    const measurandData = measurandResponse.data.MeasurandData;
        
                    for (const input of inputList) {
                        if (input.TerminalId === itemTerminalId) {
                            const measurandValue = getMeasurandValue(input.MeasurandName, measurandData);
                            if (measurandValue !== null) {
                                currentValues[input.InputId] = measurandValue;
                            }
                        }
                    }
                }
        
                // Process output values
                for (const output of outputList) {
                    const calculatedValue = evaluateFormula(output.Formula, currentValues);
                    await axios.put(`${process.env.REACT_APP_SERVER_URL}/updates-delay/cdnuts/${output.MeasurandId}`, {
                        MeasurandName: output.MeasurandName,
                        UpdateddelayValue: calculatedValue
                    });
                    console.log(`Delay: Updated output ${output.MeasurandName} to ${calculatedValue} for TerminalId ${output.TerminalId}`);
                }
        
            } catch (error) {
                console.error("Error fetching current values or updating outputs:", error);
            }
        }
        

        async function subIntervalrunTask(items, outputs, evaluateFormula) {
            try {
                const currentValues = {};

                function getMeasurandValue(measurandName, measurandData) {
                    const measurand = measurandData.find(item => item.MeasurandName === measurandName);
                    return measurand ? parseFloat(measurand.MeasurandValue) : null; // Return the MeasurandValue or null if not found
                }
        
                for (const item of items) {
                    const itemTerminalId = item.terminalId;
                    const measurandResponse = await axios.get(`${process.env.REACT_APP_SERVER_URL}/cdnuts/${itemTerminalId}`);
                    const measurandData = measurandResponse.data.MeasurandData;
        
                    for (const input of inputList) {
                        if (input.TerminalId === itemTerminalId) {
                            const measurandValue = getMeasurandValue(input.MeasurandName, measurandData);
                            if (measurandValue !== null) {
                                currentValues[input.InputId] = measurandValue;
                            }
                        }
                    }
                }

                for (const output of outputList) {
                    // Fetch previous calculated value
                    const previousResponse = await axios.get(`${process.env.REACT_APP_SERVER_URL}/cdnuts/measurand/${output.MeasurandId}`);
                    const previousCalculatedValue = parseFloat(previousResponse.data.MeasurandValue) || 0;  // Convert to number and default to 0 if not present

                    console.log(`Previous Value: ${previousCalculatedValue}`);

                    // Calculate the new value
                    const calculatedValue = parseFloat(evaluateFormula(output.Formula, currentValues)) || 0;  // Ensure calculatedValue is numeric

                    // Determine the new UpdatedMeasurandValue based on calculation type
                    let updatedValue;
                    if (calculationtype === "stream") {
                        updatedValue = previousCalculatedValue + calculatedValue;
                    } else if (calculationtype === "single") {
                        updatedValue = calculatedValue;
                    }

                    // Update with the determined value
                    await axios.put(`${process.env.REACT_APP_SERVER_URL}/updates/cdnuts/${output.MeasurandId}`, {
                        MeasurandName: output.MeasurandName,
                        UpdatedMeasurandValue: updatedValue
                    });

                    console.log(`SubInterval: Updated output ${output.MeasurandName} to ${updatedValue} for TerminalId ${output.TerminalId}`);
                }


            } catch (error) {
                console.error("Error fetching current values or updating outputs:", error);
            }
        }

        async function resetIntervalrunTask(output) {
            try {
                await axios.put(`${process.env.REACT_APP_SERVER_URL}/updates/values/cdnuts/${output.MeasurandId}`, {
                    MeasurandName: output.MeasurandName,
                    UpdatedValue: 0
                });
                console.log(`Reset output ${output.MeasurandName} to 0 for TerminalId ${output.TerminalId}`);
            } catch (error) {
                console.error("Error resetting output values:", error);
            }
        }

        // Start the loop after saving calculation successfully
        startCalculationLoop();

        res.status(201).json({ message: "Calculation saved successfully", calculationid: newCalculationId });
    } catch (error) {
        console.error('Error saving calculation:', error);
        res.status(500).json({ error: "Failed to save calculation" });
    }
});

router.put('/updates/cdnuts/:MeasurandId', async (req, res) => {
    const { MeasurandId } = req.params;
    const { MeasurandName, UpdatedMeasurandValue } = req.body;

    try {
        // Update the MeasurandName and MeasurandValue in the MeasurandData array
        const updatedRecord = await CDNuts.updateOne(
            { "MeasurandData.MeasurandId": MeasurandId },
            {
                $set: {
                    "MeasurandData.$.MeasurandName": MeasurandName,
                    "MeasurandData.$.MeasurandValue": UpdatedMeasurandValue
                }
            }
        );

        // Check if the record was modified
        if (updatedRecord.nModified === 0) {
            return res.status(404).json({ message: 'Record not found or not updated' });
        }

        return res.status(200).json({ message: 'Record updated successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
});

router.put('/updates/values/cdnuts/:MeasurandId', async (req, res) => {
    const { MeasurandId } = req.params; 
    const { MeasurandName, UpdatedValue } = req.body;

    try {
        // Update the MeasurandName and MeasurandValue in the MeasurandData array
        const updatedRecord = await CDNuts.updateOne(
            { "MeasurandData.MeasurandId": MeasurandId }, 
            {
                $set: {
                    "MeasurandData.$.MeasurandName": MeasurandName, 
                    "MeasurandData.$.MeasurandValue": UpdatedValue 
                }
            }
        );

        // Check if the record was modified
        if (updatedRecord.nModified === 0) {
            return res.status(404).json({ message: 'Record not found or not updated' });
        }

        return res.status(200).json({ message: 'Record updated successfully' });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
});

router.put('/updates-delay/cdnuts/:MeasurandId', async (req, res) => {
    const { MeasurandId } = req.params; 
    const { MeasurandName, UpdateddelayValue } = req.body; 

    try {
        // Update the MeasurandName and MeasurandValue in the MeasurandData array
        const updatedRecord = await CDNuts.updateOne(
            { "MeasurandData.MeasurandId": MeasurandId }, 
            {
                $set: {
                    "MeasurandData.$.MeasurandName": MeasurandName, 
                    "MeasurandData.$.MeasurandValue": UpdateddelayValue 
                }
            }
        );

        // Check if the record was modified
        if (updatedRecord.nModified === 0) {
            return res.status(404).json({ message: 'Record not found or not updated' });
        }

        return res.status(200).json({ message: 'Record updated successfully' });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
})




router.get('/calculations', async (req, res) => {
    try {
        const calculations = await ESCalc.find();
        res.status(200).json(calculations);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch calculations', error });
    }
});

router.get('/esterminal', async (req, res) => {
    try {
        const esterminals = await ESTerminal.find().select('DisplayName');
        res.status(200).json(esterminals);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch calculations', error });
    }
});

router.get('/esterminal/:DisplayName', async (req, res) => {
    try {
        const { DisplayName } = req.params;

        const esterminal = await ESTerminal.findOne({ DisplayName }).select('MeasurandList');

        if (!esterminal) {
            return res.status(404).json({ message: 'ESTerminal not found' });
        }

        res.status(200).json(esterminal);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch ESTerminal', error });
    }
});

router.get('/cdnuts', async (req, res) => {
    try {
        const cdnuts = await CDNuts.find();
        res.status(200).json(cdnuts);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch cdnuts', error });
    }
});

router.get('/cdnuts/:TerminalId', async (req, res) => {
    try {
        const { TerminalId } = req.params;

        const cdnut = await CDNuts.findOne({ TerminalId }).select('MeasurandData');

        if (!cdnut) {
            return res.status(404).json({ message: 'CDNuts not found' });
        }

        res.status(200).json(cdnut);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch cdnut', error });
    }
});

router.get('/cdnuts/measurand/:measurandId', async (req, res) => {
    try {
        const { measurandId } = req.params;

        // Find the document in CDNuts collection
        const cdnut = await CDNuts.findOne({
            "MeasurandData.MeasurandId": parseInt(measurandId)
        }, {
            "MeasurandData.$": 1 // Select only the matching MeasurandData item
        });

        // Check if the document and MeasurandData exist
        if (!cdnut || !cdnut.MeasurandData || cdnut.MeasurandData.length === 0) {
            return res.status(404).json({ message: 'Measurand data not found' });
        }

        // Extract MeasurandName and MeasurandValue
        const { MeasurandName, MeasurandValue } = cdnut.MeasurandData[0];

        // Send the extracted fields as response
        res.status(200).json({ MeasurandName, MeasurandValue });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch measurand data', error });
    }
});



router.put('/cdnuts/:TerminalId', async (req, res) => {
    try {

        const { TerminalId } = req.params;
        const { MeasurandName, MeasurandValue, } = req.body;

        if (!MeasurandName || !MeasurandValue) {
            return res.status(400).json({ message: 'MeasurandName and MeasurandValue are required.' });
        }

        const cdnut = await CDNuts.findOne({ TerminalId });

        if (!cdnut) {
            return res.status(404).json({ message: 'CDNuts not found' });
        }

        const existingMeasurandIds = await CDNuts.aggregate([
            { $unwind: "$MeasurandData" },
            { $group: { _id: null, ids: { $addToSet: "$MeasurandData.MeasurandId" } } },
        ]);

        const usedMeasurandIds = existingMeasurandIds.length > 0 ? existingMeasurandIds[0].ids : [];

        let lastMeasurandId = 1000;

        if (cdnut.MeasurandData && cdnut.MeasurandData.length > 0) {
            const maxMeasurandId = Math.max(...cdnut.MeasurandData.map(measurand => measurand.MeasurandId));
            lastMeasurandId = Math.max(lastMeasurandId, maxMeasurandId);
        }

        let newMeasurandId = lastMeasurandId + 1;
        while (usedMeasurandIds.includes(newMeasurandId)) {
            newMeasurandId++;
        }

        const newMeasurandData = {
            MeasurandId: newMeasurandId,
            MeasurandName,
            MeasurandValue
        };

        const updatedCdnut = await CDNuts.findOneAndUpdate(
            { TerminalId },
            { $push: { MeasurandData: newMeasurandData } },
            { new: true }
        );

        res.status(200).json(updatedCdnut);
    } catch (error) {
        console.error('Error updating CDNuts:', error);
        res.status(500).json({ message: 'Failed to update CDNuts', error });
    }
});

export default router;