import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  addLeave,
  getPendingLeaves,
  getApprovedLeaves,
  deleteLeave,
  updateLeave,
} from "../../controllers/student/LeaveController.js";
import { authenticate } from "../../middlewares/auth.js";

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "uploads/leaves/";
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true }); // Ensure directory exists
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "application/pdf", // PDF files
    "application/msword", // DOC files
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // DOCX files
    "image/jpeg", // JPEG files
    "image/png", // PNG files
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true); // Accept the file
  } else {
    cb(new Error("❌ Invalid file type! Allowed formats: PNG, JPG, PDF, DOC, DOCX"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

const router = express.Router();

// Add Leave
router.post("/add-leave", upload.single("document"), authenticate, addLeave);

// Delete Leave
router.delete("/delete-leave/:leaveId", authenticate, deleteLeave);

// Get Pending Leaves
router.get("/pending-leaves", authenticate, getPendingLeaves);

// Get Approved Leaves
router.get("/fetch-leaves", authenticate, getApprovedLeaves);

// Update Leave
router.patch("/update-leave/:leaveId", upload.single("document"), authenticate, updateLeave);

export default router;