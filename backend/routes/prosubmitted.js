import express from 'express';
import { pool } from '../db/db.js';
import { authenticate as authenticateToken } from '../middlewares/auth.js';



const router = express.Router();


// Get all proposal submissions
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM proposals_submitted');
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching proposal submissions:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get proposal submission by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM proposals_submitted WHERE id = ?', [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Proposal submission not found' });
    }
    
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Error fetching proposal submission:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new proposal submission
router.post('/', authenticateToken, async (req, res) => {
  const { 
    faculty_name, 
    student_name,
    register_number,
    project_title,
    funding_agency,
    project_duration,
    amount,
    proof_link,
    department
  } = req.body;
  
  // Basic validation
  if (!faculty_name || !student_name || !project_title || !funding_agency || !project_duration || amount === undefined || !department) {
    return res.status(400).json({ message: 'Required fields missing' });
  }
  
  try {
    // Insert new proposal submission
    const [result] = await pool.query(
      `INSERT INTO proposals_submitted (
        Userid, faculty_name, student_name, register_number, project_title,
        funding_agency, project_duration, amount, proof_link, department
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.Userid, faculty_name, student_name, register_number, project_title,
        funding_agency, project_duration, amount, proof_link, department
      ]
    );
    
    res.status(201).json({ 
      message: 'Proposal submission created successfully', 
      id: result.insertId 
    });
  } catch (error) {
    console.error('Error creating proposal submission:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update proposal submission
router.put('/:id', authenticateToken, async (req, res) => {
  const { 
    faculty_name, 
    student_name,
    register_number,
    project_title,
    funding_agency,
    project_duration,
    amount,
    proof_link,
    department
  } = req.body;
  
  // Basic validation
  if (!faculty_name || !student_name || !project_title || !funding_agency || !project_duration || amount === undefined || !department) {
    return res.status(400).json({ message: 'Required fields missing' });
  }
  
  try {
    // Check if proposal submission exists
    const [rows] = await pool.query('SELECT * FROM proposals_submitted WHERE id = ?', [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Proposal submission not found' });
    }
    
    // Update proposal submission
    await pool.query(
      `UPDATE proposals_submitted SET 
        faculty_name = ?, student_name = ?, register_number = ?, project_title = ?,
        funding_agency = ?, project_duration = ?, amount = ?, proof_link = ?, department = ?
      WHERE id = ?`,
      [
        faculty_name, student_name, register_number, project_title,
        funding_agency, project_duration, amount, proof_link, department, req.params.id
      ]
    );
    
    res.status(200).json({ message: 'Proposal submission updated successfully' });
  } catch (error) {
    console.error('Error updating proposal submission:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete proposal submission
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Check if proposal submission exists
    const [rows] = await pool.query('SELECT * FROM proposals_submitted WHERE id = ?', [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Proposal submission not found' });
    }
    
    // Delete proposal submission
    await pool.query('DELETE FROM proposals_submitted WHERE id = ?', [req.params.id]);
    
    res.status(200).json({ message: 'Proposal submission deleted successfully' });
  } catch (error) {
    console.error('Error deleting proposal submission:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;