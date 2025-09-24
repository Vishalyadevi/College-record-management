import express from 'express';
import { pool } from '../db/db.js';
import { authenticate as authenticateToken} from '../middlewares/auth.js';

const router = express.Router();

// Validation middleware for all personal information fields
const validatePersonalInfo = (req, res, next) => {
  const requiredFields = [
    'full_name', 'date_of_birth', 'gender', 'email', 
    'mobile_number', 'communication_address', 'permanent_address',
    'religion', 'community', 'caste', 'post'
  ];
  
  const missingFields = requiredFields.filter(field => !req.body[field] || req.body[field].toString().trim() === '');
  
  if (missingFields.length > 0) {
    return res.status(400).json({
      message: `Missing required fields: ${missingFields.join(', ')}`
    });
  }

  // Validate email format
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  if (!emailRegex.test(req.body.email)) {
    return res.status(400).json({
      message: 'Invalid email format'
    });
  }

  // Validate mobile number (should be 10 digits)
  const mobileRegex = /^\d{10}$/;
  if (!mobileRegex.test(req.body.mobile_number.toString())) {
    return res.status(400).json({
      message: 'Mobile number should be exactly 10 digits'
    });
  }

  // Validate gender
  const validGenders = ['Male', 'Female', 'Other'];
  if (!validGenders.includes(req.body.gender)) {
    return res.status(400).json({
      message: 'Gender must be Male, Female, or Other'
    });
  }

  // Validate date of birth
  const dob = new Date(req.body.date_of_birth);
  if (isNaN(dob.getTime())) {
    return res.status(400).json({
      message: 'Invalid date of birth format'
    });
  }

  // Validate age if provided
  if (req.body.age && (req.body.age < 0 || req.body.age > 150)) {
    return res.status(400).json({
      message: 'Age must be between 0 and 150'
    });
  }

  // Validate h_index if provided
  if (req.body.h_index && req.body.h_index < 0) {
    return res.status(400).json({
      message: 'H-index cannot be negative'
    });
  }

  // Validate citation_index if provided
  if (req.body.citation_index && req.body.citation_index < 0) {
    return res.status(400).json({
      message: 'Citation index cannot be negative'
    });
  }

  // Validate ORCID format if provided
  if (req.body.orcid && !/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/.test(req.body.orcid)) {
    return res.status(400).json({
      message: 'Invalid ORCID format. Should be XXXX-XXXX-XXXX-XXXX'
    });
  }

  next();
};

// Helper function to format date for MySQL
const formatDateForMySQL = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
};

// Helper function to calculate age
const calculateAge = (dateOfBirth) => {
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

// Get all personal information records for the authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
        id, Userid, full_name, date_of_birth, age, gender, email, mobile_number,
        communication_address, permanent_address, religion, community, caste,
        post, applied_date, anna_university_faculty_id, aicte_faculty_id,
        orcid, researcher_id, google_scholar_id, scopus_profile, vidwan_profile,
        supervisor_id, h_index, citation_index, created_at, updated_at
      FROM personal_information 
      WHERE Userid = ? 
      ORDER BY created_at DESC`, 
      [req.user.Userid]
    );
    
    // Format dates for frontend
    const formattedRows = rows.map(row => ({
      ...row,
      date_of_birth: row.date_of_birth ? formatDateForMySQL(row.date_of_birth) : null,
      applied_date: row.applied_date ? formatDateForMySQL(row.applied_date) : null
    }));
    
    res.status(200).json(formattedRows);
  } catch (error) {
    console.error('Error fetching personal information:', error);
    res.status(500).json({ message: 'Server error while fetching data' });
  }
});

// Get personal information record by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
        id, Userid, full_name, date_of_birth, age, gender, email, mobile_number,
        communication_address, permanent_address, religion, community, caste,
        post, applied_date, anna_university_faculty_id, aicte_faculty_id,
        orcid, researcher_id, google_scholar_id, scopus_profile, vidwan_profile,
        supervisor_id, h_index, citation_index, created_at, updated_at
      FROM personal_information 
      WHERE id = ? AND Userid = ?`, 
      [req.params.id, req.user.Userid]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Record not found' });
    }
    
    const record = rows[0];
    // Format dates for frontend
    record.date_of_birth = record.date_of_birth ? formatDateForMySQL(record.date_of_birth) : null;
    record.applied_date = record.applied_date ? formatDateForMySQL(record.applied_date) : null;
    
    res.status(200).json(record);
  } catch (error) {
    console.error('Error fetching personal information:', error);
    res.status(500).json({ message: 'Server error while fetching record' });
  }
});

