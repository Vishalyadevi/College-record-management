import { DataTypes } from 'sequelize';
import { sequelize } from '../config/mysql.js'; // Adjust the path to your Sequelize instance

// Define the Scholarship model
const Scholarship = sequelize.define('Scholarship', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  Userid: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users', // References the users table
      key: 'Userid',
    },
    onDelete: 'CASCADE',
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  provider: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('Merit-Based', 'Need-Based', 'Sports', 'Other'),
    allowNull: false,
  },
  customType: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  year: {
    type: DataTypes.ENUM('1st Year', '2nd Year', '3rd Year', '4th Year'),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('Applied', 'Received'),
    allowNull: false,
  },
  appliedDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  receivedAmount: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  receivedDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
 
  Created_by: { 
    type: DataTypes.INTEGER, 
    references: { model: "users", key: 'Userid' },
    field: 'Created_by'
  },
  Updated_by: { 
    type: DataTypes.INTEGER, 
    references: { model: "users", key: 'Userid' },
    field: 'Updated_by'
  },
  pending: { 
    type: DataTypes.BOOLEAN, 
    defaultValue: true 
  },
  tutor_approval_status: { 
    type: DataTypes.BOOLEAN, 
    defaultValue: false 
  },
  Approved_by: { 
    type: DataTypes.INTEGER,
    references: { model: "users", key: 'Userid' },
    field: 'Approved_by'
  },
  approved_at: { type: DataTypes.DATE },
  messages: { type: DataTypes.JSON }, 

  createdAt: { 
    type: DataTypes.DATE, 
    field: 'created_at', 
    defaultValue: DataTypes.NOW 
  },
  updatedAt: { 
    type: DataTypes.DATE, 
    field: 'updated_at', 
    defaultValue: DataTypes.NOW 
  }
},  {
  timestamps: true, // Automatically adds createdAt and updatedAt fields
  tableName: 'scholarships', // Table name in the database
});

// Export the Scholarship model
export default Scholarship;