import uploadEvent from "../../utils/uploadEvent.js";
import { User, StudentDetails, EventAttended } from "../../models/index.js";
import { sendEmail } from "../../utils/emailService.js";
import fs from "fs";
import path from "path";

// Add a new event attended
export const addEventAttended = async (req, res) => {
  try {
    console.log("📝 Adding new event attended...");
    console.log("Body:", req.body);
    console.log("Files:", req.files);

    const Userid = req.user?.userid || req.user?.Userid;
    
    if (!Userid) {
      console.error("❌ User ID is missing from token");
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Extract all fields
    const {
      event_name,
      description,
      event_type,
      type_of_event,
      other_event_type,
      institution_name,
      mode,
      city,
      district,
      event_state,
      from_date,
      to_date,
      team_size,
      team_members,
      participation_status,
      is_other_state_event,
      is_other_country_event,
      is_nirf_ranked,
      is_certificate_available,
      achievement_details,
    } = req.body;

    console.log("🔍 Extracted values:", { event_state, city, district, Userid });

    // Validate required fields
    if (!event_name || !description || !event_type || !type_of_event || !institution_name || !mode) {
      console.error("❌ Required fields are missing");
      return res.status(400).json({ 
        message: "All required fields must be filled",
        missing: {
          event_name: !event_name,
          description: !description,
          event_type: !event_type,
          type_of_event: !type_of_event,
          institution_name: !institution_name,
          mode: !mode
        }
      });
    }

    // Validate location text fields
    if (!event_state?.trim() || !district?.trim() || !city?.trim()) {
      console.error("❌ Location fields are missing");
      return res.status(400).json({ message: "State, District, and City are required" });
    }

    // Validate participation status
    if (!['Participation', 'Achievement'].includes(participation_status)) {
      return res.status(400).json({ message: "Invalid participation status" });
    }

    // Validate dates
    if (!from_date || !to_date) {
      console.error("❌ Dates are missing");
      return res.status(400).json({ message: "From date and to date are required" });
    }

    // Get file paths - FIXED: Handle both array and single file formats
    let cerFile = null;
    let achievementCertFile = null;
    let cashPrizeProof = null;
    let mementoProof = null;

    if (req.files) {
      // Handle certificate_file
      if (req.files.certificate_file) {
        cerFile = Array.isArray(req.files.certificate_file) 
          ? req.files.certificate_file[0]?.path.replace(/\\/g, "/")
          : req.files.certificate_file.path?.replace(/\\/g, "/");
      }

      // Handle achievement_certificate_file
      if (req.files.achievement_certificate_file) {
        achievementCertFile = Array.isArray(req.files.achievement_certificate_file)
          ? req.files.achievement_certificate_file[0]?.path.replace(/\\/g, "/")
          : req.files.achievement_certificate_file.path?.replace(/\\/g, "/");
      }

      // Handle cash_prize_proof
      if (req.files.cash_prize_proof) {
        cashPrizeProof = Array.isArray(req.files.cash_prize_proof)
          ? req.files.cash_prize_proof[0]?.path.replace(/\\/g, "/")
          : req.files.cash_prize_proof.path?.replace(/\\/g, "/");
      }

      // Handle memento_proof
      if (req.files.memento_proof) {
        mementoProof = Array.isArray(req.files.memento_proof)
          ? req.files.memento_proof[0]?.path.replace(/\\/g, "/")
          : req.files.memento_proof.path?.replace(/\\/g, "/");
      }
    }

    console.log("📎 Files received:", {
      cerFile,
      achievementCertFile,
      cashPrizeProof,
      mementoProof,
    });

    // Find user and student
    const user = await User.findByPk(Userid);
    if (!user || !user.email) {
      console.error("❌ User not found");
      // Cleanup uploaded files
      [cerFile, achievementCertFile, cashPrizeProof, mementoProof].forEach(file => {
        if (file && fs.existsSync(file)) {
          try {
            fs.unlinkSync(file);
          } catch (err) {
            console.error("Error deleting file:", err);
          }
        }
      });
      return res.status(404).json({ message: "Student email not found" });
    }

    const student = await StudentDetails.findOne({ where: { Userid } });
    if (!student) {
      console.error("❌ Student details not found");
      // Cleanup uploaded files
      [cerFile, achievementCertFile, cashPrizeProof, mementoProof].forEach(file => {
        if (file && fs.existsSync(file)) {
          try {
            fs.unlinkSync(file);
          } catch (err) {
            console.error("Error deleting file:", err);
          }
        }
      });
      return res.status(404).json({ message: "Student details not found" });
    }

    // Parse JSON fields
    let parsedTeamMembers = [];
    if (team_members) {
      try {
        parsedTeamMembers = typeof team_members === "string" ? JSON.parse(team_members) : team_members;
        if (!Array.isArray(parsedTeamMembers)) {
          parsedTeamMembers = [];
        }
      } catch (e) {
        console.error("Error parsing team_members:", e);
        parsedTeamMembers = [];
      }
    }

    let parsedAchievementDetails = {
      is_certificate_available: false,
      certificate_file: achievementCertFile,
      is_cash_prize: false,
      cash_prize_amount: "",
      cash_prize_proof: cashPrizeProof,
      is_memento: false,
      memento_proof: mementoProof,
    };

    if (achievement_details) {
      try {
        const parsed = typeof achievement_details === "string" ? JSON.parse(achievement_details) : achievement_details;
        parsedAchievementDetails = {
          is_certificate_available: parsed.is_certificate_available || false,
          certificate_file: achievementCertFile || null,
          is_cash_prize: parsed.is_cash_prize || false,
          cash_prize_amount: parsed.cash_prize_amount || "",
          cash_prize_proof: cashPrizeProof || null,
          is_memento: parsed.is_memento || false,
          memento_proof: mementoProof || null,
        };
      } catch (e) {
        console.error("Error parsing achievement_details:", e);
      }
    }

    console.log("📝 Creating event with data:", {
      Userid,
      event_name,
      event_type,
      participation_status,
      city: city.trim(),
      district: district.trim(),
      event_state: event_state.trim(),
      cerFile,
    });

    // Create event attended record
    const eventAttended = await EventAttended.create({
      Userid: parseInt(Userid),
      event_name: event_name.trim(),
      description: description.trim(),
      event_type,
      type_of_event,
      other_event_type: other_event_type || null,
      institution_name: institution_name.trim(),
      mode,
      city: city.trim(),
      district: district.trim(),
      event_state: event_state.trim(),
      from_date: new Date(from_date),
      to_date: new Date(to_date),
      team_size: parseInt(team_size) || 1,
      team_members: parsedTeamMembers,
      participation_status,
      is_other_state_event: is_other_state_event === 'true' || is_other_state_event === true,
      is_other_country_event: is_other_country_event === 'true' || is_other_country_event === true,
      is_nirf_ranked: is_nirf_ranked === 'true' || is_nirf_ranked === true,
      is_certificate_available: is_certificate_available === 'true' || is_certificate_available === true,
      certificate_file: cerFile,
      achievement_details: parsedAchievementDetails,
      pending: false,
      tutor_approval_status: true,
      Approved_by: parseInt(Userid),
      approved_at: new Date(),
      Created_by: parseInt(Userid),
      Updated_by: parseInt(Userid),
    });

    console.log("✅ Event created successfully with ID:", eventAttended.id);

    // Send email to tutor (optional - wrap in try-catch so it doesn't break the flow)
    try {
      if (student.tutorEmail) {
        await sendEmail({
          from: user.email,
          to: student.tutorEmail,
          subject: "New Event Attended Submitted",
          text: `Dear Tutor,

A student has submitted a new event attended:

Student Regno: ${student.regno}
Student Name: ${user.username || "N/A"}
Event Name: ${event_name}
Event Type: ${event_type}
Institution: ${institution_name}
Location: ${city}, ${district}, ${event_state}
Duration: ${from_date} to ${to_date}
Participation Status: ${participation_status}

Best Regards,
Event Management System`,
        });
        console.log("✅ Email sent to tutor");
      }
    } catch (emailError) {
      console.error("⚠️ Error sending email:", emailError);
      // Don't fail the request if email fails
    }

    res.status(201).json({
      message: "Event attended submitted successfully",
      eventAttended,
    });
  } catch (error) {
    console.error("❌ Error adding event attended:", error);
    console.error("Error stack:", error.stack);

    // Cleanup uploaded files on error
    if (req.files) {
      Object.values(req.files).forEach(fileArray => {
        const files = Array.isArray(fileArray) ? fileArray : [fileArray];
        files.forEach(file => {
          if (file && file.path) {
            try {
              if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
              }
            } catch (e) {
              console.error("Error cleaning up file:", e);
            }
          }
        });
      });
    }

    res.status(500).json({ 
      message: "Something went wrong!", 
      error: process.env.NODE_ENV === 'development' ? error.message : "Internal server error"
    });
  }
};

