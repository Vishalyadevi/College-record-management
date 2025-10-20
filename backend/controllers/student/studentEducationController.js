// controllers/student/studentEducationController.js
import { User, StudentDetails, StudentEducation } from "../../models/index.js";
import { sendEmail } from "../../utils/emailService.js";
import { Op } from "sequelize"; // Add this import

// Add or update student education records
export const addOrUpdateEducationRecord = async (req, res) => {
  try {
    const {
      Userid,
      // 10th Standard
      tenth_school_name,
      tenth_board,
      tenth_percentage,
      tenth_year_of_passing,
      // 12th Standard
      twelfth_school_name,
      twelfth_board,
      twelfth_percentage,
      twelfth_year_of_passing,
      // Degree
      degree_institution_name,
      degree_name,
      degree_specialization,
      // Semester GPA
      semester_1_gpa,
      semester_2_gpa,
      semester_3_gpa,
      semester_4_gpa,
      semester_5_gpa,
      semester_6_gpa,
      semester_7_gpa,
      semester_8_gpa,
      // Overall Grades
      gpa,
      cgpa,
      // Arrears
      has_arrears_history,
      arrears_history_count,
      arrears_history_details,
      has_standing_arrears,
      standing_arrears_count,
      standing_arrears_subjects,
    } = req.body;

    // Validate Userid
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

    // Validate GPA values (0-10)
    const gpaValues = [
      semester_1_gpa, semester_2_gpa, semester_3_gpa, semester_4_gpa,
      semester_5_gpa, semester_6_gpa, semester_7_gpa, semester_8_gpa,
      gpa, cgpa
    ];
    for (let g of gpaValues) {
      if (g && (g < 0 || g > 10)) {
        return res.status(400).json({ message: "GPA must be between 0 and 10" });
      }
    }

    // Fetch user
    const user = await User.findByPk(Userid);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if record exists
    let education = await StudentEducation.findOne({ where: { Userid } });

    if (education) {
      // Update existing record
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

      education.semester_1_gpa = semester_1_gpa ?? education.semester_1_gpa;
      education.semester_2_gpa = semester_2_gpa ?? education.semester_2_gpa;
      education.semester_3_gpa = semester_3_gpa ?? education.semester_3_gpa;
      education.semester_4_gpa = semester_4_gpa ?? education.semester_4_gpa;
      education.semester_5_gpa = semester_5_gpa ?? education.semester_5_gpa;
      education.semester_6_gpa = semester_6_gpa ?? education.semester_6_gpa;
      education.semester_7_gpa = semester_7_gpa ?? education.semester_7_gpa;
      education.semester_8_gpa = semester_8_gpa ?? education.semester_8_gpa;

      education.gpa = gpa ?? education.gpa;
      education.cgpa = cgpa ?? education.cgpa;

      education.has_arrears_history = has_arrears_history ?? education.has_arrears_history;
      education.arrears_history_count = arrears_history_count ?? education.arrears_history_count;
      education.arrears_history_details = arrears_history_details ?? education.arrears_history_details;

      education.has_standing_arrears = has_standing_arrears ?? education.has_standing_arrears;
      education.standing_arrears_count = standing_arrears_count ?? education.standing_arrears_count;
      education.standing_arrears_subjects = standing_arrears_subjects ?? education.standing_arrears_subjects;

      education.Updated_by = Userid;

      await education.save();

      res.status(200).json({
        message: "Education record updated successfully",
        education,
      });
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
        semester_1_gpa,
        semester_2_gpa,
        semester_3_gpa,
        semester_4_gpa,
        semester_5_gpa,
        semester_6_gpa,
        semester_7_gpa,
        semester_8_gpa,
        gpa,
        cgpa,
        has_arrears_history: has_arrears_history || false,
        arrears_history_count: arrears_history_count || 0,
        arrears_history_details: arrears_history_details || null,
        has_standing_arrears: has_standing_arrears || false,
        standing_arrears_count: standing_arrears_count || 0,
        standing_arrears_subjects: standing_arrears_subjects || null,
        Created_by: Userid,
        Updated_by: Userid,
      });

      res.status(201).json({
        message: "Education record created successfully",
        education,
      });
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
      education.semester_1_gpa,
      education.semester_2_gpa,
      education.semester_3_gpa,
      education.semester_4_gpa,
      education.semester_5_gpa,
      education.semester_6_gpa,
      education.semester_7_gpa,
      education.semester_8_gpa,
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

    res.status(200).json({
      success: true,
      averageGPA,
      cgpa: education.cgpa || "N/A",
      semesterBreakdown,
    });
  } catch (error) {
    console.error("Error calculating averages:", error);
    res.status(500).json({ message: "Error calculating averages" });
  }
};

