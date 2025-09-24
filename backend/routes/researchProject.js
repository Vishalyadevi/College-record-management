import express from 'express';
import { pool } from '../db/db.js';
import { authenticate as authenticateToken} from '../middlewares/auth.js';

const router = express.Router();

// Get all sponsored research projects
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM sponsored_research');
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching sponsored research projects:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get sponsored research project by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM sponsored_research WHERE id = ?', [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Sponsored research project not found' });
    }
    
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Error fetching sponsored research project:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new sponsored research project
router.post('/', authenticateToken, async (req, res) => {
  const { 
    pi_name,
    co_pi_names,
    department,
    project_title,
    funding_agency,
    duration,
    amount,
    proof
  } = req.body;
  
  // Basic validation
  if (!pi_name || !department || !project_title || !funding_agency || !duration || !amount) {
    return res.status(400).json({ message: 'Required fields missing' });
  }
  
  try {
    // Insert new sponsored research project
    const [result] = await pool.query(
      `INSERT INTO sponsored_research (
        Userid, pi_name, co_pi_names, department, project_title,
        funding_agency, duration, amount, proof
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.Userid, pi_name, co_pi_names || null, department, project_title,
        funding_agency, duration, amount, proof || null
      ]
    );
    
    res.status(201).json({ 
      message: 'Sponsored research project created successfully', 
      id: result.insertId 
    });
  } catch (error) {
    console.error('Error creating sponsored research project:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update sponsored research project
router.put('/:id', authenticateToken, async (req, res) => {
  const { 
    pi_name,
    co_pi_names,
    department,
    project_title,
    funding_agency,
    duration,
    amount,
    proof
  } = req.body;
  
  // Basic validation
  if (!pi_name || !department || !project_title || !funding_agency || !duration || !amount) {
    return res.status(400).json({ message: 'Required fields missing' });
  }
  
  try {
    // Check if sponsored research project exists
    const [rows] = await pool.query('SELECT * FROM sponsored_research WHERE id = ?', [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Sponsored research project not found' });
    }
    
    // Update sponsored research project
    await pool.query(
      `UPDATE sponsored_research SET 
        pi_name = ?, co_pi_names = ?, department = ?, project_title = ?,
        funding_agency = ?, duration = ?, amount = ?, proof = ?
      WHERE id = ?`,
      [
        pi_name, co_pi_names || null, department, project_title,
        funding_agency, duration, amount, proof || null, req.params.id
      ]
    );
    
    res.status(200).json({ message: 'Sponsored research project updated successfully' });
  } catch (error) {
    console.error('Error updating sponsored research project:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete sponsored research project
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Check if sponsored research project exists
    const [rows] = await pool.query('SELECT * FROM sponsored_research WHERE id = ?', [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Sponsored research project not found' });
    }
    
    // Delete sponsored research project
    await pool.query('DELETE FROM sponsored_research WHERE id = ?', [req.params.id]);
    
    res.status(200).json({ message: 'Sponsored research project deleted successfully' });
  } catch (error) {
    console.error('Error deleting sponsored research project:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;