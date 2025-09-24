import express from 'express';
import { pool } from '../db/db.js';
import { authenticate as authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

// Get all seed money projects
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM seed_money');
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching seed money data:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get seed money project by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM seed_money WHERE id = ?', [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Seed money project not found' });
    }
    
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Error fetching seed money project:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new seed money project
router.post('/', authenticateToken, async (req, res) => {
  const { 
    project_title,
    project_duration,
    amount,
    outcomes,
    proof_link
  } = req.body;
  
  // Basic validation
  if (!project_title || !project_duration || amount === undefined || !outcomes) {
    return res.status(400).json({ message: 'Required fields missing' });
  }
  
  try {
    // Insert new seed money project
    const [result] = await pool.query(
      `INSERT INTO seed_money (
        Userid, project_title, project_duration, amount, outcomes, proof_link
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        req.user.Userid, project_title, project_duration, amount, outcomes, proof_link
      ]
    );
    
    res.status(201).json({ 
      message: 'Seed money project created successfully', 
      id: result.insertId 
    });
  } catch (error) {
    console.error('Error creating seed money project:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update seed money project
router.put('/:id', authenticateToken, async (req, res) => {
  const { 
    project_title,
    project_duration,
    amount,
    outcomes,
    proof_link
  } = req.body;
  
  // Basic validation
  if (!project_title || !project_duration || amount === undefined || !outcomes) {
    return res.status(400).json({ message: 'Required fields missing' });
  }
  
  try {
    // Check if seed money project exists
    const [rows] = await pool.query('SELECT * FROM seed_money WHERE id = ?', [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Seed money project not found' });
    }
    
    // Update seed money project
    await pool.query(
      `UPDATE seed_money SET 
        project_title = ?, project_duration = ?, 
        amount = ?, outcomes = ?, proof_link = ?
      WHERE id = ?`,
      [
        project_title, project_duration, amount, outcomes, proof_link, req.params.id
      ]
    );
    
    res.status(200).json({ message: 'Seed money project updated successfully' });
  } catch (error) {
    console.error('Error updating seed money project:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete seed money project
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Check if seed money project exists
    const [rows] = await pool.query('SELECT * FROM seed_money WHERE id = ?', [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Seed money project not found' });
    }
    
    // Delete seed money project
    await pool.query('DELETE FROM seed_money WHERE id = ?', [req.params.id]);
    
    res.status(200).json({ message: 'Seed money project deleted successfully' });
  } catch (error) {
    console.error('Error deleting seed money project:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;