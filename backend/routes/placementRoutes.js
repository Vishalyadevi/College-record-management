import express from 'express';
import mysql from 'mysql2/promise';
import multer from 'multer';
import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import PDFDocument from 'pdfkit';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// MySQL Connection Pool
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Vishal2005#',
  database: process.env.DB_NAME || 'record',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password',
  },
});

// Multer setup for general file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'Uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}${path.extname(file.originalname)}`),
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error('Only JPEG, PNG, and PDF files are allowed.'), false);
  }
  cb(null, true);
};

const upload = multer({ storage, fileFilter });

// Feedback-specific multer setup
const feedbackStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'Uploads/feedback/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const feedbackFileFilter = (req, file, cb) => {
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error('Only PDF, JPEG, and PNG files are allowed.'), false);
  }
  cb(null, true);
};

const feedbackUpload = multer({ storage: feedbackStorage, fileFilter: feedbackFileFilter });

// Placement Login Route
router.post('/login', async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ message: 'Identifier and password are required' });
  }

  try {
    let query;
    let params;

    if (/^\d+$/.test(identifier)) {
      query = `
        SELECT u.*, sd.regno 
        FROM users u 
        JOIN student_details sd ON u.Userid = sd.Userid 
        WHERE sd.regno = ? AND u.status = 'active' AND u.role = 'Student'
      `;
      params = [identifier];
    } else {
      query = `
        SELECT * FROM users 
        WHERE username = ? AND status = 'active' 
        AND (role = 'Admin' OR role = 'Staff')
      `;
      params = [identifier];
    }

    const [results] = await db.query(query, params);

    if (results.length === 0) {
      return res.status(401).json({ message: 'Invalid identifier or account not authorized' });
    }

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    const token = jwt.sign(
      {
        userId: user.Userid,
        role: user.role,
        username: user.username,
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );

    return res.json({
      message: 'Login successful',
      token,
      role: user.role.toLowerCase(),
      userId: user.Userid,
      username: user.username,
      email: user.email,
      regno: user.regno || null,
    });
  } catch (err) {
    console.error('Placement login error:', err);
    return res.status(500).json({ message: 'Database error' });
  }
});

// Get Notifications
router.get('/notifications', async (req, res) => {
  try {
    const [results] = await db.query(
      'SELECT id, message, created_at FROM notifications ORDER BY created_at DESC LIMIT 10'
    );
    res.json(results);
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ message: 'Error fetching notifications' });
  }
});

// Add Notification
router.post('/notifications', async (req, res) => {
  const { message, created_by } = req.body;

  if (!message || message.trim() === '' || !created_by) {
    return res.status(400).json({ error: 'Notification message and created_by are required' });
  }

  try {
    const [userRows] = await db.query('SELECT Userid FROM users WHERE Userid = ? AND status = "active"', [created_by]);
    if (userRows.length === 0) {
      return res.status(400).json({ message: 'Invalid or inactive Created_by user' });
    }

    const [result] = await db.query(
      'INSERT INTO notifications (message, Created_by, Updated_by) VALUES (?, ?, ?)',
      [message.trim(), created_by, created_by]
    );
    res.status(201).json({
      message: 'Notification added successfully!',
      id: result.insertId,
    });
  } catch (err) {
    console.error('Error adding notification:', err);
    return res.status(500).json({ error: 'Failed to add notification' });
  }
});

// Add Upcoming Drive
router.post('/upcoming-drives', upload.single('post'), async (req, res) => {
  const { company_name, eligibility, date, time, venue, roles, salary, created_by } = req.body;

  if (!company_name || !eligibility || !date || !time || !venue || !created_by) {
    return res.status(400).json({ message: 'Required fields are missing' });
  }

  try {
    const [userRows] = await db.query('SELECT Userid FROM users WHERE Userid = ? AND status = "active"', [created_by]);
    if (userRows.length === 0) {
      return res.status(400).json({ message: 'Invalid or inactive Created_by user' });
    }

    const postFilePath = req.file ? req.file.filename : null;
    const salaryValue = salary ? salary.toString().trim() : 'Not specified';
    const rolesValue = roles && roles.trim() !== '' ? roles : 'Not specified';

    const query = `
      INSERT INTO upcomingdrives_placement (post, company_name, eligibility, date, time, venue, roles, salary, Created_by, Updated_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.query(query, [postFilePath, company_name, eligibility, date, time, venue, rolesValue, salaryValue, created_by, created_by]);

    const notificationMsg = `📢 New Drive Alert! ${company_name} is hiring for ${rolesValue} on ${date} at ${time} in ${venue}. Package: ${salaryValue}`;
    const notifQuery = `INSERT INTO notifications (message, Created_by, Updated_by) VALUES (?, ?, ?)`;

    await db.query(notifQuery, [notificationMsg, created_by, created_by]);
    res.status(201).json({ message: 'Upcoming drive added successfully!' });
  } catch (err) {
    console.error('Database error:', err);
    return res.status(500).json({ message: 'Database error' });
  }
});

// Get Upcoming Drives
router.get('/upcoming-drives', async (req, res) => {
  const query = 'SELECT * FROM upcomingdrives_placement ORDER BY date ASC, time ASC';
  try {
    const [results] = await db.query(query);
    res.status(200).json(results);
  } catch (err) {
    console.error('Error fetching upcoming drives:', err);
    return res.status(500).json({ message: 'Database error' });
  }
});

// Delete Upcoming Drive
router.delete('/upcoming-drives/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.query('DELETE FROM upcomingdrives_placement WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Drive not found' });
    }

    res.status(200).json({ message: 'Drive deleted successfully' });
  } catch (err) {
    console.error('Error deleting drive:', err);
    res.status(500).json({ message: 'Error deleting drive' });
  }
});

// Get Companies
router.get('/companies', async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM companies ORDER BY companyName');
    res.status(200).json({ companies: results });
  } catch (err) {
    console.error('Error fetching companies:', err);
    return res.status(500).json({ message: 'Error fetching companies.' });
  }
});

// Add Company
router.post('/add-company', upload.single('logo'), async (req, res) => {
  try {
    const { companyName, description, ceo, location, objective, package: salaryPackage, created_by } = req.body;
    let { skillSets, localBranches, roles } = req.body;

    if (!companyName || !description || !ceo || !location || !salaryPackage || !objective || !created_by) {
      return res.status(400).json({ message: 'All required fields must be provided.' });
    }

    const [userRows] = await db.query('SELECT Userid FROM users WHERE Userid = ? AND status = "active"', [created_by]);
    if (userRows.length === 0) {
      return res.status(400).json({ message: 'Invalid or inactive Created_by user' });
    }

    skillSets = skillSets ? JSON.parse(skillSets) : [];
    localBranches = localBranches ? JSON.parse(localBranches) : [];
    roles = roles ? JSON.parse(roles) : [];

    if (skillSets.length === 0 || localBranches.length === 0 || roles.length === 0) {
      return res.status(400).json({ message: 'SkillSets, localBranches, and roles cannot be empty.' });
    }

    const logo = req.file ? req.file.filename : null;

    const sql = `INSERT INTO companies
                 (companyName, description, ceo, location, package, objective, skillSets, localBranches, roles, logo, Created_by, Updated_by)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    await db.query(sql, [
      companyName,
      description,
      ceo,
      location,
      salaryPackage,
      objective,
      JSON.stringify(skillSets),
      JSON.stringify(localBranches),
      JSON.stringify(roles),
      logo,
      created_by,
      created_by,
    ]);

    res.status(201).json({ message: 'Company added successfully', company: { companyName, logo } });
  } catch (error) {
    console.error('Error adding company:', error);
    if (error instanceof SyntaxError) {
      return res.status(400).json({ message: 'Invalid JSON format in skillSets, localBranches, or roles.' });
    }
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Company already exists.' });
    }
    res.status(500).json({ message: 'Internal Server Error.', error: error.message });
  }
});

