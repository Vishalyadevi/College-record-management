import { User, StudentDetails, StudentLeave } from "../../models/index.js";
import { sendEmail } from "../../utils/emailService.js";
import { Op } from "sequelize";
import path from "path";
import fs from "fs";

// Calculate number of days between two dates
const calculateDays = (start_date, end_date) => {
  const start = new Date(start_date);
  const end = new Date(end_date);
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
};

// ==================== STUDENT ENDPOINTS ====================

// Add Leave Request (Student)
export const addLeave = async (req, res) => {
  try {
    const { leave_type, start_date, end_date, reason } = req.body;
    const document = req.file ? req.file.filename : null;

    if (!req.user.Userid) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const user = await User.findByPk(req.user.Userid);
    if (!user || !user.email) {
      return res.status(404).json({ message: "Student email not found" });
    }

    const student = await StudentDetails.findOne({ where: { Userid: req.user.Userid } });
    if (!student) {
      return res.status(404).json({ message: "Student details not found" });
    }

    // Calculate days and check if dept admin approval is required
    const days = calculateDays(start_date, end_date);
    const requiresDeptApproval = days > 3;

    // Validate document for leaves > 5 days
    if (days > 5 && !document) {
      return res.status(400).json({ message: "Document is required for leaves longer than 5 days" });
    }

    const leaveRequest = await StudentLeave.create({
      Userid: req.user.Userid,
      leave_type,
      start_date,
      end_date,
      reason,
      document,
      leave_status: "pending",
      tutor_approval_status: false,
      requires_dept_approval: requiresDeptApproval,
      dept_admin_approval_status: false,
      created_by: user.Userid,
      updated_by: user.Userid,
    });

    // Send email to tutor if tutor email exists
    if (student.tutorEmail) {
      await sendEmail({
        from: user.email,
        to: student.tutorEmail,
        subject: "New Leave Request Pending Approval",
        text: `Dear Tutor,

A student has submitted a new leave request.

Student Name: ${user.username}
Student Regno: ${student.regno || 'N/A'}
Department: ${student.department || 'N/A'}
Leave Type: ${leave_type}
Start Date: ${start_date}
End Date: ${end_date}
Total Days: ${days}
Reason: ${reason}
${requiresDeptApproval ? '\n⚠️ This leave requires Department Admin approval (more than 3 days).\n' : ''}
Document: ${document ? "Yes" : "No"}

Best Regards,
Leave Management System`,
      });
    }

    res.status(201).json({ 
      success: true,
      message: requiresDeptApproval 
        ? "Leave request submitted. Requires department admin approval (more than 3 days)." 
        : "Leave request submitted successfully.",
      leaveRequest 
    });
  } catch (error) {
    console.error("❌ Error adding leave request:", error);
    res.status(500).json({ success: false, message: "Error adding leave request", error: error.message });
  }
};

// Update Leave Request (Student)
export const updateLeave = async (req, res) => {
  try {
    const { leaveId } = req.params;
    const { leave_type, start_date, end_date, reason } = req.body;
    const document = req.file ? req.file.filename : null;

    let leaveRequest = await StudentLeave.findByPk(leaveId);
    if (!leaveRequest) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    // Only allow student to edit their own pending leaves
    if (leaveRequest.Userid !== req.user.Userid) {
      return res.status(403).json({ message: "Unauthorized to edit this leave request" });
    }

    if (leaveRequest.leave_status !== "pending") {
      return res.status(400).json({ message: "Cannot edit non-pending leave requests" });
    }

    // Delete old document if new one is uploaded
    if (document && leaveRequest.document) {
      const oldDocumentPath = path.join("uploads/leaves/", leaveRequest.document);
      fs.unlink(oldDocumentPath, (err) => {
        if (err) console.error("Error deleting old document:", err);
      });
    }

    // Recalculate if dates changed
    const newStartDate = start_date || leaveRequest.start_date;
    const newEndDate = end_date || leaveRequest.end_date;
    const days = calculateDays(newStartDate, newEndDate);
    const requiresDeptApproval = days > 3;

    // Validate document for leaves > 5 days
    if (days > 5 && !document && !leaveRequest.document) {
      return res.status(400).json({ message: "Document is required for leaves longer than 5 days" });
    }

    leaveRequest.leave_type = leave_type || leaveRequest.leave_type;
    leaveRequest.start_date = newStartDate;
    leaveRequest.end_date = newEndDate;
    leaveRequest.reason = reason || leaveRequest.reason;
    leaveRequest.document = document || leaveRequest.document;
    leaveRequest.requires_dept_approval = requiresDeptApproval;
    leaveRequest.updated_by = req.user.Userid;

    // Reset dept admin approval if days changed to require approval
    if (requiresDeptApproval && !leaveRequest.dept_admin_approval_status) {
      leaveRequest.dept_admin_approval_status = false;
      leaveRequest.dept_admin_approved_by = null;
      leaveRequest.dept_admin_approved_at = null;
    }

    await leaveRequest.save();

    res.status(200).json({ 
      success: true,
      message: "Leave request updated successfully.", 
      leaveRequest 
    });
  } catch (error) {
    console.error("❌ Error updating leave request:", error);
    res.status(500).json({ success: false, message: "Error updating leave request", error: error.message });
  }
};

