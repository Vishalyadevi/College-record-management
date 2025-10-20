// controllers/student/hackathonController.js
import { User, StudentDetails, HackathonEvent } from "../../models/index.js";
import { sendEmail } from "../../utils/emailService.js";

// Add a new hackathon event
export const addHackathonEvent = async (req, res) => {
  try {
    const { event_name, organized_by, from_date, to_date, level_cleared, rounds, status, Userid } = req.body;

    // Validate required fields
    if (!Userid || !event_name || !organized_by || !from_date || !to_date || !level_cleared || !status) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }

    // Validate level_cleared (1-10)
    if (level_cleared < 1 || level_cleared > 10) {
      return res.status(400).json({ message: "Level cleared must be between 1 and 10" });
    }

    // Validate status enum
    if (!['participate', 'achievement'].includes(status)) {
      return res.status(400).json({ message: "Status must be either 'participate' or 'achievement'" });
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

    // Create hackathon event
    const event = await HackathonEvent.create({
      Userid,
      event_name,
      organized_by,
      from_date,
      to_date,
      level_cleared,
      rounds: rounds || 1,
      status,
      pending: true,
      tutor_approval_status: false,
      Approved_by: null,
      approved_at: null,
      Created_by: user.Userid,
      Updated_by: user.Userid,
    });

    // Send email to tutor
    const emailText = `Dear Tutor,\n\nA student has submitted a new hackathon event for your approval.\n\nStudent Details:\nRegno: ${student.regno}\nName: ${user.username || "N/A"}\n\nEvent Details:\nEvent Name: ${event_name}\nOrganized By: ${organized_by}\nFrom Date: ${from_date}\nTo Date: ${to_date}\nLevel Cleared: ${level_cleared}/10\nRounds: ${rounds || 1}\nStatus: ${status}\n\nThe event is currently pending your approval. Please review and approve or reject.\n\nBest Regards,\nHackathon Management System`;

    await sendEmail({
      from: user.email,
      to: student.tutorEmail,
      subject: "New Hackathon Event Pending Approval",
      text: emailText,
    });

    res.status(201).json({
      message: "Hackathon event submitted for approval. Tutor notified.",
      event,
    });
  } catch (error) {
    console.error("❌ Error adding hackathon event:", error);
    res.status(500).json({ message: "Error adding hackathon event", error: error.message });
  }
};

