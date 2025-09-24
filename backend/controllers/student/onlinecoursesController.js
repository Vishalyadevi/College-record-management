import { OnlineCourses, User, StudentDetails } from "../../models/index.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { sendEmail } from "../../utils/emailService.js"; // Import your email service utility

// Multer configuration for file uploads (certificates)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "uploads/certificates/";
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, "certificate-" + uniqueSuffix + ext);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "application/pdf", // PDF files
    "image/jpeg", // JPEG files
    "image/png", // PNG files
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("❌ Invalid file type! Allowed formats: PNG, JPG, PDF"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Add Online Course
export const addOnlineCourse = async (req, res) => {
  try {
    const {
      course_name,
      type,
      other_type,
      provider_name,
      instructor_name,
      status,
      additional_info,
    } = req.body;
    const certificate_file = req.file ? req.file.filename : null;

    if (!req.user.Userid) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const user = await User.findByPk(req.user.Userid);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Fetch student details to get tutorEmail
    const student = await StudentDetails.findOne({ where: { Userid: req.user.Userid } });
    if (!student || !student.tutorEmail) {
      return res.status(404).json({ message: "Tutor email not found" });
    }

    const newCourse = await OnlineCourses.create({
      Userid: req.user.Userid,
      course_name,
      type,
      other_type: type === "Other" ? other_type : null,
      provider_name,
      instructor_name,
      status,
      certificate_file: status === "Completed" ? certificate_file : null,
      additional_info,
      Created_by: req.user.Userid,
      Updated_by: req.user.Userid,
    });

    // Send email notification to the tutor
    await sendEmail({
      from: user.email, // Sender's email
      to: student.tutorEmail, // Tutor's email
      subject: "New Online Course Added",
      text: `Dear Tutor,

A new online course has been added by ${user.username || "a student"}.

- **Course Name**: ${course_name}
- **Type**: ${type}
- **Provider**: ${provider_name}
- **Status**: ${status}
- **Certificate**: ${certificate_file ? "Attached" : "Not provided"}

Please review the course details.

Best Regards,
Online Courses Management System`,
    });

    res.status(201).json({ message: "Online course added successfully.", newCourse });
  } catch (error) {
    console.error("❌ Error adding online course:", error);
    res.status(500).json({ message: "Error adding online course", error });
  }
};

// Update Online Course
export const updateOnlineCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const {
      course_name,
      type,
      other_type,
      provider_name,
      instructor_name,
      status,
      additional_info,
    } = req.body;
    const certificate_file = req.file ? req.file.filename : null;

    const course = await OnlineCourses.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Fetch student details to get tutorEmail
    const student = await StudentDetails.findOne({ where: { Userid: course.Userid } });
    if (!student || !student.tutorEmail) {
      return res.status(404).json({ message: "Tutor email not found" });
    }

    // Delete old certificate file if a new one is uploaded
    if (certificate_file && course.certificate_file) {
      const oldFilePath = path.join("uploads/certificates/", course.certificate_file);
      fs.unlink(oldFilePath, (err) => {
        if (err) console.error("Error deleting old certificate:", err);
      });
    }

    // Update course details
    course.course_name = course_name || course.course_name;
    course.type = type || course.type;
    course.other_type = type === "Other" ? other_type : null;
    course.provider_name = provider_name || course.provider_name;
    course.instructor_name = instructor_name || course.instructor_name;
    course.status = status || course.status;
    course.certificate_file = status === "Completed" ? certificate_file || course.certificate_file : null;
    course.additional_info = additional_info || course.additional_info;
    course.Updated_by = req.user.Userid;

    await course.save();

    // Fetch user details to send email
    const user = await User.findByPk(course.Userid);
    if (user) {
      await sendEmail({
        from: user.email, // Sender's email
        to: student.tutorEmail, // Tutor's email
        subject: "Online Course Updated",
        text: `Dear Tutor,

An online course has been updated by ${user.username || "a student"}.

- **Course Name**: ${course.course_name}
- **Type**: ${course.type}
- **Provider**: ${course.provider_name}
- **Status**: ${course.status}
- **Certificate**: ${course.certificate_file ? "Attached" : "Not provided"}

Please review the updated course details.

Best Regards,
Online Courses Management System`,
      });
    }

    res.status(200).json({ message: "Course updated successfully.", course });
  } catch (error) {
    console.error("❌ Error updating course:", error);
    res.status(500).json({ message: "Error updating course", error });
  }
};

// Delete Online Course
export const deleteOnlineCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await OnlineCourses.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Fetch student details to get tutorEmail
    const student = await StudentDetails.findOne({ where: { Userid: course.Userid } });
    if (!student || !student.tutorEmail) {
      return res.status(404).json({ message: "Tutor email not found" });
    }

    // Fetch user details to send email
    const user = await User.findByPk(course.Userid);
    if (user) {
      await sendEmail({
        from: user.email, // Sender's email
        to: student.tutorEmail, // Tutor's email
        subject: "Online Course Deleted",
        text: `Dear Tutor,

An online course has been deleted by ${user.username || "a student"}.

- **Course Name**: ${course.course_name}
- **Type**: ${course.type}
- **Provider**: ${course.provider_name}

If this was a mistake, please contact support.

Best Regards,
Online Courses Management System`,
      });
    }

    // Delete certificate file if it exists
    if (course.certificate_file) {
      const filePath = path.join("uploads/certificates/", course.certificate_file);
      fs.unlink(filePath, (err) => {
        if (err) console.error("Error deleting certificate file:", err);
      });
    }

    await course.destroy();
    res.status(200).json({ message: "Course deleted successfully." });
  } catch (error) {
    console.error("❌ Error deleting course:", error);
    res.status(500).json({ message: "Error deleting course", error });
  }
};

// Get Pending Online Courses
export const getPendingOnlineCourses = async (req, res) => {
  try {
    const pendingCourses = await OnlineCourses.findAll({
      where: { pending: true }, // Fetch only pending courses
      include: [
        {
          model: User,
          as: "student", // Student who enrolled in the course
          attributes: ["Userid", "username", "email"],
          include: [
            {
              model: StudentDetails,
              as: "studentDetails",
              attributes: ["regno", "staffId"],
            },
          ],
        },
      ],
    });

    // Format response to include relevant course details along with student info
    const formattedCourses = pendingCourses.map((course) => {
      const { student, ...rest } = course.get({ plain: true });

      return {
        ...rest,
        username: student?.username || "N/A",
        email: student?.email || "N/A",
        regno: student?.studentDetails?.regno || "N/A",
        staffId: student?.studentDetails?.staffId || "N/A",
      };
    });

    res.status(200).json({ success: true, courses: formattedCourses });
  } catch (error) {
    console.error("Error fetching pending online courses:", error);
    res.status(500).json({ success: false, message: "Error fetching pending online courses" });
  }
};


// Get Approved Online Courses
export const getApprovedCourses = async (req, res) => {
  try {
    const approvedCourses = await OnlineCourses.findAll({
      where: { pending: false },
      include: [
        {
          model: User,
          as: "student",
          attributes: ["Userid", "username", "email"],
        },
      ],
    });

    res.status(200).json({ success: true, courses: approvedCourses });
  } catch (error) {
    console.error("Error fetching approved courses:", error);
    res.status(500).json({ success: false, message: "Error fetching approved courses" });
  }
};