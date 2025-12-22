import express from 'express';
import mysql from 'mysql2/promise';
import multer from 'multer';
import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

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

// Multer setup for file uploads
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

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Middleware to check if user is admin (SuperAdmin or PlacementAdmin)
const isPlacementAdmin = (req, res, next) => {
  if (req.user.role !== 'SuperAdmin' && req.user.role !== 'PlacementAdmin') {
    return res.status(403).json({ 
      message: 'Access denied. Only SuperAdmin and PlacementAdmin can access this resource.' 
    });
  }
  next();
};

// Token verification endpoint
router.get('/verify-token', verifyToken, (req, res) => {
  res.json({ 
    valid: true, 
    userId: req.user.userId,
    role: req.user.role 
  });
});

// Placement Login Route
router.post("/login", async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ message: "Identifier and password are required" });
  }

  try {
    let query;
    let params;
    let isStudent = false;

    // If identifier is digits only → student regno
    if (/^\d+$/.test(identifier)) {
      query = `
        SELECT u.*, sd.regno 
        FROM users u 
        JOIN student_details sd ON u.Userid = sd.Userid 
        WHERE sd.regno = ? AND u.status = 'active' AND u.role = 'Student'
      `;
      params = [identifier];
      isStudent = true;
    } else {
      // Admin/Staff login with username - ONLY SuperAdmin and PlacementAdmin for placement
      query = `
        SELECT * FROM users 
        WHERE username = ? AND status = "active" 
        AND (role = "SuperAdmin" OR role = "PlacementAdmin" OR role = "Staff")
      `;
      params = [identifier];
    }

    const [results] = await db.query(query, params);

    if (results.length === 0) {
      return res.status(401).json({ 
        message: isStudent 
          ? "Invalid registration number or account not authorized" 
          : "Invalid username or you don't have access to placement portal" 
      });
    }

    const user = results[0];

    // Compare hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.Userid,
        role: user.role,
        username: user.username,
      },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "24h" }
    );

    return res.json({
      message: "Login successful",
      token,
      role: user.role.toLowerCase(),
      userId: user.Userid,
      username: user.username,
      email: user.email,
      regno: user.regno || null,
    });
  } catch (err) {
    console.error("Placement login error:", err);
    return res.status(500).json({ message: "Database error" });
  }
});

// Protected routes - Apply verifyToken middleware to all routes below
router.use(verifyToken);

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

// Admin-only routes
// Add Upcoming Drive - Admin only
router.post('/upcoming-drives', isPlacementAdmin, upload.single('post'), async (req, res) => {
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

    await db.query(query, [postFilePath, company_name, eligibility, date, time, venue, rolesValue, salaryValue, created_by, created_by]);

    const notificationMsg = `📢 New Drive Alert! ${company_name} is hiring for ${rolesValue} on ${date} at ${time} in ${venue}. Package: ${salaryValue}`;
    const notifQuery = `INSERT INTO notifications (message, Created_by, Updated_by) VALUES (?, ?, ?)`;

    await db.query(notifQuery, [notificationMsg, created_by, created_by]);
    res.status(201).json({ message: 'Upcoming drive added successfully!' });
  } catch (err) {
    console.error('Database error:', err);
    return res.status(500).json({ message: 'Database error' });
  }
});

// Get Upcoming Drives - All authenticated users
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

// Delete Upcoming Drive - Admin only
router.delete('/upcoming-drives/:id', isPlacementAdmin, async (req, res) => {
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

// Get Companies - All authenticated users
router.get('/companies', async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM companies ORDER BY companyName');
    res.status(200).json({ companies: results });
  } catch (err) {
    console.error('Error fetching companies:', err);
    return res.status(500).json({ message: 'Error fetching companies.' });
  }
});

