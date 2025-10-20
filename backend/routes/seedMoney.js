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

// Get all seed money projects
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Select only non-BLOB fields for list view, but include a flag for PDF availability
    const [rows] = await pool.query(`
      SELECT
        id,
        Userid,
        project_title,
        project_duration,
        from_date,
        to_date,
        amount,
        outcomes,
        CASE WHEN proof_link IS NOT NULL THEN true ELSE false END as has_proof,
        created_at,
        updated_at
      FROM seed_money
    `);

    // Add proof_link flag for frontend
    const modifiedRows = rows.map(row => ({
      ...row,
      proof_link: row.has_proof ? 'available' : null
    }));

    res.status(200).json(modifiedRows);
  } catch (error) {
    console.error('Error fetching seed money data:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Serve PDF proof by project ID
router.get('/proof/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT proof_link FROM seed_money WHERE id = ?', [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const proofBuffer = rows[0].proof_link;

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

// Create new seed money project
router.post('/', authenticateToken, memoryUpload.single('proof_link'), async (req, res) => {
  const {
    project_title,
    project_duration,
    from_date,
    to_date,
    amount,
    outcomes
  } = req.body;

  console.log('Creating new seed money project:', { project_title, project_duration, from_date, to_date, amount, outcomes });
  console.log('File received:', req.file ? `${req.file.originalname} (${req.file.size} bytes)` : 'No file');

  // Basic validation
  if (!project_title || !project_duration || !from_date || !to_date || !amount || !outcomes) {
    return res.status(400).json({ message: 'Required fields missing: project_title, project_duration, from_date, to_date, amount, outcomes' });
  }

  // Validate file upload for new entries
  if (!req.file) {
    return res.status(400).json({ message: 'PDF proof document is required' });
  }

  // Store the file buffer in the database
  const proof_link = req.file.buffer;

  try {
    // Insert new seed money project
    const [result] = await pool.query(
      `INSERT INTO seed_money (
        Userid, project_title, project_duration, from_date, to_date, amount, outcomes, proof_link
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.Userid, project_title, project_duration, from_date, to_date, amount, outcomes, proof_link
      ]
    );

    console.log('Successfully created seed money project with ID:', result.insertId);

    res.status(201).json({
      message: 'Seed money project created successfully',
      id: result.insertId
    });
  } catch (error) {
    console.error('Error creating seed money project:', error);
    res.status(500).json({ message: 'Server error while creating project' });
  }
});

// Update seed money project
router.put('/:id', authenticateToken, memoryUpload.single('proof_link'), async (req, res) => {
  const {
    project_title,
    project_duration,
    from_date,
    to_date,
    amount,
    outcomes
  } = req.body;

  console.log('Updating seed money project ID:', req.params.id);
  console.log('Update data:', { project_title, project_duration, from_date, to_date, amount, outcomes });
  console.log('New file received:', req.file ? `${req.file.originalname} (${req.file.size} bytes)` : 'No new file');

  // Basic validation
  if (!project_title || !project_duration || !from_date || !to_date || !amount || !outcomes) {
    return res.status(400).json({ message: 'Required fields missing: project_title, project_duration, from_date, to_date, amount, outcomes' });
  }

  try {
    // Check if seed money project exists
    const [rows] = await pool.query('SELECT * FROM seed_money WHERE id = ?', [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Seed money project not found' });
    }

    const existingProject = rows[0];
    let proof_link = existingProject.proof_link;

    // If new file uploaded, update the buffer
    if (req.file) {
      proof_link = req.file.buffer;
      console.log('Updating with new PDF file');
    } else {
      console.log('No new file provided, keeping existing PDF');
    }

    // Update seed money project
    const [updateResult] = await pool.query(
      `UPDATE seed_money SET
        project_title = ?, project_duration = ?, from_date = ?, to_date = ?,
        amount = ?, outcomes = ?, proof_link = ?
      WHERE id = ?`,
      [
        project_title, project_duration, from_date, to_date, amount, outcomes, proof_link, req.params.id
      ]
    );

    console.log('Update result:', updateResult.affectedRows, 'rows affected');

    res.status(200).json({ message: 'Seed money project updated successfully' });
  } catch (error) {
    console.error('Error updating seed money project:', error);
    res.status(500).json({ message: 'Server error while updating project' });
  }
});

// Delete seed money project
router.delete('/:id', authenticateToken, async (req, res) => {
  const projectId = req.params.id;
  
  console.log('Deleting seed money project ID:', projectId);
  
  try {
    // Check if seed money project exists
    const [rows] = await pool.query('SELECT id, project_title FROM seed_money WHERE id = ?', [projectId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Seed money project not found' });
    }

    const project = rows[0];
    console.log('Found project to delete:', project.project_title);
 
    // Delete seed money project (BLOB data will be automatically deleted)
    const [deleteResult] = await pool.query('DELETE FROM seed_money WHERE id = ?', [projectId]);
    
    console.log('Delete result:', deleteResult.affectedRows, 'rows deleted');

    if (deleteResult.affectedRows === 0) {
      return res.status(404).json({ message: 'Project not found or already deleted' });
    }

    res.status(200).json({ message: 'Seed money project deleted successfully' });
  } catch (error) {
    console.error('Error deleting seed money project:', error);
    res.status(500).json({ message: 'Server error while deleting project' });
  }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File size too large. Maximum size is 10MB.' });
    }
  }
  if (error.message === 'Only PDF files are allowed') {
    return res.status(400).json({ message: 'Only PDF files are allowed' });
  }
  next(error);
});

export default router;