const { jsPDF } = require('jspdf');
require('jspdf-autotable');
const { pool } = require('./db');

/**
 * Fetches faculty profile data from database
 * @param {number} userId - The user ID of the faculty
 * @returns {Promise<Object>} Complete faculty profile data
 */
async function fetchFacultyData(userId) {
  const conn = await pool.getConnection();
  
  try {
    // Fetch personal information
    const [personalInfo] = await conn.query(`
      SELECT 
        u.username,
        u.email,
        u.image,
        u.skillrackProfile,
        p.full_name,
        p.post,
        p.mobile_number,
        p.anna_university_faculty_id,
        p.aicte_faculty_id,
        p.orcid,
        p.researcher_id,
        p.google_scholar_id,
        p.scopus_profile,
        p.vidwan_profile,
        d.Deptname as department
      FROM users u
      LEFT JOIN personal_information p ON u.Userid = p.Userid
      LEFT JOIN department d ON u.Deptid = d.Deptid
      WHERE u.Userid = ?
    `, [userId]);

    // Fetch education details
    const [education] = await conn.query(`
      SELECT * FROM education WHERE Userid = ?
    `, [userId]);

    // Fetch publications (SCI/Scopus indexed)
    const [publications] = await conn.query(`
      SELECT 
        publication_type,
        publication_name,
        publication_title,
        authors,
        index_type,
        doi,
        citations,
        publisher,
        page_no,
        publication_date,
        impact_factor
      FROM book_chapters 
      WHERE Userid = ? AND index_type IN ('SCI', 'SCIE', 'Scopus')
      ORDER BY publication_date DESC
    `, [userId]);

    // Fetch scholars supervised
    const [scholars] = await conn.query(`
      SELECT 
        scholar_name,
        scholar_type,
        institute,
        university,
        title,
        phd_registered_year,
        completed_year,
        status
      FROM scholars 
      WHERE Userid = ?
      ORDER BY phd_registered_year DESC
    `, [userId]);

    // Fetch professional experience
    const [experience] = await conn.query(`
      SELECT 
        pi.pi_name as faculty_name,
        pi.project_title,
        pi.organization_name,
        pi.from_date,
        pi.to_date
      FROM project_proposals pi
      WHERE pi.Userid = ?
      ORDER BY pi.from_date DESC
    `, [userId]);

    return {
      personal: personalInfo[0] || {},
      education: education[0] || {},
      publications: publications || [],
      scholars: scholars || [],
      experience: experience || []
    };
  } finally {
    conn.release();
  }
}

/**
 * Generates faculty profile PDF
 * @param {number} userId - The user ID of the faculty
 * @returns {Promise<Buffer>} PDF buffer
 */
