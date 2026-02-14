import mongoose, { Schema, type Document } from "mongoose";

export interface IHistory extends Document {
    productId: string;
    barcode?: string;
    productName: string;
    retailPrice: number;
    timestamp: number;
}

const HistorySchema = new Schema<IHistory>(
    {
        productId: { type: String, required: true, index: true },
        barcode: { type: String },
        productName: { type: String, required: true },
        retailPrice: { type: Number, required: true },
        timestamp: { type: Number, default: () => Date.now(), index: true },
    },
    { timestamps: false, versionKey: false }
);

export const HistoryModel: mongoose.Model<IHistory> =
    mongoose.models.History || mongoose.model<IHistory>("History", HistorySchema);
