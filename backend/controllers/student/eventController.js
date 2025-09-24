import { User, StudentDetails,EventOrganized } from "../../models/index.js";
import { sendEmail } from "../../utils/emailService.js";

// Add a new event
export const addEvent = async (req, res) => {
  console.log("hi")
  try {
    const { event_name, club_name, role, staff_incharge, start_date, end_date, number_of_participants, mode, funding_agency, funding_amount, Userid } = req.body;
    console.log(req.body)
    // Validate User ID
    if (!Userid) {
      return res.status(400).json({ message: "User ID is required" });
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

    // Create event
    const event = await EventOrganized.create({
      Userid,
      event_name,
      club_name,
      role,
      staff_incharge,
      start_date, // Updated field name
      end_date, // Updated field name
      number_of_participants,
      mode,
      funding_agency,
      funding_amount,
      pending: true,
      tutor_approval_status: false,
      Approved_by: null,
      approved_at: null,
      Created_by: user.Userid,
      Updated_by: user.Userid,
    });

    // Send email to tutor
    const emailResponse = await sendEmail({
      from: user.email,
      to: student.tutorEmail,
      subject: "New Event Pending Approval",
      text: `Dear Tutor,\n\nA student has submitted a new event for your approval. Please find the details below:\n\nStudent Regno: ${student.regno}\nStudent Name: ${user.username || "N/A"}\nEvent Name: ${event_name}\nClub Name: ${club_name}\nRole: ${role}\nStaff Incharge: ${staff_incharge}\nStart Date: ${start_date}\nEnd Date: ${end_date}\nNumber of Participants: ${number_of_participants}\nMode: ${mode}\nFunding Agency: ${funding_agency || "N/A"}\nFunding Amount: ${funding_amount || "N/A"}\n\nThe event is currently pending your approval. Please review the details and either approve or reject the event.\n\nBest Regards,\nEvent Management System\n\nNote: If you have any issues, feel free to contact the system administrator at tutorsjf@gmail.com.`,
    });

    // Handle email sending errors
    if (!emailResponse.success) {
      console.error("⚠️ Failed to send email:", emailResponse.error);
    }

    // Return success response
    res.status(201).json({
      message: "Event submitted for approval. Tutor notified.",
      event,
    });
  } catch (error) {
    console.error("❌ Error adding event:", error);
    res.status(500).json({ message: "Error adding event", error });
  }
};

// Update an event
export const updateEvent = async (req, res) => {
  const { id } = req.params;
  const { event_name, club_name, role, staff_incharge, start_date, end_date, number_of_participants, mode, funding_agency, funding_amount, Userid } = req.body;

  try {
    // Find the event by ID
    const event = await EventOrganized.findByPk(id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Check if the user is authorized to update the event
    if (event.Userid !== parseInt(Userid)) {
      return res.status(403).json({ message: "Unauthorized to update this event" });
    }

    // Find the user and student details
    const user = await User.findByPk(Userid);
    const student = await StudentDetails.findOne({ where: { Userid } });
    if (!user || !student) {
      return res.status(404).json({ message: "User or Student details not found" });
    }

    // Update event details
    event.event_name = event_name ?? event.event_name;
    event.club_name = club_name ?? event.club_name;
    event.role = role ?? event.role;
    event.staff_incharge = staff_incharge ?? event.staff_incharge;
    event.start_date = start_date ?? event.start_date; // Updated field name
    event.end_date = end_date ?? event.end_date; // Updated field name
    event.number_of_participants = number_of_participants ?? event.number_of_participants;
    event.mode = mode ?? event.mode;
    event.funding_agency = funding_agency ?? event.funding_agency;
    event.funding_amount = funding_amount ?? event.funding_amount;
    event.Updated_by = Userid;
    event.pending = true;
    event.tutor_approval_status = false;
    event.Approved_by = null;
    event.approved_at = null;

    // Save the updated event
    await event.save();

    // Send email to tutor if tutor's email is available
    if (student.tutorEmail) {
      const emailSubject = "Event Updated - Requires Review";
      const emailText = `Dear Tutor,\n\nA student has updated their event details. Please review the updated details:\n\nStudent Regno: ${student.regno}\nStudent Name: ${user.username || "N/A"}\nEvent Name: ${event.event_name}\nClub Name: ${event.club_name}\nRole: ${event.role}\nStaff Incharge: ${event.staff_incharge}\nStart Date: ${event.start_date}\nEnd Date: ${event.end_date}\nNumber of Participants: ${event.number_of_participants}\nMode: ${event.mode}\nFunding Agency: ${event.funding_agency || "N/A"}\nFunding Amount: ${event.funding_amount || "N/A"}\n\nThis event is now pending approval. Please review the details.\n\nBest Regards,\nEvent Management System\n\nNote: If you have any issues, feel free to contact the system administrator at tutorsjf@gmail.com.`;

      const emailResponse = await sendEmail({
        from: user.email,
        to: student.tutorEmail,
        subject: emailSubject,
        text: emailText,
      });

      if (!emailResponse.success) {
        console.error("⚠️ Failed to send email:", emailResponse.error);
      }
    } else {
      console.warn("⚠️ Tutor email not found. Email notification skipped.");
    }

    // Return success response
    res.status(200).json({
      message: "Event updated successfully, tutor notified.",
      event,
    });
  } catch (error) {
    console.error("❌ Error updating event:", error);
    res.status(500).json({ message: "Error updating event", error: error.message });
  }
};

// Get pending events
export const getPendingEvents = async (req, res) => {
  try {
    const pendingEvents = await EventOrganized.findAll({
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
              attributes: ["regno","staffId"],
            },
          ],
        },
      ],
    });

    // Format the response to include all event details, username, and regno
    const formattedEvents = pendingEvents.map((event) => {
      const { organizer, ...rest } = event.get({ plain: true });
      return {
        ...rest,
        username: organizer?.username || "N/A",
        regno: organizer?.studentDetails?.regno || "N/A",
        staffId:  organizer?.studentDetails?.staffId || "N/A", // Include staffId
      };
    });

    res.status(200).json({ success: true, events: formattedEvents });
  } catch (error) {
    console.error("Error fetching pending events:", error.message);
    res.status(500).json({ success: false, message: "Error fetching pending events" });
  }
};

