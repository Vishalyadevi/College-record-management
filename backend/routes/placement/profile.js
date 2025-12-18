import express from 'express';
import mysql from 'mysql2/promise';
import { authenticate as authenticateToken } from '../../middlewares/auth.js';

const router = express.Router();

// Create database pool (use existing one or create new)
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Monisha_018',
  database: process.env.DB_NAME || 'record',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Get current user's profile
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('=== PROFILE ROUTE DEBUG ===');
    console.log('Fetching profile for user:', req.user);
    console.log('User ID:', req.user?.Userid);
    
    // Add validation for req.user
    if (!req.user || !req.user.Userid) {
      console.error('No user found in request');
      return res.status(401).json({ 
        success: false,
        message: 'User authentication failed - no user ID found' 
      });
    }

    // Try to get user from users table
    const [users] = await pool.query(`
      SELECT 
        Userid,
        username,
        email,
        role,
        status,
        created_at
      FROM users 
      WHERE Userid = ?
    `, [req.user.Userid]);

    console.log('Users query result:', users);

    if (users.length === 0) {
      console.error('User not found in database');
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    const userData = users[0];

    // Try to get student details if exists
    let studentDetails = null;
    try {
      const [students] = await pool.query(`
        SELECT 
          regno,
          name,
          Deptid,
          college_email,
          personal_email,
          batch,
          tenth_percentage,
          twelfth_percentage,
          cgpa,
          department
        FROM student_details 
        WHERE Userid = ?
      `, [req.user.Userid]);

      if (students.length > 0) {
        studentDetails = students[0];
      }
    } catch (err) {
      console.log('No student_details found or table does not exist:', err.message);
    }

    // Combine user data with student details
    const profileData = {
      Userid: userData.Userid,
      username: userData.username || '',
      email: userData.email || '',
      personal_email: studentDetails?.personal_email || null,
      regno: studentDetails?.regno || null,
      department: studentDetails?.department || null,
      batch: studentDetails?.batch || null,
      tenth_percentage: studentDetails?.tenth_percentage || null,
      twelfth_percentage: studentDetails?.twelfth_percentage || null,
      cgpa: studentDetails?.cgpa || null,
      role: userData.role || 'student',
      created_at: userData.created_at
    };

    console.log('Sending profile data:', profileData);
    
    res.status(200).json({
      success: true,
      data: profileData
    });
  } catch (error) {
    console.error('=== PROFILE ERROR ===');
    console.error('Error fetching profile:', error);
    console.error('Error stack:', error.stack);
    console.error('SQL Error:', error.sqlMessage);
    
    res.status(500).json({ 
      success: false,
      message: 'Server error while fetching profile',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? {
        stack: error.stack,
        sql: error.sqlMessage
      } : undefined
    });
  }
});

// Update current user's profile
router.put('/', authenticateToken, async (req, res) => {
  const { 
    username,
    personal_email,
    department,
    batch,
    tenth_percentage,
    twelfth_percentage,
    cgpa
  } = req.body;

  try {
    console.log('=== UPDATE PROFILE DEBUG ===');
    console.log('User:', req.user);
    console.log('Update data:', req.body);

    // Validate user authentication
    if (!req.user || !req.user.Userid) {
      return res.status(401).json({ 
        success: false,
        message: 'User authentication failed' 
      });
    }

    // Validate percentages and CGPA if provided
    if (tenth_percentage !== undefined && (tenth_percentage < 0 || tenth_percentage > 100)) {
      return res.status(400).json({ 
        success: false,
        message: '10th percentage must be between 0 and 100' 
      });
    }

    if (twelfth_percentage !== undefined && (twelfth_percentage < 0 || twelfth_percentage > 100)) {
      return res.status(400).json({ 
        success: false,
        message: '12th percentage must be between 0 and 100' 
      });
    }

    if (cgpa !== undefined && (cgpa < 0 || cgpa > 10)) {
      return res.status(400).json({ 
        success: false,
        message: 'CGPA must be between 0 and 10' 
      });
    }

    // Update users table if username provided
    if (username !== undefined) {
      await pool.query(
        'UPDATE users SET username = ? WHERE Userid = ?',
        [username, req.user.Userid]
      );
    }

    // Update student_details table if other fields provided
    const studentUpdates = [];
    const studentParams = [];

    if (personal_email !== undefined) {
      studentUpdates.push('personal_email = ?');
      studentParams.push(personal_email);
    }

    if (department !== undefined) {
      studentUpdates.push('department = ?');
      studentParams.push(department);
    }

    if (batch !== undefined) {
      studentUpdates.push('batch = ?');
      studentParams.push(batch);
    }

    if (tenth_percentage !== undefined) {
      studentUpdates.push('tenth_percentage = ?');
      studentParams.push(tenth_percentage);
    }

    if (twelfth_percentage !== undefined) {
      studentUpdates.push('twelfth_percentage = ?');
      studentParams.push(twelfth_percentage);
    }

    if (cgpa !== undefined) {
      studentUpdates.push('cgpa = ?');
      studentParams.push(cgpa);
    }

    if (studentUpdates.length > 0) {
      studentParams.push(req.user.Userid);
      const query = `UPDATE student_details SET ${studentUpdates.join(', ')}, updatedAt = NOW() WHERE Userid = ?`;
      
      try {
        await pool.query(query, studentParams);
      } catch (err) {
        console.log('student_details table might not exist, skipping update:', err.message);
      }
    }

    if (studentUpdates.length === 0 && username === undefined) {
      return res.status(400).json({ 
        success: false,
        message: 'No fields to update' 
      });
    }

    // Fetch updated profile
    const [updatedUser] = await pool.query(`
      SELECT 
        u.Userid,
        u.username,
        u.email,
        u.role,
        u.created_at,
        sd.regno,
        sd.personal_email,
        sd.department,
        sd.batch,
        sd.tenth_percentage,
        sd.twelfth_percentage,
        sd.cgpa
      FROM users u
      LEFT JOIN student_details sd ON u.Userid = sd.Userid
      WHERE u.Userid = ?
    `, [req.user.Userid]);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser[0]
    });
  } catch (error) {
    console.error('=== UPDATE PROFILE ERROR ===');
    console.error('Error updating profile:', error);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({ 
      success: false,
      message: 'Server error while updating profile',
      error: error.message
    });
  }
});

export default router;