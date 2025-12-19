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
import HackathonEvent from "./HackathonEvent.js";
import Extracurricular from "./Extracurricular.js";
import Project from "./Project.js";
import StudentEducation from "./StudentEducation.js";
import CompetencyCoding from "./CompetencyCoding.js";
import StudentPublication from "./StudentPublication.js";
import NonCGPACategory from "./NonCGPACategory.js";
import StudentNonCGPA from "./StudentNonCGPA.js";
import NPTELCourse from "./NPTELCourse.js";
import StudentNPTEL from "./StudentNPTEL.js";

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
  StudentDetails.belongsTo(City, { foreignKey: "cityID", as: "cityDetail" });

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
EventAttended.belongsTo(City, { foreignKey: 'cityID', as: 'eventCity' });
EventAttended.belongsTo(District, { foreignKey: 'districtID', as: 'eventDistrict' });
EventAttended.belongsTo(State, { foreignKey: 'stateID', as: 'eventState' });


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
User.hasMany(HackathonEvent, { foreignKey: "Userid", as: "hackathonEvents" });
HackathonEvent.belongsTo(User, { foreignKey: "Userid", as: "organizer" });

// Created_by association
User.hasMany(HackathonEvent, { foreignKey: "Created_by", as: "createdHackathonEvents" });
HackathonEvent.belongsTo(User, { foreignKey: "Created_by", as: "creator" });

// Updated_by association
User.hasMany(HackathonEvent, { foreignKey: "Updated_by", as: "updatedHackathonEvents" });
HackathonEvent.belongsTo(User, { foreignKey: "Updated_by", as: "updater" });

// Approved_by association
User.hasMany(HackathonEvent, { foreignKey: "Approved_by", as: "approvedHackathonEvents" });
HackathonEvent.belongsTo(User, { foreignKey: "Approved_by", as: "tutor" });

// 🏅 EXTRACURRICULAR ACTIVITY ASSOCIATIONS
// ========================

// User as participant
User.hasMany(Extracurricular, { foreignKey: "Userid", as: "extracurricularActivities" });
Extracurricular.belongsTo(User, { foreignKey: "Userid", as: "organizer" });

// Created_by association
User.hasMany(Extracurricular, { foreignKey: "Created_by", as: "createdExtracurricularActivities" });
Extracurricular.belongsTo(User, { foreignKey: "Created_by", as: "creator" });

// Updated_by association
User.hasMany(Extracurricular, { foreignKey: "Updated_by", as: "updatedExtracurricularActivities" });
Extracurricular.belongsTo(User, { foreignKey: "Updated_by", as: "updater" });

// Approved_by association
User.hasMany(Extracurricular, { foreignKey: "Approved_by", as: "approvedExtracurricularActivities" });
Extracurricular.belongsTo(User, { foreignKey: "Approved_by", as: "tutor" });

// Update the exports at the bottom to include Extracurricular:
User.hasMany(Project, { foreignKey: "Userid", as: "studentProjects" });
Project.belongsTo(User, { foreignKey: "Userid", as: "organizer" });

// Created_by association
User.hasMany(Project, { foreignKey: "Created_by", as: "createdProjects" });
Project.belongsTo(User, { foreignKey: "Created_by", as: "creator" });

// Updated_by association
User.hasMany(Project, { foreignKey: "Updated_by", as: "updatedProjects" });
Project.belongsTo(User, { foreignKey: "Updated_by", as: "updater" });

// Approved_by association
User.hasMany(Project, { foreignKey: "Approved_by", as: "approvedProjects" });
Project.belongsTo(User, { foreignKey: "Approved_by", as: "tutor" });

// 📚 STUDENT EDUCATION ASSOCIATIONS
// ========================

// User to StudentEducation (One-to-One)
User.hasOne(StudentEducation, { foreignKey: "Userid", as: "educationRecord" });
StudentEducation.belongsTo(User, { foreignKey: "Userid", as: "organizer" });

// Created_by association
User.hasMany(StudentEducation, { foreignKey: "Created_by", as: "createdEducationRecords" });
StudentEducation.belongsTo(User, { foreignKey: "Created_by", as: "creator" });

// Updated_by association
User.hasMany(StudentEducation, { foreignKey: "Updated_by", as: "updatedEducationRecords" });
StudentEducation.belongsTo(User, { foreignKey: "Updated_by", as: "updater" });

// Verified_by association
User.hasMany(StudentEducation, { foreignKey: "Verified_by", as: "verifiedEducationRecords" });
StudentEducation.belongsTo(User, { foreignKey: "Verified_by", as: "verifier" });

