import express from 'express';
import { pool } from '../db/db.js';
import { authenticate as authenticateToken } from '../middlewares/auth.js';



const router = express.Router();

// Get all project proposals
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM project_proposals WHERE Userid = ? ORDER BY created_at DESC', [req.user.Userid]);
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching project proposals:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get project proposal by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM project_proposals WHERE id = ? AND Userid = ?', 
      [req.params.id, req.user.Userid]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Project proposal not found' });
    }
    
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Error fetching project proposal:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new project proposal
router.post('/', authenticateToken, async (req, res) => {
  const { 
    pi_name, 
    co_pi_names, 
    project_title, 
    funding_agency, 
    from_date, 
    to_date, 
    amount, 
    proof,
    organization_name 
  } = req.body;
  
  // Basic validation
  if (!pi_name || !project_title || !funding_agency || !from_date || !to_date || !amount || !organization_name) {
    return res.status(400).json({ message: 'Required fields missing' });
  }
  
  try {
    // Insert new project proposal
    const [result] = await pool.query(
      `INSERT INTO project_proposals (
        Userid, pi_name, co_pi_names, project_title, funding_agency, 
        from_date, to_date, amount, proof, organization_name
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.Userid, pi_name, co_pi_names, project_title, funding_agency,
        from_date, to_date, amount, proof, organization_name
      ]
    );
    
    res.status(201).json({ 
      message: 'Project proposal created successfully', 
      id: result.insertId 
    });
  } catch (error) {
    console.error('Error creating project proposal:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update project proposal
router.put('/:id', authenticateToken, async (req, res) => {
  const { 
    pi_name, 
    co_pi_names, 
    project_title, 
    funding_agency, 
    from_date, 
    to_date, 
    amount, 
    proof,
    organization_name 
  } = req.body;
  
  // Basic validation
  if (!pi_name || !project_title || !funding_agency || !from_date || !to_date || !amount || !organization_name) {
    return res.status(400).json({ message: 'Required fields missing' });
  }
  
  try {
    // Check if project proposal exists and belongs to user
    const [rows] = await pool.query(
      'SELECT * FROM project_proposals WHERE id = ? AND Userid = ?', 
      [req.params.id, req.user.Userid]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Project proposal not found' });
    }
    
    // Update project proposal
    await pool.query(
      `UPDATE project_proposals SET 
        pi_name = ?, co_pi_names = ?, project_title = ?, funding_agency = ?, 
        from_date = ?, to_date = ?, amount = ?, proof = ?, organization_name = ?
      WHERE id = ? AND Userid = ?`,
      [
        pi_name, co_pi_names, project_title, funding_agency,
        from_date, to_date, amount, proof, organization_name, req.params.id, req.user.Userid
      ]
    );
    
    res.status(200).json({ message: 'Project proposal updated successfully' });
  } catch (error) {
    console.error('Error updating project proposal:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete project proposal
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Check if project proposal exists and belongs to user
    const [rows] = await pool.query(
      'SELECT * FROM project_proposals WHERE id = ? AND Userid = ?', 
      [req.params.id, req.user.Userid]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Project proposal not found' });
    }
    
    // Delete project proposal (payment details will be deleted by cascade)
    await pool.query('DELETE FROM project_proposals WHERE id = ? AND Userid = ?', [req.params.id, req.user.Userid]);
    
    res.status(200).json({ message: 'Project proposal deleted successfully' });
  } catch (error) {
    console.error('Error deleting project proposal:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;