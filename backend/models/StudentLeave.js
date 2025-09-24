import { DataTypes } from 'sequelize';
import { sequelize } from '../config/mysql.js';

const StudentLeave = sequelize.define(
  'StudentLeave',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    Userid: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'Userid' }, // Correct reference
    },
    leave_type: {
      type: DataTypes.ENUM('Sick', 'Casual', 'Emergency'),
      allowNull: false,
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    reason: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    leave_status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending',
    },
    document: {
      type: DataTypes.STRING, 
      allowNull: true,
    },
    tutor_approval_status: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    approved_by: {
      type: DataTypes.INTEGER,
      references: { model: 'users', key: 'Userid' }, // Correct reference
      allowNull: true,
    },
    approved_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    messages: {
      type: DataTypes.JSON, // Stores approval/rejection messages
      allowNull: true,
    },
    created_by: {
      type: DataTypes.INTEGER,
      references: { model: 'users', key: 'Userid' }, // Correct reference
      allowNull: false,
    },
    updated_by: {
      type: DataTypes.INTEGER,
      references: { model: 'users', key: 'Userid' }, // Correct reference
      allowNull: true,
    },
  },
  {
    tableName: 'student_leave',
    timestamps: true,
    underscored: true, // Converts camelCase to snake_case in DB columns
  }
);

export default StudentLeave;