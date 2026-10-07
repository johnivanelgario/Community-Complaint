import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "./models/User.js";
import Complaint from "./models/Complaint.js";

dotenv.config();

const categories = ["Facilities", "Classroom", "Cleanliness", "Internet", "Canteen", "Safety", "Faculty", "Other"];

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const moved = await User.updateMany({ role: "user" }, { $set: { role: "student" } });
  if (moved.modifiedCount) console.log(`Switched ${moved.modifiedCount} old account(s) to student`);

  const fixed = await Complaint.updateMany({ category: { $nin: categories } }, { $set: { category: "Other" } });
  if (fixed.modifiedCount) console.log(`Moved ${fixed.modifiedCount} old complaint(s) to "Other"`);

  const older = await Complaint.updateMany(
    { priority: { $exists: false } },
    { $set: { priority: "normal", assignedTo: "", internalNote: "" } }
  );
  if (older.modifiedCount) console.log(`Added priority to ${older.modifiedCount} older complaint(s)`);

  const email = "admin@ccs.local";
  const exists = await User.findOne({ email });
  if (exists) {
    console.log("Admin already exists:", email);
  } else {
    await User.create({
      firstName: "Juan",
      lastName: "Dela Cruz",
      email,
      phone: "09123456789",
      password: "admin123",
      role: "admin"
    });
    console.log("Admin created ->", email, "/ admin123");
  }

  await mongoose.disconnect();
};

run();
