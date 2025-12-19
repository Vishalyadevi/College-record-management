import multer from 'multer';
import path from 'path';
import express from 'express';
import { EventAttended } from '../../models/index.js';

const router = express.Router();
// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/certificates/'); // make sure folder exists
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Define fields you expect files for
const uploadFields = upload.fields([
  { name: 'cer_file', maxCount: 1 },
  { name: 'achievement_certificate_file', maxCount: 1 },
  { name: 'cash_prize_proof', maxCount: 1 },
  { name: 'memento_proof', maxCount: 1 },
]);

// Your route
router.post('/add-event-attended', uploadFields, async (req, res) => {
  try {
    console.log("Body:", req.body);         // ← Should now show all text fields
    console.log("Files:", req.files);        // ← Should show uploaded files

    const {
      event_name,
      description,
      event_type,
      type_of_event,
      institution_name,
      mode,
      city,
      district,
      state,
      from_date,
      to_date,
      team_size,
      participation_status,
      is_nirf_ranked,
      is_other_state_event,
      is_other_country_event,
      is_certificate_available,
      team_members,
      achievement_details,
      Userid,
    } = req.body;

    // Parse JSON fields
    const parsedTeamMembers = team_members ? JSON.parse(team_members) : [];
    const parsedAchievementDetails = achievement_details ? JSON.parse(achievement_details) : {};

    // Handle file paths
    let certificate_file = null;
    if (req.files['cer_file']) {
      certificate_file = `/uploads/certificates/${req.files['cer_file'][0].filename}`;
    }

    // Handle achievement files
    if (req.files['achievement_certificate_file']) {
      parsedAchievementDetails.certificate_file = `/uploads/certificates/${req.files['achievement_certificate_file'][0].filename}`;
    }
    if (req.files['cash_prize_proof']) {
      parsedAchievementDetails.cash_prize_proof = `/uploads/certificates/${req.files['cash_prize_proof'][0].filename}`;
    }
    if (req.files['memento_proof']) {
      parsedAchievementDetails.memento_proof = `/uploads/certificates/${req.files['memento_proof'][0].filename}`;
    }

    // Now create the record
    const newEvent = await EventAttended.create({
      Userid: parseInt(Userid),
      event_name,
      description,
      event_type,
      type_of_event,
      institution_name,
      mode,
      city: city?.trim(),
      district: district?.trim(),
      state: state?.trim(),
      from_date,
      to_date,
      team_size: parseInt(team_size),
      team_members: parsedTeamMembers,
      participation_status,
      is_nirf_ranked: is_nirf_ranked === 'true',
      is_other_state_event: is_other_state_event === 'true',
      is_other_country_event: is_other_country_event === 'true',
      is_certificate_available: is_certificate_available === 'true',
      certificate_file,
      achievement_details: parsedAchievementDetails,
      Created_by: parseInt(Userid),
      pending: true,
    });

    res.status(201).json({ message: "Event added successfully", event: newEvent });
  } catch (error) {
    console.error("Error adding event:", error);
    res.status(400).json({ message: error.message || "Failed to add event" });
  }
});
export default router;