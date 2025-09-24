import { DataTypes } from 'sequelize';
import { sequelize } from '../config/mysql.js';
import User from './User.js'; // Ensure User model is imported

const Extracurricular = sequelize.define('Extracurricular', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  Userid: { 
    type: DataTypes.INTEGER, 
    allowNull: false, 
    references: { model: User, key: 'Userid' } // ✅ Foreign key to User model
  },
  activity_name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { timestamps: false, tableName: 'extracurricular_activities' });

export default Extracurricular;