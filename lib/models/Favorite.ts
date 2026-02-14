import mongoose, { Schema, type Document } from "mongoose";

export interface IFavorite extends Document {
    productId: string;
    addedAt: number;
}

const FavoriteSchema = new Schema<IFavorite>(
    {
        productId: { type: String, required: true, unique: true, index: true },
        addedAt: { type: Number, default: () => Date.now() },
    },
    { timestamps: false, versionKey: false }
);

export const FavoriteModel: mongoose.Model<IFavorite> =
    mongoose.models.Favorite || mongoose.model<IFavorite>("Favorite", FavoriteSchema);
