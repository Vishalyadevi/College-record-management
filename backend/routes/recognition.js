import express from 'express';
import { pool } from '../db/db.js';
import { authenticate as authenticateToken } from '../middlewares/auth.js';


const router = express.Router();

// Get all recognition entries
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM recognition_appreciation');
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching recognition data:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get recognition entry by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM recognition_appreciation WHERE id = ?', [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Recognition entry not found' });
    }
    
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Error fetching recognition entry:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new recognition entry
router.post('/', authenticateToken, async (req, res) => {
  const { 
    category,
    program_name,
    recognition_date,
    proof_link
  } = req.body;
  
  // Basic validation
  if (!category || !program_name || !recognition_date) {
    return res.status(400).json({ message: 'Required fields missing' });
  }
  
  try {
    // Insert new recognition entry
    const [result] = await pool.query(
      `INSERT INTO recognition_appreciation (
        Userid, category, program_name, recognition_date, proof_link
      ) VALUES (?, ?, ?, ?, ?)`,
      [
        req.user.Userid, category, program_name, recognition_date, proof_link
      ]
    );
    
    res.status(201).json({ 
      message: 'Recognition entry created successfully', 
      id: result.insertId 
    });
  } catch (error) {
    console.error('Error creating recognition entry:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update recognition entry
router.put('/:id', authenticateToken, async (req, res) => {
  const { 
    category,
    program_name,
    recognition_date,
    proof_link
  } = req.body;
  
  // Basic validation
  if (!category || !program_name || !recognition_date) {
    return res.status(400).json({ message: 'Required fields missing' });
  }
  
  try {
    // Check if recognition entry exists
    const [rows] = await pool.query('SELECT * FROM recognition_appreciation WHERE id = ?', [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Recognition entry not found' });
    }
    
    // Update recognition entry
    await pool.query(
      `UPDATE recognition_appreciation SET 
        category = ?, program_name = ?, 
        recognition_date = ?, proof_link = ?
      WHERE id = ?`,
      [
        category, program_name, recognition_date, proof_link, req.params.id
      ]
    );
    
    res.status(200).json({ message: 'Recognition entry updated successfully' });
  } catch (error) {
    console.error('Error updating recognition entry:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete recognition entry
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Check if recognition entry exists
    const [rows] = await pool.query('SELECT * FROM recognition_appreciation WHERE id = ?', [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Recognition entry not found' });
    }
    
    // Delete recognition entry
    await pool.query('DELETE FROM recognition_appreciation WHERE id = ?', [req.params.id]);
    
    res.status(200).json({ message: 'Recognition entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting recognition entry:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;