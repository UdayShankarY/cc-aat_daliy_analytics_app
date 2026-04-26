import mongoose, { Schema } from "mongoose";
const EntrySchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: ["expense", "sleep", "study", "exercise"], required: true, index: true },
    amount: { type: Number, required: true },
    category: { type: String, default: null },
    note: { type: String, default: null },
    entryDate: { type: String, required: true, index: true }, // yyyy-MM-dd
}, { timestamps: true });
EntrySchema.index({ userId: 1, entryDate: -1 });
export const EntryModel = mongoose.models.Entry ?? mongoose.model("Entry", EntrySchema);
