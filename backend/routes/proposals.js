import express from 'express';
import { pool } from '../db/db.js';
import { authenticate as authenticateToken} from '../middlewares/auth.js';


const router = express.Router();

// Get all proposals
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM consultancy_proposals');
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching proposals:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get proposal by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM consultancy_proposals WHERE id = ?', [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Proposal not found' });
    }
    
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Error fetching proposal:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new proposal
router.post('/', authenticateToken, async (req, res) => {
  const { 
    pi_name, 
    co_pi_names, 
    project_title, 
    industry, 
    from_date, 
    to_date, 
    amount, 
    proof,
    organization_name 
  } = req.body;
  
  // Basic validation
  if (!pi_name || !project_title || !industry || !from_date || !to_date || !amount || !organization_name) {
    return res.status(400).json({ message: 'Required fields missing' });
  }
  
  try {
    // Insert new proposal
    const [result] = await pool.query(
      `INSERT INTO consultancy_proposals (
        Userid, pi_name, co_pi_names, project_title, industry, 
        from_date, to_date, amount, proof, organization_name
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.Userid, pi_name, co_pi_names, project_title, industry,
        from_date, to_date, amount, proof, organization_name
      ]
    );
    
    res.status(201).json({ 
      message: 'Proposal created successfully', 
      id: result.insertId 
    });
  } catch (error) {
    console.error('Error creating proposal:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update proposal
router.put('/:id', authenticateToken, async (req, res) => {
  const { 
    pi_name, 
    co_pi_names, 
    project_title, 
    industry, 
    from_date, 
    to_date, 
    amount, 
    proof,
    organization_name 
  } = req.body;
  
  // Basic validation
  if (!pi_name || !project_title || !industry || !from_date || !to_date || !amount || !organization_name) {
    return res.status(400).json({ message: 'Required fields missing' });
  }
  
  try {
    // Check if proposal exists
    const [rows] = await pool.query('SELECT * FROM consultancy_proposals WHERE id = ?', [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Proposal not found' });
    }
    
    // Update proposal
    await pool.query(
      `UPDATE consultancy_proposals SET 
        pi_name = ?, co_pi_names = ?, project_title = ?, industry = ?, 
        from_date = ?, to_date = ?, amount = ?, proof = ?, organization_name = ?
      WHERE id = ?`,
      [
        pi_name, co_pi_names, project_title, industry,
        from_date, to_date, amount, proof, organization_name, req.params.id
      ]
    );
    
    res.status(200).json({ message: 'Proposal updated successfully' });
  } catch (error) {
    console.error('Error updating proposal:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete proposal
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Check if proposal exists
    const [rows] = await pool.query('SELECT * FROM consultancy_proposals WHERE id = ?', [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Proposal not found' });
    }
    
    // Delete proposal
    await pool.query('DELETE FROM consultancy_proposals WHERE id = ?', [req.params.id]);
    
    res.status(200).json({ message: 'Proposal deleted successfully' });
  } catch (error) {
    console.error('Error deleting proposal:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;