import { DataTypes } from 'sequelize';
import { sequelize } from '../config/mysql.js';

const StudentDetails = sequelize.define(
  'StudentDetails',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    Userid: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'Userid',
      },
      onDelete: 'CASCADE',
    },
    Deptid: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'departments',
        key: 'id',
      },
    },
    countryID: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'countries',
        key: 'id',
      },
    },
    stateID: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'states',
        key: 'id',
      },
    },
    districtID: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'districts',
        key: 'id',
      },
    },
    cityID: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'cities',
        key: 'id',
      },
    },
    regno: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
   /* name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },*/
    batch: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    Semester: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    section: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    tutorEmail: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    date_of_birth: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    personal_email: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    personal_phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    aadhar_card_no: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    mother_tongue: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    caste: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    pincode: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    first_graduate: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    blood_group: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    student_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    religion: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    community: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    gender: {
      type: DataTypes.ENUM('Male', 'Female', 'Other'),
      allowNull: true,
    },
    seat_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
  },
  {
    tableName: 'student_details',
    timestamps: true,
  }
);

export default StudentDetails;