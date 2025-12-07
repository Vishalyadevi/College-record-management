import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { pool } from '../db/db.js';

dotenv.config();

// Main authentication middleware
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    console.log('🔍 Auth Header:', authHeader ? 'Present' : 'Missing');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No token found in header!');
      return res.status(401).json({ 
        success: false,
        message: 'Unauthorized: No token provided' 
      });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token || token === 'null' || token === 'undefined') {
      console.log('❌ Token is null or undefined!');
      return res.status(401).json({ 
        success: false,
        message: 'Unauthorized: Invalid token format' 
      });
    }

    console.log('🔑 Token received:', token.substring(0, 20) + '...');

    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET is missing in environment variables!');
      return res.status(500).json({ 
        success: false,
        message: 'Internal Server Error: Missing JWT secret' 
      });
    }

    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Decoded token:', decoded);

    const userId = decoded.Userid || decoded.userId || decoded.id;
    
    if (!userId) {
      console.log('❌ No user ID found in token! Token payload:', decoded);
      return res.status(401).json({ 
        success: false,
        message: 'Unauthorized: Invalid token payload' 
      });
    }

    // Query user from database
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
      console.log('❌ User account is inactive!');
      return res.status(403).json({ 
        success: false,
        message: 'Account is inactive. Access denied.' 
      });
    }

    // Attach user object to req
    req.user = {
      Userid: user.Userid,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      Deptid: user.Deptid,
      staffId: user.staffId,
      image: user.image
    };

    console.log('✅ User authenticated:', req.user.username, '| Role:', req.user.role);

    next();

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

// Role-based authorization middleware
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: 'Unauthorized: User not authenticated' 
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      console.log(`❌ Access denied for role: ${req.user.role}. Required: ${allowedRoles.join(', ')}`);
      return res.status(403).json({ 
        success: false,
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}` 
      });
    }

    console.log(`✅ Role authorized: ${req.user.role}`);
    next();
  };
};

// Specific role middlewares
export const isSuperAdmin = (req, res, next) => {
  return authorize('SuperAdmin')(req, res, next);
};

export const isAdmin = (req, res, next) => {
  return authorize('SuperAdmin', 'DeptAdmin', 'AcademicAdmin', 'IrAdmin', 'PgAdmin', 'NewgenAdmin', 'PlacementAdmin')(req, res, next);
};

export const isDeptAdmin = (req, res, next) => {
  return authorize('SuperAdmin', 'DeptAdmin')(req, res, next);
};

export const isStaff = (req, res, next) => {
  return authorize('Staff', 'SuperAdmin', 'DeptAdmin', 'AcademicAdmin')(req, res, next);
};

export const isAcademicAdmin = (req, res, next) => {
  return authorize('SuperAdmin', 'AcademicAdmin')(req, res, next);
};

export const isIrAdmin = (req, res, next) => {
  return authorize('SuperAdmin', 'IrAdmin')(req, res, next);
};

export const isPgAdmin = (req, res, next) => {
  return authorize('SuperAdmin', 'PgAdmin')(req, res, next);
};

export const isNewgenAdmin = (req, res, next) => {
  return authorize('SuperAdmin', 'NewgenAdmin')(req, res, next);
};

export const isPlacementAdmin = (req, res, next) => {
  return authorize('SuperAdmin', 'PlacementAdmin')(req, res, next);
};

// Department-based authorization
export const checkDepartmentAccess = async (req, res, next) => {
  try {
    const { departmentId } = req.params;
    const user = req.user;

    // SuperAdmin has access to all departments
    if (user.role === 'SuperAdmin') {
      return next();
    }

    // DeptAdmin can only access their own department
    if (user.role === 'DeptAdmin' && user.Deptid !== parseInt(departmentId)) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied: You can only access your own department' 
      });
    }

    next();
  } catch (error) {
    console.error('❌ Error checking department access:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Internal server error' 
    });
  }
};

export default {
  authenticate,
  authorize,
  isSuperAdmin,
  isAdmin,
  isDeptAdmin,
  isStaff,
  isAcademicAdmin,
  isIrAdmin,
  isPgAdmin,
  isNewgenAdmin,
  isPlacementAdmin,
  checkDepartmentAccess
};