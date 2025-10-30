import express from 'express';
import { pool } from '../../db/db.js';
import { authenticate as authenticateToken } from '../../middlewares/auth.js';

const router = express.Router();

// Get all placement drives with optional filtering
router.get('/', authenticateToken, async (req, res) => {
  try {
    let query = `
      SELECT 
        pd.id,
        pd.Userid,
        pd.company_name,
        pd.batch,
        pd.departments,
        pd.tenth_percentage,
        pd.twelfth_percentage,
        pd.cgpa,
        pd.history_of_arrears,
        pd.standing_arrears,
        pd.drive_date,
        pd.drive_time,
        pd.venue,
        pd.salary,
        pd.roles,
        pd.created_at,
        pd.updated_at,
        u.username
      FROM placement_drives pd 
      LEFT JOIN users u ON pd.Userid = u.Userid
    `;
    
    const params = [];
    if (req.query.my_entries === 'true') {
      query += ' WHERE pd.Userid = ?';
      params.push(req.user.Userid);
    }
    
    query += ' ORDER BY pd.drive_date DESC, pd.drive_time DESC';
    
    const [rows] = await pool.query(query, params);
    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Error fetching placement drives:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while fetching placement drives',
      error: error.message
    });
  }
});

// Get placement drive by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        pd.id,
        pd.Userid,
        pd.company_name,
        pd.batch,
        pd.departments,
        pd.tenth_percentage,
        pd.twelfth_percentage,
        pd.cgpa,
        pd.history_of_arrears,
        pd.standing_arrears,
        pd.drive_date,
        pd.drive_time,
        pd.venue,
        pd.salary,
        pd.roles,
        pd.created_at,
        pd.updated_at,
        u.username
      FROM placement_drives pd 
      LEFT JOIN users u ON pd.Userid = u.Userid
      WHERE pd.id = ?
    `, [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Placement drive not found' 
      });
    }
    
    res.status(200).json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Error fetching placement drive:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while fetching placement drive',
      error: error.message
    });
  }
});

// Create new placement drive
router.post('/', authenticateToken, async (req, res) => {
  const { 
    company_name,
    batch,
    departments,
    tenth_percentage,
    twelfth_percentage,
    cgpa,
    history_of_arrears,
    standing_arrears,
    drive_date,
    drive_time,
    venue,
    salary,
    roles
  } = req.body;
  
  try {
    console.log('=== PLACEMENT DRIVE DEBUG INFO ===');
    console.log('req.user:', req.user);
    console.log('Request body:', req.body);
    
    // Validation
    if (!company_name || !company_name.trim()) {
      return res.status(400).json({ 
        success: false,
        message: 'Company name is required' 
      });
    }
    
    if (!drive_date) {
      return res.status(400).json({ 
        success: false,
        message: 'Drive date is required' 
      });
    }
    
    if (!drive_time) {
      return res.status(400).json({ 
        success: false,
        message: 'Drive time is required' 
      });
    }
    
    // Validate percentages
    if (tenth_percentage && (tenth_percentage < 0 || tenth_percentage > 100)) {
      return res.status(400).json({ 
        success: false,
        message: '10th percentage must be between 0 and 100' 
      });
    }
    
    if (twelfth_percentage && (twelfth_percentage < 0 || twelfth_percentage > 100)) {
      return res.status(400).json({ 
        success: false,
        message: '12th percentage must be between 0 and 100' 
      });
    }
    
    if (cgpa && (cgpa < 0 || cgpa > 10)) {
      return res.status(400).json({ 
        success: false,
        message: 'CGPA must be between 0 and 10' 
      });
    }
    
    // Check if user exists
    const [userCheck] = await pool.query('SELECT Userid FROM users WHERE Userid = ?', [req.user.Userid]);
    if (userCheck.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid user' 
      });
    }
    
    // Insert new placement drive
    const [result] = await pool.query(
      `INSERT INTO placement_drives (
        Userid, company_name, batch, departments, 
        tenth_percentage, twelfth_percentage, cgpa,
        history_of_arrears, standing_arrears,
        drive_date, drive_time, venue, salary, roles
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.Userid, 
        company_name.trim(), 
        batch || null,
        departments || null,
        tenth_percentage || null,
        twelfth_percentage || null,
        cgpa || null,
        history_of_arrears || null,
        standing_arrears || null,
        drive_date,
        drive_time,
        venue || null,
        salary || null,
        roles || null
      ]
    );
    
    // Fetch the created entry
    const [newEntry] = await pool.query(`
      SELECT 
        pd.id,
        pd.Userid,
        pd.company_name,
        pd.batch,
        pd.departments,
        pd.tenth_percentage,
        pd.twelfth_percentage,
        pd.cgpa,
        pd.history_of_arrears,
        pd.standing_arrears,
        pd.drive_date,
        pd.drive_time,
        pd.venue,
        pd.salary,
        pd.roles,
        pd.created_at,
        pd.updated_at,
        u.username
      FROM placement_drives pd 
      LEFT JOIN users u ON pd.Userid = u.Userid
      WHERE pd.id = ?
    `, [result.insertId]);
    
    res.status(201).json({ 
      success: true,
      message: 'Placement drive created successfully', 
      data: newEntry[0]
    });
  } catch (error) {
    console.error('Error creating placement drive:', error);
    
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid user reference' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Server error while creating placement drive',
      error: error.message
    });
  }
});

