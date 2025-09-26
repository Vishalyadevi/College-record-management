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
import jwt from 'jsonwebtoken'; // Added for JWT support
import { applyAssociations } from './models/index.js';
import PDFDocument from 'pdfkit';

// Import Routes
import leaveRoutes from './routes/student/leaveRoutes.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/admin/adminRoutes.js';
import tableRoutes from './routes/admin/tableRoutes.js';
import internRoutes from './routes/student/internshipRoutes.js';
import dashboardRoutes from './routes/student/DashboardRoutes.js';
import bulkRoutes from './routes/admin/bulkRoutes.js';
import studentRoutes from './routes/student/studentRoutes.js';
import staffRoutes from './routes/staffRoutes.js';
import locationRoutes from './routes/student/locationRoutes.js';
import activityRoutes from './routes/admin/activityRoutes.js';
import ScholarshipRoutes from './routes/student/ScholarshipRoutes.js';
import eventRoutes from './routes/student/eventRoutes.js';
import eventAttendedRoutes from './routes/student/eventAttendedRoutes.js';
import OnlineCoursesRoutes from './routes/student/onlinecourseRoute.js';
import achievementRoutes from './routes/student/achievementRoutes.js';
import courseRoutes from './routes/student/CourseRoutes.js';
import biodataRoutes from './routes/student/bioDataRoutes.js';
import studentEducationRoutes from './routes/studentEducation.js';
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
import adminPanelRoutes from './routes/adminPanelRoutes.js';
import studentPanelRoutes from './routes/studentPanelRoutes.js';
import PersonalInfo from './routes/staff/personalRoutes.js';
import placementRoutes from './routes/placementRoutes.js';

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

// Initialize database and associations
async function initializeDatabase() {
  await testConnection();
  await connectDB(); // Assuming connectDB handles Sequelize sync or initialization
  applyAssociations(sequelize);
}

initializeDatabase().catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/internships', internRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/bulk', bulkRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/staff/personal', PersonalInfo);
app.use('/api/locations', locationRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/scholarships', ScholarshipRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/event-attended', eventAttendedRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/online-courses', OnlineCoursesRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/biodata', biodataRoutes);
app.use('/api/student-education', studentEducationRoutes);
app.use('/api/proposals-submitted', prosubmittedRoutes);
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
app.use('/api/education', educationRoutes);
app.use('/api/payment-details', paymentDetailsRoutes);
app.use('/api/project-proposal', projectProposalRoutes);
app.use('/api/project-payment-details', projectPaymentDetailsRoutes);
app.use('/api/personal', personalRoutes);
app.use('/api/faculty-pdf', facultyPDFRoutes);
app.use('/api/admin-panel', adminPanelRoutes);
app.use('/api/student-panel', studentPanelRoutes);
app.use('/api/placement', placementRoutes);

// General Login Route
app.post('/api/login', async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ message: 'Identifier and password are required' });
  }

  try {
    let query;
    let params;
    if (/^\d+$/.test(identifier)) { // Assuming regno is numeric
      query = `
        SELECT u.*, sd.regno 
        FROM users u 
        JOIN student_details sd ON u.Userid = sd.Userid 
        WHERE sd.regno = ? AND u.status = 'active'
      `;
      params = [identifier];
    } else {
      query = 'SELECT * FROM users WHERE username = ? AND status = "active"';
      params = [identifier];
    }

    const [results] = await db.query(query, params);

    if (results.length === 0) {
      return res.status(401).json({ message: 'Invalid identifier or account inactive' });
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
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Database error' });
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

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  db.end(() => {
    console.log('MySQL database connection closed');
    sequelize.close().then(() => {
      console.log('Sequelize database connection closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  db.end(() => {
    console.log('MySQL database connection closed');
    sequelize.close().then(() => {
      console.log('Sequelize database connection closed');
      process.exit(0);
    });
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️  Database: ${process.env.DB_NAME || 'record'}`);
});

export default app;