async function generateFacultyProfilePDF(userId) {
  const data = await fetchFacultyData(userId);
  const doc = new jsPDF('p', 'mm', 'a4');
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPos = margin;

  // Header
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('FACULTY PROFILE', pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  // Faculty Name and Basic Info
  doc.setFontSize(14);
  doc.setTextColor(139, 0, 0); // Dark red color
  const facultyName = data.personal.full_name || data.personal.username || 'N/A';
  doc.text(facultyName.toUpperCase() + ',', margin, yPos);
  yPos += 7;

  // Profile Image (right side)
  if (data.personal.image && data.personal.image !== '/uploads/default.jpg') {
    try {
      // Note: In production, you'd need to convert the image to base64
      // For now, we'll add a placeholder
      const imgX = pageWidth - margin - 30;
      const imgY = yPos - 7;
      doc.rect(imgX, imgY, 28, 35); // Placeholder rectangle
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text('Photo', imgX + 14, imgY + 18, { align: 'center' });
    } catch (err) {
      console.error('Error adding image:', err);
    }
  }

  // Position and Department
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  
  const position = data.personal.post || 'Associate Professor';
  doc.text(position + ',', margin, yPos);
  yPos += 6;

  const department = data.personal.department || 'Computer Science and Engineering';
  doc.text('Department of ' + department + ',', margin, yPos);
  yPos += 6;

  doc.text('National Engineering College,', margin, yPos);
  yPos += 6;

  doc.text('Kovilpatti,', margin, yPos);
  yPos += 8;

  // Email and IDs section
  doc.setFont('helvetica', 'bold');
  doc.text('Email: ', margin, yPos);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 255);
  doc.textWithLink(data.personal.email || 'N/A', margin + 12, yPos, { url: `mailto:${data.personal.email}` });
  doc.setTextColor(0, 0, 0);
  yPos += 6;

  // Anna University Faculty ID
  if (data.personal.anna_university_faculty_id) {
    doc.setFont('helvetica', 'normal');
    doc.text(`Anna University Faculty id: ${data.personal.anna_university_faculty_id}`, margin, yPos);
    yPos += 6;
  }

  // AICTE Faculty ID
  if (data.personal.aicte_faculty_id) {
    doc.text(`AICTE faculty id: ${data.personal.aicte_faculty_id}`, margin, yPos);
    yPos += 6;
  }

  // ORCID
  if (data.personal.orcid) {
    doc.setFont('helvetica', 'bold');
    doc.text('ORCID: ', margin, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(data.personal.orcid, margin + 15, yPos);
    yPos += 6;
  }

  // Researcher ID
  if (data.personal.researcher_id) {
    doc.setFont('helvetica', 'bold');
    doc.text('Researcher ID: ', margin, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(data.personal.researcher_id, margin + 25, yPos);
    yPos += 6;
  }

  // Google Scholar
  if (data.personal.google_scholar_id) {
    doc.setFont('helvetica', 'bold');
    doc.text('Google Scholar ID: ', margin, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(data.personal.google_scholar_id, margin + 35, yPos);
    yPos += 6;
  }

  // Scopus Profile
  if (data.personal.scopus_profile) {
    doc.setFont('helvetica', 'bold');
    doc.text('Scopus Profile - authorId: ', margin, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(data.personal.scopus_profile, margin + 45, yPos);
    yPos += 6;
  }

  // Links
  if (data.personal.scopus_profile) {
    doc.setTextColor(0, 0, 255);
    const scopusUrl = `https://www.scopus.com/authid/detail.uri?authorId=${data.personal.scopus_profile}`;
    doc.textWithLink(scopusUrl, margin, yPos, { url: scopusUrl });
    doc.setTextColor(0, 0, 0);
    yPos += 6;
  }

  if (data.personal.vidwan_profile) {
    doc.setFont('helvetica', 'bold');
    doc.text('Vidwan Profile: ', margin, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 255);
    doc.textWithLink(data.personal.vidwan_profile, margin + 30, yPos, { url: data.personal.vidwan_profile });
    doc.setTextColor(0, 0, 0);
    yPos += 10;
  }

  // Research Area
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 139); // Dark blue
  doc.text('Research Area', margin, yPos);
  yPos += 8;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text('Remote Sensing, Image Processing, Data Analytics', margin + 5, yPos);
  yPos += 12;

  // Supervisor Recognition
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 139);
  doc.text('Supervisor Recognition', margin, yPos);
  yPos += 8;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  
  // This data should come from scholars table
  const scholarCount = data.scholars.filter(s => s.status === 'Ongoing').length;
  doc.text(`• Anna University – Chennai (Ref. No: 4140004)`, margin + 5, yPos);
  yPos += 6;
  doc.text(`• Ph.D., Scholars: In Progress: ${scholarCount}`, margin + 5, yPos);
  yPos += 12;

  // Check if new page needed
  if (yPos > pageHeight - 40) {
    doc.addPage();
    yPos = margin;
  }

  // Professional Experience
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 139);
  doc.text('Professional Experience', margin, yPos);
  yPos += 10;

  if (data.experience.length > 0) {
    const expTableData = data.experience.map(exp => [
      exp.organization_name || 'N/A',
      exp.project_title || 'N/A',
      `${new Date(exp.from_date).toLocaleDateString()} - ${exp.to_date ? new Date(exp.to_date).toLocaleDateString() : 'Present'}`
    ]);

    doc.autoTable({
      startY: yPos,
      head: [['Institution / Organization', 'Designation', 'Period']],
      body: expTableData,
      theme: 'grid',
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        halign: 'center'
      },
      styles: {
        fontSize: 10,
        cellPadding: 4
      },
      margin: { left: margin, right: margin }
    });

    yPos = doc.lastAutoTable.finalY + 10;
  }

  // Membership
  if (yPos > pageHeight - 30) {
    doc.addPage();
    yPos = margin;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 139);
  doc.text('Membership in Professional Bodies', margin, yPos);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text('IEEE, IEEE-CS', pageWidth - margin - 30, yPos, { align: 'right' });
  yPos += 12;

  // Publications Section
  if (data.publications.length > 0) {
    if (yPos > pageHeight - 40) {
      doc.addPage();
      yPos = margin;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 139);
    doc.text('Publications (SCI and Scopus Indexed)', margin, yPos);
    yPos += 10;

    data.publications.forEach((pub, index) => {
      if (yPos > pageHeight - 30) {
        doc.addPage();
        yPos = margin;
      }

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);

      const pubText = `${index + 1}. ${pub.authors}, ${pub.publication_title}, ${pub.publication_name}, ${pub.publisher || ''}, ${pub.index_type}, ${new Date(pub.publication_date).getFullYear()}. ${pub.doi ? pub.doi : ''} (IF: ${pub.impact_factor || 'N/A'})`;
      
      const splitText = doc.splitTextToSize(pubText, pageWidth - 2 * margin);
      doc.text(splitText, margin + 5, yPos);
      yPos += splitText.length * 5 + 4;
    });
  }

  return doc.output('arraybuffer');
}

module.exports = {
  generateFacultyProfilePDF,
  fetchFacultyData
};