// Delete Leave Request (Student)
export const deleteLeave = async (req, res) => {
  try {
    const { leaveId } = req.params;

    const leaveRequest = await StudentLeave.findByPk(leaveId);
    if (!leaveRequest) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    // Only allow student to delete their own pending leaves
    if (leaveRequest.Userid !== req.user.Userid) {
      return res.status(403).json({ message: "Unauthorized to delete this leave request" });
    }

    if (leaveRequest.leave_status !== "pending") {
      return res.status(400).json({ message: "Cannot delete non-pending leave requests" });
    }

    const student = await StudentDetails.findOne({ where: { Userid: leaveRequest.Userid } });
    const user = await User.findByPk(leaveRequest.Userid);

    if (!user || !student) {
      return res.status(404).json({ message: "User or student details not found" });
    }

    // Delete document if exists
    if (leaveRequest.document) {
      const documentPath = path.join("uploads/leaves/", leaveRequest.document);
      fs.unlink(documentPath, (err) => {
        if (err) console.error("Error deleting document:", err);
      });
    }

    await StudentLeave.destroy({ where: { id: leaveId } });

    // Send notification emails
    sendEmail({
      to: user.email,
      subject: "Leave Request Deleted Notification",
      text: `Dear ${user.username || "Student"},

Your leave request has been removed.

- Leave Type: ${leaveRequest.leave_type}  
- Start Date: ${leaveRequest.start_date}  
- End Date: ${leaveRequest.end_date}  
- Reason: ${leaveRequest.reason}  

If this was an error, please contact your tutor.

Best Regards,  
Leave Management System`,
    });

    if (student.tutorEmail) {
      sendEmail({
        to: student.tutorEmail,
        subject: "Leave Request Deleted Notification",
        text: `Dear Tutor,

The following leave request submitted by your student has been deleted:

- Student Regno: ${student.regno}  
- Student Name: ${user.username || "N/A"}  
- Leave Type: ${leaveRequest.leave_type}  
- Start Date: ${leaveRequest.start_date}  
- End Date: ${leaveRequest.end_date}  
- Reason: ${leaveRequest.reason}  

Best Regards,  
Leave Management System`,
      });
    }

    res.status(200).json({ success: true, message: "Leave request deleted successfully." });
  } catch (error) {
    console.error("❌ Error deleting leave request:", error);
    res.status(500).json({ success: false, message: "Error deleting leave request", error: error.message });
  }
};

// Get Student's Own Leaves
export const getStudentLeaves = async (req, res) => {
  try {
    const leaves = await StudentLeave.findAll({
      where: { Userid: req.user.Userid },
      order: [["createdAt", "DESC"]],
    });

    const formattedLeaves = leaves.map((leave) => {
      const leaveData = leave.get({ plain: true });
      const days = calculateDays(leaveData.start_date, leaveData.end_date);
      return {
        ...leaveData,
        total_days: days,
      };
    });

    res.status(200).json({ success: true, leaves: formattedLeaves });
  } catch (error) {
    console.error("Error fetching student leaves:", error);
    res.status(500).json({ success: false, message: "Error fetching leaves" });
  }
};

// ==================== DEPARTMENT ADMIN ENDPOINTS ====================

