import express from 'express';
import { pool } from '../../db/db.js';
import { authenticate as authenticateToken } from '../../middlewares/auth.js';

const router = express.Router();

// Get hackathon statistics - MUST be before /:id route
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const [stats] = await pool.query(`
      SELECT 
        COUNT(*) as total_hackathons,
        COUNT(DISTINCT host_by) as unique_hosts,
        SUM(registered_count) as total_registrations
      FROM (
        SELECT 
          h.id,
          h.host_by,
          COUNT(sr.student_id) as registered_count
        FROM hackathons h
        LEFT JOIN student_registrations sr ON h.id = sr.hackathon_id
        GROUP BY h.id, h.host_by
      ) as hackathon_stats
    `);
    
    const [upcomingHackathons] = await pool.query(`
      SELECT COUNT(*) as upcoming_count
      FROM hackathons
      WHERE date >= CURDATE()
    `);
    
    const [recentRegistrations] = await pool.query(`
      SELECT COUNT(*) as recent_registrations
      FROM student_registrations 
      WHERE registered_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `);
    
    res.status(200).json({
      success: true,
      data: {
        total_hackathons: stats[0].total_hackathons || 0,
        unique_hosts: stats[0].unique_hosts || 0,
        total_registrations: stats[0].total_registrations || 0,
        upcoming_hackathons: upcomingHackathons[0].upcoming_count || 0,
        recent_registrations: recentRegistrations[0].recent_registrations || 0
      }
    });
  } catch (error) {
    console.error('Error fetching hackathon statistics:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while fetching statistics',
      error: error.message
    });
  }
});

// Get all hackathons with optional filtering
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { eligibility_year, department, search } = req.query;
    
    let query = `
      SELECT 
        h.*,
        COUNT(DISTINCT sr.student_id) as registered_count,
        COUNT(DISTINCT CASE WHEN sr.attempted = 1 THEN sr.student_id END) as attempted_count
      FROM hackathons h
      LEFT JOIN student_registrations sr ON h.id = sr.hackathon_id
    `;
    
    const params = [];
    const conditions = [];
    
    if (eligibility_year && eligibility_year !== 'All Years') {
      conditions.push('h.eligibility_year = ?');
      params.push(eligibility_year);
    }
    
    if (department && department !== 'All Departments') {
      conditions.push('h.department = ?');
      params.push(department);
    }
    
    if (search) {
      conditions.push('(h.contest_name LIKE ? OR h.host_by LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' GROUP BY h.id ORDER BY h.attempt_date DESC, h.created_at DESC';
    
    const [rows] = await pool.query(query, params);
    
    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Error fetching hackathons:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while fetching hackathons',
      error: error.message
    });
  }
});

// Get hackathon by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        h.*,
        COUNT(DISTINCT sr.student_id) as registered_count,
        COUNT(DISTINCT CASE WHEN sr.attempted = 1 THEN sr.student_id END) as attempted_count
      FROM hackathons h
      LEFT JOIN student_registrations sr ON h.id = sr.hackathon_id
      WHERE h.id = ?
      GROUP BY h.id
    `, [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Hackathon not found' 
      });
    }
    
    res.status(200).json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Error fetching hackathon:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while fetching hackathon',
      error: error.message
    });
  }
});

// Create new hackathon
router.post('/', authenticateToken, async (req, res) => {
  const { 
    contest_name,
    contest_link,
    date,
    host_by,
    eligibility_year,
    department,
    attempt_date
  } = req.body;
  
  try {
    console.log('=== HACKATHON CREATE DEBUG ===');
    console.log('User:', req.user);
    console.log('Body:', req.body);
    
    // Validation
    if (!contest_name?.trim()) {
      return res.status(400).json({ 
        success: false,
        message: 'Contest name is required' 
      });
    }
    
    if (!contest_link?.trim()) {
      return res.status(400).json({ 
        success: false,
        message: 'Contest link is required' 
      });
    }
    
    if (!date) {
      return res.status(400).json({ 
        success: false,
        message: 'Date is required' 
      });
    }
    
    if (!host_by?.trim()) {
      return res.status(400).json({ 
        success: false,
        message: 'Host is required' 
      });
    }
    
    if (!eligibility_year) {
      return res.status(400).json({ 
        success: false,
        message: 'Eligibility year is required' 
      });
    }
    
    if (!department) {
      return res.status(400).json({ 
        success: false,
        message: 'Department is required' 
      });
    }
    
    if (!attempt_date) {
      return res.status(400).json({ 
        success: false,
        message: 'Attempt date is required' 
      });
    }
    
    // Insert new hackathon
    const [result] = await pool.query(
      `INSERT INTO hackathons (
        contest_name, contest_link, date, host_by, 
        eligibility_year, department, attempt_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        contest_name.trim(),
        contest_link.trim(),
        date,
        host_by.trim(),
        eligibility_year,
        department,
        attempt_date
      ]
    );
    
    // Fetch the created entry
    const [newEntry] = await pool.query(
      'SELECT * FROM hackathons WHERE id = ?',
      [result.insertId]
    );
    
    console.log('✅ Hackathon created:', newEntry[0]);
    
    res.status(201).json({ 
      success: true,
      message: 'Hackathon created successfully', 
      data: newEntry[0]
    });
  } catch (error) {
    console.error('❌ Error creating hackathon:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while creating hackathon',
      error: error.message
    });
  }
});

