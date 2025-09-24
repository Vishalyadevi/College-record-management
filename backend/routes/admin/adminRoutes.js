import express from 'express';
import {getStudentDetails,getStaffDetails,getStaff, getDepartments, addUser,exportData } from '../../controllers/admin/adminController.js';
import { authenticate } from '../../middlewares/auth.js';

const router = express.Router();

router.post('/add-user', authenticate, addUser);

router.get('/get-staff', getStaff);
router.get('/departments', getDepartments);

router.post('/export', exportData);
router.get('/students',authenticate, getStudentDetails);

router.get('/staffs',authenticate, getStaffDetails)



export default router;