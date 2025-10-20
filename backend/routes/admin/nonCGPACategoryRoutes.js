import express from "express";
import {
  addNonCGPACategory,
  getAllNonCGPACategories,
  getNonCGPACategoryById,
  getNonCGPACategoryByCourseCode,
  searchNonCGPACategories,
  updateNonCGPACategory,
  deleteNonCGPACategory,
  bulkDeleteNonCGPACategories,
  bulkUploadNonCGPACategories,
  getNonCGPACategoryStatistics,
  getNonCGPACategoriesByDepartment,
  getNonCGPACategoriesBySemester,
} from "../../controllers/admin/nonCGPACategoryController.js";
import { authenticate} from "../../middlewares/auth.js";

const router = express.Router();

// ========================
// 📋 CRUD OPERATIONS
// ========================

// Create
router.post("/add", authenticate, addNonCGPACategory);

// Read
router.get("/all", authenticate, getAllNonCGPACategories);
router.get("/by-id/:id", authenticate, getNonCGPACategoryById);
router.get("/by-code/:courseCode", authenticate, getNonCGPACategoryByCourseCode);

// Update
router.put("/update/:id", authenticate, updateNonCGPACategory);

// Delete
router.delete("/delete/:id", authenticate,  deleteNonCGPACategory);
router.post("/bulk-delete", authenticate,  bulkDeleteNonCGPACategories);

// ========================
// 🔍 SEARCH & FILTER
// ========================

router.get("/search", authenticate, searchNonCGPACategories);
router.get("/by-department/:department", authenticate, getNonCGPACategoriesByDepartment);
router.get("/by-semester/:semester", authenticate, getNonCGPACategoriesBySemester);

// ========================
// 📊 BULK OPERATIONS & ANALYTICS
// ========================

router.post("/bulk-upload", authenticate,  bulkUploadNonCGPACategories);
router.get("/statistics", authenticate, getNonCGPACategoryStatistics);

export default router;