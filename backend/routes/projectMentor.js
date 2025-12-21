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

// Get all project mentor records
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Select only non-BLOB fields for list view, but include flags for PDF availability
    const [rows] = await pool.query(`
      SELECT
        id,
        Userid,
        project_title,
        student_details,
        event_details,
        participation_status,
        CASE WHEN certificate_link IS NOT NULL THEN true ELSE false END as has_certificate,
        CASE WHEN proof_link IS NOT NULL THEN true ELSE false END as has_proof,
        created_at,
        updated_at
      FROM project_mentors
    `);

    // Add flags for frontend
    const modifiedRows = rows.map(row => ({
      ...row,
      certificate_link: row.has_certificate ? 'available' : null,
      proof_link: row.has_proof ? 'available' : null
    }));

    res.status(200).json(modifiedRows);
  } catch (error) {
    console.error('Error fetching project mentor records:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get project mentor record by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        id,
        Userid,
        project_title,
        student_details,
        event_details,
        participation_status,
        CASE WHEN certificate_link IS NOT NULL THEN true ELSE false END as has_certificate,
        CASE WHEN proof_link IS NOT NULL THEN true ELSE false END as has_proof,
        created_at,
        updated_at
      FROM project_mentors 
      WHERE id = ?
    `, [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Project mentor record not found' });
    }
    
    const row = rows[0];
    res.status(200).json({
      ...row,
      certificate_link: row.has_certificate ? 'available' : null,
      proof_link: row.has_proof ? 'available' : null
    });
  } catch (error) {
    console.error('Error fetching project mentor record:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Serve PDF certificate by project ID
router.get('/certificate/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT certificate_link FROM project_mentors WHERE id = ?', [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const certificateBuffer = rows[0].certificate_link;

    if (!certificateBuffer) {
      return res.status(404).json({ message: 'Certificate file not available' });
    }

    // Set appropriate headers for PDF viewing
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Content-Length', certificateBuffer.length);
    res.setHeader('Cache-Control', 'no-cache');
    
    res.send(certificateBuffer);
  } catch (error) {
    console.error('Error fetching certificate file:', error);
    res.status(500).json({ message: 'Server error while retrieving PDF' });
  }
});

// Serve PDF proof by project ID
router.get('/proof/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT proof_link FROM project_mentors WHERE id = ?', [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const proofBuffer = rows[0].proof_link;

    if (!proofBuffer) {
      return res.status(404).json({ message: 'Proof file not available' });
    }

    // Set appropriate headers for PDF viewing
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

// Create new project mentor record
router.post('/', authenticateToken, memoryUpload.fields([
  { name: 'certificate_link', maxCount: 1 },
  { name: 'proof_link', maxCount: 1 }
]), async (req, res) => {
  const {
    project_title,
    student_details,
    event_details,
    participation_status
  } = req.body;

  console.log('Creating new project mentor record:', { project_title, student_details, event_details, participation_status });
  console.log('Files received:', req.files);

  // Basic validation
  if (!project_title || !student_details || !event_details || !participation_status) {
    return res.status(400).json({ message: 'Required fields missing' });
  }

  // Store the file buffers
  const certificate_link = req.files?.certificate_link?.[0]?.buffer || null;
  const proof_link = req.files?.proof_link?.[0]?.buffer || null;

  try {
    // Insert new project mentor record
    const [result] = await pool.query(
      `INSERT INTO project_mentors (
        Userid, project_title, student_details, 
        event_details, participation_status, certificate_link, proof_link
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.Userid, project_title, student_details,
        event_details, participation_status, certificate_link, proof_link
      ]
    );

    console.log('Successfully created project mentor record with ID:', result.insertId);

    res.status(201).json({ 
      message: 'Project mentor record created successfully', 
      id: result.insertId 
    });
  } catch (error) {
    console.error('Error creating project mentor record:', error);
    res.status(500).json({ message: 'Server error while creating record' });
  }
});

// Update project mentor record
router.put('/:id', authenticateToken, memoryUpload.fields([
  { name: 'certificate_link', maxCount: 1 },
  { name: 'proof_link', maxCount: 1 }
]), async (req, res) => {
  const {
    project_title,
    student_details,
    event_details,
    participation_status
  } = req.body;

  console.log('Updating project mentor record ID:', req.params.id);
  console.log('Update data:', { project_title, student_details, event_details, participation_status });
  console.log('New files received:', req.files);

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

    const existingRecord = rows[0];
    let certificate_link = existingRecord.certificate_link;
    let proof_link = existingRecord.proof_link;

    // If new files uploaded, update the buffers
    if (req.files?.certificate_link?.[0]) {
      certificate_link = req.files.certificate_link[0].buffer;
      console.log('Updating with new certificate PDF');
    }
    
    if (req.files?.proof_link?.[0]) {
      proof_link = req.files.proof_link[0].buffer;
      console.log('Updating with new proof PDF');
    }

    // Update project mentor record
    const [updateResult] = await pool.query(
      `UPDATE project_mentors SET
        project_title = ?, student_details = ?, 
        event_details = ?, participation_status = ?, 
        certificate_link = ?, proof_link = ?
      WHERE id = ?`,
      [
        project_title, student_details,
        event_details, participation_status, certificate_link, proof_link, req.params.id
      ]
    );

    console.log('Update result:', updateResult.affectedRows, 'rows affected');

    res.status(200).json({ message: 'Project mentor record updated successfully' });
  } catch (error) {
    console.error('Error updating project mentor record:', error);
    res.status(500).json({ message: 'Server error while updating record' });
  }
});

// Delete project mentor record
router.delete('/:id', authenticateToken, async (req, res) => {
  const recordId = req.params.id;
  
  console.log('Deleting project mentor record ID:', recordId);
  
  try {
    // Check if project mentor record exists
    const [rows] = await pool.query('SELECT id, project_title FROM project_mentors WHERE id = ?', [recordId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Project mentor record not found' });
    }

    const record = rows[0];
    console.log('Found record to delete:', record.project_title);
 
    // Delete project mentor record (BLOB data will be automatically deleted)
    const [deleteResult] = await pool.query('DELETE FROM project_mentors WHERE id = ?', [recordId]);
    
    console.log('Delete result:', deleteResult.affectedRows, 'rows deleted');

    if (deleteResult.affectedRows === 0) {
      return res.status(404).json({ message: 'Record not found or already deleted' });
    }

    res.status(200).json({ message: 'Project mentor record deleted successfully' });
  } catch (error) {
    console.error('Error deleting project mentor record:', error);
    res.status(500).json({ message: 'Server error while deleting record' });
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