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

userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.set("toJSON", { virtuals: true });

export default mongoose.model("User", userSchema);
