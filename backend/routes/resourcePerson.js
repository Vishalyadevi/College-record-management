import express from 'express';
import { pool } from '../db/db.js';
import {authenticate as authenticateToken} from '../middlewares/auth.js';


const router = express.Router();

// Get all resource person entries
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM resource_person');
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching resource person data:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get resource person entry by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM resource_person WHERE id = ?', [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Resource person entry not found' });
    }
    
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Error fetching resource person entry:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new resource person entry
router.post('/', authenticateToken, async (req, res) => {
  const { 
    program_specification,
    title,
    venue,
    event_date,
    proof_link,
    photo_link
  } = req.body;
  
  // Basic validation
  if (!program_specification || !title || !venue || !event_date) {
    return res.status(400).json({ message: 'Required fields missing' });
  }
  
  try {
    // Insert new resource person entry
    const [result] = await pool.query(
      `INSERT INTO resource_person (
        Userid, program_specification, title, venue, 
        event_date, proof_link, photo_link
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.Userid, program_specification, title, venue,
        event_date, proof_link, photo_link
      ]
    );
    
    res.status(201).json({ 
      message: 'Resource person entry created successfully', 
      id: result.insertId 
    });
  } catch (error) {
    console.error('Error creating resource person entry:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update resource person entry
router.put('/:id', authenticateToken, async (req, res) => {
  const { 
    program_specification,
    title,
    venue,
    event_date,
    proof_link,
    photo_link
  } = req.body;
  
  // Basic validation
  if (!program_specification || !title || !venue || !event_date) {
    return res.status(400).json({ message: 'Required fields missing' });
  }
  
  try {
    // Check if resource person entry exists
    const [rows] = await pool.query('SELECT * FROM resource_person WHERE id = ?', [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Resource person entry not found' });
    }
    
    // Update resource person entry
    await pool.query(
      `UPDATE resource_person SET 
        program_specification = ?, title = ?, venue = ?,
        event_date = ?, proof_link = ?, photo_link = ?
      WHERE id = ?`,
      [
        program_specification, title, venue,
        event_date, proof_link, photo_link, req.params.id
      ]
    );
    
    res.status(200).json({ message: 'Resource person entry updated successfully' });
  } catch (error) {
    console.error('Error updating resource person entry:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete resource person entry
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Check if resource person entry exists
    const [rows] = await pool.query('SELECT * FROM resource_person WHERE id = ?', [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Resource person entry not found' });
    }
    
    // Delete resource person entry
    await pool.query('DELETE FROM resource_person WHERE id = ?', [req.params.id]);
    
    res.status(200).json({ message: 'Resource person entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting resource person entry:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;