import uploadEvent from "../../utils/uploadEvent.js";
import { User, StudentDetails, EventAttended, City, District, State } from "../../models/index.js";
import { sendEmail } from "../../utils/emailService.js";
import fs from "fs";
import path from "path";

// Add a new event attended
export const addEventAttended = [
  uploadEvent,
  async (req, res) => {
    try {
      const {
        Userid,
        event_name,
        description,
        event_type,
        type_of_event,
        other_event_type,
        institution_name,
        mode,
        cityID,
        districtID,
        stateID,
        from_date,
        to_date,
        team_size,
        team_members,
        participation_status,
        is_other_state_event,
        is_other_country_event,
        is_certificate_available,
        achievement_details,
      } = req.body;

      console.log("Received files:", req.files);
      console.log("Location IDs:", { stateID, districtID, cityID });

      const cerFile = req.files?.cer_file?.[0]?.path.replace(/\\/g, "/") || null;
      const achievementCertFile = req.files?.achievement_certificate_file?.[0]?.path.replace(/\\/g, "/") || null;
      const cashPrizeProof = req.files?.cash_prize_proof?.[0]?.path.replace(/\\/g, "/") || null;
      const mementoProof = req.files?.memento_proof?.[0]?.path.replace(/\\/g, "/") || null;

      console.log("Received files:", {
        cerFile,
        achievementCertFile,
        cashPrizeProof,
        mementoProof,
      });

      // Validate required fields
      if (!Userid) {
        if (cerFile) fs.unlinkSync(cerFile);
        if (achievementCertFile) fs.unlinkSync(achievementCertFile);
        if (cashPrizeProof) fs.unlinkSync(cashPrizeProof);
        if (mementoProof) fs.unlinkSync(mementoProof);
        return res.status(400).json({ message: "User ID is required" });
      }

      // Validate location IDs
      if (!stateID || !districtID || !cityID) {
        if (cerFile) fs.unlinkSync(cerFile);
        if (achievementCertFile) fs.unlinkSync(achievementCertFile);
        if (cashPrizeProof) fs.unlinkSync(cashPrizeProof);
        if (mementoProof) fs.unlinkSync(mementoProof);
        return res.status(400).json({ message: "State, District, and City are required" });
      }

      const user = await User.findByPk(Userid);
      if (!user || !user.email) {
        if (cerFile) fs.unlinkSync(cerFile);
        if (achievementCertFile) fs.unlinkSync(achievementCertFile);
        if (cashPrizeProof) fs.unlinkSync(cashPrizeProof);
        if (mementoProof) fs.unlinkSync(mementoProof);
        return res.status(404).json({ message: "Student email not found" });
      }

      const student = await StudentDetails.findOne({ where: { Userid } });
      if (!student || !student.tutorEmail) {
        if (cerFile) fs.unlinkSync(cerFile);
        if (achievementCertFile) fs.unlinkSync(achievementCertFile);
        if (cashPrizeProof) fs.unlinkSync(cashPrizeProof);
        if (mementoProof) fs.unlinkSync(mementoProof);
        return res.status(404).json({ message: "Tutor email not found" });
      }

      const parsedTeamMembers = team_members && typeof team_members === "string" ? JSON.parse(team_members) : team_members;
      const parsedAchievementDetails =
        achievement_details && typeof achievement_details === "string" ? JSON.parse(achievement_details) : achievement_details;

      const eventAttended = await EventAttended.create({
        Userid,
        event_name,
        description,
        event_type,
        type_of_event,
        other_event_type,
        institution_name,
        mode,
        cityID: parseInt(cityID),
        districtID: parseInt(districtID),
        stateID: parseInt(stateID),
        from_date,
        to_date,
        team_size,
        team_members: parsedTeamMembers || [],
        participation_status,
        is_other_state_event,
        is_other_country_event,
        is_certificate_available,
        certificate_file: cerFile,
        achievement_details: parsedAchievementDetails || {},
        pending: true,
        tutor_approval_status: false,
        Approved_by: null,
        approved_at: null,
        Created_by: user.Userid,
        Updated_by: user.Userid,
      });

      // Send email to tutor for approval
      try {
        const emailResponse = await sendEmail({
          from: user.email,
          to: student.tutorEmail,
          subject: "New Event Attended Pending Approval",
          text: `Dear Tutor,

A student has submitted a new event attended for your approval. Please find the details below:

Student Regno: ${student.regno}
Student Name: ${user.username || "N/A"}
Event Name: ${event_name}
Event Type: ${event_type}
Type of Event: ${type_of_event}
Institution: ${institution_name}
Mode: ${mode}
Duration: From ${from_date} to ${to_date}
Team Size: ${team_size}
Participation Status: ${participation_status}
Certificate Available: ${is_certificate_available ? "Yes" : "No"}

The event is currently pending your approval. Please review the details and either approve or reject the event.

Best Regards,
Event Management System

Note: If you have any issues, feel free to contact the system administrator at tutorsjf@gmail.com.`,
        });

        if (!emailResponse.success) {
          console.error("⚠️ Failed to send email:", emailResponse.error);
        }
      } catch (emailError) {
        console.error("⚠️ Error sending email:", emailError);
      }

      res.status(201).json({
        message: "Event attended submitted for approval. Tutor notified.",
        eventAttended,
      });
    } catch (error) {
      console.error("❌ Error adding event attended:", error);

      if (req.files) {
        for (const fileField of Object.values(req.files)) {
          if (fileField && fileField[0] && fileField[0].path) {
            fs.unlinkSync(fileField[0].path);
          }
        }
      }

      res.status(500).json({ message: "Error adding event attended", error: error.message });
    }
  },
];

