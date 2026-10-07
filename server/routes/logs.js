import { Router } from "express";
import Log from "../models/Log.js";
import { protect, adminOnly } from "../middleware/auth.js";

const router = Router();

router.get("/", protect, adminOnly, async (req, res, next) => {
  try {
    const { type, limit = 200 } = req.query;
    const logs = await Log.find(type ? { type } : {})
      .populate("user", "firstName lastName role")
      .sort({ createdAt: -1 })
      .limit(Number(limit));
    res.json(logs);
  } catch (err) {
    next(err);
  }
});

export default router;
