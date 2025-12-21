import express from 'express';
import { connectDB, sequelize } from './config/mysql.js';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import multer from 'multer';
import nodemailer from 'nodemailer';
import bodyParser from 'body-parser';
import bcrypt from 'bcrypt';
import { applyAssociations } from './models/index.js'; // Fixed: Removed duplicate import
import PDFDocument from 'pdfkit';

// Import Routes
import leaveRoutes from './routes/student/leaveRoutes.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/admin/adminRoutes.js';
import tableRoutes from './routes/admin/tableRoutes.js';
import internRoutes from './routes/student/internshipRoutes.js';
import dashboardRoutes from './routes/student/DashboardRoutes.js';
import bulkRoutes from "./routes/admin/bulkRoutes.js";
import studentRoutes from "./routes/student/studentRoutes.js"
import staffRoutes from "./routes/staffRoutes.js";
import locationRoutes from './routes/student/locationRoutes.js';
import activityRoutes from "./routes/admin/activityRoutes.js";
import ScholarshipRoutes from './routes/student/ScholarshipRoutes.js';
import eventRoutes from './routes/student/eventRoutes.js'
import eventAttendedRoutes from './routes/student/eventAttendedRoutes.js';
import OnlineCoursesRoutes from './routes/student/onlinecourseRoute.js'
import achievementRoutes from './routes/student/achievementRoutes.js'
import courseRoutes from './routes/student/CourseRoutes.js';
import biodataRoutes from './routes/student/bioDataRoutes.js';
//import hackathonRoutes from "./routes/student/hackathonRouts.js";
import hackathonRoutes from './routes/student/hackathonRouts.js';
import extracurricularRoutes from "./routes/student/extracurricularRoutes.js";
import projectRoutes from "./routes/student/projectRoutes.js";
//import StudentEducationRoutes from "./routes/student/educationRoutes.js";
import publicationRoutes from "./routes/student/studentPublicationRoutes.js";
import nonCGPACategoryRoutes from "./routes/admin/nonCGPACategoryRoutes.js";
import CompetencyCoding  from "./routes/student/competencyCodingRoutes.js";
import Noncgpa  from "./routes/student/studentNonCGPARoutes.js";
import studentFilterRoutes from './routes/studentFilterRoutes.js';

import studentPdfRoutes from './routes/student/studentPdfRoutes.js';
import nptelRoutes from "./routes/nptelRoutes.js";

import prosubmittedRoutes from './routes/prosubmitted.js';
import eventsRoutes from './routes/events.js';
import industryRoutes from './routes/industry.js';
import certificationRoutes from './routes/certifications.js';
import bookChapterRoutes from './routes/bookChapters.js';
import otherRoutes from './routes/other.js';
import hIndexRoutes from './routes/hindex.js';
import proposalsRoutes from './routes/proposals.js';
import resourcePersonRoutes from './routes/resourcePerson.js';
import seedMoneyRoutes from './routes/seedMoney.js';
import recognitionRoutes from './routes/recognition.js';
import patentProductRoutes from './routes/patentProduct.js';
import sponsoredResearchRoutes from './routes/researchProject.js';
import projectMentorRoutes from './routes/projectMentor.js';
import eventsOrganizedRoutes from './routes/eventsOrganized.js';
import ScholarRoutes from './routes/scholarManagement.js';
import educationRoutes from './routes/education.js';
import paymentDetailsRoutes from './routes/paymentDetails.js';
import projectProposalRoutes from './routes/projectProposal.js';
import projectPaymentDetailsRoutes from './routes/projectPaymentDetails.js';
import personalRoutes from './routes/personal.js';
import facultyPDFRoutes from './routes/facultyPDFRoutes.js';
import mouRoutes from './routes/mou.js';
import StudentEducationRoutes from "./routes/student/educationRoutes.js";
import registrationRoutes from './routes/placement/registrationRoutes.js';
import profileRoutes from './routes/placement/profile.js';

// Admin panel routes
import adminPanelRoutes from './routes/adminPanelRoutes.js';
import studentPanelRoutes from './routes/studentPanelRoutes.js';
import certificateRoutes from "./routes/student/certificateRoutes.js";

// Fixed import path
import PersonalInfo from './routes/staff/personalRoutes.js';
import placementRoutes from './routes/placementRoutes.js';
import placementDrivesRoutes from './routes/placement/placementDrives.js';
import placementhackathonRoutes from './routes/placement/hackathon.js';
import studentHackathonRoutes from './routes/placement/studentHackathon.js';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
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

