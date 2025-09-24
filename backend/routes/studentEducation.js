// student-education.js - Remove authenticateToken from routes you want to access without auth

import express from 'express';
import { pool } from '../db/db.js';
// Remove this import if not using authentication
// import { authenticate as authenticateToken} from '../middlewares/auth.js';

const router = express.Router();

// Get all student education records - NO AUTHENTICATION REQUIRED
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM student_education');
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching student education records:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get student education record by ID - NO AUTHENTICATION REQUIRED
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM student_education WHERE id = ?', [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Student education record not found' });
    }
    
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Error fetching student education record:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get student education record by user ID - NO AUTHENTICATION REQUIRED
router.get('/user/:userid', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM student_education WHERE userid = ?', [req.params.userid]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Student education record not found for this user' });
    }
    
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Error fetching student education record by user ID:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// For routes that still need authentication, keep authenticateToken
// Example: Create, Update, Delete operations might still need authentication

export default router;