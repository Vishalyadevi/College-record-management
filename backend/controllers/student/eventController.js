import { User, StudentDetails, EventOrganized } from "../../models/index.js";
import { sendEmail } from "../../utils/emailService.js";

// Add a new event
export const addEvent = async (req, res) => {
  console.log("=== ADD EVENT REQUEST ===");
  console.log("Body:", req.body);
  
  try {
    const { 
      event_name, 
      club_name, 
      role, 
      staff_incharge, 
      start_date, 
      end_date, 
      number_of_participants, 
      mode, 
      funding_agency, 
      funding_amount, 
      Userid 
    } = req.body;

    // Use Userid from request body or from authenticated user
    const userId = Userid || req.user?.Userid;
    
    console.log("Using Userid:", userId);

    // Validate User ID
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Fetch user details
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    if (!user.email) {
      return res.status(404).json({ message: "Student email not found" });
    }

    console.log("Found user:", user.email);

    // Fetch student details
    const student = await StudentDetails.findOne({ where: { Userid: userId } });
    if (!student) {
      return res.status(404).json({ message: "Student details not found. Please complete your profile." });
    }
    
    if (!student.tutorEmail) {
      console.warn("⚠️ Tutor email not found for student:", student.regno);
      // Continue without tutor email - don't block event creation
    }

    console.log("Found student:", student.regno);

    // Create event
    const event = await EventOrganized.create({
      Userid: parseInt(userId),
      event_name,
      club_name,
      role,
      staff_incharge,
      start_date,
      end_date,
      number_of_participants: parseInt(number_of_participants),
      mode,
      funding_agency: funding_agency || null,
      funding_amount: funding_amount ? parseFloat(funding_amount) : null,
      pending: true,
      tutor_approval_status: false,
      Approved_by: null,
      approved_at: null,
      Created_by: parseInt(userId),
      Updated_by: parseInt(userId),
    });

    console.log("✅ Event created:", event.id);

    // Send email to tutor (non-blocking) - only if tutor email exists
    if (student.tutorEmail) {
      sendEmail({
        from: user.email,
        to: student.tutorEmail,
        subject: "New Event Pending Approval",
        text: `Dear Tutor,

A student has submitted a new event for your approval. Please find the details below:

Student Regno: ${student.regno}
Student Name: ${user.username || "N/A"}
Event Name: ${event_name}
Club Name: ${club_name}
Role: ${role}
Staff Incharge: ${staff_incharge}
Start Date: ${start_date}
End Date: ${end_date}
Number of Participants: ${number_of_participants}
Mode: ${mode}
Funding Agency: ${funding_agency || "N/A"}
Funding Amount: ${funding_amount || "N/A"}

The event is currently pending your approval.

Best Regards,
Event Management System`,
      }).catch(err => console.error("⚠️ Email error:", err));
    }

    // Return success response
    res.status(201).json({
      message: "Event submitted for approval.",
      event,
      success: true,
      approval_status: 'Pending'
    });

  } catch (error) {
    console.error("❌ Error adding event:", error);
    console.error("Error stack:", error.stack);
    
    res.status(500).json({ 
      message: "Error adding event", 
      error: error.message
    });
  }
};

