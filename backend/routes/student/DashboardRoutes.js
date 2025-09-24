import express from "express";
import { authenticate } from "../../middlewares/auth.js";
import {
  tutorApproveInternship,
  tutorApproveScholarship,
  tutorApproveEvent, // Add this import
  sendMessageToStudent,
  getMessagesForStudent,tutorApproveEventAttended,tutorApproveOnlineCourse,tutorApproveLeave,
  tutorApproveAchievement
} from "../../controllers/student/DashboardController.js";

const router = express.Router();

// Internship routes
router.put("/internships/:id/approve", authenticate, tutorApproveInternship);

// Scholarship routes
router.put("/scholarships/:id/approve", authenticate, tutorApproveScholarship);

// Event routes
router.put("/events/:id/approve", authenticate, tutorApproveEvent); 
router.put("/events-attended/:id/approve", authenticate, tutorApproveEventAttended); 


router.post("/messages/send", authenticate, sendMessageToStudent);
router.get("/internships/:id/messages", authenticate, getMessagesForStudent);
router.put("/online-courses/:id/approve",authenticate,tutorApproveOnlineCourse);

router.put("/student-leave/:id/approve",authenticate,tutorApproveLeave);

router.put("/achievements/:id/approve",authenticate,tutorApproveAchievement);

export default router;