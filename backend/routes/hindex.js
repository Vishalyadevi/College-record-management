import express from 'express';
import { pool } from '../db/db.js';
import { authenticate as authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

// Helper function to extract user ID (handles Sequelize models)
const getUserId = (req) => {
  return req.user?.Userid || req.user?.dataValues?.Userid || req.user?.id;
};

// Get all h-index entries
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = getUserId(req);
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication error: User ID not found' });
    }

    const [rows] = await pool.query(`
      SELECT 
        h.id,
        h.Userid,
        h.citations,
        h.h_index,
        h.i_index,
        h.google_citations,
        h.scopus_citations,
        h.created_at,
        h.updated_at,
        u.username
      FROM h_index h 
      LEFT JOIN users u ON h.Userid = u.Userid
      WHERE h.Userid = ?
      ORDER BY h.created_at DESC
    `, [userId]);
    
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching h-index data:', error);
    res.status(500).json({ 
      message: 'Server error while fetching h-index data',
      error: error.message
    });
  }
});

// Get h-index entry by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = getUserId(req);
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication error: User ID not found' });
    }

    const [rows] = await pool.query(`
      SELECT 
        h.id,
        h.Userid,
        h.citations,
        h.h_index,
        h.i_index,
        h.google_citations,
        h.scopus_citations,
        h.created_at,
        h.updated_at,
        u.username
      FROM h_index h 
      LEFT JOIN users u ON h.Userid = u.Userid
      WHERE h.id = ? AND h.Userid = ?
    `, [req.params.id, userId]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'H-index entry not found' });
    }
    
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Error fetching h-index entry:', error);
    res.status(500).json({ 
      message: 'Server error while fetching h-index entry',
      error: error.message
    });
  }
});

