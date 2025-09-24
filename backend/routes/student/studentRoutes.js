import express from "express";
import { getStudentDetails, updateStudentDetails} from "../../controllers/student/studentController.js";
import { authenticate } from "../../middlewares/auth.js"; // Middleware for authentication

const router = express.Router();

// ✅ Route to fetch student details (Requires authentication)
router.get("/student", authenticate, getStudentDetails);

// ✅ Route to update student details (Requires authentication)
router.put("/student/update", authenticate, updateStudentDetails);

export default router; // ✅ Use ES module export
