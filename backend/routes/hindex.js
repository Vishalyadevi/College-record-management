import express from 'express';
import { pool } from '../db/db.js';
import { authenticate as authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

// Get all h-index entries with optional filtering by user
router.get('/', authenticateToken, async (req, res) => {
  try {
    let query = `
      SELECT 
        h.id,
        h.Userid,
        h.faculty_name,
        h.citations,
        h.h_index,
        h.created_at,
        h.updated_at,
        u.username
      FROM h_index h 
      LEFT JOIN users u ON h.Userid = u.Userid
    `;
    
    // If user wants only their entries, add WHERE clause
    const params = [];
    if (req.query.my_entries === 'true') {
      query += ' WHERE h.Userid = ?';
      params.push(req.user.Userid); // ✅ Changed from req.user.id to req.user.Userid
    }
    
    query += ' ORDER BY h.created_at DESC';
    
    const [rows] = await pool.query(query, params);
    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Error fetching h-index data:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while fetching h-index data',
      error: error.message
    });
  }
});

// Get h-index entry by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        h.id,
        h.Userid,
        h.faculty_name,
        h.citations,
        h.h_index,
        h.created_at,
        h.updated_at,
        u.username
      FROM h_index h 
      LEFT JOIN users u ON h.Userid = u.Userid
      WHERE h.id = ?
    `, [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'H-index entry not found' 
      });
    }
    
    res.status(200).json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Error fetching h-index entry:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while fetching h-index entry',
      error: error.message
    });
  }
});

// Create new h-index entry
router.post('/', authenticateToken, async (req, res) => {
  const { 
    faculty_name, 
    citations, 
    h_index
  } = req.body;
  
  try {
    // Debug logging - remove after testing
    console.log('=== H-INDEX DEBUG INFO ===');
    console.log('req.user:', req.user);
    console.log('req.user.Userid:', req.user.Userid);
    console.log('Request body:', req.body);
    
    // Comprehensive validation
    if (!faculty_name || !faculty_name.trim()) {
      return res.status(400).json({ 
        success: false,
        message: 'Faculty name is required and cannot be empty' 
      });
    }
    
    if (citations === undefined || citations === null) {
      return res.status(400).json({ 
        success: false,
        message: 'Citations field is required' 
      });
    }
    
    if (h_index === undefined || h_index === null) {
      return res.status(400).json({ 
        success: false,
        message: 'H-index field is required' 
      });
    }
    
    // Convert to numbers and validate
    const citationsNum = parseInt(citations);
    const hIndexNum = parseInt(h_index);
    
    if (isNaN(citationsNum) || citationsNum < 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Citations must be a non-negative integer' 
      });
    }
    
    if (isNaN(hIndexNum) || hIndexNum < 0) {
      return res.status(400).json({ 
        success: false,
        message: 'H-index must be a non-negative integer' 
      });
    }
    
    // Validate faculty name length
    if (faculty_name.trim().length > 100) {
      return res.status(400).json({ 
        success: false,
        message: 'Faculty name cannot exceed 100 characters' 
      });
    }
    
    // Logical validation: h-index cannot be greater than citations
    if (hIndexNum > citationsNum) {
      return res.status(400).json({ 
        success: false,
        message: 'H-index cannot be greater than total citations' 
      });
    }
    
    // Check if user exists
    const [userCheck] = await pool.query('SELECT Userid FROM users WHERE Userid = ?', [req.user.Userid]); // ✅ Changed
    if (userCheck.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid user' 
      });
    }
    
    // Insert new h-index entry
    const [result] = await pool.query(
      `INSERT INTO h_index (Userid, faculty_name, citations, h_index) 
       VALUES (?, ?, ?, ?)`,
      [req.user.Userid, faculty_name.trim(), citationsNum, hIndexNum] // ✅ Changed from req.user.id
    );
    
    // Fetch the created entry with user details
    const [newEntry] = await pool.query(`
      SELECT 
        h.id,
        h.Userid,
        h.faculty_name,
        h.citations,
        h.h_index,
        h.created_at,
        h.updated_at,
        u.username
      FROM h_index h 
      LEFT JOIN users u ON h.Userid = u.Userid
      WHERE h.id = ?
    `, [result.insertId]);
    
    res.status(201).json({ 
      success: true,
      message: 'H-index entry created successfully', 
      data: newEntry[0]
    });
  } catch (error) {
    console.error('Error creating h-index entry:', error);
    
    // Handle specific database errors
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid user reference' 
      });
    }
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ 
        success: false,
        message: 'Duplicate entry error' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Server error while creating h-index entry',
      error: error.message
    });
  }
});

// Update h-index entry
router.put('/:id', authenticateToken, async (req, res) => {
  const { 
    faculty_name, 
    citations, 
    h_index
  } = req.body;
  
  try {
    // Comprehensive validation
    if (!faculty_name || !faculty_name.trim()) {
      return res.status(400).json({ 
        success: false,
        message: 'Faculty name is required and cannot be empty' 
      });
    }
    
    if (citations === undefined || citations === null) {
      return res.status(400).json({ 
        success: false,
        message: 'Citations field is required' 
      });
    }
    
    if (h_index === undefined || h_index === null) {
      return res.status(400).json({ 
        success: false,
        message: 'H-index field is required' 
      });
    }
    
    // Convert to numbers and validate
    const citationsNum = parseInt(citations);
    const hIndexNum = parseInt(h_index);
    
    if (isNaN(citationsNum) || citationsNum < 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Citations must be a non-negative integer' 
      });
    }
    
    if (isNaN(hIndexNum) || hIndexNum < 0) {
      return res.status(400).json({ 
        success: false,
        message: 'H-index must be a non-negative integer' 
      });
    }
    
    // Validate faculty name length
    if (faculty_name.trim().length > 100) {
      return res.status(400).json({ 
        success: false,
        message: 'Faculty name cannot exceed 100 characters' 
      });
    }
    
    // Logical validation: h-index cannot be greater than citations
    if (hIndexNum > citationsNum) {
      return res.status(400).json({ 
        success: false,
        message: 'H-index cannot be greater than total citations' 
      });
    }
    
    // Check if h-index entry exists
    const [rows] = await pool.query('SELECT * FROM h_index WHERE id = ?', [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'H-index entry not found' 
      });
    }
    
    // Optional: Check if user owns this entry (uncomment if needed)
    // if (rows[0].Userid !== req.user.Userid) {
    //   return res.status(403).json({ 
    //     success: false,
    //     message: 'Unauthorized to update this entry' 
    //   });
    // }
    
    // Update h-index entry
    const [updateResult] = await pool.query(
      `UPDATE h_index SET 
        faculty_name = ?, 
        citations = ?, 
        h_index = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [faculty_name.trim(), citationsNum, hIndexNum, req.params.id]
    );
    
    if (updateResult.affectedRows === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'H-index entry not found or no changes made' 
      });
    }
    
    // Fetch updated entry
    const [updatedEntry] = await pool.query(`
      SELECT 
        h.id,
        h.Userid,
        h.faculty_name,
        h.citations,
        h.h_index,
        h.created_at,
        h.updated_at,
        u.username
      FROM h_index h 
      LEFT JOIN users u ON h.Userid = u.Userid
      WHERE h.id = ?
    `, [req.params.id]);
    
    res.status(200).json({ 
      success: true,
      message: 'H-index entry updated successfully',
      data: updatedEntry[0]
    });
  } catch (error) {
    console.error('Error updating h-index entry:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while updating h-index entry',
      error: error.message
    });
  }
});