// Base multer setup for general file uploads
const baseStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'Uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}${path.extname(file.originalname)}`),
});

const baseFileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error('Only JPEG, PNG, and PDF files are allowed.'), false);
  }
  cb(null, true);
};

const baseUpload = multer({ storage: baseStorage, fileFilter: baseFileFilter });

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

// Middleware
app.use(cors());

// Register routes that need multipart/form-data before body parsers
app.use("/api/hackathon", hackathonRoutes);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/Uploads', express.static(path.join(__dirname, 'Uploads')));

// Test Route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Test database connection
async function testConnection() {
  try {
    const connection = await db.getConnection();
    console.log('✅ MySQL database connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ MySQL database connection failed:', error.message);
    return false;
  }
}

// Initialize MySQL database tables
async function initializeDatabase() {
  try {
    const connection = await db.getConnection();
    console.log('Initializing MySQL database tables...');

    // Create department table
    

    
    

    await connection.query(`
      CREATE TABLE IF NOT EXISTS placement_feedback (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        regno VARCHAR(50) NOT NULL,
        student_name VARCHAR(255),
        course_branch ENUM('CSE','IT','AIDS','EEE','ECE','CIVIL','MECH') NOT NULL,
        batch_year VARCHAR(10) NOT NULL,
        company_name VARCHAR(255),
        industry_sector VARCHAR(100),
        job_role VARCHAR(255),
        work_location VARCHAR(255),
        ctc_fixed DECIMAL(10,2),
        ctc_variable DECIMAL(10,2),
        ctc_bonus DECIMAL(10,2),
        ctc_total DECIMAL(10,2),
        drive_mode ENUM('On-Campus', 'Off-Campus', 'Pooled'),
        eligibility_criteria TEXT,
        total_rounds INT,
        overall_difficulty ENUM('Easy', 'Medium', 'Hard'),
        online_test_platform VARCHAR(100),
        test_sections TEXT,
        test_questions_count INT,
        test_duration VARCHAR(50),
        memory_based_questions TEXT,
        coding_problems_links TEXT,
        technical_questions TEXT,
        hr_questions TEXT,
        tips_suggestions TEXT,
        company_expectations TEXT,
        final_outcome ENUM('Selected', 'Rejected', 'Waitlisted'),
        process_difficulty_rating INT CHECK(process_difficulty_rating BETWEEN 1 AND 5),
        company_communication_rating INT CHECK(company_communication_rating BETWEEN 1 AND 5),
        overall_experience_rating INT CHECK(overall_experience_rating BETWEEN 1 AND 5),
        show_name_publicly BOOLEAN DEFAULT TRUE,
        question_files JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES users(Userid) ON DELETE CASCADE
      )
    `);

    // Create feedback_rounds table for detailed round information
    await connection.query(`
      CREATE TABLE IF NOT EXISTS feedback_rounds (
        id INT AUTO_INCREMENT PRIMARY KEY,
        feedback_id INT NOT NULL,
        round_number INT NOT NULL,
        round_type ENUM('Online Test', 'Group Discussion', 'Case Study', 'Technical Interview', 'HR Interview', 'Other'),
        round_description TEXT,
        difficulty_level ENUM('Easy', 'Medium', 'Hard'),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (feedback_id) REFERENCES placement_feedback(id) ON DELETE CASCADE
      )
    `);

    // Create companies table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS companies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        companyName VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        ceo VARCHAR(255),
        location VARCHAR(255),
        package DECIMAL(10,2),
        objective TEXT,
        skillSets JSON,
        localBranches JSON,
        roles JSON,
        logo VARCHAR(255),
        Created_by INT,
        Updated_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_companies_createdby FOREIGN KEY (Created_by) REFERENCES users(Userid) ON DELETE SET NULL,
        CONSTRAINT fk_companies_updatedby FOREIGN KEY (Updated_by) REFERENCES users(Userid) ON DELETE SET NULL
      )
    `);

    // Create upcomingdrives_placement table
    

    // Create companydetails table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS companydetails (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_name VARCHAR(255) NOT NULL,
        description TEXT,
        ceo VARCHAR(255),
        location VARCHAR(255),
        salary_package DECIMAL(10,2),
        objective TEXT,
        Created_by INT,
        Updated_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_companydetails_createdby FOREIGN KEY (Created_by) REFERENCES users(Userid) ON DELETE SET NULL,
        CONSTRAINT fk_companydetails_updatedby FOREIGN KEY (Updated_by) REFERENCES users(Userid) ON DELETE SET NULL
      )
    `);

    // Create placed_student table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS placed_student (
        id INT AUTO_INCREMENT PRIMARY KEY,
        Userid INT NOT NULL,
        regno VARCHAR(50) NOT NULL,
        company_name VARCHAR(255) NOT NULL,
        role VARCHAR(255) NOT NULL,
        package DECIMAL(10,2) NOT NULL,
        year INT NOT NULL,
        Created_by INT,
        Updated_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_placed_user FOREIGN KEY (Userid) REFERENCES users(Userid) ON DELETE CASCADE,
        CONSTRAINT fk_placed_regno FOREIGN KEY (regno) REFERENCES student_details(regno) ON DELETE CASCADE,
        CONSTRAINT fk_placed_createdby FOREIGN KEY (Created_by) REFERENCES users(Userid) ON DELETE SET NULL,
        CONSTRAINT fk_placed_updatedby FOREIGN KEY (Updated_by) REFERENCES users(Userid) ON DELETE SET NULL,
        INDEX idx_year (year),
        INDEX idx_company_name (company_name)
      )
    `);

    // Create registered_student_placement table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS registered_student_placement (
        id INT AUTO_INCREMENT,
        Userid INT NOT NULL,
        regno VARCHAR(50) NOT NULL,
        company_name VARCHAR(255) NOT NULL,
        register BOOLEAN DEFAULT TRUE,
        Created_by INT,
        Updated_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id, Userid),
        CONSTRAINT fk_registered_user FOREIGN KEY (Userid) REFERENCES users(Userid) ON DELETE CASCADE,
        CONSTRAINT fk_registered_regno FOREIGN KEY (regno) REFERENCES student_details(regno) ON DELETE CASCADE,
        CONSTRAINT fk_registered_createdby FOREIGN KEY (Created_by) REFERENCES users(Userid) ON DELETE SET NULL,
        CONSTRAINT fk_registered_updatedby FOREIGN KEY (Updated_by) REFERENCES users(Userid) ON DELETE SET NULL,
        INDEX idx_company_name (company_name)
      )
    `);

    // Create hackathons table
    
    // Create notifications table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        message TEXT NOT NULL,
        Created_by INT,
        Updated_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_notifications_createdby FOREIGN KEY (Created_by) REFERENCES users(Userid) ON DELETE SET NULL,
        CONSTRAINT fk_notifications_updatedby FOREIGN KEY (Updated_by) REFERENCES users(Userid) ON DELETE SET NULL
      )
    `);

   
    // Insert default users with hashed passwords if not exists
    const [userRows] = await connection.query('SELECT * FROM users WHERE username = ?', ['Admin']);
    if (userRows.length === 0) {
      const hashedAdminPassword = await bcrypt.hash('admin123', 10);
      const hashedStudentPassword = await bcrypt.hash('student123', 10);
      const hashedStaffPassword = await bcrypt.hash('staff123', 10);


      // Insert corresponding student_details for student1
      await connection.query(`
        INSERT INTO student_details (Userid, regno, name, Deptid, college_email, createdAt, updatedAt, Created_by, Updated_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [2, '2312001', 'Student One', 1, '2312001@nec.edu.in', new Date(), new Date(), 1, 1]);
      console.log('Default student details created');
    }

    connection.release();
    console.log('✅ MySQL database initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ MySQL database initialization failed:', error.message);
    return false;
  }
}