// Update placement drive
router.put('/:id', authenticateToken, async (req, res) => {
  const { 
    company_name,
    batch,
    departments,
    tenth_percentage,
    twelfth_percentage,
    cgpa,
    history_of_arrears,
    standing_arrears,
    drive_date,
    drive_time,
    venue,
    salary,
    roles
  } = req.body;
  
  try {
    // Validation
    if (!company_name || !company_name.trim()) {
      return res.status(400).json({ 
        success: false,
        message: 'Company name is required' 
      });
    }
    
    if (!drive_date) {
      return res.status(400).json({ 
        success: false,
        message: 'Drive date is required' 
      });
    }
    
    if (!drive_time) {
      return res.status(400).json({ 
        success: false,
        message: 'Drive time is required' 
      });
    }
    
    // Check if placement drive exists
    const [rows] = await pool.query('SELECT * FROM placement_drives WHERE id = ?', [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Placement drive not found' 
      });
    }
    
    // Update placement drive
    const [updateResult] = await pool.query(
      `UPDATE placement_drives SET 
        company_name = ?,
        batch = ?,
        departments = ?,
        tenth_percentage = ?,
        twelfth_percentage = ?,
        cgpa = ?,
        history_of_arrears = ?,
        standing_arrears = ?,
        drive_date = ?,
        drive_time = ?,
        venue = ?,
        salary = ?,
        roles = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [
        company_name.trim(),
        batch || null,
        departments || null,
        tenth_percentage || null,
        twelfth_percentage || null,
        cgpa || null,
        history_of_arrears || null,
        standing_arrears || null,
        drive_date,
        drive_time,
        venue || null,
        salary || null,
        roles || null,
        req.params.id
      ]
    );
    
    if (updateResult.affectedRows === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Placement drive not found' 
      });
    }
    
    // Fetch updated entry
    const [updatedEntry] = await pool.query(`
      SELECT 
        pd.id,
        pd.Userid,
        pd.company_name,
        pd.batch,
        pd.departments,
        pd.tenth_percentage,
        pd.twelfth_percentage,
        pd.cgpa,
        pd.history_of_arrears,
        pd.standing_arrears,
        pd.drive_date,
        pd.drive_time,
        pd.venue,
        pd.salary,
        pd.roles,
        pd.created_at,
        pd.updated_at,
        u.username
      FROM placement_drives pd 
      LEFT JOIN users u ON pd.Userid = u.Userid
      WHERE pd.id = ?
    `, [req.params.id]);
    
    res.status(200).json({ 
      success: true,
      message: 'Placement drive updated successfully',
      data: updatedEntry[0]
    });
  } catch (error) {
    console.error('Error updating placement drive:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while updating placement drive',
      error: error.message
    });
  }
});

// Delete placement drive
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM placement_drives WHERE id = ?', [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Placement drive not found' 
      });
    }
    
    const [deleteResult] = await pool.query('DELETE FROM placement_drives WHERE id = ?', [req.params.id]);
    
    if (deleteResult.affectedRows === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Placement drive not found' 
      });
    }
    
    res.status(200).json({ 
      success: true,
      message: 'Placement drive deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting placement drive:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while deleting placement drive',
      error: error.message
    });
  }
});

// Get placement statistics
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const [stats] = await pool.query(`
      SELECT 
        COUNT(*) as total_drives,
        COUNT(DISTINCT company_name) as unique_companies,
        AVG(salary) as avg_package
      FROM placement_drives
    `);
    
    const [upcomingDrives] = await pool.query(`
      SELECT COUNT(*) as upcoming_count
      FROM placement_drives
      WHERE drive_date >= CURDATE()
    `);
    
    res.status(200).json({
      success: true,
      data: {
        total_drives: stats[0].total_drives || 0,
        unique_companies: stats[0].unique_companies || 0,
        upcoming_drives: upcomingDrives[0].upcoming_count || 0
      }
    });
  } catch (error) {
    console.error('Error fetching placement statistics:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while fetching statistics',
      error: error.message
    });
  }
});

export default router;