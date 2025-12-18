// routes/nptelRoutes.js
import express from "express";
import {
  addNPTELCourse,
  updateNPTELCourse,
  deleteNPTELCourse,
  getAllNPTELCourses,
  getNPTELCourseById,
} from "../controllers/admin/nptelController.js";
import {
  enrollNPTELCourse,
  updateStudentNPTEL,
  getStudentNPTELCourses,
  deleteStudentNPTEL,
  getPendingNPTELEnrollments,
  verifyStudentNPTEL,
} from "../controllers/student/studentNPTELController.js";
import { authenticate } from "../middlewares/auth.js";

const router = express.Router();

// ========================
// 👨‍💼 ADMIN ROUTES
// ========================
router.post("/admin/add-course", authenticate, addNPTELCourse);
router.put("/admin/update-course/:id", authenticate, updateNPTELCourse);
router.delete("/admin/delete-course/:id", authenticate, deleteNPTELCourse);
router.get("/admin/courses", authenticate, getAllNPTELCourses);
router.get("/admin/course/:id", authenticate, getNPTELCourseById);

// ========================
// 🎓 STUDENT ROUTES
// ========================
router.post("/student/enroll", authenticate, enrollNPTELCourse);
router.put("/student/update/:id", authenticate, updateStudentNPTEL);
router.get("/student/my-courses", authenticate, getStudentNPTELCourses);
router.delete("/student/delete/:id", authenticate, deleteStudentNPTEL);
router.get("/courses", authenticate, getAllNPTELCourses);

// ========================
// 👨‍🏫 TUTOR/ADMIN ROUTES
// ========================
router.get("/pending", authenticate, getPendingNPTELEnrollments);
router.put("/verify/:id", authenticate, verifyStudentNPTEL);

export default router;