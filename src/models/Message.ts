import mongoose, { Schema, model, models } from "mongoose";

export type MessageDocument = {
  _id: mongoose.Types.ObjectId;
  conversation: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  text: string;
  seenAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

const MessageSchema = new Schema<MessageDocument>(
  {
    conversation: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: { type: String, required: true, trim: true, maxlength: 2000 },
    seenAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const Message =
  models.Message || model<MessageDocument>("Message", MessageSchema);

export default Message;