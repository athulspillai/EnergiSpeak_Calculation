import mongoose from "mongoose";

const cdNutsSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,  // Using ObjectId as _id
    TimestampId: { type: Date, required: true },  // This will hold the date
    TerminalId: { type: Number, required: true },  // Terminal ID
    Data: {  // Subdocument schema for data
        Avg_VLN: { type: Number },
        Avg_VLL: { type: Number },
        Avg_I: { type: Number },
        Vr: { type: Number },
        Vy: { type: Number },
        Vb: { type: Number },
        Vry: { type: Number },
        Vyb: { type: Number },
        Vbr: { type: Number },
        Ir: { type: Number },
        Iy: { type: Number },
        Ib: { type: Number },
        kW: { type: Number },
        kVAR: { type: Number },
        kVA: { type: Number },
        PF: { type: Number },
        Hz: { type: Number },
        kVA_Demand: { type: Number },
        kVA_Max_Demand: { type: Number },
        kW_Demand: { type: Number },
        kW_Max_Demand: { type: Number },
        kW_R: { type: Number },
        kW_Y: { type: Number },
        kW_B: { type: Number },
        kVA_R: { type: Number },
        kVA_Y: { type: Number },
        kVA_B: { type: Number },
        kVAR_R: { type: Number },
        kVAR_Y: { type: Number },
        kVAR_B: { type: Number },
        PF_R: { type: Number },
        PF_Y: { type: Number },
        PF_B: { type: Number },
        "Temp(F)": { type: Number },
        CB_Avg_Hz: { type: Number },
        CB_Avg_kW: { type: Number },
        CB_kWH_Exp: { type: Number },
        CB_kWH_Imp: { type: Number },
        LB_Avg_Hz: { type: Number },
        LB_Avg_kW: { type: Number },
        LB_kWH_Exp: { type: Number },
        LB_kWH_Imp: { type: Number },
        LB2_Avg_Hz: { type: Number },
        LB2_Avg_kW: { type: Number },
        LB2_kWH_Exp: { type: Number },
        LB2_kWH_Imp: { type: Number },
        LB3_Avg_Hz: { type: Number },
        LB3_Avg_kW: { type: Number },
        LB3_kWH_Exp: { type: Number },
        LB3_kWH_Imp: { type: Number },
        LB4_Avg_Hz: { type: Number },
        LB4_Avg_kW: { type: Number },
        LB4_kWH_Exp: { type: Number },
        LB4_kWH_Imp: { type: Number }
    },
    MeasurandData: [
        {
            MeasurandId: {
                type: Number,
                required: true,
                unique: true
            },
            MeasurandName: {
                type: String,
                required: true
            },
            MeasurandValue: {
                type: String,
                required: true
            },
        }
    ]

});

const CDNuts = mongoose.model('CDNuts', cdNutsSchema);

export default CDNuts