// Add Company - Admin only
router.post('/add-company', isPlacementAdmin, upload.single('logo'), async (req, res) => {
  // ... existing add-company logic ...
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
      companyName, description, ceo, location, salaryPackage, objective,
      JSON.stringify(skillSets), JSON.stringify(localBranches), JSON.stringify(roles),
      logo, created_by, created_by,
    ]);

    res.status(201).json({ message: 'Company added successfully', company: { companyName, logo } });
  } catch (error) {
    console.error('Server Error:', error);
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

// Get Placed Students by Company
// Corrected Get Placed Students query - uses u.username instead of sd.name
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
    console.log('Executing query:', sql, 'with params:', params);
    const [results] = await db.query(sql, params);
    console.log('Query results count:', results.length);
    res.json(results);
  } catch (err) {
    console.error('Database error in placed-students:', err);
    res.status(500).json({
      error: 'Failed to fetch placed students',
      details: process.env.NODE_ENV === 'development' ? err.message : 'Database error',
      sqlMessage: process.env.NODE_ENV === 'development' ? err.sqlMessage : undefined
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
      regno,
      name,
      batch,
      hsc_percentage,
      sslc_percentage,
      sem1_cgpa,
      sem2_cgpa,
      sem3_cgpa,
      sem4_cgpa,
      sem5_cgpa,
      sem6_cgpa,
      sem7_cgpa,
      sem8_cgpa,
      history_of_arrear,
      standing_arrear,
      address,
      student_mobile,
      secondary_mobile,
      college_email,
      personal_email,
      aadhar_number,
      pancard_number,
      passport,
      created_by,
      Deptid,
      Semester,
      date_of_joining,
      date_of_birth,
      blood_group,
      tutorEmail,
      first_graduate,
      student_type,
      mother_tongue,
      identification_mark,
      extracurricularID,
      religion,
      caste,
      community,
      gender,
      seat_type,
      section,
      door_no,
      street,
      cityID,
      districtID,
      stateID,
      countryID,
      pincode,
      personal_phone,
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
      Userid,
      regno,
      name,
      Deptid,
      batch,
      Semester,
      date_of_joining,
      date_of_birth,
      blood_group,
      tutorEmail,
      personal_email,
      first_graduate,
      aadhar_number,
      student_type,
      mother_tongue,
      identification_mark,
      extracurricularID,
      religion,
      caste,
      community,
      gender,
      seat_type,
      section,
      door_no,
      street,
      cityID,
      districtID,
      stateID,
      countryID,
      pincode,
      personal_phone,
      new Date(),
      new Date(),
      hsc_percentage,
      sslc_percentage,
      sem1_cgpa,
      sem2_cgpa,
      sem3_cgpa,
      sem4_cgpa,
      sem5_cgpa,
      sem6_cgpa,
      sem7_cgpa,
      sem8_cgpa,
      history_of_arrear,
      standing_arrear,
      address,
      student_mobile,
      secondary_mobile,
      college_email,
      pancard_number,
      passport,
      created_by,
      created_by,
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
    name,
    batch,
    hsc_percentage,
    sslc_percentage,
    sem1_cgpa,
    sem2_cgpa,
    sem3_cgpa,
    sem4_cgpa,
    sem5_cgpa,
    sem6_cgpa,
    sem7_cgpa,
    sem8_cgpa,
    history_of_arrear,
    standing_arrear,
    address,
    student_mobile,
    secondary_mobile,
    college_email,
    personal_email,
    aadhar_number,
    pancard_number,
    passport,
    updated_by,
    Deptid,
    Semester,
    date_of_joining,
    date_of_birth,
    blood_group,
    tutorEmail,
    first_graduate,
    student_type,
    mother_tongue,
    identification_mark,
    extracurricularID,
    religion,
    caste,
    community,
    gender,
    seat_type,
    section,
    door_no,
    street,
    cityID,
    districtID,
    stateID,
    countryID,
    pincode,
    personal_phone,
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
      name,
      Deptid,
      batch,
      Semester,
      date_of_joining,
      date_of_birth,
      blood_group,
      tutorEmail,
      personal_email,
      first_graduate,
      aadhar_number,
      student_type,
      mother_tongue,
      identification_mark,
      extracurricularID,
      religion,
      caste,
      community,
      gender,
      seat_type,
      section,
      door_no,
      street,
      cityID,
      districtID,
      stateID,
      countryID,
      pincode,
      personal_phone,
      new Date(),
      hsc_percentage,
      sslc_percentage,
      sem1_cgpa,
      sem2_cgpa,
      sem3_cgpa,
      sem4_cgpa,
      sem5_cgpa,
      sem6_cgpa,
      sem7_cgpa,
      sem8_cgpa,
      history_of_arrear,
      standing_arrear,
      address,
      student_mobile,
      secondary_mobile,
      college_email,
      pancard_number,
      passport,
      updated_by,
      Userid,
      regno,
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
// Get Admin Registered Students - FIXED VERSION
router.get('/admin-registered-students', async (req, res) => {
  try {
    console.log('Executing query for admin-registered-students');
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
    console.log('Query results:', results);
    res.json(results);
  } catch (err) {
    console.error('Error fetching registered students:', {
      message: err.message,
      sqlMessage: err.sqlMessage,
      sqlState: err.sqlState,
      code: err.code,
      stack: err.stack,
    });
    res.status(500).json({
      error: 'Failed to fetch registered students',
      details: err.message,
      sqlMessage: err.sqlMessage || 'No SQL message provided',
      sqlState: err.sqlState || 'No SQL state provided',
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



export default router;