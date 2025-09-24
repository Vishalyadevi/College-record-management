import { sequelize } from "../config/mysql.js";
import User from "./User.js";
import StudentDetails from "./StudentDetails.js";
import Internship from "./Internship.js";
import Message from "./Message.js";
import Country from "./Country.js";
import State from "./State.js";
import District from "./District.js";
import City from "./City.js";
import Department from "./Department.js";
import RelationDetails from "./RelationDetails.js";
import BankDetails from "./BankDetails.js";
import Extracurricular from "./Extracurricular.js";
import EventAttended from "./eventAttended.js";
import RecentActivity from "./RecentActivity.js";
import BulkUploadHistory from "./BulkUploadHistory.js";
import DownloadHistory from "./DownloadHistory.js";
import Scholarship from "./Scholarship.js";
import EventOrganized from "./EventOrganized.js";
import StudentLeave from "./StudentLeave.js";
import OnlineCourses from "./OnlineCourses.js";
import Achievement from "./Achievement.js";
import Course from "./Course.js";
import Marksheet from "./marksheet.js";

const applyAssociations = () => {
  console.log("Applying model associations...");

  /** =====================
   *  🟢 USER ASSOCIATIONS
   *  ===================== */
  Department.hasMany(User, { foreignKey: "Deptid" });
  User.belongsTo(Department, { foreignKey: "Deptid"});

  User.hasOne(StudentDetails, { foreignKey: "Userid", as: "studentDetails" });
  StudentDetails.belongsTo(User, { foreignKey: "Userid", as: "studentUser" });

  User.hasMany(StudentDetails, { foreignKey: "staffId", as: "staffStudents" });
  StudentDetails.belongsTo(User, { foreignKey: "staffId", as: "staffAdvisor" });

  User.hasOne(BankDetails, { foreignKey: "Userid", as: "bankDetails" });
  BankDetails.belongsTo(User, { foreignKey: "Userid", as: "bankUser" });

  User.hasMany(RelationDetails, { foreignKey: "Userid", as: "relationDetails" });
  RelationDetails.belongsTo(User, { foreignKey: "Userid", as: "relationUser" });

  // 🏢 Internship associations
  User.hasMany(Internship, { foreignKey: "Userid", as: "internships" });
  Internship.belongsTo(User, { foreignKey: "Userid", as: "internUser" });

  User.hasMany(Internship, { foreignKey: "Created_by", as: "createdInternships" });
  Internship.belongsTo(User, { foreignKey: "Created_by", as: "creator" });

  User.hasMany(Internship, { foreignKey: "Updated_by", as: "updatedInternships" });
  Internship.belongsTo(User, { foreignKey: "Updated_by", as: "updater" });

  User.hasMany(Internship, { foreignKey: "Approved_by", as: "tutorApprovedInternships" });
  Internship.belongsTo(User, { foreignKey: "Approved_by", as: "tutor" });

  // 📩 Messages
  User.hasMany(Message, { foreignKey: "sender_id", as: "sentMessages" });
  Message.belongsTo(User, { foreignKey: "sender_id", as: "sender" });

  User.hasMany(Message, { foreignKey: "receiver_id", as: "receivedMessages" });
  Message.belongsTo(User, { foreignKey: "receiver_id", as: "receiver" });

  // 🎓 Student Details & Department
  StudentDetails.belongsTo(Department, { foreignKey: "Deptid" });
  Department.hasMany(StudentDetails, { foreignKey: "Deptid" });

  // 🏠 Student Address Associations
  StudentDetails.belongsTo(Country, { foreignKey: "countryID", as: "country" });
  StudentDetails.belongsTo(State, { foreignKey: "stateID", as: "state" });
  StudentDetails.belongsTo(District, { foreignKey: "districtID", as: "district" });
  StudentDetails.belongsTo(City, { foreignKey: "cityID", as: "city" });

  /** =====================
   *  🟢 LOCATION ASSOCIATIONS
   *  ===================== */
  Country.hasMany(State, { foreignKey: "countryID", as: "states" });
  State.belongsTo(Country, { foreignKey: "countryID", as: "country" });

  State.hasMany(District, { foreignKey: "stateID", as: "districts" });
  District.belongsTo(State, { foreignKey: "stateID", as: "state" });

  District.hasMany(City, { foreignKey: "districtID", as: "cities" });
  City.belongsTo(District, { foreignKey: "districtID", as: "district" });

  
  User.hasMany(BulkUploadHistory, { foreignKey: "Userid" });
  BulkUploadHistory.belongsTo(User, { foreignKey: "Userid" });

  User.hasMany(DownloadHistory, { foreignKey: "Userid" });
  DownloadHistory.belongsTo(User, { foreignKey: "Userid" });

  /** =====================
   *  🟢 SCHOLARSHIP ASSOCIATIONS
   *  ===================== */
  // A scholarship belongs to a user (student)
// User model
User.hasMany(Scholarship, { foreignKey: "Userid", as: "scholarships" });
Scholarship.belongsTo(User, { foreignKey: "Userid", as: "student" });

// Created_by association
User.hasMany(Scholarship, { foreignKey: "Created_by", as: "createdScholarships" });
Scholarship.belongsTo(User, { foreignKey: "Created_by", as: "creator" });

// Updated_by association
User.hasMany(Scholarship, { foreignKey: "Updated_by", as: "updatedScholarships" });
Scholarship.belongsTo(User, { foreignKey: "Updated_by", as: "updater" });

// Approved_by association
User.hasMany(Scholarship, { foreignKey: "Approved_by", as: "tutorApprovedScholarships" });
Scholarship.belongsTo(User, { foreignKey: "Approved_by", as: "tutor" });
// User-EventOrganized associations

// User as Organizer
User.hasMany(EventOrganized, { foreignKey: "Userid", as: "organizedEvents" });
EventOrganized.belongsTo(User, { foreignKey: "Userid", as: "organizer" });

// Created_by association
User.hasMany(EventOrganized, { foreignKey: "Created_by", as: "createdEvents" });
EventOrganized.belongsTo(User, { foreignKey: "Created_by", as: "creator" });

// Updated_by association
User.hasMany(EventOrganized, { foreignKey: "Updated_by", as: "updatedEvents" });
EventOrganized.belongsTo(User, { foreignKey: "Updated_by", as: "updater" });

// Approved_by association
User.hasMany(EventOrganized, { foreignKey: "Approved_by", as: "tutorApprovedEvents" });
EventOrganized.belongsTo(User, { foreignKey: "Approved_by", as: "tutor" });

// User - EventAttended Associations

// User attending multiple events
User.hasMany(EventAttended, { foreignKey: "Userid", as: "attendedEvents" });
EventAttended.belongsTo(User, { foreignKey: "Userid", as: "eventUser" });

// Created_by association
User.hasMany(EventAttended, { foreignKey: "Created_by", as: "createdAttendedEvents" });
EventAttended.belongsTo(User, { foreignKey: "Created_by", as: "creator" });

// Updated_by association
User.hasMany(EventAttended, { foreignKey: "Updated_by", as: "updatedAttendedEvents" });
EventAttended.belongsTo(User, { foreignKey: "Updated_by", as: "updater" });

// Approved_by association
User.hasMany(EventAttended, { foreignKey: "Approved_by", as: "tutorApprovedAttendedEvents" });
EventAttended.belongsTo(User, { foreignKey: "Approved_by", as: "tutor" });
EventAttended.belongsTo(City, { foreignKey: 'cityID', as: 'city' });
EventAttended.belongsTo(District, { foreignKey: 'districtID', as: 'district' });
EventAttended.belongsTo(State, { foreignKey: 'stateID', as: 'state' });


StudentLeave.belongsTo(User, { foreignKey: "Userid", as: "LeaveUser" });
StudentLeave.belongsTo(User, { foreignKey: "Created_by", as: "creator" });
StudentLeave.belongsTo(User, { foreignKey: "Updated_by", as: "updater" });
StudentLeave.belongsTo(User, { foreignKey: "Approved_by", as: "tutor" });

User.hasMany(StudentLeave, { foreignKey: "Userid", as: "studentLeaves" });
User.hasMany(StudentLeave, { foreignKey: "Created_by", as: "createdLeaves" });
User.hasMany(StudentLeave, { foreignKey: "Updated_by", as: "updatedLeaves" });
User.hasMany(StudentLeave, { foreignKey: "Approved_by", as: "approvedLeaves" });

User.hasMany(OnlineCourses, { foreignKey: "Userid", as: "onlineCourses" });
OnlineCourses.belongsTo(User, { foreignKey: "Userid", as: "student" });

User.hasMany(OnlineCourses, { foreignKey: "Created_by", as: "createdCourses" });
OnlineCourses.belongsTo(User, { foreignKey: "Created_by", as: "creator" });

User.hasMany(OnlineCourses, { foreignKey: "Updated_by", as: "updatedCourses" });
OnlineCourses.belongsTo(User, { foreignKey: "Updated_by", as: "updater" });

User.hasMany(OnlineCourses, { foreignKey: "Approved_by", as: "tutorApprovedCourses" });
OnlineCourses.belongsTo(User, { foreignKey: "Approved_by", as: "tutor" });
// User-Achievement Relationship


// In your Achievement model file or where you define associations:

// Student association (User who owns the achievement)
User.hasMany(Achievement, { foreignKey: "Userid", as: "studentAchievements" });
Achievement.belongsTo(User, { foreignKey: "Userid", as: "student" });

// Creator association
User.hasMany(Achievement, { foreignKey: "Created_by", as: "createdAchievements" });
Achievement.belongsTo(User, { foreignKey: "Created_by", as: "creator" });

// Updater association
User.hasMany(Achievement, { foreignKey: "Updated_by", as: "updatedAchievements" });
Achievement.belongsTo(User, { foreignKey: "Updated_by", as: "updater" });

// Approver association
User.hasMany(Achievement, { foreignKey: "Approved_by", as: "approvedAchievements" });
Achievement.belongsTo(User, { foreignKey: "Approved_by", as: "approver" });



/** =====================
   *  🟢 USER - COURSE ASSOCIATIONS (FIXED)
   *  ===================== */
User.hasMany(Course, { foreignKey: "Userid", as: "studentCourses" });
Course.belongsTo(User, { foreignKey: "Userid", as: "student" });

User.hasMany(Course, { foreignKey: "Created_by", as: "coursesCreated" });
Course.belongsTo(User, { foreignKey: "Created_by", as: "creator" });

User.hasMany(Course, { foreignKey: "Updated_by", as: "coursesUpdated" });
Course.belongsTo(User, { foreignKey: "Updated_by", as: "updater" });

User.hasMany(Course, { foreignKey: "Approved_by", as: "coursesApproved" });
Course.belongsTo(User, { foreignKey: "Approved_by", as: "approver" });

Course.hasMany(Marksheet, { foreignKey: 'Userid', sourceKey: 'Userid' });

  console.log("✅ Associations applied successfully.");
};
// Export models and the association function
export {
  sequelize,
  User,OnlineCourses,
  StudentDetails,Course,
  Internship,
  Message,
  Country,
  State,
  District,
  Department,
  City,
  RelationDetails,
  BankDetails,
  Extracurricular,
  EventAttended,EventOrganized,
  RecentActivity, BulkUploadHistory, DownloadHistory ,Scholarship,StudentLeave,Achievement,Marksheet,
  applyAssociations,
};