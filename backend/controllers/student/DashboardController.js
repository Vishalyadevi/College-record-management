import { User, Achievement,StudentDetails, StudentLeave,Internship, Message,Scholarship,EventOrganized,EventAttended ,OnlineCourses} from "../../models/index.js";
import { sendEmail } from "../../utils/emailService.js";

export const tutorApproveInternship = async (req, res) => {
  try {
    const { id } = req.params;
    const { approved, message } = req.body;
    console.log(`Internship ID: ${id}, Approved: ${approved}, Message: ${message}`);

    const internshipId = parseInt(id, 10);
    if (!req.user || !req.user.Userid) {  
      return res.status(401).json({ message: "Unauthorized: Tutor ID missing." });
    }

    const internship = await Internship.findByPk(internshipId, {
      include: [
        { model: User, as: "internUser", attributes: ["Userid", "username", "email"] }, 
        { model: User, as: "tutor", attributes: ["Userid", "username"] }, 
      ],
    });
    if (!internship) {
      return res.status(404).json({ message: "Internship not found." });
    }

    const student = internship.internUser;

 
    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    const studentDetails = await StudentDetails.findOne({
      where: { Userid: student.Userid },  // ✅ Updated user_id -> Userid
      attributes: ["tutorEmail"],
    });
 
    const tutor = await User.findByPk(req.user.Userid, { attributes: ["username"] });  
    const tutorName = tutor?.username || "Tutor";

    await internship.update({
      tutor_approval_status: approved,
      approved_at: new Date(),
      pending: false,
    });

    // Send email notification
    const studentEmail = student.email;
    if (studentEmail) {
      await sendEmail({
        to: studentEmail,
        subject: approved ? "Internship Approved" : "Internship Rejected",
        text: `Dear ${student.username},\n\nYour internship at ${internship.provider_name} has been ${approved ? "approved" : "rejected"} by your tutor (${tutorName}).\n\nMessage: ${message || "No additional message provided."}\n\nBest Regards,\nInternship Approval Team`,
      });
    }

    res.json({ message: `Internship ${approved ? "approved" : "rejected"} successfully.` });
  } catch (error) {
    console.error("❌ Error processing approval:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const sendMessageToStudent = async (req, res) => {
  try {
    const { email, message, type } = req.body;
    if (!email || !message || !type) {
      return res.status(400).json({ message: "Email, message, and type are required." });
    }

    const student = await User.findOne({ where: { email } });
    if (!student) return res.status(404).json({ message: "Student not found." });

    const tutor = await User.findByPk(req.user.Userid);  // ✅ Updated id -> Userid
    if (!tutor) return res.status(404).json({ message: "Tutor not found." });

    const newMessage = await Message.create({
      sender_id: tutor.Userid,  // ✅ Updated id -> Userid
      receiver_id: student.Userid,  // ✅ Updated id -> Userid
      message,
      type,
    });

    const emailSent = await sendEmail({
      to: student.email,
      subject: `${type} Notification`,
      html: `
        <p>Dear <strong>${student.username}</strong>,</p>
        <p>You have received a <strong style="color: ${type === "Warning" ? "red" : "blue"}">${type}</strong> from your tutor, <strong>${tutor.username}</strong>:</p>
        <blockquote style="border-left: 4px solid ${type === "Warning" ? "red" : "blue"}; padding: 10px;">
          ${message}
        </blockquote>
        <p><strong>Best Regards,</strong><br>${tutor.username}</p>
      `,
    });

    console.log(message);

    if (emailSent) {
      res.json({
        message: `${type} sent successfully.`,
        alert: type === "Warning",
      });
    } else {
      res.status(500).json({ message: "Message saved, but email failed to send." });
    }
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getMessagesForStudent = async (req, res) => {
  try {
    const { id } = req.params;

    // Find internship
    const internship = await Internship.findByPk(id);
    if (!internship) {
      return res.status(404).json({ message: "Internship not found." });
    }

    // Parse messages from JSON
    const messages = internship.messages ? JSON.parse(internship.messages) : [];

    res.json({ messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const tutorApproveScholarship = async (req, res) => {
  try {
    const { id } = req.params;
    const { approved, message } = req.body;
    console.log(`Scholarship ID: ${id}, Approved: ${approved}, Message: ${message}`);

    const scholarshipId = parseInt(id, 10);
    if (!req.user || !req.user.Userid) {
      return res.status(401).json({ message: "Unauthorized: Tutor ID missing." });
    }

    // Find the scholarship by ID
    const scholarship = await Scholarship.findByPk(scholarshipId, {
      include: [
        { model: User, as: "student", attributes: ["Userid", "username", "email"] }, // Student user
        { model: User, as: "tutor", attributes: ["Userid", "username"] }, // Approving tutor
      ],
    });

    if (!scholarship) {
      return res.status(404).json({ message: "Scholarship not found." });
    }

    const student = scholarship.student;

    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    // Fetch tutor details
    const tutor = await User.findByPk(req.user.Userid, { attributes: ["username"] });
    const tutorName = tutor?.username || "Tutor";

    // Update the scholarship status
    await scholarship.update({
      tutor_approval_status: approved,
      approved_at: new Date(),
      Approved_by: req.user.Userid,
      pending: false,
    });

    // Send email notification to the student
    const studentEmail = student.email;
    if (studentEmail) {
      await sendEmail({
        to: studentEmail,
        subject: approved ? "Scholarship Approved" : "Scholarship Rejected",
        text: `Dear ${student.username},\n\nYour scholarship application for ${scholarship.name} has been ${approved ? "approved" : "rejected"} by your tutor (${tutorName}).\n\nMessage: ${message || "No additional message provided."}\n\nBest Regards,\nScholarship Approval Team`,
      });
    }

    res.json({ message: `Scholarship ${approved ? "approved" : "rejected"} successfully.` });
  } catch (error) {
    console.error("❌ Error processing scholarship approval:", error);
    res.status(500).json({ message: "Server error" });
  }
};
export const tutorApproveEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { approved, message } = req.body;
    console.log(`Event ID: ${id}, Approved: ${approved}, Message: ${message}`);

    const eventId = parseInt(id, 10);
    if (!req.user || !req.user.Userid) {
      return res.status(401).json({ message: "Unauthorized: Tutor ID missing." });
    }

    // Find the event by ID
    const event = await EventOrganized.findByPk(eventId, {
      include: [
        { model: User, as: "organizer", attributes: ["Userid", "username", "email"] }, // Event organizer
        { model: User, as: "tutor", attributes: ["Userid", "username"] }, // Approving tutor
      ],
    });

    if (!event) {
      return res.status(404).json({ message: "Event not found." });
    }

    const organizer = event.organizer;

    if (!organizer) {
      return res.status(404).json({ message: "Organizer not found." });
    }

    // Fetch tutor details
    const tutor = await User.findByPk(req.user.Userid, { attributes: ["username"] });
    const tutorName = tutor?.username || "Tutor";

    // Update the event status
    await event.update({
      tutor_approval_status: approved,
      approved_at: new Date(),
      Approved_by: req.user.Userid,
      pending: false,
    });

    // Send email notification to the organizer
    const organizerEmail = organizer.email;
    if (organizerEmail) {
      await sendEmail({
        to: organizerEmail,
        subject: approved ? "Event Approved" : "Event Rejected",
        text: `Dear ${organizer.username},\n\nYour event "${event.event_name}" has been ${approved ? "approved" : "rejected"} by your tutor (${tutorName}).\n\nMessage: ${message || "No additional message provided."}\n\nBest Regards,\nEvent Approval Team`,
      });
    }

    res.json({ message: `Event ${approved ? "approved" : "rejected"} successfully.` });
  } catch (error) {
    console.error("❌ Error processing event approval:", error);
    res.status(500).json({ message: "Server error" });
  }
};


export const tutorApproveEventAttended = async (req, res) => {
  try {
    const { id } = req.params; // Event attended ID
    const { approved, message } = req.body; // Approval status and optional message
    console.log(`Event Attended ID: ${id}, Approved: ${approved}, Message: ${message}`);

    const eventAttendedId = parseInt(id, 10);

    // Check if the tutor is authenticated
    if (!req.user || !req.user.Userid) {
      return res.status(401).json({ message: "Unauthorized: Tutor ID missing." });
    }

    // Find the event attended by ID
    const eventAttended = await EventAttended.findByPk(eventAttendedId, {
      include: [
        {
          model: User,
          as: "eventUser", // Student who attended the event
          attributes: ["Userid", "username", "email"],
        },
        {
          model: User,
          as: "tutor", // Approving tutor
          attributes: ["Userid", "username"],
        },
      ],
    });

    if (!eventAttended) {
      return res.status(404).json({ message: "Event attended not found." });
    }

    const student = eventAttended.eventUser; // Student who attended the event

    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    // Fetch tutor details
    const tutor = await User.findByPk(req.user.Userid, { attributes: ["username"] });
    const tutorName = tutor?.username || "Tutor";

    // Update the event attended status
    await eventAttended.update({
      tutor_approval_status: approved,
      approved_at: new Date(),
      Approved_by: req.user.Userid,
      pending: false,
    });

    // Send email notification to the student
    const studentEmail = student.email;
    if (studentEmail) {
      await sendEmail({
        to: studentEmail,
        subject: approved ? "Event Attended Approved" : "Event Attended Rejected",
        text: `Dear ${student.username},\n\nYour participation in the event "${eventAttended.event_name}" has been ${approved ? "approved" : "rejected"} by your tutor (${tutorName}).\n\nMessage: ${message || "No additional message provided."}\n\nBest Regards,\nEvent Approval Team`,
      });
    }

    res.json({ message: `Event attended ${approved ? "approved" : "rejected"} successfully.` });
  } catch (error) {
    console.error("❌ Error processing event attended approval:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const tutorApproveLeave = async (req, res) => {
  
  try {
    const { id } = req.params;
    const { approved, message } = req.body;
 
    const leaveId = parseInt(id, 10);
    if (!req.user || !req.user.Userid) {
      return res.status(401).json({ message: "Unauthorized: Tutor ID missing." });
    }

    // Find the leave request by ID
    const leaveRequest = await StudentLeave.findByPk(leaveId, {
      include: [
        { model: User, as: "LeaveUser", attributes: ["Userid", "username", "email"] }, // Student user
        { model: User, as: "tutor", attributes: ["Userid", "username"] }, // Approving tutor
      ],
    });
  

    if (!leaveRequest) {
      return res.status(404).json({ message: "Leave request not found." });
    }

    // Access the student using the correct alias (LeaveUser)
    const student = leaveRequest.LeaveUser;

    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    // Fetch tutor details
    const tutor = await User.findByPk(req.user.Userid, { attributes: ["username"] });
    const tutorName = tutor?.username || "Tutor";

    // Update the leave request status
    await leaveRequest.update({
      tutor_approval_status: approved,
      approved_at: new Date(),
      Approved_by: req.user.Userid,
      leave_status: "approved" 
    });

    // Send email notification to the student
    const studentEmail = student.email;
    if (studentEmail) {
      await sendEmail({
        to: studentEmail,
        subject: approved ? "Leave Request Approved" : "Leave Request Rejected",
        text: `Dear ${student.username},\n\nYour leave request for ${leaveRequest.reason} has been ${approved ? "approved" : "rejected"} by your tutor (${tutorName}).\n\nMessage: ${message || "No additional message provided."}\n\nBest Regards,\nLeave Approval Team`,
      });
    }

    res.json({ message: `Leave request ${approved ? "approved" : "rejected"} successfully.` });
  } catch (error) {
    console.error("❌ Error processing leave request approval:", error);
    res.status(500).json({ message: "Server error" });
  }
};
export const tutorApproveOnlineCourse = async (req, res) => {
  console.log("hi");
  try {
    const { id } = req.params;
    const { approved, message } = req.body;
    console.log(`Course ID: ${id}, Approved: ${approved}, Message: ${message}`);

    const courseId = parseInt(id, 10);
    if (!req.user || !req.user.Userid) {
      return res.status(401).json({ message: "Unauthorized: Tutor ID missing." });
    }

    const course = await OnlineCourses.findByPk(courseId, {
      include: [
        { model: User, as: "student", attributes: ["Userid", "username", "email"] },
        { model: User, as: "tutor", attributes: ["Userid", "username"] },
      ],
    });

    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    const student = course.student;

    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    const studentDetails = await StudentDetails.findOne({
      where: { Userid: student.Userid },
      attributes: ["tutorEmail"],
    });

    const tutor = await User.findByPk(req.user.Userid, { attributes: ["username"] });
    const tutorName = tutor?.username || "Tutor";

    await course.update({
      tutor_approval_status: approved,
      approved_at: new Date(),
      pending: false,
    });

    // Send email notification
    const studentEmail = student.email;
    if (studentEmail) {
      await sendEmail({
        to: studentEmail,
        subject: approved ? "Online Course Approved" : "Online Course Rejected",
        text: `Dear ${student.username},\n\nYour online course "${course.course_name}" has been ${approved ? "approved" : "rejected"} by your tutor (${tutorName}).\n\nMessage: ${message || "No additional message provided."}\n\nBest Regards,\nOnline Course Approval Team`,
      });
    }

    res.json({ message: `Online course ${approved ? "approved" : "rejected"} successfully.` });
  } catch (error) {
    console.error("❌ Error processing approval:", error);
    res.status(500).json({ message: "Server error" });
  }
};


export const tutorApproveAchievement = async (req, res) => {
  try {
    const { id } = req.params; // Achievement ID
    const { approved, message } = req.body; // Approval status and optional message
    console.log(approved,message);
    console.log(`Achievement ID: ${id}, Approved: ${approved}, Message: ${message}`);

    const achievementId = parseInt(id, 10);

    // Check if the tutor is authenticated
    if (!req.user || !req.user.Userid) {
      return res.status(401).json({ message: "Unauthorized: Tutor ID missing." });
    }

    // Find the achievement by ID with associated users
    const achievement = await Achievement.findByPk(achievementId, {
      include: [
        {
          model: User,
          as: "student", // Student who created the achievement
          attributes: ["Userid", "username", "email"],
        },
        {
          model: User,
          as: "creator", // Who created the record
          attributes: ["Userid", "username"],
        },
        {
          model: User,
          as: "approver", // Who will approve (tutor)
          attributes: ["Userid", "username"],
        }
      ],
    });

    if (!achievement) {
      return res.status(404).json({ message: "Achievement not found." });
    }

    const student = achievement.student; // Student who created the achievement

    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    // Fetch tutor details
    const tutor = await User.findByPk(req.user.Userid, { attributes: ["username"] });
    const tutorName = tutor?.username || "Tutor";

    // Update the achievement status
    await achievement.update({
      tutor_approval_status: approved,
      approved_at: new Date(),
      Approved_by: req.user.Userid,
      pending: false,
    });

    // Send email notification to the student
    const studentEmail = student.email;
    if (studentEmail) {
      await sendEmail({
        to: studentEmail,
        subject: approved ? "Achievement Approved" : "Achievement Rejected",
        text: `Dear ${student.username},\n\nYour achievement "${achievement.title}" has been ${approved ? "approved" : "rejected"} by your tutor (${tutorName}).\n\nMessage: ${message || "No additional message provided."}\n\nBest Regards,\nAchievement Approval Team`,
      });
    }

    res.json({ message: `Achievement ${approved ? "approved" : "rejected"} successfully.` });
  } catch (error) {
    console.error("❌ Error processing achievement approval:", error);
    res.status(500).json({ message: "Server error" });
  }
};
// DashboardController.js - Add these new functions

// Get Non-CGPA data for dashboard
export const getNonCGPAForStudent = async (req, res) => {
  try {
    const { studentId } = req.params;

    const noncgpaData = await db.query(
      `SELECT * FROM student_noncgpa WHERE Userid = ? ORDER BY created_at DESC`,
      [studentId]
    );

    res.json({
      success: true,
      data: noncgpaData[0] || []
    });
  } catch (error) {
    console.error('Error fetching non-CGPA data:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get SkillRack data (mock for now - replace with actual scraping if needed)
export const getSkillRackData = async (req, res) => {
  try {
    const { studentId } = req.params;

    // Get student's skillrack profile URL
    const student = await User.findByPk(studentId, {
      attributes: ['skillrackProfile']
    });

    if (!student || !student.skillrackProfile) {
      return res.json({
        success: false,
        message: 'SkillRack profile not found'
      });
    }

    // Mock data - replace with actual API call or scraping
    res.json({
      success: true,
      data: {
        rank: Math.floor(Math.random() * 5000) + 1,
        medals: {
          gold: Math.floor(Math.random() * 20),
          silver: Math.floor(Math.random() * 15),
          bronze: Math.floor(Math.random() * 25)
        },
        profile: student.skillrackProfile
      }
    });
  } catch (error) {
    console.error('Error fetching SkillRack data:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get dashboard summary statistics
export const getDashboardStats = async (req, res) => {
  try {
    const { studentId } = req.params;

    // Get all data in parallel
    const [
      student,
      courses,
      internships,
      achievements,
      events,
      scholarships,
      leaves,
      noncgpa
    ] = await Promise.all([
      User.findByPk(studentId, {
        include: [
          { model: StudentDetails, as: 'studentDetails' }
        ]
      }),
      OnlineCourses.findAll({ where: { Userid: studentId } }),
      Internship.findAll({ where: { Userid: studentId } }),
      Achievement.findAll({ where: { Userid: studentId } }),
      EventAttended.findAll({ where: { Userid: studentId } }),
      Scholarship.findAll({ where: { Userid: studentId } }),
      StudentLeave.findAll({ where: { Userid: studentId } }),
      db.query(`SELECT * FROM student_noncgpa WHERE Userid = ?`, [studentId])
    ]);

    // Calculate NPTEL stats
    const nptelCourses = courses.filter(c => 
      c.provider?.toLowerCase().includes('nptel') ||
      c.course_name?.toLowerCase().includes('nptel')
    );
    const nptelCompleted = nptelCourses.filter(c => c.status === 'Completed');
    const nptelCredits = nptelCompleted.reduce((sum, c) => sum + (parseInt(c.credits) || 0), 0);

    // Calculate approval stats
    const approvalStats = {
      approved: {
        internships: internships.filter(i => i.tutor_approval_status === true).length,
        courses: courses.filter(c => c.tutor_approval_status === true).length,
        events: events.filter(e => e.tutor_approval_status === true).length,
        achievements: achievements.filter(a => a.tutor_approval_status === true).length,
        scholarships: scholarships.filter(s => s.tutor_approval_status === true).length,
        leaves: leaves.filter(l => l.leave_status === 'approved').length
      },
      pending: {
        internships: internships.filter(i => i.pending === true).length,
        courses: courses.filter(c => c.pending === true).length,
        events: events.filter(e => e.pending === true).length,
        achievements: achievements.filter(a => a.pending === true).length,
        scholarships: scholarships.filter(s => s.pending === true).length,
        leaves: leaves.filter(l => l.leave_status === 'pending').length
      },
      rejected: {
        internships: internships.filter(i => i.tutor_approval_status === false && !i.pending).length,
        courses: courses.filter(c => c.tutor_approval_status === false && !c.pending).length,
        events: events.filter(e => e.tutor_approval_status === false && !e.pending).length,
        achievements: achievements.filter(a => a.tutor_approval_status === false && !a.pending).length,
        scholarships: scholarships.filter(s => s.tutor_approval_status === false && !s.pending).length,
        leaves: leaves.filter(l => l.leave_status === 'rejected').length
      }
    };

    res.json({
      success: true,
      data: {
        student: {
          name: student?.username,
          department: student?.studentDetails?.department,
          regno: student?.studentDetails?.regno,
          skillrackProfile: student?.skillrackProfile
        },
        nptel: {
          total: nptelCourses.length,
          completed: nptelCompleted.length,
          ongoing: nptelCourses.filter(c => c.status === 'Ongoing').length,
          credits: nptelCredits
        },
        noncgpa: {
          total: noncgpa[0]?.length || 0,
          pending: noncgpa[0]?.filter(n => !n.completed).length || 0
        },
        approvals: approvalStats,
        totals: {
          courses: courses.length,
          internships: internships.length,
          achievements: achievements.length,
          events: events.length,
          scholarships: scholarships.length,
          leaves: leaves.length
        }
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
};