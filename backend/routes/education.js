import express from 'express';
import { pool } from '../db/db.js';
import { authenticate as authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

// Validation middleware
const validateEducationInfo = (req, res, next) => {
  const data = req.body;
  
  // Check if at least one education level is provided
  const hasEducation = data.tenth_institution || data.twelfth_institution || 
                      data.ug_institution || data.pg_institution || 
                      data.mphil_institution || data.phd_university;
  
  if (!hasEducation) {
    return res.status(400).json({
      message: 'At least one education qualification must be provided'
    });
  }

  // Validate ENUM values for first attempt fields
  const validYesNo = ['Yes', 'No'];
  const firstAttemptFields = [
    'tenth_first_attempt', 'twelfth_first_attempt', 'ug_first_attempt',
    'pg_first_attempt', 'mphil_first_attempt'
  ];
  
  for (const field of firstAttemptFields) {
    if (data[field] && !validYesNo.includes(data[field])) {
      return res.status(400).json({
        message: `${field} must be either 'Yes' or 'No'`
      });
    }
  }

  // Validate PhD status
  const validPhdStatus = ['Ongoing', 'Completed', 'Submitted', 'Awarded'];
  if (data.phd_status && !validPhdStatus.includes(data.phd_status)) {
    return res.status(400).json({
      message: 'PhD status must be one of: Ongoing, Completed, Submitted, Awarded'
    });
  }

  // Validate year fields (should be valid years)
  const yearFields = [
    'tenth_year', 'twelfth_year', 'ug_year', 'pg_year', 'mphil_year',
    'phd_registration_year', 'phd_completion_year'
  ];
  
  for (const field of yearFields) {
    if (data[field]) {
      const year = parseInt(data[field]);
      if (isNaN(year) || year < 1900 || year > new Date().getFullYear() + 10) {
        return res.status(400).json({
          message: `${field} must be a valid year between 1900 and ${new Date().getFullYear() + 10}`
        });
      }
    }
  }

  next();
};

// Helper function to clean data (remove empty strings and convert to appropriate types)
const cleanEducationData = (data) => {
  const cleaned = {};
  
  // Text fields
  const textFields = [
    'tenth_institution', 'tenth_university', 'tenth_medium', 'tenth_cgpa_percentage',
    'twelfth_institution', 'twelfth_university', 'twelfth_medium', 'twelfth_cgpa_percentage',
    'ug_institution', 'ug_university', 'ug_medium', 'ug_specialization', 'ug_degree', 'ug_cgpa_percentage',
    'pg_institution', 'pg_university', 'pg_medium', 'pg_specialization', 'pg_degree', 'pg_cgpa_percentage',
    'mphil_institution', 'mphil_university', 'mphil_medium', 'mphil_specialization', 'mphil_degree', 'mphil_cgpa_percentage',
    'phd_university', 'phd_title', 'phd_guide_name', 'phd_college', 'phd_status',
    'phd_publications_during', 'phd_publications_post', 'phd_post_experience'
  ];
  
  // ENUM fields
  const enumFields = [
    'tenth_first_attempt', 'twelfth_first_attempt', 'ug_first_attempt',
    'pg_first_attempt', 'mphil_first_attempt'
  ];
  
  // Year fields
  const yearFields = [
    'tenth_year', 'twelfth_year', 'ug_year', 'pg_year', 'mphil_year',
    'phd_registration_year', 'phd_completion_year'
  ];
  
  // Process text fields
  textFields.forEach(field => {
    if (data[field] && data[field].toString().trim() !== '') {
      cleaned[field] = data[field].toString().trim();
    }
  });
  
  // Process enum fields
  enumFields.forEach(field => {
    if (data[field] && data[field].toString().trim() !== '') {
      cleaned[field] = data[field].toString().trim();
    }
  });
  
  // Process year fields
  yearFields.forEach(field => {
    if (data[field] && data[field].toString().trim() !== '') {
      const year = parseInt(data[field]);
      if (!isNaN(year)) {
        cleaned[field] = year;
      }
    }
  });
  
  return cleaned;
};

// Get all education records for the authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Enhanced authentication check
    if (!req.user || !req.user.Userid) {
      console.error('Authentication failed - req.user:', req.user);
      return res.status(401).json({ message: 'User not authenticated properly' });
    }

    const [rows] = await pool.query(
      'SELECT * FROM education WHERE Userid = ? ORDER BY created_at DESC', 
      [req.user.Userid]
    );
    
    res.status(200).json({
      success: true,
      data: rows,
      count: rows.length
    });
  } catch (error) {
    console.error('Error fetching education records:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while fetching data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get education record by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    // Enhanced authentication check
    if (!req.user || !req.user.Userid) {
      console.error('Authentication failed - req.user:', req.user);
      return res.status(401).json({ message: 'User not authenticated properly' });
    }

    const [rows] = await pool.query(
      'SELECT * FROM education WHERE id = ? AND Userid = ?', 
      [req.params.id, req.user.Userid]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Education record not found' 
      });
    }
    
    res.status(200).json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Error fetching education record:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while fetching record',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get current user's education record (convenience endpoint)
