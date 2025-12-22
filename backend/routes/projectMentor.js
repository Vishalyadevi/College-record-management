import express from 'express';
import { pool } from '../db/db.js';
import { authenticate as authenticateToken} from '../middlewares/auth.js';

const router = express.Router();

// Get all project mentor records
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM project_mentors');
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching project mentor records:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get project mentor record by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM project_mentors WHERE id = ?', [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Project mentor record not found' });
    }
    
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Error fetching project mentor record:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new project mentor record
router.post('/', authenticateToken, async (req, res) => {
  const { 
    project_title,
    student_details,
    event_details,
    participation_status,
    certificate_link,
    proof_link
  } = req.body;
  
  // Basic validation
  if (!project_title || !student_details || !event_details || !participation_status) {
    return res.status(400).json({ message: 'Required fields missing' });
  }
  
  try {
    // Insert new project mentor record
    const [result] = await pool.query(
      `INSERT INTO project_mentors (
        Userid, project_title, student_details, 
        event_details, participation_status, certificate_link, proof_link
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.Userid, project_title, student_details,
        event_details, participation_status, certificate_link || null, proof_link || null
      ]
    );
    
    res.status(201).json({ 
      message: 'Project mentor record created successfully', 
      id: result.insertId 
    });
  } catch (error) {
    console.error('Error creating project mentor record:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update project mentor record
router.put('/:id', authenticateToken, async (req, res) => {
  const { 
    project_title,
    student_details,
    event_details,
    participation_status,
    certificate_link,
    proof_link
  } = req.body;
  
  // Basic validation
  if (!project_title || !student_details || !event_details || !participation_status) {
    return res.status(400).json({ message: 'Required fields missing' });
  }
  
  try {
    // Check if project mentor record exists
    const [rows] = await pool.query('SELECT * FROM project_mentors WHERE id = ?', [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Project mentor record not found' });
    }
    
    // Update project mentor record
    await pool.query(
      `UPDATE project_mentors SET 
        project_title = ?, student_details = ?, 
        event_details = ?, participation_status = ?, certificate_link = ?, proof_link = ?
      WHERE id = ?`,
      [
        project_title, student_details,
        event_details, participation_status, certificate_link || null, proof_link || null, req.params.id
      ]
    );
    
    res.status(200).json({ message: 'Project mentor record updated successfully' });
  } catch (error) {
    console.error('Error updating project mentor record:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete project mentor record
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Check if project mentor record exists
    const [rows] = await pool.query('SELECT * FROM project_mentors WHERE id = ?', [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Project mentor record not found' });
    }
    
    // Delete project mentor record
    await pool.query('DELETE FROM project_mentors WHERE id = ?', [req.params.id]);
    
    res.status(200).json({ message: 'Project mentor record deleted successfully' });
  } catch (error) {
    console.error('Error deleting project mentor record:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;