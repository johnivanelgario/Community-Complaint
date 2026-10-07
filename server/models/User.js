import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, default: "" },
    studentId: { type: String, trim: true, default: "" },
    course: { type: String, trim: true, default: "" },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ["admin", "student"], default: "student" },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    ban: {
      type: { type: String, enum: ["none", "temporary", "permanent"], default: "none" },
      reason: { type: String, default: "" },
      until: Date,
      at: Date,
      by: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
    },
    lastLogin: Date
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.matchPassword = function (entered) {
  return bcrypt.compare(entered, this.password);
};

userSchema.methods.activeBan = function () {
  const ban = this.ban;
  if (!ban || !ban.type || ban.type === "none") return null;
  if (ban.type === "temporary" && (!ban.until || ban.until <= new Date())) return null;
  return ban;
};

userSchema.methods.banMessage = function () {
  const ban = this.activeBan();
  if (!ban) return "";
  const why = ban.reason ? ` Reason: ${ban.reason}` : "";
  if (ban.type === "permanent") return `Your account has been banned.${why}`;
  const when = ban.until.toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
  return `Your account is suspended until ${when}.${why}`;
};

userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.set("toJSON", { virtuals: true });

export default mongoose.model("User", userSchema);
