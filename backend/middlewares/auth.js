import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log("❌ No token found in header!");
      return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];

    if (!process.env.JWT_SECRET) {
      console.error("❌ JWT_SECRET is missing in environment variables!");
      return res.status(500).json({ message: "Internal Server Error: Missing JWT secret" });
    }

    // ✅ Decode JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Ensure correct key used — 'Userid' must match what was signed in token
    const user = await User.findOne({ where: { Userid: decoded.Userid } });

    if (!user) {
      console.log("❌ User not found in database!");
      return res.status(401).json({ message: 'Unauthorized: User not found' });
    }

    if (user.status !== 'active') {
      console.log("❌ User account is inactive!");
      return res.status(403).json({ message: 'Account is inactive. Access denied.' });
    }

    // ✅ Attach full user object to req
    req.user = user;

    next(); // Proceed to next middleware or controller

  } catch (err) {
    console.error('❌ Token verification failed:', err.message);
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};
