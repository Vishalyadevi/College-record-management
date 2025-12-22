import express from 'express';
import { pool } from '../db/db.js';
import { authenticate as authenticateToken } from '../middlewares/auth.js';

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
  
  // Validate URLs if provided
  const urlFields = ['patent_proof_link', 'working_model_proof_link', 'prototype_proof_link'];
  urlFields.forEach(field => {
    if (data[field] && data[field].trim()) {
      try {
        new URL(data[field]);
      } catch {
        errors.push(`${field} must be a valid URL`);
      }
    }
  });
  
  return errors;
};

// Get all patent/product entries with pagination and filtering
router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 100); // Max 100 items per page
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status || '';
    
    let query = 'SELECT * FROM patent_product WHERE Userid = ?';
    let countQuery = 'SELECT COUNT(*) as total FROM patent_product WHERE Userid = ?';
    const params = [req.user.Userid];
    const countParams = [req.user.Userid];
    
    // Add search filter
    if (search) {
      query += ' AND project_title LIKE ?';
      countQuery += ' AND project_title LIKE ?';
      params.push(`%${search}%`);
      countParams.push(`%${search}%`);
    }
    
    // Add status filter
    if (status) {
      query += ' AND patent_status = ?';
      countQuery += ' AND patent_status = ?';
      params.push(status);
      countParams.push(status);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const [rows] = await pool.query(query, params);
    const [countResult] = await pool.query(countQuery, countParams);
    const total = countResult[0].total;
    
    res.status(200).json({
      data: rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching patent/product data:', error);
    res.status(500).json({ message: 'Server error' });
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
      'SELECT * FROM patent_product WHERE id = ? AND Userid = ?', 
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
router.post('/', authenticateToken, async (req, res) => {
  const { 
    project_title,
    patent_status,
    month_year,
    patent_proof_link,
    working_model,
    working_model_proof_link,
    prototype_developed,
    prototype_proof_link
  } = req.body;
  
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
        patent_proof_link ? patent_proof_link.trim() : null, 
        Boolean(working_model), 
        working_model_proof_link ? working_model_proof_link.trim() : null,
        Boolean(prototype_developed), 
        prototype_proof_link ? prototype_proof_link.trim() : null
      ]
    );
    
    // Fetch the created entry to return complete data
    const [newEntry] = await connection.query(
      'SELECT * FROM patent_product WHERE id = ?',
      [result.insertId]
    );
    
    await connection.commit();
    
    res.status(201).json({ 
      message: 'Patent/product entry created successfully', 
      data: newEntry[0]
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating patent/product entry:', error);
    
    // Handle specific database errors
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
router.put('/:id', authenticateToken, async (req, res) => {
  const id = parseInt(req.params.id);
  if (!id || id <= 0) {
    return res.status(400).json({ message: 'Invalid ID provided' });
  }
  
  const { 
    project_title,
    patent_status,
    month_year,
    patent_proof_link,
    working_model,
    working_model_proof_link,
    prototype_developed,
    prototype_proof_link
  } = req.body;
  
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
      'SELECT * FROM patent_product WHERE id = ? AND Userid = ?', 
      [id, req.user.Userid]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        message: 'Patent/product entry not found or access denied' 
      });
    }
    
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
        patent_proof_link ? patent_proof_link.trim() : null, 
        Boolean(working_model), 
        working_model_proof_link ? working_model_proof_link.trim() : null,
        Boolean(prototype_developed), 
        prototype_proof_link ? prototype_proof_link.trim() : null, 
        id,
        req.user.Userid
      ]
    );
    
    // Fetch updated entry to return complete data
    const [updatedEntry] = await connection.query(
      'SELECT * FROM patent_product WHERE id = ?',
      [id]
    );
    
    await connection.commit();
    
    res.status(200).json({ 
      message: 'Patent/product entry updated successfully',
      data: updatedEntry[0]
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating patent/product entry:', error);
    
    // Handle specific database errors
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
    
    // Check if patent/product entry exists and belongs to user
    const [rows] = await pool.query(
      'SELECT * FROM patent_product WHERE id = ? AND Userid = ?', 
      [id, req.user.Userid]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        message: 'Patent/product entry not found or access denied' 
      });
    }
    
    // Delete patent/product entry
    const [result] = await pool.query(
      'DELETE FROM patent_product WHERE id = ? AND Userid = ?', 
      [id, req.user.Userid]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Entry not found or already deleted' });
    }
    
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
    
    // Get status breakdown
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

// Bulk operations endpoint
router.post('/bulk/delete', authenticateToken, async (req, res) => {
  const { ids } = req.body;
  
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ message: 'Invalid or empty IDs array' });
  }
  
  if (ids.length > 100) {
    return res.status(400).json({ message: 'Cannot delete more than 100 entries at once' });
  }
  
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Validate all IDs belong to the user
    const placeholders = ids.map(() => '?').join(',');
    const [rows] = await connection.query(
      `SELECT id FROM patent_product WHERE id IN (${placeholders}) AND Userid = ?`,
      [...ids, req.user.Userid]
    );
    
    const validIds = rows.map(row => row.id);
    
    if (validIds.length === 0) {
      return res.status(404).json({ message: 'No valid entries found to delete' });
    }
    
    // Delete entries
    const deletePlaceholders = validIds.map(() => '?').join(',');
    const [result] = await connection.query(
      `DELETE FROM patent_product WHERE id IN (${deletePlaceholders}) AND Userid = ?`,
      [...validIds, req.user.Userid]
    );
    
    await connection.commit();
    
    res.status(200).json({
      message: `${result.affectedRows} entries deleted successfully`,
      deletedIds: validIds,
      skippedIds: ids.filter(id => !validIds.includes(id))
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error in bulk delete:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    connection.release();
  }
});

export default router;