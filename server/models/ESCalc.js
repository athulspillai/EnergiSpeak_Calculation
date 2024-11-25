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
                type: Number,
                required: true
            },
            MeasurandId: {
                type: Number,
                required: true
            },
            MeasurandName: {
                type: String,
            },
        }
    ],
    OutputList: [
        {
            MeasurandId : {
                type: Number,
                required: true
            },
            Formula: {
                type: String,  
                required: true
            },
            MeasurandName: {
                type: String, 
                required: true
            },
            TerminalId: {
                type: Number,
                required: true
            },
        }
    ],
    CalculationType: {
        type: String,
    },
    ResetInterval: {
        type: Number,
    },
    SubInterval: {
        type: Number,
    },
    Delay: {
        type: Number, 
    },
}, { collection: 'ESCalc' });

const ESCalc = mongoose.model('ESCalc', esCalcSchema);

export default ESCalc;