// Get approved events
export const getApprovedEvents = async (req, res) => {
  const userId = req.user?.Userid || req.query.UserId;
  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  try {
    const approvedEvents = await EventOrganized.findAll({
      where: { tutor_approval_status: true, Userid: userId }, // Filter by userId
      order: [["approved_at", "DESC"]],
    });

    return res.status(200).json(approvedEvents);
  } catch (error) {
    console.error("Error fetching approved events:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Delete an event
export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await EventOrganized.findByPk(id);
    if (!event) return;

    const student = await StudentDetails.findOne({ where: { Userid: event.Userid } });
    const user = await User.findByPk(event.Userid);

    if (!user || !student) return;

    await Event.destroy({ where: { id } });

    sendEmail({
      to: user.email,
      subject: "Event Deleted Notification",
      text: `Dear ${user.username || "Student"},\n\nYour event has been removed.\n\n- **Name**: ${event.event_name}\n- **Club Name**: ${event.club_name}\n- **Role**: ${event.role}\n- **Staff Incharge**: ${event.staff_incharge}\n- **Start Date**: ${event.start_date}\n- **End Date**: ${event.end_date}\n- **Participants**: ${event.number_of_participants}\n- **Mode**: ${event.mode}\n- **Funding Agency**: ${event.funding_agency || "N/A"}\n- **Funding Amount**: ${event.funding_amount || "N/A"}\n\nIf this was an error, contact **tutorsjf@gmail.com**.\n\nBest,\nEvent Management System`,
    });

    sendEmail({
      to: student.tutorEmail,
      subject: "Event Deleted Notification",
      text: `Dear Tutor,\n\nThe following event submitted by your student has been deleted:\n\n- **Student Regno**: ${student.regno}\n- **Student Name**: ${user.username || "N/A"}\n- **Event Name**: ${event.event_name}\n- **Club Name**: ${event.club_name}\n- **Role**: ${event.role}\n- **Staff Incharge**: ${event.staff_incharge}\n- **Start Date**: ${event.start_date}\n- **End Date**: ${event.end_date}\n- **Participants**: ${event.number_of_participants}\n- **Mode**: ${event.mode}\n- **Funding Agency**: ${event.funding_agency || "N/A"}\n- **Funding Amount**: ${event.funding_amount || "N/A"}\n\nIf you need further details, contact **tutorsjf@gmail.com**.\n\nBest,\nEvent Management System`,
    });

    res.status(200).json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting event:", error);
    res.status(500).json({ message: "Error deleting event", error });
  }
};