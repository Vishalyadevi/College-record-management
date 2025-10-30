// routes/studentFilterRoutes.js
import express from 'express';
import { getEligibleStudents, getFilterOptions } from '../controllers/studentFilterController.js';
import { authenticate} from '../middlewares/auth.js';

const router = express.Router();

// Get filter options (departments, batches, years)
router.get('/filter-options', authenticate, getFilterOptions);

// Get eligible students based on filters
router.get('/eligible-students', authenticate, getEligibleStudents);

export default router;