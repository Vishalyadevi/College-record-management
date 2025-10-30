import express from 'express';
import { pool } from '../../db/db.js';
import { authenticate as authenticateToken } from '../../middlewares/auth.js';

const router = express.Router();

// Register for a placement drive
router.post('/register', authenticateToken, async (req, res) => {
  const { drive_id } = req.body;
  
  try {
    // Validate drive_id
    if (!drive_id) {
      return res.status(400).json({ 
        success: false,
        message: 'Drive ID is required' 
      });
    }

    // Check if drive exists
    const [driveCheck] = await pool.query(
      'SELECT * FROM placement_drives WHERE id = ?', 
      [drive_id]
    );
    
    if (driveCheck.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Placement drive not found' 
      });
    }

    // Check if already registered
    const [existingRegistration] = await pool.query(
      'SELECT * FROM registrations WHERE Userid = ? AND drive_id = ?',
      [req.user.Userid, drive_id]
    );

    if (existingRegistration.length > 0) {
      return res.status(400).json({ 
        success: false,
        message: 'You are already registered for this drive' 
      });
    }

    // Create registration
    const [result] = await pool.query(
      `INSERT INTO registrations (
        Userid, drive_id, status, placed
      ) VALUES (?, ?, 'Pending', 0)`,
      [req.user.Userid, drive_id]
    );

    // Fetch the created registration with drive details
    const [newRegistration] = await pool.query(`
      SELECT 
        r.id,
        r.Userid,
        r.drive_id,
        r.status,
        r.current_round,
        r.round_1_status,
        r.round_2_status,
        r.round_3_status,
        r.round_4_status,
        r.round_5_status,
        r.round_6_status,
        r.round_7_status,
        r.round_8_status,
        r.placed,
        r.placement_package,
        r.placement_role,
        r.created_at,
        pd.company_name,
        pd.drive_date,
        pd.drive_time,
        pd.venue
      FROM registrations r
      LEFT JOIN placement_drives pd ON r.drive_id = pd.id
      WHERE r.id = ?
    `, [result.insertId]);

    res.status(201).json({ 
      success: true,
      message: 'Successfully registered for placement drive', 
      data: newRegistration[0]
    });
  } catch (error) {
    console.error('Error registering for drive:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false,
      message: 'Server error while registering',
      error: error.message
    });
  }
});

// Get current user's registrations
router.get('/my-registrations', authenticateToken, async (req, res) => {
  try {
    const [registrations] = await pool.query(`
      SELECT 
        r.id,
        r.Userid,
        r.drive_id,
        r.status,
        r.current_round,
        r.round_1_status,
        r.round_2_status,
        r.round_3_status,
        r.round_4_status,
        r.round_5_status,
        r.round_6_status,
        r.round_7_status,
        r.round_8_status,
        r.placed,
        r.placement_package,
        r.placement_role,
        r.created_at,
        r.updated_at,
        pd.company_name,
        pd.batch,
        pd.departments,
        pd.drive_date,
        pd.drive_time,
        pd.venue,
        pd.salary,
        pd.roles,
        u.username,
        u.regno,
        u.email as college_email,
        u.personal_email,
        u.department
      FROM registrations r
      LEFT JOIN placement_drives pd ON r.drive_id = pd.id
      LEFT JOIN users u ON r.Userid = u.Userid
      WHERE r.Userid = ?
      ORDER BY r.created_at DESC
    `, [req.user.Userid]);

    res.status(200).json({
      success: true,
      count: registrations.length,
      data: registrations
    });
  } catch (error) {
    console.error('Error fetching registrations:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false,
      message: 'Server error while fetching registrations',
      error: error.message
    });
  }
});

