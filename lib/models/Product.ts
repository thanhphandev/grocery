import mongoose, { Schema, type Document } from "mongoose";

export interface IProduct extends Document {
    barcode: string;
    name: string;
    search_slug: string;
    prices: {
        retail: number;
        wholesale: number;
    };
    unit: string;
    location: string;
    image?: string;
    updatedAt: number;
}

const ProductSchema = new Schema<IProduct>(
    {
        barcode: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        name: {
            type: String,
            required: true,
        },
        search_slug: {
            type: String,
            required: true,
            index: true,
        },
        prices: {
            retail: { type: Number, required: true },
            wholesale: { type: Number, required: true },
        },
        unit: {
            type: String,
            required: true,
            default: "Cái",
        },
        location: {
            type: String,
            default: "Chưa xác định",
        },
        image: String,
        updatedAt: {
            type: Number,
            default: () => Date.now(),
            index: true,
        },
    },
    {
        timestamps: false,
        versionKey: false,
    }
);

// Search slug text index for faster search

export const ProductModel: mongoose.Model<IProduct> =
    mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);
