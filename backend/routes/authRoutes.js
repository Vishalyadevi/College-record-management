import express from "express";
import { login, getUserDetails, updateUserProfile, forgotPassword, resetPassword } from "../controllers/authController.js";
import { pool } from '../db/db.js'; // Import the same pool used in student education routes

const router = express.Router();

router.post("/login", login);
router.get("/get-user/:id", getUserDetails);
router.put("/update-profile/:userId", updateUserProfile);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

// Users endpoint using raw SQL (compatible with your student education routes)
router.get("/users", async (req, res) => {
  try {
    console.log('Fetching users with raw SQL...');
    
    // Use raw SQL query to get all users
    const [rows] = await pool.query(`
      SELECT 
        Userid,
        username as name,
        email,
        Deptid,
        role
      FROM users 
      WHERE role = 'Student' OR role IS NULL
      ORDER BY username ASC
    `);
    
    console.log(`Found ${rows.length} student users`);
    
    // Add batch field (set to null since it doesn't exist in your users table)
    const usersWithBatch = rows.map(user => ({
      ...user,
      batch: null // You'll need to add this field to your users table or get it from elsewhere
    }));
    
    res.status(200).json(usersWithBatch);
    
  } catch (error) {
    console.error('Error fetching users:', error);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message,
      errorType: error.name || 'UnknownError'
    });
  }
});

export default router;