// Update an event attended
export const updateEventAttended = [
  uploadEvent,
  async (req, res) => {
    const { eventId } = req.params;
    const updateData = req.body;
    const Userid = req.user?.Userid;

    try {
      console.log("📝 Updating event ID:", eventId);
      console.log("Update data:", updateData);

      if (!Userid) {
        return res.status(400).json({ message: "User ID is required" });
      }

      if (!eventId) {
        return res.status(400).json({ message: "Event ID is required" });
      }

      const existingEvent = await EventAttended.findOne({
        where: { id: eventId, Userid: Userid }
      });

      if (!existingEvent) {
        return res.status(404).json({ message: "Event not found or access denied" });
      }

      const fileUpdates = {};
      const filesToCleanup = [];

      // Handle certificate file
      if (req.files?.cer_file?.[0]) {
        const newPath = req.files.cer_file[0].path.replace(/\\/g, "/");
        fileUpdates.certificate_file = newPath;
        
        // Delete old file
        if (existingEvent.certificate_file && fs.existsSync(existingEvent.certificate_file)) {
          try {
            fs.unlinkSync(existingEvent.certificate_file);
          } catch (err) {
            console.error("Error deleting old certificate:", err);
          }
        }
      }

      // Parse JSON fields
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

      // Handle achievement files
      if (req.files?.achievement_certificate_file?.[0]) {
        updateData.achievement_details = updateData.achievement_details || {};
        updateData.achievement_details.certificate_file = req.files.achievement_certificate_file[0].path.replace(/\\/g, "/");
      }

      if (req.files?.cash_prize_proof?.[0]) {
        updateData.achievement_details = updateData.achievement_details || {};
        updateData.achievement_details.cash_prize_proof = req.files.cash_prize_proof[0].path.replace(/\\/g, "/");
      }

      if (req.files?.memento_proof?.[0]) {
        updateData.achievement_details = updateData.achievement_details || {};
        updateData.achievement_details.memento_proof = req.files.memento_proof[0].path.replace(/\\/g, "/");
      }

      const updatePayload = {
        ...updateData,
        ...fileUpdates,
        city: updateData.city ? updateData.city.trim() : existingEvent.city,
        district: updateData.district ? updateData.district.trim() : existingEvent.district,
        event_state: updateData.event_state ? updateData.event_state.trim() : existingEvent.event_state,
        is_nirf_ranked: updateData.is_nirf_ranked === 'true' || updateData.is_nirf_ranked === true,
        is_other_state_event: updateData.is_other_state_event === 'true' || updateData.is_other_state_event === true,
        is_other_country_event: updateData.is_other_country_event === 'true' || updateData.is_other_country_event === true,
        Updated_by: Userid,
        pending: false,
        tutor_approval_status: true,
        Approved_by: Userid,
        approved_at: new Date()
      };

      await existingEvent.update(updatePayload);

      console.log("✅ Event updated successfully");

      res.status(200).json({
        message: "Event updated successfully",
        eventAttended: existingEvent
      });

    } catch (error) {
      console.error("❌ Error updating event:", error);
      res.status(500).json({
        message: "Failed to update event",
        error: error.message
      });
    }
  }
];

