import { Router } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import User from "../models/User.js";
import EmailCode from "../models/EmailCode.js";
import sendMail from "../utils/mailer.js";
import addLog from "../utils/logger.js";
import { protect } from "../middleware/auth.js";

const router = Router();

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

const strip = (user) => {
  const clean = user.toJSON();
  delete clean.password;
  return clean;
};

const CODE_MINUTES = 10;
const RESEND_SECONDS = 60;
const MAX_TRIES = 5;

const checkSignup = async ({ firstName, lastName, email, studentId, password }) => {
  if (!firstName || !lastName || !email || !studentId || !password) return "Fill in all required fields";
  if (password.length < 6) return "Password needs at least 6 characters";
  if (await User.findOne({ email: email.toLowerCase() })) return "That email is already registered";
  if (await User.findOne({ studentId })) return "That student ID already has an account";
  return null;
};

router.post("/send-code", async (req, res, next) => {
  try {
    const problem = await checkSignup(req.body);
    if (problem) return res.status(400).json({ message: problem });

    const email = req.body.email.toLowerCase().trim();
    const existing = await EmailCode.findOne({ email });
    if (existing) {
      const wait = RESEND_SECONDS - Math.floor((Date.now() - existing.sentAt.getTime()) / 1000);
      if (wait > 0) return res.status(429).json({ message: `Wait ${wait}s before asking for a new code` });
    }

    const code = String(crypto.randomInt(100000, 1000000));
    await EmailCode.findOneAndUpdate(
      { email },
      {
        codeHash: await bcrypt.hash(code, 10),
        attempts: 0,
        sentAt: new Date(),
        expiresAt: new Date(Date.now() + CODE_MINUTES * 60 * 1000)
      },
      { upsert: true }
    );

    await sendMail({
      to: email,
      subject: `${code} is your verification code`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:420px">
          <h2 style="color:#1d4f91;margin:0 0 12px">Verify your email</h2>
          <p>Hi ${req.body.firstName}, use this code to finish creating your student account:</p>
          <p style="font-size:32px;font-weight:bold;letter-spacing:8px;margin:20px 0">${code}</p>
          <p style="color:#5e6b7a">It expires in ${CODE_MINUTES} minutes. If you didn't try to register, you can ignore this email.</p>
        </div>`
    });

    res.json({ message: "Code sent", seconds: RESEND_SECONDS });
  } catch (err) {
    next(err);
  }
});

router.post("/register", async (req, res, next) => {
  try {
    const { firstName, lastName, email, phone, studentId, course, password, code } = req.body;
    const problem = await checkSignup(req.body);
    if (problem) return res.status(400).json({ message: problem });

    const record = await EmailCode.findOne({ email: email.toLowerCase().trim() });
    if (!record || record.expiresAt < new Date()) {
      return res.status(400).json({ message: "Your code expired, send a new one" });
    }
    if (record.attempts >= MAX_TRIES) {
      return res.status(400).json({ message: "Too many wrong tries, send a new code" });
    }
    if (!code || !(await bcrypt.compare(String(code).trim(), record.codeHash))) {
      record.attempts += 1;
      await record.save();
      const left = MAX_TRIES - record.attempts;
      return res.status(400).json({
        message: left > 0 ? `Wrong code, ${left} ${left === 1 ? "try" : "tries"} left` : "Too many wrong tries, send a new code"
      });
    }

    const user = await User.create({ firstName, lastName, email, phone, studentId, course, password });
    await record.deleteOne();
    await addLog(user._id, `${user.fullName} verified their email and created a student account`, "auth");
    res.status(201).json({ user: strip(user) });
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
    if (user.activeBan()) {
      return res.status(403).json({ message: user.banMessage(), banned: true });
    }
    if (user.ban?.type && user.ban.type !== "none") {
      user.ban = { type: "none" };
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
