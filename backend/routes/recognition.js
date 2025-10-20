import express from 'express';
import multer from 'multer';
import { pool } from '../db/db.js';
import { authenticate as authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

// Configure multer for PDF uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// Get all recognition entries
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, Userid, category, program_name, recognition_date, proof_link,
       CASE WHEN proof_pdf IS NOT NULL THEN true ELSE false END as has_pdf,
       created_at, updated_at 
       FROM recognition_appreciation`
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching recognition data:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get recognition entry by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, Userid, category, program_name, recognition_date, proof_link,
       CASE WHEN proof_pdf IS NOT NULL THEN true ELSE false END as has_pdf,
       created_at, updated_at 
       FROM recognition_appreciation WHERE id = ?`,
      [req.params.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Recognition entry not found' });
    }
    
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Error fetching recognition entry:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get PDF document
router.get('/:id/pdf', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT proof_pdf FROM recognition_appreciation WHERE id = ?',
      [req.params.id]
    );
    
    if (rows.length === 0 || !rows[0].proof_pdf) {
      return res.status(404).json({ message: 'PDF not found' });
    }
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="recognition_${req.params.id}.pdf"`);
    res.send(rows[0].proof_pdf);
  } catch (error) {
    console.error('Error fetching PDF:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new recognition entry
router.post('/', authenticateToken, upload.single('proof_pdf'), async (req, res) => {
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
    const pdfBuffer = req.file ? req.file.buffer : null;
    
    // Insert new recognition entry
    const [result] = await pool.query(
      `INSERT INTO recognition_appreciation (
        Userid, category, program_name, recognition_date, proof_link, proof_pdf
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        req.user.Userid, 
        category, 
        program_name, 
        recognition_date, 
        proof_link || null,
        pdfBuffer
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
router.put('/:id', authenticateToken, upload.single('proof_pdf'), async (req, res) => {
  const { 
    category,
    program_name,
    recognition_date,
    proof_link,
    remove_pdf
  } = req.body;
  
  // Basic validation
  if (!category || !program_name || !recognition_date) {
    return res.status(400).json({ message: 'Required fields missing' });
  }
  
  try {
    // Check if recognition entry exists
    const [rows] = await pool.query(
      'SELECT * FROM recognition_appreciation WHERE id = ?', 
      [req.params.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Recognition entry not found' });
    }
    
    let query;
    let params;
    
    if (remove_pdf === 'true') {
      // Remove PDF
      query = `UPDATE recognition_appreciation SET 
        category = ?, program_name = ?, 
        recognition_date = ?, proof_link = ?, proof_pdf = NULL
      WHERE id = ?`;
      params = [category, program_name, recognition_date, proof_link || null, req.params.id];
    } else if (req.file) {
      // Update with new PDF
      query = `UPDATE recognition_appreciation SET 
        category = ?, program_name = ?, 
        recognition_date = ?, proof_link = ?, proof_pdf = ?
      WHERE id = ?`;
      params = [category, program_name, recognition_date, proof_link || null, req.file.buffer, req.params.id];
    } else {
      // Update without changing PDF
      query = `UPDATE recognition_appreciation SET 
        category = ?, program_name = ?, 
        recognition_date = ?, proof_link = ?
      WHERE id = ?`;
      params = [category, program_name, recognition_date, proof_link || null, req.params.id];
    }
    
    await pool.query(query, params);
    
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
    const [rows] = await pool.query(
      'SELECT * FROM recognition_appreciation WHERE id = ?', 
      [req.params.id]
    );
    
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