// Delete an event attended
export const deleteEventAttended = async (req, res) => {
  try {
    const { id } = req.params;
    const Userid = req.user?.Userid;

    if (!Userid) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const eventAttended = await EventAttended.findOne({
      where: { id, Userid }
    });

    if (!eventAttended) {
      return res.status(404).json({ message: "Event attended not found or access denied" });
    }

    // Delete certificate file if exists
    if (eventAttended.certificate_file && fs.existsSync(eventAttended.certificate_file)) {
      try {
        fs.unlinkSync(eventAttended.certificate_file);
      } catch (err) {
        console.error("Error deleting certificate file:", err);
      }
    }

    await eventAttended.destroy();

    console.log("✅ Event deleted successfully");

    res.status(200).json({ message: "Event attended deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting event attended:", error);
    res.status(500).json({ message: "Error deleting event attended", error: error.message });
  }
};

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
          as: "eventCity",
          attributes: ["name"],
        },
        {
          model: District,
          as: "eventDistrict",
          attributes: ["name"],
        },
        {
          model: State,
          as: "eventState",
          attributes: ["name"],
        },
      ],
      order: [['createdAt', 'DESC']]
    });

    const formattedEvents = pendingEvents.map((event) => {
      const { eventUser, eventCity, eventDistrict, eventState, ...rest } = event.get({ plain: true });

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
        city: eventCity?.name || "N/A",
        district: eventDistrict?.name || "N/A",
        state: eventState?.name || "N/A",
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
    console.error("Error fetching pending events:", error);
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
          as: "eventCity",
          attributes: ["id", "name"],
        },
        {
          model: District,
          as: "eventDistrict",
          attributes: ["id", "name"],
        },
        {
          model: State,
          as: "eventState",
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