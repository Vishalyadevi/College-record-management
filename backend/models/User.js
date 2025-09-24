import { DataTypes } from 'sequelize';
import { sequelize } from '../config/mysql.js';
import Department from './Department.js';

const User = sequelize.define(
  'User',
  {
    Userid: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('Student', 'Staff', 'Admin'),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active',
    },
    staffId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      unique: true,
     
    },    
    Deptid: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "department", key: 'Deptid' }
    },
    image: {
      type: DataTypes.STRING(500),
      defaultValue: '/uploads/default.jpg',
    },
    resetPasswordToken: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    resetPasswordExpires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    skillrackProfile: {  // Add this line
      type: DataTypes.STRING,
      allowNull: true,
    },


    Created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'Userid',
      },
      onDelete: 'SET NULL',
    },
    Updated_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'Userid',
      },
      onDelete: 'SET NULL',
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at',
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: 'updated_at',
      defaultValue: DataTypes.NOW,
    },
  },
  {
    timestamps: true,
    tableName: 'users',
    freezeTableName: true,
  }
);

export default User;