// Update an event
export const updateEvent = async (req, res) => {
  const { id } = req.params;
  const { 
    event_name, 
    club_name, 
    role, 
    staff_incharge, 
    start_date, 
    end_date, 
    number_of_participants, 
    mode, 
    funding_agency, 
    funding_amount, 
    Userid 
  } = req.body;

  try {
    const userId = Userid || req.user?.Userid;
    
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Find the event by ID
    const event = await EventOrganized.findByPk(id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Check if the user is authorized to update the event
    if (event.Userid !== parseInt(userId)) {
      return res.status(403).json({ message: "Unauthorized to update this event" });
    }

    // Check if event is already approved
    if (event.tutor_approval_status) {
      return res.status(400).json({ message: "Cannot edit approved events" });
    }

    // Find the user and student details
    const user = await User.findByPk(userId);
    const student = await StudentDetails.findOne({ where: { Userid: userId } });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update event details
    event.event_name = event_name ?? event.event_name;
    event.club_name = club_name ?? event.club_name;
    event.role = role ?? event.role;
    event.staff_incharge = staff_incharge ?? event.staff_incharge;
    event.start_date = start_date ?? event.start_date;
    event.end_date = end_date ?? event.end_date;
    event.number_of_participants = number_of_participants ? parseInt(number_of_participants) : event.number_of_participants;
    event.mode = mode ?? event.mode;
    event.funding_agency = funding_agency ?? event.funding_agency;
    event.funding_amount = funding_amount ? parseFloat(funding_amount) : event.funding_amount;
    event.Updated_by = parseInt(userId);
    event.pending = true;
    event.tutor_approval_status = false;
    event.Approved_by = null;
    event.approved_at = null;

    // Save the updated event
    await event.save();

    // Send email to tutor if available
    if (student?.tutorEmail) {
      sendEmail({
        from: user.email,
        to: student.tutorEmail,
        subject: "Event Updated - Requires Review",
        text: `Dear Tutor,

A student has updated their event details. Please review the updated details:

Student Regno: ${student.regno}
Student Name: ${user.username || "N/A"}
Event Name: ${event.event_name}
Club Name: ${event.club_name}
Role: ${event.role}
Staff Incharge: ${event.staff_incharge}
Start Date: ${event.start_date}
End Date: ${event.end_date}
Number of Participants: ${event.number_of_participants}
Mode: ${event.mode}
Funding Agency: ${event.funding_agency || "N/A"}
Funding Amount: ${event.funding_amount || "N/A"}

This event is now pending approval.

Best Regards,
Event Management System`,
      }).catch(err => console.error("⚠️ Email error:", err));
    }

    // Return success response
    res.status(200).json({
      message: "Event updated successfully.",
      event,
      success: true,
      approval_status: 'Pending'
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
              attributes: ["regno", "staffId"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    // Format the response
    const formattedEvents = pendingEvents.map((event) => {
      const plainEvent = event.get({ plain: true });
      return {
        ...plainEvent,
        approval_status: 'Pending',
        username: plainEvent.organizer?.username || "N/A",
        regno: plainEvent.organizer?.studentDetails?.regno || "N/A",
        staffId: plainEvent.organizer?.studentDetails?.staffId || "N/A",
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
      where: { 
        tutor_approval_status: true, 
        Userid: parseInt(userId)
      },
      order: [["approved_at", "DESC"]],
    });

    // Add approval_status field
    const formattedEvents = approvedEvents.map(event => ({
      ...event.get({ plain: true }),
      approval_status: 'Approved'
    }));

    return res.status(200).json(formattedEvents);
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
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Check if event is approved
    if (event.tutor_approval_status) {
      return res.status(400).json({ message: "Cannot delete approved events" });
    }

    const student = await StudentDetails.findOne({ where: { Userid: event.Userid } });
    const user = await User.findByPk(event.Userid);

    // Delete the event
    await EventOrganized.destroy({ where: { id } });

    // Send notification emails (non-blocking)
    if (user?.email) {
      sendEmail({
        to: user.email,
        subject: "Event Deleted Notification",
        text: `Dear ${user.username || "Student"},

Your event has been removed.

- Event Name: ${event.event_name}
- Club Name: ${event.club_name}
- Role: ${event.role}
- Staff Incharge: ${event.staff_incharge}
- Start Date: ${event.start_date}
- End Date: ${event.end_date}
- Participants: ${event.number_of_participants}
- Mode: ${event.mode}
- Funding Agency: ${event.funding_agency || "N/A"}
- Funding Amount: ${event.funding_amount || "N/A"}

If this was an error, contact tutorsjf@gmail.com.

Best,
Event Management System`,
      }).catch(err => console.error("Email error:", err));
    }

    if (student?.tutorEmail) {
      sendEmail({
        to: student.tutorEmail,
        subject: "Event Deleted Notification",
        text: `Dear Tutor,

The following event submitted by your student has been deleted:

- Student Regno: ${student.regno}
- Student Name: ${user?.username || "N/A"}
- Event Name: ${event.event_name}
- Club Name: ${event.club_name}

Best,
Event Management System`,
      }).catch(err => console.error("Email error:", err));
    }

    res.status(200).json({ message: "Event deleted successfully", success: true });
  } catch (error) {
    console.error("❌ Error deleting event:", error);
    res.status(500).json({ message: "Error deleting event", error: error.message });
  }
};