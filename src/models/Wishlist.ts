import mongoose, { Schema, model, models } from "mongoose";

export type WishlistDocument = {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  product: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

const WishlistSchema = new Schema<WishlistDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

// Prevent duplicate wishlist entries for the same user + product pair
WishlistSchema.index({ user: 1, product: 1 }, { unique: true });

const Wishlist = models.Wishlist || model<WishlistDocument>("Wishlist", WishlistSchema);

export default Wishlist;