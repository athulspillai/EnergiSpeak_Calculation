import mongoose from "mongoose";

const esCalcSchema = new mongoose.Schema({
    CalculationId: {
        type: String,
        required: true
    },
    CalculationName: {
        type: String,
        required: true
    },
    InputList: [
        {
            InputId: {
                type: String,
                required: true
            },
            TerminalId: {
                type: Number,  // Storing TerminalId as a number
                required: true
            },
            MeasurandId: {
                type: Number,  // Storing MeasurandId as a number
                required: true
            },
            MeasurandName: {
                type: String,  // Storing MeasurandName as a string
            },
            MeasurandValue: {
                type: String,  // Storing MeasurandValue as a string
                
            }
        }
    ],
    OutputList: [
        {
            MeasurandId : {
                type: Number,
                required: true
            },
            Formula: {
                type: String,  // Storing formula as a string
                required: true
            },
            MeasurandName: {
                type: String,  // Storing output name as a string
                required: true
            },
            TerminalId: {
                type: Number,  // Storing TerminalId as a number
                required: true
            },
        }
    ],
    CalculationType: {
        type: String,
    },
    ResetInterval: {
        type: Number,  // Change to Number
    },
    SubInterval: {
        type: Number,  // Change to Number
    },
    Delay: {
        type: Number,  // Change to Number
    },
});

const ESCalc = mongoose.model('ESCalc', esCalcSchema);

export default ESCalc;

