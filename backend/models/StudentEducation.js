// models/StudentEducation.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/mysql.js';

const StudentEducation = sequelize.define('StudentEducation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  Userid: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: 'users',
      key: 'Userid',
    },
    onDelete: 'CASCADE',
  },
  // 10th Standard Education
  tenth_school_name: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  tenth_board: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  tenth_percentage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 100,
    },
  },
  tenth_year_of_passing: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },

  // 12th Standard Education
  twelfth_school_name: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  twelfth_board: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  twelfth_percentage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 100,
    },
  },
  twelfth_year_of_passing: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },

  // Degree Education
  degree_institution_name: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  degree_name: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  degree_specialization: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },

  // Semester-wise Marks (for 8 semesters)
  semester_1_gpa: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 10,
    },
  },
  semester_2_gpa: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 10,
    },
  },
  semester_3_gpa: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 10,
    },
  },
  semester_4_gpa: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 10,
    },
  },
  semester_5_gpa: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 10,
    },
  },
  semester_6_gpa: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 10,
    },
  },
  semester_7_gpa: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 10,
    },
  },
  semester_8_gpa: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 10,
    },
  },

  // Overall GPA and CGPA
  gpa: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 10,
    },
  },
  cgpa: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 10,
    },
  },

  // Arrears Information
  has_arrears_history: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  arrears_history_count: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
  },
  arrears_history_details: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of past arrear records with year and count',
  },

  // Standing Arrears Information
  has_standing_arrears: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  standing_arrears_count: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
  },
  standing_arrears_subjects: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of subject codes/names with arrear status',
  },

  // Additional Fields
  Created_by: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'Userid',
    },
  },
  Updated_by: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'Userid',
    },
  },
  pending: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  tutor_verification_status: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  Verified_by: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'Userid',
    },
  },
  verified_at: {
    type: DataTypes.DATE,
  },
  comments: {
    type: DataTypes.TEXT,
    allowNull: true,
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
}, {
  timestamps: true,
  tableName: 'student_education_records',
});

export default StudentEducation;