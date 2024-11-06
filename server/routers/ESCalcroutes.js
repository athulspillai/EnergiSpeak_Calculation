import express from 'express';
import ESCalc from '../models/ESCalc.js';
import ESTerminal from '../models/ESTerminal.js';
import CDNuts from '../models/CDNuts.js';
import axios from 'axios';

const router = express.Router();

// router.post('/add-calc', async (req, res) => {
//     try {
//         const { calcName, items, outputs, calculationtype, resetinterval, subinterval, delay } = req.body;

//         if (!calcName || !Array.isArray(items) || items.length === 0) {
//             return res.status(400).json({ error: "Invalid input data. 'calcName' and 'items' are required." });
//         }

//         if (!Array.isArray(outputs) || outputs.length === 0) {
//             return res.status(400).json({ error: "Invalid input data. 'outputs' must be a non-empty array." });
//         }

//         const lastCalc = await ESCalc.findOne().sort({ CalculationId: -1 });
//         let newCalculationId = 1;
//         let lastMeasurandId = 1000;

//         if (lastCalc) {
//             newCalculationId = parseInt(lastCalc.CalculationId, 10) + 1;

//             const maxMeasurandId = Math.max(...lastCalc.OutputList.map(output => output.MeasurandId));
//             lastMeasurandId = Math.max(lastMeasurandId, maxMeasurandId);
//         }

//         const inputList = items.map((item, index) => ({
//             InputId: `I${index + 1}`,
//             TerminalId: item.terminalId,
//             MeasurandId: item.measurandId,
//             MeasurandName: item.measurand,
//             MeasurandValue: item.value
//         }));

//         const outputList = outputs.map((output, index) => ({
//             MeasurandId: lastMeasurandId + index + 1,
//             Formula: output.formula,
//             MeasurandName: output.outputName,
//             TerminalId: output.terminalId
//         }));

//         const newCalculation = new ESCalc({
//             CalculationId: newCalculationId.toString(),
//             CalculationName: calcName,
//             InputList: inputList,
//             OutputList: outputList,
//             CalculationType: calculationtype,
//             ResetInterval: resetinterval,
//             SubInterval: subinterval,
//             Delay: delay
//         });

//         await newCalculation.save();

//         const updateDelay = delay * 1000;
//         const updateSubInterval = subinterval * 1000;
//         const updateResetInterval = resetinterval * 1000;
//         const updatedstoredDelay = delay * 1000;

//         const evaluateFormula = (formula, currentValues) => {
//             try {
//                 const evaluatedFormula = formula.replace(/I(\d+)/g, (match, p1) => {
//                     const inputId = `I${p1}`;
//                     return currentValues[inputId] !== undefined ? currentValues[inputId] : 0;
//                 });
//                 return eval(evaluatedFormula);
//             } catch (error) {
//                 console.error(`Error evaluating formula ${formula}:`, error);
//                 return 0;
//             }
//         };

//         setTimeout(async () => {
//             try {
//                 const currentValues = {};

//                 // Step 1: Fetch current values for each item in the inputs (items list)
//                 for (const item of items) {
//                     const measurandResponse = await axios.get(`http://localhost:8000/ESCalc/cdnuts/${item.terminalId}`);
//                     const measurandData = measurandResponse.data.Data;

//                     // Map each input's MeasurandName to its MeasurandValue for formula evaluation
//                     currentValues[`I${items.indexOf(item) + 1}`] = measurandData[item.measurand];
//                 }

//                 // Step 2: Evaluate each output formula using the fetched current values
//                 for (const output of outputs) {
//                     const calculatedValue = evaluateFormula(output.formula, currentValues);

//                     // Step 3: Store the result back into CDNuts for the specific TerminalId
//                     await axios.put(`http://localhost:8000/ESCalc/cdnuts/${output.terminalId}`, {
//                         MeasurandName: output.outputName,
//                         MeasurandValue: calculatedValue,
//                     });
//                     console.log(`Stored Delay: Updated CDNuts for TerminalId ${output.terminalId} with MeasurandName ${output.outputName} and MeasurandValue ${calculatedValue}`);
//                 }
//             } catch (error) {
//                 console.error("Error during delayed CDNuts update:", error);
//             }
//         }, updateDelay);


