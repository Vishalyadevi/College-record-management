
import express from 'express';
import multer from 'multer';
import { pool } from '../db/db.js';
import { authenticate as authenticateToken } from '../middlewares/auth.js';

// Configure multer for memory storage (for BLOB storage)
const memoryUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

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
router.post('/', authenticateToken, memoryUpload.fields([
  { name: 'proof', maxCount: 1 },
  { name: 'yearly_report', maxCount: 1 },
  { name: 'final_report', maxCount: 1 }
]), async (req, res) => {
  const { 
    pi_name, 
    co_pi_names, 
    project_title, 
    funding_agency, 
    from_date, 
    to_date, 
    amount, 
    organization_name 
  } = req.body;
  
  // Basic validation
  if (!pi_name || !project_title || !funding_agency || !from_date || !to_date || !amount || !organization_name) {
    return res.status(400).json({ message: 'Required fields missing' });
  }
  
  // Extract file buffers if uploaded
  const proofBuffer = req.files['proof'] ? req.files['proof'][0].buffer : null;
  const yearlyReportBuffer = req.files['yearly_report'] ? req.files['yearly_report'][0].buffer : null;
  const finalReportBuffer = req.files['final_report'] ? req.files['final_report'][0].buffer : null;
  
  try {
    // Insert new project proposal
    const [result] = await pool.query(
      `INSERT INTO project_proposals (
        Userid, pi_name, co_pi_names, project_title, funding_agency, 
        from_date, to_date, amount, proof, yearly_report, final_report, organization_name
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.Userid, pi_name, co_pi_names, project_title, funding_agency,
        from_date, to_date, amount, proofBuffer, yearlyReportBuffer, finalReportBuffer, organization_name
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
router.put('/:id', authenticateToken, memoryUpload.fields([
  { name: 'proof', maxCount: 1 },
  { name: 'yearly_report', maxCount: 1 },
  { name: 'final_report', maxCount: 1 }
]), async (req, res) => {
  const { 
    pi_name, 
    co_pi_names, 
    project_title, 
    funding_agency, 
    from_date, 
    to_date, 
    amount, 
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
    
    const existingProposal = rows[0];
    
    // Extract file buffers if uploaded, else keep existing
    const proofBuffer = req.files['proof'] ? req.files['proof'][0].buffer : existingProposal.proof;
    const yearlyReportBuffer = req.files['yearly_report'] ? req.files['yearly_report'][0].buffer : existingProposal.yearly_report;
    const finalReportBuffer = req.files['final_report'] ? req.files['final_report'][0].buffer : existingProposal.final_report;
    
    // Update project proposal
    await pool.query(
      `UPDATE project_proposals SET 
        pi_name = ?, co_pi_names = ?, project_title = ?, funding_agency = ?, 
        from_date = ?, to_date = ?, amount = ?, proof = ?, yearly_report = ?, final_report = ?, organization_name = ?
      WHERE id = ? AND Userid = ?`,
      [
        pi_name, co_pi_names, project_title, funding_agency,
        from_date, to_date, amount, proofBuffer, yearlyReportBuffer, finalReportBuffer, organization_name, req.params.id, req.user.Userid
      ]
    );
    
    res.status(200).json({ message: 'Project proposal updated successfully' });
  } catch (error) {
    console.error('Error updating project proposal:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Serve proof PDF by project ID
router.get('/proof/:id', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT proof FROM project_proposals WHERE id = ? AND Userid = ?', [req.params.id, req.user.Userid]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Project proposal not found' });
    }

    const proofBuffer = rows[0].proof;

    if (!proofBuffer) {
      return res.status(404).json({ message: 'PDF file not available' });
    }

    // Set appropriate headers for PDF viewing
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline'); // Allow viewing in browser
    res.setHeader('Content-Length', proofBuffer.length);
    res.setHeader('Cache-Control', 'no-cache'); // Prevent caching issues

    // Send the buffer data
    res.send(proofBuffer);

  } catch (error) {
    console.error('Error fetching proof file:', error);
    res.status(500).json({ message: 'Server error while retrieving PDF' });
  }
});

// Serve yearly report PDF by project ID
router.get('/yearly-report/:id', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT yearly_report FROM project_proposals WHERE id = ? AND Userid = ?', [req.params.id, req.user.Userid]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Project proposal not found' });
    }

    const yearlyReportBuffer = rows[0].yearly_report;

    if (!yearlyReportBuffer) {
      return res.status(404).json({ message: 'Yearly report PDF not available' });
    }

    // Set appropriate headers for PDF viewing
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline'); // Allow viewing in browser
    res.setHeader('Content-Length', yearlyReportBuffer.length);
    res.setHeader('Cache-Control', 'no-cache'); // Prevent caching issues

    // Send the buffer data
    res.send(yearlyReportBuffer);

  } catch (error) {
    console.error('Error fetching yearly report file:', error);
    res.status(500).json({ message: 'Server error while retrieving PDF' });
  }
});

// Serve final report PDF by project ID
router.get('/final-report/:id', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT final_report FROM project_proposals WHERE id = ? AND Userid = ?', [req.params.id, req.user.Userid]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Project proposal not found' });
    }

    const finalReportBuffer = rows[0].final_report;

    if (!finalReportBuffer) {
      return res.status(404).json({ message: 'Final report PDF not available' });
    }

    // Set appropriate headers for PDF viewing
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline'); // Allow viewing in browser
    res.setHeader('Content-Length', finalReportBuffer.length);
    res.setHeader('Cache-Control', 'no-cache'); // Prevent caching issues

    // Send the buffer data
    res.send(finalReportBuffer);

  } catch (error) {
    console.error('Error fetching final report file:', error);
    res.status(500).json({ message: 'Server error while retrieving PDF' });
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
