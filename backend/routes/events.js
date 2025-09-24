import express from 'express';
import { pool } from '../db/db.js';
import { authenticate as authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

// Get all events attended
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM events_attended WHERE Userid = ? ORDER BY created_at DESC',
      [req.user.Userid] // ✅ Changed from req.user.id to req.user.Userid
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get event by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM events_attended WHERE id = ? AND Userid = ?',
      [req.params.id, req.user.Userid] // ✅ Changed from req.user.id to req.user.Userid
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new event
router.post('/', authenticateToken, async (req, res) => {
  const { 
    programme_name, 
    title, 
    from_date, 
    to_date, 
    mode, 
    organized_by, 
    participants, 
    financial_support, 
    support_amount, 
    permission_letter_link,
    certificate_link,
    financial_proof_link,
    programme_report_link
  } = req.body;
  
  try {
    // Debug logging - remove after fixing
    console.log('=== DEBUG INFO ===');
    console.log('req.user:', req.user);
    console.log('req.user.Userid:', req.user.Userid);
    console.log('typeof req.user.Userid:', typeof req.user.Userid);
    
    // Basic validation
    if (!programme_name?.trim() || !title?.trim() || !from_date || !to_date || !mode || !organized_by?.trim() || participants === undefined || participants === null) {
      return res.status(400).json({ message: 'Required fields missing' });
    }
    
    // Validate mode enum
    const validModes = ['Online', 'Offline', 'Hybrid'];
    if (!validModes.includes(mode)) {
      return res.status(400).json({ message: 'Mode must be Online, Offline, or Hybrid' });
    }
    
    // Validate dates
    const fromDate = new Date(from_date);
    const toDate = new Date(to_date);
    
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }
    
    if (fromDate > toDate) {
      return res.status(400).json({ message: 'Start date must be before end date' });
    }

    // Validate participants
    const participantsCount = parseInt(participants);
    if (isNaN(participantsCount) || participantsCount <= 0) {
      return res.status(400).json({ message: 'Participants must be a positive number' });
    }

    // Validate support amount if financial support is true
    let supportAmount = null;
    if (financial_support === true || financial_support === 'true') {
      if (support_amount !== undefined && support_amount !== null && support_amount !== '') {
        supportAmount = parseFloat(support_amount);
        if (isNaN(supportAmount) || supportAmount < 0) {
          return res.status(400).json({ message: 'Support amount must be a valid positive number' });
        }
      }
    }
    
    // Validate organized_by length (max 100 characters as per schema)
    if (organized_by.trim().length > 100) {
      return res.status(400).json({ message: 'Organized by field cannot exceed 100 characters' });
    }
    
    // Insert new event
    const [result] = await pool.query(
      `INSERT INTO events_attended (
        Userid, programme_name, title, from_date, to_date,
        mode, organized_by, participants, financial_support, support_amount,
        permission_letter_link, certificate_link, financial_proof_link, programme_report_link
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.Userid, // ✅ Changed from req.user.id to req.user.Userid
        programme_name.trim(), 
        title.trim(), 
        from_date, 
        to_date,
        mode, 
        organized_by.trim(), 
        participantsCount, 
        Boolean(financial_support), 
        supportAmount,
        permission_letter_link?.trim() || null, 
        certificate_link?.trim() || null, 
        financial_proof_link?.trim() || null, 
        programme_report_link?.trim() || null
      ]
    );
    
    res.status(201).json({ 
      message: 'Event created successfully', 
      id: result.insertId 
    });
  } catch (error) {
    console.error('Error creating event:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Duplicate entry error' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update event
router.put('/:id', authenticateToken, async (req, res) => {
  const { 
    programme_name, 
    title, 
    from_date, 
    to_date, 
    mode, 
    organized_by, 
    participants, 
    financial_support, 
    support_amount, 
    permission_letter_link,
    certificate_link,
    financial_proof_link,
    programme_report_link
  } = req.body;
  
  try {
    // Basic validation
    if (!programme_name?.trim() || !title?.trim() || !from_date || !to_date || !mode || !organized_by?.trim() || participants === undefined || participants === null) {
      return res.status(400).json({ message: 'Required fields missing' });
    }
    
    // Validate mode enum
    const validModes = ['Online', 'Offline', 'Hybrid'];
    if (!validModes.includes(mode)) {
      return res.status(400).json({ message: 'Mode must be Online, Offline, or Hybrid' });
    }
    
    // Validate dates
    const fromDate = new Date(from_date);
    const toDate = new Date(to_date);
    
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }
    
    if (fromDate > toDate) {
      return res.status(400).json({ message: 'Start date must be before end date' });
    }

    // Validate participants
    const participantsCount = parseInt(participants);
    if (isNaN(participantsCount) || participantsCount <= 0) {
      return res.status(400).json({ message: 'Participants must be a positive number' });
    }

    // Validate support amount if financial support is true
    let supportAmount = null;
    if (financial_support === true || financial_support === 'true') {
      if (support_amount !== undefined && support_amount !== null && support_amount !== '') {
        supportAmount = parseFloat(support_amount);
        if (isNaN(supportAmount) || supportAmount < 0) {
          return res.status(400).json({ message: 'Support amount must be a valid positive number' });
        }
      }
    }
    
    // Validate organized_by length
    if (organized_by.trim().length > 100) {
      return res.status(400).json({ message: 'Organized by field cannot exceed 100 characters' });
    }
    
    // Check if event exists and belongs to user
    const [rows] = await pool.query(
      'SELECT * FROM events_attended WHERE id = ? AND Userid = ?',
      [req.params.id, req.user.Userid] // ✅ Changed from req.user.id to req.user.Userid
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Event not found or access denied' });
    }
    
    // Update event
    const [result] = await pool.query(
      `UPDATE events_attended SET 
        programme_name = ?, title = ?, from_date = ?, to_date = ?,
        mode = ?, organized_by = ?, participants = ?, financial_support = ?, support_amount = ?,
        permission_letter_link = ?, certificate_link = ?, financial_proof_link = ?, programme_report_link = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND Userid = ?`,
      [
        programme_name.trim(), 
        title.trim(), 
        from_date, 
        to_date,
        mode, 
        organized_by.trim(), 
        participantsCount, 
        Boolean(financial_support), 
        supportAmount,
        permission_letter_link?.trim() || null, 
        certificate_link?.trim() || null, 
        financial_proof_link?.trim() || null, 
        programme_report_link?.trim() || null,
        req.params.id,
        req.user.Userid // ✅ Changed from req.user.id to req.user.Userid
      ]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Event not found or no changes made' });
    }
    
    res.status(200).json({ message: 'Event updated successfully' });
  } catch (error) {
    console.error('Error updating event:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Duplicate entry error' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete event
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Check if event exists and belongs to user
    const [rows] = await pool.query(
      'SELECT * FROM events_attended WHERE id = ? AND Userid = ?',
      [req.params.id, req.user.Userid] // ✅ Changed from req.user.id to req.user.Userid
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Event not found or access denied' });
    }
    
    // Delete event
    const [result] = await pool.query(
      'DELETE FROM events_attended WHERE id = ? AND Userid = ?',
      [req.params.id, req.user.Userid] // ✅ Changed from req.user.id to req.user.Userid
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    res.status(200).json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;