// routes/student/publicationRoutes.js
import express from "express";
import {
  addPublication,
  updatePublication,
  getStudentPublications,
  getPendingPublications,
  getVerifiedPublications,
  verifyPublication,
  deletePublication,
  getPublicationStatistics,
  getAllPublications,
  searchByPublicationType,
  getHighImpactPublications,
  getIndexedPublications,
  getPublicationMetricsByYear,
  getPublicationPortfolio,
} from "../../controllers/student/studentPublicationController.js";
import { authenticate } from "../../middlewares/auth.js";

const router = express.Router();

// ========================
// 📄 STUDENT ROUTES
// ========================

// CRUD operations
router.post("/add", authenticate, addPublication);
router.put("/update/:id", authenticate, updatePublication);
router.get("/my-publications", authenticate, getStudentPublications);
router.get("/verified-publications", authenticate, getVerifiedPublications);
router.delete("/delete/:id", authenticate, deletePublication);

// Statistics and Analytics
router.get("/statistics", authenticate, getPublicationStatistics);
router.get("/portfolio", authenticate, getPublicationPortfolio);
router.get("/metrics-by-year", authenticate, getPublicationMetricsByYear);

// Search and Filter
router.get("/search-by-type", authenticate, searchByPublicationType);
router.get("/high-impact", authenticate, getHighImpactPublications);
router.get("/indexed-publications", authenticate, getIndexedPublications);

// ========================
// 👨‍🏫 TUTOR/ADMIN ROUTES
// ========================

router.get("/pending", authenticate, getPendingPublications);
router.get("/all", authenticate, getAllPublications);
router.put("/verify/:id", authenticate, verifyPublication);

export default router;