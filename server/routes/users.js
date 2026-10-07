import { Router } from "express";
import User from "../models/User.js";
import addLog from "../utils/logger.js";
import { protect, adminOnly } from "../middleware/auth.js";

const router = Router();
router.use(protect, adminOnly);

router.get("/", async (req, res, next) => {
  try {
    const { search = "" } = req.query;
    const rx = new RegExp(search, "i");
    const users = await User.find(
      search ? { $or: [{ firstName: rx }, { lastName: rx }, { email: rx }, { studentId: rx }] } : {}
    ).sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const exists = await User.findOne({ email: req.body.email });
    if (exists) return res.status(400).json({ message: "That email is already registered" });
    const user = await User.create(req.body);
    await addLog(req.user._id, `Added user ${user.fullName}`, "user");
    const clean = user.toJSON();
    delete clean.password;
    res.status(201).json(clean);
  } catch (err) {
    next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("+password");
    if (!user) return res.status(404).json({ message: "User not found" });
    ["firstName", "lastName", "email", "phone", "studentId", "course", "role", "status"].forEach((f) => {
      if (req.body[f] !== undefined) user[f] = req.body[f];
    });
    if (req.body.password) user.password = req.body.password;
    await user.save();
    await addLog(req.user._id, `Updated user ${user.fullName}`, "user");
    const clean = user.toJSON();
    delete clean.password;
    res.json(clean);
  } catch (err) {
    next(err);
  }
});

const BAN_DAYS = [1, 3, 7, 30];

router.post("/:id/ban", async (req, res, next) => {
  try {
    const { type, days, reason } = req.body;
    if (req.params.id === String(req.user._id)) {
      return res.status(400).json({ message: "You can't ban your own account" });
    }
    if (!["temporary", "permanent"].includes(type)) {
      return res.status(400).json({ message: "Pick a suspension or a permanent ban" });
    }
    if (type === "temporary" && !BAN_DAYS.includes(Number(days))) {
      return res.status(400).json({ message: "Pick how long the suspension lasts" });
    }
    if (!reason || !reason.trim()) {
      return res.status(400).json({ message: "Write a reason so the student knows why" });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role === "admin") {
      return res.status(400).json({ message: "Admins can't be banned. Change their role first." });
    }

    user.ban = {
      type,
      reason: reason.trim(),
      until: type === "temporary" ? new Date(Date.now() + Number(days) * 24 * 60 * 60 * 1000) : undefined,
      at: new Date(),
      by: req.user._id
    };
    await user.save();

    const what = type === "permanent" ? "Permanently banned" : `Suspended for ${days} day${Number(days) > 1 ? "s" : ""}`;
    await addLog(req.user._id, `${what}: ${user.fullName} (${user.ban.reason})`, "user");
    res.json(user);
  } catch (err) {
    next(err);
  }
});

router.post("/:id/unban", async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.ban = { type: "none" };
    await user.save();
    await addLog(req.user._id, `Lifted the ban on ${user.fullName}`, "user");
    res.json(user);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    if (req.params.id === String(req.user._id)) {
      return res.status(400).json({ message: "You can't delete your own account" });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    await addLog(req.user._id, `Deleted user ${user.fullName}`, "user");
    res.json({ message: "User deleted" });
  } catch (err) {
    next(err);
  }
});

export default router;
