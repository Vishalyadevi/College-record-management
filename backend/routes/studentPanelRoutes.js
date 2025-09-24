import express from 'express';
import { sequelize } from '../config/mysql.js';
import ExcelJS from 'exceljs';

const router = express.Router();

const studentActivityMappings = {
  'Events Attended': {
    table: 'events_attended',
    alias: 'ea',
    columns: ['id', 'userid', 'event_name', 'description', 'event_type', 'type_of_event', 'other_event_type', 'institution_name', 'mode', 'city_i_d', 'district_i_d', 'state_i_d', 'from_date', 'to_date', 'team_size', 'team_members', 'participation_status', 'is_other_state_event', 'is_other_country_event', 'is_certificate_available', 'certificate_file', 'achievement_details', 'pending', 'tutor_approval_status', 'approved_by', 'approved_at', 'messages', 'created_by', 'updated_by', 'created_at', 'updated_at'],
    joinQuery: `
      SELECT ea.*, u.username as student_name, d.Deptacronym as department 
      FROM events_attended ea 
      JOIN users u ON ea.userid = u.Userid 
      JOIN department d ON u.Deptid = d.Deptid
    `
  },
  
  'Events Organized': {
    table: 'events_organized',
    alias: 'eo',
    columns: ['id', 'userid', 'event_name', 'club_name', 'role', 'staff_incharge', 'start_date', 'end_date', 'number_of_participants', 'mode', 'funding_agency', 'funding_amount', 'created_by', 'updated_by', 'pending', 'tutor_approval_status', 'approved_by', 'approved_at', 'messages', 'created_at', 'updated_at'],
    joinQuery: `
      SELECT eo.*, u.username as student_name, d.Deptacronym as department 
      FROM events_organized eo 
      JOIN users u ON eo.userid = u.Userid 
      JOIN department d ON u.Deptid = d.Deptid
    `
  },
  
  'Online Courses': {
    table: 'online_courses',
    alias: 'oc',
    columns: ['id', 'userid', 'course_name', 'type', 'other_type', 'provider_name', 'instructor_name', 'status', 'certificate_file', 'additional_info', 'pending', 'tutor_approval_status', 'approved_by', 'approved_at', 'messages', 'created_by', 'updated_by', 'created_at', 'updated_at'],
    joinQuery: `
      SELECT oc.*, u.username as student_name, d.Deptacronym as department 
      FROM online_courses oc 
      JOIN users u ON oc.userid = u.Userid 
      JOIN department d ON u.Deptid = d.Deptid
    `
  },
  
  'Achievements': {
    table: 'achievements',
    alias: 'a',
    columns: ['id', 'userid', 'title', 'description', 'date_awarded', 'certificate_file', 'created_by', 'updated_by', 'pending', 'tutor_approval_status', 'approved_by', 'approved_at', 'messages', 'created_at', 'updated_at'],
    joinQuery: `
      SELECT a.*, u.username as student_name, d.Deptacronym as department 
      FROM achievements a 
      JOIN users u ON a.userid = u.Userid 
      JOIN department d ON u.Deptid = d.Deptid
    `
  },
  
  'Internships': {
    table: 'internships',
    alias: 'i',
    columns: ['id', 'userid', 'description', 'provider_name', 'domain', 'mode', 'start_date', 'end_date', 'status', 'stipend_amount', 'certificate', 'created_by', 'updated_by', 'pending', 'tutor_approval_status', 'approved_by', 'approved_at', 'messages', 'created_at', 'updated_at'],
    joinQuery: `
      SELECT i.*, u.username as student_name, d.Deptacronym as department 
      FROM internships i 
      JOIN users u ON i.userid = u.Userid 
      JOIN department d ON u.Deptid = d.Deptid
    `
  },
  
  'Scholarships': {
    table: 'scholarships',
    alias: 's',
    columns: ['id', 'userid', 'name', 'provider', 'type', 'customType', 'year', 'status', 'appliedDate', 'receivedAmount', 'receivedDate', 'created_by', 'updated_by', 'pending', 'tutor_approval_status', 'approved_by', 'approved_at', 'messages', 'created_at', 'updated_at'],
    joinQuery: `
      SELECT s.*, u.username as student_name, d.Deptacronym as department 
      FROM scholarships s 
      JOIN users u ON s.userid = u.Userid 
      JOIN department d ON u.Deptid = d.Deptid
    `
  },
  
  'Student Details': {
    table: 'student_details',
    alias: 'sd',
    columns: ['id', 'userid', 'regno', 'batch', 'gender', 'dob', 'father_name', 'mother_name', 'address', 'city', 'district', 'state', 'pincode', 'phone', 'alternate_phone', 'blood_group', 'aadhar_number', 'pan_number', 'bank_account_number', 'bank_name', 'bank_branch', 'ifsc_code', 'created_by', 'updated_by', 'created_at', 'updated_at'],
    joinQuery: `
      SELECT sd.*, u.username as student_name, d.Deptacronym as department 
      FROM student_details sd 
      JOIN users u ON sd.userid = u.Userid 
      JOIN department d ON u.Deptid = d.Deptid
    `
  }
};

