import { Router } from "express";
import User from "../models/User.js";
import Complaint from "../models/Complaint.js";
import Log from "../models/Log.js";
import { protect, adminOnly } from "../middleware/auth.js";

const router = Router();

const countBy = async (field, match = {}) => {
  const rows = await Complaint.aggregate([
    { $match: match },
    { $group: { _id: `$${field}`, count: { $sum: 1 } } }
  ]);
  return rows.reduce((acc, r) => ({ ...acc, [r._id]: r.count }), {});
};

router.get("/admin", protect, adminOnly, async (req, res, next) => {
  try {
    const since = new Date();
    since.setMonth(since.getMonth() - 5, 1);
    since.setHours(0, 0, 0, 0);

    const [users, activeUsers, totalComplaints, byStatus, byCategory, monthly, recentLogs, pending, urgent, byOffice, unassigned] =
      await Promise.all([
        User.countDocuments(),
        User.countDocuments({ status: "active" }),
        Complaint.countDocuments(),
        countBy("status"),
        countBy("category"),
        Complaint.aggregate([
          { $match: { createdAt: { $gte: since } } },
          {
            $group: {
              _id: { y: { $year: "$createdAt" }, m: { $month: "$createdAt" } },
              count: { $sum: 1 }
            }
          },
          { $sort: { "_id.y": 1, "_id.m": 1 } }
        ]),
        Log.find().populate("user", "firstName lastName").sort({ createdAt: -1 }).limit(6),
        Complaint.find({ status: "pending" })
          .populate("submittedBy", "firstName lastName")
          .sort({ priority: -1, createdAt: 1 })
          .limit(5),
        Complaint.countDocuments({ priority: "urgent", status: { $in: ["pending", "in progress"] } }),
        countBy("assignedTo", { assignedTo: { $ne: "" } }),
        Complaint.countDocuments({ assignedTo: "", status: { $in: ["pending", "in progress"] } })
      ]);

    res.json({
      users,
      activeUsers,
      totalComplaints,
      byStatus,
      byCategory,
      monthly,
      recentLogs,
      pending,
      urgent,
      byOffice,
      unassigned
    });
  } catch (err) {
    next(err);
  }
});

router.get("/me", protect, async (req, res, next) => {
  try {
    const byStatus = await countBy("status", { submittedBy: req.user._id });
    const total = Object.values(byStatus).reduce((a, b) => a + b, 0);
    res.json({ total, byStatus });
  } catch (err) {
    next(err);
  }
});

export default router;
