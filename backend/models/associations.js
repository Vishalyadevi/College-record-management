// config/associations.js
// Add these associations to your existing association file

import User from '../models/User.js';
import StudentDetails from '../models/StudentDetails.js';
import StudentEducation from '../models/StudentEducation.js';
import Department from '../models/Department.js';

// User <-> StudentDetails
User.hasOne(StudentDetails, { foreignKey: 'Userid', as: 'StudentDetails' });
StudentDetails.belongsTo(User, { foreignKey: 'Userid', as: 'User' });

// User <-> StudentEducation
User.hasOne(StudentEducation, { foreignKey: 'Userid', as: 'StudentEducation' });
StudentEducation.belongsTo(User, { foreignKey: 'Userid', as: 'User' });

// StudentDetails <-> Department
StudentDetails.belongsTo(Department, { foreignKey: 'Deptid', as: 'Department' });
Department.hasMany(StudentDetails, { foreignKey: 'Deptid', as: 'Students' });

// Export all models for easy access
export {
  User,
  StudentDetails,
  StudentEducation,
  Department,
};