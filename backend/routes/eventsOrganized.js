import express from 'express';
import { pool } from '../db/db.js';
import { authenticate as authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

// Get all events organized entries
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM events_organized WHERE Userid = ? ORDER BY created_at DESC', 
      [req.user.Userid] // ✅ Changed from req.user.id to req.user.Userid
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching events organized data:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get events organized entry by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM events_organized WHERE id = ? AND Userid = ?', 
      [req.params.id, req.user.Userid] // ✅ Changed from req.user.id to req.user.Userid
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Event entry not found' });
    }
    
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Error fetching event entry:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new events organized entry
router.post('/', authenticateToken, async (req, res) => {
  const { 
    program_name, 
    program_title,
    coordinator_name,
    co_coordinator_names,
    speaker_details,
    from_date,
    to_date,
    days,
    sponsored_by,
    amount_sanctioned,
    participants,
    proof_link,
    documentation_link
  } = req.body;
  
  try {
    // Debug logging - remove after testing
    console.log('=== DEBUG INFO ===');
    console.log('req.user:', req.user);
    console.log('req.user.Userid:', req.user.Userid);
    
    // Basic validation
    if (!program_name?.trim() || !program_title?.trim() || !coordinator_name?.trim() || 
        !speaker_details?.trim() || !from_date || !to_date || days === undefined || 
        participants === undefined) {
      return res.status(400).json({ message: 'Required fields missing' });
    }
    
    // Validate dates
    const fromDate = new Date(from_date);
    const toDate = new Date(to_date);
    
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }
    
    if (fromDate > toDate) {
      return res.status(400).json({ message: 'From date cannot be after to date' });
    }
    
    // Validate numeric fields
    const daysCount = parseInt(days);
    if (isNaN(daysCount) || daysCount <= 0) {
      return res.status(400).json({ message: 'Days must be a positive number' });
    }
    
    const participantsCount = parseInt(participants);
    if (isNaN(participantsCount) || participantsCount <= 0) {
      return res.status(400).json({ message: 'Participants must be a positive number' });
    }
    
    // Validate amount sanctioned
    let sanctionedAmount = null;
    if (amount_sanctioned !== undefined && amount_sanctioned !== null && amount_sanctioned !== '') {
      sanctionedAmount = parseFloat(amount_sanctioned);
      if (isNaN(sanctionedAmount) || sanctionedAmount < 0) {
        return res.status(400).json({ message: 'Amount sanctioned must be a non-negative number' });
      }
    }
    
    // Validate string field lengths
    if (program_name.trim().length > 255) {
      return res.status(400).json({ message: 'Program name cannot exceed 255 characters' });
    }
    
    if (program_title.trim().length > 255) {
      return res.status(400).json({ message: 'Program title cannot exceed 255 characters' });
    }
    
    if (coordinator_name.trim().length > 100) {
      return res.status(400).json({ message: 'Coordinator name cannot exceed 100 characters' });
    }
    
    if (sponsored_by && sponsored_by.trim().length > 100) {
      return res.status(400).json({ message: 'Sponsored by field cannot exceed 100 characters' });
    }
    
    // Insert new events organized entry
    const [result] = await pool.query(
      `INSERT INTO events_organized (
        Userid, program_name, program_title, coordinator_name, co_coordinator_names,
        speaker_details, from_date, to_date, days, sponsored_by, amount_sanctioned, 
        participants, proof_link, documentation_link
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.Userid, // ✅ Changed from req.user.id to req.user.Userid
        program_name.trim(), 
        program_title.trim(), 
        coordinator_name.trim(), 
        co_coordinator_names?.trim() || null,
        speaker_details.trim(), 
        from_date, 
        to_date, 
        daysCount, 
        sponsored_by?.trim() || null, 
        sanctionedAmount,
        participantsCount, 
        proof_link?.trim() || null, 
        documentation_link?.trim() || null
      ]
    );
    
    res.status(201).json({ 
      message: 'Event entry created successfully', 
      id: result.insertId 
    });
  } catch (error) {
    console.error('Error creating event entry:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Duplicate entry error' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update events organized entry
router.put('/:id', authenticateToken, async (req, res) => {
  const { 
    program_name, 
    program_title,
    coordinator_name,
    co_coordinator_names,
    speaker_details,
    from_date,
    to_date,
    days,
    sponsored_by,
    amount_sanctioned,
    participants,
    proof_link,
    documentation_link
  } = req.body;
  
  try {
    // Basic validation
    if (!program_name?.trim() || !program_title?.trim() || !coordinator_name?.trim() || 
        !speaker_details?.trim() || !from_date || !to_date || days === undefined || 
        participants === undefined) {
      return res.status(400).json({ message: 'Required fields missing' });
    }
    
    // Validate dates
    const fromDate = new Date(from_date);
    const toDate = new Date(to_date);
    
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }
    
    if (fromDate > toDate) {
      return res.status(400).json({ message: 'From date cannot be after to date' });
    }
    
    // Validate numeric fields
    const daysCount = parseInt(days);
    if (isNaN(daysCount) || daysCount <= 0) {
      return res.status(400).json({ message: 'Days must be a positive number' });
    }
    
    const participantsCount = parseInt(participants);
    if (isNaN(participantsCount) || participantsCount <= 0) {
      return res.status(400).json({ message: 'Participants must be a positive number' });
    }
    
    // Validate amount sanctioned
    let sanctionedAmount = null;
    if (amount_sanctioned !== undefined && amount_sanctioned !== null && amount_sanctioned !== '') {
      sanctionedAmount = parseFloat(amount_sanctioned);
      if (isNaN(sanctionedAmount) || sanctionedAmount < 0) {
        return res.status(400).json({ message: 'Amount sanctioned must be a non-negative number' });
      }
    }
    
    // Validate string field lengths
    if (program_name.trim().length > 255) {
      return res.status(400).json({ message: 'Program name cannot exceed 255 characters' });
    }
    
    if (program_title.trim().length > 255) {
      return res.status(400).json({ message: 'Program title cannot exceed 255 characters' });
    }
    
    if (coordinator_name.trim().length > 100) {
      return res.status(400).json({ message: 'Coordinator name cannot exceed 100 characters' });
    }
    
    if (sponsored_by && sponsored_by.trim().length > 100) {
      return res.status(400).json({ message: 'Sponsored by field cannot exceed 100 characters' });
    }
    
    // Check if events organized entry exists and belongs to user
    const [rows] = await pool.query(
      'SELECT * FROM events_organized WHERE id = ? AND Userid = ?', 
      [req.params.id, req.user.Userid] // ✅ Changed from req.user.id to req.user.Userid
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Event entry not found or access denied' });
    }
    
    // Update events organized entry
    const [result] = await pool.query(
      `UPDATE events_organized SET 
        program_name = ?, program_title = ?, coordinator_name = ?, co_coordinator_names = ?,
        speaker_details = ?, from_date = ?, to_date = ?, days = ?, sponsored_by = ?, amount_sanctioned = ?,
        participants = ?, proof_link = ?, documentation_link = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND Userid = ?`,
      [
        program_name.trim(), 
        program_title.trim(), 
        coordinator_name.trim(), 
        co_coordinator_names?.trim() || null,
        speaker_details.trim(), 
        from_date, 
        to_date, 
        daysCount, 
        sponsored_by?.trim() || null, 
        sanctionedAmount,
        participantsCount, 
        proof_link?.trim() || null, 
        documentation_link?.trim() || null,
        req.params.id, 
        req.user.Userid // ✅ Changed from req.user.id to req.user.Userid
      ]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Event entry not found or no changes made' });
    }
    
    res.status(200).json({ message: 'Event entry updated successfully' });
  } catch (error) {
    console.error('Error updating event entry:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Duplicate entry error' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete events organized entry
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Check if events organized entry exists and belongs to user
    const [rows] = await pool.query(
      'SELECT * FROM events_organized WHERE id = ? AND Userid = ?', 
      [req.params.id, req.user.Userid] // ✅ Changed from req.user.id to req.user.Userid
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Event entry not found or access denied' });
    }
    
    // Delete events organized entry
    const [result] = await pool.query(
      'DELETE FROM events_organized WHERE id = ? AND Userid = ?', 
      [req.params.id, req.user.Userid] // ✅ Changed from req.user.id to req.user.Userid
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Event entry not found' });
    }
    
    res.status(200).json({ message: 'Event entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting event entry:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;