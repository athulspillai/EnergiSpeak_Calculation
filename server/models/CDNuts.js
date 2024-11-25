import mongoose from "mongoose";

const cdNutsSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId, 
    Timestamp: { type: Date, required: true },
    TimestampId: { type: Number, required: true },
    TerminalId: { type: Number, required: true },
    TerminalName: { type: String, required: true },
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
    ],
}, { collection: 'CDNuts' });

const CDNuts = mongoose.model('CDNuts', cdNutsSchema);

export default CDNuts