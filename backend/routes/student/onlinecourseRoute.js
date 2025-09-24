import express from "express";
import {
  addOnlineCourse,
  updateOnlineCourse,
  deleteOnlineCourse,
  getPendingOnlineCourses,
  getApprovedCourses,
} from "../../controllers/student/onlinecoursesController.js";
import { authenticate } from "../../middlewares/auth.js";
import multer from "multer";
import path from "path"; // Import the path module
import fs from "fs";

// Multer configuration for file uploads (certificates)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "uploads/certificates/";
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true }); // Ensure directory exists
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase(); // Use path.extname
    cb(null, "certificate-" + uniqueSuffix + ext);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "application/pdf", // PDF files
    "image/jpeg", // JPEG files
    "image/png", // PNG files
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true); // Accept the file
  } else {
    cb(new Error("❌ Invalid file type! Allowed formats: PNG, JPG, PDF"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

const router = express.Router();

// Add Online Course
router.post("/add-course", upload.single("certificate"), authenticate, addOnlineCourse);

// Update Online Course
router.patch("/update-course/:courseId", upload.single("certificate"), authenticate, updateOnlineCourse);

// Delete Online Course
router.delete("/delete-course/:courseId", authenticate, deleteOnlineCourse);

// Get Pending Courses
router.get("/pending-online-courses", authenticate, getPendingOnlineCourses);

// Get Approved Courses
router.get("/approved-courses", authenticate, getApprovedCourses);

export default router;