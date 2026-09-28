import mongoose, { Schema, model, models } from "mongoose";

export type UserDocument = {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  college: string;
  profileImage?: string;
  firebaseUid: string;
  createdAt: Date;
  updatedAt: Date;
};

const UserSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    college: { type: String, required: true, trim: true },
    profileImage: { type: String, default: "" },
    firebaseUid: { type: String, required: true, unique: true, index: true },
  },
  { timestamps: true }
);

const User = models.User || model<UserDocument>("User", UserSchema);

export default User;