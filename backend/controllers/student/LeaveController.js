import { User, StudentDetails, StudentLeave } from "../../models/index.js";
import { sendEmail } from "../../utils/emailService.js";
import multer from "multer";
import path from "path";
import fs from "fs";

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "uploads/leaves/";
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true }); // Ensure directory exists
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

// File filter to allow only specific file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "application/pdf", // PDF files
    "application/msword", // DOC files
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // DOCX files
    "image/jpeg", // JPEG files
    "image/png", // PNG files
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true); // Accept the file
  } else {
    cb(new Error("❌ Invalid file type! Allowed formats: PNG, JPG, PDF, DOC, DOCX"), false);
  }
};

// Initialize multer with size limit (5MB)
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Add Leave Request
export const addLeave = async (req, res) => {
  try {
    const { leave_type, start_date, end_date, reason } = req.body;
    const document = req.file ? req.file.filename : null;
    console.log(req.user,req.body);

    if (!req.user.Userid) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const user = await User.findByPk(req.user.Userid);
    if (!user || !user.email) {
      return res.status(404).json({ message: "Student email not found" });
    }

    const student = await StudentDetails.findOne({ where: { Userid: req.user.Userid } });
    if (!student || !student.tutorEmail) {
      return res.status(404).json({ message: "Tutor email not found" });
    }

    const leaveRequest = await StudentLeave.create({
      Userid: req.user.Userid, // Changed from user_id to Userid
      leave_type,
      start_date,
      end_date,
      reason,
      document,
      leave_status: "pending",
      tutor_approval_status: false,
      created_by: user.Userid,
      updated_by: user.Userid,
    });

    await sendEmail({
      from: user.email,
      to: student.tutorEmail,
      subject: "New Leave Request Pending Approval",
      text: `Dear Tutor,\n\nA student has submitted a new leave request.\n\nStudent Name: ${user.username}\nLeave Type: ${leave_type}\nStart Date: ${start_date}\nEnd Date: ${end_date}\nReason: ${reason}\nDocument: ${document ? "Yes" : "No"}\n\nBest Regards,\nLeave Management System`,
    });

    res.status(201).json({ message: "Leave request submitted.", leaveRequest });
  } catch (error) {
    console.error("❌ Error adding leave request:", error);
    res.status(500).json({ message: "Error adding leave request", error });
  }
};

