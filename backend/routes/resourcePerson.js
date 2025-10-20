import express from 'express';
import { pool } from '../db/db.js';
import {authenticate as authenticateToken} from '../middlewares/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = 'uploads/resource_person';
if (!fs.existsSync(uploadsDir)){
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept images and PDFs
  const allowedMimes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf', 'image/gif', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PNG, JPEG, PDF, GIF, and WebP files are allowed.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Get all resource person entries
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM resource_person');
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching resource person data:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get resource person entry by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM resource_person WHERE id = ?', [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Resource person entry not found' });
    }
    
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Error fetching resource person entry:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new resource person entry
router.post('/', authenticateToken, upload.fields([
  { name: 'proofFile', maxCount: 1 },
  { name: 'photoFile', maxCount: 1 }
]), async (req, res) => {
  const { 
    program_specification,
    title,
    venue,
    event_date
  } = req.body;
  
  // Basic validation
  if (!program_specification || !title || !venue || !event_date) {
    // Clean up uploaded files if validation fails
    if (req.files?.proofFile) fs.unlinkSync(req.files.proofFile[0].path);
    if (req.files?.photoFile) fs.unlinkSync(req.files.photoFile[0].path);
    return res.status(400).json({ message: 'Required fields missing' });
  }
  
  try {
    const proof_link = req.files?.proofFile ? req.files.proofFile[0].filename : null;
    const photo_link = req.files?.photoFile ? req.files.photoFile[0].filename : null;

    // Insert new resource person entry
    const [result] = await pool.query(
      `INSERT INTO resource_person (
        Userid, program_specification, title, venue, 
        event_date, proof_link, photo_link
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.Userid, program_specification, title, venue,
        event_date, proof_link, photo_link
      ]
    );
    
    res.status(201).json({ 
      message: 'Resource person entry created successfully', 
      id: result.insertId 
    });
  } catch (error) {
    // Clean up uploaded files on error
    if (req.files?.proofFile) fs.unlinkSync(req.files.proofFile[0].path);
    if (req.files?.photoFile) fs.unlinkSync(req.files.photoFile[0].path);
    
    console.error('Error creating resource person entry:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update resource person entry
router.put('/:id', authenticateToken, upload.fields([
  { name: 'proofFile', maxCount: 1 },
  { name: 'photoFile', maxCount: 1 }
]), async (req, res) => {
  const { 
    program_specification,
    title,
    venue,
    event_date
  } = req.body;
  
  // Basic validation
  if (!program_specification || !title || !venue || !event_date) {
    // Clean up uploaded files if validation fails
    if (req.files?.proofFile) fs.unlinkSync(req.files.proofFile[0].path);
    if (req.files?.photoFile) fs.unlinkSync(req.files.photoFile[0].path);
    return res.status(400).json({ message: 'Required fields missing' });
  }
  
  try {
    // Check if resource person entry exists
    const [rows] = await pool.query('SELECT * FROM resource_person WHERE id = ?', [req.params.id]);
    
    if (rows.length === 0) {
      // Clean up uploaded files
      if (req.files?.proofFile) fs.unlinkSync(req.files.proofFile[0].path);
      if (req.files?.photoFile) fs.unlinkSync(req.files.photoFile[0].path);
      return res.status(404).json({ message: 'Resource person entry not found' });
    }

    const existingEntry = rows[0];
    let proof_link = existingEntry.proof_link;
    let photo_link = existingEntry.photo_link;

    // Handle proof file
    if (req.files?.proofFile) {
      // Delete old proof file
      if (existingEntry.proof_link) {
        const oldPath = path.join(uploadsDir, existingEntry.proof_link);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      proof_link = req.files.proofFile[0].filename;
    }

    // Handle photo file
    if (req.files?.photoFile) {
      // Delete old photo file
      if (existingEntry.photo_link) {
        const oldPath = path.join(uploadsDir, existingEntry.photo_link);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      photo_link = req.files.photoFile[0].filename;
    }
    
    // Update resource person entry
    await pool.query(
      `UPDATE resource_person SET 
        program_specification = ?, title = ?, venue = ?,
        event_date = ?, proof_link = ?, photo_link = ?
      WHERE id = ?`,
      [
        program_specification, title, venue,
        event_date, proof_link, photo_link, req.params.id
      ]
    );
    
    res.status(200).json({ message: 'Resource person entry updated successfully' });
  } catch (error) {
    // Clean up uploaded files on error
    if (req.files?.proofFile) fs.unlinkSync(req.files.proofFile[0].path);
    if (req.files?.photoFile) fs.unlinkSync(req.files.photoFile[0].path);
    
    console.error('Error updating resource person entry:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete resource person entry
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Check if resource person entry exists
    const [rows] = await pool.query('SELECT * FROM resource_person WHERE id = ?', [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Resource person entry not found' });
    }

    const entry = rows[0];

    // Delete associated files
    if (entry.proof_link) {
      const proofPath = path.join(uploadsDir, entry.proof_link);
      if (fs.existsSync(proofPath)) fs.unlinkSync(proofPath);
    }
    if (entry.photo_link) {
      const photoPath = path.join(uploadsDir, entry.photo_link);
      if (fs.existsSync(photoPath)) fs.unlinkSync(photoPath);
    }
    
    // Delete resource person entry
    await pool.query('DELETE FROM resource_person WHERE id = ?', [req.params.id]);
    
    res.status(200).json({ message: 'Resource person entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting resource person entry:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Download file endpoint
router.get('/download/:filename', authenticateToken, (req, res) => {
  try {
    const filename = req.params.filename;
    const filepath = path.join(uploadsDir, filename);

    // Security check - prevent directory traversal
    if (!filepath.startsWith(path.resolve(uploadsDir))) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    res.download(filepath);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;