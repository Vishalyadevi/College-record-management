import express from 'express';
import { pool } from '../../db/db.js';
import { authenticate as authenticateToken } from '../../middlewares/auth.js';

const router = express.Router();

// Get all hackathons for students with registration status
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { student_id } = req.query;
    
    if (!student_id) {
      return res.status(400).json({ 
        success: false,
        message: 'Student ID is required' 
      });
    }
    
    // Verify student exists
    const [studentCheck] = await pool.query('SELECT Userid FROM users WHERE Userid = ?', [student_id]);
    if (studentCheck.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Student not found' 
      });
    }
    
    const [hackathons] = await pool.query(`
      SELECT 
        h.*,
        CASE WHEN sr.student_id IS NOT NULL THEN 1 ELSE 0 END as registered,
        COALESCE(sr.attempted, 0) as attempted,
        sr.attempt_date as student_attempt_date,
        sr.registered_at
      FROM hackathons h
      LEFT JOIN student_registrations sr ON h.id = sr.hackathon_id AND sr.student_id = ?
      WHERE h.date >= CURDATE() OR sr.student_id IS NOT NULL
      ORDER BY h.date ASC, h.created_at DESC
    `, [student_id]);
    
    res.status(200).json({
      success: true,
      count: hackathons.length,
      data: hackathons
    });
  } catch (error) {
    console.error('Error fetching student hackathons:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while fetching hackathons',
      error: error.message
    });
  }
});

// Register for hackathon
router.post('/register', authenticateToken, async (req, res) => {
  const { student_id, hackathon_id } = req.body;
  
  try {
    console.log('=== REGISTER DEBUG ===');
    console.log('Student ID:', student_id);
    console.log('Hackathon ID:', hackathon_id);
    
    if (!student_id || !hackathon_id) {
      return res.status(400).json({ 
        success: false,
        message: 'Student ID and Hackathon ID are required' 
      });
    }
    
    // Check if hackathon exists
    const [hackathonCheck] = await pool.query('SELECT id FROM hackathons WHERE id = ?', [hackathon_id]);
    if (hackathonCheck.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Hackathon not found' 
      });
    }
    
    // Check if student exists
    const [studentCheck] = await pool.query('SELECT Userid FROM users WHERE Userid = ?', [student_id]);
    if (studentCheck.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Student not found' 
      });
    }
    
    // Check if already registered
    const [existing] = await pool.query(
      'SELECT * FROM student_registrations WHERE student_id = ? AND hackathon_id = ?',
      [student_id, hackathon_id]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Already registered for this hackathon' 
      });
    }
    
    // Register student
    const [result] = await pool.query(
      'INSERT INTO student_registrations (student_id, hackathon_id, registered_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
      [student_id, hackathon_id]
    );
    
    console.log('✅ Registration successful:', result.insertId);
    
    res.status(201).json({ 
      success: true,
      message: 'Registered for hackathon successfully',
      registration_id: result.insertId
    });
  } catch (error) {
    console.error('❌ Error registering for hackathon:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while registering for hackathon',
      error: error.message
    });
  }
});

// Mark hackathon as attempted
router.put('/attempt', authenticateToken, async (req, res) => {
  const { student_id, hackathon_id, attempt_date } = req.body;
  
  try {
    console.log('=== ATTEMPT DEBUG ===');
    console.log('Student ID:', student_id);
    console.log('Hackathon ID:', hackathon_id);
    console.log('Attempt Date:', attempt_date);
    
    if (!student_id || !hackathon_id || !attempt_date) {
      return res.status(400).json({ 
        success: false,
        message: 'Student ID, Hackathon ID and Attempt Date are required' 
      });
    }
    
    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(attempt_date)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD' 
      });
    }
    
    // Check if registration exists
    const [registration] = await pool.query(
      'SELECT * FROM student_registrations WHERE student_id = ? AND hackathon_id = ?',
      [student_id, hackathon_id]
    );
    
    if (registration.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Registration not found. Please register first.' 
      });
    }
    
    // Update attempt status
    const [result] = await pool.query(
      `UPDATE student_registrations 
       SET attempted = 1, attempt_date = ? 
       WHERE student_id = ? AND hackathon_id = ?`,
      [attempt_date, student_id, hackathon_id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Registration not found' 
      });
    }
    
    console.log('✅ Attempt recorded successfully');
    
    res.status(200).json({ 
      success: true,
      message: 'Hackathon attempt recorded successfully'
    });
  } catch (error) {
    console.error('❌ Error updating attempt:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while updating attempt',
      error: error.message
    });
  }
});

// Get student's hackathon history
router.get('/history/:student_id', authenticateToken, async (req, res) => {
  try {
    const { student_id } = req.params;
    
    // Verify student exists
    const [studentCheck] = await pool.query('SELECT Userid FROM users WHERE Userid = ?', [student_id]);
    if (studentCheck.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Student not found' 
      });
    }
    
    const [hackathons] = await pool.query(`
      SELECT 
        h.*,
        sr.registered,
        sr.attempted,
        sr.attempt_date as student_attempt_date,
        sr.registered_at
      FROM hackathons h
      INNER JOIN student_registrations sr ON h.id = sr.hackathon_id 
      WHERE sr.student_id = ?
      ORDER BY h.date DESC, sr.registered_at DESC
    `, [student_id]);
    
    res.status(200).json({
      success: true,
      count: hackathons.length,
      data: hackathons
    });
  } catch (error) {
    console.error('Error fetching hackathon history:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while fetching hackathon history',
      error: error.message
    });
  }
});

// Unregister from hackathon
router.delete('/unregister', authenticateToken, async (req, res) => {
  const { student_id, hackathon_id } = req.body;
  
  try {
    if (!student_id || !hackathon_id) {
      return res.status(400).json({ 
        success: false,
        message: 'Student ID and Hackathon ID are required' 
      });
    }
    
    const [result] = await pool.query(
      'DELETE FROM student_registrations WHERE student_id = ? AND hackathon_id = ?',
      [student_id, hackathon_id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Registration not found' 
      });
    }
    
    res.status(200).json({ 
      success: true,
      message: 'Successfully unregistered from hackathon'
    });
  } catch (error) {
    console.error('Error unregistering from hackathon:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while unregistering',
      error: error.message
    });
  }
});

export default router;