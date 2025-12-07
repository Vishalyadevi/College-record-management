import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import multer from 'multer';
import path from 'path';
import { sendEmail } from '../utils/emailService.js';
import { Op } from 'sequelize';

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage });

// Login Controller
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Email and password are required' 
      });
    }

    // Find user by email
    const user = await User.findOne({
      where: { email },
      attributes: ['Userid', 'username', 'email', 'password', 'role', 'image', 'staffId', 'Deptid', 'status'],
    });

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Check if account is active
    if (user.status !== 'active') {
      return res.status(403).json({ 
        success: false,
        message: 'Account is inactive. Please contact administrator.' 
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        Userid: user.Userid, 
        role: user.role,
        email: user.email 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Set cookie
    res.cookie('token', token, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    // Prepare response
    const response = {
      success: true,
      message: 'Login successful',
      token,
      user: {
        Userid: user.Userid,
        username: user.username,
        email: user.email,
        role: user.role,
        profileImage: user.image || '/uploads/default.jpg',
        Deptid: user.Deptid,
      }
    };

    // Include staffId for Staff role
    if (user.role === 'Staff' && user.staffId) {
      response.user.staffId = user.staffId;
    }

    return res.status(200).json(response);

  } catch (error) {
    console.error('❌ Login error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Internal server error' 
    });
  }
};

// Get User Details
export const getUserDetails = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID is required' 
      });
    }

    const user = await User.findOne({
      where: { Userid: id },
      attributes: ['Userid', 'username', 'role', 'image', 'email', 'Deptid', 'staffId', 'status'],
    });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        Userid: user.Userid,
        username: user.username,
        role: user.role,
        profileImage: user.image,
        email: user.email,
        Deptid: user.Deptid,
        staffId: user.staffId,
        status: user.status
      },
    });

  } catch (error) {
    console.error('❌ Error fetching user details:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// Update User Profile
export const updateUserProfile = async (req, res) => {
  upload.single('image')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ 
        success: false, 
        message: 'File upload failed' 
      });
    }

    try {
      const { userId } = req.params;
      const { password, username } = req.body;
      const image = req.file ? `/uploads/${req.file.filename}` : null;

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }

      let updateData = {};
      
      if (password) {
        const salt = await bcrypt.genSalt(10);
        updateData.password = await bcrypt.hash(password, salt);
      }
      
      if (image) {
        updateData.image = image;
      }
      
      if (username) {
        updateData.username = username;
      }

      updateData.Updated_by = req.user?.Userid || userId;

      await User.update(updateData, { where: { Userid: userId } });

      res.json({ 
        success: true, 
        message: 'Profile updated successfully', 
        profileImage: image || user.image 
      });

    } catch (error) {
      console.error('❌ Error updating profile:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error' 
      });
    }
  });
};

// Generate Reset Token
const generateResetToken = (Userid) => {
  return jwt.sign({ Userid }, process.env.JWT_SECRET, { expiresIn: '24h' });
};

// Verify Reset Token
const verifyResetToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new Error('The password reset link has expired. Please request a new one.');
    }
    throw new Error('Invalid or corrupted password reset link.');
  }
};

// Forgot Password
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ 
        success: false,
        message: 'Email is required' 
      });
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Generate reset token
    const token = generateResetToken(user.Userid);

    // Save token and expiry in database
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    await user.save();

    // Send email with reset link
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5174'}/reset-password/${token}`;
    
    await sendEmail({
      to: email,
      subject: 'Password Reset Request',
      html: `
        <h2>Password Reset Request</h2>
        <p>You are receiving this because you (or someone else) have requested to reset your password.</p>
        <p>Please click on the following link, or paste it into your browser to complete the process:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>This link will expire in 24 hours.</p>
        <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
      `,
    });

    res.status(200).json({ 
      success: true,
      message: 'Password reset email sent successfully' 
    });

  } catch (error) {
    console.error('❌ Error in forgotPassword:', error.message);
    res.status(500).json({ 
      success: false,
      message: 'Failed to send reset email. Please try again.' 
    });
  }
};

// Reset Password
export const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    if (!password || password.length < 6) {
      return res.status(400).json({ 
        success: false,
        message: 'Password must be at least 6 characters long' 
      });
    }

    // Verify token and extract Userid
    const decoded = verifyResetToken(token);
    const Userid = decoded.Userid;

    if (!Userid) {
      throw new Error('Invalid token: Userid is missing');
    }

    // Find user by Userid and reset token
    const user = await User.findOne({
      where: {
        Userid: Userid,
        resetPasswordToken: token,
        resetPasswordExpires: { [Op.gt]: Date.now() },
      },
    });

    if (!user) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid or expired token' 
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password and clear reset token
    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.status(200).json({ 
      success: true,
      message: 'Password updated successfully' 
    });

  } catch (error) {
    console.error('❌ Error in resetPassword:', error.message);

    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({ 
        success: false,
        message: 'The password reset link has expired. Please request a new one.' 
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid or corrupted password reset link.' 
      });
    }

    return res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to reset password' 
    });
  }
};

// Logout
export const logout = async (req, res) => {
  try {
    res.clearCookie('token');
    return res.status(200).json({ 
      success: true,
      message: 'Logout successful' 
    });
  } catch (error) {
    console.error('❌ Logout error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Logout failed' 
    });
  }
};