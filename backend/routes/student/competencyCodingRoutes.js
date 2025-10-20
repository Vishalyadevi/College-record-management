// routes/student/competencyCodingRoutes.js
import express from "express";
import {
  addOrUpdateCompetencyCoding,
  getCompetencyRecord,
  updateSkillRackMetrics,
  getSkillRackSummary,
  addPlatformProfile,
  getPlatformProfiles,
  updatePlatformProfile,
  deletePlatformProfile,
  getCompetencyAnalytics,
  getAllCompetencyRecords,
  getCompetencyStatistics,
  searchByCompetencyLevel,
  getTopPerformers,
  getPlatformStatistics,
  verifyCompetencyRecord,
} from "../../controllers/student/competencyCodingController.js";
import { authenticate } from "../../middlewares/auth.js";

const router = express.Router();

// ========================
// 🎯 MAIN COMPETENCY ROUTES
// ========================

// Student routes
router.post("/add-or-update", authenticate, addOrUpdateCompetencyCoding);
router.get("/my-record", authenticate, getCompetencyRecord);
router.get("/analytics", authenticate, getCompetencyAnalytics);

// ========================
// 🏆 SKILLRACK ROUTES
// ========================

router.put("/skillrack/update", authenticate, updateSkillRackMetrics);
router.get("/skillrack/summary", authenticate, getSkillRackSummary);

// ========================
// 📱 OTHER PLATFORMS ROUTES
// ========================

router.post("/platform/add", authenticate, addPlatformProfile);
router.get("/platform/all", authenticate, getPlatformProfiles);
router.put("/platform/update/:platformId", authenticate, updatePlatformProfile);
router.delete("/platform/delete/:platformId", authenticate, deletePlatformProfile);

// ========================
// 📊 ADMIN/TUTOR ROUTES
// ========================

router.get("/all-records", authenticate, getAllCompetencyRecords);
router.get("/statistics", authenticate, getCompetencyStatistics);
router.get("/search-by-level", authenticate, searchByCompetencyLevel);
router.get("/top-performers", authenticate, getTopPerformers);
router.get("/platform-statistics", authenticate, getPlatformStatistics);
router.put("/verify/:id", authenticate, verifyCompetencyRecord);

export default router;