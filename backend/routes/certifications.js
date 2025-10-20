import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../db/db.js';
import { authenticate as authenticateToken } from '../middlewares/auth.js';
import { uploadCertificateFile, deleteFile, getFullPath } from '../middlewares/uploadCertConfig.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Helper functions
function calculateWeeks(days) {
  if (!days || days <= 0) return 0;
  return Math.round((days / 7) * 10) / 10;
}

function calculateDays(fromDate, toDate) {
  if (!fromDate || !toDate) return 0;
  const from = new Date(fromDate);
  const to = new Date(toDate);
  const differenceInTime = to - from;
  return Math.ceil(differenceInTime / (1000 * 3600 * 24)) + 1;
}

function validateDates(fromDate, toDate, certificationDate) {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

  if (!dateRegex.test(fromDate) || !dateRegex.test(toDate) || !dateRegex.test(certificationDate)) {
    return { isValid: false, message: 'Invalid date format. Use YYYY-MM-DD format' };
  }

  const from = new Date(fromDate);
  const to = new Date(toDate);
  const cert = new Date(certificationDate);

  if (isNaN(from.getTime()) || isNaN(to.getTime()) || isNaN(cert.getTime())) {
    return { isValid: false, message: 'Invalid date values provided' };
  }

  if (from >= to) {
    return { isValid: false, message: 'From date must be before to date' };
  }

  if (cert < from) {
    return { isValid: false, message: 'Certification date cannot be before course start date' };
  }

  return { isValid: true };
}

