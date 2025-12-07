import express from 'express';
import { 
  login, 
  getUserDetails, 
  updateUserProfile, 
  forgotPassword, 
  resetPassword,
  logout 
} from '../controllers/authController.js';
import { authenticate } from '../middlewares/auth.js';
import { pool } from '../db/db.js';

const router = express.Router();

// Public routes
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.post('/logout', logout);

// Protected routes
router.get('/get-user/:id', authenticate, getUserDetails);
router.put('/update-profile/:userId', authenticate, updateUserProfile);

// Get current authenticated user
router.get('/me', authenticate, async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      user: req.user
    });
  } catch (error) {
    console.error('❌ Error fetching current user:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get all users (with optional filtering)
router.get('/users', authenticate, async (req, res) => {
  try {
    const { role, department, status } = req.query;
    
    let query = `
      SELECT 
        u.Userid,
        u.username as name,
        u.email,
        u.Deptid,
        u.role,
        u.status,
        u.staffId,
        u.image,
        d.DeptName as departmentName
      FROM users u
      LEFT JOIN department d ON u.Deptid = d.Deptid
      WHERE 1=1
    `;
    
    const params = [];
    
    if (role) {
      query += ' AND u.role = ?';
      params.push(role);
    }
    
    if (department) {
      query += ' AND u.Deptid = ?';
      params.push(department);
    }
    
    if (status) {
      query += ' AND u.status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY u.username ASC';
    
    const [rows] = await pool.query(query, params);
    
    console.log(`✅ Found ${rows.length} users`);
    
    res.status(200).json({
      success: true,
      count: rows.length,
      users: rows
    });
    
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error', 
      message: error.message
    });
  }
});

// Get students only
// router.get('/students', authenticate, async (req, res) => {
//   try {
//     const { department } = req.query;
    
//     let query = `
//       SELECT 
//         u.Userid,
//         u.username as name,
//         u.email,
//         u.Deptid,
//         u.status,
//         u.image,
//         d.DeptName as departmentName
//       FROM users u
//       LEFT JOIN department d ON u.Deptid = d.Deptid
//       WHERE u.role = 'Student'
//     `;
    
//     const params = [];
    
//     if (department) {
//       query += ' AND u.Deptid = ?';
//       params.push(department);
//     }
    
//     query += ' ORDER BY u.username ASC';
    
//     const [rows] = await pool.query(query, params);
    
//     res.status(200).json({
//       success: true,
//       count: rows.length,
//       students: rows
//     });
    
//   } catch (error) {
//     console.error('❌ Error fetching students:', error);
//     res.status(500).json({ 
//       success: false,
//       error: 'Internal server error', 
//       message: error.message
//     });
//   }
// });


router.get('/students', authenticate, async (req, res) => {
  try {
    const { department } = req.query;
    
    let query = `
      SELECT 
        u.Userid,
        u.username,
        u.email,
        u.Deptid,
        u.status,
        u.image,
        d.DeptName as departmentName,
        d.Deptacronym,
        sd.regno,
        sd.batch,
        sd.Semester,
        sd.staffId,
        sd.date_of_birth,
        sd.blood_group,
        sd.personal_email,
        sd.student_type,
        sd.gender,
        sd.section,
        sd.personal_phone,
        sd.pending,
        sd.tutor_approval_status
      FROM users u
      LEFT JOIN department d ON u.Deptid = d.Deptid
      LEFT JOIN student_details sd ON u.Userid = sd.Userid
      WHERE u.role = 'Student'
    `;
    
    const params = [];
    
    if (department) {
      query += ' AND u.Deptid = ?';
      params.push(department);
    }
    
    query += ' ORDER BY u.username ASC';
    
    const [rows] = await pool.query(query, params);
    
    res.status(200).json({
      success: true,
      count: rows.length,
      students: rows
    });
    
  } catch (error) {
    console.error('❌ Error fetching students:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error', 
      message: error.message
    });
  }
});

// Get staff only
router.get('/staff', authenticate, async (req, res) => {
  try {
    const { department } = req.query;
    
    let query = `
      SELECT 
        u.Userid,
        u.username as name,
        u.email,
        u.Deptid,
        u.staffId,
        u.status,
        u.image,
        d.DeptName as departmentName
      FROM users u
      LEFT JOIN department d ON u.Deptid = d.Deptid
      WHERE u.role = 'Staff'
    `;
    
    const params = [];
    
    if (department) {
      query += ' AND u.Deptid = ?';
      params.push(department);
    }
    
    query += ' ORDER BY u.username ASC';
    
    const [rows] = await pool.query(query, params);
    
    res.status(200).json({
      success: true,
      count: rows.length,
      staff: rows
    });
    
  } catch (error) {
    console.error('❌ Error fetching staff:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error', 
      message: error.message
    });
  }
});

export default router;