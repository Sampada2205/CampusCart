import mongoose, { Schema, model, models } from "mongoose";

export type OrderDocument = {
  _id: mongoose.Types.ObjectId;
  buyer: mongoose.Types.ObjectId;
  seller: mongoose.Types.ObjectId;
  product: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  status: "pending" | "paid" | "failed";
  stripeSessionId: string;
  stripePaymentIntentId?: string;
  createdAt: Date;
  updatedAt: Date;
};

const OrderSchema = new Schema<OrderDocument>(
  {
    buyer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    seller: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    amount: { type: Number, required: true },
    currency: { type: String, default: "inr" },
    status: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
      index: true,
    },
    stripeSessionId: { type: String, required: true, unique: true },
    stripePaymentIntentId: { type: String, default: "" },
  },
  { timestamps: true }
);

const Order = models.Order || model<OrderDocument>("Order", OrderSchema);

export default Order;