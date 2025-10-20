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

// Helper function to extract user ID (handles Sequelize models)
const getUserId = (req) => {
  return req.user?.Userid || req.user?.dataValues?.Userid || req.user?.id;
};

// Get all events attended
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = getUserId(req);
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication error: User ID not found' });
    }

    const [rows] = await pool.query(`
      SELECT
        id,
        Userid,
        programme_name,
        title,
        from_date,
        to_date,
        mode,
        organized_by,
        participants,
        financial_support,
        support_amount,
        CASE WHEN permission_letter_link IS NOT NULL THEN true ELSE false END as has_permission_letter,
        CASE WHEN certificate_link IS NOT NULL THEN true ELSE false END as has_certificate,
        CASE WHEN financial_proof_link IS NOT NULL THEN true ELSE false END as has_financial_proof,
        CASE WHEN programme_report_link IS NOT NULL THEN true ELSE false END as has_programme_report,
        created_at,
        updated_at
      FROM events_attended
      WHERE Userid = ? ORDER BY created_at DESC
    `, [userId]);

    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get event by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = getUserId(req);
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication error: User ID not found' });
    }

    const [rows] = await pool.query(
      'SELECT * FROM events_attended WHERE id = ? AND Userid = ?',
      [req.params.id, userId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new event
router.post('/', authenticateToken, memoryUpload.fields([
  { name: 'permission_letter_link', maxCount: 1 },
  { name: 'certificate_link', maxCount: 1 },
  { name: 'financial_proof_link', maxCount: 1 },
  { name: 'programme_report_link', maxCount: 1 }
]), async (req, res) => {
  try {
    const {
      programme_name,
      title,
      from_date,
      to_date,
      mode,
      organized_by,
      participants,
      financial_support,
      support_amount
    } = req.body;

    console.log('=== Backend Received Data ===');
    console.log('Body:', req.body);
    console.log('Files:', req.files ? Object.keys(req.files) : 'none');
    
    // Extract Userid correctly (handle Sequelize model)
    const userId = getUserId(req);
    
    if (!userId) {
      console.error('CRITICAL: No user ID found in request');
      console.error('req.user:', req.user);
      return res.status(401).json({ message: 'Authentication error: User ID not found' });
    }
    
    console.log('Using Userid:', userId);

    // Basic validation
    if (!programme_name?.trim() || !title?.trim() || !from_date || !to_date || !mode || !organized_by?.trim() || !participants) {
      return res.status(400).json({ message: 'Required fields missing' });
    }
    
    // Validate mode enum
    const validModes = ['Online', 'Offline', 'Hybrid'];
    if (!validModes.includes(mode)) {
      return res.status(400).json({ message: 'Mode must be Online, Offline, or Hybrid' });
    }
    
    // Validate dates
    const fromDate = new Date(from_date);
    const toDate = new Date(to_date);
    
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }
    
    if (fromDate >= toDate) {
      return res.status(400).json({ message: 'From date must be before to date' });
    }

    // Validate participants
    const participantsCount = parseInt(participants);
    if (isNaN(participantsCount) || participantsCount <= 0) {
      return res.status(400).json({ message: 'Participants must be a positive number' });
    }

    // Convert financial_support to boolean
    const financialSupportBool = financial_support === true || financial_support === 'true';

    // Validate support amount if financial support is true
    let supportAmount = null;
    if (financialSupportBool) {
      if (support_amount !== undefined && support_amount !== null && support_amount !== '') {
        supportAmount = parseFloat(support_amount);
        if (isNaN(supportAmount) || supportAmount < 0) {
          return res.status(400).json({ message: 'Support amount must be a valid positive number' });
        }
      } else {
        return res.status(400).json({ message: 'Support amount is required when financial support is selected' });
      }
    }
    
    // Validate organized_by length
    if (organized_by.trim().length > 100) {
      return res.status(400).json({ message: 'Organized by field cannot exceed 100 characters' });
    }

    // Extract file buffers if uploaded
    const permissionLetterBuffer = req.files?.['permission_letter_link']?.[0]?.buffer || null;
    const certificateBuffer = req.files?.['certificate_link']?.[0]?.buffer || null;
    const financialProofBuffer = req.files?.['financial_proof_link']?.[0]?.buffer || null;
    const programmeReportBuffer = req.files?.['programme_report_link']?.[0]?.buffer || null;

    console.log('=== File Buffers ===');
    console.log('Permission Letter:', permissionLetterBuffer ? `${permissionLetterBuffer.length} bytes` : 'null');
    console.log('Certificate:', certificateBuffer ? `${certificateBuffer.length} bytes` : 'null');
    console.log('Financial Proof:', financialProofBuffer ? `${financialProofBuffer.length} bytes` : 'null');
    console.log('Programme Report:', programmeReportBuffer ? `${programmeReportBuffer.length} bytes` : 'null');
    
    // Insert new event
    const [result] = await pool.query(
      `INSERT INTO events_attended (
        Userid, programme_name, title, from_date, to_date,
        mode, organized_by, participants, financial_support, support_amount,
        permission_letter_link, certificate_link, financial_proof_link, programme_report_link
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        programme_name.trim(),
        title.trim(),
        from_date,
        to_date,
        mode,
        organized_by.trim(),
        participantsCount,
        financialSupportBool,
        supportAmount,
        permissionLetterBuffer,
        certificateBuffer,
        financialProofBuffer,
        programmeReportBuffer
      ]
    );
    
    console.log('=== Insert Result ===');
    console.log('Insert ID:', result.insertId);

    res.status(201).json({ 
      message: 'Event created successfully', 
      id: result.insertId 
    });
  } catch (error) {
    console.error('Error creating event:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Duplicate entry error' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update event
router.put('/:id', authenticateToken, memoryUpload.fields([
  { name: 'permission_letter_link', maxCount: 1 },
  { name: 'certificate_link', maxCount: 1 },
  { name: 'financial_proof_link', maxCount: 1 },
  { name: 'programme_report_link', maxCount: 1 }
]), async (req, res) => {
  try {
    const userId = getUserId(req);
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication error: User ID not found' });
    }

    const {
      programme_name,
      title,
      from_date,
      to_date,
      mode,
      organized_by,
      participants,
      financial_support,
      support_amount
    } = req.body;

    // Basic validation
    if (!programme_name?.trim() || !title?.trim() || !from_date || !to_date || !mode || !organized_by?.trim() || !participants) {
      return res.status(400).json({ message: 'Required fields missing' });
    }
    
    // Validate mode enum
    const validModes = ['Online', 'Offline', 'Hybrid'];
    if (!validModes.includes(mode)) {
      return res.status(400).json({ message: 'Mode must be Online, Offline, or Hybrid' });
    }
    
    // Validate dates
    const fromDate = new Date(from_date);
    const toDate = new Date(to_date);
    
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }
    
    if (fromDate >= toDate) {
      return res.status(400).json({ message: 'From date must be before to date' });
    }

    // Validate participants
    const participantsCount = parseInt(participants);
    if (isNaN(participantsCount) || participantsCount <= 0) {
      return res.status(400).json({ message: 'Participants must be a positive number' });
    }

    // Convert financial_support to boolean
    const financialSupportBool = financial_support === true || financial_support === 'true';

    // Validate support amount if financial support is true
    let supportAmount = null;
    if (financialSupportBool) {
      if (support_amount !== undefined && support_amount !== null && support_amount !== '') {
        supportAmount = parseFloat(support_amount);
        if (isNaN(supportAmount) || supportAmount < 0) {
          return res.status(400).json({ message: 'Support amount must be a valid positive number' });
        }
      }
    }
    
    // Validate organized_by length
    if (organized_by.trim().length > 100) {
      return res.status(400).json({ message: 'Organized by field cannot exceed 100 characters' });
    }
    
    // Check if event exists and belongs to user
    const [rows] = await pool.query(
      'SELECT * FROM events_attended WHERE id = ? AND Userid = ?',
      [req.params.id, userId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Event not found or access denied' });
    }

    // Extract file buffers if uploaded
    const permissionLetterBuffer = req.files?.['permission_letter_link']?.[0]?.buffer;
    const certificateBuffer = req.files?.['certificate_link']?.[0]?.buffer;
    const financialProofBuffer = req.files?.['financial_proof_link']?.[0]?.buffer;
    const programmeReportBuffer = req.files?.['programme_report_link']?.[0]?.buffer;
    
    // Build update query dynamically
    const updateFields = [
      'programme_name = ?',
      'title = ?',
      'from_date = ?',
      'to_date = ?',
      'mode = ?',
      'organized_by = ?',
      'participants = ?',
      'financial_support = ?',
      'support_amount = ?'
    ];

    const updateValues = [
      programme_name.trim(),
      title.trim(),
      from_date,
      to_date,
      mode,
      organized_by.trim(),
      participantsCount,
      financialSupportBool,
      supportAmount
    ];

    // Only update file fields if new files are provided
    if (permissionLetterBuffer) {
      updateFields.push('permission_letter_link = ?');
      updateValues.push(permissionLetterBuffer);
    }
    if (certificateBuffer) {
      updateFields.push('certificate_link = ?');
      updateValues.push(certificateBuffer);
    }
    if (financialProofBuffer) {
      updateFields.push('financial_proof_link = ?');
      updateValues.push(financialProofBuffer);
    }
    if (programmeReportBuffer) {
      updateFields.push('programme_report_link = ?');
      updateValues.push(programmeReportBuffer);
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(req.params.id, userId);

    const [result] = await pool.query(
      `UPDATE events_attended SET ${updateFields.join(', ')} WHERE id = ? AND Userid = ?`,
      updateValues
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Event not found or no changes made' });
    }
    
    res.status(200).json({ message: 'Event updated successfully' });
  } catch (error) {
    console.error('Error updating event:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Duplicate entry error' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get document file
router.get('/:id/document/:type', authenticateToken, async (req, res) => {
  try {
    const userId = getUserId(req);
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication error: User ID not found' });
    }

    const { id, type } = req.params;

    // Validate document type
    const validTypes = ['permission_letter_link', 'certificate_link', 'financial_proof_link', 'programme_report_link'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: 'Invalid document type' });
    }

    // Get the document BLOB from database
    const [rows] = await pool.query(
      `SELECT ${type} FROM events_attended WHERE id = ? AND Userid = ?`,
      [id, userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Event not found or access denied' });
    }

    const documentBuffer = rows[0][type];
    if (!documentBuffer) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Set appropriate headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${type}_${id}.pdf"`);

    // Send the BLOB data
    res.send(documentBuffer);
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete event
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = getUserId(req);
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication error: User ID not found' });
    }

    // Check if event exists and belongs to user
    const [rows] = await pool.query(
      'SELECT * FROM events_attended WHERE id = ? AND Userid = ?',
      [req.params.id, userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Event not found or access denied' });
    }

    // Delete event
    const [result] = await pool.query(
      'DELETE FROM events_attended WHERE id = ? AND Userid = ?',
      [req.params.id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.status(200).json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;