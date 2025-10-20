// models/StudentPublication.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/mysql.js';

const StudentPublication = sequelize.define('StudentPublication', {
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

  // ========================
  // 📄 PUBLICATION DETAILS
  // ========================
  publication_type: {
    type: DataTypes.ENUM(
      'Journal',
      'Conference',
      'Book',
      'Book Chapter',
      'Workshop',
      'Thesis',
      'Preprint',
      'White Paper',
      'Patent',
      'Other'
    ),
    allowNull: false,
  },

  publication_name: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Name of journal, conference, or publisher',
  },

  title: {
    type: DataTypes.STRING(500),
    allowNull: false,
  },

  authors: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Array of author names',
  },

  // ========================
  // 🏆 INDEXING DETAILS
  // ========================
  index_type: {
    type: DataTypes.ENUM(
      'Scopus',
      'Web of Science',
      'PubMed',
      'IEEE Xplore',
      'ACM Digital Library',
      'SSRN',
      'Not Indexed',
      'Other'
    ),
    allowNull: true,
  },

  doi: {
    type: DataTypes.STRING(100),
    allowNull: true,
    unique: true,
  },

  publisher: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },

  page_no: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Format: "start-end" or "start" pages',
  },

  publication_date: {
    type: DataTypes.DATE,
    allowNull: true,
  },

  // ========================
  // 📊 IMPACT METRICS
  // ========================
  impact_factor: {
    type: DataTypes.DECIMAL(10, 4),
    allowNull: true,
    validate: {
      min: 0,
    },
  },

  // ========================
  // 🔗 PUBLICATION LINKS
  // ========================
  publication_link: {
    type: DataTypes.STRING(500),
    allowNull: true,
    validate: {
      isUrl: true,
    },
    comment: 'Link to published paper',
  },

  pdf_link: {
    type: DataTypes.STRING(500),
    allowNull: true,
    validate: {
      isUrl: true,
    },
  },

  preprint_link: {
    type: DataTypes.STRING(500),
    allowNull: true,
    validate: {
      isUrl: true,
    },
  },

  // ========================
  // ✅ PUBLICATION STATUS
  // ========================
  publication_status: {
    type: DataTypes.ENUM(
      'Draft',
      'Under Review',
      'Accepted',
      'Published',
      'Rejected',
      'Withdrawn'
    ),
    allowNull: false,
    defaultValue: 'Draft',
  },

  status_date: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date when status was last updated',
  },

  // ========================
  // 📝 ADDITIONAL DETAILS
  // ========================
  abstract: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  keywords: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Array of keywords/tags',
  },

  volume: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },

  issue: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },

  journal_abbreviation: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },

  issn: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },

  isbn: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },

  citations_count: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
  },

  h_index_contribution: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: true,
  },

  contribution_description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Description of student contribution',
  },

  corresponding_author: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false,
  },

  first_author: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false,
  },

  // ========================
  // 🔍 VERIFICATION & APPROVAL
  // ========================
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
    defaultValue: true,
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

  verification_comments: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  // ========================
  // 📆 TIMESTAMPS
  // ========================
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
  tableName: 'student_publications',
});

export default StudentPublication;