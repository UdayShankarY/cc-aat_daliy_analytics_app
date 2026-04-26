import mongoose, { Schema } from "mongoose";
const UserSchema = new Schema({
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
}, { timestamps: true });
export const UserModel = mongoose.models.User ?? mongoose.model("User", UserSchema);
