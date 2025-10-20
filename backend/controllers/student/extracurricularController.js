// controllers/student/extracurricularController.js
import { User, StudentDetails, Extracurricular } from "../../models/index.js";
import { sendEmail } from "../../utils/emailService.js";

// Add a new extracurricular activity
export const addExtracurricularActivity = async (req, res) => {
  try {
    const { type, level, from_date, to_date, status, prize, amount, description, certificate_url, Userid } = req.body;

    // Validate required fields
    if (!Userid || !type || !level || !from_date || !to_date || !status) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }

    // Validate enums
    const validTypes = ['Fine Arts', 'Sports', 'Music', 'Dance', 'Debate', 'Cultural', 'Academic Competition', 'Robotics', 'Coding', 'Volunteer Work', 'Student Leadership', 'Other'];
    const validLevels = ['Zonal', 'District', 'National', 'World'];
    const validStatuses = ['Participating', 'Winning'];
    const validPrizes = ['1', '2', '3', null];

    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: "Invalid activity type" });
    }
    if (!validLevels.includes(level)) {
      return res.status(400).json({ message: "Invalid level" });
    }
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Status must be 'Participating' or 'Winning'" });
    }
    if (prize && !validPrizes.includes(prize)) {
      return res.status(400).json({ message: "Prize must be 1, 2, or 3" });
    }

    // Validate dates
    const fromDate = new Date(from_date);
    const toDate = new Date(to_date);
    if (toDate < fromDate) {
      return res.status(400).json({ message: "End date must be after start date" });
    }

    // Fetch user details
    const user = await User.findByPk(Userid);
    if (!user || !user.email) {
      return res.status(404).json({ message: "Student email not found" });
    }

    // Fetch student details
    const student = await StudentDetails.findOne({ where: { Userid } });
    if (!student || !student.tutorEmail) {
      return res.status(404).json({ message: "Tutor email not found" });
    }

    // Create extracurricular activity
    const activity = await Extracurricular.create({
      Userid,
      type,
      level,
      from_date,
      to_date,
      status,
      prize: prize || null,
      amount: amount || 0.00,
      description: description || null,
      certificate_url: certificate_url || null,
      pending: true,
      tutor_approval_status: false,
      Approved_by: null,
      approved_at: null,
      Created_by: user.Userid,
      Updated_by: user.Userid,
    });

    // Send email to tutor
    const emailText = `Dear Tutor,\n\nA student has submitted a new extracurricular activity for your approval.\n\nStudent Details:\nRegno: ${student.regno}\nName: ${user.username || "N/A"}\n\nActivity Details:\nType: ${type}\nLevel: ${level}\nFrom Date: ${from_date}\nTo Date: ${to_date}\nStatus: ${status}\nPrize Position: ${prize || "N/A"}\nAmount: ${amount || "N/A"}\nDescription: ${description || "N/A"}\n\nThe activity is currently pending your approval. Please review and approve or reject.\n\nBest Regards,\nExtracurricular Management System`;

    await sendEmail({
      from: user.email,
      to: student.tutorEmail,
      subject: "New Extracurricular Activity Pending Approval",
      text: emailText,
    });

    res.status(201).json({
      message: "Extracurricular activity submitted for approval. Tutor notified.",
      activity,
    });
  } catch (error) {
    console.error("❌ Error adding extracurricular activity:", error);
    res.status(500).json({ message: "Error adding activity", error: error.message });
  }
};