// Update hackathon
router.put('/:id', authenticateToken, async (req, res) => {
  const { 
    contest_name,
    contest_link,
    date,
    host_by,
    eligibility_year,
    department,
    attempt_date
  } = req.body;
  
  try {
    // Validation
    if (!contest_name?.trim()) {
      return res.status(400).json({ 
        success: false,
        message: 'Contest name is required' 
      });
    }
    
    if (!contest_link?.trim()) {
      return res.status(400).json({ 
        success: false,
        message: 'Contest link is required' 
      });
    }
    
    if (!date) {
      return res.status(400).json({ 
        success: false,
        message: 'Date is required' 
      });
    }
    
    if (!host_by?.trim()) {
      return res.status(400).json({ 
        success: false,
        message: 'Host is required' 
      });
    }
    
    if (!eligibility_year) {
      return res.status(400).json({ 
        success: false,
        message: 'Eligibility year is required' 
      });
    }
    
    if (!department) {
      return res.status(400).json({ 
        success: false,
        message: 'Department is required' 
      });
    }
    
    if (!attempt_date) {
      return res.status(400).json({ 
        success: false,
        message: 'Attempt date is required' 
      });
    }
    
    // Check if hackathon exists
    const [rows] = await pool.query('SELECT * FROM hackathons WHERE id = ?', [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Hackathon not found' 
      });
    }
    
    // Update hackathon
    const [updateResult] = await pool.query(
      `UPDATE hackathons SET 
        contest_name = ?,
        contest_link = ?,
        date = ?,
        host_by = ?,
        eligibility_year = ?,
        department = ?,
        attempt_date = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [
        contest_name.trim(),
        contest_link.trim(),
        date,
        host_by.trim(),
        eligibility_year,
        department,
        attempt_date,
        req.params.id
      ]
    );
    
    if (updateResult.affectedRows === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Hackathon not found' 
      });
    }
    
    // Fetch updated entry
    const [updatedEntry] = await pool.query('SELECT * FROM hackathons WHERE id = ?', [req.params.id]);
    
    res.status(200).json({ 
      success: true,
      message: 'Hackathon updated successfully',
      data: updatedEntry[0]
    });
  } catch (error) {
    console.error('Error updating hackathon:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while updating hackathon',
      error: error.message
    });
  }
});

// Delete hackathon
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM hackathons WHERE id = ?', [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Hackathon not found' 
      });
    }
    
    // Delete student registrations first
    await pool.query('DELETE FROM student_registrations WHERE hackathon_id = ?', [req.params.id]);
    
    // Delete hackathon
    const [deleteResult] = await pool.query('DELETE FROM hackathons WHERE id = ?', [req.params.id]);
    
    if (deleteResult.affectedRows === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Hackathon not found' 
      });
    }
    
    res.status(200).json({ 
      success: true,
      message: 'Hackathon deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting hackathon:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while deleting hackathon',
      error: error.message
    });
  }
});

// Add this to your placement-hackathons.js router file (Document 1)

// Get student reports for hackathon - Add this route after the stats route
router.get('/reports/students', authenticateToken, async (req, res) => {
  try {
    const { hackathon_id, year, status } = req.query;
    
    if (!hackathon_id) {
      return res.status(400).json({ 
        success: false,
        message: 'Hackathon ID is required' 
      });
    }
    
    // Build query
    let query = `
      SELECT 
        u.Name as name,
        u.RegisterNo as register_no,
        u.Batch as batch,
        u.Department as department,
        u.Year as year,
        h.contest_name,
        sr.registered_at,
        sr.attempted,
        sr.attempt_date
      FROM student_registrations sr
      INNER JOIN users u ON sr.student_id = u.Userid
      INNER JOIN hackathons h ON sr.hackathon_id = h.id
      WHERE sr.hackathon_id = ?
    `;
    
    const params = [hackathon_id];
    
    // Add year filter
    if (year) {
      query += ' AND u.Year = ?';
      params.push(year);
    }
    
    // Add status filter
    if (status) {
      if (status === 'Attempted') {
        query += ' AND sr.attempted = 1';
      } else if (status === 'Not Attempted') {
        query += ' AND sr.attempted = 0';
      } else if (status === 'Registered') {
        query += ' AND sr.attempted = 0';
      }
      // 'All' status means no additional filter
    }
    
    query += ' ORDER BY u.Name ASC';
    
    const [students] = await pool.query(query, params);
    
    res.status(200).json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (error) {
    console.error('Error fetching student reports:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while fetching student reports',
      error: error.message
    });
  }
});

export default router;