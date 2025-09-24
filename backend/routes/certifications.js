import express from 'express';
import { pool } from '../db/db.js';
import { authenticate as authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

// Cache for user column name to avoid repeated queries
let userColumnName = null;

// Helper function to get the correct user column name
async function getUserColumnName() {
  if (userColumnName) return userColumnName;
  
  try {
    const [tableColumns] = await pool.query('SHOW COLUMNS FROM certification_courses');
    const columnNames = tableColumns.map(col => col.Field);
    console.log('Available columns in certification_courses:', columnNames);
    
    // Check for different possible user column names
    if (columnNames.includes('Userid')) {
      userColumnName = 'Userid';
    } else if (columnNames.includes('user_id')) {
      userColumnName = 'user_id';
    } else if (columnNames.includes('userId')) {
      userColumnName = 'userId';
    } else if (columnNames.includes('id')) {
      // This might be wrong, but let's check if there's any id column
      console.warn('Warning: Using generic "id" column as user reference');
      userColumnName = 'id';
    } else {
      throw new Error('No user ID column found in certification_courses table. Available columns: ' + columnNames.join(', '));
    }
    
    console.log('Using user column name:', userColumnName);
    return userColumnName;
  } catch (error) {
    console.error('Error determining user column name:', error);
    throw error;
  }
}

// Get all certification courses for the authenticated user
router.get('/', authenticateToken, async (req, res) => {
  // Enhanced authentication check
  if (!req.user || !req.user.Userid) {
    console.error('Authentication failed - req.user:', req.user);
    return res.status(401).json({ message: 'User not authenticated properly' });
  }

  try {
    const userCol = await getUserColumnName();
    const [rows] = await pool.query(
      `SELECT * FROM certification_courses WHERE ${userCol} = ? ORDER BY created_at DESC`, 
      [req.user.Userid]
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching certification courses:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get certification course by ID (only if it belongs to the authenticated user)
router.get('/:id', authenticateToken, async (req, res) => {
  // Enhanced authentication check
  if (!req.user || !req.user.Userid) {
    console.error('Authentication failed - req.user:', req.user);
    return res.status(401).json({ message: 'User not authenticated properly' });
  }

  try {
    const userCol = await getUserColumnName();
    const [rows] = await pool.query(
      `SELECT * FROM certification_courses WHERE id = ? AND ${userCol} = ?`, 
      [req.params.id, req.user.Userid]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Certification course not found' });
    }
    
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Error fetching certification course:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new certification course
router.post('/', authenticateToken, async (req, res) => {
  // Enhanced authentication check with detailed logging
  console.log('req.user in POST route:', req.user); // Debug log
  
  if (!req.user) {
    console.error('req.user is null/undefined');
    return res.status(401).json({ message: 'User not authenticated - no user object' });
  }
  
  if (!req.user.Userid) {
    console.error('req.user.Userid is null/undefined, req.user:', req.user);
    return res.status(401).json({ message: 'User not authenticated - no user ID' });
  }

  const { 
    course_name, 
    forum, 
    from_date,
    to_date,
    days, 
    certification_date, 
    certificate_link 
  } = req.body;
  
  // Basic validation
  if (!course_name || !forum || !from_date || !to_date || !days || !certification_date) {
    return res.status(400).json({ 
      message: 'Required fields missing: course_name, forum, from_date, to_date, days, certification_date' 
    });
  }

  // Validate date formats
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(from_date) || !dateRegex.test(to_date) || !dateRegex.test(certification_date)) {
    return res.status(400).json({ 
      message: 'Invalid date format. Use YYYY-MM-DD format' 
    });
  }

  // Validate that from_date is before to_date
  if (new Date(from_date) >= new Date(to_date)) {
    return res.status(400).json({ 
      message: 'from_date must be before to_date' 
    });
  }

  // Validate days is a positive integer
  const daysNum = parseInt(days);
  if (isNaN(daysNum) || daysNum <= 0) {
    return res.status(400).json({ 
      message: 'days must be a positive integer' 
    });
  }
  
  try {
    // Additional debug logging before insert
    console.log('About to insert with Userid:', req.user.Userid);
    
    // Get the correct user column name
    const userCol = await getUserColumnName();
    
    // Insert new certification course with dynamic column name
    const insertQuery = `INSERT INTO certification_courses (
      ${userCol}, course_name, forum, from_date, to_date, days, 
      certification_date, certificate_link
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    
    const params = [
      req.user.Userid, course_name, forum, from_date, to_date, daysNum, 
      certification_date, certificate_link || null
    ];
    
    console.log('Insert query:', insertQuery);
    console.log('Insert parameters:', params);
    
    const [result] = await pool.query(insertQuery, params);
    
    // Fetch the created record to return complete data
    const [createdRecord] = await pool.query(
      'SELECT * FROM certification_courses WHERE id = ?',
      [result.insertId]
    );
    
    res.status(201).json({ 
      message: 'Certification course created successfully', 
      data: createdRecord[0]
    });
  } catch (error) {
    console.error('Error creating certification course:', error);
    console.error('Error details:', {
      code: error.code,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
    
    // Handle specific database errors
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ message: 'Invalid user reference' });
    }
    
    if (error.code === 'ER_BAD_NULL_ERROR') {
      return res.status(400).json({ message: 'Required field cannot be null' });
    }
    
    if (error.code === 'ER_BAD_FIELD_ERROR') {
      return res.status(500).json({ 
        message: 'Database schema mismatch. Please check table structure.',
        error: error.sqlMessage
      });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

// Update certification course (only if it belongs to the authenticated user)
router.put('/:id', authenticateToken, async (req, res) => {
  // Enhanced authentication check
  if (!req.user || !req.user.Userid) {
    console.error('Authentication failed - req.user:', req.user);
    return res.status(401).json({ message: 'User not authenticated properly' });
  }

  const { 
    course_name, 
    forum, 
    from_date,
    to_date,
    days, 
    certification_date, 
    certificate_link 
  } = req.body;
  
  // Basic validation
  if (!course_name || !forum || !from_date || !to_date || !days || !certification_date) {
    return res.status(400).json({ 
      message: 'Required fields missing: course_name, forum, from_date, to_date, days, certification_date' 
    });
  }

  // Validate date formats
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(from_date) || !dateRegex.test(to_date) || !dateRegex.test(certification_date)) {
    return res.status(400).json({ 
      message: 'Invalid date format. Use YYYY-MM-DD format' 
    });
  }

  // Validate that from_date is before to_date
  if (new Date(from_date) >= new Date(to_date)) {
    return res.status(400).json({ 
      message: 'from_date must be before to_date' 
    });
  }

  // Validate days is a positive integer
  const daysNum = parseInt(days);
  if (isNaN(daysNum) || daysNum <= 0) {
    return res.status(400).json({ 
      message: 'days must be a positive integer' 
    });
  }
  
  try {
    const userCol = await getUserColumnName();
    
    // Check if certification course exists and belongs to the user
    const [rows] = await pool.query(
      `SELECT * FROM certification_courses WHERE id = ? AND ${userCol} = ?`, 
      [req.params.id, req.user.Userid]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Certification course not found' });
    }
    
    // Update certification course
    await pool.query(
      `UPDATE certification_courses SET 
        course_name = ?, forum = ?, 
        from_date = ?, to_date = ?, days = ?, 
        certification_date = ?, certificate_link = ?
      WHERE id = ? AND ${userCol} = ?`,
      [
        course_name, forum, 
        from_date, to_date, daysNum, 
        certification_date, certificate_link || null, 
        req.params.id, req.user.Userid
      ]
    );
    
    // Fetch updated record to return complete data
    const [updatedRecord] = await pool.query(
      'SELECT * FROM certification_courses WHERE id = ?',
      [req.params.id]
    );
    
    res.status(200).json({ 
      message: 'Certification course updated successfully',
      data: updatedRecord[0]
    });
  } catch (error) {
    console.error('Error updating certification course:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete certification course (only if it belongs to the authenticated user)
router.delete('/:id', authenticateToken, async (req, res) => {
  // Enhanced authentication check
  if (!req.user || !req.user.Userid) {
    console.error('Authentication failed - req.user:', req.user);
    return res.status(401).json({ message: 'User not authenticated properly' });
  }

  try {
    const userCol = await getUserColumnName();
    
    // Check if certification course exists and belongs to the user
    const [rows] = await pool.query(
      `SELECT * FROM certification_courses WHERE id = ? AND ${userCol} = ?`, 
      [req.params.id, req.user.Userid]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Certification course not found' });
    }
    
    // Delete certification course
    await pool.query(
      `DELETE FROM certification_courses WHERE id = ? AND ${userCol} = ?`, 
      [req.params.id, req.user.Userid]
    );
    
    res.status(200).json({ message: 'Certification course deleted successfully' });
  } catch (error) {
    console.error('Error deleting certification course:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get certification course statistics for the authenticated user
router.get('/stats/summary', authenticateToken, async (req, res) => {
  // Enhanced authentication check
  if (!req.user || !req.user.Userid) {
    console.error('Authentication failed - req.user:', req.user);
    return res.status(401).json({ message: 'User not authenticated properly' });
  }

  try {
    const userCol = await getUserColumnName();
    const [stats] = await pool.query(
      `SELECT 
        COUNT(*) as total_courses,
        COALESCE(SUM(days), 0) as total_days,
        MIN(from_date) as earliest_course,
        MAX(certification_date) as latest_certification
      FROM certification_courses 
      WHERE ${userCol} = ?`,
      [req.user.Userid]
    );
    
    res.status(200).json(stats[0]);
  } catch (error) {
    console.error('Error fetching certification course statistics:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;