// Update extracurricular activity
export const updateExtracurricularActivity = async (req, res) => {
  const { id } = req.params;
  const { type, level, from_date, to_date, status, prize, amount, description, certificate_url, Userid } = req.body;

  try {
    const activity = await Extracurricular.findByPk(id);
    if (!activity) {
      return res.status(404).json({ message: "Activity not found" });
    }

    // Check authorization
    if (activity.Userid !== parseInt(Userid)) {
      return res.status(403).json({ message: "Unauthorized to update this activity" });
    }

    // Validate enums if provided
    const validTypes = ['Fine Arts', 'Sports', 'Music', 'Dance', 'Debate', 'Cultural', 'Academic Competition', 'Robotics', 'Coding', 'Volunteer Work', 'Student Leadership', 'Other'];
    const validLevels = ['Zonal', 'District', 'National', 'World'];
    const validStatuses = ['Participating', 'Winning'];

    if (type && !validTypes.includes(type)) {
      return res.status(400).json({ message: "Invalid activity type" });
    }
    if (level && !validLevels.includes(level)) {
      return res.status(400).json({ message: "Invalid level" });
    }
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ message: "Status must be 'Participating' or 'Winning'" });
    }
    if (prize && !['1', '2', '3'].includes(prize)) {
      return res.status(400).json({ message: "Prize must be 1, 2, or 3" });
    }

    // Validate dates if provided
    if (from_date && to_date) {
      const fromDate = new Date(from_date);
      const toDate = new Date(to_date);
      if (toDate < fromDate) {
        return res.status(400).json({ message: "End date must be after start date" });
      }
    }

    const user = await User.findByPk(Userid);
    const student = await StudentDetails.findOne({ where: { Userid } });
    if (!user || !student) {
      return res.status(404).json({ message: "User or Student details not found" });
    }

    // Update fields
    activity.type = type ?? activity.type;
    activity.level = level ?? activity.level;
    activity.from_date = from_date ?? activity.from_date;
    activity.to_date = to_date ?? activity.to_date;
    activity.status = status ?? activity.status;
    activity.prize = prize ?? activity.prize;
    activity.amount = amount ?? activity.amount;
    activity.description = description ?? activity.description;
    activity.certificate_url = certificate_url ?? activity.certificate_url;
    activity.Updated_by = Userid;
    activity.pending = true;
    activity.tutor_approval_status = false;
    activity.Approved_by = null;
    activity.approved_at = null;

    await activity.save();

    // Send update email to tutor
    if (student.tutorEmail) {
      const emailText = `Dear Tutor,\n\nA student has updated their extracurricular activity details.\n\nStudent Details:\nRegno: ${student.regno}\nName: ${user.username || "N/A"}\n\nUpdated Activity Details:\nType: ${activity.type}\nLevel: ${activity.level}\nFrom Date: ${activity.from_date}\nTo Date: ${activity.to_date}\nStatus: ${activity.status}\nPrize Position: ${activity.prize || "N/A"}\nAmount: ${activity.amount || "N/A"}\n\nThis activity is now pending approval. Please review the updated details.\n\nBest Regards,\nExtracurricular Management System`;

      await sendEmail({
        from: user.email,
        to: student.tutorEmail,
        subject: "Extracurricular Activity Updated - Requires Review",
        text: emailText,
      });
    }

    res.status(200).json({
      message: "Activity updated successfully. Tutor notified.",
      activity,
    });
  } catch (error) {
    console.error("❌ Error updating activity:", error);
    res.status(500).json({ message: "Error updating activity", error: error.message });
  }
};

