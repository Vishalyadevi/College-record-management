import express from 'express';
import { pool } from '../db/db.js';
import { authenticate as authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

// Helper function to get user ID from different possible sources
const getUserId = (req) => {
  return req.user?.id || req.user?.Userid || req.user?.userId || req.body.Userid;
};

// Get all book chapters/publications
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = getUserId(req);
    
    if (!userId) {
      return res.status(401).json({ message: 'User ID not found' });
    }
    
    const [rows] = await pool.query(
      'SELECT * FROM book_chapters WHERE Userid = ? ORDER BY created_at DESC', 
      [userId]
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching publications:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get publication by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = getUserId(req);
    
    if (!userId) {
      return res.status(401).json({ message: 'User ID not found' });
    }
    
    const [rows] = await pool.query(
      'SELECT * FROM book_chapters WHERE id = ? AND Userid = ?', 
      [req.params.id, userId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Publication not found' });
    }
    
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Error fetching publication:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new publication
router.post('/', authenticateToken, async (req, res) => {
  // Debug: Log req.user to see what's available
  console.log('req.user:', req.user);
  console.log('req.body:', req.body);
  
  const { 
    publication_type,
    publication_name, 
    publication_title, 
    authors, 
    index_type, 
    doi, 
    citations, 
    publisher,
    page_no,
    publication_date,
    impact_factor,
    publication_link
  } = req.body;
  
  // Basic validation
  if (!publication_name || !publication_title || !authors || !index_type || !publication_date) {
    return res.status(400).json({ 
      message: 'Required fields missing: publication_name, publication_title, authors, index_type, publication_date' 
    });
  }

  // Validate publication_type enum
  const validPublicationTypes = ['journal', 'book_chapter', 'conference'];
  if (publication_type && !validPublicationTypes.includes(publication_type)) {
    return res.status(400).json({ 
      message: 'Invalid publication_type. Must be one of: journal, book_chapter, conference' 
    });
  }

  // Validate index_type enum
  const validIndexTypes = ['Scopus', 'SCI', 'SCIE', 'SSCI', 'A&HCI', 'ESCI', 'UGC CARE', 'Other'];
  if (!validIndexTypes.includes(index_type)) {
    return res.status(400).json({ 
      message: 'Invalid index_type. Must be one of: ' + validIndexTypes.join(', ') 
    });
  }

  // Validate date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(publication_date)) {
    return res.status(400).json({ 
      message: 'Invalid date format. Use YYYY-MM-DD' 
    });
  }
  
  try {
    // Get user ID - try different possible property names
    const userId = getUserId(req);
    
    if (!userId) {
      return res.status(401).json({ 
        message: 'User ID not found. Authentication may have failed.',
        debug: { user: req.user, hasUserId: !!req.user?.id }
      });
    }
    
    // Insert new publication - Note: using correct column name 'Userid'
    const [result] = await pool.query(
      `INSERT INTO book_chapters (
        Userid, publication_type, publication_name, publication_title, authors, 
        index_type, doi, citations, publisher, page_no, publication_date, 
        impact_factor, publication_link
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId, 
        publication_type || 'book_chapter',
        publication_name, 
        publication_title, 
        authors,
        index_type, 
        doi || null, 
        citations || 0, 
        publisher || null,
        page_no || null,
        publication_date,
        impact_factor || null,
        publication_link || null
      ]
    );
    
    res.status(201).json({ 
      message: 'Publication created successfully', 
      id: result.insertId 
    });
  } catch (error) {
    console.error('Error creating publication:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ message: 'Publication already exists' });
    } else if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      res.status(400).json({ message: 'Invalid user reference' });
    } else {
      res.status(500).json({ message: 'Server error' });
    }
  }
});

// Update publication
router.put('/:id', authenticateToken, async (req, res) => {
  const { 
    publication_type,
    publication_name, 
    publication_title, 
    authors, 
    index_type, 
    doi, 
    citations, 
    publisher,
    page_no,
    publication_date,
    impact_factor,
    publication_link
  } = req.body;
  
  // Basic validation
  if (!publication_name || !publication_title || !authors || !index_type || !publication_date) {
    return res.status(400).json({ 
      message: 'Required fields missing: publication_name, publication_title, authors, index_type, publication_date' 
    });
  }

  // Validate publication_type enum
  const validPublicationTypes = ['journal', 'book_chapter', 'conference'];
  if (publication_type && !validPublicationTypes.includes(publication_type)) {
    return res.status(400).json({ 
      message: 'Invalid publication_type. Must be one of: journal, book_chapter, conference' 
    });
  }

  // Validate index_type enum
  const validIndexTypes = ['Scopus', 'SCI', 'SCIE', 'SSCI', 'A&HCI', 'ESCI', 'UGC CARE', 'Other'];
  if (!validIndexTypes.includes(index_type)) {
    return res.status(400).json({ 
      message: 'Invalid index_type. Must be one of: ' + validIndexTypes.join(', ') 
    });
  }

  // Validate date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(publication_date)) {
    return res.status(400).json({ 
      message: 'Invalid date format. Use YYYY-MM-DD' 
    });
  }
  
  try {
    const userId = getUserId(req);
    
    if (!userId) {
      return res.status(401).json({ message: 'User ID not found' });
    }
    
    // Check if publication exists and belongs to user
    const [rows] = await pool.query(
      'SELECT * FROM book_chapters WHERE id = ? AND Userid = ?', 
      [req.params.id, userId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Publication not found or unauthorized' });
    }
    
    // Update publication
    const [result] = await pool.query(
      `UPDATE book_chapters SET 
        publication_type = ?, publication_name = ?, publication_title = ?, authors = ?, 
        index_type = ?, doi = ?, citations = ?, publisher = ?, page_no = ?,
        publication_date = ?, impact_factor = ?, publication_link = ?
      WHERE id = ? AND Userid = ?`,
      [
        publication_type || 'book_chapter',
        publication_name, 
        publication_title, 
        authors,
        index_type, 
        doi || null, 
        citations || 0, 
        publisher || null,
        page_no || null,
        publication_date,
        impact_factor || null,
        publication_link || null,
        req.params.id,
        userId
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Publication not found or no changes made' });
    }
    
    res.status(200).json({ message: 'Publication updated successfully' });
  } catch (error) {
    console.error('Error updating publication:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete publication
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = getUserId(req);
    
    if (!userId) {
      return res.status(401).json({ message: 'User ID not found' });
    }
    
    // Check if publication exists and belongs to user
    const [rows] = await pool.query(
      'SELECT * FROM book_chapters WHERE id = ? AND Userid = ?', 
      [req.params.id, userId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Publication not found or unauthorized' });
    }
    
    // Delete publication
    const [result] = await pool.query(
      'DELETE FROM book_chapters WHERE id = ? AND Userid = ?', 
      [req.params.id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Publication not found' });
    }
    
    res.status(200).json({ message: 'Publication deleted successfully' });
  } catch (error) {
    console.error('Error deleting publication:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get publications by type
router.get('/type/:type', authenticateToken, async (req, res) => {
  const { type } = req.params;
  const validTypes = ['journal', 'book_chapter', 'conference'];
  
  if (!validTypes.includes(type)) {
    return res.status(400).json({ 
      message: 'Invalid publication type. Must be one of: ' + validTypes.join(', ') 
    });
  }
  
  try {
    const userId = getUserId(req);
    
    if (!userId) {
      return res.status(401).json({ message: 'User ID not found' });
    }
    
    const [rows] = await pool.query(
      'SELECT * FROM book_chapters WHERE Userid = ? AND publication_type = ? ORDER BY created_at DESC',
      [userId, type]
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching publications by type:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;