// Initialize both databases
async function initializeDatabases() {
  try {
    await connectDB();
    applyAssociations();
    await sequelize.sync()
      .then(() => console.log('✅ Sequelize database synced successfully'))
      .catch((err) => console.error('❌ Error syncing Sequelize database:', err));

    const connected = await testConnection();
    if (connected) {
      await initializeDatabase();
    } else {
      console.error('❌ Failed to connect to MySQL database. Exiting...');
      process.exit(1);
    }
  } catch (error) {
    console.error('Database initialization error:', error);
    process.exit(1);
  }
}

initializeDatabases();

// Fixed: Use proper route registration order and placement login route
app.use('/api/placement', placementRoutes);
app.use('/api', authRoutes); 
app.use('/api', adminRoutes);
app.use('/api', tableRoutes);
app.use('/api', internRoutes);
app.use('/api', dashboardRoutes);
app.use("/api/bulk", bulkRoutes);
app.use('/api/student', studentPdfRoutes);

app.use("/api", studentRoutes);
app.use("/api/staff", PersonalInfo);
app.use('/api', staffRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/proposals-submitted', prosubmittedRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/industry', industryRoutes);
app.use('/api/certifications', certificationRoutes);
app.use('/api/book-chapters', bookChapterRoutes);
app.use('/api/other', otherRoutes);
app.use('/api/h-index', hIndexRoutes);
app.use('/api/proposals', proposalsRoutes);
app.use('/api/resource-person', resourcePersonRoutes);
app.use('/api/seed-money', seedMoneyRoutes);
app.use('/api/recognition', recognitionRoutes);
app.use('/api/patent-product', patentProductRoutes);
app.use('/api/sponsored-research', sponsoredResearchRoutes);
app.use('/api/project-mentors', projectMentorRoutes);
app.use('/api/events-organized', eventsOrganizedRoutes);
app.use('/api/scholars', ScholarRoutes);
app.use('/api/payment-details', paymentDetailsRoutes);
app.use('/api/project-proposal',projectProposalRoutes);
app.use('/api/project-payment-details', projectPaymentDetailsRoutes);
app.use('/api/personal', personalRoutes);
app.use("/api/student-education", StudentEducationRoutes);
app.use("/api/education", educationRoutes);
app.use("/api/extracurricular", extracurricularRoutes);
app.use("/api/publications", publicationRoutes);
app.use("/api/noncgpa-category", nonCGPACategoryRoutes);
app.use("/api/competency-coding", CompetencyCoding);
app.use("/api/noncgpa",Noncgpa);
// Admin Panel Routes
app.use('/api', adminPanelRoutes);
app.use('/api', studentPanelRoutes);
app.use("/api/projects", projectRoutes);
app.use('/api', locationRoutes);
app.use('/api', activityRoutes);
app.use('/api', ScholarshipRoutes);
app.use('/api', eventRoutes);
app.use('/api', eventAttendedRoutes);
app.use('/api', leaveRoutes);
app.use('/api/online-courses', OnlineCoursesRoutes);
app.use('/api', achievementRoutes);
app.use('/api', courseRoutes);
app.use("/api", biodataRoutes);
app.use('/api/mou', mouRoutes);
app.use('/api', facultyPDFRoutes);
app.use('/Uploads', express.static(path.join(__dirname, 'Uploads')));
app.use('/uploads', express.static(path.join(__dirname, 'Uploads')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.use('/api/placement-drives', placementDrivesRoutes);
app.use('/api/placement-hackathons', placementhackathonRoutes);
app.use('/api/student/hackathons',hackathonRoutes);
//import hackathonRoutes from './routes/student/hackathonRoutes.js';
app.use('/api/registration',registrationRoutes);
app.use('/api/students', studentFilterRoutes);
app.use('/api/profile', profileRoutes);

app.use("/api", certificateRoutes);
app.use("/api/nptel", nptelRoutes);





// Hackathons routes
app.post('/api/placement/hackathons', async (req, res) => {
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

app.get('/api/placement/hackathons', async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM hackathons ORDER BY created_at DESC');
    res.json(results);
  } catch (err) {
    console.error('Error fetching hackathons:', err);
    return res.status(500).json({ error: 'Failed to fetch hackathons' });
  }
});

app.delete('/api/placement/hackathons/:id', async (req, res) => {
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

// Notifications routes
app.get('/api/notifications', async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 5');
    res.json(results);
  } catch (err) {
    console.error('Notification fetch error:', err);
    return res.status(500).json({ message: 'Error fetching notifications' });
  }
});

app.post('/api/notifications', async (req, res) => {
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

// Placement feedback routes
app.post('/api/placement/feedback', feedbackUpload.array('questionFiles', 5), async (req, res) => {
  const {
    student_id,
    regno,
    student_name,
    course_branch,
    batch_year,
    company_name,
    industry_sector,
    job_role,
    work_location,
    ctc_fixed,
    ctc_variable,
    ctc_bonus,
    ctc_total,
    drive_mode,
    eligibility_criteria,
    total_rounds,
    overall_difficulty,
    online_test_platform,
    test_sections,
    test_questions_count,
    test_duration,
    memory_based_questions,
    coding_problems_links,
    technical_questions,
    hr_questions,
    tips_suggestions,
    company_expectations,
    final_outcome,
    process_difficulty_rating,
    company_communication_rating,
    overall_experience_rating,
    show_name_publicly,
    rounds // JSON string of rounds data
  } = req.body;

  if (!student_id || !regno || !course_branch || !batch_year) {
    return res.status(400).json({ message: 'Required fields are missing' });
  }

  try {
    // Verify student exists
    const [studentRows] = await db.query(
      'SELECT Userid FROM student_details WHERE regno = ? AND Userid = ?', 
      [regno, student_id]
    );
    
    if (studentRows.length === 0) {
      return res.status(400).json({ message: 'Invalid student credentials' });
    }

    // Process uploaded files
    const questionFiles = req.files ? req.files.map(file => ({
      filename: file.filename,
      originalname: file.originalname,
      path: file.path
    })) : [];

    // Insert feedback
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

    // Insert rounds data if provided
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

// Get all placement feedback
app.get('/api/placement/feedback', async (req, res) => {
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

    // Get rounds for each feedback
    for (let feedback of results) {
      const [rounds] = await db.query(
        'SELECT * FROM feedback_rounds WHERE feedback_id = ? ORDER BY round_number',
        [feedback.id]
      );
      feedback.rounds = rounds;
    }

    // Get total count
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

// Get feedback statistics
app.get('/api/placement/feedback/stats', async (req, res) => {
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

// Get feedback by company (aggregated view)
app.get('/api/placement/feedback/company/:companyName', async (req, res) => {
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

    // Get all rounds for this company
    const [rounds] = await db.query(`
      SELECT fr.* 
      FROM feedback_rounds fr
      JOIN placement_feedback pf ON fr.feedback_id = pf.id
      WHERE pf.company_name = ?
      ORDER BY fr.feedback_id, fr.round_number
    `, [companyName]);

    // Group rounds by feedback
    feedback.forEach(fb => {
      fb.rounds = rounds.filter(r => r.feedback_id === fb.id);
    });

    res.json(feedback);
    
  } catch (error) {
    console.error('Error fetching company feedback:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update feedback
app.put('/api/placement/feedback/:id', feedbackUpload.array('questionFiles', 5), async (req, res) => {
  const { id } = req.params;
  const { student_id } = req.body;

  try {
    // Verify ownership
    const [existing] = await db.query(
      'SELECT * FROM placement_feedback WHERE id = ? AND student_id = ?', 
      [id, student_id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Feedback not found or unauthorized' });
    }

    // Process uploaded files
    const questionFiles = req.files ? req.files.map(file => ({
      filename: file.filename,
      originalname: file.originalname,
      path: file.path
    })) : JSON.parse(existing[0].question_files || '[]');

    // Update feedback
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

// Delete feedback
app.delete('/api/placement/feedback/:id', async (req, res) => {
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

// Generate PDF report of feedback
app.get('/api/placement/feedback/pdf', async (req, res) => {
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

    // Get rounds for each feedback
    for (let feedback of results) {
      const [rounds] = await db.query(
        'SELECT * FROM feedback_rounds WHERE feedback_id = ? ORDER BY round_number',
        [feedback.id]
      );
      feedback.rounds = rounds;
    }

    // Create PDF
    const doc = new PDFDocument({ margin: 50 });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=placement-feedback.pdf');
    
    // Pipe the PDF to the response
    doc.pipe(res);

    // Add header
    doc.fontSize(20).font('Helvetica-Bold').text('Placement Feedback Report', { align: 'center' });
    doc.moveDown();
    
    // Add filters info
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

    // Add feedback data
    results.forEach((feedback, index) => {
      // Check if we need a new page
      if (doc.y > 700) {
        doc.addPage();
      }

      // Feedback header
      doc.fontSize(14).font('Helvetica-Bold')
         .text(`${index + 1}. ${feedback.company_name || 'Company Not Specified'}`, { continued: false });
      
      doc.fontSize(10).font('Helvetica')
         .text(`Student: ${feedback.display_name} | Course: ${feedback.course_branch} | Batch: ${feedback.batch_year}`)
         .text(`Role: ${feedback.job_role || 'N/A'} | Outcome: ${feedback.final_outcome || 'N/A'}`);

      if (feedback.ctc_total) {
        doc.text(`Package: ₹${feedback.ctc_total} LPA`);
      }

      doc.moveDown(0.5);

      // Process details
      if (feedback.drive_mode || feedback.eligibility_criteria) {
        doc.font('Helvetica-Bold').text('Process Details:');
        doc.font('Helvetica');
        if (feedback.drive_mode) doc.text(`Drive Mode: ${feedback.drive_mode}`);
        if (feedback.eligibility_criteria) doc.text(`Eligibility: ${feedback.eligibility_criteria}`);
        doc.moveDown(0.3);
      }

      // Rounds information
      if (feedback.rounds && feedback.rounds.length > 0) {
        doc.font('Helvetica-Bold').text('Interview Rounds:');
        doc.font('Helvetica');
        feedback.rounds.forEach(round => {
          doc.text(`• Round ${round.round_number}: ${round.round_type} (${round.difficulty_level || 'N/A'})`);
          if (round.round_description) {
            doc.text(`  Description: ${round.round_description}`);
          }
        });
        doc.moveDown(0.3);
      }

      // Assessment details
      if (feedback.online_test_platform || feedback.test_sections || feedback.memory_based_questions) {
        doc.font('Helvetica-Bold').text('Assessment Details:');
        doc.font('Helvetica');
        if (feedback.online_test_platform) doc.text(`Platform: ${feedback.online_test_platform}`);
        if (feedback.test_sections) doc.text(`Sections: ${feedback.test_sections}`);
        if (feedback.test_questions_count && feedback.test_duration) {
          doc.text(`Questions: ${feedback.test_questions_count} | Duration: ${feedback.test_duration}`);
        }
        if (feedback.memory_based_questions) {
          doc.text('Topics/Questions:', { continued: false });
          doc.text(feedback.memory_based_questions, { indent: 20 });
        }
        doc.moveDown(0.3);
      }

      // Interview experience
      if (feedback.technical_questions || feedback.hr_questions) {
        doc.font('Helvetica-Bold').text('Interview Experience:');
        doc.font('Helvetica');
        if (feedback.technical_questions) {
          doc.text('Technical Questions:', { continued: false });
          doc.text(feedback.technical_questions, { indent: 20 });
        }
        if (feedback.hr_questions) {
          doc.text('HR Questions:', { continued: false });
          doc.text(feedback.hr_questions, { indent: 20 });
        }
        doc.moveDown(0.3);
      }

      // Tips and suggestions
      if (feedback.tips_suggestions) {
        doc.font('Helvetica-Bold').text('Tips for Future Students:');
        doc.font('Helvetica').text(feedback.tips_suggestions, { indent: 20 });
        doc.moveDown(0.3);
      }

      // Company expectations
      if (feedback.company_expectations) {
        doc.font('Helvetica-Bold').text('Company Expectations:');
        doc.font('Helvetica').text(feedback.company_expectations, { indent: 20 });
        doc.moveDown(0.3);
      }

      // Ratings
      if (feedback.process_difficulty_rating || feedback.company_communication_rating || feedback.overall_experience_rating) {
        doc.font('Helvetica-Bold').text('Ratings:');
        doc.font('Helvetica');
        if (feedback.process_difficulty_rating) {
          doc.text(`Process Difficulty: ${'★'.repeat(feedback.process_difficulty_rating)}${'☆'.repeat(5 - feedback.process_difficulty_rating)} (${feedback.process_difficulty_rating}/5)`);
        }
        if (feedback.company_communication_rating) {
          doc.text(`Company Communication: ${'★'.repeat(feedback.company_communication_rating)}${'☆'.repeat(5 - feedback.company_communication_rating)} (${feedback.company_communication_rating}/5)`);
        }
        if (feedback.overall_experience_rating) {
          doc.text(`Overall Experience: ${'★'.repeat(feedback.overall_experience_rating)}${'☆'.repeat(5 - feedback.overall_experience_rating)} (${feedback.overall_experience_rating}/5)`);
        }
        doc.moveDown(0.3);
      }

      // Coding problems links
      if (feedback.coding_problems_links) {
        doc.font('Helvetica-Bold').text('Practice Links:');
        doc.font('Helvetica').text(feedback.coding_problems_links, { link: feedback.coding_problems_links });
        doc.moveDown(0.3);
      }

      doc.moveDown(1);
      
      // Add separator line
      if (index < results.length - 1) {
        doc.strokeColor('#cccccc')
           .lineWidth(1)
           .moveTo(50, doc.y)
           .lineTo(550, doc.y)
           .stroke();
        doc.moveDown(1);
      }
    });

    // Finalize the PDF
    doc.end();
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ message: 'Error generating PDF' });
  }
});



// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Error Handling Middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large' });
    }
    return res.status(400).json({ message: error.message });
  }

  console.error('Unhandled error:', error);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️  Database: ${process.env.DB_NAME || 'record'}`);
});

export default app;