//         const intervalId = setInterval(async () => {
//             try {
//                 const currentValues = {};

//                 for (const item of items) {
//                     const itemTerminalId = item.terminalId;
//                     const measurandResponse = await axios.get(`http://localhost:8000/ESCalc/cdnuts/${itemTerminalId}`);
//                     const measurandData = measurandResponse.data.Data;

//                     for (const input of inputList) {
//                         if (input.TerminalId === itemTerminalId) {
//                             currentValues[input.InputId] = measurandData[input.MeasurandName];
//                         }
//                     }
//                 }

//                 for (const output of outputList) {
//                     const calculatedValue = evaluateFormula(output.Formula, currentValues);
//                     await axios.put(`http://localhost:8000/ESCalc/updates/cdnuts/${output.MeasurandId}`, {
//                         MeasurandName: output.MeasurandName,
//                         UpdatedMeasurandValue: calculatedValue
//                     });
//                     console.log(` SubInterval: Updated output ${output.MeasurandName} to ${calculatedValue} for TerminalId ${output.TerminalId}`);
//                 }

//             } catch (error) {
//                 console.error("Error fetching current values or updating outputs:", error);
//             }
//         }, updateSubInterval);

//         const resetIntervalId = setInterval(async () => {
//             try {
//                 for (const output of outputList) {
//                     const UpdatedValues = 0;
//                     await axios.put(`http://localhost:8000/ESCalc/updates/values/cdnuts/${output.MeasurandId}`, {
//                         MeasurandName: output.MeasurandName,
//                         UpdatedValue: UpdatedValues
//                     });
//                     console.log(`ResetInterval: Reset output ${output.MeasurandName} to ${UpdatedValues} for TerminalId ${output.TerminalId}`);
//                 }

//             } catch (error) {
//                 console.error("Error resetting output values:", error);
//             }
//         }, updateResetInterval);

//         const delayIntervalId = setInterval(async () => {
//             try {
//                 const currentValues = {};

//                 for (const item of items) {
//                     const itemTerminalId = item.terminalId;
//                     const measurandResponse = await axios.get(`http://localhost:8000/ESCalc/cdnuts/${itemTerminalId}`);
//                     const measurandData = measurandResponse.data.Data;

//                     for (const input of inputList) {
//                         if (input.TerminalId === itemTerminalId) {
//                             currentValues[input.InputId] = measurandData[input.MeasurandName];
//                         }
//                     }
//                 }

//                 for (const output of outputList) {
//                     const calculatedValue = evaluateFormula(output.Formula, currentValues);
//                     await axios.put(`http://localhost:8000/ESCalc/updates-delay/cdnuts/${output.MeasurandId}`, {
//                         MeasurandName: output.MeasurandName,
//                         UpdateddelayValue: calculatedValue
//                     });
//                     console.log(`Delay: Updated output ${output.MeasurandName} to ${calculatedValue} for TerminalId ${output.TerminalId}`);
//                 }

//             } catch (error) {
//                 console.error("Error fetching current values or updating outputs:", error);
//             }
//         }, updatedstoredDelay);

