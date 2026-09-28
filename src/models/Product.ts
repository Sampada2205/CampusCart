import mongoose, { Schema, model, models } from "mongoose";

export const PRODUCT_CATEGORIES = [
  "Books",
  "Notes",
  "Electronics",
  "Gadgets",
  "Stationery",
  "Other",
] as const;

export const PRODUCT_CONDITIONS = [
  "New",
  "Like New",
  "Good",
  "Used",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];
export type ProductCondition = (typeof PRODUCT_CONDITIONS)[number];

export type ProductDocument = {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  price: number;
  category: ProductCategory;
  condition: ProductCondition;
  images: string[];
  seller: mongoose.Types.ObjectId;
  college: string;
  location: string;
  status: "available" | "sold";
  createdAt: Date;
  updatedAt: Date;
};

const ProductSchema = new Schema<ProductDocument>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    category: {
      type: String,
      required: true,
      enum: PRODUCT_CATEGORIES,
    },
    condition: {
      type: String,
      required: true,
      enum: PRODUCT_CONDITIONS,
    },
    images: { type: [String], default: [] },
    seller: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    college: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["available", "sold"],
      default: "available",
    },
  },
  { timestamps: true }
);

const Product = models.Product || model<ProductDocument>("Product", ProductSchema);

export default Product;