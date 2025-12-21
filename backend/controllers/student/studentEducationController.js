import { User, StudentDetails, StudentEducation } from "../../models/index.js";
import { sendEmail } from "../../utils/emailService.js";
import { Op } from "sequelize";
import XLSX from "xlsx";

// Add or update student education records (STUDENTS - Only 10th, 12th, Degree)
export const addOrUpdateEducationRecord = async (req, res) => {
  try {
    const {
      Userid,
      tenth_school_name,
      tenth_board,
      tenth_percentage,
      tenth_year_of_passing,
      twelfth_school_name,
      twelfth_board,
      twelfth_percentage,
      twelfth_year_of_passing,
      degree_institution_name,
      degree_name,
      degree_specialization,
    } = req.body;

    if (!Userid) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Validate percentages
    const percentages = [tenth_percentage, twelfth_percentage];
    for (let p of percentages) {
      if (p && (p < 0 || p > 100)) {
        return res.status(400).json({ message: "Percentage must be between 0 and 100" });
      }
    }

    const user = await User.findByPk(Userid);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let education = await StudentEducation.findOne({ where: { Userid } });

    if (education) {
      // Update only basic education fields
      education.tenth_school_name = tenth_school_name ?? education.tenth_school_name;
      education.tenth_board = tenth_board ?? education.tenth_board;
      education.tenth_percentage = tenth_percentage ?? education.tenth_percentage;
      education.tenth_year_of_passing = tenth_year_of_passing ?? education.tenth_year_of_passing;
      education.twelfth_school_name = twelfth_school_name ?? education.twelfth_school_name;
      education.twelfth_board = twelfth_board ?? education.twelfth_board;
      education.twelfth_percentage = twelfth_percentage ?? education.twelfth_percentage;
      education.twelfth_year_of_passing = twelfth_year_of_passing ?? education.twelfth_year_of_passing;
      education.degree_institution_name = degree_institution_name ?? education.degree_institution_name;
      education.degree_name = degree_name ?? education.degree_name;
      education.degree_specialization = degree_specialization ?? education.degree_specialization;
      education.tutor_verification_status = false; // Reset verification
      education.Updated_by = Userid;

      await education.save();
      res.status(200).json({ message: "Education record updated and sent for approval", education });
    } else {
      // Create new record
      education = await StudentEducation.create({
        Userid,
        tenth_school_name,
        tenth_board,
        tenth_percentage,
        tenth_year_of_passing,
        twelfth_school_name,
        twelfth_board,
        twelfth_percentage,
        twelfth_year_of_passing,
        degree_institution_name,
        degree_name,
        degree_specialization,
        tutor_verification_status: false,
        Created_by: Userid,
        Updated_by: Userid,
      });
      res.status(201).json({ message: "Education record created and sent for approval", education });
    }
  } catch (error) {
    console.error("❌ Error adding/updating education record:", error);
    res.status(500).json({ message: "Error processing education record", error: error.message });
  }
};

// Get student education record
export const getEducationRecord = async (req, res) => {
  try {
    const userId = req.user?.Userid || req.query.UserId;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const education = await StudentEducation.findOne({ where: { Userid: userId } });
    if (!education) {
      return res.status(404).json({ message: "Education record not found" });
    }

    res.status(200).json({ success: true, education });
  } catch (error) {
    console.error("Error fetching education record:", error);
    res.status(500).json({ message: "Error fetching education record" });
  }
};

// Calculate semester averages
export const calculateAverages = async (req, res) => {
  try {
    const userId = req.user?.Userid || req.query.UserId;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const education = await StudentEducation.findOne({ where: { Userid: userId } });
    if (!education) {
      return res.status(404).json({ message: "Education record not found" });
    }

    const semesterGPAs = [
      education.semester_1_gpa, education.semester_2_gpa, education.semester_3_gpa,
      education.semester_4_gpa, education.semester_5_gpa, education.semester_6_gpa,
      education.semester_7_gpa, education.semester_8_gpa,
    ].filter(g => g !== null && g !== undefined);

    const averageGPA = semesterGPAs.length > 0
      ? (semesterGPAs.reduce((a, b) => a + b, 0) / semesterGPAs.length).toFixed(2)
      : 0;

    const semesterBreakdown = {
      semester_1: education.semester_1_gpa || "N/A",
      semester_2: education.semester_2_gpa || "N/A",
      semester_3: education.semester_3_gpa || "N/A",
      semester_4: education.semester_4_gpa || "N/A",
      semester_5: education.semester_5_gpa || "N/A",
      semester_6: education.semester_6_gpa || "N/A",
      semester_7: education.semester_7_gpa || "N/A",
      semester_8: education.semester_8_gpa || "N/A",
    };

    res.status(200).json({ success: true, averageGPA, cgpa: education.cgpa || "N/A", semesterBreakdown });
  } catch (error) {
    console.error("Error calculating averages:", error);
    res.status(500).json({ message: "Error calculating averages" });
  }
};