// Get Pending Leaves for Dept Admin (only their department)
export const getPendingLeavesForDeptAdmin = async (req, res) => {
  try {
    const deptAdminUser = await User.findByPk(req.user.Userid);
    if (!deptAdminUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const deptAdminDetails = await StudentDetails.findOne({ 
      where: { Userid: req.user.Userid } 
    });

    if (!deptAdminDetails || !deptAdminDetails.department) {
      return res.status(404).json({ message: "Department information not found" });
    }

    const pendingLeaves = await StudentLeave.findAll({
      where: { 
        leave_status: "pending",
        requires_dept_approval: true,
        dept_admin_approval_status: false,
      },
      include: [
        {
          model: User,
          as: "LeaveUser",
          attributes: ["Userid", "username", "email"],
          include: [
            {
              model: StudentDetails,
              as: "studentDetails",
              attributes: ["regno", "staffId", "department"],
              where: { department: deptAdminDetails.department },
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const formattedLeaves = pendingLeaves.map((leave) => {
      const { LeaveUser, ...rest } = leave.get({ plain: true });
      const days = calculateDays(rest.start_date, rest.end_date);
      return {
        ...rest,
        username: LeaveUser?.username || "N/A",
        email: LeaveUser?.email || "N/A",
        regno: LeaveUser?.studentDetails?.regno || "N/A",
        staffId: LeaveUser?.studentDetails?.staffId || "N/A",
        department: LeaveUser?.studentDetails?.department || "N/A",
        total_days: days,
      };
    });

    res.status(200).json({ success: true, leaves: formattedLeaves });
  } catch (error) {
    console.error("Error fetching pending leaves for dept admin:", error);
    res.status(500).json({ success: false, message: "Error fetching pending leaves" });
  }
};

// Get All Leaves for Dept Admin (their department)
export const getAllLeavesForDeptAdmin = async (req, res) => {
  try {
    const deptAdminDetails = await StudentDetails.findOne({ 
      where: { Userid: req.user.Userid } 
    });

    if (!deptAdminDetails || !deptAdminDetails.department) {
      return res.status(404).json({ message: "Department information not found" });
    }

    const allLeaves = await StudentLeave.findAll({
      where: { 
        requires_dept_approval: true,
      },
      include: [
        {
          model: User,
          as: "LeaveUser",
          attributes: ["Userid", "username", "email"],
          include: [
            {
              model: StudentDetails,
              as: "studentDetails",
              attributes: ["regno", "staffId", "department"],
              where: { department: deptAdminDetails.department },
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const formattedLeaves = allLeaves.map((leave) => {
      const { LeaveUser, ...rest } = leave.get({ plain: true });
      const days = calculateDays(rest.start_date, rest.end_date);
      return {
        ...rest,
        username: LeaveUser?.username || "N/A",
        email: LeaveUser?.email || "N/A",
        regno: LeaveUser?.studentDetails?.regno || "N/A",
        staffId: LeaveUser?.studentDetails?.staffId || "N/A",
        department: LeaveUser?.studentDetails?.department || "N/A",
        total_days: days,
      };
    });

    res.status(200).json({ success: true, leaves: formattedLeaves });
  } catch (error) {
    console.error("Error fetching all leaves for dept admin:", error);
    res.status(500).json({ success: false, message: "Error fetching leaves" });
  }
};

// Approve/Reject Leave by Dept Admin
export const updateLeaveByDeptAdmin = async (req, res) => {
  try {
    const { leaveId } = req.params;
    const { action, message } = req.body; // action: 'approve' or 'reject'

    if (!action || !["approve", "reject"].includes(action)) {
      return res.status(400).json({ message: "Invalid action. Must be 'approve' or 'reject'" });
    }

    const leaveRequest = await StudentLeave.findByPk(leaveId, {
      include: [
        {
          model: User,
          as: "LeaveUser",
          include: [
            {
              model: StudentDetails,
              as: "studentDetails",
            },
          ],
        },
      ],
    });

    if (!leaveRequest) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    // Verify dept admin belongs to same department
    const deptAdminDetails = await StudentDetails.findOne({ 
      where: { Userid: req.user.Userid } 
    });

    if (!deptAdminDetails || 
        deptAdminDetails.department !== leaveRequest.LeaveUser.studentDetails.department) {
      return res.status(403).json({ message: "Unauthorized: You can only manage leaves from your department" });
    }

    if (!leaveRequest.requires_dept_approval) {
      return res.status(400).json({ message: "This leave does not require department approval" });
    }

    if (leaveRequest.dept_admin_approval_status) {
      return res.status(400).json({ message: "This leave has already been processed by department admin" });
    }

    // Get dept admin user info
    const deptAdminUser = await User.findByPk(req.user.Userid);

    if (action === 'approve') {
      leaveRequest.dept_admin_approval_status = true;
      leaveRequest.dept_admin_approved_by = req.user.Userid;
      leaveRequest.dept_admin_approved_at = new Date();
      leaveRequest.leave_status = 'approved';
      leaveRequest.approved_by = req.user.Userid;
      leaveRequest.approved_at = new Date();
      
      const messages = leaveRequest.messages || [];
      messages.push({
        type: 'dept_admin_approval',
        message: message || 'Approved by Department Admin',
        by: req.user.Userid,
        by_name: deptAdminUser?.username || 'Department Admin',
        at: new Date(),
      });
      leaveRequest.messages = messages;
    } else if (action === 'reject') {
      leaveRequest.leave_status = 'rejected';
      const messages = leaveRequest.messages || [];
      messages.push({
        type: 'dept_admin_rejection',
        message: message || 'Rejected by Department Admin',
        by: req.user.Userid,
        by_name: deptAdminUser?.username || 'Department Admin',
        at: new Date(),
      });
      leaveRequest.messages = messages;
    }

    leaveRequest.updated_by = req.user.Userid;
    await leaveRequest.save();

    // Send email to student
    const user = await User.findByPk(leaveRequest.Userid);
    if (user && user.email) {
      await sendEmail({
        to: user.email,
        subject: `Leave Request ${action === 'approve' ? 'Approved' : 'Rejected'} by Department Admin`,
        text: `Dear ${user.username},

Your leave request has been ${action === 'approve' ? 'approved' : 'rejected'} by the Department Admin.

Leave Details:
- Leave Type: ${leaveRequest.leave_type}
- Start Date: ${leaveRequest.start_date}
- End Date: ${leaveRequest.end_date}
- Total Days: ${calculateDays(leaveRequest.start_date, leaveRequest.end_date)}
${message ? `\nAdmin Message: ${message}` : ''}

${action === 'approve' ? 'Your leave has been approved and is now active.' : 'Please contact your department admin if you have questions.'}

Best Regards,
Leave Management System`,
      });
    }

    // Send email to tutor
    const student = await StudentDetails.findOne({ where: { Userid: leaveRequest.Userid } });
    if (student && student.tutorEmail) {
      await sendEmail({
        to: student.tutorEmail,
        subject: `Leave Request ${action === 'approve' ? 'Approved' : 'Rejected'} by Department Admin`,
        text: `Dear Tutor,

A leave request has been ${action === 'approve' ? 'approved' : 'rejected'} by the Department Admin.

Student Details:
- Name: ${user.username}
- Regno: ${student.regno}
- Department: ${student.department}

Leave Details:
- Leave Type: ${leaveRequest.leave_type}
- Start Date: ${leaveRequest.start_date}
- End Date: ${leaveRequest.end_date}
- Total Days: ${calculateDays(leaveRequest.start_date, leaveRequest.end_date)}
${message ? `\nAdmin Message: ${message}` : ''}

Best Regards,
Leave Management System`,
      });
    }

    res.status(200).json({ 
      success: true,
      message: `Leave request ${action === 'approve' ? 'approved' : 'rejected'} successfully.`,
      leaveRequest 
    });
  } catch (error) {
    console.error("❌ Error updating leave by dept admin:", error);
    res.status(500).json({ success: false, message: "Error updating leave request", error: error.message });
  }
};

// ==================== GENERAL ENDPOINTS ====================

// Get Pending Leaves (All - for admin dashboard)
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
              attributes: ["regno", "staffId", "department"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const formattedLeaves = pendingLeaves.map((leave) => {
      const { LeaveUser, ...rest } = leave.get({ plain: true });
      const days = calculateDays(rest.start_date, rest.end_date);
      return {
        ...rest,
        username: LeaveUser?.username || "N/A",
        email: LeaveUser?.email || "N/A",
        regno: LeaveUser?.studentDetails?.regno || "N/A",
        staffId: LeaveUser?.studentDetails?.staffId || "N/A",
        department: LeaveUser?.studentDetails?.department || "N/A",
        total_days: days,
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
      where: { leave_status: "approved" },
      include: [
        {
          model: User,
          as: "LeaveUser",
          attributes: ["Userid", "username", "email"],
          include: [
            {
              model: StudentDetails,
              as: "studentDetails",
              attributes: ["regno", "staffId", "department"],
            },
          ],
        },
      ],
      order: [["approved_at", "DESC"]],
    });

    const formattedLeaves = approvedLeaves.map((leave) => {
      const { LeaveUser, ...rest } = leave.get({ plain: true });
      const days = calculateDays(rest.start_date, rest.end_date);
      return {
        ...rest,
        username: LeaveUser?.username || "N/A",
        email: LeaveUser?.email || "N/A",
        regno: LeaveUser?.studentDetails?.regno || "N/A",
        staffId: LeaveUser?.studentDetails?.staffId || "N/A",
        department: LeaveUser?.studentDetails?.department || "N/A",
        total_days: days,
      };
    });

    res.status(200).json({ success: true, leaves: formattedLeaves });
  } catch (error) {
    console.error("Error fetching approved leaves:", error);
    res.status(500).json({ success: false, message: "Error fetching approved leaves" });
  }
};