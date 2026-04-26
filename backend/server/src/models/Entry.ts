import mongoose, { Schema, type InferSchemaType } from "mongoose";

export type EntryType = "expense" | "sleep" | "study" | "exercise";

const EntrySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: ["expense", "sleep", "study", "exercise"], required: true, index: true },
    amount: { type: Number, required: true },
    category: { type: String, default: null },
    note: { type: String, default: null },
    entryDate: { type: String, required: true, index: true }, // yyyy-MM-dd
  },
  { timestamps: true }
);

EntrySchema.index({ userId: 1, entryDate: -1 });

export type EntryDoc = InferSchemaType<typeof EntrySchema> & { _id: mongoose.Types.ObjectId };

export const EntryModel =
  (mongoose.models.Entry as mongoose.Model<EntryDoc> | undefined) ?? mongoose.model<EntryDoc>("Entry", EntrySchema);

