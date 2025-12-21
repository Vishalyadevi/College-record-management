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

// Validation helper function
const validatePatentData = (data) => {
  const errors = [];
  
  if (!data.project_title || data.project_title.trim().length === 0) {
    errors.push('Project title is required');
  } else if (data.project_title.length > 255) {
    errors.push('Project title must be less than 255 characters');
  }
  
  if (!data.patent_status || data.patent_status.trim().length === 0) {
    errors.push('Patent status is required');
  } else if (data.patent_status.length > 50) {
    errors.push('Patent status must be less than 50 characters');
  }
  
  if (!data.month_year || data.month_year.trim().length === 0) {
    errors.push('Month year is required');
  } else if (data.month_year.length > 50) {
    errors.push('Month year must be less than 50 characters');
  }
  
  return errors;
};

// Get all patent/product entries
router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 100, 100);
    const offset = (page - 1) * limit;
    
    // Select only non-BLOB fields for list view, but include flags for PDF availability
    const [rows] = await pool.query(`
      SELECT
        id,
        Userid,
        project_title,
        patent_status,
        month_year,
        CASE WHEN patent_proof_link IS NOT NULL THEN true ELSE false END as patent_proof_link,
        working_model,
        CASE WHEN working_model_proof_link IS NOT NULL THEN true ELSE false END as working_model_proof_link,
        prototype_developed,
        CASE WHEN prototype_proof_link IS NOT NULL THEN true ELSE false END as prototype_proof_link,
        created_at,
        updated_at
      FROM patent_product
      WHERE Userid = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, [req.user.Userid, limit, offset]);

    // Modify rows to show 'available' for proof links
    const modifiedRows = rows.map(row => ({
      ...row,
      patent_proof_link: row.patent_proof_link ? 'available' : null,
      working_model_proof_link: row.working_model_proof_link ? 'available' : null,
      prototype_proof_link: row.prototype_proof_link ? 'available' : null
    }));
    
    res.status(200).json(modifiedRows);
  } catch (error) {
    console.error('Error fetching patent/product data:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Serve PDF proof by project ID and type
router.get('/proof/:id/:type', authenticateToken, async (req, res) => {
  try {
    const { id, type } = req.params;
    
    let columnName;
    if (type === 'patent') {
      columnName = 'patent_proof_link';
    } else if (type === 'working_model') {
      columnName = 'working_model_proof_link';
    } else if (type === 'prototype') {
      columnName = 'prototype_proof_link';
    } else {
      return res.status(400).json({ message: 'Invalid proof type' });
    }

    const [rows] = await pool.query(
      `SELECT ${columnName} FROM patent_product WHERE id = ? AND Userid = ?`,
      [id, req.user.Userid]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Patent entry not found' });
    }

    const proofBuffer = rows[0][columnName];

    if (!proofBuffer) {
      return res.status(404).json({ message: 'PDF file not available' });
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

// Get patent/product entry by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!id || id <= 0) {
      return res.status(400).json({ message: 'Invalid ID provided' });
    }
    
    const [rows] = await pool.query(
      `SELECT
        id,
        Userid,
        project_title,
        patent_status,
        month_year,
        CASE WHEN patent_proof_link IS NOT NULL THEN true ELSE false END as patent_proof_link,
        working_model,
        CASE WHEN working_model_proof_link IS NOT NULL THEN true ELSE false END as working_model_proof_link,
        prototype_developed,
        CASE WHEN prototype_proof_link IS NOT NULL THEN true ELSE false END as prototype_proof_link,
        created_at,
        updated_at
      FROM patent_product 
      WHERE id = ? AND Userid = ?`,
      [id, req.user.Userid]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Patent/product entry not found' });
    }
    
    res.status(200).json({ data: rows[0] });
  } catch (error) {
    console.error('Error fetching patent/product entry:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new patent/product entry
router.post('/', authenticateToken, memoryUpload.fields([
  { name: 'patent_proof_link', maxCount: 1 },
  { name: 'working_model_proof_link', maxCount: 1 },
  { name: 'prototype_proof_link', maxCount: 1 }
]), async (req, res) => {
  const { 
    project_title,
    patent_status,
    month_year,
    working_model,
    prototype_developed
  } = req.body;
  
  console.log('Creating new patent entry:', { project_title, patent_status, month_year, working_model, prototype_developed });
  console.log('Files received:', req.files);
  
  // Validate input data
  const validationErrors = validatePatentData(req.body);
  if (validationErrors.length > 0) {
    return res.status(400).json({ 
      message: 'Validation failed',
      errors: validationErrors
    });
  }
  
  // Validate required file upload for patent proof
  if (!req.files || !req.files['patent_proof_link']) {
    return res.status(400).json({ message: 'Patent proof document is required' });
  }
  
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Get file buffers
    const patentProofBuffer = req.files['patent_proof_link'] ? req.files['patent_proof_link'][0].buffer : null;
    const workingModelProofBuffer = req.files['working_model_proof_link'] ? req.files['working_model_proof_link'][0].buffer : null;
    const prototypeProofBuffer = req.files['prototype_proof_link'] ? req.files['prototype_proof_link'][0].buffer : null;
    
    // Insert new patent/product entry
    const [result] = await connection.query(
      `INSERT INTO patent_product (
        Userid, project_title, patent_status, month_year,
        patent_proof_link, working_model, working_model_proof_link,
        prototype_developed, prototype_proof_link
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.Userid, 
        project_title.trim(), 
        patent_status.trim(), 
        month_year.trim(),
        patentProofBuffer,
        working_model === 'true' || working_model === true,
        workingModelProofBuffer,
        prototype_developed === 'true' || prototype_developed === true,
        prototypeProofBuffer
      ]
    );
    
    await connection.commit();
    
    console.log('Successfully created patent entry with ID:', result.insertId);
    
    res.status(201).json({ 
      message: 'Patent/product entry created successfully', 
      id: result.insertId
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating patent/product entry:', error);
    
    if (error.code === 'ER_DATA_TOO_LONG') {
      return res.status(400).json({ message: 'Data too long for one or more fields' });
    }
    
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ message: 'Invalid user reference' });
    }
    
    res.status(500).json({ message: 'Server error' });
  } finally {
    connection.release();
  }
});

