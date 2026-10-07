import mongoose from "mongoose";

const historySchema = new mongoose.Schema(
  {
    action: { type: String, required: true },
    by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    at: { type: Date, default: Date.now }
  },
  { _id: false }
);

const complaintSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ["Facilities", "Classroom", "Cleanliness", "Internet", "Canteen", "Safety", "Faculty", "Other"],
      default: "Other"
    },
    description: { type: String, required: true },
    location: { type: String, default: "" },
    photo: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "in progress", "resolved", "rejected"],
      default: "pending"
    },
    priority: { type: String, enum: ["low", "normal", "urgent"], default: "normal" },
    assignedTo: { type: String, default: "" },
    adminReply: { type: String, default: "" },
    internalNote: { type: String, default: "" },
    history: { type: [historySchema], default: [] },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

export default mongoose.model("Complaint", complaintSchema);