// Create new personal information record
router.post('/', authenticateToken, validatePersonalInfo, async (req, res) => {
  const data = req.body;

  try {
    // Calculate age from date of birth if not provided
    let age = data.age;
    if (!age && data.date_of_birth) {
      age = calculateAge(data.date_of_birth);
    }

    // Check if user already has a personal info record (since unique constraint exists)
    const [existingRecords] = await pool.query(
      'SELECT id FROM personal_information WHERE Userid = ?',
      [req.user.Userid]
    );

    if (existingRecords.length > 0) {
      return res.status(409).json({ 
        message: 'Personal information already exists for this user. Use update instead.' 
      });
    }

    const [result] = await pool.query(
      `INSERT INTO personal_information (
        Userid, full_name, date_of_birth, age, gender, email, mobile_number,
        communication_address, permanent_address, religion, community, caste,
        post, applied_date, anna_university_faculty_id, aicte_faculty_id,
        orcid, researcher_id, google_scholar_id, scopus_profile, vidwan_profile,
        supervisor_id, h_index, citation_index
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.Userid,
        data.full_name ? data.full_name.trim() : null,
        formatDateForMySQL(data.date_of_birth),
        age,
        data.gender,
        data.email ? data.email.trim().toLowerCase() : null,
        data.mobile_number ? data.mobile_number.toString().trim() : null,
        data.communication_address ? data.communication_address.trim() : null,
        data.permanent_address ? data.permanent_address.trim() : null,
        data.religion ? data.religion.trim() : null,
        data.community ? data.community.trim() : null,
        data.caste ? data.caste.trim() : null,
        data.post ? data.post.trim() : null,
        data.applied_date ? formatDateForMySQL(data.applied_date) : null,
        data.anna_university_faculty_id ? data.anna_university_faculty_id.trim() : null,
        data.aicte_faculty_id ? data.aicte_faculty_id.trim() : null,
        data.orcid ? data.orcid.trim() : null,
        data.researcher_id ? data.researcher_id.trim() : null,
        data.google_scholar_id ? data.google_scholar_id.trim() : null,
        data.scopus_profile ? data.scopus_profile.trim() : null,
        data.vidwan_profile ? data.vidwan_profile.trim() : null,
        data.supervisor_id ? parseInt(data.supervisor_id) : null,
        data.h_index ? parseInt(data.h_index) : null,
        data.citation_index ? parseInt(data.citation_index) : null
      ]
    );

    res.status(201).json({ 
      message: 'Personal information created successfully', 
      id: result.insertId 
    });
  } catch (error) {
    console.error('Error creating personal information:', error);
    
    // Handle duplicate email error
    if (error.code === 'ER_DUP_ENTRY') {
      if (error.message.includes('email')) {
        return res.status(409).json({ message: 'Email already exists' });
      }
      if (error.message.includes('unique_user_personal_info')) {
        return res.status(409).json({ message: 'Personal information already exists for this user' });
      }
    }
    
    res.status(500).json({ message: 'Server error while creating record' });
  }
});

// Update personal information record
router.put('/:id', authenticateToken, validatePersonalInfo, async (req, res) => {
  const data = req.body;

  try {
    // Check if record exists and belongs to user
    const [rows] = await pool.query(
      'SELECT * FROM personal_information WHERE id = ? AND Userid = ?', 
      [req.params.id, req.user.Userid]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Record not found' });
    }

    // Calculate age from date of birth if not provided
    let age = data.age;
    if (!age && data.date_of_birth) {
      age = calculateAge(data.date_of_birth);
    }

    await pool.query(
      `UPDATE personal_information SET
        full_name = ?, date_of_birth = ?, age = ?, gender = ?, email = ?,
        mobile_number = ?, communication_address = ?, permanent_address = ?,
        religion = ?, community = ?, caste = ?, post = ?,
        applied_date = ?, anna_university_faculty_id = ?, aicte_faculty_id = ?,
        orcid = ?, researcher_id = ?, google_scholar_id = ?, scopus_profile = ?,
        vidwan_profile = ?, supervisor_id = ?, h_index = ?, citation_index = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND Userid = ?`,
      [
        data.full_name ? data.full_name.trim() : null,
        formatDateForMySQL(data.date_of_birth),
        age,
        data.gender,
        data.email ? data.email.trim().toLowerCase() : null,
        data.mobile_number ? data.mobile_number.toString().trim() : null,
        data.communication_address ? data.communication_address.trim() : null,
        data.permanent_address ? data.permanent_address.trim() : null,
        data.religion ? data.religion.trim() : null,
        data.community ? data.community.trim() : null,
        data.caste ? data.caste.trim() : null,
        data.post ? data.post.trim() : null,
        data.applied_date ? formatDateForMySQL(data.applied_date) : null,
        data.anna_university_faculty_id ? data.anna_university_faculty_id.trim() : null,
        data.aicte_faculty_id ? data.aicte_faculty_id.trim() : null,
        data.orcid ? data.orcid.trim() : null,
        data.researcher_id ? data.researcher_id.trim() : null,
        data.google_scholar_id ? data.google_scholar_id.trim() : null,
        data.scopus_profile ? data.scopus_profile.trim() : null,
        data.vidwan_profile ? data.vidwan_profile.trim() : null,
        data.supervisor_id ? parseInt(data.supervisor_id) : null,
        data.h_index ? parseInt(data.h_index) : null,
        data.citation_index ? parseInt(data.citation_index) : null,
        req.params.id,
        req.user.Userid
      ]
    );

    res.status(200).json({ message: 'Personal information updated successfully' });
  } catch (error) {
    console.error('Error updating personal information:', error);
    
    // Handle duplicate email error
    if (error.code === 'ER_DUP_ENTRY' && error.message.includes('email')) {
      return res.status(409).json({ message: 'Email already exists' });
    }
    
    res.status(500).json({ message: 'Server error while updating record' });
  }
});

// Partial update personal information record (PATCH method for partial updates)
router.patch('/:id', authenticateToken, async (req, res) => {
  const data = req.body;

  try {
    // Check if record exists and belongs to user
    const [rows] = await pool.query(
      'SELECT * FROM personal_information WHERE id = ? AND Userid = ?', 
      [req.params.id, req.user.Userid]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Record not found' });
    }

    // Validate only provided fields
    if (data.email && !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(data.email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    if (data.mobile_number && !/^\d{10}$/.test(data.mobile_number.toString())) {
      return res.status(400).json({ message: 'Mobile number should be exactly 10 digits' });
    }

    if (data.gender && !['Male', 'Female', 'Other'].includes(data.gender)) {
      return res.status(400).json({ message: 'Gender must be Male, Female, or Other' });
    }

    if (data.age && (data.age < 0 || data.age > 150)) {
      return res.status(400).json({ message: 'Age must be between 0 and 150' });
    }

    if (data.orcid && !/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/.test(data.orcid)) {
      return res.status(400).json({ message: 'Invalid ORCID format' });
    }

    // Build dynamic update query
    const updateFields = [];
    const updateValues = [];

    Object.keys(data).forEach(key => {
      if (key !== 'id' && key !== 'Userid' && key !== 'created_at') {
        if (key === 'date_of_birth' || key === 'applied_date') {
          updateFields.push(`${key} = ?`);
          updateValues.push(formatDateForMySQL(data[key]));
        } else if (key === 'supervisor_id' || key === 'h_index' || key === 'citation_index') {
          updateFields.push(`${key} = ?`);
          updateValues.push(data[key] ? parseInt(data[key]) : null);
        } else if (typeof data[key] === 'string') {
          updateFields.push(`${key} = ?`);
          updateValues.push(data[key].trim());
        } else {
          updateFields.push(`${key} = ?`);
          updateValues.push(data[key]);
        }
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(req.params.id, req.user.Userid);

    const query = `UPDATE personal_information SET ${updateFields.join(', ')} WHERE id = ? AND Userid = ?`;
    
    await pool.query(query, updateValues);

    res.status(200).json({ message: 'Personal information updated successfully' });
  } catch (error) {
    console.error('Error updating personal information:', error);
    
    if (error.code === 'ER_DUP_ENTRY' && error.message.includes('email')) {
      return res.status(409).json({ message: 'Email already exists' });
    }
    
    res.status(500).json({ message: 'Server error while updating record' });
  }
});

// Delete personal information record
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Check if record exists and belongs to user
    const [rows] = await pool.query(
      'SELECT * FROM personal_information WHERE id = ? AND Userid = ?', 
      [req.params.id, req.user.Userid]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Record not found' });
    }

    await pool.query(
      'DELETE FROM personal_information WHERE id = ? AND Userid = ?', 
      [req.params.id, req.user.Userid]
    );
    
    res.status(200).json({ message: 'Personal information deleted successfully' });
  } catch (error) {
    console.error('Error deleting personal information:', error);
    res.status(500).json({ message: 'Server error while deleting record' });
  }
});

// Get personal information by current user (convenience endpoint)
router.get('/user/current', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
        id, Userid, full_name, date_of_birth, age, gender, email, mobile_number,
        communication_address, permanent_address, religion, community, caste,
        post, applied_date, anna_university_faculty_id, aicte_faculty_id,
        orcid, researcher_id, google_scholar_id, scopus_profile, vidwan_profile,
        supervisor_id, h_index, citation_index, created_at, updated_at
      FROM personal_information 
      WHERE Userid = ? 
      ORDER BY created_at DESC LIMIT 1`, 
      [req.user.Userid]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'No personal information found for current user' });
    }
    
    const record = rows[0];
    // Format dates for frontend
    record.date_of_birth = record.date_of_birth ? formatDateForMySQL(record.date_of_birth) : null;
    record.applied_date = record.applied_date ? formatDateForMySQL(record.applied_date) : null;
    
    res.status(200).json(record);
  } catch (error) {
    console.error('Error fetching current user personal information:', error);
    res.status(500).json({ message: 'Server error while fetching user data' });
  }
});