//         res.status(201).json({ message: "Calculation saved successfully", calculationid: newCalculationId });
//     } catch (error) {
//         console.error('Error saving calculation:', error);
//         res.status(500).json({ error: "Failed to save calculation" });
//     }
// });


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
        let newCalculationId = lastCalc ? parseInt(lastCalc.CalculationId, 10) + 1 : 1;
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
            MeasurandValue: item.value
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
                    const measurandResponse = await axios.get(`http://localhost:8000/ESCalc/cdnuts/${item.terminalId}`);
                    const measurandData = measurandResponse.data.Data;

                    // Map each input's MeasurandName to its MeasurandValue for formula evaluation
                    currentValues[`I${items.indexOf(item) + 1}`] = measurandData[item.measurand];
                }

                // Step 2: Evaluate each output formula using the fetched current values
                for (const output of outputs) {
                    const calculatedValue = evaluateFormula(output.formula, currentValues);

                    // Step 3: Store the result back into CDNuts for the specific TerminalId
                    await axios.put(`http://localhost:8000/ESCalc/cdnuts/${output.terminalId}`, {
                        MeasurandName: output.outputName,
                        MeasurandValue: calculatedValue,
                    });
                    console.log(`Stored Delay: Updated CDNuts for TerminalId ${output.terminalId} with MeasurandName ${output.outputName} and MeasurandValue ${calculatedValue}`);
                }
            } catch (error) {
                console.error("Error during delayed CDNuts update:", error);
            }
        }, updateDelay);

      

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

        async function subIntervalrunTask(items, outputs, evaluateFormula) {
            try {
                const currentValues = {};

                for (const item of items) {
                    const itemTerminalId = item.terminalId;
                    const measurandResponse = await axios.get(`http://localhost:8000/ESCalc/cdnuts/${itemTerminalId}`);
                    const measurandData = measurandResponse.data.Data;

                    for (const input of inputList) {
                        if (input.TerminalId === itemTerminalId) {
                            currentValues[input.InputId] = measurandData[input.MeasurandName];
                        }
                    }
                }

                for (const output of outputList) {
                    const calculatedValue = evaluateFormula(output.Formula, currentValues);
                    await axios.put(`http://localhost:8000/ESCalc/updates/cdnuts/${output.MeasurandId}`, {
                        MeasurandName: output.MeasurandName,
                        UpdatedMeasurandValue: calculatedValue
                    });
                    console.log(`SubInterval: Updated output ${output.MeasurandName} to ${calculatedValue} for TerminalId ${output.TerminalId}`);
                }

            } catch (error) {
                console.error("Error fetching current values or updating outputs:", error);
            }
        }

        async function resetIntervalrunTask(output) {
            try {
                await axios.put(`http://localhost:8000/ESCalc/updates/values/cdnuts/${output.MeasurandId}`, {
                    MeasurandName: output.MeasurandName,
                    UpdatedValue: 0
                });
                console.log(`Reset output ${output.MeasurandName} to 0 for TerminalId ${output.TerminalId}`);
            } catch (error) {
                console.error("Error resetting output values:", error);
            }
        }

        async function delayIntervalrunTask(items, outputs, evaluateFormula) {
            try {
                const currentValues = {};

                for (const item of items) {
                    const itemTerminalId = item.terminalId;
                    const measurandResponse = await axios.get(`http://localhost:8000/ESCalc/cdnuts/${itemTerminalId}`);
                    const measurandData = measurandResponse.data.Data;

                    for (const input of inputList) {
                        if (input.TerminalId === itemTerminalId) {
                            currentValues[input.InputId] = measurandData[input.MeasurandName];
                        }
                    }
                }

                for (const output of outputList) {
                    const calculatedValue = evaluateFormula(output.Formula, currentValues);
                    await axios.put(`http://localhost:8000/ESCalc/updates-delay/cdnuts/${output.MeasurandId}`, {
                        MeasurandName: output.MeasurandName,
                        UpdateddelayValue: calculatedValue
                    });
                    console.log(`Delay: Updated output ${output.MeasurandName} to ${calculatedValue} for TerminalId ${output.TerminalId}`);
                }

            } catch (error) {
                console.error("Error fetching current values or updating outputs:", error);
            }
        }

        function startSequence() {
            const taskSequence = [
                { interval: updateDelay, task: delayTask }, // Executes after 60 seconds initially
                { interval: updateSubInterval, task: subIntervalTask }, // Executes after 120 seconds
                { interval: updateResetInterval, task: resetIntervalTask } // Executes after 180 seconds
            ];

            let currentTask = 0;
            let loopStart = Date.now();

            const loop = () => {
                const { interval, task } = taskSequence[currentTask];
                const nextExecutionTime = loopStart + interval;

                setTimeout(async () => {
                    await task();
                    currentTask = (currentTask + 1) % taskSequence.length;

                    if (currentTask === 0) {
                        loopStart = Date.now(); // Reset the start time for the next cycle
                    }

                    loop(); // Recursive call to continue the sequence
                }, nextExecutionTime - Date.now());
            };

            loop(); // Start the sequence
        }

        startSequence();

        res.status(201).json({ message: "Calculation saved successfully", calculationid: newCalculationId });
    } catch (error) {
        console.error('Error saving calculation:', error);
        res.status(500).json({ error: "Failed to save calculation" });
    }
});