// Get arrears information
export const getArrearsInformation = async (req, res) => {
  try {
    const userId = req.user?.Userid || req.query.UserId;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const education = await StudentEducation.findOne({ where: { Userid: userId } });
    if (!education) {
      return res.status(404).json({ message: "Education record not found" });
    }

    const arrearsInfo = {
      history: {
        hasHistory: education.has_arrears_history,
        count: education.arrears_history_count || 0,
        details: education.arrears_history_details || [],
      },
      standing: {
        hasStanding: education.has_standing_arrears,
        count: education.standing_arrears_count || 0,
        subjects: education.standing_arrears_subjects || [],
      },
    };

    res.status(200).json({ success: true, arrearsInfo });
  } catch (error) {
    console.error("Error fetching arrears information:", error);
    res.status(500).json({ message: "Error fetching arrears information" });
  }
};

// Get all education records (Admin/Tutor)
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

// Get education statistics (for dashboard/analytics)
export const getEducationStatistics = async (req, res) => {
  try {
    const records = await StudentEducation.findAll();

    const stats = {
      totalRecords: records.length,
      averageCGPA: records.length > 0
        ? (records.reduce((sum, r) => sum + (parseFloat(r.cgpa) || 0), 0) / records.length).toFixed(2)
        : 0,
      studentsWithArrears: records.filter(r => r.has_arrears_history).length,
      studentsWithStandingArrears: records.filter(r => r.has_standing_arrears).length,
      cgpaDistribution: {
        above9: records.filter(r => r.cgpa >= 9).length,
        between8And9: records.filter(r => r.cgpa >= 8 && r.cgpa < 9).length,
        between7And8: records.filter(r => r.cgpa >= 7 && r.cgpa < 8).length,
        between6And7: records.filter(r => r.cgpa >= 6 && r.cgpa < 7).length,
        below6: records.filter(r => r.cgpa < 6).length,
      },
    };

    res.status(200).json({ success: true, statistics: stats });
  } catch (error) {
    console.error("Error fetching statistics:", error);
    res.status(500).json({ message: "Error fetching statistics" });
  }
};

// Search students by CGPA range
export const searchByGPA = async (req, res) => {
  try {
    const { minCGPA, maxCGPA } = req.query;

    if (!minCGPA || !maxCGPA) {
      return res.status(400).json({ message: "Please provide minCGPA and maxCGPA" });
    }

    const records = await StudentEducation.findAll({
      where: {
        cgpa: {
          [Op.between]: [parseFloat(minCGPA), parseFloat(maxCGPA)], // Changed from sequelize.Op to Op
        },
      },
      include: [
        {
          model: User,
          as: "organizer",
          attributes: ["Userid", "username", "email"],
        },
      ],
    });

    res.status(200).json({ success: true, records, count: records.length });
  } catch (error) {
    console.error("Error searching by GPA:", error);
    res.status(500).json({ message: "Error searching by GPA" });
  }
};

// Get students with arrears
export const getStudentsWithArrears = async (req, res) => {
  try {
    const { type } = req.query; // 'history', 'standing', or 'both'

    let whereClause = {};
    if (type === 'history') {
      whereClause = { has_arrears_history: true };
    } else if (type === 'standing') {
      whereClause = { has_standing_arrears: true };
    } else {
      whereClause = {
        [Op.or]: [ // Changed from sequelize.Op to Op
          { has_arrears_history: true },
          { has_standing_arrears: true },
        ],
      };
    }

    const records = await StudentEducation.findAll({
      where: whereClause,
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
    });

    res.status(200).json({ success: true, records, count: records.length });
  } catch (error) {
    console.error("Error fetching students with arrears:", error);
    res.status(500).json({ message: "Error fetching students with arrears" });
  }
};

// Verify education record (Tutor/Admin)
export const verifyEducationRecord = async (req, res) => {
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

    // Send verification email to student
    const user = await User.findByPk(education.Userid);
    if (user && user.email) {
      const emailText = `Dear ${user.username},\n\nYour education record has been verified.\n\nCGPA: ${education.cgpa || "N/A"}\nDegree: ${education.degree_name || "N/A"}\n\nComments: ${comments || "None"}\n\nBest Regards,\nEducation Management System`;

      await sendEmail({
        to: user.email,
        subject: "Education Record Verified",
        text: emailText,
      });
    }

    res.status(200).json({ message: "Record verified successfully", education });
  } catch (error) {
    console.error("❌ Error verifying record:", error);
    res.status(500).json({ message: "Error verifying record", error: error.message });
  }
};