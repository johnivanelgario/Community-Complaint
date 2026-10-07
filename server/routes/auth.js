import { Router } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import addLog from "../utils/logger.js";
import { protect } from "../middleware/auth.js";

const router = Router();

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

const strip = (user) => {
  const clean = user.toJSON();
  delete clean.password;
  return clean;
};

router.post("/register", async (req, res, next) => {
  try {
    const { firstName, lastName, email, phone, studentId, course, password } = req.body;
    if (!firstName || !lastName || !email || !studentId || !password) {
      return res.status(400).json({ message: "Fill in all required fields" });
    }
    if (await User.findOne({ email })) {
      return res.status(400).json({ message: "That email is already registered" });
    }
    if (await User.findOne({ studentId })) {
      return res.status(400).json({ message: "That student ID already has an account" });
    }

    const user = await User.create({ firstName, lastName, email, phone, studentId, course, password });
    await addLog(user._id, `${user.fullName} created a student account`, "auth");
    res.status(201).json({ token: signToken(user._id), user: strip(user) });
  } catch (err) {
    next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password, role } = req.body;
    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Wrong email or password" });
    }
    if (role && user.role !== role) {
      return res.status(403).json({
        message: role === "admin" ? "This account isn't an admin account" : "This account isn't a student account"
      });
    }
    if (user.status !== "active") {
      return res.status(403).json({ message: "Your account is inactive, contact the admin" });
    }
    user.lastLogin = new Date();
    await user.save();
    await addLog(user._id, `${user.fullName} logged in as ${user.role}`, "auth");
    res.json({ token: signToken(user._id), user: strip(user) });
  } catch (err) {
    next(err);
  }
});

router.post("/logout", protect, async (req, res) => {
  await addLog(req.user._id, `${req.user.fullName} logged out`, "auth");
  res.json({ message: "Logged out" });
});

router.get("/me", protect, (req, res) => res.json(req.user));

router.put("/me", protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("+password");
    const { firstName, lastName, phone, course, password } = req.body;
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone !== undefined) user.phone = phone;
    if (course !== undefined) user.course = course;
    if (password) user.password = password;
    await user.save();
    await addLog(user._id, `${user.fullName} updated their profile`, "user");
    res.json(strip(user));
  } catch (err) {
    next(err);
  }
});

export default router;
