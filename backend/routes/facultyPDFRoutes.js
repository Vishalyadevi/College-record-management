// routes/facultyPDFRoutes.js
import express from 'express';
import PDFDocument from 'pdfkit';
import mysql from 'mysql2/promise';

const router = express.Router();

// MySQL Connection Pool
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Monisha_018',
  database: process.env.DB_NAME || 'record',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Faculty Profile PDF Generator Route
router.get('/faculty/profile/pdf/:userId', async (req, res) => {
  const { userId } = req.params;

  console.log('PDF generation requested for user:', userId);

  try {
    // Validate userId
    if (!userId || isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Fetch all faculty data from multiple tables
    const facultyData = await getFacultyCompleteProfile(userId);
    
    if (!facultyData.personalInfo) {
      console.log('Faculty profile not found for user:', userId);
      return res.status(404).json({ message: 'Faculty profile not found' });
    }

    console.log('Faculty data retrieved successfully for:', facultyData.personalInfo.full_name);

    // Create PDF
    const doc = new PDFDocument({ 
      margin: 50,
      size: 'A4'
    });
    
    // Set response headers BEFORE piping
    const facultyName = facultyData.personalInfo.full_name?.replace(/\s+/g, '-') || 'Faculty';
    const filename = `Faculty-Profile-${facultyName}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache');
    
    // Handle PDF generation errors
    doc.on('error', (error) => {
      console.error('PDF generation error:', error);
      if (!res.headersSent) {
        res.status(500).json({ message: 'PDF generation failed' });
      }
    });

    // Pipe the PDF to the response
    doc.pipe(res);

    // Generate PDF content
    await generateFacultyPDF(doc, facultyData);
    
    // Finalize the PDF
    doc.end();
    
    console.log('PDF generation completed successfully');
    
  } catch (error) {
    console.error('Error generating faculty PDF:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        message: 'Error generating PDF report',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
});

// Function to fetch complete faculty profile data
async function getFacultyCompleteProfile(userId) {
  const connection = await db.getConnection();
  
  try {
    console.log('Fetching faculty data for user:', userId);

    // Personal Information
    const [personalInfo] = await connection.query(
      `SELECT pi.*, d.Deptname, d.Deptacronym 
       FROM personal_information pi
       JOIN users u ON pi.Userid = u.Userid
       LEFT JOIN department d ON u.Deptid = d.Deptid
       WHERE pi.Userid = ?`, 
      [userId]
    );

    console.log('Personal info found:', personalInfo.length > 0 ? 'Yes' : 'No');

    // Education Details
    const [education] = await connection.query(
      'SELECT * FROM education WHERE Userid = ?', 
      [userId]
    );

    // Publications (Book Chapters/Journals)
    const [publications] = await connection.query(
      `SELECT * FROM book_chapters 
       WHERE Userid = ? 
       ORDER BY publication_date DESC`, 
      [userId]
    );

    // Conferences/Events Organized
    const [eventsOrganized] = await connection.query(
      'SELECT * FROM events_organized WHERE Userid = ? ORDER BY from_date DESC', 
      [userId]
    );

    // Events Attended
    const [eventsAttended] = await connection.query(
      'SELECT * FROM events_attended WHERE Userid = ? ORDER BY from_date DESC', 
      [userId]
    );

    // Research Projects
    const [researchProjects] = await connection.query(
      'SELECT * FROM sponsored_research WHERE Userid = ? ORDER BY id DESC', 
      [userId]
    );

    // Consultancy Projects
    const [consultancyProjects] = await connection.query(
      'SELECT * FROM consultancy_proposals WHERE Userid = ? ORDER BY from_date DESC', 
      [userId]
    );

    // Project Proposals
    const [projectProposals] = await connection.query(
      'SELECT * FROM project_proposals WHERE Userid = ? ORDER BY from_date DESC', 
      [userId]
    );

    // Industry Knowhow
    const [industryKnowhow] = await connection.query(
      'SELECT * FROM industry_knowhow WHERE Userid = ? ORDER BY from_date DESC', 
      [userId]
    );

    // Certification Courses
    const [certifications] = await connection.query(
      'SELECT * FROM certification_courses WHERE Userid = ? ORDER BY from_date DESC', 
      [userId]
    );

    // H-Index Information
    const [hIndex] = await connection.query(
      'SELECT * FROM h_index WHERE Userid = ? ORDER BY id DESC LIMIT 1', 
      [userId]
    );

    // Resource Person Activities
    const [resourcePerson] = await connection.query(
      'SELECT * FROM resource_person WHERE Userid = ? ORDER BY event_date DESC', 
      [userId]
    );

    // Recognition & Appreciation
    const [recognition] = await connection.query(
      'SELECT * FROM recognition_appreciation WHERE Userid = ? ORDER BY recognition_date DESC', 
      [userId]
    );

    // Patents & Products
    const [patents] = await connection.query(
      'SELECT * FROM patent_product WHERE Userid = ? ORDER BY id DESC', 
      [userId]
    );

    // Scholars Supervised
    const [scholars] = await connection.query(
      'SELECT * FROM scholars WHERE Userid = ? ORDER BY phd_registered_year DESC', 
      [userId]
    );

    // Seed Money Projects
    const [seedMoney] = await connection.query(
      'SELECT * FROM seed_money WHERE Userid = ? ORDER BY id DESC', 
      [userId]
    );

    // Project Mentoring
    const [projectMentors] = await connection.query(
      'SELECT * FROM project_mentors WHERE Userid = ? ORDER BY id DESC', 
      [userId]
    );

    console.log('Data retrieval completed. Records found:', {
      personalInfo: personalInfo.length,
      education: education.length,
      publications: publications.length,
      eventsOrganized: eventsOrganized.length,
      eventsAttended: eventsAttended.length
    });

    return {
      personalInfo: personalInfo[0] || null,
      education: education[0] || null,
      publications: publications || [],
      eventsOrganized: eventsOrganized || [],
      eventsAttended: eventsAttended || [],
      researchProjects: researchProjects || [],
      consultancyProjects: consultancyProjects || [],
      projectProposals: projectProposals || [],
      industryKnowhow: industryKnowhow || [],
      certifications: certifications || [],
      hIndex: hIndex[0] || null,
      resourcePerson: resourcePerson || [],
      recognition: recognition || [],
      patents: patents || [],
      scholars: scholars || [],
      seedMoney: seedMoney || [],
      projectMentors: projectMentors || []
    };
    
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// Function to generate the PDF content
async function generateFacultyPDF(doc, data) {
  try {
    const pageWidth = doc.page.width - 100;
    let yPosition = 80;

    // Helper function to add a new page if needed
    const checkPageBreak = (requiredHeight = 100) => {
      if (doc.y > doc.page.height - requiredHeight) {
        doc.addPage();
        return 80;
      }
      return doc.y;
    };

    // Helper function to add section header
    const addSectionHeader = (title, fontSize = 14) => {
      yPosition = checkPageBreak(60);
      doc.fontSize(fontSize)
         .font('Helvetica-Bold')
         .fillColor('#2c3e50')
         .text(title, 50, yPosition);
      yPosition += 25;
      
      doc.strokeColor('#3498db')
         .lineWidth(2)
         .moveTo(50, yPosition - 10)
         .lineTo(pageWidth + 50, yPosition - 10)
         .stroke();
      yPosition += 10;
    };

    // Helper function to safely format dates
    const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      try {
        return new Date(dateString).toLocaleDateString();
      } catch (e) {
        return dateString;
      }
    };

    // Header Section
    doc.fontSize(22)
       .font('Helvetica-Bold')
       .fillColor('#2c3e50')
       .text('FACULTY PROFILE', 50, 50, { align: 'center' });

    yPosition = 100;

    // Personal Information
    if (data.personalInfo) {
      const personal = data.personalInfo;
      
      doc.fontSize(18)
         .font('Helvetica-Bold')
         .fillColor('#2c3e50')
         .text((personal.full_name || 'FACULTY NAME').toUpperCase(), 50, yPosition);
      
      yPosition += 25;
      
      doc.fontSize(12)
         .font('Helvetica')
         .fillColor('#34495e')
         .text(personal.post || 'Position', 50, yPosition)
         .text(`Department of ${personal.Deptname || 'Department'}`, 50, yPosition + 15)
         .text('National Engineering College, Kovilpatti', 50, yPosition + 30)
         .text(`Email: ${personal.email || 'N/A'}`, 50, yPosition + 45);

      yPosition += 75;

      if (personal.anna_university_faculty_id || personal.aicte_faculty_id || personal.orcid) {
        doc.fontSize(10).font('Helvetica');
        if (personal.anna_university_faculty_id) {
          doc.text(`Anna University Faculty ID: ${personal.anna_university_faculty_id}`, 50, yPosition);
          yPosition += 12;
        }
        if (personal.aicte_faculty_id) {
          doc.text(`AICTE Faculty ID: ${personal.aicte_faculty_id}`, 50, yPosition);
          yPosition += 12;
        }
        if (personal.orcid) {
          doc.text(`ORCID: ${personal.orcid}`, 50, yPosition);
          yPosition += 12;
        }
        yPosition += 10;
      }
    }

    // Publications Section
    if (data.publications && data.publications.length > 0) {
      addSectionHeader('Publications (SCI and Scopus Indexed)');
      
      doc.fontSize(10).font('Helvetica');
      
      data.publications.forEach((pub, index) => {
        yPosition = checkPageBreak(60);
        
        doc.font('Helvetica-Bold')
           .text(`${index + 1}. `, 50, yPosition, { continued: true })
           .font('Helvetica')
           .text(`"${pub.publication_title || 'N/A'}", ${pub.authors || 'N/A'}, ${pub.publication_name || 'N/A'}`);
        
        yPosition += 12;
        
        let details = [];
        if (pub.publisher) details.push(`Publisher: ${pub.publisher}`);
        if (pub.publication_date) {
          const year = formatDate(pub.publication_date).split('/')[2] || 'N/A';
          details.push(`Year: ${year}`);
        }
        if (pub.index_type) details.push(`Index: ${pub.index_type}`);
        if (pub.impact_factor) details.push(`IF: ${pub.impact_factor}`);
        
        if (details.length > 0) {
          doc.text(`(${details.join(', ')})`, 50, yPosition);
          yPosition += 12;
        }
        
        yPosition += 8;
      });
    }

    // Events Organized Section
    if (data.eventsOrganized && data.eventsOrganized.length > 0) {
      addSectionHeader('Technical Events Organized');
      
      doc.fontSize(9).font('Helvetica');
      
      data.eventsOrganized.forEach((event, index) => {
        yPosition = checkPageBreak(40);
        
        doc.font('Helvetica-Bold')
           .text(`${index + 1}. `, 50, yPosition, { continued: true })
           .font('Helvetica')
           .text(`${event.program_title || 'N/A'}`);
        
        yPosition += 12;
        
        if (event.sponsored_by) {
          doc.text(`Sponsored by: ${event.sponsored_by}`, 70, yPosition);
          yPosition += 10;
        }
        
        if (event.from_date && event.to_date) {
          doc.text(`Duration: ${formatDate(event.from_date)} to ${formatDate(event.to_date)}`, 70, yPosition);
          yPosition += 10;
        }
        
        yPosition += 8;
      });
    }

    // Events Attended Section
    if (data.eventsAttended && data.eventsAttended.length > 0) {
      addSectionHeader('Technical Events Attended');
      
      doc.fontSize(9).font('Helvetica');
      
      data.eventsAttended.forEach((event, index) => {
        yPosition = checkPageBreak(40);
        
        doc.font('Helvetica-Bold')
           .text(`${index + 1}. `, 50, yPosition, { continued: true })
           .font('Helvetica')
           .text(`${event.title || 'N/A'}`);
        
        yPosition += 12;
        
        if (event.organized_by) {
          doc.text(`Organized by: ${event.organized_by}`, 70, yPosition);
          yPosition += 10;
        }
        
        if (event.from_date && event.to_date) {
          doc.text(`Duration: ${formatDate(event.from_date)} to ${formatDate(event.to_date)}`, 70, yPosition);
          yPosition += 10;
        }
        
        yPosition += 8;
      });
    }

    // Add footer with generation date
    const finalY = doc.y + 50;
    if (finalY > doc.page.height - 100) {
      doc.addPage();
    }
    
    doc.fontSize(8)
       .font('Helvetica')
       .fillColor('#7f8c8d')
       .text(`Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 
             50, doc.page.height - 50, { align: 'center' });

    console.log('PDF content generation completed');

  } catch (error) {
    console.error('PDF generation error:', error);
    throw error;
  }
}

export default router;