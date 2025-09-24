import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import multer from "multer";
import path from "path";
import { sendEmail } from '../utils/emailService.js';
import { Op } from 'sequelize'; // Correct import for Op
//import db from "../config/db.js";


// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage });
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({
      where: { email },
      attributes: ['Userid', 'username', 'password', 'role', 'image', 'staffId','Deptid'], // Include staffId in attributes
    });

    if (!user) return res.status(404).json({ message: 'User not found' });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { Userid: user.Userid, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });

    // Prepare the response object
    const response = {
      message: 'Login successful',
      token,
      role: user.role,
      Userid: user.Userid,
      profileImage: user.image || 'https://via.placeholder.com/40',
      Deptid:user.Deptid,
    };
   
    // Include staffId in the response if the role is 'staff'
    if (user.role === 'Staff') {
      response.staffId = user.staffId;
    }
   
    return res.status(200).json(response);
  } catch (error) {
    console.error('❌ Login error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getUserDetails = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    const user = await User.findOne({
      where: { Userid: id },
      attributes: ["Userid", "username", "role", "image", "email"],
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      user: {
        Userid: user.Userid,
        username: user.username,
        role: user.role,
        profileImage: user.image,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Error fetching user details:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const updateUserProfile = async (req, res) => {
  upload.single("image")(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: "File upload failed" });
    }

    try {
      const { userId } = req.params;
      const { password } = req.body;
      const image = req.file ? `/uploads/${req.file.filename}` : null;

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      let updateData = {};
      if (password) {
        const salt = await bcrypt.genSalt(10);
        updateData.password = await bcrypt.hash(password, salt);
      }
      if (image) updateData.image = image;

      await User.update(updateData, { where: { Userid: userId } });

      res.json({ success: true, message: "Profile updated successfully", profileImage: image });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  });
};

const generateResetToken = (Userid) => {
  return jwt.sign({ Userid }, process.env.JWT_SECRET, { expiresIn: '24h' });
};

const verifyResetToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded; // Return the decoded token payload
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new Error('The password reset link has expired. Please request a new one.');
    }
    throw new Error('Invalid or corrupted password reset link.');
  }
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate reset token with Userid in the payload
    const token = generateResetToken(user.Userid);

    // Save token and expiry in the database
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    await user.save();

    // Send email with reset link
    const resetUrl = `http://localhost:5174/reset-password/${token}`;
    await sendEmail({
      to: email,
      subject: 'Password Reset',
      html: `You are receiving this because you (or someone else) have requested the reset of the password for your account.<br><br>
        Please click on the following link, or paste this into your browser to complete the process:<br><br>
        <a href="${resetUrl}">${resetUrl}</a><br><br>
        If you did not request this, please ignore this email and your password will remain unchanged.`,
    });

    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('❌ Error in forgotPassword:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

export const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    // Verify the token and extract the Userid
    const decoded = verifyResetToken(token);
    const Userid = decoded.Userid;

    if (!Userid) {
      throw new Error('Invalid token: Userid is missing');
    }

    // Find the user by Userid and reset token
    const user = await User.findOne({
      where: {
        Userid: Userid, // Use Userid from the token
        resetPasswordToken: token,
        resetPasswordExpires: { [Op.gt]: Date.now() }, // Check if token is not expired
      },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password and clear reset token
    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('❌ Error in resetPassword:', error.message);

    // Handle specific JWT errors
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({ message: 'The password reset link has expired. Please request a new one.' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(400).json({ message: 'Invalid or corrupted password reset link.' });
    }

    // Generic error response
    return res.status(500).json({ message: error.message });
  }
};