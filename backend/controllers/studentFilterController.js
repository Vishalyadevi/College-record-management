// controllers/studentFilterController.js
import StudentDetails from '../models/StudentDetails.js';
import StudentEducation from '../models/StudentEducation.js';
import User from '../models/User.js';
import Department from '../models/Department.js';
import { Op } from 'sequelize';

export const getEligibleStudents = async (req, res) => {
  try {
    const {
      batch,
      year,
      deptId,
      minTenth,
      maxTenth,
      minTwelfth,
      maxTwelfth,
      minCgpa,
      maxCgpa,
      hasArrearsHistory,
      hasStandingArrears,
    } = req.query;

    // Build dynamic WHERE clause for StudentDetails
    const studentDetailsWhere = {};
    
    if (batch) {
      studentDetailsWhere.batch = batch;
    }
    
    if (deptId) {
      studentDetailsWhere.Deptid = deptId;
    }

    // Build dynamic WHERE clause for StudentEducation
    const educationWhere = {};
    
    if (minTenth || maxTenth) {
      educationWhere.tenth_percentage = {};
      if (minTenth) educationWhere.tenth_percentage[Op.gte] = parseFloat(minTenth);
      if (maxTenth) educationWhere.tenth_percentage[Op.lte] = parseFloat(maxTenth);
    }
    
    if (minTwelfth || maxTwelfth) {
      educationWhere.twelfth_percentage = {};
      if (minTwelfth) educationWhere.twelfth_percentage[Op.gte] = parseFloat(minTwelfth);
      if (maxTwelfth) educationWhere.twelfth_percentage[Op.lte] = parseFloat(maxTwelfth);
    }
    
    if (minCgpa || maxCgpa) {
      educationWhere.cgpa = {};
      if (minCgpa) educationWhere.cgpa[Op.gte] = parseFloat(minCgpa);
      if (maxCgpa) educationWhere.cgpa[Op.lte] = parseFloat(maxCgpa);
    }
    
    if (hasArrearsHistory !== undefined && hasArrearsHistory !== '') {
      educationWhere.has_arrears_history = hasArrearsHistory === 'true' || hasArrearsHistory === true;
    }
    
    if (hasStandingArrears !== undefined && hasStandingArrears !== '') {
      educationWhere.has_standing_arrears = hasStandingArrears === 'true' || hasStandingArrears === true;
    }

    // Calculate year filter based on twelfth_year_of_passing if year parameter is provided
    if (year) {
      const currentYear = new Date().getFullYear();
      const passingYear = currentYear - (4 - parseInt(year)); // 4-year program
      educationWhere.twelfth_year_of_passing = passingYear;
    }

    // Fetch students with filters
    const students = await StudentDetails.findAll({
      where: studentDetailsWhere,
      include: [
        {
          model: User,
          as: 'User',
          attributes: ['Userid', 'username', 'email', 'role'],
          required: true,
          include: [
            {
              model: StudentEducation,
              as: 'StudentEducation',
              where: educationWhere,
              required: true,
            },
          ],
        },
        {
          model: Department,
          as: 'Department',
          attributes: ['Deptid', 'Dept_name'],
        },
      ],
      order: [['batch', 'DESC'], ['regno', 'ASC']],
    });

    // Format the response
    const formattedStudents = students.map(student => {
      const education = student.User?.StudentEducation;
      
      return {
        id: student.id,
        userid: student.Userid,
        regno: student.regno,
        username: student.User?.username,
        email: student.User?.email,
        department: student.Department?.Dept_name,
        deptId: student.Deptid,
        batch: student.batch,
        semester: student.Semester,
        section: student.section,
        
        // Education Details
        tenth_percentage: education?.tenth_percentage,
        tenth_board: education?.tenth_board,
        tenth_year: education?.tenth_year_of_passing,
        
        twelfth_percentage: education?.twelfth_percentage,
        twelfth_board: education?.twelfth_board,
        twelfth_year: education?.twelfth_year_of_passing,
        
        cgpa: education?.cgpa,
        gpa: education?.gpa,
        
        // Arrears Information
        has_arrears_history: education?.has_arrears_history,
        arrears_history_count: education?.arrears_history_count,
        arrears_history_details: education?.arrears_history_details,
        
        has_standing_arrears: education?.has_standing_arrears,
        standing_arrears_count: education?.standing_arrears_count,
        standing_arrears_subjects: education?.standing_arrears_subjects,
        
        // Semester-wise GPA
        semester_gpas: {
          sem1: education?.semester_1_gpa,
          sem2: education?.semester_2_gpa,
          sem3: education?.semester_3_gpa,
          sem4: education?.semester_4_gpa,
          sem5: education?.semester_5_gpa,
          sem6: education?.semester_6_gpa,
          sem7: education?.semester_7_gpa,
          sem8: education?.semester_8_gpa,
        },
        
        // Additional Info
        personal_email: student.personal_email,
        personal_phone: student.personal_phone,
        blood_group: student.blood_group,
        gender: student.gender,
      };
    });

    res.status(200).json({
      success: true,
      count: formattedStudents.length,
      data: formattedStudents,
    });

  } catch (error) {
    console.error('Error fetching eligible students:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching eligible students',
      error: error.message,
    });
  }
};

// Get filter options (departments, batches, etc.)
export const getFilterOptions = async (req, res) => {
  try {
    const departments = await Department.findAll({
      attributes: ['Deptid', 'Dept_name'],
      order: [['Dept_name', 'ASC']],
    });

    const batches = await StudentDetails.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('batch')), 'batch']],
      where: {
        batch: { [Op.not]: null },
      },
      order: [['batch', 'DESC']],
      raw: true,
    });

    res.status(200).json({
      success: true,
      data: {
        departments,
        batches: batches.map(b => b.batch),
        years: [1, 2, 3, 4],
      },
    });

  } catch (error) {
    console.error('Error fetching filter options:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching filter options',
      error: error.message,
    });
  }
};