// GET all certifications
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM certification_courses WHERE Userid = ? ORDER BY created_at DESC',
      [req.user.Userid]
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching certifications:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET single certification by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM certification_courses WHERE id = ? AND Userid = ?',
      [req.params.id, req.user.Userid]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Certification not found' });
    }
    
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Error fetching certification:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// CREATE new certification with file upload
router.post('/', authenticateToken, uploadCertificateFile, async (req, res) => {
  const { course_name, offered_by, from_date, to_date, certification_date } = req.body;
  
  try {
    // Validation
    if (!course_name?.trim() || !offered_by?.trim() || !from_date || !to_date || !certification_date) {
      if (req.file) {
        deleteFile(req.file.path);
      }
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Certificate PDF is required' });
    }
    
    // Validate course name length
    if (course_name.trim().length < 3) {
      if (req.file) {
        deleteFile(req.file.path);
      }
      return res.status(400).json({ message: 'Course name must be at least 3 characters long' });
    }
    
    // Validate offered by length
    if (offered_by.trim().length < 2) {
      if (req.file) {
        deleteFile(req.file.path);
      }
      return res.status(400).json({ message: 'Offered by must be at least 2 characters long' });
    }
    
    // Validate dates
    const dateValidation = validateDates(from_date, to_date, certification_date);
    if (!dateValidation.isValid) {
      if (req.file) {
        deleteFile(req.file.path);
      }
      return res.status(400).json({ message: dateValidation.message });
    }
    
    // Calculate days and weeks
    const days = calculateDays(from_date, to_date);
    const weeks = calculateWeeks(days);
    
    if (days <= 0) {
      if (req.file) {
        deleteFile(req.file.path);
      }
      return res.status(400).json({ message: 'Invalid date range' });
    }
    
    // Get file path (store relative path in database)
    const certificatePath = `uploads/certificates/${req.file.filename}`;
    
    // Insert new certification
    const [result] = await pool.query(
      `INSERT INTO certification_courses 
       (Userid, course_name, offered_by, from_date, to_date, days, weeks, certification_date, certificate_pdf) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.Userid,
        course_name.trim(),
        offered_by.trim(),
        from_date,
        to_date,
        days,
        weeks,
        certification_date,
        certificatePath
      ]
    );
    
    res.status(201).json({ 
      message: 'Certification created successfully', 
      id: result.insertId,
      file: req.file.filename
    });
  } catch (error) {
    if (req.file) {
      deleteFile(req.file.path);
    }
    console.error('Error creating certification:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// UPDATE certification with optional file upload
router.put('/:id', authenticateToken, uploadCertificateFile, async (req, res) => {
  const { course_name, offered_by, from_date, to_date, certification_date } = req.body;
  
  try {
    // Validation
    if (!course_name?.trim() || !offered_by?.trim() || !from_date || !to_date || !certification_date) {
      if (req.file) {
        deleteFile(req.file.path);
      }
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Validate course name length
    if (course_name.trim().length < 3) {
      if (req.file) {
        deleteFile(req.file.path);
      }
      return res.status(400).json({ message: 'Course name must be at least 3 characters long' });
    }
    
    // Validate offered by length
    if (offered_by.trim().length < 2) {
      if (req.file) {
        deleteFile(req.file.path);
      }
      return res.status(400).json({ message: 'Offered by must be at least 2 characters long' });
    }
    
    // Validate dates
    const dateValidation = validateDates(from_date, to_date, certification_date);
    if (!dateValidation.isValid) {
      if (req.file) {
        deleteFile(req.file.path);
      }
      return res.status(400).json({ message: dateValidation.message });
    }
    
    // Calculate days and weeks
    const days = calculateDays(from_date, to_date);
    const weeks = calculateWeeks(days);
    
    if (days <= 0) {
      if (req.file) {
        deleteFile(req.file.path);
      }
      return res.status(400).json({ message: 'Invalid date range' });
    }
    
    // Check if certification exists and belongs to user
    const [rows] = await pool.query(
      'SELECT * FROM certification_courses WHERE id = ? AND Userid = ?',
      [req.params.id, req.user.Userid]
    );
    
    if (rows.length === 0) {
      if (req.file) {
        deleteFile(req.file.path);
      }
      return res.status(404).json({ message: 'Certification not found or access denied' });
    }
    
    const oldCertification = rows[0];
    
    // Get new file path or keep old one
    let certificatePath = oldCertification.certificate_pdf;
    
    if (req.file) {
      // Delete old file if it exists
      if (oldCertification.certificate_pdf) {
        const oldFilePath = getFullPath(oldCertification.certificate_pdf);
        deleteFile(oldFilePath);
      }
      certificatePath = `uploads/certificates/${req.file.filename}`;
    }
    
    // Update certification
    const [result] = await pool.query(
      `UPDATE certification_courses SET 
        course_name = ?, 
        offered_by = ?, 
        from_date = ?, 
        to_date = ?, 
        days = ?, 
        weeks = ?,
        certification_date = ?, 
        certificate_pdf = ?,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND Userid = ?`,
      [
        course_name.trim(),
        offered_by.trim(),
        from_date,
        to_date,
        days,
        weeks,
        certification_date,
        certificatePath,
        req.params.id,
        req.user.Userid
      ]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Certification not found or no changes made' });
    }
    
    res.status(200).json({ 
      message: 'Certification updated successfully',
      file: req.file ? req.file.filename : null
    });
  } catch (error) {
    if (req.file) {
      deleteFile(req.file.path);
    }
    console.error('Error updating certification:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DELETE certification
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Check if certification exists and belongs to user
    const [rows] = await pool.query(
      'SELECT * FROM certification_courses WHERE id = ? AND Userid = ?',
      [req.params.id, req.user.Userid]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Certification not found or access denied' });
    }
    
    const certification = rows[0];
    
    // Delete file if exists
    if (certification.certificate_pdf) {
      const filePath = getFullPath(certification.certificate_pdf);
      deleteFile(filePath);
    }
    
    // Delete certification
    const [result] = await pool.query(
      'DELETE FROM certification_courses WHERE id = ? AND Userid = ?',
      [req.params.id, req.user.Userid]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Certification not found' });
    }
    
    res.status(200).json({ message: 'Certification deleted successfully' });
  } catch (error) {
    console.error('Error deleting certification:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;