// Get personal information statistics
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const [stats] = await pool.query(
      `SELECT 
        COUNT(*) as total_records,
        AVG(age) as average_age,
        AVG(h_index) as average_h_index,
        AVG(citation_index) as average_citations,
        COUNT(DISTINCT post) as unique_posts,
        COUNT(DISTINCT community) as unique_communities
      FROM personal_information 
      WHERE Userid = ?`,
      [req.user.Userid]
    );
    
    res.status(200).json(stats[0] || {});
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ message: 'Server error while fetching statistics' });
  }
});

// Search personal information records
router.get('/search/:query', authenticateToken, async (req, res) => {
  try {
    const searchQuery = `%${req.params.query}%`;
    
    const [rows] = await pool.query(
      `SELECT 
        id, Userid, full_name, date_of_birth, age, gender, email, mobile_number,
        communication_address, permanent_address, religion, community, caste,
        post, applied_date, anna_university_faculty_id, aicte_faculty_id,
        orcid, researcher_id, google_scholar_id, scopus_profile, vidwan_profile,
        supervisor_id, h_index, citation_index, created_at, updated_at
      FROM personal_information 
      WHERE Userid = ? AND (
        full_name LIKE ? OR 
        email LIKE ? OR 
        post LIKE ? OR 
        community LIKE ? OR 
        religion LIKE ?
      )
      ORDER BY created_at DESC`,
      [req.user.Userid, searchQuery, searchQuery, searchQuery, searchQuery, searchQuery]
    );
    
    // Format dates for frontend
    const formattedRows = rows.map(row => ({
      ...row,
      date_of_birth: row.date_of_birth ? formatDateForMySQL(row.date_of_birth) : null,
      applied_date: row.applied_date ? formatDateForMySQL(row.applied_date) : null
    }));
    
    res.status(200).json(formattedRows);
  } catch (error) {
    console.error('Error searching personal information:', error);
    res.status(500).json({ message: 'Server error while searching records' });
  }
});

export default router;