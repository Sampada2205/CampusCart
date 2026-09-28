import mongoose, { Schema, model, models } from "mongoose";

export type ConversationDocument = {
  _id: mongoose.Types.ObjectId;
  participants: mongoose.Types.ObjectId[];
  product: mongoose.Types.ObjectId;
  lastMessage?: string;
  lastMessageAt?: Date;
  // Unread counts keyed by userId string
  unreadCount: Map<string, number>;
  createdAt: Date;
  updatedAt: Date;
};

const ConversationSchema = new Schema<ConversationDocument>(
  {
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },
    ],
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    lastMessage: { type: String, default: "" },
    lastMessageAt: { type: Date, default: Date.now },
    unreadCount: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  { timestamps: true }
);

ConversationSchema.index({ participants: 1, product: 1 }, { unique: true });

const Conversation =
  models.Conversation ||
  model<ConversationDocument>("Conversation", ConversationSchema);

export default Conversation;