import express from "express";
import {
  addOrUpdateEducationRecord,
  getEducationRecord,
  calculateAverages,
  getArrearsInformation,
  getAllEducationRecords,
  getEducationStatistics,
  searchByGPA,
  getStudentsWithArrears,
  verifyEducationRecord,
} from "../../controllers/student/studentEducationController.js";
import { authenticate } from "../../middlewares/auth.js";

const router = express.Router();

// Log to confirm routes are loaded
console.log("✅ Loading Student Education Routes...");

// Test route (remove after testing)
router.get("/test", (req, res) => {
  res.json({ 
    message: "Student Education routes are working!", 
    timestamp: new Date().toISOString() 
  });
});

// Student routes
router.post("/add-or-update", authenticate, addOrUpdateEducationRecord);
router.get("/my-record", authenticate, getEducationRecord);
router.get("/averages", authenticate, calculateAverages);
router.get("/arrears-info", authenticate, getArrearsInformation);

// Admin/Tutor routes
router.get("/all-records", authenticate, getAllEducationRecords);
router.get("/statistics", authenticate, getEducationStatistics);
router.get("/search-by-gpa", authenticate, searchByGPA);
router.get("/students-with-arrears", authenticate, getStudentsWithArrears);
router.put("/verify/:id", authenticate, verifyEducationRecord);

console.log("✅ Student Education Routes registered successfully");

export default router;
