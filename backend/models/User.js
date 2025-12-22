import { DataTypes } from 'sequelize';
import { sequelize } from '../config/mysql.js';

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
      validate: {
        isEmail: {
          msg: 'Must be a valid email address'
        }
      }
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM(
        'Student', 
        'Staff', 
        'DeptAdmin', 
        'SuperAdmin', 
        'IrAdmin', 
        'PgAdmin', 
        'AcademicAdmin', 
        'NewgenAdmin',
        'PlacementAdmin'
      ),
      allowNull: false,
      defaultValue: 'Student'
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
      allowNull: true,
      references: { 
        model: 'department', 
        key: 'Deptid' 
      }
    },
    image: {
      type: DataTypes.STRING(500),
      defaultValue: '/uploads/default.jpg',
    },
    resetPasswordToken: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    resetPasswordExpires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    skillrackProfile: {
      type: DataTypes.STRING(255),
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
    indexes: [
      {
        unique: true,
        fields: ['email']
      },
      {
        fields: ['role']
      },
      {
        fields: ['status']
      },
      {
        fields: ['Deptid']
      }
    ]
  }
);

export default User;