// Update Company
router.put('/company/:companyName', async (req, res) => {
  const { companyName } = req.params;
  const { description, objective, ceo, location, skillSets, localBranches, roles, package: companyPackage, updated_by } = req.body;

  if (!updated_by) {
    return res.status(400).json({ message: 'Updated_by is required' });
  }

  try {
    const [userRows] = await db.query('SELECT Userid FROM users WHERE Userid = ? AND status = "active"', [updated_by]);
    if (userRows.length === 0) {
      return res.status(400).json({ message: 'Invalid or inactive Updated_by user' });
    }

    const query = `
      UPDATE companies
      SET description = ?, objective = ?, ceo = ?, location = ?, 
          skillSets = ?, localBranches = ?, roles = ?, package = ?, Updated_by = ?, updated_at = CURRENT_TIMESTAMP
      WHERE companyName = ?
    `;

    const values = [
      description,
      objective,
      ceo,
      location,
      JSON.stringify(skillSets),
      JSON.stringify(localBranches),
      JSON.stringify(roles),
      companyPackage,
      updated_by,
      companyName,
    ];

    const [result] = await db.query(query, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Company not found' });
    }

    res.json({ message: 'Company updated successfully' });
  } catch (err) {
    console.error('Error updating company:', err);
    return res.status(500).json({ message: 'Update failed' });
  }
});