router.get('/user/current', authenticateToken, async (req, res) => {
  try {
    // Enhanced authentication check
    if (!req.user || !req.user.Userid) {
      console.error('Authentication failed - req.user:', req.user);
      return res.status(401).json({ message: 'User not authenticated properly' });
    }

    const [rows] = await pool.query(
      'SELECT * FROM education WHERE Userid = ? ORDER BY created_at DESC LIMIT 1', 
      [req.user.Userid]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'No education information found for current user' 
      });
    }
    
    res.status(200).json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Error fetching current user education information:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while fetching user data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Create new education record
router.post('/', authenticateToken, validateEducationInfo, async (req, res) => {
  try {
    // Enhanced authentication check
    if (!req.user || !req.user.Userid) {
      console.error('Authentication failed - req.user:', req.user);
      return res.status(401).json({ message: 'User not authenticated properly' });
    }

    const cleanData = cleanEducationData(req.body);
    
    // Check if user already has an education record (if you want to enforce uniqueness)
    const [existingRecords] = await pool.query(
      'SELECT id FROM education WHERE Userid = ?',
      [req.user.Userid]
    );

    if (existingRecords.length > 0) {
      return res.status(409).json({ 
        success: false,
        message: 'Education information already exists for this user. Use update instead.',
        existingRecordId: existingRecords[0].id
      });
    }

    // Build dynamic query based on provided fields
    const fields = Object.keys(cleanData);
    const values = Object.values(cleanData);
    
    // Add Userid to fields and values
    fields.unshift('Userid');
    values.unshift(req.user.Userid);
    
    const placeholders = fields.map(() => '?').join(', ');
    const fieldsList = fields.join(', ');
    
    const [result] = await pool.query(
      `INSERT INTO education (${fieldsList}) VALUES (${placeholders})`,
      values
    );

    // Fetch the created record
    const [newRecord] = await pool.query(
      'SELECT * FROM education WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({ 
      success: true,
      message: 'Education information created successfully', 
      data: newRecord[0],
      id: result.insertId 
    });
  } catch (error) {
    console.error('Error creating education record:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while creating record',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update education record
router.put('/:id', authenticateToken, validateEducationInfo, async (req, res) => {
  try {
    // Enhanced authentication check
    if (!req.user || !req.user.Userid) {
      console.error('Authentication failed - req.user:', req.user);
      return res.status(401).json({ message: 'User not authenticated properly' });
    }

    // Check if record exists and belongs to user
    const [rows] = await pool.query(
      'SELECT * FROM education WHERE id = ? AND Userid = ?', 
      [req.params.id, req.user.Userid]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Education record not found' 
      });
    }

    const cleanData = cleanEducationData(req.body);
    
    // Build dynamic update query
    const fields = Object.keys(cleanData);
    const values = Object.values(cleanData);
    
    if (fields.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'No valid fields to update' 
      });
    }
    
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    values.push(req.params.id, req.user.Userid);
    
    await pool.query(
      `UPDATE education SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND Userid = ?`,
      values
    );

    // Fetch updated record
    const [updatedRecord] = await pool.query(
      'SELECT * FROM education WHERE id = ? AND Userid = ?',
      [req.params.id, req.user.Userid]
    );

    res.status(200).json({ 
      success: true,
      message: 'Education information updated successfully',
      data: updatedRecord[0]
    });
  } catch (error) {
    console.error('Error updating education record:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while updating record',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Partial update education record (PATCH)
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    // Enhanced authentication check
    if (!req.user || !req.user.Userid) {
      console.error('Authentication failed - req.user:', req.user);
      return res.status(401).json({ message: 'User not authenticated properly' });
    }

    // Check if record exists and belongs to user
    const [rows] = await pool.query(
      'SELECT * FROM education WHERE id = ? AND Userid = ?', 
      [req.params.id, req.user.Userid]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Education record not found' 
      });
    }

    const cleanData = cleanEducationData(req.body);
    
    // Build dynamic update query
    const fields = Object.keys(cleanData);
    const values = Object.values(cleanData);
    
    if (fields.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'No valid fields to update' 
      });
    }
    
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    values.push(req.params.id, req.user.Userid);
    
    await pool.query(
      `UPDATE education SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND Userid = ?`,
      values
    );

    // Fetch updated record
    const [updatedRecord] = await pool.query(
      'SELECT * FROM education WHERE id = ? AND Userid = ?',
      [req.params.id, req.user.Userid]
    );

    res.status(200).json({ 
      success: true,
      message: 'Education information updated successfully',
      data: updatedRecord[0]
    });
  } catch (error) {
    console.error('Error updating education record:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while updating record',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Delete education record
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Enhanced authentication check
    if (!req.user || !req.user.Userid) {
      console.error('Authentication failed - req.user:', req.user);
      return res.status(401).json({ message: 'User not authenticated properly' });
    }

    // Check if record exists and belongs to user
    const [rows] = await pool.query(
      'SELECT * FROM education WHERE id = ? AND Userid = ?', 
      [req.params.id, req.user.Userid]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Education record not found' 
      });
    }

    const deletedRecord = rows[0];

    await pool.query(
      'DELETE FROM education WHERE id = ? AND Userid = ?', 
      [req.params.id, req.user.Userid]
    );
    
    res.status(200).json({ 
      success: true,
      message: 'Education record deleted successfully',
      deletedRecord: deletedRecord
    });
  } catch (error) {
    console.error('Error deleting education record:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while deleting record',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;