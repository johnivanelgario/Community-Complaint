import { Router } from "express";
import Complaint from "../models/Complaint.js";
import addLog from "../utils/logger.js";
import upload from "../middleware/upload.js";
import { protect, adminOnly } from "../middleware/auth.js";

const router = Router();
router.use(protect);

const hiddenFromStudents = "-internalNote";

router.get("/", async (req, res, next) => {
  try {
    const { status, priority, assignedTo, search = "" } = req.query;
    const isAdmin = req.user.role === "admin";
    const filter = {};
    if (!isAdmin) filter.submittedBy = req.user._id;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo === "none" ? "" : assignedTo;
    if (search) filter.title = new RegExp(search, "i");

    const complaints = await Complaint.find(filter)
      .select(isAdmin ? "" : hiddenFromStudents)
      .populate("submittedBy", "firstName lastName email studentId course")
      .sort({ createdAt: -1 });
    res.json(complaints);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const isAdmin = req.user.role === "admin";
    const complaint = await Complaint.findById(req.params.id)
      .select(isAdmin ? "" : hiddenFromStudents)
      .populate("submittedBy", "firstName lastName email phone studentId course")
      .populate("history.by", "firstName lastName role");
    if (!complaint) return res.status(404).json({ message: "Complaint not found" });
    const isOwner = String(complaint.submittedBy?._id) === String(req.user._id);
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: "You can only view your own complaints" });
    }
    res.json(complaint);
  } catch (err) {
    next(err);
  }
});

router.post("/", upload.single("photo"), async (req, res, next) => {
  try {
    const { title, category, description, location } = req.body;
    if (!title || !description) {
      return res.status(400).json({ message: "Title and description are required" });
    }
    const complaint = await Complaint.create({
      title,
      category,
      description,
      location,
      photo: req.file ? `/uploads/${req.file.filename}` : "",
      submittedBy: req.user._id,
      history: [{ action: "Complaint filed", by: req.user._id }]
    });
    await addLog(req.user._id, `${req.user.fullName} filed a complaint: ${title}`, "complaint");
    res.status(201).json(complaint);
  } catch (err) {
    next(err);
  }
});

router.put("/:id", adminOnly, async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: "Complaint not found" });

    const { status, priority, assignedTo, adminReply, internalNote } = req.body;
    const changes = [];

    if (status && status !== complaint.status) {
      complaint.status = status;
      changes.push(`Status changed to ${status}`);
    }
    if (priority && priority !== complaint.priority) {
      complaint.priority = priority;
      changes.push(`Priority set to ${priority}`);
    }
    if (assignedTo !== undefined && assignedTo !== complaint.assignedTo) {
      complaint.assignedTo = assignedTo;
      changes.push(assignedTo ? `Assigned to ${assignedTo}` : "Unassigned");
    }
    if (adminReply !== undefined && adminReply !== complaint.adminReply) {
      complaint.adminReply = adminReply;
      changes.push(adminReply ? "Admin replied" : "Reply removed");
    }
    if (internalNote !== undefined) complaint.internalNote = internalNote;

    changes.forEach((action) => complaint.history.push({ action, by: req.user._id }));
    await complaint.save();

    if (changes.length) {
      await addLog(req.user._id, `"${complaint.title}": ${changes.join(", ").toLowerCase()}`, "complaint");
    }

    const fresh = await Complaint.findById(complaint._id)
      .populate("submittedBy", "firstName lastName email phone studentId course")
      .populate("history.by", "firstName lastName role");
    res.json(fresh);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: "Complaint not found" });
    const isOwner = String(complaint.submittedBy) === String(req.user._id);
    if (req.user.role !== "admin" && !(isOwner && complaint.status === "pending")) {
      return res.status(403).json({ message: "Only pending complaints can be withdrawn" });
    }
    await complaint.deleteOne();
    await addLog(req.user._id, `Deleted complaint: ${complaint.title}`, "complaint");
    res.json({ message: "Complaint deleted" });
  } catch (err) {
    next(err);
  }
});

export default router;
