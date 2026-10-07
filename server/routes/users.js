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
