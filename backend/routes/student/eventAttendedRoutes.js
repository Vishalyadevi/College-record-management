import express from "express";
import {
  addEventAttended,
  updateEventAttended,
  deleteEventAttended,
  getPendingEventsAttended,
  getApprovedEventsAttended,
} from "../../controllers/student/EventAttendedController.js";
import { authenticate } from "../../middlewares/auth.js";

const router = express.Router();

// Route to add a new event attended (requires authentication and file upload)
router.post("/add-event-attended", authenticate, addEventAttended);

// Route to update an event attended (requires authentication and file upload)
// FIXED: Added :eventId parameter
router.put("/update-event-attended/:eventId", authenticate, updateEventAttended);

// Route to delete an event attended (requires authentication)
router.delete("/delete-event-attended/:id", authenticate, deleteEventAttended);

// Route to fetch pending events attended (requires authentication)
router.get("/pending-events-attended", authenticate, getPendingEventsAttended);

// Route to fetch approved events attended for a specific user (requires authentication)
router.get("/events-attended", authenticate, getApprovedEventsAttended);

export default router;