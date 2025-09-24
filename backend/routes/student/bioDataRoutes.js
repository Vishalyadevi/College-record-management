import express from "express";
import { getStudentBiodata,getUserOnlineCourses,
    getApprovedEventsAttended, getApprovedEventsOrganized,
    getApprovedInternships,getApprovedScholarships,getApprovedLeaves} from "../../controllers/student/biodataController.js";

const router = express.Router();

// ✅ Route to get student biodata using userId
router.get("/biodata/:userId", getStudentBiodata);
router.get("/user-courses/:userId", getUserOnlineCourses); // Fetch online courses by userId
// ✅ Route to get approved events attended by a user
router.get("/approved-events/:userId", getApprovedEventsAttended);
// Route to get approved events organized by a user
router.get("/approved-events-organized/:userId", getApprovedEventsOrganized);
// Fetch internships using userId

router.get("/approved-internships/:userId", getApprovedInternships);

// ✅ Route to fetch approved scholarships by userId
router.get("/fetch-scholarships/:userId", getApprovedScholarships);

// Fetch approved leaves by User ID
router.get("/fetch-leaves/:userId", getApprovedLeaves);




export default router;
