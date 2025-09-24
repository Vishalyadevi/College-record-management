import { DataTypes } from 'sequelize';
import { sequelize } from '../config/mysql.js';
import City from './City.js'; // Import City model
import District from './District.js'; // Import District model
import State from './State.js'; // Import State model

const EventAttended = sequelize.define(
  'EventAttended',
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
        model: 'users', // References the 'users' table
        key: 'Userid',
      },
      onDelete: 'CASCADE', // Cascade delete if the referenced user is deleted
    },
    event_name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true, // Ensure the event name is not empty
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true, // Ensure the description is not empty
      },
    },
    event_type: {
      type: DataTypes.ENUM('Inter College Event', 'Intra College Event'),
      allowNull: false,
    },
    type_of_event: {
      type: DataTypes.ENUM('Competition', 'Hackathon', 'Ideation', 'Seminar', 'Webinar', 'Other'),
      allowNull: false,
    },
    other_event_type: {
      type: DataTypes.STRING,
      allowNull: true, // Only required if type_of_event is 'Other'
    },
    institution_name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true, // Ensure the institution name is not empty
      },
    },
    mode: {
      type: DataTypes.ENUM('Online', 'Offline'),
      allowNull: false,
    },
    cityID: {
      type: DataTypes.INTEGER,
      references: {
        model: City, // References the City model
        key: 'id',
      },
      allowNull: false,
    },
    districtID: {
      type: DataTypes.INTEGER,
      references: {
        model: District, // References the District model
        key: 'id',
      },
      allowNull: false,
    },
    stateID: {
      type: DataTypes.INTEGER,
      references: {
        model: State, // References the State model
        key: 'id',
      },
      allowNull: false,
    },
    from_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    to_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    team_size: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1, // Ensure the team size is at least 1
      },
    },
    team_members: {
      type: DataTypes.JSON, // Storing team members as an array of objects
      allowNull: true,
      defaultValue: [],
    },
    participation_status: {
      type: DataTypes.ENUM('Participation', 'Achievement'),
      allowNull: false,
    },
    is_other_state_event: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    is_other_country_event: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    is_certificate_available: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    certificate_file: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    achievement_details: {
      type: DataTypes.JSON, // Storing achievement details as a JSON object
      allowNull: true,
      defaultValue: {
        is_certificate_available: false,
        certificate_file: null,
        is_cash_prize: false,
        cash_prize_amount: '',
        cash_prize_proof: null,
        is_memento: false,
        memento_proof: null,
      },
    },
    pending: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    tutor_approval_status: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    Approved_by: {
      type: DataTypes.INTEGER,
      references: {
        model: 'users', // References the 'users' table
        key: 'Userid',
      },
      allowNull: true,
    },
    approved_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    messages: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    Created_by: {
      type: DataTypes.INTEGER,
      references: {
        model: 'users', // References the 'users' table
        key: 'Userid',
      },
      allowNull: false,
    },
    Updated_by: {
      type: DataTypes.INTEGER,
      references: {
        model: 'users', // References the 'users' table
        key: 'Userid',
      },
      allowNull: true,
    },
  },
  {
    tableName: 'event_attended', // Explicitly set the table name
    timestamps: true, // Enable createdAt and updatedAt timestamps
    underscored: true, // Convert camelCase to snake_case in the database
  }
);

export default EventAttended;