// Update patent/product entry
router.put('/:id', authenticateToken, memoryUpload.fields([
  { name: 'patent_proof_link', maxCount: 1 },
  { name: 'working_model_proof_link', maxCount: 1 },
  { name: 'prototype_proof_link', maxCount: 1 }
]), async (req, res) => {
  const id = parseInt(req.params.id);
  if (!id || id <= 0) {
    return res.status(400).json({ message: 'Invalid ID provided' });
  }
  
  const { 
    project_title,
    patent_status,
    month_year,
    working_model,
    prototype_developed
  } = req.body;
  
  console.log('Updating patent entry ID:', id);
  console.log('Update data:', { project_title, patent_status, month_year, working_model, prototype_developed });
  console.log('New files received:', req.files);
  
  // Validate input data
  const validationErrors = validatePatentData(req.body);
  if (validationErrors.length > 0) {
    return res.status(400).json({ 
      message: 'Validation failed',
      errors: validationErrors
    });
  }
  
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Check if patent/product entry exists and belongs to user
    const [rows] = await connection.query(
      'SELECT patent_proof_link, working_model_proof_link, prototype_proof_link FROM patent_product WHERE id = ? AND Userid = ?', 
      [id, req.user.Userid]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        message: 'Patent/product entry not found or access denied' 
      });
    }
    
    const existingEntry = rows[0];
    
    // Get new file buffers or keep existing ones
    const patentProofBuffer = req.files && req.files['patent_proof_link'] 
      ? req.files['patent_proof_link'][0].buffer 
      : existingEntry.patent_proof_link;
      
    const workingModelProofBuffer = req.files && req.files['working_model_proof_link']
      ? req.files['working_model_proof_link'][0].buffer
      : existingEntry.working_model_proof_link;
      
    const prototypeProofBuffer = req.files && req.files['prototype_proof_link']
      ? req.files['prototype_proof_link'][0].buffer
      : existingEntry.prototype_proof_link;
    
    // Update patent/product entry
    await connection.query(
      `UPDATE patent_product SET 
        project_title = ?, 
        patent_status = ?, 
        month_year = ?,
        patent_proof_link = ?, 
        working_model = ?, 
        working_model_proof_link = ?,
        prototype_developed = ?, 
        prototype_proof_link = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND Userid = ?`,
      [
        project_title.trim(), 
        patent_status.trim(), 
        month_year.trim(),
        patentProofBuffer,
        working_model === 'true' || working_model === true,
        workingModelProofBuffer,
        prototype_developed === 'true' || prototype_developed === true,
        prototypeProofBuffer,
        id,
        req.user.Userid
      ]
    );
    
    await connection.commit();
    
    console.log('Successfully updated patent entry');
    
    res.status(200).json({ 
      message: 'Patent/product entry updated successfully'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating patent/product entry:', error);
    
    if (error.code === 'ER_DATA_TOO_LONG') {
      return res.status(400).json({ message: 'Data too long for one or more fields' });
    }
    
    res.status(500).json({ message: 'Server error' });
  } finally {
    connection.release();
  }
});

// Delete patent/product entry
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!id || id <= 0) {
      return res.status(400).json({ message: 'Invalid ID provided' });
    }
    
    console.log('Deleting patent entry ID:', id);
    
    // Check if patent/product entry exists and belongs to user
    const [rows] = await pool.query(
      'SELECT id, project_title FROM patent_product WHERE id = ? AND Userid = ?', 
      [id, req.user.Userid]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        message: 'Patent/product entry not found or access denied' 
      });
    }
    
    console.log('Found entry to delete:', rows[0].project_title);
    
    // Delete patent/product entry (BLOB data will be automatically deleted)
    const [result] = await pool.query(
      'DELETE FROM patent_product WHERE id = ? AND Userid = ?', 
      [id, req.user.Userid]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Entry not found or already deleted' });
    }
    
    console.log('Successfully deleted patent entry');
    
    res.status(200).json({ 
      message: 'Patent/product entry deleted successfully',
      deletedId: id
    });
  } catch (error) {
    console.error('Error deleting patent/product entry:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get patent/product statistics
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    const [stats] = await pool.query(`
      SELECT 
        COUNT(*) as total_entries,
        SUM(CASE WHEN working_model = true THEN 1 ELSE 0 END) as entries_with_working_model,
        SUM(CASE WHEN prototype_developed = true THEN 1 ELSE 0 END) as entries_with_prototype,
        COUNT(DISTINCT patent_status) as unique_statuses
      FROM patent_product 
      WHERE Userid = ?
    `, [req.user.Userid]);
    
    const [statusBreakdown] = await pool.query(`
      SELECT 
        patent_status,
        COUNT(*) as count
      FROM patent_product 
      WHERE Userid = ?
      GROUP BY patent_status
      ORDER BY count DESC
    `, [req.user.Userid]);
    
    res.status(200).json({
      summary: stats[0],
      statusBreakdown
    });
  } catch (error) {
    console.error('Error fetching patent/product statistics:', error);
    res.status(500).json({ message: 'Server error' });
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