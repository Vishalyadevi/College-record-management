import express from "express";
import { authenticate } from "../../middlewares/auth.js";
import {
  tutorApproveInternship,
  tutorApproveScholarship,
  tutorApproveEvent,
  sendMessageToStudent,
  getMessagesForStudent,
  tutorApproveEventAttended,
  tutorApproveOnlineCourse,
  tutorApproveLeave,
  tutorApproveAchievement
} from "../../controllers/student/DashboardController.js";

import { OnlineCourses, CompetencyCoding, StudentNonCGPA } from "../../models/index.js";

const router = express.Router();

// === NEW DASHBOARD ROUTES ===
router.get('/nptel/:userId', async (req, res) => {
  try {
    const nptel = await OnlineCourses.findAll({
      where: {
        Userid: req.params.userId,
        type: 'NPTEL'
      }
    });
    res.json(nptel);
  } catch (error) {
    console.error("Error fetching NPTEL courses:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get('/skillrack/:userId', async (req, res) => {
  try {
    const skill = await SkillRack.findOne({
      where: { Userid: req.params.userId }
    });
    res.json(skill || { rank: '-', medals: 0 });
  } catch (error) {
    console.error("Error fetching SkillRack data:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get('/noncgpa/student/:userId', async (req, res) => {
  try {
    const items = await StudentNonCGPA.findAll({
      where: { Userid: req.params.userId }
    });
    res.json(items);
  } catch (error) {
    console.error("Error fetching Non-CGPA items:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// === EXISTING APPROVAL ROUTES ===
router.put("/internships/:id/approve", authenticate, tutorApproveInternship);
router.put("/scholarships/:id/approve", authenticate, tutorApproveScholarship);
router.put("/events/:id/approve", authenticate, tutorApproveEvent);
router.put("/events-attended/:id/approve", authenticate, tutorApproveEventAttended);
router.post("/messages/send", authenticate, sendMessageToStudent);
router.get("/internships/:id/messages", authenticate, getMessagesForStudent);
router.put("/online-courses/:id/approve", authenticate, tutorApproveOnlineCourse);
router.put("/student-leave/:id/approve", authenticate, tutorApproveLeave);
router.put("/achievements/:id/approve", authenticate, tutorApproveAchievement);

export default router;