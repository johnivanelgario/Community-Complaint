import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "./models/User.js";

dotenv.config();

const [email, password, firstName = "School", lastName = "Admin"] = process.argv.slice(2);

if (!email) {
  console.log("Usage: npm run make-admin -- <email> <password> [firstName] [lastName]");
  console.log("If the email already has an account, it gets promoted to admin.");
  process.exit(1);
}

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

  if (user) {
    user.role = "admin";
    user.status = "active";
    if (password) user.password = password;
    await user.save();
    console.log(`${user.fullName} (${user.email}) is now an admin`);
  } else {
    if (!password || password.length < 6) {
      console.log("New admins need a password with at least 6 characters");
      await mongoose.disconnect();
      process.exit(1);
    }
    await User.create({ firstName, lastName, email, password, role: "admin" });
    console.log(`Admin created -> ${email} / ${password}`);
  }

  await mongoose.disconnect();
};

run().catch(async (err) => {
  console.error(err.message);
  await mongoose.disconnect();
  process.exit(1);
});
