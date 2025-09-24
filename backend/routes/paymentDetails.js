// routes/paymentDetails.js
import express from 'express';
import { pool } from '../db/db.js';
import { authenticate as authenticateToken } from '../middlewares/auth.js';


const router = express.Router();

// Get payment details for a specific proposal
router.get('/proposal/:proposalId', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM payment_details WHERE proposal_id = ? ORDER BY date ASC',
      [req.params.proposalId]
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching payment details:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get payment detail by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM payment_details WHERE id = ?', [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Payment detail not found' });
    }
    
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Error fetching payment detail:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new payment detail
router.post('/', authenticateToken, async (req, res) => {
  const { 
    proposal_id, 
    date, 
    amount
  } = req.body;
  
  // Basic validation
  if (!proposal_id || !date || !amount) {
    return res.status(400).json({ message: 'Required fields missing' });
  }
  
  try {
    // Verify proposal exists and belongs to user
    const [proposalRows] = await pool.query(
      'SELECT * FROM consultancy_proposals WHERE id = ? AND Userid = ?',
      [proposal_id, req.user.Userid]
    );
    
    if (proposalRows.length === 0) {
      return res.status(404).json({ message: 'Proposal not found or access denied' });
    }
    
    // Insert new payment detail
    const [result] = await pool.query(
      `INSERT INTO payment_details (
        proposal_id, date, amount
      ) VALUES (?, ?, ?)`,
      [proposal_id, date, amount]
    );
    
    res.status(201).json({ 
      message: 'Payment detail created successfully', 
      id: result.insertId 
    });
  } catch (error) {
    console.error('Error creating payment detail:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update payment detail
router.put('/:id', authenticateToken, async (req, res) => {
  const { 
    date, 
    amount
  } = req.body;
  
  // Basic validation
  if (!date || !amount) {
    return res.status(400).json({ message: 'Required fields missing' });
  }
  
  try {
    // Check if payment detail exists and user has access
    const [rows] = await pool.query(`
      SELECT pd.*, cp.Userid 
      FROM payment_details pd
      JOIN consultancy_proposals cp ON pd.proposal_id = cp.id
      WHERE pd.id = ?
    `, [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Payment detail not found' });
    }
    
    if (rows[0].Userid !== req.user.Userid) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Update payment detail
    await pool.query(
      `UPDATE payment_details SET 
        date = ?, amount = ?
      WHERE id = ?`,
      [date, amount, req.params.id]
    );
    
    res.status(200).json({ message: 'Payment detail updated successfully' });
  } catch (error) {
    console.error('Error updating payment detail:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete payment detail
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Check if payment detail exists and user has access
    const [rows] = await pool.query(`
      SELECT pd.*, cp.Userid 
      FROM payment_details pd
      JOIN consultancy_proposals cp ON pd.proposal_id = cp.id
      WHERE pd.id = ?
    `, [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Payment detail not found' });
    }
    
    if (rows[0].Userid !== req.user.Userid) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Delete payment detail
    await pool.query('DELETE FROM payment_details WHERE id = ?', [req.params.id]);
    
    res.status(200).json({ message: 'Payment detail deleted successfully' });
  } catch (error) {
    console.error('Error deleting payment detail:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;