// User to CompetencyCoding (One-to-One)
User.hasOne(CompetencyCoding, { foreignKey: "Userid", as: "competencyCoding" });
CompetencyCoding.belongsTo(User, { foreignKey: "Userid", as: "organizer" });

// Created_by association
User.hasMany(CompetencyCoding, { foreignKey: "Created_by", as: "createdCompetencyRecords" });
CompetencyCoding.belongsTo(User, { foreignKey: "Created_by", as: "creator" });

// Updated_by association
User.hasMany(CompetencyCoding, { foreignKey: "Updated_by", as: "updatedCompetencyRecords" });
CompetencyCoding.belongsTo(User, { foreignKey: "Updated_by", as: "updater" });

// Verified_by association
User.hasMany(CompetencyCoding, { foreignKey: "Verified_by", as: "verifiedCompetencyRecords" });
CompetencyCoding.belongsTo(User, { foreignKey: "Verified_by", as: "verifier" });

// User to StudentPublication (One-to-Many)
User.hasMany(StudentPublication, { foreignKey: "Userid", as: "publications" });
StudentPublication.belongsTo(User, { foreignKey: "Userid", as: "organizer" });

// Created_by association
User.hasMany(StudentPublication, { foreignKey: "Created_by", as: "createdPublications" });
StudentPublication.belongsTo(User, { foreignKey: "Created_by", as: "creator" });

// Updated_by association
User.hasMany(StudentPublication, { foreignKey: "Updated_by", as: "updatedPublications" });
StudentPublication.belongsTo(User, { foreignKey: "Updated_by", as: "updater" });

// Verified_by association
User.hasMany(StudentPublication, { foreignKey: "Verified_by", as: "verifiedPublications" });
StudentPublication.belongsTo(User, { foreignKey: "Verified_by", as: "verifier" });

// User as creator
User.hasMany(NonCGPACategory, { foreignKey: "Created_by", as: "createdNonCGPACategories" });
NonCGPACategory.belongsTo(User, { foreignKey: "Created_by", as: "creator" });

// User as updater
User.hasMany(NonCGPACategory, { foreignKey: "Updated_by", as: "updatedNonCGPACategories" });
NonCGPACategory.belongsTo(User, { foreignKey: "Updated_by", as: "updater" });


User.hasMany(StudentNonCGPA, { foreignKey: "Userid", as: "nonCGPARecords" });
StudentNonCGPA.belongsTo(User, { foreignKey: "Userid", as: "student" });

// NonCGPACategory to StudentNonCGPA (One-to-Many)
NonCGPACategory.hasMany(StudentNonCGPA, { foreignKey: "category_id", as: "studentRecords" });
StudentNonCGPA.belongsTo(NonCGPACategory, { foreignKey: "category_id", as: "category" });

// Created_by association
User.hasMany(StudentNonCGPA, { foreignKey: "Created_by", as: "createdNonCGPARecords" });
StudentNonCGPA.belongsTo(User, { foreignKey: "Created_by", as: "creator" });

// Updated_by association
User.hasMany(StudentNonCGPA, { foreignKey: "Updated_by", as: "updatedNonCGPARecords" });
StudentNonCGPA.belongsTo(User, { foreignKey: "Updated_by", as: "updater" });

// Verified_by association
User.hasMany(StudentNonCGPA, { foreignKey: "Verified_by", as: "verifiedNonCGPARecords" });
StudentNonCGPA.belongsTo(User, { foreignKey: "Verified_by", as: "verifier" });
// Update the exports at the bottom to include NonCGPACategory:

// User has many NPTEL enrollments
User.hasMany(StudentNPTEL, {
  foreignKey: "Userid",
  as: "nptelEnrollments",
});
StudentNPTEL.belongsTo(User, {
  foreignKey: "Userid",
  as: "student",
});

// NPTELCourse has many StudentNPTEL enrollments
NPTELCourse.hasMany(StudentNPTEL, {
  foreignKey: "course_id",
  as: "enrollments",
});
StudentNPTEL.belongsTo(NPTELCourse, {
  foreignKey: "course_id",
  as: "course",
});
export {
  sequelize,
  User,
  OnlineCourses,
  StudentDetails,
   NPTELCourse,
  StudentNPTEL,
  Course,
  HackathonEvent,
  Extracurricular,
  Project,
  StudentEducation,
  CompetencyCoding,
  StudentPublication,
  NonCGPACategory,  // Add this
  Internship,
  Message,
  Country,
  State,
  District,
  Department,
  City,
  RelationDetails,
  BankDetails,
  EventAttended,
  EventOrganized,
  RecentActivity,
  BulkUploadHistory,
  DownloadHistory,
  Scholarship,
  StudentLeave,
  Achievement,
  Marksheet,
  StudentNonCGPA,
  applyAssociations,
};