// Delete Company
router.delete('/company/:companyId', async (req, res) => {
  const { companyId } = req.params;

  try {
    const [result] = await db.query('DELETE FROM companies WHERE id = ?', [companyId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Company not found' });
    }

    res.json({ message: 'Company deleted successfully' });
  } catch (err) {
    console.error('Error deleting company:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get Recruiters Count
router.get('/recruiterscount', async (req, res) => {
  try {
    const [results] = await db.query('SELECT COUNT(*) AS total FROM companies');
    res.json({ total: results[0].total });
  } catch (err) {
    console.error('Error fetching recruiter count:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Add Placed Student
router.post('/placed-students', async (req, res) => {
  const { regno, company_name, role, package: salarypackage, year, created_by } = req.body;

  if (!regno || !company_name || !role || !salarypackage || !year || !created_by) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const [userRows] = await db.query('SELECT Userid FROM student_details WHERE regno = ? AND Userid IN (SELECT Userid FROM users WHERE role = "Student" AND status = "active")', [regno]);
    if (userRows.length === 0) {
      return res.status(400).json({ message: 'Invalid or inactive student regno' });
    }
    const Userid = userRows[0].Userid;

    const [createdByRows] = await db.query('SELECT Userid FROM users WHERE Userid = ? AND status = "active"', [created_by]);
    if (createdByRows.length === 0) {
      return res.status(400).json({ message: 'Invalid or inactive Created_by user' });
    }

    const query = `INSERT INTO placed_student (Userid, regno, company_name, role, package, year, Created_by, Updated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    await db.query(query, [Userid, regno, company_name, role, salarypackage, year, created_by, created_by]);
    res.status(201).json({ message: 'Placement details added successfully!' });
  } catch (error) {
    console.error('Database error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Student placement already exists' });
    }
    res.status(500).json({ message: 'Database error', error: error.message });
  }
});

// Get Placed Students
router.get('/placed-students', async (req, res) => {
  const { company } = req.query;

  let sql = `
    SELECT 
      ps.id,
      COALESCE(sd.regno, 'N/A') as regno,
      COALESCE(sd.personal_email, sd.tutorEmail, u.email) as email,
      COALESCE(sd.tutorEmail, '') as tutorEmail,
      COALESCE(sd.Deptid, 0) as Deptid,
      COALESCE(sd.batch, 'N/A') as batch,
      COALESCE(u.username, 'Unknown') as name,
      ps.company_name,
      ps.role,
      ps.package,
      ps.year,
      ps.created_at
    FROM placed_student ps
    LEFT JOIN student_details sd ON ps.Userid = sd.Userid
    LEFT JOIN users u ON ps.Userid = u.Userid
  `;
  const params = [];

  if (company) {
    sql += ' WHERE ps.company_name = ?';
    params.push(company);
  }

  sql += ' ORDER BY ps.year DESC, ps.created_at DESC';

  try {
    const [results] = await db.query(sql, params);
    res.json(results);
  } catch (err) {
    console.error('Database error in placed-students:', err);
    res.status(500).json({
      error: 'Failed to fetch placed students',
      details: process.env.NODE_ENV === 'development' ? err.message : 'Database error',
    });
  }
});

// Get Placement Stats
router.get('/stats', async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT 
        COUNT(*) AS total_students, 
        AVG(package) AS avg_salary, 
        MAX(package) AS highest_salary 
      FROM placed_student
    `);
    res.json(results[0]);
  } catch (err) {
    console.error('Error fetching stats:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Get Placed Student Companies
router.get('/placed-student-companies', async (req, res) => {
  try {
    const [results] = await db.query('SELECT DISTINCT company_name FROM placed_student ORDER BY company_name');
    res.json(results);
  } catch (err) {
    console.error('Error fetching companies from placed_student:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Get Student Details by Company and Year
router.get('/student-details', async (req, res) => {
  const { companyName, year } = req.query;

  if (!companyName || !year) {
    return res.status(400).json({ error: 'Company name and year are required' });
  }

  try {
    const [results] = await db.query(
      'SELECT u.username, u.email, ps.role, ps.package, sd.regno ' +
      'FROM placed_student ps ' +
      'JOIN users u ON ps.Userid = u.Userid ' +
      'JOIN student_details sd ON ps.Userid = sd.Userid ' +
      'WHERE ps.company_name = ? AND ps.year = ? ORDER BY u.username',
      [companyName, year]
    );
    res.json(results.map(row => ({
      username: row.username,
      email: row.email,
      regno: row.regno,
      role: row.role,
      package: row.package,
    })));
  } catch (err) {
    console.error('Error fetching student details:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Import Placed Students
router.post('/import-placed-students', async (req, res) => {
  try {
    const { students, created_by } = req.body;

    if (!students || !Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ error: 'No students data provided' });
    }

    if (!created_by) {
      return res.status(400).json({ error: 'Created_by is required' });
    }

    const [createdByRows] = await db.query('SELECT Userid FROM users WHERE Userid = ? AND status = "active"', [created_by]);
    if (createdByRows.length === 0) {
      return res.status(400).json({ message: 'Invalid or inactive Created_by user' });
    }

    const query = 'INSERT INTO placed_student (Userid, regno, company_name, role, package, year, Created_by, Updated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    let successCount = 0;
    let errorCount = 0;

    await Promise.all(
      students.map(async (student, index) => {
        try {
          const regno = student['Reg No']?.toString().trim() || null;
          const company_name = student['Company Name']?.trim() || null;
          const role = student['role']?.trim() || null;
          let salarypackage = parseFloat(student['package']?.toString().replace(/[^\d.]/g, ''));
          if (isNaN(salarypackage)) salarypackage = 0.0;
          const year = Number(student['year']) || null;

          if (!regno || !company_name || !role || !year) {
            console.warn(`Skipping student due to missing values:`, student);
            errorCount++;
            return;
          }

          const [userRows] = await db.query('SELECT Userid FROM student_details WHERE regno = ? AND Userid IN (SELECT Userid FROM users WHERE role = "Student" AND status = "active")', [regno]);
          if (userRows.length === 0) {
            console.warn(`Skipping student ${regno}: Invalid or inactive student`);
            errorCount++;
            return;
          }

          await db.query(query, [userRows[0].Userid, regno, company_name, role, salarypackage, year, created_by, created_by]);
          successCount++;
        } catch (error) {
          console.error(`Error inserting student ${index + 1}:`, error);
          errorCount++;
        }
      })
    );

    res.status(200).json({
      message: `Import completed! ${successCount} students imported successfully, ${errorCount} failed.`,
    });
  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Add Student Profile
router.post('/student-profile', async (req, res) => {
  try {
    const {
      regno, name, batch, hsc_percentage, sslc_percentage, sem1_cgpa, sem2_cgpa,
      sem3_cgpa, sem4_cgpa, sem5_cgpa, sem6_cgpa, sem7_cgpa, sem8_cgpa,
      history_of_arrear, standing_arrear, address, student_mobile, secondary_mobile,
      college_email, personal_email, aadhar_number, pancard_number, passport, created_by,
      Deptid, Semester, date_of_joining, date_of_birth, blood_group, tutorEmail,
      first_graduate, student_type, mother_tongue, identification_mark, extracurricularID,
      religion, caste, community, gender, seat_type, section, door_no, street, cityID,
      districtID, stateID, countryID, pincode, personal_phone,
    } = req.body;

    if (!regno || !name || !college_email || !created_by || !Deptid) {
      return res.status(400).json({ error: 'Regno, name, college email, created_by, and Deptid are required' });
    }

    const [userRows] = await db.query('SELECT Userid FROM users WHERE email = ? AND role = "Student" AND status = "active"', [college_email]);
    if (userRows.length === 0) {
      return res.status(400).json({ message: 'Invalid or inactive student email' });
    }
    const Userid = userRows[0].Userid;

    const [createdByRows] = await db.query('SELECT Userid FROM users WHERE Userid = ? AND status = "active"', [created_by]);
    if (createdByRows.length === 0) {
      return res.status(400).json({ message: 'Invalid or inactive Created_by user' });
    }

    const query = `
      INSERT INTO student_details (
        Userid, regno, name, Deptid, batch, Semester, date_of_joining, date_of_birth,
        blood_group, tutorEmail, personal_email, first_graduate, aadhar_card_no,
        student_type, mother_tongue, identification_mark, extracurricularID,
        religion, caste, community, gender, seat_type, section, door_no, street,
        cityID, districtID, stateID, countryID, pincode, personal_phone, createdAt,
        updatedAt, hsc_percentage, sslc_percentage, sem1_cgpa, sem2_cgpa, sem3_cgpa,
        sem4_cgpa, sem5_cgpa, sem6_cgpa, sem7_cgpa, sem8_cgpa, history_of_arrear,
        standing_arrear, address, student_mobile, secondary_mobile, college_email,
        pancard_number, passport, Created_by, Updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      Userid, regno, name, Deptid, batch, Semester, date_of_joining, date_of_birth,
      blood_group, tutorEmail, personal_email, first_graduate, aadhar_number,
      student_type, mother_tongue, identification_mark, extracurricularID,
      religion, caste, community, gender, seat_type, section, door_no, street,
      cityID, districtID, stateID, countryID, pincode, personal_phone, new Date(),
      new Date(), hsc_percentage, sslc_percentage, sem1_cgpa, sem2_cgpa, sem3_cgpa,
      sem4_cgpa, sem5_cgpa, sem6_cgpa, sem7_cgpa, sem8_cgpa, history_of_arrear,
      standing_arrear, address, student_mobile, secondary_mobile, college_email,
      pancard_number, passport, created_by, created_by,
    ];

    await db.query(query, values);
    res.status(201).json({ message: 'Profile created successfully!' });
  } catch (error) {
    console.error('Error creating student profile:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Student profile already exists' });
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Update Student Profile
router.put('/student-profile/:regno', async (req, res) => {
  const { regno } = req.params;
  const {
    name, batch, hsc_percentage, sslc_percentage, sem1_cgpa, sem2_cgpa, sem3_cgpa,
    sem4_cgpa, sem5_cgpa, sem6_cgpa, sem7_cgpa, sem8_cgpa, history_of_arrear,
    standing_arrear, address, student_mobile, secondary_mobile, college_email,
    personal_email, aadhar_number, pancard_number, passport, updated_by, Deptid,
    Semester, date_of_joining, date_of_birth, blood_group, tutorEmail, first_graduate,
    student_type, mother_tongue, identification_mark, extracurricularID, religion,
    caste, community, gender, seat_type, section, door_no, street, cityID, districtID,
    stateID, countryID, pincode, personal_phone,
  } = req.body;

  if (!updated_by) {
    return res.status(400).json({ message: 'Updated_by is required' });
  }

  try {
    const [userRows] = await db.query('SELECT Userid FROM student_details WHERE regno = ?', [regno]);
    if (userRows.length === 0) {
      return res.status(400).json({ message: 'Invalid student regno' });
    }
    const Userid = userRows[0].Userid;

    const [updatedByRows] = await db.query('SELECT Userid FROM users WHERE Userid = ? AND status = "active"', [updated_by]);
    if (updatedByRows.length === 0) {
      return res.status(400).json({ message: 'Invalid or inactive Updated_by user' });
    }

    const query = `
      UPDATE student_details
      SET name = ?, Deptid = ?, batch = ?, Semester = ?, date_of_joining = ?, date_of_birth = ?,
          blood_group = ?, tutorEmail = ?, personal_email = ?, first_graduate = ?, aadhar_card_no = ?,
          student_type = ?, mother_tongue = ?, identification_mark = ?, extracurricularID = ?,
          religion = ?, caste = ?, community = ?, gender = ?, seat_type = ?, section = ?,
          door_no = ?, street = ?, cityID = ?, districtID = ?, stateID = ?, countryID = ?,
          pincode = ?, personal_phone = ?, updatedAt = ?, hsc_percentage = ?, sslc_percentage = ?,
          sem1_cgpa = ?, sem2_cgpa = ?, sem3_cgpa = ?, sem4_cgpa = ?, sem5_cgpa = ?,
          sem6_cgpa = ?, sem7_cgpa = ?, sem8_cgpa = ?, history_of_arrear = ?, standing_arrear = ?,
          address = ?, student_mobile = ?, secondary_mobile = ?, college_email = ?, pancard_number = ?,
          passport = ?, Updated_by = ?
      WHERE Userid = ? AND regno = ?
    `;

    const values = [
      name, Deptid, batch, Semester, date_of_joining, date_of_birth, blood_group,
      tutorEmail, personal_email, first_graduate, aadhar_number, student_type,
      mother_tongue, identification_mark, extracurricularID, religion, caste,
      community, gender, seat_type, section, door_no, street, cityID, districtID,
      stateID, countryID, pincode, personal_phone, new Date(), hsc_percentage,
      sslc_percentage, sem1_cgpa, sem2_cgpa, sem3_cgpa, sem4_cgpa, sem5_cgpa,
      sem6_cgpa, sem7_cgpa, sem8_cgpa, history_of_arrear, standing_arrear, address,
      student_mobile, secondary_mobile, college_email, pancard_number, passport,
      updated_by, Userid, regno,
    ];

    const [result] = await db.query(query, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json({ message: 'Profile updated successfully!' });
  } catch (error) {
    console.error('Error updating student profile:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get Student Profile
router.get('/student-profile/:regno', async (req, res) => {
  const { regno } = req.params;

  try {
    const [results] = await db.query(
      'SELECT sd.*, u.email, u.username FROM student_details sd JOIN users u ON sd.Userid = u.Userid WHERE sd.regno = ?',
      [regno]
    );

    if (results.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json(results[0]);
  } catch (err) {
    console.error('Error fetching profile:', err);
    return res.status(500).json({ message: 'Database error' });
  }
});

// Register for Drive
router.post('/register-drive', async (req, res) => {
  const { drive_id, regno, company_name, register, created_by } = req.body;

  if (!drive_id || !regno || !company_name || !created_by) {
    return res.status(400).json({ error: 'Drive ID, regno, company name, and created_by are required' });
  }

  try {
    const [userRows] = await db.query('SELECT Userid FROM student_details WHERE regno = ? AND Userid IN (SELECT Userid FROM users WHERE role = "Student" AND status = "active")', [regno]);
    if (userRows.length === 0) {
      return res.status(400).json({ message: 'Invalid or inactive student regno' });
    }
    const Userid = userRows[0].Userid;

    const [createdByRows] = await db.query('SELECT Userid FROM users WHERE Userid = ? AND status = "active"', [created_by]);
    if (createdByRows.length === 0) {
      return res.status(400).json({ message: 'Invalid or inactive Created_by user' });
    }

    const query = `
      INSERT INTO registered_student_placement (id, Userid, regno, company_name, register, Created_by, Updated_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE register = VALUES(register), Updated_by = ?, updated_at = CURRENT_TIMESTAMP
    `;

    await db.query(query, [drive_id, Userid, regno, company_name, register, created_by, created_by, created_by]);
    res.json({ message: 'Drive registration updated successfully!' });
  } catch (err) {
    console.error('Error inserting into registered_student:', err);
    return res.status(500).json({ error: 'Database error' });
  }
});

// Get Registered Drives
router.get('/registered-drives/:regno', async (req, res) => {
  try {
    const { regno } = req.params;

    const [student] = await db.query(
      'SELECT u.* FROM users u JOIN student_details sd ON u.Userid = sd.Userid WHERE sd.regno = ? AND u.role = "Student" AND u.status = "active"',
      [regno]
    );

    if (!student.length) {
      return res.status(404).json({ message: 'Invalid or inactive student regno' });
    }

    const [rows] = await db.query(
      `SELECT r.id, r.company_name, r.register, r.created_at, u.username, sd.regno
       FROM registered_student_placement r
       JOIN users u ON r.Userid = u.Userid
       JOIN student_details sd ON r.Userid = sd.Userid
       WHERE sd.regno = ?`,
      [regno]
    );

    res.json(rows);
  } catch (error) {
    console.error('Error fetching registered drives:', error);
    res.status(500).json({ error: 'Failed to fetch registered drives' });
  }
});

// Get Admin Registered Students
router.get('/admin-registered-students', async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT 
        rs.id, 
        rs.Userid, 
        u.username AS name, 
        u.email AS college_email,
        sd.personal_email,
        sd.regno,
        rs.company_name, 
        sd.batch
      FROM registered_student_placement rs
      JOIN users u ON rs.Userid = u.Userid
      JOIN student_details sd ON rs.Userid = sd.Userid
      ORDER BY rs.company_name, u.username
      LIMIT 0, 1000
    `);
    res.json(results);
  } catch (err) {
    console.error('Error fetching registered students:', err);
    res.status(500).json({
      error: 'Failed to fetch registered students',
      details: process.env.NODE_ENV === 'development' ? err.message : 'Database error',
    });
  }
});

// Delete Unselected Students
router.delete('/delete-unselected-students', async (req, res) => {
  const { selectedUserIds } = req.body;

  if (!selectedUserIds || !Array.isArray(selectedUserIds) || selectedUserIds.length === 0) {
    return res.status(400).json({ error: 'Invalid request. Selected User IDs are required.' });
  }

  try {
    const placeholders = selectedUserIds.map(() => '?').join(',');
    const sql = `DELETE FROM registered_student_placement WHERE Userid NOT IN (${placeholders})`;

    const [result] = await db.query(sql, selectedUserIds);
    res.json({
      message: 'Unselected students deleted successfully!',
      deletedCount: result.affectedRows,
    });
  } catch (err) {
    console.error('Error deleting unselected students:', err);
    return res.status(500).json({ error: 'Failed to delete unselected students.' });
  }
});

// Get Students
router.get('/students', async (req, res) => {
  const { startRegNo, endRegNo } = req.query;

  let query = 'SELECT sd.*, u.username, u.email FROM student_details sd JOIN users u ON sd.Userid = u.Userid';
  let values = [];

  if (startRegNo && endRegNo) {
    query += ' WHERE sd.regno BETWEEN ? AND ? ORDER BY sd.regno';
    values.push(startRegNo, endRegNo);
  } else {
    query += ' ORDER BY sd.regno';
  }

  try {
    const [results] = await db.query(query, values);
    res.json(results);
  } catch (err) {
    console.error('Error fetching student details:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Send Emails
router.post('/send-emails', async (req, res) => {
  const { students, round } = req.body;

  if (!students || students.length === 0) {
    return res.status(400).json({ error: 'No students selected' });
  }

  if (!round) {
    return res.status(400).json({ error: 'Round information is required' });
  }

  try {
    const emailPromises = students.map(async (student) => {
      const [userRows] = await db.query('SELECT u.email FROM users u JOIN student_details sd ON u.Userid = sd.Userid WHERE sd.regno = ? AND u.status = "active"', [student.regno]);
      if (userRows.length === 0) {
        throw new Error(`Invalid or inactive student: ${student.regno}`);
      }

      const mailOptions = {
        from: process.env.EMAIL_USER || 'placement@college.edu',
        to: userRows[0].email,
        subject: `Shortlisted for Next Round (${round})`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50;">Congratulations ${student.name}!</h2>
            <p>You have been shortlisted for the next round: <strong>${round}</strong></p>
            <p>Please check with your placement officer for further details and next steps.</p>
            <hr style="margin: 20px 0;">
            <p style="color: #7f8c8d;">Best Regards,<br>Placement Cell</p>
          </div>
        `,
      };

      return transporter.sendMail(mailOptions);
    });

    await Promise.all(emailPromises);

    res.json({
      message: 'Emails sent successfully!',
      sentCount: students.length,
    });
  } catch (error) {
    console.error('Error sending emails:', error);
    res.status(500).json({ error: 'Failed to send emails' });
  }
});

// Add Company Details
router.post('/company-details', async (req, res) => {
  const { company_name, description, ceo, location, objective, salary_package, created_by } = req.body;

  if (!company_name || !description || !created_by) {
    return res.status(400).json({ message: 'Company name, description, and created_by are required' });
  }

  try {
    const [userRows] = await db.query('SELECT Userid FROM users WHERE Userid = ? AND status = "active"', [created_by]);
    if (userRows.length === 0) {
      return res.status(400).json({ message: 'Invalid or inactive Created_by user' });
    }

    const [result] = await db.query(
      'INSERT INTO companydetails (company_name, description, ceo, location, salary_package, objective, Created_by, Updated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [company_name, description, ceo, location, salary_package, objective, created_by, created_by]
    );
    res.status(201).json({ message: 'Company details added successfully!' });
  } catch (err) {
    console.error('Error adding company details:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Company details already exist' });
    }
    return res.status(500).json({ message: 'Database error' });
  }
});

// Get Company Details
router.get('/company-details', async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM companydetails ORDER BY company_name');
    res.json(results);
  } catch (err) {
    console.error('Error fetching company details:', err);
    return res.status(500).json({ message: 'Database error' });
  }
});

// Update Company Details
router.put('/company-details/:id', async (req, res) => {
  const { id } = req.params;
  const { company_name, description, ceo, location, salary_package, objective, updated_by } = req.body;

  if (!company_name || !description || !updated_by) {
    return res.status(400).json({ message: 'Company name, description, and updated_by are required' });
  }

  try {
    const [userRows] = await db.query('SELECT Userid FROM users WHERE Userid = ? AND status = "active"', [updated_by]);
    if (userRows.length === 0) {
      return res.status(400).json({ message: 'Invalid or inactive Updated_by user' });
    }

    const query = `
      UPDATE companydetails
      SET company_name = ?, description = ?, ceo = ?, location = ?, salary_package = ?, objective = ?, Updated_by = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const values = [company_name, description, ceo, location, salary_package, objective, updated_by, id];

    const [result] = await db.query(query, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Company details not found' });
    }

    res.json({ message: 'Company details updated successfully' });
  } catch (err) {
    console.error('Error updating company details:', err);
    return res.status(500).json({ message: 'Database error' });
  }
});

// Delete Company Details
router.delete('/company-details/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.query('DELETE FROM companydetails WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Company details not found' });
    }

    res.json({ message: 'Company details deleted successfully' });
  } catch (err) {
    console.error('Error deleting company details:', err);
    return res.status(500).json({ message: 'Database error' });
  }
});

// Add Hackathon
router.post('/hackathons', async (req, res) => {
  const { content, link, created_by } = req.body;

  if (!content || content.trim() === '' || !created_by) {
    return res.status(400).json({ error: 'Hackathon content and created_by are required' });
  }

  try {
    const [userRows] = await db.query('SELECT Userid FROM users WHERE Userid = ? AND status = "active"', [created_by]);
    if (userRows.length === 0) {
      return res.status(400).json({ message: 'Invalid or inactive Created_by user' });
    }

    const [result] = await db.query(
      'INSERT INTO hackathons (content, link, Created_by, Updated_by) VALUES (?, ?, ?, ?)',
      [content.trim(), link || null, created_by, created_by]
    );
    res.status(201).json({
      message: 'Hackathon added successfully!',
      id: result.insertId,
    });
  } catch (err) {
    console.error('Error adding hackathon:', err);
    return res.status(500).json({ error: 'Failed to add hackathon' });
  }
});

// Get Hackathons
router.get('/hackathons', async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM hackathons ORDER BY created_at DESC');
    res.json(results);
  } catch (err) {
    console.error('Error fetching hackathons:', err);
    return res.status(500).json({ error: 'Failed to fetch hackathons' });
  }
});

// Delete Hackathon
router.delete('/hackathons/:id', async (req, res) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return res.status(400).json({ error: 'Valid hackathon ID is required' });
  }

  try {
    const [result] = await db.query('DELETE FROM hackathons WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Hackathon not found' });
    }

    res.json({ message: 'Hackathon deleted successfully!' });
  } catch (err) {
    console.error('Error deleting hackathon:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Add Placement Feedback
router.post('/feedback', feedbackUpload.array('questionFiles', 5), async (req, res) => {
  const {
    student_id, regno, student_name, course_branch, batch_year, company_name,
    industry_sector, job_role, work_location, ctc_fixed, ctc_variable, ctc_bonus,
    ctc_total, drive_mode, eligibility_criteria, total_rounds, overall_difficulty,
    online_test_platform, test_sections, test_questions_count, test_duration,
    memory_based_questions, coding_problems_links, technical_questions, hr_questions,
    tips_suggestions, company_expectations, final_outcome, process_difficulty_rating,
    company_communication_rating, overall_experience_rating, show_name_publicly, rounds
  } = req.body;

  if (!student_id || !regno || !course_branch || !batch_year) {
    return res.status(400).json({ message: 'Required fields are missing' });
  }

  try {
    const [studentRows] = await db.query(
      'SELECT Userid FROM student_details WHERE regno = ? AND Userid = ?', 
      [regno, student_id]
    );
    
    if (studentRows.length === 0) {
      return res.status(400).json({ message: 'Invalid student credentials' });
    }

    const questionFiles = req.files ? req.files.map(file => ({
      filename: file.filename,
      originalname: file.originalname,
      path: file.path
    })) : [];

    const feedbackQuery = `
      INSERT INTO placement_feedback (
        student_id, regno, student_name, course_branch, batch_year, company_name, 
        industry_sector, job_role, work_location, ctc_fixed, ctc_variable, 
        ctc_bonus, ctc_total, drive_mode, eligibility_criteria, total_rounds, 
        overall_difficulty, online_test_platform, test_sections, test_questions_count, 
        test_duration, memory_based_questions, coding_problems_links, technical_questions, 
        hr_questions, tips_suggestions, company_expectations, final_outcome, 
        process_difficulty_rating, company_communication_rating, overall_experience_rating, 
        show_name_publicly, question_files
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.query(feedbackQuery, [
      student_id, regno, show_name_publicly === 'true' ? student_name : null, 
      course_branch, batch_year, company_name, industry_sector, job_role, 
      work_location, ctc_fixed || null, ctc_variable || null, ctc_bonus || null, 
      ctc_total || null, drive_mode, eligibility_criteria, total_rounds || null, 
      overall_difficulty, online_test_platform, test_sections, test_questions_count || null, 
      test_duration, memory_based_questions, coding_problems_links, technical_questions, 
      hr_questions, tips_suggestions, company_expectations, final_outcome, 
      process_difficulty_rating || null, company_communication_rating || null, 
      overall_experience_rating || null, show_name_publicly === 'true', 
      JSON.stringify(questionFiles)
    ]);

    const feedbackId = result.insertId;

    if (rounds) {
      try {
        const roundsData = JSON.parse(rounds);
        if (Array.isArray(roundsData) && roundsData.length > 0) {
          const roundsQuery = `
            INSERT INTO feedback_rounds (feedback_id, round_number, round_type, round_description, difficulty_level) 
            VALUES (?, ?, ?, ?, ?)
          `;
          
          for (const round of roundsData) {
            await db.query(roundsQuery, [
              feedbackId, 
              round.round_number, 
              round.round_type, 
              round.round_description, 
              round.difficulty_level
            ]);
          }
        }
      } catch (parseError) {
        console.error('Error parsing rounds data:', parseError);
      }
    }

    res.status(201).json({ 
      message: 'Feedback submitted successfully!', 
      feedbackId: feedbackId 
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get All Placement Feedback
router.get('/feedback', async (req, res) => {
  const { company, course, batch, outcome, limit = 50, offset = 0 } = req.query;
  
  try {
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (company) {
      whereClause += ' AND company_name LIKE ?';
      params.push(`%${company}%`);
    }
    if (course) {
      whereClause += ' AND course_branch = ?';
      params.push(course);
    }
    if (batch) {
      whereClause += ' AND batch_year = ?';
      params.push(batch);
    }
    if (outcome) {
      whereClause += ' AND final_outcome = ?';
      params.push(outcome);
    }

    const query = `
      SELECT 
        pf.*,
        CASE 
          WHEN pf.show_name_publicly = true THEN pf.student_name 
          ELSE 'Anonymous' 
        END as display_name
      FROM placement_feedback pf 
      ${whereClause}
      ORDER BY pf.created_at DESC 
      LIMIT ? OFFSET ?
    `;

    params.push(parseInt(limit), parseInt(offset));
    const [results] = await db.query(query, params);

    for (let feedback of results) {
      const [rounds] = await db.query(
        'SELECT * FROM feedback_rounds WHERE feedback_id = ? ORDER BY round_number',
        [feedback.id]
      );
      feedback.rounds = rounds;
    }

    const countQuery = `SELECT COUNT(*) as total FROM placement_feedback pf ${whereClause}`;
    const [countResult] = await db.query(countQuery, params.slice(0, -2));
    
    res.json({
      feedback: results,
      total: countResult[0].total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get Feedback Statistics
router.get('/feedback/stats', async (req, res) => {
  try {
    const [companyStats] = await db.query(`
      SELECT 
        company_name, 
        COUNT(*) as feedback_count,
        AVG(overall_experience_rating) as avg_rating,
        AVG(ctc_total) as avg_package
      FROM placement_feedback 
      WHERE company_name IS NOT NULL 
      GROUP BY company_name 
      ORDER BY feedback_count DESC 
      LIMIT 10
    `);

    const [outcomeStats] = await db.query(`
      SELECT 
        final_outcome, 
        COUNT(*) as count 
      FROM placement_feedback 
      WHERE final_outcome IS NOT NULL 
      GROUP BY final_outcome
    `);

    const [courseStats] = await db.query(`
      SELECT 
        course_branch, 
        COUNT(*) as count,
        AVG(ctc_total) as avg_package
      FROM placement_feedback 
      GROUP BY course_branch 
      ORDER BY count DESC
    `);

    res.json({
      companyStats,
      outcomeStats,
      courseStats
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get Feedback by Company
router.get('/feedback/company/:companyName', async (req, res) => {
  const { companyName } = req.params;
  
  try {
    const [feedback] = await db.query(`
      SELECT 
        pf.*,
        CASE 
          WHEN pf.show_name_publicly = true THEN pf.student_name 
          ELSE 'Anonymous' 
        END as display_name
      FROM placement_feedback pf 
      WHERE company_name = ?
      ORDER BY created_at DESC
    `, [companyName]);

    const [rounds] = await db.query(`
      SELECT fr.* 
      FROM feedback_rounds fr
      JOIN placement_feedback pf ON fr.feedback_id = pf.id
      WHERE pf.company_name = ?
      ORDER BY fr.feedback_id, fr.round_number
    `, [companyName]);

    feedback.forEach(fb => {
      fb.rounds = rounds.filter(r => r.feedback_id === fb.id);
    });

    res.json(feedback);
  } catch (error) {
    console.error('Error fetching company feedback:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update Feedback
router.put('/feedback/:id', feedbackUpload.array('questionFiles', 5), async (req, res) => {
  const { id } = req.params;
  const { student_id } = req.body;

  try {
    const [existing] = await db.query(
      'SELECT * FROM placement_feedback WHERE id = ? AND student_id = ?', 
      [id, student_id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Feedback not found or unauthorized' });
    }

    const questionFiles = req.files ? req.files.map(file => ({
      filename: file.filename,
      originalname: file.originalname,
      path: file.path
    })) : JSON.parse(existing[0].question_files || '[]');

    const updateQuery = `
      UPDATE placement_feedback SET
        student_name = ?, course_branch = ?, batch_year = ?, company_name = ?,
        industry_sector = ?, job_role = ?, work_location = ?, ctc_fixed = ?,
        ctc_variable = ?, ctc_bonus = ?, ctc_total = ?, drive_mode = ?,
        eligibility_criteria = ?, total_rounds = ?, overall_difficulty = ?,
        online_test_platform = ?, test_sections = ?, test_questions_count = ?,
        test_duration = ?, memory_based_questions = ?, coding_problems_links = ?,
        technical_questions = ?, hr_questions = ?, tips_suggestions = ?,
        company_expectations = ?, final_outcome = ?, process_difficulty_rating = ?,
        company_communication_rating = ?, overall_experience_rating = ?,
        show_name_publicly = ?, question_files = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND student_id = ?
    `;

    await db.query(updateQuery, [
      req.body.show_name_publicly === 'true' ? req.body.student_name : null,
      req.body.course_branch, req.body.batch_year, req.body.company_name,
      req.body.industry_sector, req.body.job_role, req.body.work_location,
      req.body.ctc_fixed || null, req.body.ctc_variable || null,
      req.body.ctc_bonus || null, req.body.ctc_total || null,
      req.body.drive_mode, req.body.eligibility_criteria,
      req.body.total_rounds || null, req.body.overall_difficulty,
      req.body.online_test_platform, req.body.test_sections,
      req.body.test_questions_count || null, req.body.test_duration,
      req.body.memory_based_questions, req.body.coding_problems_links,
      req.body.technical_questions, req.body.hr_questions,
      req.body.tips_suggestions, req.body.company_expectations,
      req.body.final_outcome, req.body.process_difficulty_rating || null,
      req.body.company_communication_rating || null,
      req.body.overall_experience_rating || null,
      req.body.show_name_publicly === 'true',
      JSON.stringify(questionFiles), id, student_id
    ]);

    res.json({ message: 'Feedback updated successfully!' });
  } catch (error) {
    console.error('Error updating feedback:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete Feedback
router.delete('/feedback/:id', async (req, res) => {
  const { id } = req.params;
  const { student_id } = req.body;

  try {
    const [result] = await db.query(
      'DELETE FROM placement_feedback WHERE id = ? AND student_id = ?', 
      [id, student_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Feedback not found or unauthorized' });
    }

    res.json({ message: 'Feedback deleted successfully!' });
  } catch (error) {
    console.error('Error deleting feedback:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Generate PDF Report of Feedback
router.get('/feedback/pdf', async (req, res) => {
  const { company, course, batch, outcome } = req.query;
  
  try {
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (company) {
      whereClause += ' AND company_name LIKE ?';
      params.push(`%${company}%`);
    }
    if (course) {
      whereClause += ' AND course_branch = ?';
      params.push(course);
    }
    if (batch) {
      whereClause += ' AND batch_year = ?';
      params.push(batch);
    }
    if (outcome) {
      whereClause += ' AND final_outcome = ?';
      params.push(outcome);
    }

    const query = `
      SELECT 
        pf.*,
        CASE 
          WHEN pf.show_name_publicly = true THEN pf.student_name 
          ELSE 'Anonymous' 
        END as display_name
      FROM placement_feedback pf 
      ${whereClause}
      ORDER BY pf.created_at DESC
    `;

    const [results] = await db.query(query, params);

    for (let feedback of results) {
      const [rounds] = await db.query(
        'SELECT * FROM feedback_rounds WHERE feedback_id = ? ORDER BY round_number',
        [feedback.id]
      );
      feedback.rounds = rounds;
    }

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=placement-feedback.pdf');
    doc.pipe(res);

    doc.fontSize(20).font('Helvetica-Bold').text('Placement Feedback Report', { align: 'center' });
    doc.moveDown();
    
    doc.fontSize(12).font('Helvetica');
    if (company || course || batch || outcome) {
      doc.text('Applied Filters:', { continued: false });
      if (company) doc.text(`Company: ${company}`);
      if (course) doc.text(`Course: ${course}`);
      if (batch) doc.text(`Batch: ${batch}`);
      if (outcome) doc.text(`Outcome: ${outcome}`);
      doc.moveDown();
    }
    
    doc.text(`Total Feedback Count: ${results.length}`);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`);
    doc.moveDown(2);

    results.forEach((feedback, index) => {
      if (doc.y > 700) {
        doc.addPage();
      }

      doc.fontSize(14).font('Helvetica-Bold')
         .text(`${index + 1}. ${feedback.company_name || 'Company Not Specified'}`, { continued: false });
      
      doc.fontSize(10).font('Helvetica')
         .text(`Student: ${feedback.display_name} | Course: ${feedback.course_branch} | Batch: ${feedback.batch_year}`)
         .text(`Role: ${feedback.job_role || 'N/A'} | Outcome: ${feedback.final_outcome || 'N/A'}`);

      if (feedback.ctc_total) {
        doc.text(`Package: ₹${feedback.ctc_total} LPA`);
      }

      doc.moveDown(0.5);

      if (feedback.drive_mode || feedback.eligibility_criteria) {
        doc.font('Helvetica-Bold').text('Process Details:');
        doc.font('Helvetica');
        if (feedback.drive_mode) doc.text(`Drive Mode: ${feedback.drive_mode}`);
        if (feedback.eligibility_criteria) doc.text(`Eligibility: ${feedback.eligibility_criteria}`);
      }

      if (feedback.rounds && feedback.rounds.length > 0) {
        doc.moveDown(0.5);
        doc.font('Helvetica-Bold').text('Rounds:');
        feedback.rounds.forEach(round => {
          doc.font('Helvetica')
             .text(`Round ${round.round_number}: ${round.round_type}`)
             .text(`Description: ${round.round_description || 'N/A'}`)
             .text(`Difficulty: ${round.difficulty_level || 'N/A'}`);
          doc.moveDown(0.3);
        });
      }

      if (feedback.tips_suggestions) {
        doc.moveDown(0.5);
        doc.font('Helvetica-Bold').text('Tips & Suggestions:');
        doc.font('Helvetica').text(feedback.tips_suggestions);
      }

      doc.moveDown(1);
    });

    doc.end();
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;