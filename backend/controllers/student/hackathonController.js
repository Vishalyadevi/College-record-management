import HackathonEvent from "../../models/HackathonEvent.js";

// GET: fetch student hackathon events
export const getStudentEvents = async (req, res) => {
  try {
    const { UserId } = req.query;

    if (!UserId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const userEvents = await HackathonEvent.findAll({
      where: { Userid: UserId },
      order: [['createdAt', 'DESC']]
    });

    // Add hasCertificate field to each event
    const eventsWithCertificateFlag = userEvents.map(event => {
      const eventData = event.toJSON();
      return {
        ...eventData,
        hasCertificate: eventData.certificate !== null && eventData.certificate !== undefined,
        certificate: undefined // Remove the actual certificate data from the response
      };
    });

    res.status(200).json({
      success: true,
      events: eventsWithCertificateFlag,
    });
  } catch (error) {
    console.error('Error fetching student hackathon events:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// POST: add hackathon event
export const addHackathonEvent = async (req, res) => {
  try {
    const { Userid, event_name, organized_by, from_date, to_date, level_cleared, rounds, status } = req.body;

    if (!Userid || !event_name || !organized_by || !from_date || !to_date || !level_cleared || !rounds || !status) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided",
      });
    }

    const newEvent = await HackathonEvent.create({
      Userid,
      event_name,
      organized_by,
      from_date,
      to_date,
      level_cleared: parseInt(level_cleared),
      rounds: parseInt(rounds),
      status,
      Created_by: Userid,
      Updated_by: Userid,
      certificate: req.file ? req.file.buffer : null
    });

    const eventData = newEvent.toJSON();
    
    res.status(201).json({
      success: true,
      message: "Hackathon event added successfully",
      data: {
        ...eventData,
        hasCertificate: eventData.certificate !== null,
        certificate: undefined
      },
    });
  } catch (error) {
    console.error('Error adding hackathon event:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// PUT: update hackathon event
export const updateHackathonEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { Userid, event_name, organized_by, from_date, to_date, level_cleared, rounds, status } = req.body;

    const event = await HackathonEvent.findByPk(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Hackathon event not found",
      });
    }

    // Check if the event is still pending (not approved/rejected)
    if (!event.pending) {
      return res.status(403).json({
        success: false,
        message: "Cannot update approved or rejected events",
      });
    }

    await event.update({
      event_name: event_name || event.event_name,
      organized_by: organized_by || event.organized_by,
      from_date: from_date || event.from_date,
      to_date: to_date || event.to_date,
      level_cleared: level_cleared ? parseInt(level_cleared) : event.level_cleared,
      rounds: rounds ? parseInt(rounds) : event.rounds,
      status: status || event.status,
      Updated_by: Userid || event.Updated_by,
      certificate: req.file ? req.file.buffer : event.certificate
    });

    const eventData = event.toJSON();

    res.status(200).json({
      success: true,
      message: "Hackathon event updated successfully",
      data: {
        ...eventData,
        hasCertificate: eventData.certificate !== null,
        certificate: undefined
      },
    });
  } catch (error) {
    console.error('Error updating hackathon event:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// DELETE: delete hackathon event
export const deleteHackathonEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await HackathonEvent.findByPk(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Hackathon event not found",
      });
    }

    // Check if the event is still pending (not approved/rejected)
    if (!event.pending) {
      return res.status(403).json({
        success: false,
        message: "Cannot delete approved or rejected events",
      });
    }

    await event.destroy();

    res.status(200).json({
      success: true,
      message: "Hackathon event deleted successfully",
    });
  } catch (error) {
    console.error('Error deleting hackathon event:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const approveHackathonEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { Userid, comments } = req.body;

    const event = await HackathonEvent.findByPk(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Hackathon event not found",
      });
    }

    await event.update({
      tutor_approval_status: true,
      Approved_by: Userid,
      approved_at: new Date(),
      comments: comments || null,
      pending: false
    });

    const eventData = event.toJSON();

    res.status(200).json({
      success: true,
      message: "Hackathon event approved",
      data: {
        ...eventData,
        hasCertificate: eventData.certificate !== null,
        certificate: undefined
      },
    });
  } catch (error) {
    console.error('Error approving hackathon event:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getApprovedHackathonEvents = async (req, res) => {
  try {
    const approvedEvents = await HackathonEvent.findAll({
      where: { tutor_approval_status: true },
      order: [['approved_at', 'DESC']]
    });

    const eventsWithCertificateFlag = approvedEvents.map(event => {
      const eventData = event.toJSON();
      return {
        ...eventData,
        hasCertificate: eventData.certificate !== null,
        certificate: undefined
      };
    });

    res.status(200).json({
      success: true,
      data: eventsWithCertificateFlag,
    });
  } catch (error) {
    console.error('Error fetching approved hackathon events:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getCertificate = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await HackathonEvent.findByPk(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Hackathon event not found",
      });
    }

    if (!event.certificate) {
      return res.status(404).json({
        success: false,
        message: "No certificate available for this event",
      });
    }

    // Determine content type based on the first few bytes
    const buffer = event.certificate;
    let contentType = 'application/pdf';
    
    // Check if it's a JPEG
    if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
      contentType = 'image/jpeg';
    }
    // Check if it's a PNG
    else if (buffer[0] === 0x89 && buffer[1] === 0x50) {
      contentType = 'image/png';
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${event.event_name}_certificate"`);
    res.send(buffer);
  } catch (error) {
    console.error('Error fetching certificate:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getPendingHackathonEvents = async (req, res) => {
  try {
    const pendingHackathons = await HackathonEvent.findAll({
      where: { pending: true },
      order: [['createdAt', 'DESC']]
    });

    const eventsWithCertificateFlag = pendingHackathons.map(event => {
      const eventData = event.toJSON();
      return {
        ...eventData,
        hasCertificate: eventData.certificate !== null,
        certificate: undefined
      };
    });

    res.status(200).json({
      success: true,
      data: eventsWithCertificateFlag,
    });
  } catch (error) {
    console.error('Error fetching pending hackathon events:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getStudentHackathonEvents = async (req, res) => {
  try {
    const userId = req.user.Userid;

    const studentHackathons = await HackathonEvent.findAll({
      where: { Userid: userId },
      order: [['createdAt', 'DESC']]
    });

    const eventsWithCertificateFlag = studentHackathons.map(event => {
      const eventData = event.toJSON();
      return {
        ...eventData,
        hasCertificate: eventData.certificate !== null,
        certificate: undefined
      };
    });

    res.status(200).json({
      success: true,
      events: eventsWithCertificateFlag,
    });
  } catch (error) {
    console.error('Error fetching student hackathon events:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const rejectHackathonEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { Userid, comments } = req.body;

    const event = await HackathonEvent.findByPk(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Hackathon event not found",
      });
    }

    await event.update({
      tutor_approval_status: false,
      Approved_by: Userid,
      approved_at: new Date(),
      comments: comments || null,
      pending: false
    });

    const eventData = event.toJSON();

    res.status(200).json({
      success: true,
      message: "Hackathon event rejected successfully",
      data: {
        ...eventData,
        hasCertificate: eventData.certificate !== null,
        certificate: undefined
      },
    });
  } catch (error) {
    console.error('Error rejecting hackathon event:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};