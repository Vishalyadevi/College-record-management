// import jwt from 'jsonwebtoken';
// import dotenv from 'dotenv';
// import User from '../models/User.js';

// dotenv.config();

// export const authenticate = async (req, res, next) => {
//   try {
//     const authHeader = req.headers.authorization;

//     if (!authHeader || !authHeader.startsWith('Bearer ')) {
//       console.log("❌ No token found in header!");
//       return res.status(401).json({ message: 'Unauthorized: No token provided' });
//     }

//     const token = authHeader.split(' ')[1];

//     if (!process.env.JWT_SECRET) {
//       console.error("❌ JWT_SECRET is missing in environment variables!");
//       return res.status(500).json({ message: "Internal Server Error: Missing JWT secret" });
//     }

//     // ✅ Decode JWT
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);

//     // ✅ Ensure correct key used — 'Userid' must match what was signed in token
//     const user = await User.findOne({ where: { Userid: decoded.Userid } });

//     if (!user) {
//       console.log("❌ User not found in database!");
//       return res.status(401).json({ message: 'Unauthorized: User not found' });
//     }

//     if (user.status !== 'active') {
//       console.log("❌ User account is inactive!");
//       return res.status(403).json({ message: 'Account is inactive. Access denied.' });
//     }

//     // ✅ Attach full user object to req
//     req.user = user;

//     next(); // Proceed to next middleware or controller

//   } catch (err) {
//     console.error('❌ Token verification failed:', err.message);
//     return res.status(403).json({ message: 'Invalid or expired token' });
//   }
// };


import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { pool } from '../db/db.js';

dotenv.config();

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    console.log('🔍 Auth Header:', authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log("❌ No token found in header!");
      return res.status(401).json({ 
        success: false,
        message: 'Unauthorized: No token provided' 
      });
    }

    const token = authHeader.split(' ')[1];
    
    // Check if token is actually present after split
    if (!token || token === 'null' || token === 'undefined') {
      console.log("❌ Token is null or undefined!");
      return res.status(401).json({ 
        success: false,
        message: 'Unauthorized: Invalid token format' 
      });
    }

    console.log('🔑 Token received:', token.substring(0, 20) + '...');

    if (!process.env.JWT_SECRET) {
      console.error("❌ JWT_SECRET is missing in environment variables!");
      return res.status(500).json({ 
        success: false,
        message: "Internal Server Error: Missing JWT secret" 
      });
    }

    // ✅ Decode and verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Decoded token:', decoded);

    // Check what field is in the token (might be 'id', 'userId', 'Userid', etc.)
    const userId = decoded.Userid || decoded.userId || decoded.id;
    
    if (!userId) {
      console.log("❌ No user ID found in token! Token payload:", decoded);
      return res.status(401).json({ 
        success: false,
        message: 'Unauthorized: Invalid token payload' 
      });
    }

    // ✅ Query user from database using raw SQL
    const [users] = await pool.query(
      'SELECT * FROM users WHERE Userid = ? LIMIT 1',
      [userId]
    );

    if (!users || users.length === 0) {
      console.log(`❌ User not found in database! Userid: ${userId}`);
      return res.status(401).json({ 
        success: false,
        message: 'Unauthorized: User not found' 
      });
    }

    const user = users[0];

    if (user.status && user.status !== 'active') {
      console.log("❌ User account is inactive!");
      return res.status(403).json({ 
        success: false,
        message: 'Account is inactive. Access denied.' 
      });
    }

    // ✅ Attach user object to req
    req.user = {
      Userid: user.Userid,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status
    };

    console.log('✅ User authenticated:', req.user.username);

    next(); // Proceed to next middleware or controller

  } catch (err) {
    console.error('❌ Token verification failed:', err.message);
    
    if (err.name === 'JsonWebTokenError') {
      return res.status(403).json({ 
        success: false,
        message: 'Invalid token format' 
      });
    }
    
    if (err.name === 'TokenExpiredError') {
      return res.status(403).json({ 
        success: false,
        message: 'Token has expired. Please login again.' 
      });
    }
    
    return res.status(403).json({ 
      success: false,
      message: 'Token verification failed' 
    });
  }
};

// Optional: Middleware to check if user is admin
export const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ 
      success: false,
      message: 'Access denied. Admin privileges required.' 
    });
  }
};

// Optional: Middleware to check if user is faculty
export const isFaculty = (req, res, next) => {
  if (req.user && (req.user.role === 'faculty' || req.user.role === 'admin')) {
    next();
  } else {
    return res.status(403).json({ 
      success: false,
      message: 'Access denied. Faculty privileges required.' 
    });
  }
};