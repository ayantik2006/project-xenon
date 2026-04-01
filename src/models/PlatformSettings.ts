import mongoose, { Schema, Document } from "mongoose";

export interface IPlatformSettings extends Document {
  key: string;
  hoardspaceCommissionPercent: number;
  razorpayPercent: number;
  gstPercent: number;
  createdAt: Date;
  updatedAt: Date;
}

const PlatformSettingsSchema = new Schema<IPlatformSettings>(
  {
    key: { type: String, required: true, unique: true, default: "default" },
    hoardspaceCommissionPercent: { type: Number, default: 0, min: 0 },
    razorpayPercent: { type: Number, default: 2.5, min: 0 },
    gstPercent: { type: Number, default: 2.5, min: 0 },
  },
  { timestamps: true },
);

if (process.env.NODE_ENV === "development") {
  delete mongoose.models.PlatformSettings;
}

const PlatformSettings =
  mongoose.models.PlatformSettings ||
  mongoose.model<IPlatformSettings>("PlatformSettings", PlatformSettingsSchema);

export default PlatformSettings;
