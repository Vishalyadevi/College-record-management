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

// Get all proposals
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM consultancy_proposals WHERE Userid = ? ORDER BY created_at DESC',
      [req.user.Userid]
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching proposals:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get proposal by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM consultancy_proposals WHERE id = ? AND Userid = ?',
      [req.params.id, req.user.Userid]
    );
    
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
router.post('/', authenticateToken, memoryUpload.fields([
  { name: 'proof', maxCount: 1 },
  { name: 'yearly_report', maxCount: 1 },
  { name: 'order_copy', maxCount: 1 },
  { name: 'final_report', maxCount: 1 }
]), async (req, res) => {
  const { 
    pi_name, 
    co_pi_names, 
    project_title, 
    industry, 
    from_date, 
    to_date, 
    amount, 
    organization_name 
  } = req.body;
  
  // Basic validation
  if (!pi_name || !project_title || !industry || !from_date || !to_date || !amount || !organization_name) {
    return res.status(400).json({ message: 'Required fields missing' });
  }

  // Date validation
  if (new Date(to_date) <= new Date(from_date)) {
    return res.status(400).json({ message: 'To date must be greater than from date' });
  }

  // Ensure req.files is defined
  if (!req.files) {
    req.files = {};
  }

  // Extract file buffers if uploaded
  const proofBuffer = req.files['proof'] ? req.files['proof'][0].buffer : null;
  const yearlyReportBuffer = req.files['yearly_report'] ? req.files['yearly_report'][0].buffer : null;
  const orderCopyBuffer = req.files['order_copy'] ? req.files['order_copy'][0].buffer : null;
  const finalReportBuffer = req.files['final_report'] ? req.files['final_report'][0].buffer : null;
  
  try {
    // Insert new proposal
    const [result] = await pool.query(
      `INSERT INTO consultancy_proposals (
        Userid, pi_name, co_pi_names, project_title, industry, 
        from_date, to_date, amount, proof, yearly_report, order_copy, 
        final_report, organization_name
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.Userid, pi_name, co_pi_names, project_title, industry,
        from_date, to_date, amount, proofBuffer, yearlyReportBuffer, 
        orderCopyBuffer, finalReportBuffer, organization_name
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
router.put('/:id', authenticateToken, memoryUpload.fields([
  { name: 'proof', maxCount: 1 },
  { name: 'yearly_report', maxCount: 1 },
  { name: 'order_copy', maxCount: 1 },
  { name: 'final_report', maxCount: 1 }
]), async (req, res) => {
  const { 
    pi_name, 
    co_pi_names, 
    project_title, 
    industry, 
    from_date, 
    to_date, 
    amount, 
    organization_name 
  } = req.body;
  
  // Basic validation
  if (!pi_name || !project_title || !industry || !from_date || !to_date || !amount || !organization_name) {
    return res.status(400).json({ message: 'Required fields missing' });
  }

  // Date validation
  if (new Date(to_date) <= new Date(from_date)) {
    return res.status(400).json({ message: 'To date must be greater than from date' });
  }

  // Ensure req.files is defined
  if (!req.files) {
    req.files = {};
  }

  try {
    // Check if proposal exists and belongs to user
    const [rows] = await pool.query(
      'SELECT * FROM consultancy_proposals WHERE id = ? AND Userid = ?',
      [req.params.id, req.user.Userid]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Proposal not found' });
    }

    const existingProposal = rows[0];

    // Extract file buffers if uploaded, else keep existing
    const proofBuffer = req.files['proof'] ? req.files['proof'][0].buffer : existingProposal.proof;
    const yearlyReportBuffer = req.files['yearly_report'] ? req.files['yearly_report'][0].buffer : existingProposal.yearly_report;
    const orderCopyBuffer = req.files['order_copy'] ? req.files['order_copy'][0].buffer : existingProposal.order_copy;
    const finalReportBuffer = req.files['final_report'] ? req.files['final_report'][0].buffer : existingProposal.final_report;
    
    // Update proposal
    await pool.query(
      `UPDATE consultancy_proposals SET 
        pi_name = ?, co_pi_names = ?, project_title = ?, industry = ?, 
        from_date = ?, to_date = ?, amount = ?, proof = ?, yearly_report = ?, 
        order_copy = ?, final_report = ?, organization_name = ?
      WHERE id = ? AND Userid = ?`,
      [
        pi_name, co_pi_names, project_title, industry,
        from_date, to_date, amount, proofBuffer, yearlyReportBuffer,
        orderCopyBuffer, finalReportBuffer, organization_name,
        req.params.id, req.user.Userid
      ]
    );
    
    res.status(200).json({ message: 'Proposal updated successfully' });
  } catch (error) {
    console.error('Error updating proposal:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Serve proof PDF by proposal ID
router.get('/proof/:id', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT proof FROM consultancy_proposals WHERE id = ? AND Userid = ?',
      [req.params.id, req.user.Userid]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Proposal not found' });
    }

    const proofBuffer = rows[0].proof;

    if (!proofBuffer) {
      return res.status(404).json({ message: 'PDF file not available' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Content-Length', proofBuffer.length);
    res.setHeader('Cache-Control', 'no-cache');
    res.send(proofBuffer);
  } catch (error) {
    console.error('Error fetching proof file:', error);
    res.status(500).json({ message: 'Server error while retrieving PDF' });
  }
});

// Serve yearly report PDF by proposal ID
router.get('/yearly-report/:id', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT yearly_report FROM consultancy_proposals WHERE id = ? AND Userid = ?',
      [req.params.id, req.user.Userid]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Proposal not found' });
    }

    const yearlyReportBuffer = rows[0].yearly_report;

    if (!yearlyReportBuffer) {
      return res.status(404).json({ message: 'Yearly report PDF not available' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Content-Length', yearlyReportBuffer.length);
    res.setHeader('Cache-Control', 'no-cache');
    res.send(yearlyReportBuffer);
  } catch (error) {
    console.error('Error fetching yearly report file:', error);
    res.status(500).json({ message: 'Server error while retrieving PDF' });
  }
});

// Serve order copy PDF by proposal ID
router.get('/order-copy/:id', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT order_copy FROM consultancy_proposals WHERE id = ? AND Userid = ?',
      [req.params.id, req.user.Userid]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Proposal not found' });
    }

    const orderCopyBuffer = rows[0].order_copy;

    if (!orderCopyBuffer) {
      return res.status(404).json({ message: 'Order copy PDF not available' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Content-Length', orderCopyBuffer.length);
    res.setHeader('Cache-Control', 'no-cache');
    res.send(orderCopyBuffer);
  } catch (error) {
    console.error('Error fetching order copy file:', error);
    res.status(500).json({ message: 'Server error while retrieving PDF' });
  }
});

// Serve final report PDF by proposal ID
router.get('/final-report/:id', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT final_report FROM consultancy_proposals WHERE id = ? AND Userid = ?',
      [req.params.id, req.user.Userid]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Proposal not found' });
    }

    const finalReportBuffer = rows[0].final_report;

    if (!finalReportBuffer) {
      return res.status(404).json({ message: 'Final report PDF not available' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Content-Length', finalReportBuffer.length);
    res.setHeader('Cache-Control', 'no-cache');
    res.send(finalReportBuffer);
  } catch (error) {
    console.error('Error fetching final report file:', error);
    res.status(500).json({ message: 'Server error while retrieving PDF' });
  }
});

// Delete proposal
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Check if proposal exists and belongs to user
    const [rows] = await pool.query(
      'SELECT * FROM consultancy_proposals WHERE id = ? AND Userid = ?',
      [req.params.id, req.user.Userid]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Proposal not found' });
    }
    
    // Delete proposal (payment details will be deleted by cascade)
    await pool.query(
      'DELETE FROM consultancy_proposals WHERE id = ? AND Userid = ?',
      [req.params.id, req.user.Userid]
    );
    
    res.status(200).json({ message: 'Proposal deleted successfully' });
  } catch (error) {
    console.error('Error deleting proposal:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;