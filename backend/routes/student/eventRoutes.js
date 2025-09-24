import express from "express";
import { addEvent, updateEvent, getPendingEvents, getApprovedEvents, deleteEvent } from "../../controllers/student/eventController.js";
import { authenticate } from "../../middlewares/auth.js";

const router = express.Router();

// Add a new event
router.post("/add-event", authenticate, addEvent);

// Update an event
router.put("/update-event/:id", authenticate, updateEvent);

// Delete an event
router.delete("/delete-event/:id", authenticate, deleteEvent);

// Get pending events
router.get("/pending-events", authenticate, getPendingEvents);

// Get approved events
router.get("/approved-events", authenticate, getApprovedEvents);

export default router;