// Get all pending approval records (STAFF)
export const getPendingApprovals = async (req, res) => {
  try {
    const records = await StudentEducation.findAll({
      where: { tutor_verification_status: false },
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

    const formattedRecords = records.map((record) => {
      const { organizer, ...rest } = record.get({ plain: true });
      return {
        ...rest,
        username: organizer?.username || "N/A",
        email: organizer?.email || "N/A",
        regno: organizer?.studentDetails?.regno || "N/A",
      };
    });

    res.status(200).json({ success: true, records: formattedRecords });
  } catch (error) {
    console.error("Error fetching pending approvals:", error);
    res.status(500).json({ success: false, message: "Error fetching pending approvals" });
  }
};

// Approve education record (STAFF)
export const approveEducationRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const { Userid, comments } = req.body;

    const education = await StudentEducation.findByPk(id);
    if (!education) {
      return res.status(404).json({ message: "Education record not found" });
    }

    education.tutor_verification_status = true;
    education.Verified_by = Userid;
    education.verified_at = new Date();
    education.comments = comments || null;

    await education.save();

    // Send email notification
    const user = await User.findByPk(education.Userid);
    if (user && user.email) {
      const emailText = `Dear ${user.username},\n\nYour education record has been approved by the tutor.\n\nComments: ${comments || "None"}\n\nBest Regards,\nEducation Management System`;
      await sendEmail({ to: user.email, subject: "Education Record Approved", text: emailText });
    }

    res.status(200).json({ message: "Record approved successfully", education });
  } catch (error) {
    console.error("❌ Error approving record:", error);
    res.status(500).json({ message: "Error approving record", error: error.message });
  }
};

// Reject education record (STAFF)
export const rejectEducationRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const { Userid, reason } = req.body;

    const education = await StudentEducation.findByPk(id);
    if (!education) {
      return res.status(404).json({ message: "Education record not found" });
    }

    education.tutor_verification_status = false;
    education.comments = reason || "Rejected by tutor";
    education.Updated_by = Userid;

    await education.save();

    // Send email notification
    const user = await User.findByPk(education.Userid);
    if (user && user.email) {
      const emailText = `Dear ${user.username},\n\nYour education record has been rejected.\n\nReason: ${reason || "None provided"}\n\nPlease review and resubmit.\n\nBest Regards,\nEducation Management System`;
      await sendEmail({ to: user.email, subject: "Education Record Rejected", text: emailText });
    }

    res.status(200).json({ message: "Record rejected", education });
  } catch (error) {
    console.error("❌ Error rejecting record:", error);
    res.status(500).json({ message: "Error rejecting record", error: error.message });
  }
};

// Bulk upload GPA data via Excel (STAFF)
export const bulkUploadGPA = async (req, res) => {
  try {
    const { data } = req.body; // Array of { regno, sem1-sem8, cgpa }

    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ message: "Invalid data format" });
    }

    let successCount = 0;
    let failedRecords = [];

    for (const row of data) {
      try {
        const { regno, sem1, sem2, sem3, sem4, sem5, sem6, sem7, sem8, cgpa } = row;

        // Find user by regno
        const studentDetail = await StudentDetails.findOne({ where: { regno } });
        if (!studentDetail) {
          failedRecords.push({ regno, reason: "Student not found" });
          continue;
        }

        // Find or create education record
        let education = await StudentEducation.findOne({ where: { Userid: studentDetail.Userid } });
        
        if (education) {
          // Update GPA fields only if provided (allow partial updates)
          if (sem1 !== null && sem1 !== undefined) education.semester_1_gpa = sem1;
          if (sem2 !== null && sem2 !== undefined) education.semester_2_gpa = sem2;
          if (sem3 !== null && sem3 !== undefined) education.semester_3_gpa = sem3;
          if (sem4 !== null && sem4 !== undefined) education.semester_4_gpa = sem4;
          if (sem5 !== null && sem5 !== undefined) education.semester_5_gpa = sem5;
          if (sem6 !== null && sem6 !== undefined) education.semester_6_gpa = sem6;
          if (sem7 !== null && sem7 !== undefined) education.semester_7_gpa = sem7;
          if (sem8 !== null && sem8 !== undefined) education.semester_8_gpa = sem8;
          if (cgpa !== null && cgpa !== undefined) education.cgpa = cgpa;
          education.Updated_by = req.user.Userid;

          await education.save();
        } else {
          // Create new record with GPA data (only for provided values)
          education = await StudentEducation.create({
            Userid: studentDetail.Userid,
            semester_1_gpa: sem1 || null,
            semester_2_gpa: sem2 || null,
            semester_3_gpa: sem3 || null,
            semester_4_gpa: sem4 || null,
            semester_5_gpa: sem5 || null,
            semester_6_gpa: sem6 || null,
            semester_7_gpa: sem7 || null,
            semester_8_gpa: sem8 || null,
            cgpa: cgpa || null,
            Created_by: req.user.Userid,
            Updated_by: req.user.Userid,
          });
        }

        successCount++;
      } catch (error) {
        failedRecords.push({ regno: row.regno, reason: error.message });
      }
    }

    res.status(200).json({
      message: "Bulk upload completed",
      successCount,
      failedCount: failedRecords.length,
      failedRecords,
    });
  } catch (error) {
    console.error("❌ Error in bulk upload:", error);
    res.status(500).json({ message: "Error processing bulk upload", error: error.message });
  }
};

// Get all education records with statistics (STAFF)
export const getAllEducationRecords = async (req, res) => {
  try {
    const records = await StudentEducation.findAll({
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

    const formattedRecords = records.map((record) => {
      const { organizer, ...rest } = record.get({ plain: true });
      return {
        ...rest,
        username: organizer?.username || "N/A",
        email: organizer?.email || "N/A",
        regno: organizer?.studentDetails?.regno || "N/A",
      };
    });

    res.status(200).json({ success: true, records: formattedRecords });
  } catch (error) {
    console.error("Error fetching education records:", error.message);
    res.status(500).json({ success: false, message: "Error fetching education records" });
  }
};