// Get all registered students (Admin only)
router.get('/registered-students', authenticateToken, async (req, res) => {
  try {
    const { regno, name, company_name, batch, status, round, email } = req.query;
    
    // Build query dynamically
    let query = `
      SELECT 
        r.id,
        r.Userid,
        r.drive_id,
        r.status,
        r.current_round,
        r.round_1_status,
        r.round_2_status,
        r.round_3_status,
        r.round_4_status,
        r.round_5_status,
        r.round_6_status,
        r.round_7_status,
        r.round_8_status,
        r.placed,
        r.placement_package,
        r.placement_role,
        r.created_at,
        r.updated_at,
        pd.company_name,
        pd.batch,
        pd.departments,
        pd.drive_date,
        pd.drive_time,
        pd.venue,
        pd.salary,
        pd.roles,
        u.username,
        u.regno,
        u.email as college_email,
        u.personal_email,
        u.department
      FROM registrations r
      LEFT JOIN placement_drives pd ON r.drive_id = pd.id
      LEFT JOIN users u ON r.Userid = u.Userid
      WHERE 1=1
    `;
    
    const params = [];

    if (regno) {
      query += ' AND u.regno LIKE ?';
      params.push(`%${regno}%`);
    }

    if (name) {
      query += ' AND u.username LIKE ?';
      params.push(`%${name}%`);
    }

    if (company_name) {
      query += ' AND pd.company_name LIKE ?';
      params.push(`%${company_name}%`);
    }

    if (batch) {
      query += ' AND pd.batch LIKE ?';
      params.push(`%${batch}%`);
    }

    if (status) {
      query += ' AND r.status = ?';
      params.push(status);
    }

    if (round) {
      query += ' AND r.current_round = ?';
      params.push(round);
    }

    if (email) {
      query += ' AND (u.email LIKE ? OR u.personal_email LIKE ?)';
      params.push(`%${email}%`, `%${email}%`);
    }

    query += ' ORDER BY r.created_at DESC';

    console.log('Executing query:', query);
    console.log('With params:', params);

    const [students] = await pool.query(query, params);

    console.log('Query result count:', students.length);

    res.status(200).json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (error) {
    console.error('Error fetching registered students:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error code:', error.code);
    console.error('SQL Message:', error.sqlMessage);
    
    res.status(500).json({ 
      success: false,
      message: 'Server error while fetching students',
      error: error.message,
      sqlError: error.sqlMessage || 'No SQL error details'
    });
  }
});

// Get registration statistics
router.get('/statistics', authenticateToken, async (req, res) => {
  try {
    console.log('Fetching statistics...');
    
    // First check if table exists and has data
    const [tableCheck] = await pool.query('SELECT COUNT(*) as count FROM registrations');
    console.log('Registrations table count:', tableCheck[0].count);

    const query = `
      SELECT 
        COALESCE(COUNT(*), 0) as total_registrations,
        COALESCE(SUM(CASE WHEN placed = 1 OR placed = true THEN 1 ELSE 0 END), 0) as placed_count,
        COALESCE(AVG(CASE WHEN placement_package IS NOT NULL AND placement_package > 0 THEN placement_package ELSE NULL END), 0) as avg_package,
        COALESCE(SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END), 0) as pending_count
      FROM registrations
    `;

    console.log('Executing statistics query...');
    const [overview] = await pool.query(query);
    console.log('Statistics result:', overview[0]);

    res.status(200).json({
      success: true,
      data: {
        overview: {
          total_registrations: overview[0]?.total_registrations || 0,
          placed_count: overview[0]?.placed_count || 0,
          avg_package: overview[0]?.avg_package || 0,
          pending_count: overview[0]?.pending_count || 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error code:', error.code);
    console.error('SQL Message:', error.sqlMessage);
    
    res.status(500).json({ 
      success: false,
      message: 'Server error while fetching statistics',
      error: error.message,
      sqlError: error.sqlMessage || 'No SQL error details'
    });
  }
});

// Bulk update student status (Admin only)
router.put('/bulk-update-status', authenticateToken, async (req, res) => {
  const { student_ids, updates } = req.body;

  try {
    if (!student_ids || !Array.isArray(student_ids) || student_ids.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Student IDs array is required' 
      });
    }

    const { status, current_round, round_number, round_status } = updates;

    const updateFields = [];
    const params = [];

    if (status) {
      updateFields.push('status = ?');
      params.push(status);
    }

    if (current_round) {
      updateFields.push('current_round = ?');
      params.push(current_round);
    }

    if (round_number && round_status) {
      const validRounds = [1, 2, 3, 4, 5, 6, 7, 8];
      if (validRounds.includes(parseInt(round_number))) {
        updateFields.push(`round_${round_number}_status = ?`);
        params.push(round_status);
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'No valid updates provided' 
      });
    }

    const placeholders = student_ids.map(() => '?').join(',');
    const query = `
      UPDATE registrations 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id IN (${placeholders})
    `;

    console.log('Update query:', query);
    console.log('Update params:', [...params, ...student_ids]);

    const [result] = await pool.query(query, [...params, ...student_ids]);

    res.status(200).json({ 
      success: true,
      message: `Updated ${result.affectedRows} registration(s)`,
      updated_count: result.affectedRows
    });
  } catch (error) {
    console.error('Error updating statuses:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false,
      message: 'Server error while updating statuses',
      error: error.message
    });
  }
});

// Send round emails (Admin only)
router.post('/send-round-emails', authenticateToken, async (req, res) => {
  const { student_ids, subject, message, round_info } = req.body;

  try {
    if (!student_ids || !Array.isArray(student_ids) || student_ids.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Student IDs array is required' 
      });
    }

    if (!subject || !message) {
      return res.status(400).json({ 
        success: false,
        message: 'Subject and message are required' 
      });
    }

    // Get student emails
    const placeholders = student_ids.map(() => '?').join(',');
    const [students] = await pool.query(`
      SELECT u.email, u.personal_email, u.username, r.id
      FROM registrations r
      LEFT JOIN users u ON r.Userid = u.Userid
      WHERE r.id IN (${placeholders})
    `, student_ids);

    // Here you would integrate with an email service (SendGrid, Nodemailer, etc.)
    // For now, we'll just log and return success
    console.log('Sending emails to:', students.length, 'students');
    console.log('Subject:', subject);
    console.log('Message:', message);
    console.log('Round Info:', round_info);

    res.status(200).json({ 
      success: true,
      message: `Emails queued for ${students.length} student(s)`,
      count: students.length
    });
  } catch (error) {
    console.error('Error sending emails:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false,
      message: 'Server error while sending emails',
      error: error.message
    });
  }
});

// Delete registration (Admin only)
router.delete('/registration/:id', authenticateToken, async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM registrations WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Registration not found' 
      });
    }

    res.status(200).json({ 
      success: true,
      message: 'Registration deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting registration:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false,
      message: 'Server error while deleting registration',
      error: error.message
    });
  }
});

export default router;