// Delete h-index entry
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Check if h-index entry exists
    const [rows] = await pool.query('SELECT * FROM h_index WHERE id = ?', [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'H-index entry not found' 
      });
    }
    
    // Optional: Check if user owns this entry (uncomment if needed)
    // if (rows[0].Userid !== req.user.Userid) { // ✅ Changed from req.user.id
    //   return res.status(403).json({ 
    //     success: false,
    //     message: 'Unauthorized to delete this entry' 
    //   });
    // }
    
    // Delete h-index entry
    const [deleteResult] = await pool.query('DELETE FROM h_index WHERE id = ?', [req.params.id]);
    
    if (deleteResult.affectedRows === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'H-index entry not found' 
      });
    }
    
    res.status(200).json({ 
      success: true,
      message: 'H-index entry deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting h-index entry:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while deleting h-index entry',
      error: error.message
    });
  }
});

// Get h-index statistics (bonus endpoint)
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const [stats] = await pool.query(`
      SELECT 
        COUNT(*) as total_entries,
        AVG(citations) as avg_citations,
        AVG(h_index) as avg_h_index,
        MAX(citations) as max_citations,
        MAX(h_index) as max_h_index,
        MIN(citations) as min_citations,
        MIN(h_index) as min_h_index
      FROM h_index
    `);
    
    // Handle case when there are no entries
    if (stats[0].total_entries === 0) {
      return res.status(200).json({
        success: true,
        data: {
          total_entries: 0,
          avg_citations: 0,
          avg_h_index: 0,
          max_citations: 0,
          max_h_index: 0,
          min_citations: 0,
          min_h_index: 0
        }
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        total_entries: stats[0].total_entries,
        avg_citations: Math.round(stats[0].avg_citations * 100) / 100,
        avg_h_index: Math.round(stats[0].avg_h_index * 100) / 100,
        max_citations: stats[0].max_citations,
        max_h_index: stats[0].max_h_index,
        min_citations: stats[0].min_citations,
        min_h_index: stats[0].min_h_index
      }
    });
  } catch (error) {
    console.error('Error fetching h-index statistics:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while fetching statistics',
      error: error.message
    });
  }
});

export default router;