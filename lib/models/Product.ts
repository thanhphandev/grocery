import mongoose, { type Document, Schema } from "mongoose";

export interface IProduct extends Document {
  barcode?: string;
  name: string;
  search_slug: string;
  prices: {
    retail: number;
    wholesale: number;
  };
  unit: string;
  location?: string;
  image?: string;
  updatedAt: number;
}

const ProductSchema = new Schema<IProduct>(
  {
    barcode: {
      type: String,
      sparse: true,
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
      retail: { type: Number, required: true, index: true },
      wholesale: { type: Number, required: true },
    },
    unit: {
      type: String,
      required: true,
      default: "Cái",
    },
    location: {
      type: String,
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
  },
);

// Compound text index for blazing-fast full-text search
ProductSchema.index({ search_slug: "text" });

// Compound index for sort queries
ProductSchema.index({ "prices.retail": 1, updatedAt: -1 });
ProductSchema.index({ name: 1, updatedAt: -1 });

export const ProductModel: mongoose.Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);
