import { DataTypes } from 'sequelize';
import { sequelize } from '../config/mysql.js';
import Country from './Country.js';
import State from './State.js';
import District from './District.js';
import Extracurricular from './Extracurricular.js';
import User from './User.js';

const StudentDetails = sequelize.define('StudentDetails', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  Userid: { type: DataTypes.INTEGER, allowNull: false, references: { model: "users", key: 'Userid' } },
  regno: { type: DataTypes.STRING(50), unique: true, allowNull: false },
  Deptid: { type: DataTypes.INTEGER, allowNull: false, references: { model:"department", key: 'Deptid' } }, 
  batch: { type: DataTypes.INTEGER },
  Semester: { type: DataTypes.STRING(255) },
  staffId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: User,
      key: "Userid",
    },
    onDelete: "SET NULL",
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
  date_of_joining: { type: DataTypes.DATE },
  date_of_birth: { type: DataTypes.DATE },
  blood_group: { type: DataTypes.ENUM('A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-') },
  tutorEmail: { type: DataTypes.STRING, validate: { isEmail: true } },
  personal_email: { type: DataTypes.STRING, validate: { isEmail: true } },
  first_graduate: { type: DataTypes.ENUM('Yes', 'No') },
  aadhar_card_no: { type: DataTypes.STRING(12), unique: true },
  student_type: { type: DataTypes.ENUM('Day-Scholar', 'Hosteller') },
  mother_tongue: { type: DataTypes.STRING },
  identification_mark: { type: DataTypes.STRING },
  extracurricularID: { 
    type: DataTypes.INTEGER, 
    references: { model: Extracurricular, key: 'id' }
  },
  religion: { type: DataTypes.ENUM('Hindu', 'Muslim', 'Christian', 'Others') },
  caste: { type: DataTypes.STRING },
  community: { type: DataTypes.ENUM('General', 'OBC', 'SC', 'ST', 'Others') },
  gender: { type: DataTypes.ENUM('Male', 'Female', 'Transgender') },
  seat_type: { type: DataTypes.ENUM('Counselling', 'Management') },
  section: { type: DataTypes.STRING },
  door_no: { type: DataTypes.STRING(255) },
  street: { type: DataTypes.STRING(255) },
  city: { type: DataTypes.STRING(255) }, // Changed to text field
  districtID: { type: DataTypes.INTEGER, references: { model: District, key: 'id' } },
  stateID: { type: DataTypes.INTEGER, references: { model: State, key: 'id' } },
  countryID: { type: DataTypes.INTEGER, references: { model: Country, key: 'id' } },
  pincode: { type: DataTypes.STRING(6), validate: { is: /^[0-9]{6}$/ } },
  personal_phone: { type: DataTypes.STRING(10), validate: { is: /^[6-9]\d{9}$/ } },
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
  skillrackProfile: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
}, { timestamps: true, tableName: 'student_details' });

export default StudentDetails;