// Update hackathon event
export const updateHackathonEvent = async (req, res) => {
  const { id } = req.params;
  const { event_name, organized_by, from_date, to_date, level_cleared, rounds, status, Userid } = req.body;

  try {
    const event = await HackathonEvent.findByPk(id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Check authorization
    if (event.Userid !== parseInt(Userid)) {
      return res.status(403).json({ message: "Unauthorized to update this event" });
    }

    // Validate level_cleared if provided
    if (level_cleared && (level_cleared < 1 || level_cleared > 10)) {
      return res.status(400).json({ message: "Level cleared must be between 1 and 10" });
    }

    // Validate status if provided
    if (status && !['participate', 'achievement'].includes(status)) {
      return res.status(400).json({ message: "Status must be either 'participate' or 'achievement'" });
    }

    const user = await User.findByPk(Userid);
    const student = await StudentDetails.findOne({ where: { Userid } });
    if (!user || !student) {
      return res.status(404).json({ message: "User or Student details not found" });
    }

    // Update fields
    event.event_name = event_name ?? event.event_name;
    event.organized_by = organized_by ?? event.organized_by;
    event.from_date = from_date ?? event.from_date;
    event.to_date = to_date ?? event.to_date;
    event.level_cleared = level_cleared ?? event.level_cleared;
    event.rounds = rounds ?? event.rounds;
    event.status = status ?? event.status;
    event.Updated_by = Userid;
    event.pending = true;
    event.tutor_approval_status = false;
    event.Approved_by = null;
    event.approved_at = null;

    await event.save();

    // Send update email to tutor
    if (student.tutorEmail) {
      const emailText = `Dear Tutor,\n\nA student has updated their hackathon event details.\n\nStudent Details:\nRegno: ${student.regno}\nName: ${user.username || "N/A"}\n\nUpdated Event Details:\nEvent Name: ${event.event_name}\nOrganized By: ${event.organized_by}\nFrom Date: ${event.from_date}\nTo Date: ${event.to_date}\nLevel Cleared: ${event.level_cleared}/10\nRounds: ${event.rounds}\nStatus: ${event.status}\n\nThis event is now pending approval. Please review the updated details.\n\nBest Regards,\nHackathon Management System`;

      await sendEmail({
        from: user.email,
        to: student.tutorEmail,
        subject: "Hackathon Event Updated - Requires Review",
        text: emailText,
      });
    }

    res.status(200).json({
      message: "Hackathon event updated successfully. Tutor notified.",
      event,
    });
  } catch (error) {
    console.error("❌ Error updating hackathon event:", error);
    res.status(500).json({ message: "Error updating hackathon event", error: error.message });
  }
};

// Get pending hackathon events
export const getPendingHackathonEvents = async (req, res) => {
  try {
    const pendingEvents = await HackathonEvent.findAll({
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

    const formattedEvents = pendingEvents.map((event) => {
      const { organizer, ...rest } = event.get({ plain: true });
      return {
        ...rest,
        username: organizer?.username || "N/A",
        regno: organizer?.studentDetails?.regno || "N/A",
        staffId: organizer?.studentDetails?.staffId || "N/A",
      };
    });

    res.status(200).json({ success: true, events: formattedEvents });
  } catch (error) {
    console.error("Error fetching pending hackathon events:", error.message);
    res.status(500).json({ success: false, message: "Error fetching pending events" });
  }
};

// Get approved hackathon events
export const getApprovedHackathonEvents = async (req, res) => {
  const userId = req.user?.Userid || req.query.UserId;
  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  try {
    const approvedEvents = await HackathonEvent.findAll({
      where: { tutor_approval_status: true, Userid: userId },
      order: [["approved_at", "DESC"]],
    });

    return res.status(200).json({ success: true, events: approvedEvents });
  } catch (error) {
    console.error("Error fetching approved hackathon events:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Approve hackathon event
export const approveHackathonEvent = async (req, res) => {
  const { id } = req.params;
  const { Userid, comments } = req.body;

  try {
    const event = await HackathonEvent.findByPk(id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    event.tutor_approval_status = true;
    event.pending = false;
    event.Approved_by = Userid;
    event.approved_at = new Date();
    event.comments = comments || null;

    await event.save();

    // Send approval email to student
    const user = await User.findByPk(event.Userid);
    if (user && user.email) {
      const emailText = `Dear ${user.username},\n\nYour hackathon event has been approved.\n\nEvent: ${event.event_name}\nOrganized By: ${event.organized_by}\nLevel Cleared: ${event.level_cleared}/10\nStatus: ${event.status}\n\nComments: ${comments || "None"}\n\nBest Regards,\nHackathon Management System`;

      await sendEmail({
        to: user.email,
        subject: "Hackathon Event Approved",
        text: emailText,
      });
    }

    res.status(200).json({ message: "Event approved successfully", event });
  } catch (error) {
    console.error("❌ Error approving event:", error);
    res.status(500).json({ message: "Error approving event", error: error.message });
  }
};

// Reject hackathon event
export const rejectHackathonEvent = async (req, res) => {
  const { id } = req.params;
  const { Userid, comments } = req.body;

  try {
    const event = await HackathonEvent.findByPk(id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    event.tutor_approval_status = false;
    event.pending = false;
    event.Approved_by = Userid;
    event.approved_at = new Date();
    event.comments = comments || "Rejected";

    await event.save();

    // Send rejection email to student
    const user = await User.findByPk(event.Userid);
    if (user && user.email) {
      const emailText = `Dear ${user.username},\n\nYour hackathon event has been rejected.\n\nEvent: ${event.event_name}\nOrganized By: ${event.organized_by}\n\nReason: ${comments || "No comments provided"}\n\nYou can resubmit your event after making necessary changes.\n\nBest Regards,\nHackathon Management System`;

      await sendEmail({
        to: user.email,
        subject: "Hackathon Event Rejected",
        text: emailText,
      });
    }

    res.status(200).json({ message: "Event rejected successfully", event });
  } catch (error) {
    console.error("❌ Error rejecting event:", error);
    res.status(500).json({ message: "Error rejecting event", error: error.message });
  }
};

// Delete hackathon event
export const deleteHackathonEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await HackathonEvent.findByPk(id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const student = await StudentDetails.findOne({ where: { Userid: event.Userid } });
    const user = await User.findByPk(event.Userid);

    await event.destroy();

    // Send deletion notification emails
    if (user && user.email) {
      const emailText = `Dear ${user.username},\n\nYour hackathon event has been deleted.\n\nEvent Name: ${event.event_name}\nOrganized By: ${event.organized_by}\n\nIf this was an error, please contact your tutor.\n\nBest Regards,\nHackathon Management System`;

      await sendEmail({
        to: user.email,
        subject: "Hackathon Event Deleted",
        text: emailText,
      });
    }

    if (student && student.tutorEmail) {
      const emailText = `Dear Tutor,\n\nThe following hackathon event has been deleted:\n\nStudent: ${user?.username || "N/A"}\nRegno: ${student.regno}\nEvent: ${event.event_name}\n\nBest Regards,\nHackathon Management System`;

      await sendEmail({
        to: student.tutorEmail,
        subject: "Hackathon Event Deleted Notification",
        text: emailText,
      });
    }

    res.status(200).json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting hackathon event:", error);
    res.status(500).json({ message: "Error deleting event", error: error.message });
  }
};

// Get all hackathon events for a student
export const getStudentHackathonEvents = async (req, res) => {
  const userId = req.user?.Userid || req.query.UserId;
  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  try {
    const events = await HackathonEvent.findAll({
      where: { Userid: userId },
      order: [["from_date", "DESC"]],
    });

    res.status(200).json({ success: true, events });
  } catch (error) {
    console.error("Error fetching student hackathon events:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}