// Update Leave Request
export const updateLeave = async (req, res) => {
  try {
    const { leaveId } = req.params;
    const { leave_type, start_date, end_date, reason, leave_status, tutor_approval_status } = req.body;
    const document = req.file ? req.file.filename : null;

    let leaveRequest = await StudentLeave.findByPk(leaveId);
    if (!leaveRequest) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    if (leave_status === "completed" && !document && !leaveRequest.document) {
      return res.status(400).json({ message: "Document is required for completed leave requests" });
    }

    if (document && leaveRequest.document) {
      const oldDocumentPath = path.join("uploads/leaves/", leaveRequest.document);
      fs.unlink(oldDocumentPath, (err) => {
        if (err) console.error("Error deleting old document:", err);
      });
    }

    const isApprovalStatusChangedToFalse =
      tutor_approval_status !== undefined && tutor_approval_status === false && leaveRequest.tutor_approval_status !== false;

    leaveRequest.leave_type = leave_type || leaveRequest.leave_type;
    leaveRequest.start_date = start_date || leaveRequest.start_date;
    leaveRequest.end_date = end_date || leaveRequest.end_date;
    leaveRequest.reason = reason || leaveRequest.reason;
    leaveRequest.document = document || leaveRequest.document;
    leaveRequest.leave_status = leave_status || leaveRequest.leave_status;
    leaveRequest.tutor_approval_status = tutor_approval_status !== undefined ? tutor_approval_status : leaveRequest.tutor_approval_status;
    leaveRequest.updated_by = req.user.Userid;

    await leaveRequest.save();

    if (isApprovalStatusChangedToFalse) {
      const user = await User.findByPk(leaveRequest.Userid); // Changed from user_id to Userid
      const student = await StudentDetails.findOne({ where: { Userid: leaveRequest.Userid } }); // Changed from user_id to Userid

      if (user && student && student.tutorEmail) {
        await sendEmail({
          from: user.email,
          to: student.tutorEmail,
          subject: "Leave Request Requires Re-Approval",
          text: `Dear Tutor,\n\nA leave request has been updated and requires your re-approval.\n\nStudent Name: ${user.username}\nLeave Type: ${leaveRequest.leave_type}\nStart Date: ${leaveRequest.start_date}\nEnd Date: ${leaveRequest.end_date}\nReason: ${leaveRequest.reason}\nDocument: ${leaveRequest.document ? "Yes" : "No"}\n\nBest Regards,\nLeave Management System`,
        });
      }
    }

    res.status(200).json({ message: "Leave request updated successfully.", leaveRequest });
  } catch (error) {
    console.error("❌ Error updating leave request:", error);
    res.status(500).json({ message: "Error updating leave request", error });
  }
};
// Get Pending Leaves
export const getPendingLeaves = async (req, res) => {

  try {
    const pendingLeaves = await StudentLeave.findAll({
      where: { leave_status: "pending" },
      include: [
        {
          model: User,
          as: "LeaveUser",
          attributes: ["Userid", "username", "email"],
          include: [
            {
              model: StudentDetails,
              as: "studentDetails",
              attributes: ["regno","staffId"],
            },
          ],
        },
      ],
    });

    // Format the response
    const formattedLeaves = pendingLeaves.map((leave) => {
      const { LeaveUser, ...rest } = leave.get({ plain: true });
      return {
        ...rest,
        username: LeaveUser?.username || "N/A",
        regno: LeaveUser?.studentDetails?.regno || "N/A",
        staffId: LeaveUser?.studentDetails?.staffId || "N/A",
      };
    });

    res.status(200).json({ success: true, leaves: formattedLeaves });
  } catch (error) {
    console.error("Error fetching pending leaves:", error);
    res.status(500).json({ success: false, message: "Error fetching pending leaves" });
  }
};

// Get Approved Leaves
export const getApprovedLeaves = async (req, res) => {
  try {
    const approvedLeaves = await StudentLeave.findAll({
      where: { tutor_approval_status: true },
      order: [["approved_at", "DESC"]],
    });

    return res.status(200).json(approvedLeaves);
  } catch (error) {
    console.error("Error fetching approved leaves:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Delete Leave Request
export const deleteLeave = async (req, res) => {
  try {
    const { leaveId } = req.params;

    const leaveRequest = await StudentLeave.findByPk(leaveId);
    if (!leaveRequest) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    const student = await StudentDetails.findOne({ where: { Userid: leaveRequest.Userid } }); // Changed from user_id to Userid
    const user = await User.findByPk(leaveRequest.Userid); // Changed from user_id to Userid

    if (!user || !student) {
      return res.status(404).json({ message: "User or student details not found" });
    }

    await StudentLeave.destroy({ where: { id: leaveId } });

    sendEmail({
      to: user.email,
      subject: "Leave Request Deleted Notification",
      text: `Dear ${user.username || "Student"},

Your leave request has been removed.

- **Leave Type**: ${leaveRequest.leave_type}  
- **Start Date**: ${leaveRequest.start_date}  
- **End Date**: ${leaveRequest.end_date}  
- **Reason**: ${leaveRequest.reason}  

If this was an error, contact **tutorsjf@gmail.com**.

Best,  
Leave Management System`,
    });

    sendEmail({
      to: student.tutorEmail,
      subject: "Leave Request Deleted Notification",
      text: `Dear Tutor,

The following leave request submitted by your student has been deleted:

- **Student Regno**: ${student.regno}  
- **Student Name**: ${user.username || "N/A"}  
- **Leave Type**: ${leaveRequest.leave_type}  
- **Start Date**: ${leaveRequest.start_date}  
- **End Date**: ${leaveRequest.end_date}  
- **Reason**: ${leaveRequest.reason}  

If you need further details, contact **tutorsjf@gmail.com**.

Best,  
Leave Management System`,
    });

    res.status(200).json({ message: "Leave request deleted successfully." });
  } catch (error) {
    console.error("❌ Error deleting leave request:", error);
    res.status(500).json({ message: "Error deleting leave request", error });
  }
};