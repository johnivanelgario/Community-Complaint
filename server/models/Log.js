import mongoose from "mongoose";

const logSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    action: { type: String, required: true },
    type: { type: String, enum: ["auth", "user", "complaint", "announcement", "system"], default: "system" }
  },
  { timestamps: true }
);

export default mongoose.model("Log", logSchema);
