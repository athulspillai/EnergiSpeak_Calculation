import mongoose from "mongoose";

// Main schema for ESTerminal
const esTerminalSchema = new mongoose.Schema({
    _id: { type: Number },
    Terminalid: { type: Number, required: true },
    TerminalName: { type: String, required: true },
    Description: { type: String, required: true },
    DisplayName: { type: String, required: true },
    DeviceId: { type: Number, required: true },
    BridgeId: { type: Number, required: true },
    AggregaterId: { type: Number, required: true },

    DeviceDetails: [{
        DeviceParameter: { type: String, required: true },
        DeviceValue: { type: String, required: true }
    }],
    
    BridgeDetails: [{
        BridgeParameter: { type: String, required: true },
        BridgeValue: { type: String, required: true }
    }],
    
    AggregaterDetails: [{
        AggregaterParameter: { type: String, required: true },
        AggregaterValue: { type: String, required: true }
    }],

    StapleList: [{
        StapleId: { type: Number, required: true },
        StapleName: { type: String, required: true },
        StapleValue: { type: String, required: true }
    }],
    
    MeasurandList: [{
        MeasurandId: { type: Number, required: true },
        MeasurandName: { type: String, required: true }
    }],
    
    ModQueryList: [{
        ModQueryId: { type: Number, required: true },
        ModQueryName: { type: String, required: true }
    }]
}, { timestamps: true });

// Model creation
const ESTerminal = mongoose.model('ESTerminal', esTerminalSchema);

export default ESTerminal;
