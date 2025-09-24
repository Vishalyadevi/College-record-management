import express from 'express';
import { pool } from '../db/db.js';
import { authenticate as authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

// Get all industry knowhow
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        id, Userid, internship_name, title, company, 
        outcomes, from_date, to_date, venue, participants, 
        financial_support, support_amount, certificate_link,
        created_at, updated_at
      FROM industry_knowhow
      WHERE Userid = ?
      ORDER BY created_at DESC
    `, [req.user.Userid]);
    
    // Format the data for frontend display
    const formattedRows = rows.map(row => {
      const formattedFromDate = row.from_date ? 
        new Date(row.from_date).toISOString().split('T')[0] : null;
      const formattedToDate = row.to_date ? 
        new Date(row.to_date).toISOString().split('T')[0] : null;
        
      return {
        ...row,
        from_date: formattedFromDate,
        to_date: formattedToDate,
        financial_support: Boolean(row.financial_support),
        support_amount: row.support_amount ? parseFloat(row.support_amount) : null
      };
    });
    
    res.status(200).json({
      success: true,
      data: formattedRows,
      message: 'Industry knowhow fetched successfully'
    });
  } catch (error) {
    console.error('Error fetching industry knowhow:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while fetching data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get industry knowhow by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM industry_knowhow WHERE id = ? AND Userid = ?', 
      [req.params.id, req.user.Userid]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Industry knowhow not found or you do not have permission to access it' 
      });
    }
    
    const item = rows[0];
    const formattedItem = {
      ...item,
      from_date: item.from_date ? new Date(item.from_date).toISOString().split('T')[0] : null,
      to_date: item.to_date ? new Date(item.to_date).toISOString().split('T')[0] : null,
      financial_support: Boolean(item.financial_support),
      support_amount: item.support_amount ? parseFloat(item.support_amount) : null
    };
    
    res.status(200).json({
      success: true,
      data: formattedItem,
      message: 'Industry knowhow fetched successfully'
    });
  } catch (error) {
    console.error('Error fetching industry knowhow:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while fetching data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Create new industry knowhow
router.post('/', authenticateToken, async (req, res) => {
  const { 
    internship_name, 
    title, 
    company, 
    outcomes, 
    from_date,
    to_date, 
    venue, 
    participants, 
    financial_support, 
    support_amount, 
    certificate_link 
  } = req.body;
  
  try {
    // Validate required fields
    const requiredFields = {
      internship_name: 'Internship/Training Name',
      title: 'Title',
      company: 'Company',
      outcomes: 'Outcomes',
      from_date: 'From Date',
      to_date: 'To Date',
      venue: 'Venue',
      participants: 'Participants'
    };

    const missingFields = [];
    const emptyFields = [];

    for (const [field, label] of Object.entries(requiredFields)) {
      if (!req.body[field]) {
        missingFields.push(label);
      } else if (req.body[field].toString().trim() === '') {
        emptyFields.push(label);
      }
    }

    if (missingFields.length > 0) {
      return res.status(400).json({ 
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}` 
      });
    }

    if (emptyFields.length > 0) {
      return res.status(400).json({ 
        success: false,
        message: `Empty required fields: ${emptyFields.join(', ')}` 
      });
    }

    // Validate and sanitize internship_name (max 255 chars)
    if (internship_name.trim().length > 255) {
      return res.status(400).json({ 
        success: false,
        message: 'Internship/Training name must not exceed 255 characters' 
      });
    }

    // Validate and sanitize title (max 255 chars)
    if (title.trim().length > 255) {
      return res.status(400).json({ 
        success: false,
        message: 'Title must not exceed 255 characters' 
      });
    }

    // Validate and sanitize company (max 100 chars)
    if (company.trim().length > 100) {
      return res.status(400).json({ 
        success: false,
        message: 'Company name must not exceed 100 characters' 
      });
    }

    // Validate and sanitize venue (max 100 chars)
    if (venue.trim().length > 100) {
      return res.status(400).json({ 
        success: false,
        message: 'Venue must not exceed 100 characters' 
      });
    }

    // Validate participants
    const participantCount = parseInt(participants);
    if (isNaN(participantCount) || participantCount <= 0 || participantCount > 999999) {
      return res.status(400).json({ 
        success: false,
        message: 'Number of participants must be a positive integer between 1 and 999999' 
      });
    }

    // Format and validate dates
    const formatDate = (dateString) => {
      if (!dateString) return null;
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
          throw new Error('Invalid date');
        }
        // Ensure date is not too far in the past or future
        const currentYear = new Date().getFullYear();
        const dateYear = date.getFullYear();
        if (dateYear < 1900 || dateYear > currentYear + 10) {
          throw new Error('Date must be between 1900 and ' + (currentYear + 10));
        }
        return date.toISOString().split('T')[0];
      } catch (error) {
        throw new Error('Invalid date format. Please use YYYY-MM-DD format');
      }
    };
    
    let formattedFromDate, formattedToDate;
    try {
      formattedFromDate = formatDate(from_date);
      formattedToDate = formatDate(to_date);
    } catch (error) {
      return res.status(400).json({ 
        success: false,
        message: error.message 
      });
    }

    // Validate date range
    if (new Date(formattedFromDate) > new Date(formattedToDate)) {
      return res.status(400).json({ 
        success: false,
        message: 'From date cannot be later than to date' 
      });
    }

    // Validate financial support
    const hasFinancialSupport = Boolean(financial_support);
    let supportAmountValue = null;
    
    if (hasFinancialSupport) {
      if (!support_amount || isNaN(parseFloat(support_amount)) || parseFloat(support_amount) <= 0) {
        return res.status(400).json({ 
          success: false,
          message: 'Support amount must be a positive number when financial support is enabled' 
        });
      }
      supportAmountValue = parseFloat(support_amount);
      // Validate amount doesn't exceed DECIMAL(10,2) limits
      if (supportAmountValue >= 100000000) {
        return res.status(400).json({ 
          success: false,
          message: 'Support amount is too large. Maximum allowed is 99,999,999.99' 
        });
      }
    }

    // Validate certificate link if provided
    if (certificate_link && certificate_link.trim()) {
      const urlPattern = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;
      if (!urlPattern.test(certificate_link.trim())) {
        return res.status(400).json({ 
          success: false,
          message: 'Certificate link must be a valid URL starting with http:// or https://' 
        });
      }
    }
    
    // Insert new industry knowhow
    const [result] = await pool.query(
      `INSERT INTO industry_knowhow (
        Userid, internship_name, title, company, 
        outcomes, from_date, to_date, venue, participants, 
        financial_support, support_amount, certificate_link
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.Userid, 
        internship_name.trim(), 
        title.trim(), 
        company.trim(),
        outcomes.trim(), 
        formattedFromDate, 
        formattedToDate, 
        venue.trim(), 
        participantCount, 
        hasFinancialSupport, 
        supportAmountValue, 
        certificate_link ? certificate_link.trim() : null
      ]
    );
    
    res.status(201).json({ 
      success: true,
      message: 'Industry knowhow created successfully', 
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Error creating industry knowhow:', error);
    
    // Handle specific database errors
    if (error.code === 'ER_DATA_TOO_LONG') {
      return res.status(400).json({ 
        success: false,
        message: 'One or more fields exceed maximum length' 
      });
    }
    if (error.code === 'ER_BAD_NULL_ERROR') {
      return res.status(400).json({ 
        success: false,
        message: 'Required field cannot be null' 
      });
    }
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid user reference' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Server error while creating industry knowhow',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update industry knowhow
router.put('/:id', authenticateToken, async (req, res) => {
  const { 
    internship_name, 
    title, 
    company, 
    outcomes, 
    from_date,
    to_date, 
    venue, 
    participants, 
    financial_support, 
    support_amount, 
    certificate_link 
  } = req.body;
  
  try {
    // Check if industry knowhow exists and belongs to user
    const [existingRows] = await pool.query(
      'SELECT * FROM industry_knowhow WHERE id = ? AND Userid = ?', 
      [req.params.id, req.user.Userid]
    );
    
    if (existingRows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Industry knowhow not found or you do not have permission to update it' 
      });
    }

    // Validate required fields
    const requiredFields = {
      internship_name: 'Internship/Training Name',
      title: 'Title',
      company: 'Company',
      outcomes: 'Outcomes',
      from_date: 'From Date',
      to_date: 'To Date',
      venue: 'Venue',
      participants: 'Participants'
    };

    const missingFields = [];
    const emptyFields = [];

    for (const [field, label] of Object.entries(requiredFields)) {
      if (!req.body[field]) {
        missingFields.push(label);
      } else if (req.body[field].toString().trim() === '') {
        emptyFields.push(label);
      }
    }

    if (missingFields.length > 0) {
      return res.status(400).json({ 
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}` 
      });
    }

    if (emptyFields.length > 0) {
      return res.status(400).json({ 
        success: false,
        message: `Empty required fields: ${emptyFields.join(', ')}` 
      });
    }

    // Validate field lengths (same as create)
    if (internship_name.trim().length > 255) {
      return res.status(400).json({ 
        success: false,
        message: 'Internship/Training name must not exceed 255 characters' 
      });
    }

    if (title.trim().length > 255) {
      return res.status(400).json({ 
        success: false,
        message: 'Title must not exceed 255 characters' 
      });
    }

    if (company.trim().length > 100) {
      return res.status(400).json({ 
        success: false,
        message: 'Company name must not exceed 100 characters' 
      });
    }

    if (venue.trim().length > 100) {
      return res.status(400).json({ 
        success: false,
        message: 'Venue must not exceed 100 characters' 
      });
    }

    // Validate participants
    const participantCount = parseInt(participants);
    if (isNaN(participantCount) || participantCount <= 0 || participantCount > 999999) {
      return res.status(400).json({ 
        success: false,
        message: 'Number of participants must be a positive integer between 1 and 999999' 
      });
    }

    // Format and validate dates
    const formatDate = (dateString) => {
      if (!dateString) return null;
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
          throw new Error('Invalid date');
        }
        const currentYear = new Date().getFullYear();
        const dateYear = date.getFullYear();
        if (dateYear < 1900 || dateYear > currentYear + 10) {
          throw new Error('Date must be between 1900 and ' + (currentYear + 10));
        }
        return date.toISOString().split('T')[0];
      } catch (error) {
        throw new Error('Invalid date format. Please use YYYY-MM-DD format');
      }
    };
    
    let formattedFromDate, formattedToDate;
    try {
      formattedFromDate = formatDate(from_date);
      formattedToDate = formatDate(to_date);
    } catch (error) {
      return res.status(400).json({ 
        success: false,
        message: error.message 
      });
    }

    // Validate date range
    if (new Date(formattedFromDate) > new Date(formattedToDate)) {
      return res.status(400).json({ 
        success: false,
        message: 'From date cannot be later than to date' 
      });
    }

    // Validate financial support
    const hasFinancialSupport = Boolean(financial_support);
    let supportAmountValue = null;
    
    if (hasFinancialSupport) {
      if (!support_amount || isNaN(parseFloat(support_amount)) || parseFloat(support_amount) <= 0) {
        return res.status(400).json({ 
          success: false,
          message: 'Support amount must be a positive number when financial support is enabled' 
        });
      }
      supportAmountValue = parseFloat(support_amount);
      if (supportAmountValue >= 100000000) {
        return res.status(400).json({ 
          success: false,
          message: 'Support amount is too large. Maximum allowed is 99,999,999.99' 
        });
      }
    }

    // Validate certificate link if provided
    if (certificate_link && certificate_link.trim()) {
      const urlPattern = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;
      if (!urlPattern.test(certificate_link.trim())) {
        return res.status(400).json({ 
          success: false,
          message: 'Certificate link must be a valid URL starting with http:// or https://' 
        });
      }
    }
    
    // Update industry knowhow
    await pool.query(
      `UPDATE industry_knowhow SET 
        internship_name = ?, title = ?, company = ?, 
        outcomes = ?, from_date = ?, to_date = ?, venue = ?, participants = ?, 
        financial_support = ?, support_amount = ?, certificate_link = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND Userid = ?`,
      [
        internship_name.trim(), 
        title.trim(), 
        company.trim(),
        outcomes.trim(), 
        formattedFromDate, 
        formattedToDate, 
        venue.trim(), 
        participantCount,
        hasFinancialSupport, 
        supportAmountValue, 
        certificate_link ? certificate_link.trim() : null, 
        req.params.id,
        req.user.Userid
      ]
    );
    
    res.status(200).json({ 
      success: true,
      message: 'Industry knowhow updated successfully' 
    });
  } catch (error) {
    console.error('Error updating industry knowhow:', error);
    
    // Handle specific database errors
    if (error.code === 'ER_DATA_TOO_LONG') {
      return res.status(400).json({ 
        success: false,
        message: 'One or more fields exceed maximum length' 
      });
    }
    if (error.code === 'ER_BAD_NULL_ERROR') {
      return res.status(400).json({ 
        success: false,
        message: 'Required field cannot be null' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Server error while updating industry knowhow',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Delete industry knowhow
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Check if industry knowhow exists and belongs to user
    const [rows] = await pool.query(
      'SELECT * FROM industry_knowhow WHERE id = ? AND Userid = ?', 
      [req.params.id, req.user.Userid]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Industry knowhow not found or you do not have permission to delete it' 
      });
    }
    
    // Delete industry knowhow
    await pool.query('DELETE FROM industry_knowhow WHERE id = ? AND Userid = ?', [req.params.id, req.user.Userid]);
    
    res.status(200).json({ 
      success: true,
      message: 'Industry knowhow deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting industry knowhow:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while deleting industry knowhow',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;