import express from 'express';
import { authenticate as authenticateToken } from '../../middlewares/auth.js';
import { getStudentDetails, updateStudentDetails } from '../../controllers/student/studentController.js';

const router = express.Router();

// Get student details
router.get('/student', authenticateToken, getStudentDetails);

// Update student details
router.put('/student/update', authenticateToken, updateStudentDetails);

export default router;