// Get pending extracurricular activities
export const getPendingExtracurricularActivities = async (req, res) => {
  try {
    const pendingActivities = await Extracurricular.findAll({
      where: { pending: true },
      include: [
        {
          model: User,
          as: "organizer",
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
      order: [["createdAt", "DESC"]],
    });

    const formattedActivities = pendingActivities.map((activity) => {
      const { organizer, ...rest } = activity.get({ plain: true });
      return {
        ...rest,
        username: organizer?.username || "N/A",
        regno: organizer?.studentDetails?.regno || "N/A",
        staffId: organizer?.studentDetails?.staffId || "N/A",
      };
    });

    res.status(200).json({ success: true, activities: formattedActivities });
  } catch (error) {
    console.error("Error fetching pending activities:", error.message);
    res.status(500).json({ success: false, message: "Error fetching pending activities" });
  }
};

// Get approved extracurricular activities
export const getApprovedExtracurricularActivities = async (req, res) => {
  const userId = req.user?.Userid || req.query.UserId;
  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  try {
    const approvedActivities = await Extracurricular.findAll({
      where: { tutor_approval_status: true, Userid: userId },
      order: [["approved_at", "DESC"]],
    });

    return res.status(200).json({ success: true, activities: approvedActivities });
  } catch (error) {
    console.error("Error fetching approved activities:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Approve extracurricular activity
export const approveExtracurricularActivity = async (req, res) => {
  const { id } = req.params;
  const { Userid, comments } = req.body;

  try {
    const activity = await Extracurricular.findByPk(id);
    if (!activity) {
      return res.status(404).json({ message: "Activity not found" });
    }

    activity.tutor_approval_status = true;
    activity.pending = false;
    activity.Approved_by = Userid;
    activity.approved_at = new Date();
    activity.comments = comments || null;

    await activity.save();

    // Send approval email to student
    const user = await User.findByPk(activity.Userid);
    if (user && user.email) {
      const emailText = `Dear ${user.username},\n\nYour extracurricular activity has been approved.\n\nActivity Type: ${activity.type}\nLevel: ${activity.level}\nStatus: ${activity.status}\nPrize Position: ${activity.prize || "N/A"}\nAmount: ${activity.amount || "N/A"}\n\nComments: ${comments || "None"}\n\nBest Regards,\nExtracurricular Management System`;

      await sendEmail({
        to: user.email,
        subject: "Extracurricular Activity Approved",
        text: emailText,
      });
    }

    res.status(200).json({ message: "Activity approved successfully", activity });
  } catch (error) {
    console.error("❌ Error approving activity:", error);
    res.status(500).json({ message: "Error approving activity", error: error.message });
  }
};

// Reject extracurricular activity
export const rejectExtracurricularActivity = async (req, res) => {
  const { id } = req.params;
  const { Userid, comments } = req.body;

  try {
    const activity = await Extracurricular.findByPk(id);
    if (!activity) {
      return res.status(404).json({ message: "Activity not found" });
    }

    activity.tutor_approval_status = false;
    activity.pending = false;
    activity.Approved_by = Userid;
    activity.approved_at = new Date();
    activity.comments = comments || "Rejected";

    await activity.save();

    // Send rejection email to student
    const user = await User.findByPk(activity.Userid);
    if (user && user.email) {
      const emailText = `Dear ${user.username},\n\nYour extracurricular activity has been rejected.\n\nActivity: ${activity.type} (${activity.level})\n\nReason: ${comments || "No comments provided"}\n\nYou can resubmit your activity after making necessary changes.\n\nBest Regards,\nExtracurricular Management System`;

      await sendEmail({
        to: user.email,
        subject: "Extracurricular Activity Rejected",
        text: emailText,
      });
    }

    res.status(200).json({ message: "Activity rejected successfully", activity });
  } catch (error) {
    console.error("❌ Error rejecting activity:", error);
    res.status(500).json({ message: "Error rejecting activity", error: error.message });
  }
};

// Delete extracurricular activity
export const deleteExtracurricularActivity = async (req, res) => {
  try {
    const { id } = req.params;

    const activity = await Extracurricular.findByPk(id);
    if (!activity) {
      return res.status(404).json({ message: "Activity not found" });
    }

    const student = await StudentDetails.findOne({ where: { Userid: activity.Userid } });
    const user = await User.findByPk(activity.Userid);

    await activity.destroy();

    // Send deletion notification to student
    if (user && user.email) {
      const emailText = `Dear ${user.username},\n\nYour extracurricular activity has been deleted.\n\nActivity Type: ${activity.type}\nLevel: ${activity.level}\n\nIf this was an error, please contact your tutor.\n\nBest Regards,\nExtracurricular Management System`;

      await sendEmail({
        to: user.email,
        subject: "Extracurricular Activity Deleted",
        text: emailText,
      });
    }

    // Send deletion notification to tutor
    if (student && student.tutorEmail) {
      const emailText = `Dear Tutor,\n\nThe following extracurricular activity has been deleted:\n\nStudent: ${user?.username || "N/A"}\nRegno: ${student.regno}\nActivity: ${activity.type} (${activity.level})\n\nBest Regards,\nExtracurricular Management System`;

      await sendEmail({
        to: student.tutorEmail,
        subject: "Extracurricular Activity Deleted Notification",
        text: emailText,
      });
    }

    res.status(200).json({ message: "Activity deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting activity:", error);
    res.status(500).json({ message: "Error deleting activity", error: error.message });
  }
};

// Get all extracurricular activities for a student
export const getStudentExtracurricularActivities = async (req, res) => {
  const userId = req.user?.Userid || req.query.UserId;
  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  try {
    const activities = await Extracurricular.findAll({
      where: { Userid: userId },
      order: [["from_date", "DESC"]],
    });

    res.status(200).json({ success: true, activities });
  } catch (error) {
    console.error("Error fetching student activities:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get extracurricular activity statistics
export const getExtracurricularStatistics = async (req, res) => {
  const userId = req.user?.Userid || req.query.UserId;
  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  try {
    const activities = await Extracurricular.findAll({
      where: { Userid: userId, tutor_approval_status: true },
    });

    const stats = {
      totalActivities: activities.length,
      winningActivities: activities.filter(a => a.status === 'Winning').length,
      participatingActivities: activities.filter(a => a.status === 'Participating').length,
      totalPrizeAmount: activities.reduce((sum, a) => sum + (parseFloat(a.amount) || 0), 0),
      byLevel: {
        zonal: activities.filter(a => a.level === 'Zonal').length,
        district: activities.filter(a => a.level === 'District').length,
        national: activities.filter(a => a.level === 'National').length,
        world: activities.filter(a => a.level === 'World').length,
      },
      byType: {},
    };

    // Count by type
    activities.forEach(activity => {
      if (!stats.byType[activity.type]) {
        stats.byType[activity.type] = 0;
      }
      stats.byType[activity.type]++;
    });

    res.status(200).json({ success: true, statistics: stats });
  } catch (error) {
    console.error("Error fetching statistics:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};