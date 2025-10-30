import express from 'express';
import PDFDocument from 'pdfkit';
import { sequelize } from '../../config/mysql.js';
import { QueryTypes } from 'sequelize';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Fetch all student data from database
async function fetchStudentData(userId) {
  const data = {
    basicInfo: null,
    courses: [],
    internships: [],
    organizedEvents: [],
    attendedEvents: [],
    scholarships: [],
    leaves: [],
    achievements: []
  };

  try {
    console.log('Fetching data for userId:', userId);

    // Fetch basic student info with proper joins
    const basicInfo = await sequelize.query(`
      SELECT
        u.Userid, u.username, u.email, u.staffId, u.image,
        sd.regno, sd.batch, sd.gender, sd.date_of_birth,
        CONCAT_WS(', ', sd.door_no, sd.street) as address,
        c.name as city, di.name as district, s.name as state,
        sd.pincode, sd.personal_phone as phone,
        sd.blood_group, sd.aadhar_card_no as aadhar_number,
        d.Deptname as department, d.Deptacronym as dept_code
      FROM users u
      LEFT JOIN student_details sd ON u.Userid = sd.Userid
      LEFT JOIN department d ON u.Deptid = d.Deptid
      LEFT JOIN cities c ON sd.cityID = c.id
      LEFT JOIN districts di ON sd.districtID = di.id
      LEFT JOIN states s ON sd.stateID = s.id
      WHERE u.Userid = ? AND u.role = 'Student'
    `, {
      replacements: [userId],
      type: QueryTypes.SELECT
    });

    if (basicInfo && basicInfo.length > 0) {
      data.basicInfo = basicInfo[0];
      console.log('Basic info found:', data.basicInfo.username);
    } else {
      console.log('No basic info found for userId:', userId);
      return data;
    }

    // Fetch online courses
    const courses = await sequelize.query(`
      SELECT course_name, type, provider_name, instructor_name, status,
             tutor_approval_status, created_at
      FROM online_courses
      WHERE Userid = ?
      ORDER BY created_at DESC
    `, {
      replacements: [userId],
      type: QueryTypes.SELECT
    });
    data.courses = courses || [];
    console.log('Courses found:', data.courses.length);

    // Fetch internships
    const internships = await sequelize.query(`
      SELECT description, provider_name, domain, mode, start_date, end_date,
             status, stipend_amount, tutor_approval_status, created_at
      FROM internships
      WHERE Userid = ?
      ORDER BY start_date DESC
    `, {
      replacements: [userId],
      type: QueryTypes.SELECT
    });
    data.internships = internships || [];
    console.log('Internships found:', data.internships.length);

    // Fetch organized events
    const organizedEvents = await sequelize.query(`
      SELECT program_name, program_title, coordinator_name, co_coordinator_names,
             speaker_details, from_date, to_date, days, sponsored_by,
             amount_sanctioned, participants, created_at
      FROM events_organized
      WHERE Userid = ?
      ORDER BY from_date DESC
    `, {
      replacements: [userId],
      type: QueryTypes.SELECT
    });
    data.organizedEvents = organizedEvents || [];
    console.log('Organized events found:', data.organizedEvents.length);

    // Fetch attended events
    const attendedEvents = await sequelize.query(`
      SELECT event_name, description, type_of_event, organized_by, mode,
             from_date, to_date, participation_status, achievement_details,
             tutor_approval_status, created_at
      FROM event_attended
      WHERE Userid = ?
      ORDER BY from_date DESC
    `, {
      replacements: [userId],
      type: QueryTypes.SELECT
    });
    data.attendedEvents = attendedEvents || [];
    console.log('Attended events found:', data.attendedEvents.length);

    // Fetch scholarships
    const scholarships = await sequelize.query(`
      SELECT name, provider, type, year, status, created_at as appliedDate,
             receivedAmount, updated_at as receivedDate, tutor_approval_status
      FROM scholarships
      WHERE Userid = ?
      ORDER BY year DESC
    `, {
      replacements: [userId],
      type: QueryTypes.SELECT
    });
    data.scholarships = scholarships || [];
    console.log('Scholarships found:', data.scholarships.length);

    // Fetch achievements
    const achievements = await sequelize.query(`
      SELECT title, description, date_awarded, tutor_approval_status, created_at
      FROM achievements
      WHERE Userid = ?
      ORDER BY date_awarded DESC
    `, {
      replacements: [userId],
      type: QueryTypes.SELECT
    });
    data.achievements = achievements || [];
    console.log('Achievements found:', data.achievements.length);

    // Fetch leaves
    const leaves = await sequelize.query(`
      SELECT reason, start_date, end_date, leave_type,
             DATEDIFF(end_date, start_date) + 1 as number_of_days,
             tutor_approval_status as leave_status, created_at as applied_date
      FROM student_leave
      WHERE Userid = ?
      ORDER BY created_at DESC
    `, {
      replacements: [userId],
      type: QueryTypes.SELECT
    });
    data.leaves = leaves || [];
    console.log('Leaves found:', data.leaves.length);

  } catch (error) {
    console.error('Error fetching student data:', error);
    throw error;
  }

  return data;
}

