import { Op, Sequelize } from "sequelize"; 
import { sequelize } from "../../config/mysql.js";
import { User, StudentDetails, Department } from "../../models/index.js";
import ExcelJS from "exceljs";
import bcrypt from "bcrypt";
import  DownloadHistory  from "../../models/DownloadHistory.js";

export const exportData = async (req, res) => {
  const admin = await User.findOne({
    where: { role: 'Admin' },
    attributes: ['Userid'],
  });
  
  const adminId = admin?.Userid; 
  
  //console.log(adminId);
  
  const { role, filters, type } = req.body;
 

  try {
    let query = {}; // Define query object

    if (filters) {
      if (filters.username?.trim()) {
        query.username = { [Op.like]: `%${filters.username.trim()}%` };
      }
     
      if (filters.staffId?.trim()) {
        query.staffId = filters.staffId.trim();
      }
      if (filters.regno?.trim()) {
        query.regno = filters.regno.trim();
      }
      if (filters.batch?.trim()) {
        query.batch = filters.batch.trim();
      }
      if (filters.tutorEmail?.trim()) {
        query.tutorEmail = filters.tutorEmail.trim();
      }
    }

    let data, formattedData, worksheetName, columns;

    if (role === "staff") {
      if (filters?.Deptid?.trim()) {
        query["$Department.Deptacronym$"] = filters.Deptid.trim();
      }
      data = await User.findAll({
        where: { ...query, role: 'Staff' },
        attributes: ["username", "email", "staffId", "Deptid"],
        include: [
          {
            model: Department,
            attributes: ["Deptacronym"],
            required: false,
          },
          {
            model: StudentDetails,
            as: "staffStudents", // Ensure alias matches the association
            attributes: ["regno"],
            required: false, // Keep it false to get staff even if they have no students
          },
        ],
      });
      // Format staff data
      formattedData = data.map((entry) => {
        const studentRegNos = entry.staffStudents
          ? entry.staffStudents.map((s) => s.regno).join(", ")
          : "N/A";
        return {
          username: entry.username,
          email: entry.email,
          staffId: entry.staffId,
          DeptAcronym: entry.Department?.Deptacronym || "N/A",
          StudentCount: entry.staffStudents ? entry.staffStudents.length : 0,
          StudentRegNos: studentRegNos,
        };
      });

      worksheetName = "Staff Data";
      columns = [
        { header: "Username", key: "username", width: 20 },
        { header: "Email", key: "email", width: 25 },
        { header: "Staff ID", key: "staffId", width: 15 },
        { header: "Department Acronym", key: "DeptAcronym", width: 20 },
        { header: "Student Count", key: "StudentCount", width: 15 },
        { header: "Student Reg Nos", key: "StudentRegNos", width: 30 },
      ];
    } else if (role === "student") {
      if (filters?.Deptid?.trim()) {
        query["$Department.Deptacronym$"] = filters.Deptid.trim();
      }
      data = await StudentDetails.findAll({
        where: query,
        attributes: ["regno", "batch", "Deptid"],
        include: [
          {
            model: Department,
            attributes: ["Deptacronym"],
            required: false,
          },
          {
            model: User,
            as: "studentUser", // Alias for student's username
            attributes: ["username"],
            required: true,
          },
          {
            model: User,
            as: "staffAdvisor", // Alias for tutor's name
            attributes: ["username"],
            required: false,
          },
        ],
      });
    
      // Format student data
      formattedData = data.map((entry) => ({
        regno: entry.regno,
        username: entry.studentUser?.username || "N/A", // Fetch student username
        batch: entry.batch,
        DeptAcronym: entry.Department?.Deptacronym || "N/A",
        tutorName: entry.staffAdvisor?.username || "N/A", // Fetch tutor name
      }));
    

      worksheetName = "Student Data";
      columns = [
        { header: "Reg No", key: "regno", width: 15 },
        { header: "Username", key: "username", width: 20 },
        { header: "Batch", key: "batch", width: 15 },
        { header: "Department Acronym", key: "DeptAcronym", width: 20 },
        { header: "Tutor Name", key: "tutorName", width: 25 },
      ];
    } else {
      return res.status(400).json({ message: "Invalid role specified" });
    }

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(worksheetName);
    worksheet.columns = columns;

    // Add data rows
    formattedData.forEach((entry) => worksheet.addRow(entry));

    // Calculate total records
    const total_records = formattedData.length;

    // Generate Excel file and calculate file size
    const buffer = await workbook.xlsx.writeBuffer();
    const file_size = buffer.byteLength / 1024; 

    // Log download history
    await DownloadHistory.create({
      Userid: adminId,
      filename: `${role}_data.xlsx`,
      role,
      download_type: type,  // File type (e.g., Excel, CSV, etc.)
      file_size,            // File size in KB
      total_records,        // Number of records exported
    });

    // Set response headers for file download
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${worksheetName.toLowerCase().replace(" ", "_")}.xlsx`
    );

    // Stream the Excel file to the response
    res.end(Buffer.from(buffer));
  } catch (error) {
    console.error("Error exporting data:", error);
    res.status(500).json({ message: "Error exporting data", error: error.message });
  }
};

export const addUser = async (req, res) => {
  const {
    username,
    email,
    password,
    role,
    staffId, // Staff's own ID (for Staff role)
    TutorId, // Tutor's ID (for Student role)
    Deptid,
    regno, // Student-specific
    year, // Student-specific
    course, // Student-specific
    batch, // Student-specific
  } = req.body;

  // Validate required fields
  if (!username || !email || !password || !role || !Deptid) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  // Role-specific validations
  if (role === "Staff" && !staffId) {
    return res.status(400).json({ message: "Missing required fields for Staff" });
  }

  if (role === "Student" && (!regno || !year || !course || !batch || !TutorId)) {
    return res.status(400).json({ message: "Missing required fields for Student" });
  }

  // Check if the user is authenticated
  if (!req.user || !req.user.Userid) {
    return res.status(401).json({ message: "Unauthorized: User not authenticated" });
  }

  const createdBy = req.user.Userid;

  try {
    // Check if the email already exists in the database
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // For Staff role, check if the staffId already exists
    if (role === "Staff") {
      const existingStaff = await User.findOne({ where: { staffId } });
      if (existingStaff) {
        return res.status(400).json({ message: "Staff ID already exists" });
      }
    }

    // For Student role, validate that the TutorId corresponds to an existing staff member
    if (role === "Student") {
      const tutor = await User.findOne({ where: { staffId: TutorId, role: "Staff" } });
  
      if (!tutor) {
        return res.status(404).json({ message: "Tutor (staff) not found" });
      }
    }

    // Hash the password before saving to the database
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new User record
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      role,
      Deptid,
      staffId: role === "Staff" ? staffId : null, // Only set staffId for Staff role
      Created_by: createdBy,
      Updated_by: createdBy,
    });


    if (role === "Student") {
    
      const tutor = await User.findOne({ 
        where: { staffId: TutorId, role: "Staff" }, 
        attributes: ['Userid','email'] 
      });
           
      
if (!tutor) {
  return res.status(404).json({ message: "Tutor (staff) not found" });
}
      // Create a new StudentDetails record
      await StudentDetails.create({
        Userid: newUser.Userid,
        regno,
        year,
        course,
        Deptid,
        batch,
        staffId: tutor.Userid, // Store the tutor's staffId
        tutorEmail: tutor.email, // Store the tutor's email
        Created_by: createdBy,
        Updated_by: createdBy,
      });
    }

    // Send a success response
    res.status(201).json({
      message: "User added successfully",
      Userid: newUser.Userid,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
    });
  } catch (error) {
    console.error("❌ Error adding user:", error);

    // Send an error response
    res.status(500).json({
      message: "Error adding user",
      error: error.message || "Something went wrong",
    });
  }
};
export const getStaff = async (req, res) => {
  try {
    const role = req.query.role;

    if (!role) {
      return res.status(400).json({ success: false, message: 'Role is required' });
    }

    // Fetch users with the specified role
    const users = await User.findAll({
      where: { role },
      attributes: ['Userid', 'username', 'email', 'staffId'], 
      raw: true,
    });

    if (!users.length) {
      return res.status(200).json({ success: true, staff: [], message: 'No staff members found for the specified role' });
    }

    const staffList = users.map(user => ({
      id: user.staffId, // Use staffId as the ID
      name: user.username,
      email: user.email,
    }));

    res.status(200).json({ success: true, staff: staffList });
  } catch (error) {
    console.error('❌ Error fetching staff members:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching staff members',
      error: error.message,
    });
  }
};
export const getStudentDetails = async (req, res) => {
  try {
    const students = await StudentDetails.findAll({
      include: [
        {
          model: User,
          as: "studentUser", // Fetch user details of the student
          attributes: ["username", "image", "email"],
        },
        {
          model: User,
          as: "staffAdvisor", // Fetch staff details using staffId (which is actually Userid of staff)
          attributes: ["Userid", "staffId","username"],
        },
      ],
    });
  //  console.log(students)

    const studentData = students.map(student => ({
      id: student.id,
      Userid: student.Userid,
      tutorName: student.staffAdvisor ? student.staffAdvisor.username : "Unknown",
      tutorEmail: student.tutorEmail,
      course: student.course,
      Deptid: student.Deptid,
      batch: student.batch,
      regno: student.regno,
      assignedStaffUserid: student.staffId, 
      staffId: student.staffAdvisor ? student.staffAdvisor.staffId : "Unknown", 
      username: student.studentUser ? student.studentUser.username : "Unknown",
      email: student.studentUser ? student.studentUser.email : "Unknown",
      image: student.studentUser ? student.studentUser.image : "default.png",
    }));
  

    res.status(200).json(studentData);
  } catch (error) {
    console.error("Error fetching student details:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getStaffDetails = async (req, res) => {
  try {
    const staffs = await User.findAll({
      where: { role: "Staff" },
      attributes: ["Userid", "username", "image", "staffId", "Deptid","email"],
    });

    const staffData = staffs.map(staff => ({
      id: staff.staffId,
      Userid: staff.Userid,
      email:staff.email,
      Deptid: staff.Deptid,
      staffId: staff.staffId,
      username: staff.username,
      image: staff.image || "default.png",
    }));

    res.status(200).json(staffData);
  } catch (error) {
    console.error("Error fetching staff details:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


export const getDepartments = async (req, res) => {
  
  try {
    const departments = await Department.findAll(); 

    res.status(200).json(departments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching departments', error });
  }
};