// Create new h-index entry
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = getUserId(req);
    
    if (!userId) {
      console.error('CRITICAL: No user ID found in request');
      console.error('req.user:', req.user);
      return res.status(401).json({ message: 'Authentication error: User ID not found' });
    }

    const { 
      citations, 
      h_index,
      i_index,
      google_citations,
      scopus_citations
    } = req.body;

    console.log('=== H-INDEX DEBUG INFO ===');
    console.log('Using Userid:', userId);
    console.log('Request body:', req.body);
    
    // Comprehensive validation
    if (citations === undefined || citations === null || citations === '') {
      return res.status(400).json({ message: 'Citations field is required' });
    }
    
    if (h_index === undefined || h_index === null || h_index === '') {
      return res.status(400).json({ message: 'H-index field is required' });
    }
    
    if (i_index === undefined || i_index === null || i_index === '') {
      return res.status(400).json({ message: 'I-index field is required' });
    }
    
    if (google_citations === undefined || google_citations === null || google_citations === '') {
      return res.status(400).json({ message: 'Google citations field is required' });
    }
    
    if (scopus_citations === undefined || scopus_citations === null || scopus_citations === '') {
      return res.status(400).json({ message: 'Scopus citations field is required' });
    }
    
    // Convert to numbers and validate
    const citationsNum = parseInt(citations);
    const hIndexNum = parseInt(h_index);
    const iIndexNum = parseFloat(i_index);
    const googleCitationsNum = parseInt(google_citations);
    const scopusCitationsNum = parseInt(scopus_citations);
    
    if (isNaN(citationsNum) || citationsNum < 0) {
      return res.status(400).json({ message: 'Citations must be a non-negative integer' });
    }
    
    if (isNaN(hIndexNum) || hIndexNum < 0) {
      return res.status(400).json({ message: 'H-index must be a non-negative integer' });
    }
    
    if (isNaN(iIndexNum) || iIndexNum < 0) {
      return res.status(400).json({ message: 'I-index must be a non-negative number' });
    }
    
    if (isNaN(googleCitationsNum) || googleCitationsNum < 0) {
      return res.status(400).json({ message: 'Google citations must be a non-negative integer' });
    }
    
    if (isNaN(scopusCitationsNum) || scopusCitationsNum < 0) {
      return res.status(400).json({ message: 'Scopus citations must be a non-negative integer' });
    }
    
    // Logical validation: h-index cannot be greater than citations
    if (hIndexNum > citationsNum) {
      return res.status(400).json({ message: 'H-index cannot be greater than total citations' });
    }
    
    // Insert new h-index entry
    const [result] = await pool.query(
      `INSERT INTO h_index (Userid, citations, h_index, i_index, google_citations, scopus_citations) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, citationsNum, hIndexNum, iIndexNum, googleCitationsNum, scopusCitationsNum]
    );
    
    console.log('=== Insert Result ===');
    console.log('Insert ID:', result.insertId);
    
    res.status(201).json({ 
      message: 'H-index entry created successfully', 
      id: result.insertId
    });
  } catch (error) {
    console.error('Error creating h-index entry:', error);
    
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ message: 'Invalid user reference' });
    }
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Duplicate entry error' });
    }
    
    res.status(500).json({ 
      message: 'Server error while creating h-index entry',
      error: error.message
    });
  }
});

// Update h-index entry
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = getUserId(req);
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication error: User ID not found' });
    }

    const { 
      citations, 
      h_index,
      i_index,
      google_citations,
      scopus_citations
    } = req.body;
    
    // Comprehensive validation
    if (citations === undefined || citations === null || citations === '') {
      return res.status(400).json({ message: 'Citations field is required' });
    }
    
    if (h_index === undefined || h_index === null || h_index === '') {
      return res.status(400).json({ message: 'H-index field is required' });
    }
    
    if (i_index === undefined || i_index === null || i_index === '') {
      return res.status(400).json({ message: 'I-index field is required' });
    }
    
    if (google_citations === undefined || google_citations === null || google_citations === '') {
      return res.status(400).json({ message: 'Google citations field is required' });
    }
    
    if (scopus_citations === undefined || scopus_citations === null || scopus_citations === '') {
      return res.status(400).json({ message: 'Scopus citations field is required' });
    }
    
    // Convert to numbers and validate
    const citationsNum = parseInt(citations);
    const hIndexNum = parseInt(h_index);
    const iIndexNum = parseFloat(i_index);
    const googleCitationsNum = parseInt(google_citations);
    const scopusCitationsNum = parseInt(scopus_citations);
    
    if (isNaN(citationsNum) || citationsNum < 0) {
      return res.status(400).json({ message: 'Citations must be a non-negative integer' });
    }
    
    if (isNaN(hIndexNum) || hIndexNum < 0) {
      return res.status(400).json({ message: 'H-index must be a non-negative integer' });
    }
    
    if (isNaN(iIndexNum) || iIndexNum < 0) {
      return res.status(400).json({ message: 'I-index must be a non-negative number' });
    }
    
    if (isNaN(googleCitationsNum) || googleCitationsNum < 0) {
      return res.status(400).json({ message: 'Google citations must be a non-negative integer' });
    }
    
    if (isNaN(scopusCitationsNum) || scopusCitationsNum < 0) {
      return res.status(400).json({ message: 'Scopus citations must be a non-negative integer' });
    }
    
    // Logical validation: h-index cannot be greater than citations
    if (hIndexNum > citationsNum) {
      return res.status(400).json({ message: 'H-index cannot be greater than total citations' });
    }
    
    // Check if h-index entry exists and belongs to user
    const [rows] = await pool.query(
      'SELECT * FROM h_index WHERE id = ? AND Userid = ?',
      [req.params.id, userId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'H-index entry not found or access denied' });
    }
    
    // Update h-index entry
    const [updateResult] = await pool.query(
      `UPDATE h_index SET 
        citations = ?, 
        h_index = ?,
        i_index = ?,
        google_citations = ?,
        scopus_citations = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND Userid = ?`,
      [citationsNum, hIndexNum, iIndexNum, googleCitationsNum, scopusCitationsNum, req.params.id, userId]
    );
    
    if (updateResult.affectedRows === 0) {
      return res.status(404).json({ message: 'H-index entry not found or no changes made' });
    }
    
    res.status(200).json({ message: 'H-index entry updated successfully' });
  } catch (error) {
    console.error('Error updating h-index entry:', error);
    res.status(500).json({ 
      message: 'Server error while updating h-index entry',
      error: error.message
    });
  }
});

// Delete h-index entry
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = getUserId(req);
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication error: User ID not found' });
    }

    // Check if h-index entry exists and belongs to user
    const [rows] = await pool.query(
      'SELECT * FROM h_index WHERE id = ? AND Userid = ?',
      [req.params.id, userId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'H-index entry not found or access denied' });
    }
    
    // Delete h-index entry
    const [deleteResult] = await pool.query(
      'DELETE FROM h_index WHERE id = ? AND Userid = ?',
      [req.params.id, userId]
    );
    
    if (deleteResult.affectedRows === 0) {
      return res.status(404).json({ message: 'H-index entry not found' });
    }
    
    res.status(200).json({ message: 'H-index entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting h-index entry:', error);
    res.status(500).json({ 
      message: 'Server error while deleting h-index entry',
      error: error.message
    });
  }
});

// Get h-index statistics
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const userId = getUserId(req);
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication error: User ID not found' });
    }

    const [stats] = await pool.query(`
      SELECT 
        COUNT(*) as total_entries,
        AVG(citations) as avg_citations,
        AVG(h_index) as avg_h_index,
        AVG(i_index) as avg_i_index,
        AVG(google_citations) as avg_google_citations,
        AVG(scopus_citations) as avg_scopus_citations,
        MAX(citations) as max_citations,
        MAX(h_index) as max_h_index,
        MAX(i_index) as max_i_index,
        MAX(google_citations) as max_google_citations,
        MAX(scopus_citations) as max_scopus_citations,
        MIN(citations) as min_citations,
        MIN(h_index) as min_h_index,
        MIN(i_index) as min_i_index,
        MIN(google_citations) as min_google_citations,
        MIN(scopus_citations) as min_scopus_citations
      FROM h_index
      WHERE Userid = ?
    `, [userId]);
    
    if (stats[0].total_entries === 0) {
      return res.status(200).json({
        total_entries: 0,
        avg_citations: 0,
        avg_h_index: 0,
        avg_i_index: 0,
        avg_google_citations: 0,
        avg_scopus_citations: 0,
        max_citations: 0,
        max_h_index: 0,
        max_i_index: 0,
        max_google_citations: 0,
        max_scopus_citations: 0,
        min_citations: 0,
        min_h_index: 0,
        min_i_index: 0,
        min_google_citations: 0,
        min_scopus_citations: 0
      });
    }
    
    res.status(200).json({
      total_entries: stats[0].total_entries,
      avg_citations: Math.round(stats[0].avg_citations * 100) / 100,
      avg_h_index: Math.round(stats[0].avg_h_index * 100) / 100,
      avg_i_index: Math.round(stats[0].avg_i_index * 100) / 100,
      avg_google_citations: Math.round(stats[0].avg_google_citations * 100) / 100,
      avg_scopus_citations: Math.round(stats[0].avg_scopus_citations * 100) / 100,
      max_citations: stats[0].max_citations,
      max_h_index: stats[0].max_h_index,
      max_i_index: Math.round(stats[0].max_i_index * 100) / 100,
      max_google_citations: stats[0].max_google_citations,
      max_scopus_citations: stats[0].max_scopus_citations,
      min_citations: stats[0].min_citations,
      min_h_index: stats[0].min_h_index,
      min_i_index: Math.round(stats[0].min_i_index * 100) / 100,
      min_google_citations: stats[0].min_google_citations,
      min_scopus_citations: stats[0].min_scopus_citations
    });
  } catch (error) {
    console.error('Error fetching h-index statistics:', error);
    res.status(500).json({ 
      message: 'Server error while fetching statistics',
      error: error.message
    });
  }
});

export default router;