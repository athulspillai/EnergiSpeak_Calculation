
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

const InputField = ({ label, value, onChange, disabled }) => (
    <Grid container spacing={2} alignItems="center">
        <Grid item xs={3} mb={3}>
            <Typography variant="h6" component="label" sx={{ mb: 1 }}>
                {label}
            </Typography>
        </Grid>
        <Grid item xs={9} mb={3}>
            <TextField
                label={label}
                variant="outlined"
                fullWidth
                value={value}
                onChange={onChange}
                disabled={disabled}
            />
        </Grid>
    </Grid>
);

const SelectField = ({ label, value, onChange, options, disabled }) => (
    <Grid container spacing={2} alignItems="center">
        <Grid item xs={3}>
            <Typography variant="h6" component="label" sx={{ mb: 1 }}>
                {label}
            </Typography>
        </Grid>
        <Grid item xs={9} sx={{ mb: 3 }}>
            <FormControl fullWidth>
                <InputLabel>{label}</InputLabel>
                <Select
                    value={value}
                    onChange={onChange}
                    label={label}
                    disabled={disabled}
                >
                    {options.map((option) => (
                        <MenuItem key={option.id} value={option.value}>
                            {option.label}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        </Grid>
    </Grid>
);

const CustomButton = ({ onClick, label, disabled, variant = 'contained', color = 'primary', additionalStyles }) => (
    <Button
        onClick={onClick}
        variant={variant}
        color={color}
        disabled={disabled}
        sx={{
            backgroundColor: '#007c87',
            color: '#fff',
            '&:hover': {
                backgroundColor: '#005f6b',
            },
            ...additionalStyles,
            mr: 3,
        }}
    >
        {label}
    </Button>
);

const TransparentCustomButton = ({ onClick, label, disabled, variant = 'contained', color = '', additionalStyles }) => (
    <Button
        onClick={onClick}
        variant={variant}
        color={color}
        disabled={disabled}
        sx={{
            borderColor: '#007c87',
            color: '#007c87',
            '&:hover': {
                borderColor: '#005f6b',
                backgroundColor: '#007c8710',
            },
        }}
    >
        {label}
    </Button>
);

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
    const [completedSteps, setCompletedSteps] = useState({
        0: false,
        1: false,
        2: false,
    });

    useEffect(() => {
        const fetchTerminals = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_SERVER_URL}/esterminal`);
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
                        `${process.env.REACT_APP_SERVER_URL}/esterminal/${encodeURIComponent(selectedTerminal)}`
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
                if (exists) {
                    alert('This terminal and measurand combination already exists in the input list.');
                    return;
                }

                try {
                    const response = await axios.get(`${process.env.REACT_APP_SERVER_URL}/cdnuts/${terminal._id}`);
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

        // Validate the conditions
        if (subIntervalNum >= resetIntervalNum) {
            alert("Sub Interval must be less than Reset Interval.");
            return;
        }

        // If all validations pass, proceed to submit
        handleSubmit();

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
            const response = await axios.post(`${process.env.REACT_APP_SERVER_URL}/add-calc`, calculationData);
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
                    <InputField
                        label="Calc Name"
                        value={calcName}
                        onChange={(e) => setCalcName(e.target.value)}
                        disabled={isDisabled}
                    />
                    <SelectField
                        label="Terminal"
                        value={selectedTerminal}
                        onChange={(e) => setSelectedTerminal(e.target.value)}
                        options={terminalData.map(t => ({ id: t._id, value: t.DisplayName, label: t.DisplayName }))}
                        disabled={isDisabled}
                    />
                    <SelectField
                        label="Measurand"
                        value={selectedMeasurand}
                        onChange={(e) => setSelectedMeasurand(e.target.value)}
                        options={measurandData.map(m => ({ id: m.MeasurandId, value: m.MeasurandName, label: m.MeasurandName }))}
                        disabled={isDisabled}
                    />
                </Grid>
                <Grid item xs={12} md={6} mx={12}>
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
                                                disabled={isDisabled}
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
                <CustomButton
                    onClick={handleAddItem}
                    label="Add to Input List"
                    disabled={activeStep > 0 || !calcName || !selectedTerminal || !selectedMeasurand}
                />
                <CustomButton
                    onClick={handleNextStep1}
                    label="Next"
                    disabled={completedSteps[0]}
                />
                <TransparentCustomButton
                    variant="outlined"
                    color='success'
                    onClick={handleCancel}
                    label="Cancel"
                    disabled={isDisabled || !calcName}
                />
            </Box>
            {/* Step 2: Add Formulas */}
            {activeStep >= 1 && (
                <Box sx={{ mb: 3, mt: 5 }}>
                    <Grid container spacing={4} mt={5}>
                        <Grid item xs={12} md={4}>
                            <InputField
                                label="Add Formula"
                                value={addFormula}
                                onChange={(e) => setAddFormula(e.target.value)}
                                disabled={isDisabled2}
                            />
                            <InputField
                                label="Output Name"
                                value={outputName}
                                onChange={(e) => setOutputName(e.target.value)}
                                disabled={isDisabled2}
                            />
                            <SelectField
                                label="Terminal"
                                value={terminal}
                                onChange={(e) => setTerminal(e.target.value)}
                                options={terminalData.map(t => ({ id: t._id, value: t.DisplayName, label: t.DisplayName }))}
                                disabled={isDisabled2}
                            />
                        </Grid>
                        <Grid item xs={12} md={6} mx={12}>
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
                                                        disabled={isDisabled2}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Grid>
                    </Grid>
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
                        <CustomButton
                            variant='contained'
                            onClick={handleAddFormula}
                            label="Add to Formula List"
                            disabled={activeStep !== 1 || !addFormula || !outputName}
                        />
                        <CustomButton
                            variant="contained"
                            onClick={handleNextStep2}
                            label="Next"
                            disabled={completedSteps[1]}
                        />
                        <TransparentCustomButton
                            variant="outlined"
                            color="success"
                            onClick={handleFormulaCancel}
                            label="Cancel"
                        />
                    </Box>
                </Box>
            )}
            {/* Step 3: Additional Settings */}
            {activeStep >= 2 && (
                <Box sx={{ mb: 3, mt: 5 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <SelectField
                                label="Calculation Type"
                                value={calculationType}
                                onChange={(e) => setCalculationType(e.target.value)}
                                options={[{ value: 'single', label: 'Single' }, { value: 'stream', label: 'Stream' }]}
                            />
                            <InputField
                                label="Reset Interval"
                                value={resetInterval}
                                onChange={(e) => setResetInterval(e.target.value)}
                            />
                            <InputField
                                label="Sub Interval"
                                value={subInterval}
                                onChange={(e) => setSubInterval(e.target.value)}
                            />
                            <InputField
                                label="Delay"
                                value={delay}
                                onChange={(e) => setDelay(e.target.value)}
                            />
                        </Grid>
                    </Grid>
                    {/* Buttons: Add Formula */}
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                        <CustomButton
                            variant="contained"
                            onClick={handleNextStep3}
                            label="Submit"
                            disabled={activeStep !== 2 || !calculationType || !resetInterval || !subInterval || !delay}
                        />
                        <TransparentCustomButton
                            variant="outlined"
                            color="success"
                            onClick={handlesettingsCancel}
                            label="Cancel"
                        />
                    </Box>
                </Box>
            )}
        </Box>
    );
}

export default Calc;












