// routes/student/hackathonRoutes.js
import express from "express";
import {
  addHackathonEvent,
  updateHackathonEvent,
  getPendingHackathonEvents,
  getApprovedHackathonEvents,
  approveHackathonEvent,
  rejectHackathonEvent,
  deleteHackathonEvent,
  getStudentHackathonEvents,
} from "../../controllers/student/hackathonController.js";
import { authenticate } from "../../middlewares/auth.js";

const router = express.Router();

// Student routes
router.post("/add", authenticate, addHackathonEvent);
router.put("/update/:id", authenticate, updateHackathonEvent);
router.get("/my-events", authenticate, getStudentHackathonEvents);
router.delete("/delete/:id", authenticate, deleteHackathonEvent);

// Tutor/Admin routes
router.get("/pending", authenticate, getPendingHackathonEvents);
router.get("/approved", authenticate, getApprovedHackathonEvents);
router.put("/approve/:id", authenticate, approveHackathonEvent);
router.put("/reject/:id", authenticate, rejectHackathonEvent);

export default router;