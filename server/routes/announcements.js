import { Router } from "express";
import Announcement from "../models/Announcement.js";
import addLog from "../utils/logger.js";
import { protect, adminOnly } from "../middleware/auth.js";

const router = Router();
router.use(protect);

router.get("/", async (req, res, next) => {
  try {
    const limit = Number(req.query.limit) || 50;
    const items = await Announcement.find()
      .populate("createdBy", "firstName lastName")
      .sort({ pinned: -1, createdAt: -1 })
      .limit(limit);
    res.json(items);
  } catch (err) {
    next(err);
  }
});

router.post("/", adminOnly, async (req, res, next) => {
  try {
    const { title, body, pinned } = req.body;
    if (!title || !body) return res.status(400).json({ message: "Title and message are required" });
    const item = await Announcement.create({ title, body, pinned: !!pinned, createdBy: req.user._id });
    await addLog(req.user._id, `Posted announcement: ${title}`, "announcement");
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
});

router.put("/:id", adminOnly, async (req, res, next) => {
  try {
    const item = await Announcement.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Announcement not found" });
    const { title, body, pinned } = req.body;
    if (title !== undefined) item.title = title;
    if (body !== undefined) item.body = body;
    if (pinned !== undefined) item.pinned = !!pinned;
    await item.save();
    await addLog(req.user._id, `Updated announcement: ${item.title}`, "announcement");
    res.json(item);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", adminOnly, async (req, res, next) => {
  try {
    const item = await Announcement.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: "Announcement not found" });
    await addLog(req.user._id, `Removed announcement: ${item.title}`, "announcement");
    res.json({ message: "Announcement removed" });
  } catch (err) {
    next(err);
  }
});

export default router;
