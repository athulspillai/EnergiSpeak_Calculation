
import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Grid,
    Switch, // Ensure Switch is imported
} from '@mui/material';
import axios from 'axios';
import { evaluate } from 'mathjs';

function Calc() {
    const steps = ['Input Details', 'Add Formulas', 'Additional Settings'];
    const [activeStep, setActiveStep] = useState(0);
    const [calcName, setCalcName] = useState('');
    const [selectedTerminal, setSelectedTerminal] = useState('');
    const [terminal, setTerminal] = useState('');
    const [terminalData, setTerminalData] = useState([]);
    const [selectedMeasurand, setSelectedMeasurand] = useState('');
    const [measurandData, setMeasurandData] = useState([]);
    const [items, setItems] = useState([]);
    const [addFormula, setAddFormula] = useState('');
    const [outputName, setOutputName] = useState('');
    const [outputs, setOutputs] = useState([]);
    const [calculationType, setCalculationType] = useState('');
    const [resetInterval, setResetInterval] = useState('');
    const [subInterval, setSubInterval] = useState('');
    const [delay, setDelay] = useState('');
    const [isDisabled, setIsDisabled] = useState(false);
    const [isDisabled2, setIsDisabled2] = useState(false);
    const [isDisabled3, setIsDisabled3] = useState(false);
    const [completedSteps, setCompletedSteps] = useState({
        0: false,
        1: false,
        2: false,
    });

    useEffect(() => {
        const fetchTerminals = async () => {
            try {
                const response = await axios.get('http://localhost:8000/ESCalc/esterminal');
                setTerminalData(response.data);
            } catch (error) {
                console.error('Error fetching terminal data:', error);
            }
        };
        fetchTerminals();
    }, []);

    useEffect(() => {
        const fetchMeasurands = async () => {
            if (selectedTerminal) {
                try {
                    const response = await axios.get(
                        `http://localhost:8000/ESCalc/esterminal/${encodeURIComponent(selectedTerminal)}`
                    );
                    setMeasurandData(response.data.MeasurandList || []);
                } catch (error) {
                    console.error('Error fetching measurand data:', error);
                }
            } else {
                setMeasurandData([]);
            }
        };
        fetchMeasurands();
    }, [selectedTerminal]);

    const handleAddItem = async () => {
        if (selectedTerminal && selectedMeasurand) {
            const terminal = terminalData.find(t => t.DisplayName === selectedTerminal);
            const measurand = measurandData.find(m => m.MeasurandName === selectedMeasurand);
            if (terminal && measurand) {
                const exists = items.some(
                    item => item.terminalId === terminal._id && item.measurandId === measurand.MeasurandId
                );
                // if (exists) {
                //     alert('This terminal and measurand combination already exists in the input list.');
                //     return;
                // }

                try {
                    const response = await axios.get(`http://localhost:8000/ESCalc/cdnuts/${terminal._id}`);
                    const measurandValue = response.data.Data[measurand.MeasurandName];
                    console.log(measurandValue);


                    setItems([...items, {
                        terminal: terminal.DisplayName,
                        terminalId: terminal._id,
                        measurand: measurand.MeasurandName,
                        measurandId: measurand.MeasurandId,
                        value: measurandValue || '0'
                    }]);

                    setSelectedTerminal('');
                    setSelectedMeasurand('');
                } catch (error) {
                    console.error('Error fetching data for measurand:', error);
                }
            }
        } else {
            alert("Please select both a terminal and a measurand.");
        }
    };

    const handleAddFormula = () => {
        if (addFormula.trim() === '' || outputName.trim() === '' || !terminal) {
            alert("Please enter both formula, output name, and select a terminal.");
            return;
        }

        // Find the terminal object based on the selected terminal name
        const selectedTerminal = terminalData.find(t => t.DisplayName === terminal);

        if (!selectedTerminal) {
            alert("Invalid terminal selected.");
            return;
        }

        // Add the formula, output name, terminal ID, and disabled status to the outputs array
        setOutputs([...outputs, {
            formula: addFormula,
            outputName: outputName,
            terminalId: selectedTerminal._id, // store the terminal ID
            disabled: false // Initialize as enabled
        }]);

        // Reset inputs
        setAddFormula('');
        setOutputName('');
        setTerminal('');
    };

    const handleNextStep1 = () => {
        if (calcName.trim() === '' || items.length === 0) {
            alert("Please provide a calculation name and add at least one input.");
            return;
        }
        setCompletedSteps(prev => ({ ...prev, 0: true }));
        setActiveStep(1);
        setIsDisabled(true);
    };

    const handleNextStep2 = () => {
        if (outputs.length === 0) {
            alert("Please add at least one formula.");
            return;
        }
        setCompletedSteps(prev => ({ ...prev, 1: true }));
        setActiveStep(2);
        setIsDisabled2(true);
    };

    const handleNextStep3 = () => {
        // Check if all additional settings are filled
        if (
            calculationType.trim() === '' ||
            resetInterval.trim() === '' ||
            subInterval.trim() === '' ||
            delay.trim() === ''
        ) {
            alert("Please fill in all additional settings.");
            return;
        }

        // Convert the intervals and delay to numbers for comparison
        const resetIntervalNum = parseFloat(resetInterval);
        const subIntervalNum = parseFloat(subInterval);
        const delayNum = parseFloat(delay);

        // Validate the conditions
        if (subIntervalNum >= resetIntervalNum) {
            alert("Sub Interval must be less than Reset Interval.");
            return;
        }

        if (delayNum >= subIntervalNum) {
            alert("Delay must be less than Sub Interval.");
            return;
        }

        // If all validations pass, proceed to submit
        handleSubmit();

    };

    const handleBack = () => {
        if (activeStep > 0) {
            setActiveStep(prev => prev - 1);
            setIsDisabled(false); // Re-enable inputs when going back
        }
    };

    const handleCancel = () => {
        setCalcName('');
        setSelectedTerminal('');
        setSelectedMeasurand('');
        setActiveStep(0);
        setOutputs([]); // Reset outputs as well
    };

    const handleSubmit = async () => {
        // Prepare a mapping from Input IDs to their values
        const inputMap = {};
        items.forEach((item, index) => {
            const inputId = `I${index + 1}`;
            inputMap[inputId] = parseFloat(item.value) || 0;
        });

        // Evaluate each formula and prepare the results array
        const results = outputs.map((output) => {
            let formula = output.formula;

            // Replace Input IDs with their actual values
            Object.keys(inputMap).forEach((key) => {
                const regex = new RegExp(`\\b${key}\\b`, 'g');
                formula = formula.replace(regex, inputMap[key]);
            });

            let result;
            try {
                // Evaluate the formula using mathjs
                result = evaluate(formula);
            } catch (error) {
                result = 'Error in formula';
                console.error(`Error evaluating formula "${output.formula}":`, error);
            }

            return {
                terminalId: output.terminalId,
                outputName: output.outputName,
                outputValue: result,
                addFormula: output.formula // Include formula in the result
            };
        });

        const calculationData = {
            calcName,
            items,
            outputs: results.map(res => ({
                terminalId: res.terminalId,
                outputName: res.outputName,
                outputValue: res.outputValue,
                formula: res.addFormula // Include the formula in the output data
            })),
            calculationtype: calculationType,
            resetinterval: resetInterval,
            subinterval: subInterval,
            delay: delay
        };

       

        try {
            // Send data to the server for saving the calculation
            const response = await axios.post('http://localhost:8000/ESCalc/add-calc', calculationData);
            alert('Calculation saved successfully!');
            handleCancel(); // Reset the form after successful submission
        } catch (error) {
            console.error('Error saving calculation:', error);
            alert('Failed to save calculation.');
        }

        // Refresh the page
        window.location.reload();
    };




    const handleFormulaCancel = () => {
        setAddFormula('');
        setOutputName('');
        setTerminal('');
    };

    const handlesettingsCancel = () => {
        setCalculationType('');
        setResetInterval('');
        setSubInterval('');
        setDelay('');
    }

    // Handler to remove an item from the input list
    const handleRemoveItem = (index) => {
        const updatedItems = [...items];
        updatedItems.splice(index, 1);
        setItems(updatedItems);
    };

    // Handler to toggle the disabled status of a formula
    const handleToggleDisable = (index) => {
        setOutputs(prevOutputs =>
            prevOutputs.map((output, i) =>
                i === index ? { ...output, disabled: !output.disabled } : output
            )
        );
    };



    return (
        <Box sx={{ p: 4, margin: 'auto', mt: 5 }}>
            <Grid container spacing={4}>
                <Grid item xs={12} md={4}>
                    <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 2 }}>
                        Calculation
                    </Typography>
                    <Box sx={{ mb: 3 }}>
                        <Grid container spacing={2} alignItems="center">
                            <Grid item xs={3}>
                                <Typography variant="h6" component="label" htmlFor="calc-name" sx={{ mb: 1 }}>
                                    Calc Name
                                </Typography>
                            </Grid>
                            <Grid item xs={9}>
                                <TextField
                                    id="calc-name"
                                    label="Calc Name"
                                    type="text"
                                    variant="outlined"
                                    fullWidth
                                    value={calcName}
                                    onChange={(e) => setCalcName(e.target.value)}
                                    placeholder="Enter calculation name"
                                    disabled={isDisabled} // Disable when isDisabled is true
                                />
                            </Grid>
                        </Grid>
                    </Box>
                    <Box sx={{ mb: 3 }}>
                        <Grid container spacing={2} alignItems="center">
                            <Grid item xs={3}>
                                <Typography variant="h6" component="label" htmlFor="terminal-label" sx={{ mb: 1 }}>
                                    Terminal
                                </Typography>
                            </Grid>
                            <Grid item xs={9}>
                                <FormControl fullWidth>
                                    <InputLabel id="terminal-label">Terminal</InputLabel>
                                    <Select
                                        labelId="terminal-label"
                                        value={selectedTerminal}
                                        label="Terminal"
                                        onChange={(e) => setSelectedTerminal(e.target.value)}
                                        disabled={isDisabled} // Disable when isDisabled is true
                                    >
                                        {terminalData.map((terminal) => (
                                            <MenuItem key={terminal._id} value={terminal.DisplayName}>
                                                {terminal.DisplayName}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>
                    </Box>
                    <Box sx={{ mb: 3 }}>
                        <Grid container spacing={2} alignItems="center">
                            <Grid item xs={3}>
                                <Typography variant="h6" component="label" htmlFor="measurand-label" sx={{ mb: 1 }}>
                                    Measurand
                                </Typography>
                            </Grid>
                            <Grid item xs={9}>
                                <FormControl fullWidth>
                                    <InputLabel id="measurand-label">Measurand</InputLabel>
                                    <Select
                                        labelId="measurand-label"
                                        value={selectedMeasurand}
                                        label="Measurand"
                                        onChange={(e) => setSelectedMeasurand(e.target.value)}
                                        disabled={isDisabled} // Disable when isDisabled is true
                                    >
                                        {measurandData.map((measurand) => (
                                            <MenuItem key={measurand.MeasurandId} value={measurand.MeasurandName}>
                                                {measurand.MeasurandName}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>
                    </Box>
                </Grid>
                <Grid item xs={12} md={6} mx={18}>
                    <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', mb: 2 }}>
                        Input List
                    </Typography>
                    <TableContainer component={Paper}>
                        <Table aria-label="input list table">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Input Id</TableCell>
                                    <TableCell>Input Name</TableCell>
                                    <TableCell>Actions</TableCell> {/* Added Actions Header */}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {items.map((item, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{`I${index + 1}`}</TableCell>
                                        <TableCell>{`${item.terminal}.${item.measurand}`}</TableCell>
                                        <TableCell>
                                            <Button
                                                variant="outlined"
                                                color="error"
                                                onClick={() => handleRemoveItem(index)}
                                            >
                                                Remove
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Grid>
            </Grid>
            <Box sx={{ mt: 4, textAlign: 'center' }}>
                <Button
                    onClick={handleAddItem}
                    variant='contained'
                    sx={{
                        backgroundColor: '#007c87',
                        color: '#fff',
                        '&:hover': {
                            backgroundColor: '#007c87',
                        },
                        mr: 3,
                    }}
                    disabled={activeStep > 0 || !selectedTerminal || !selectedMeasurand}
                >
                    Add to Input List
                </Button>
                <Button
                    onClick={handleNextStep1}
                    variant="contained"
                    sx={{
                        backgroundColor: '#007c87',
                        color: '#fff',
                        '&:hover': {
                            backgroundColor: '#007c87',
                        },
                        mr: 3,
                    }}
                    disabled={completedSteps[0]}
                >
                    Next
                </Button>
                <Button
                    onClick={handleCancel}
                    variant="outlined"
                    sx={{
                        borderColor: '#007c87',
                        color: '#007c87',
                        '&:hover': {
                            borderColor: '#007c87',
                            backgroundColor: '#007c8710',
                        },
                    }}
                    disabled={isDisabled} // Optionally disable Cancel if desired
                >
                    Cancel
                </Button>
            </Box>
            {/* Step 2: Add Formulas */}
            {activeStep >= 1 && (
                <Box sx={{ mb: 3, mt: 5 }}>
                    <Grid container spacing={4} mt={5}>
                        <Grid item xs={12} md={4}>
                            <Box sx={{ mb: 3 }}>
                                <Grid container spacing={2} alignItems="center">
                                    <Grid item xs={3}>
                                        <Typography variant="h6" component="label" htmlFor="add-formula" sx={{ mb: 1 }}>
                                            Add Formula
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={9}>
                                        <TextField
                                            id="add-formula"
                                            label="Add Formula"
                                            type="text"
                                            variant="outlined"
                                            fullWidth
                                            value={addFormula}
                                            onChange={(e) => setAddFormula(e.target.value)}
                                            placeholder="Enter formula"
                                            disabled={isDisabled2}
                                        />
                                    </Grid>
                                </Grid>
                            </Box>
                            <Box sx={{ mb: 3 }}>
                                <Grid container spacing={2} alignItems="center">
                                    <Grid item xs={3}>
                                        <Typography variant="h6" component="label" htmlFor="output-name" sx={{ mb: 1 }}>
                                            Output Name
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={9}>
                                        <TextField
                                            id="output-name"
                                            label="Output Name"
                                            type="text"
                                            variant="outlined"
                                            fullWidth
                                            value={outputName}
                                            onChange={(e) => setOutputName(e.target.value)}
                                            placeholder="Enter output name"
                                            disabled={isDisabled2}
                                        />
                                    </Grid>
                                </Grid>
                            </Box>
                            <Box sx={{ mb: 3 }}>
                                <Grid container spacing={2} alignItems="center">
                                    <Grid item xs={3}>
                                        <Typography variant="h6" component="label" htmlFor="terminal-label" sx={{ mb: 1 }}>
                                            Terminal
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={9}>
                                        <FormControl fullWidth>
                                            <InputLabel id="terminal-label">Terminal</InputLabel>
                                            <Select
                                                labelId="terminal-label"
                                                value={terminal}
                                                label="Terminal"
                                                onChange={(e) => setTerminal(e.target.value)}
                                                disabled={isDisabled2}
                                            >
                                                {terminalData.map((terminal) => (
                                                    <MenuItem key={terminal._id} value={terminal.DisplayName}>
                                                        {terminal.DisplayName}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                </Grid>
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={6} mx={18}>
                            <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', mb: 2 }}>
                                Formula List
                            </Typography>
                            <TableContainer component={Paper}>
                                <Table aria-label="formula list table">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Extended Measurand ID</TableCell>
                                            <TableCell>Formula</TableCell>
                                            <TableCell>Extended Measurand Name</TableCell>
                                            <TableCell>Status</TableCell> {/* Updated Header */}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {outputs.map((output, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{index + 1001}</TableCell>
                                                <TableCell>{output.formula}</TableCell>
                                                <TableCell>{output.outputName}</TableCell>
                                                <TableCell>
                                                    <Switch
                                                        checked={!output.disabled}
                                                        onChange={() => handleToggleDisable(index)}
                                                        color="primary"
                                                        inputProps={{ 'aria-label': 'Enable/Disable Formula' }}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Grid>
                    </Grid>
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 5, mt: 5 }}>
                        <Button
                            variant='contained'
                            onClick={handleAddFormula}
                            sx={{
                                backgroundColor: '#007c87',
                                color: '#fff',
                                '&:hover': {
                                    backgroundColor: '#005f6b',
                                },
                            }}
                            disabled={activeStep !== 1 || !addFormula || !outputName}

                        >
                            Add to Formula List
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleNextStep2}
                            sx={{
                                backgroundColor: '#007c87',
                                color: '#fff',
                                '&:hover': {
                                    backgroundColor: '#005f6b',
                                },
                            }}
                            disabled={completedSteps[1]}
                        >
                            Next
                        </Button>
                        <Button
                            variant="outlined"
                            color="success"
                            onClick={handleFormulaCancel}
                            sx={{
                                borderColor: '#007c87',
                                color: '#007c87',
                                '&:hover': {
                                    borderColor: '#005f6b',
                                    backgroundColor: '#007c8710',
                                },
                            }}

                        >
                            Cancel
                        </Button>
                    </Box>
                </Box>
            )}
            {/* Step 3: Additional Settings */}
            {activeStep >= 2 && (
                <Box sx={{ mb: 3, mt: 5 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <Box sx={{ mb: 3 }}>
                                <Grid container spacing={2} alignItems="center">
                                    <Grid item xs={2}>
                                        <Typography variant="h6" component="label" htmlFor="calculation-type">
                                            Calculation Type
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <FormControl fullWidth>
                                            <InputLabel id="calculation-type-label">Calculation Type</InputLabel>
                                            <Select
                                                labelId="calculation-type-label"
                                                id="calculation-type"
                                                value={calculationType}
                                                label="Calculation Type"
                                                onChange={(e) => setCalculationType(e.target.value)}
                                            >
                                                <MenuItem value="single">Single</MenuItem>
                                                <MenuItem value="stream">Stream</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                </Grid>
                            </Box>
                            <Box sx={{ mb: 3 }}>
                                <Grid container spacing={2} alignItems="center">
                                    <Grid item xs={2}>
                                        <Typography variant="h6" component="label" htmlFor="reset-interval">
                                            Reset Interval
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <TextField
                                            id="reset-interval"
                                            label="Reset Interval"
                                            type="number"
                                            variant="outlined"
                                            fullWidth
                                            value={resetInterval}
                                            onChange={(e) => setResetInterval(e.target.value)}
                                            placeholder="Enter reset interval"

                                        />
                                    </Grid>
                                </Grid>
                            </Box>
                            <Box sx={{ mb: 3 }}>
                                <Grid container spacing={2} alignItems="center">
                                    <Grid item xs={2}>
                                        <Typography variant="h6" component="label" htmlFor="sub-interval">
                                            Sub Interval
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <TextField
                                            id="sub-interval"
                                            label="Sub Interval"
                                            type="number"
                                            variant="outlined"
                                            fullWidth
                                            value={subInterval}
                                            onChange={(e) => setSubInterval(e.target.value)}
                                            placeholder="Enter sub interval"

                                        />
                                    </Grid>
                                </Grid>
                            </Box>
                            <Box sx={{ mb: 3 }}>
                                <Grid container spacing={2} alignItems="center">
                                    <Grid item xs={2}>
                                        <Typography variant="h6" component="label" htmlFor="delay">
                                            Delay
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <TextField
                                            id="delay"
                                            label="delay"
                                            type="number"
                                            variant="outlined"
                                            fullWidth
                                            value={delay}
                                            onChange={(e) => setDelay(e.target.value)}
                                            placeholder="Enter delay"

                                        />
                                    </Grid>
                                </Grid>
                            </Box>
                        </Grid>
                    </Grid>
                    {/* Buttons: Add Formula */}
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 5, mt: 4 }}>
                        <Button
                            variant="contained"
                            onClick={handleNextStep3}
                            sx={{
                                backgroundColor: '#007c87',
                                color: '#fff',
                                '&:hover': {
                                    backgroundColor: '#005f6b',
                                },
                            }}
                            disabled={activeStep !== 2 || !calculationType || !resetInterval || !subInterval || !delay}
                        >
                            Next
                        </Button>
                        <Button
                            variant="outlined"
                            color="success"
                            onClick={handlesettingsCancel}
                            sx={{
                                borderColor: '#007c87',
                                color: '#007c87',
                                '&:hover': {
                                    borderColor: '#005f6b',
                                    backgroundColor: '#007c8710',
                                },
                            }}

                        >
                            Cancel
                        </Button>
                    </Box>
                </Box>
            )}
        </Box>
    );
}

export default Calc;












