import express from 'express';
import { pool } from '../db/db.js';

import { authenticate as authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

// Get all scholar entries
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM scholars');
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching scholar data:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get scholar entry by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM scholars WHERE id = ?', [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Scholar entry not found' });
    }

    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Error fetching scholar entry:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new scholar entry
router.post('/', authenticateToken, async (req, res) => {
  console.log('Incoming scholar data:', req.body); // Log data for debugging

  const {
    scholar_name,
    scholar_type,
    institute,
    university,
    title,
    domain,
    phd_registered_year,
    completed_year,
    status,
    publications
  } = req.body;

  // Validate required fields
  if (!scholar_name || !scholar_type || !institute || !university || !title || !domain || !phd_registered_year || !status) {
    return res.status(400).json({ message: 'Required fields missing' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO scholars (
        Userid, scholar_name, scholar_type, institute, university, title, domain,
        phd_registered_year, completed_year, status, publications
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.Userid,
        scholar_name,
        scholar_type,
        institute,
        university,
        title,
        domain,
        phd_registered_year,
        completed_year || null,
        status,
        publications
      ]
    );

    res.status(201).json({
      message: 'Scholar entry created successfully',
      id: result.insertId
    });
  } catch (error) {
    console.error('Error creating scholar entry:', error.sqlMessage || error.message);
    res.status(500).json({ message: 'Server error', error: error.sqlMessage || error.message });
  }
});

// Update scholar entry
router.put('/:id', authenticateToken, async (req, res) => {
  const {
    scholar_name,
    scholar_type,
    institute,
    university,
    title,
    domain,
    phd_registered_year,
    completed_year,
    status,
    publications
  } = req.body;

  if (!scholar_name || !scholar_type || !institute || !university || !title || !domain || !phd_registered_year || !status) {
    return res.status(400).json({ message: 'Required fields missing' });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM scholars WHERE id = ?', [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Scholar entry not found' });
    }

    await pool.query(
      `UPDATE scholars SET
        scholar_name = ?, scholar_type = ?, institute = ?, university = ?, title = ?,
        domain = ?, phd_registered_year = ?, completed_year = ?, status = ?, publications = ?
      WHERE id = ?`,
      [
        scholar_name,
        scholar_type,
        institute,
        university,
        title,
        domain,
        phd_registered_year,
        completed_year || null,
        status,
        publications,
        req.params.id
      ]
    );

    res.status(200).json({ message: 'Scholar entry updated successfully' });
  } catch (error) {
    console.error('Error updating scholar entry:', error.sqlMessage || error.message);
    res.status(500).json({ message: 'Server error', error: error.sqlMessage || error.message });
  }
});

// Delete scholar entry
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM scholars WHERE id = ?', [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Scholar entry not found' });
    }

    await pool.query('DELETE FROM scholars WHERE id = ?', [req.params.id]);

    res.status(200).json({ message: 'Scholar entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting scholar entry:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