// Get all departments
router.get('/student-admin-panel/departments', async (req, res) => {
  try {
    const [departments] = await sequelize.query('SELECT * FROM department ORDER BY Deptname');
    res.json(departments);
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

// Get batches
router.get('/student-admin-panel/batches', async (req, res) => {
  try {
    const [batches] = await sequelize.query(`
      SELECT DISTINCT batch 
      FROM student_details 
      WHERE batch IS NOT NULL
      ORDER BY batch DESC
    `);
    res.json(batches);
  } catch (error) {
    console.error('Error fetching batches:', error);
    res.status(500).json({ error: 'Failed to fetch batches' });
  }
});

// Get roll numbers by batch
router.get('/student-admin-panel/roll-numbers/:batch', async (req, res) => {
  try {
    const { batch } = req.params;
    const [rollNumbers] = await sequelize.query(`
      SELECT regno 
      FROM student_details 
      WHERE batch = ? AND regno IS NOT NULL
      ORDER BY regno
    `, {
      replacements: [batch]
    });
    res.json(rollNumbers);
  } catch (error) {
    console.error('Error fetching roll numbers:', error);
    res.status(500).json({ error: 'Failed to fetch roll numbers' });
  }
});

// Get student data with their activities
router.get('/student-admin-panel/students-with-activities', async (req, res) => {
  try {
    // Get all student users
    const [students] = await sequelize.query(`
      SELECT u.Userid, u.username, u.email, u.staffId as studentId, u.Deptid, u.image,
             d.Deptacronym as department
      FROM users u 
      LEFT JOIN department d ON u.Deptid = d.Deptid
      WHERE u.role = 'Student' 
      ORDER BY u.username
    `);

    console.log(`Found ${students ? students.length : 0} students`);

    // Ensure students is an array
    const studentsArray = Array.isArray(students) ? students : [];

    // For each student, get their activities
    const studentsWithActivities = await Promise.all(
      studentsArray.map(async (student) => {
        const activities = [];
        
        // Check each activity table for this user
        for (const [activityName, mapping] of Object.entries(studentActivityMappings)) {
          try {
            // Ensure mapping has required properties
            if (!mapping.table) {
              console.warn(`Activity ${activityName} missing table property`);
              continue;
            }

            const [activityRows] = await sequelize.query(
              `SELECT COUNT(*) as count FROM ${mapping.table} WHERE userid = ?`,
              {
                replacements: [student.Userid]
              }
            );
            
            if (activityRows && activityRows[0] && activityRows[0].count > 0) {
              activities.push(activityName);
            }
          } catch (activityError) {
            console.error(`Error checking ${activityName} for user ${student.Userid}:`, activityError);
          }
        }
        
        return {
          ...student,
          activities
        };
      })
    );

    console.log(`Processed ${studentsWithActivities.length} students with activities`);
    res.json(studentsWithActivities);
  } catch (error) {
    console.error('Error fetching students with activities:', error);
    res.status(500).json({ error: 'Failed to fetch student data' });
  }
});

// Get activity-specific data for students
router.get('/student-admin-panel/activity-data/:tableName', async (req, res) => {
  try {
    const { tableName } = req.params;
    const { departmentId, studentName } = req.query;

    console.log('Request params:', { tableName, departmentId, studentName });

    // Find the activity mapping
    const activityMapping = Object.values(studentActivityMappings).find(mapping => mapping.table === tableName);
    
    if (!activityMapping) {
      console.error('Invalid activity table:', tableName);
      return res.status(400).json({ error: 'Invalid activity table' });
    }

    console.log('Activity mapping found:', activityMapping);

    // Validate that required properties exist
    if (!activityMapping.joinQuery || !activityMapping.columns || !activityMapping.alias) {
      console.error('Invalid activity mapping structure:', activityMapping);
      return res.status(500).json({ 
        error: 'Invalid activity mapping configuration',
        details: 'Missing required properties in activity mapping'
      });
    }

    let query = activityMapping.joinQuery.trim();
    const queryParams = [];
    
    // Add filters
    const conditions = [];
    
    if (departmentId && departmentId !== 'null' && departmentId !== '') {
      conditions.push('u.Deptid = ?');
      queryParams.push(departmentId);
    }
    
    if (studentName && studentName.trim() !== '') {
      conditions.push('u.username LIKE ?');
      queryParams.push(`%${studentName.trim()}%`);
    }
    
    if (conditions.length > 0) {
      // Check if WHERE clause already exists in the query
      if (query.toLowerCase().includes('where')) {
        query += ` AND ${conditions.join(' AND ')}`;
      } else {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }
    }
    
    // Add ordering - use the alias for ordering
    query += ` ORDER BY ${activityMapping.alias}.created_at DESC`;
    
    console.log('Final query:', query);
    console.log('Query params:', queryParams);
    
    const [rows] = await sequelize.query(query, {
      replacements: queryParams
    });
    
    // Ensure columns is an array
    const baseColumns = Array.isArray(activityMapping.columns) ? activityMapping.columns : [];
    const columns = [...baseColumns, 'student_name', 'department'];
    
    console.log(`Found ${rows ? rows.length : 0} rows for ${tableName}`);
    console.log('Columns:', columns);
    
    res.json({
      data: rows || [],
      columns: columns
    });
  } catch (error) {
    console.error('Error fetching student activity data:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      sql: error.sql
    });
    res.status(500).json({ 
      error: 'Failed to fetch student activity data',
      details: error.message 
    });
  }
});

// Get all students for dropdown
router.get('/student-admin-panel/students', async (req, res) => {
  try {
    const [students] = await sequelize.query(`
      SELECT u.Userid, u.username, u.email, u.staffId as studentId, d.Deptname as department
      FROM users u 
      LEFT JOIN department d ON u.Deptid = d.Deptid
      WHERE u.role = 'Student' 
      ORDER BY u.username
    `);
    res.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// Get activity fields for a specific activity
router.get('/student-admin-panel/activity-fields/:activityName', async (req, res) => {
  try {
    const { activityName } = req.params;
    
    const activityMapping = studentActivityMappings[activityName];
    if (!activityMapping) {
      return res.status(400).json({ error: 'Invalid activity name' });
    }
    
    // Return relevant fields for filtering (exclude system fields)
    const excludeFields = ['id', 'userid', 'created_by', 'updated_by', 'created_at', 'updated_at', 'pending', 'tutor_approval_status', 'approved_by', 'approved_at', 'messages'];
    const fields = activityMapping.columns.filter(col => !excludeFields.includes(col));
    
    res.json(fields);
  } catch (error) {
    console.error('Error fetching activity fields:', error);
    res.status(500).json({ error: 'Failed to fetch activity fields' });
  }
});

// Export student data to Excel
router.post('/student-admin-panel/export-excel', async (req, res) => {
  try {
    const { viewMode, filters, data, columns } = req.body;
    
    // Validate required data
    if (!data || !Array.isArray(data)) {
      return res.status(400).json({ error: 'Invalid data provided for export' });
    }
    
    // Create a new workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Student Data Export');
    
    if (viewMode === 'student') {
      // Student view export
      const studentColumns = [
        { header: 'Student ID', key: 'studentId', width: 15 },
        { header: 'Name', key: 'username', width: 25 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Department', key: 'department', width: 20 },
        { header: 'Activities', key: 'activities', width: 50 }
      ];
      
      worksheet.columns = studentColumns;
      
      // Add header styling
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
      };
      
      // Add data rows
      data.forEach(student => {
        worksheet.addRow({
          studentId: student.studentId || 'N/A',
          username: student.username || 'Unknown',
          email: student.email || 'Unknown',
          department: student.department || 'N/A',
          activities: student.activities ? student.activities.join(', ') : 'None'
        });
      });
      
    } else {
      // Activity view export
      if (!columns || !Array.isArray(columns) || columns.length === 0) {
        return res.status(400).json({ error: 'No columns provided for activity export' });
      }
      
      // Create columns for worksheet
      const excelColumns = columns.map(col => ({
        header: col.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        key: col,
        width: 20
      }));
      
      worksheet.columns = excelColumns;
      
      // Add header styling
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
      };
      
      // Add data rows
      data.forEach(item => {
        const row = {};
        columns.forEach(col => {
          // Format dates and handle special cases
          let value = item[col];
          if (value && typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
            // Format date fields
            try {
              value = new Date(value).toLocaleDateString();
            } catch (e) {
              // If date parsing fails, keep original value
              console.warn('Date parsing failed for value:', value);
            }
          } else if (value === null || value === undefined) {
            value = 'N/A';
          }
          row[col] = value;
        });
        worksheet.addRow(row);
      });
    }
    
    // Auto-fit columns
    worksheet.columns.forEach(column => {
      if (column.width < 10) column.width = 10;
      if (column.width > 50) column.width = 50;
    });
    
    // Set response headers
    const filename = `student_activities_export_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    
    // Write to response
    await workbook.xlsx.write(res);
    res.end();
    
  } catch (error) {
    console.error('Error exporting student data to Excel:', error);
    res.status(500).json({ 
      error: 'Failed to export student data',
      details: error.message
    });
  }
});

// Get student activity statistics
router.get('/student-admin-panel/statistics', async (req, res) => {
  try {
    const stats = {};
    
    // Get total counts for each activity
    for (const [activityName, mapping] of Object.entries(studentActivityMappings)) {
      try {
        if (!mapping.table) {
          console.warn(`Activity ${activityName} missing table property`);
          stats[activityName] = 0;
          continue;
        }
        
        const [result] = await sequelize.query(
          `SELECT COUNT(*) as count FROM ${mapping.table}`,
          { type: sequelize.QueryTypes.SELECT }
        );
        stats[activityName] = result && result[0] ? result[0].count : 0;
      } catch (error) {
        console.error(`Error getting stats for ${activityName}:`, error);
        stats[activityName] = 0;
      }
    }
    
    // Get total students
    const [studentCount] = await sequelize.query(
      `SELECT COUNT(*) as count FROM users WHERE role = 'Student'`,
      { type: sequelize.QueryTypes.SELECT }
    );
    
    stats.totalStudents = studentCount && studentCount[0] ? studentCount[0].count : 0;
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching student statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

export default router;