// Generate PDF content (your existing function - keeping it as is)
async function generatePDFContent(doc, data) {
  const { basicInfo, courses, internships, organizedEvents, attendedEvents, scholarships, leaves, achievements } = data;

  const MARGINS = { left: 50, right: 50, top: 50, bottom: 50 };
  const CONTENT_WIDTH = doc.page.width - MARGINS.left - MARGINS.right;
  const LABEL_X = MARGINS.left;
  const VALUE_X = MARGINS.left + 140;
  const VALUE_WIDTH = CONTENT_WIDTH - 140;

  const COLORS = {
    primary: '#1E40AF',
    secondary: '#64748B',
    text: '#1F2937',
    textLight: '#6B7280',
    accent: '#059669',
    border: '#E5E7EB'
  };

  const addSectionHeader = (title) => {
    if (doc.y > doc.page.height - 150) {
      doc.addPage();
    }
    doc.moveDown(1);
    doc.font('Helvetica-Bold').fontSize(16).fillColor(COLORS.primary)
       .text(title, LABEL_X, doc.y);
    const lineY = doc.y + 3;
    doc.lineWidth(1)
       .moveTo(LABEL_X, lineY)
       .lineTo(doc.page.width - MARGINS.right, lineY)
       .stroke(COLORS.primary);
    doc.moveDown(0.8);
    doc.fillColor(COLORS.text).font('Helvetica').fontSize(11);
  };

  const addField = (label, value) => {
    if (doc.y > doc.page.height - 100) {
      doc.addPage();
    }
    const startY = doc.y;
    doc.font('Helvetica-Bold').fontSize(10).fillColor(COLORS.secondary)
       .text(label + ':', LABEL_X, startY);
    doc.font('Helvetica').fontSize(11).fillColor(COLORS.text)
       .text(value || 'N/A', VALUE_X, startY, { width: VALUE_WIDTH });
    doc.moveDown(0.4);
  };

  const addListItem = (index, title, details = []) => {
    if (doc.y > doc.page.height - 120) {
      doc.addPage();
    }
    doc.font('Helvetica-Bold').fontSize(12).fillColor(COLORS.text)
       .text(`${index}. ${title}`, LABEL_X + 10, doc.y);
    doc.moveDown(0.3);
    details.forEach((detail) => {
      if (doc.y > doc.page.height - 80) {
        doc.addPage();
      }
      doc.font('Helvetica').fontSize(10).fillColor(COLORS.textLight)
         .text(`   ${detail}`, LABEL_X + 20, doc.y, { width: VALUE_WIDTH - 20 });
      doc.moveDown(0.2);
    });
    doc.moveDown(0.5);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN');
  };

  // Header
  doc.font('Helvetica-Bold').fontSize(20).fillColor(COLORS.primary)
     .text('STUDENT ACTIVITY REPORT', MARGINS.left, 30, { width: CONTENT_WIDTH, align: 'center' });
  
  doc.moveDown(1);
  doc.fontSize(14).fillColor(COLORS.text)
     .text(basicInfo.username || 'Student Name', MARGINS.left, doc.y, { width: CONTENT_WIDTH, align: 'center' });
  
  doc.moveDown(0.5);
  doc.fontSize(11).fillColor(COLORS.secondary)
     .text(`${basicInfo.department || 'Department'} | ${basicInfo.regno || 'Reg No'}`, MARGINS.left, doc.y, { width: CONTENT_WIDTH, align: 'center' });
  
  doc.moveDown(0.5);
  doc.fontSize(10)
     .text(`Report Generated: ${new Date().toLocaleDateString('en-IN')}`, MARGINS.left, doc.y, { width: CONTENT_WIDTH, align: 'center' });
  
  doc.moveDown(2);

  // Personal Information
  addSectionHeader('PERSONAL INFORMATION');
  addField('Full Name', basicInfo.username);
  addField('Registration Number', basicInfo.regno);
  addField('Email', basicInfo.email);
  addField('Department', basicInfo.department);
  addField('Batch', basicInfo.batch);
  addField('Gender', basicInfo.gender);
  addField('Date of Birth', formatDate(basicInfo.date_of_birth));
  addField('Blood Group', basicInfo.blood_group);
  addField('Phone', basicInfo.phone);
  // addField('Father\'s Name', basicInfo.father_name);
  // addField('Mother\'s Name', basicInfo.mother_name);
  addField('Address', `${basicInfo.address || ''}, ${basicInfo.city || ''}, ${basicInfo.state || ''} - ${basicInfo.pincode || ''}`);

  // Online Courses
  if (courses && courses.length > 0) {
    addSectionHeader('ONLINE COURSES');
    courses.forEach((course, index) => {
      const details = [
        `Provider: ${course.provider_name || 'N/A'}`,
        `Type: ${course.type || 'N/A'}`,
        `Instructor: ${course.instructor_name || 'N/A'}`,
        `Status: ${course.status || 'N/A'}`,
        `Approval: ${course.tutor_approval_status ? 'Approved' : 'Pending'}`,
        `Date: ${formatDate(course.created_at)}`
      ];
      addListItem(index + 1, course.course_name || 'Course', details);
    });
  }

  // Internships
  if (internships && internships.length > 0) {
    addSectionHeader('INTERNSHIPS');
    internships.forEach((internship, index) => {
      const details = [
        `Description: ${internship.description || 'N/A'}`,
        `Domain: ${internship.domain || 'N/A'}`,
        `Mode: ${internship.mode || 'N/A'}`,
        `Duration: ${formatDate(internship.start_date)} - ${formatDate(internship.end_date)}`,
        `Status: ${internship.status || 'N/A'}`,
        `Stipend: ${internship.stipend_amount ? `₹${internship.stipend_amount}` : 'N/A'}`,
        `Approval: ${internship.tutor_approval_status ? 'Approved' : 'Pending'}`
      ];
      addListItem(index + 1, internship.provider_name || 'Internship', details);
    });
  }

  // Events Attended
  if (attendedEvents && attendedEvents.length > 0) {
    addSectionHeader('EVENTS ATTENDED');
    attendedEvents.forEach((event, index) => {
      const details = [
        `Description: ${event.description || 'N/A'}`,
        `Type: ${event.event_type || 'N/A'}`,
        `Institution: ${event.institution_name || 'N/A'}`,
        `Mode: ${event.mode || 'N/A'}`,
        `Duration: ${formatDate(event.from_date)} - ${formatDate(event.to_date)}`,
        `Status: ${event.participation_status || 'N/A'}`,
        `Achievement: ${event.achievement_details || 'N/A'}`,
        `Approval: ${event.tutor_approval_status ? 'Approved' : 'Pending'}`
      ];
      addListItem(index + 1, event.event_name || 'Event', details);
    });
  }

  // Events Organized
  if (organizedEvents && organizedEvents.length > 0) {
    addSectionHeader('EVENTS ORGANIZED');
    organizedEvents.forEach((event, index) => {
      const details = [
        `Club: ${event.club_name || 'N/A'}`,
        `Role: ${event.role || 'N/A'}`,
        `Staff: ${event.staff_incharge || 'N/A'}`,
        `Duration: ${formatDate(event.start_date)} - ${formatDate(event.end_date)}`,
        `Participants: ${event.number_of_participants || 'N/A'}`,
        `Mode: ${event.mode || 'N/A'}`,
        `Funding: ${event.funding_agency || 'N/A'} - ₹${event.funding_amount || 0}`,
        `Approval: ${event.tutor_approval_status ? 'Approved' : 'Pending'}`
      ];
      addListItem(index + 1, event.program_name || 'Event', details);
    });
  }

  // Scholarships
  if (scholarships && scholarships.length > 0) {
    addSectionHeader('SCHOLARSHIPS');
    scholarships.forEach((scholarship, index) => {
      const details = [
        `Provider: ${scholarship.provider || 'N/A'}`,
        `Type: ${scholarship.type || 'N/A'}`,
        `Year: ${scholarship.year || 'N/A'}`,
        `Status: ${scholarship.status || 'N/A'}`,
        `Amount: ${scholarship.receivedAmount ? `₹${scholarship.receivedAmount}` : 'N/A'}`,
        `Applied: ${formatDate(scholarship.appliedDate)}`,
        `Approval: ${scholarship.tutor_approval_status ? 'Approved' : 'Pending'}`
      ];
      addListItem(index + 1, scholarship.name || 'Scholarship', details);
    });
  }

  // Achievements
  if (achievements && achievements.length > 0) {
    addSectionHeader('ACHIEVEMENTS');
    achievements.forEach((achievement, index) => {
      const details = [
        `Description: ${achievement.description || 'N/A'}`,
        `Date: ${formatDate(achievement.date_awarded)}`,
        `Approval: ${achievement.tutor_approval_status ? 'Approved' : 'Pending'}`
      ];
      addListItem(index + 1, achievement.title || 'Achievement', details);
    });
  }

  // Leave Applications
  if (leaves && leaves.length > 0) {
    addSectionHeader('LEAVE APPLICATIONS');
    leaves.forEach((leave, index) => {
      const details = [
        `Reason: ${leave.reason || 'N/A'}`,
        `Type: ${leave.leave_type || 'N/A'}`,
        `Duration: ${formatDate(leave.start_date)} - ${formatDate(leave.end_date)}`,
        `Days: ${leave.number_of_days || 'N/A'}`,
        `Status: ${leave.leave_status ? 'Approved' : 'Pending'}`,
        `Applied: ${formatDate(leave.applied_date)}`
      ];
      addListItem(index + 1, 'Leave Application', details);
    });
  }

  // Summary
  doc.addPage();
  addSectionHeader('ACTIVITY SUMMARY');
  addField('Total Courses', `${courses.length} (${courses.filter(c => c.tutor_approval_status).length} approved)`);
  addField('Total Internships', `${internships.length} (${internships.filter(i => i.tutor_approval_status).length} approved)`);
  addField('Events Organized', `${organizedEvents.length} (${organizedEvents.filter(e => e.tutor_approval_status).length} approved)`);
  addField('Events Attended', `${attendedEvents.length} (${attendedEvents.filter(e => e.tutor_approval_status).length} approved)`);
  addField('Scholarships', `${scholarships.length} (${scholarships.filter(s => s.tutor_approval_status).length} approved)`);
  addField('Achievements', `${achievements.length} (${achievements.filter(a => a.tutor_approval_status).length} approved)`);
  addField('Leave Applications', `${leaves.length} (${leaves.filter(l => l.leave_status).length} approved)`);

  // Footer
  const footerY = doc.page.height - 40;
  doc.fontSize(8).fillColor(COLORS.textLight)
     .text('Generated automatically by Student Activity Management System', MARGINS.left, footerY, { width: CONTENT_WIDTH, align: 'center' });
}