router.put('/updates/cdnuts/:MeasurandId', async (req, res) => {
    const { MeasurandId } = req.params; // Get MeasurandID from the URL parameters
    const { MeasurandName, UpdatedMeasurandValue } = req.body; // Get data from the request body

    try {
        // Update the MeasurandName and MeasurandValue in the MeasurandData array
        const updatedRecord = await CDNuts.updateOne(
            { "MeasurandData.MeasurandId": MeasurandId }, // Locate the document with the array item that matches MeasurandId
            {
                $set: {
                    "MeasurandData.$.MeasurandName": MeasurandName, // Update the MeasurandName within the array
                    "MeasurandData.$.MeasurandValue": UpdatedMeasurandValue // Update the MeasurandValue within the array
                }
            }
        );

        // Check if the record was modified
        if (updatedRecord.nModified === 0) {
            return res.status(404).json({ message: 'Record not found or not updated' });
        }

        // console.log(`Updated Measurand: Name - ${MeasurandName}, Value - ${UpdatedMeasurandValue}`);


        return res.status(200).json({ message: 'Record updated successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
});

router.put('/updates/values/cdnuts/:MeasurandId', async (req, res) => {
    const { MeasurandId } = req.params; // Get MeasurandID from the URL parameters
    const { MeasurandName, UpdatedValue } = req.body; // Get data from the request body

    try {
        // Update the MeasurandName and MeasurandValue in the MeasurandData array
        const updatedRecord = await CDNuts.updateOne(
            { "MeasurandData.MeasurandId": MeasurandId }, // Locate the document with the array item that matches MeasurandId
            {
                $set: {
                    "MeasurandData.$.MeasurandName": MeasurandName, // Update the MeasurandName within the array
                    "MeasurandData.$.MeasurandValue": UpdatedValue // Update the MeasurandValue within the array
                }
            }
        );

        // Check if the record was modified
        if (updatedRecord.nModified === 0) {
            return res.status(404).json({ message: 'Record not found or not updated' });
        }

        // console.log(`Updated Measurand: Name - ${MeasurandName}, Value - ${UpdatedValue}`);


        return res.status(200).json({ message: 'Record updated successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
});

router.put('/updates-delay/cdnuts/:MeasurandId', async (req, res) => {
    const { MeasurandId } = req.params; // Get MeasurandID from the URL parameters
    const { MeasurandName, UpdateddelayValue } = req.body; // Get data from the request body

    try {
        // Update the MeasurandName and MeasurandValue in the MeasurandData array
        const updatedRecord = await CDNuts.updateOne(
            { "MeasurandData.MeasurandId": MeasurandId }, // Locate the document with the array item that matches MeasurandId
            {
                $set: {
                    "MeasurandData.$.MeasurandName": MeasurandName, // Update the MeasurandName within the array
                    "MeasurandData.$.MeasurandValue": UpdateddelayValue // Update the MeasurandValue within the array
                }
            }
        );

        // Check if the record was modified
        if (updatedRecord.nModified === 0) {
            return res.status(404).json({ message: 'Record not found or not updated' });
        }

        // console.log(`Updated Measurand: Name - ${MeasurandName}, Value - ${UpdatedMeasurandValue}`);


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

        const cdnut = await CDNuts.findOne({ TerminalId }).select('Data');

        if (!cdnut) {
            return res.status(404).json({ message: 'CDNuts not found' });
        }

        res.status(200).json(cdnut);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch cdnut', error });
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


router.put('/update/cdnuts/:TerminalId', async (req, res) => {
    try {
        const { TerminalId } = req.params;
        const { secondsToAdd } = req.body;

        // Validate input
        if (typeof secondsToAdd !== 'number') {
            return res.status(400).json({ message: 'secondsToAdd must be a number.' });
        }

        // Find the CDNuts entry
        const cdnut = await CDNuts.findOne({ TerminalId });
        if (!cdnut) {
            return res.status(404).json({ message: 'CDNuts not found' });
        }

        // Update the Timestamp
        const updatedTimestamp = new Date(cdnut.TimestampId);
        updatedTimestamp.setSeconds(updatedTimestamp.getSeconds() + secondsToAdd);

        // Update the Data
        const updatedData = {};
        for (const key in cdnut.Data) {
            if (typeof cdnut.Data[key] === 'number') {
                updatedData[key] = cdnut.Data[key] + 5; // Adjust as needed
            }
        }

        // Update CDNuts document
        const updatedCdnut = await CDNuts.findOneAndUpdate(
            { TerminalId },
            { TimestampId: updatedTimestamp, Data: { ...cdnut.Data, ...updatedData } },
            { new: true }
        );

        // Update ESCalc InputList based on the updated CDNuts
        for (const [measurandName, measurandValue] of Object.entries(updatedData)) {
            await ESCalc.updateMany(
                { "InputList.TerminalId": TerminalId, "InputList.MeasurandName": measurandName },
                { $set: { "InputList.$[elem].MeasurandValue": measurandValue } },
                { arrayFilters: [{ "elem.TerminalId": TerminalId, "elem.MeasurandName": measurandName }] }
            );
        }

        // Recalculate OutputList based on updated InputList
        const escalcs = await ESCalc.find({ "InputList.TerminalId": TerminalId });

        for (const escalc of escalcs) {
            const outputList = escalc.OutputList;

            for (const output of outputList) {
                const formula = output.Formula;
                console.log('Formula:', formula);

                // Evaluate the formula using the current InputList MeasurandValue
                const inputValues = {};
                for (const input of escalc.InputList) {
                    console.log(`Checking input: ${input.MeasurandName} with TerminalId: ${input.TerminalId}`);
                    console.log(`Comparing with TerminalId: ${TerminalId}`);
                    if (input.TerminalId == TerminalId) {  // Using == to allow type coercion
                        inputValues[input.MeasurandName] = parseFloat(input.MeasurandValue) || 0; // Ensure it's a number
                    }
                }

                console.log('Input Values:', inputValues); // Log the populated inputValues object

                // Create a mapping for formula variables dynamically
                const variableMapping = {};
                let variableCounter = 1; // To create I1, I2, I3, etc.

                for (const key in inputValues) {
                    if (inputValues.hasOwnProperty(key)) {
                        variableMapping[`I${variableCounter}`] = inputValues[key];
                        variableCounter++;
                    }
                }

                console.log('Variable Mapping:', variableMapping); // Log the variable mapping

                // Replace variables in the formula with their corresponding values
                let evaluatedFormula = formula.replace(/I\d+/g, (match) => variableMapping[match] || 0);

                // Use a simple eval function to calculate the output based on the formula
                let recalculatedValue;
                try {
                    recalculatedValue = eval(evaluatedFormula);
                } catch (err) {
                    console.error('Error evaluating formula:', evaluatedFormula, err);
                    continue; // Skip this output if there's an error
                }

                // Update the OutputList MeasurandValue
                await ESCalc.updateOne(
                    { _id: escalc._id, "OutputList.MeasurandID": output.MeasurandID },
                    { $set: { " OutputList.$.MeasurandValue": recalculatedValue } }
                );

                // Update CDNuts MeasurandData with the recalculated value
                await CDNuts.updateOne(
                    { MeasurandData: { $elemMatch: { MeasurandId: output.MeasurandID } }, "MeasurandData.MeasurandId": output.MeasurandID },
                    { $set: { "MeasurandData.$.MeasurandValue": recalculatedValue } }
                );
            }
        }

        res.status(200).json({ message: 'Timestamp, data, and outputs updated successfully', TimestampId: updatedCdnut.TimestampId });
    } catch (error) {
        console.error('Error updating CDNuts:', error);
        res.status(500).json({ message: 'Failed to update CDNuts', error });
    }
});



export default router;