// Update an event attended
export const updateEventAttended = [
  uploadEvent,
  async (req, res) => {
    const { eventId } = req.params;
    const updateData = req.body;
    const Userid = req.user?.Userid || updateData.Userid;

    try {
      if (!Userid) {
        return res.status(400).json({ message: "User ID is required" });
      }

      if (!eventId) {
        return res.status(400).json({ message: "Event ID is required" });
      }

      const existingEvent = await EventAttended.findByPk(eventId);
      if (!existingEvent) {
        return res.status(404).json({ message: "Event not found" });
      }

      console.log("Update data received:", updateData);
      console.log("Location IDs:", { 
        stateID: updateData.stateID, 
        districtID: updateData.districtID, 
        cityID: updateData.cityID 
      });

      const fileUpdates = {};
      const filesToCleanup = [];

      const processFile = (fieldName, destProperty) => {
        if (req.files?.[fieldName]?.[0]) {
          const newPath = req.files[fieldName][0].path.replace(/\\/g, "/");
          fileUpdates[destProperty] = newPath;
          filesToCleanup.push(newPath);
          
          if (existingEvent[destProperty]) {
            try {
              fs.unlinkSync(existingEvent[destProperty]);
            } catch (err) {
              console.error(`Error deleting old ${fieldName}:`, err);
            }
          }
        }
      };

      processFile('cer_file', 'certificate_file');

      if (updateData.team_members) {
        updateData.team_members = typeof updateData.team_members === 'string' 
          ? JSON.parse(updateData.team_members) 
          : updateData.team_members;
      }

      if (updateData.achievement_details) {
        updateData.achievement_details = typeof updateData.achievement_details === 'string'
          ? JSON.parse(updateData.achievement_details)
          : updateData.achievement_details;
      }

      const updatePayload = {
        ...updateData,
        ...fileUpdates,
        cityID: updateData.cityID ? parseInt(updateData.cityID) : existingEvent.cityID,
        districtID: updateData.districtID ? parseInt(updateData.districtID) : existingEvent.districtID,
        stateID: updateData.stateID ? parseInt(updateData.stateID) : existingEvent.stateID,
        Updated_by: Userid,
        pending: true,
        tutor_approval_status: false,
        Approved_by: null,
        approved_at: null
      };

      await existingEvent.update(updatePayload);

      const updatedEvent = await EventAttended.findByPk(eventId);

      res.status(200).json({
        message: "Event updated successfully",
        eventAttended: updatedEvent
      });

    } catch (error) {
      console.error("Error updating event:", error);

      filesToCleanup.forEach(filePath => {
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (err) {
          console.error("Error cleaning up file:", err);
        }
      });

      res.status(500).json({
        message: "Failed to update event",
        error: error.message
      });
    }
  }
];