// ROUTE: Generate and download PDF
router.get('/generate-pdf/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('Generate PDF request for userId:', userId);

    const studentData = await fetchStudentData(userId);

    if (!studentData.basicInfo) {
      console.log('Student not found for userId:', userId);
      return res.status(404).json({ error: 'Student not found' });
    }

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const filename = `student_report_${studentData.basicInfo.regno || userId}_${Date.now()}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    doc.pipe(res);
    await generatePDFContent(doc, studentData);
    doc.end();

    console.log('PDF generated successfully for:', studentData.basicInfo.username);
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF', details: error.message });
  }
});

// ROUTE: View PDF (inline)
router.get('/view-pdf/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('View PDF request for userId:', userId);

    const studentData = await fetchStudentData(userId);

    if (!studentData.basicInfo) {
      console.log('Student not found for userId:', userId);
      return res.status(404).json({ error: 'Student not found' });
    }

    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');

    doc.pipe(res);
    await generatePDFContent(doc, studentData);
    doc.end();

    console.log('PDF viewed successfully for:', studentData.basicInfo.username);
  } catch (error) {
    console.error('Error viewing PDF:', error);
    res.status(500).json({ error: 'Failed to view PDF', details: error.message });
  }
});

// ROUTE: Get student data as JSON (for debugging)
router.get('/data/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const studentData = await fetchStudentData(userId);
    
    if (!studentData.basicInfo) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json(studentData);
  } catch (error) {
    console.error('Error fetching student data:', error);
    res.status(500).json({ error: 'Failed to fetch student data', details: error.message });
  }
});

export default router;