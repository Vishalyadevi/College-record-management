import { DataTypes } from 'sequelize';
import { sequelize } from '../config/mysql.js';
import User from './User.js';

const StaffDetails = sequelize.define('StaffDetails', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  Userid: { type: DataTypes.INTEGER, allowNull: false, references: { model: "users", key: 'Userid' } },
  full_name: { type: DataTypes.STRING(255), allowNull: false },
  date_of_birth: { type: DataTypes.DATE },
  age: { type: DataTypes.INTEGER },
  gender: { type: DataTypes.ENUM('Male', 'Female', 'Transgender') },
  email: { type: DataTypes.STRING, validate: { isEmail: true } },
  mobile_number: { type: DataTypes.STRING(10), validate: { is: /^[6-9]\d{9}$/ } },
  communication_address: { type: DataTypes.TEXT },
  permanent_address: { type: DataTypes.TEXT },
  religion: { type: DataTypes.ENUM('Hindu', 'Muslim', 'Christian', 'Others') },
  community: { type: DataTypes.ENUM('General', 'OBC', 'SC', 'ST', 'Others') },
  caste: { type: DataTypes.STRING },
  post: { type: DataTypes.STRING(255) },
  department: { type: DataTypes.STRING(255) },
  applied_date: { type: DataTypes.DATE },
  anna_university_faculty_id: { type: DataTypes.STRING(255) },
  aicte_faculty_id: { type: DataTypes.STRING(255) },
  orcid: { type: DataTypes.STRING(255) },
  researcher_id: { type: DataTypes.STRING(255) },
  google_scholar_id: { type: DataTypes.STRING(255) },
  scopus_profile: { type: DataTypes.STRING(255) },
  vidwan_profile: { type: DataTypes.STRING(255) },
  supervisor_id: { 
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: User,
      key: "Userid",
    },
    onDelete: "SET NULL",
  },
  h_index: { type: DataTypes.INTEGER },
  citation_index: { type: DataTypes.INTEGER },
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
  approval_status: { 
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
}, { timestamps: true, tableName: 'staff_details' });

export default StaffDetails;