// Get pending events attended
export const getPendingEventsAttended = async (req, res) => {
  try {
    const pendingEvents = await EventAttended.findAll({
      where: { pending: true },
      include: [
        {
          model: User,
          as: "eventUser",
          attributes: ["Userid", "username", "email"],
          include: [
            {
              model: StudentDetails,
              as: "studentDetails",
              attributes: ["regno", "staffId"],
            },
          ],
        },
        {
          model: City,
          as: "city",
          attributes: ["name"],
        },
        {
          model: District,
          as: "district",
          attributes: ["name"],
        },
        {
          model: State,
          as: "state",
          attributes: ["name"],
        },
      ],
    });

    const formattedEvents = pendingEvents.map((event) => {
      const { eventUser, city, district, state, ...rest } = event.get({ plain: true });

      const fromDate = new Date(rest.from_date).toISOString().split("T")[0];
      const toDate = new Date(rest.to_date).toISOString().split("T")[0];

      const isOtherStateEvent = rest.is_other_state_event === null ? "Not Provided" : rest.is_other_state_event;
      const isOtherCountryEvent = rest.is_other_country_event === null ? "Not Provided" : rest.is_other_country_event;
      const isCertificateAvailable = rest.is_certificate_available === null ? "Not Provided" : rest.is_certificate_available;
      const certificateFile = rest.certificate_file === null ? "Not Provided" : rest.certificate_file;

      const achievementDetails = rest.achievement_details || {
        is_memento: false,
        is_cash_prize: false,
        memento_proof: null,
        cash_prize_proof: null,
        certificate_file: null,
        cash_prize_amount: "",
        is_certificate_available: false,
      };

      return {
        ...rest,
        username: eventUser?.username || "N/A",
        regno: eventUser?.studentDetails?.regno || "N/A",
        staffId: eventUser?.studentDetails?.staffId || "N/A",
        city: city?.name || "N/A",
        district: district?.name || "N/A",
        state: state?.name || "N/A",
        from_date: fromDate,
        to_date: toDate,
        team_size: rest.team_size,
        team_members: rest.team_members || [],
        participation_status: rest.participation_status,
        is_other_state_event: isOtherStateEvent,
        is_other_country_event: isOtherCountryEvent,
        is_certificate_available: isCertificateAvailable,
        certificate_file: certificateFile,
        achievement_details: achievementDetails,
      };
    });

    res.status(200).json({ success: true, events: formattedEvents });
  } catch (error) {
    console.error("Error fetching pending events:", error.message);
    res.status(500).json({ success: false, message: "Error fetching pending events" });
  }
};

// Get approved events attended
export const getApprovedEventsAttended = async (req, res) => {
  try {
    const userId = req.user?.Userid || req.query.UserId;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const approvedEvents = await EventAttended.findAll({
      where: { tutor_approval_status: true, Userid: userId },
      include: [
        {
          model: City,
          as: "city",
          attributes: ["id", "name"],
        },
        {
          model: District,
          as: "district",
          attributes: ["id", "name"],
        },
        {
          model: State,
          as: "state",
          attributes: ["id", "name"],
        },
      ],
      order: [["approved_at", "DESC"]],
    });

    return res.status(200).json(approvedEvents);
  } catch (error) {
    console.error("Error fetching approved events:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Delete an event attended
export const deleteEventAttended = async (req, res) => {
  try {
    const { id } = req.params;

    const eventAttended = await EventAttended.findByPk(id);
    if (!eventAttended) {
      return res.status(404).json({ message: "Event attended not found" });
    }

    const student = await StudentDetails.findOne({ where: { Userid: eventAttended.Userid } });
    const user = await User.findByPk(eventAttended.Userid);

    if (!user || !student) {
      return res.status(404).json({ message: "User or Student details not found" });
    }

    if (eventAttended.certificate_file) {
      fs.unlink(path.join(process.cwd(), eventAttended.certificate_file), (err) => {
        if (err) console.error("Error deleting certificate file:", err);
      });
    }

    await EventAttended.destroy({ where: { id } });

    await sendEmail({
      to: user.email,
      subject: "Event Attended Deleted Notification",
      text: `Dear ${user.username || "Student"},

Your event attended has been removed.

- **Event Name**: ${eventAttended.event_name}  
- **Institution**: ${eventAttended.institution_name}  
- **Mode**: ${eventAttended.mode}  
- **Duration**: From ${eventAttended.from_date} to ${eventAttended.to_date}  

If this was an error, contact **tutorsjf@gmail.com**.

Best,  
Event Management System`,
    });

    await sendEmail({
      to: student.tutorEmail,
      subject: "Event Attended Deleted Notification",
      text: `Dear Tutor,

The following event attended submitted by your student has been deleted:

- **Student Regno**: ${student.regno}  
- **Student Name**: ${user.username || "N/A"}  
- **Event Name**: ${eventAttended.event_name}  
- **Institution**: ${eventAttended.institution_name}  
- **Mode**: ${eventAttended.mode}  
- **Duration**: From ${eventAttended.from_date} to ${eventAttended.to_date}  

If you need further details, contact **tutorsjf@gmail.com**.

Best,  
Event Management System`,
    });

    res.status(200).json({ message: "Event attended deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting event attended:", error);
    res.status(500).json({ message: "Error deleting event attended", error });
  }
};