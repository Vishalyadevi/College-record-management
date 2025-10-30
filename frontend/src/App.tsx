import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import './index.css';

// Context Providers

import { StudentProvider } from './records/contexts/StudentContext.jsx';
import { StaffProvider } from './records/contexts/StaffContext.jsx';
import { UserProvider } from './records/contexts/UserContext.jsx';
import { InternProvider } from "./records/contexts/InternContext"; 
import { DashboardProvider } from "./records/contexts/DashboardContext"; 
import { OrganizedEventProvider } from "./records/contexts/OrganizedEventContext";
import { AttendedEventProvider } from "./records/contexts/AttendedEventContext";
import { AppProvider } from './records/contexts/AppContext.jsx';
import { LocationProvider } from './records/contexts/LocationContext.jsx';
import { ScholarshipProvider } from './records/contexts/ScholarshipContext.jsx';
import { LeaveProvider } from './records/contexts/LeaveContext.jsx';
import { OnlineCoursesProvider } from './records/contexts/OnlineCoursesContext.jsx';
import { AchievementProvider } from "./records/contexts/AchievementContext.jsx";
import { HackathonProvider } from "./records/contexts/HackathonContext.jsx"; // NEW
import { StudentDataProvider } from './records/contexts/studentDataContext.jsx';
import { CourseProvider } from './records/contexts/CourseContext.jsx';
import { ExtracurricularProvider } from "./records/contexts/ExtracurricularContext.jsx";
import { ProjectProvider } from "./records/contexts/ProjectContext.jsx";
import { CompetencyCodingProvider } from "./records/contexts/CompetencyCodingContext.jsx"; // NEW
import { PublicationProvider } from "./records/contexts/PublicationContext.jsx"; // NEW
import { StudentEducationProvider } from "./records/contexts/StudentEducationContext.jsx"; // NEW
import { NonCGPAProvider } from "./records/contexts/NonCGPAContext.jsx"; // NEW
import { NonCGPACategoryProvider } from "./records/contexts/NonCGPACategoryContext.jsx"; // NEW
import { CertificateProvider } from "./records/contexts/CertificateContext.jsx";




// Main Website Components (from project/src/)
import Navbar from './components/Navbar';
import Sidebar from './records/components/Sidebar';
import Hero from './components/Hero';
import QuickLinks from './components/QuickLinks';
import AcademicsOverview from './components/AcademicsOverview';
import NewsSection from './components/NewsSection';
import Footer from './components/Footer';
import PlacementHighlights from './components/PlacementHighlights';
import ProgrammesOffered from './components/ProgrammesOffered';
import About from './components/About';
import CompaniesList from './components/CompaniesList';
import Preloader from './components/Preloader';
import FlashNews from './components/FlashNews';
import WhyNEC from './components/WhyNEC';
import VisionMissionSection from './components/VisionMissionSection';
import PlaceMent from './components/PlaceMent';
import ProgramsOffered from './components/ProgramsOffered';
import Events from './components/Events';
import News from './components/News';
import AllNewsPage from "./components/AllNewsPage";
import Campus from './components/Campus';
import Marquee from './components/Marquee';
import AllEventsPage from './components/AllEventsPage';
import FeesPayment from './components/FeesPayment';
import Result from './components/Result';
import About1 from './components/AboutUS';
import Scheme from './components/Scheme';
import Approval from './components/Approval';
import AuditedStatements from './components/AuditedStatements';
import Meeting from './components/meeting';
import ApprovalLetters from './components/Approval1';
import RegulationList from './components/RegulationList';
import ACADEMICCALENDER from './components/ACADEMICCALENDER';
import CSEDepartment from './components/CSEDepartment ';
import AcademicDeanSection from './components/AcademicDeanSection';
import ACADEMICCOUNCIL from './components/ACADEMICCOUNCIL';
import GreenEnery from './components/GreenEnergy';
import GoverningCouncil from './components/GoverningCouncil';
import DeanSection from './components/DeanSection';
import MechDept from './components/MechDept';
import CivilDept from './components/CivilDept';
import ItDept from './components/ItDept';
import AdmissionProcess from './components/AdmissionProcess';
import ApplyNowButton from './components/ApplyNowButton';

// Placement System Components (from placement/src/)
import PublicHome from './placement/components/publichome';
import Login from './placement/components/Login';
import HomePage from './placement/components/admin/AdminHome';
import AdminRecruiters from './placement/components/admin/company/AdminRecruiters';
import Drive from './placement/components/Drive';
import CompanyDetails from './placement/components/admin/company/CompanyDetails';
import StudentNavbar from './placement/components/student/navbar';
import StudentHome from './placement/components/student/home';
import AdminUpcomingDrives from './placement/components/admin/AdminUpcommingDrives';
import AdminNavbar from './placement/components/admin/AdminNavbar';
import StudentProfile from './placement/components/student/profile';
import UpcomingDrives from './placement/components/student/UpcomingDrive';
import RegisteredStudents from './placement/components/admin/AdminRegisteredStudents';
import Status from './placement/components/student/Status';
import StudentRecruiter from './placement/components/student/StudentRecruiter';
import StaffHome from './placement/components/staff/staffHome';
import StaffNavbar from './placement/components/staff/staffnavbar';
import StaffRecruiter from './placement/components/staff/staffRecruiters';
import StaffUpcommingDrive from './placement/components/staff/staffUpcommingDrive';
import Tutorward from './placement/components/staff/tutorward';
import AdminHackathon from './placement/components/admin/Hackathon';
import StudentHackathon from './placement/components/student/Hackathon';
import EditCompany from './placement/components/admin/company/EditCompanyDetails';
import StaffHackathon from './placement/components/staff/staffhackathon';
import PlacementFeedback from './placement/components/student/placementFeedback';
import EligibleStudents from './placement/components/admin/elegibleStudents';
import AdminFeedback from './placement/components/admin/feedback';
import StaffEligibleStudents from './placement/components/staff/eligiblestudents';
import HackathonReport from './placement/components/admin/exportHackathon.jsx';


// Records System Components (from records/src/)
import RecordsLogin from './records/pages/Login';
import AdminPanel from './records/pages/admin/AdminPanel';
import AddUser from './records/pages/admin/AddUser';
import StaffList from './records/pages/admin/StaffList';
import StudentList from './records/pages/admin/StudentList';
import StudentBackground from './records/pages/Student/StudentBackground';
import StudentPersonalDetails from './records/pages/Student/StudentPersonalDetails';
import StudentCourses from './records/pages/Student/StudentCourses';
import StudentEventAttended from './records/pages/Student/StudentEventAttended';
import StudentEventOrganized from './records/pages/Student/StudentEventOrganized';
import StudentCertificate from './records/pages/Student/StudentCertificate';
import StudentOnlineCourses from './records/pages/Student/StudentOnlineCourses';
import StudentAchievements from './records/pages/Student/StudentAchievements';
import StudentInternship from './records/pages/Student/StudentInternship';
import StudentScholarship from './records/pages/Student/StudentScholarship';
import StudentLeave from './records/pages/Student/StudentLeave';
import Hackathon from './records/pages/Student/StudentHackathons.jsx'
import ExtracurricularActivities from './records/pages/Student/ExtracurricularActivities.jsx';
import StudentProject from './records/pages/Student/StudentProject.jsx';
import StudentCompetency from './records/pages/Student/CompetencyCoding.jsx';
import Publication from './records/pages/Student/Publication.jsx';
import StudentEducation from './records/pages/Student/Education.jsx';
import NonCGPA from './records/pages/Student/NonCGPACourses.jsx';
import NonCGPACategory from './records/pages/admin/NonCGPACategoryManagement.jsx';



import Dashboard from './records/pages/StaffPage/Dashboard';
import RecordsSidebar from './records/components/Sidebar';
import { ToastContainer } from "react-toastify";
import MyProfile from './records/pages/MyProfile';
import Sheet from './records/pages/Sheet';
import Bulk from './records/pages/admin/Bulk';
import MyWard from './records/pages/StaffPage/MyWard';
import ForgotPassword from './records/pages/ForgetPassword';
import ResetPassword from './records/pages/ResetPassword';
import StudentBioData from './records/pages/Student/StudentBioData';
import StudentActivity from './records/pages/Student/StudentActivity';

// New Staff Pages for Records
import DashboardPage from './records/pages/StaffPage/DashboardPage';
import ProposalsPage from './records/pages/StaffPage/ProposalsPage';
import EventsPage from './records/pages/StaffPage/EventsPage';
import IndustryPage from './records/pages/StaffPage/IndustryPage';
import CertificationsPage from './records/pages/StaffPage/CertificationsPage';
import ConferencesPage from './records/pages/StaffPage/ConferencesPage';
import JournalsPage from './records/pages/StaffPage/JournalsPage';
import BookChaptersPage from './records/pages/StaffPage/BookChaptersPage';
import EventsOrganizedPage from './records/pages/StaffPage/EventsOrganizedPage';
import HIndex from './records/pages/StaffPage/HIndex';
import ResourcePersonPage from './records/pages/StaffPage/ResourcePersonPage';
import SeedMoneyPage from './records/pages/StaffPage/SeedMoneyPage';
import RecognitionPage from './records/pages/StaffPage/RecognitionPage';
import PatentDevelopmentPage from './records/pages/StaffPage/PatentDevelopmentPage';
import ProjectMentorPage from './records/pages/StaffPage/ProjectMentorPage';
import ScholarManagementPage from './records/pages/StaffPage/ScholarManagementPage';
import EducationPage from './records/pages/StaffPage/EducationPage';
import ProjectProposalPage from './records/pages/StaffPage/ProjectProposal';
import PersonalForm from './records/pages/StaffPage/PersonalForm';
import OverDashboardPage from './records/pages/StaffPage/Dashboard';
import StaffActivitiesPage from './records/pages/admin/StaffActivities';
import StudentActivitiesPage from './records/pages/admin/StudentActivities';
import StaffFeedback from './placement/components/staff/stafffeedback';
import StaffMou from './records/pages/StaffPage/MOUPage';

// Authentication helper functions
const getToken = (): string | null => {
  return localStorage.getItem("token");
};

const getUserRole = (): string | null => {
  // Try multiple possible keys for role storage
  const role = localStorage.getItem("role") || 
                localStorage.getItem("userRole") || 
                localStorage.getItem("user_role");
  
  if (!role) return null;
  
  // Normalize role names to match expected values
  const normalizedRole = role.toLowerCase();
  
  switch (normalizedRole) {
    case 'admin':
    case 'administrator':
      return 'Admin';
    case 'student':
      return 'Student';
    case 'staff':
    case 'faculty':
    case 'teacher':
      return 'Staff';
    default:
      // Return the role as-is if it doesn't match known patterns
      return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  }
};

const isAuthenticated = (): boolean => {
  const token = getToken();
  const role = getUserRole();
  return !!(token && role);
};

// Get system context based on current path
const getCurrentSystem = (pathname: string): string => {
  if (pathname.startsWith('/placement/')) return 'placement';
  if (pathname.startsWith('/records/')) return 'records';
  return 'main';
};

// Protected Route Component
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const isAuth = isAuthenticated();
  const userRole = getUserRole();
  const currentPath = window.location.pathname;
  const system = getCurrentSystem(currentPath);

  console.log('ProtectedRoute Debug:', {
    isAuth,
    userRole,
    currentPath,
    system,
    allowedRoles,
    token: getToken()
  });

  // If not authenticated, redirect to appropriate login
  if (!isAuth) {
    switch (system) {
      case 'placement':
        window.location.href = '/placement/login';
        break;
      case 'records':
        window.location.href = '/records/login';
        break;
      default:
        window.location.href = '/';
        break;
    }
    return null;
  }

  // If role restrictions exist and user doesn't have required role
  if (allowedRoles && allowedRoles.length > 0) {
    if (!userRole || !allowedRoles.includes(userRole)) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center p-8 bg-white rounded-lg shadow-md">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-2">You don't have permission to access this page.</p>
            <p className="text-sm text-gray-500 mb-4">
              Current role: {userRole || 'Unknown'} | Required roles: {allowedRoles.join(', ')}
            </p>
            <button 
              onClick={() => {
                // Clear localStorage and redirect to login
                localStorage.clear();
                if (system === 'placement') {
                  window.location.href = '/placement/login';
                } else if (system === 'records') {
                  window.location.href = '/records/login';
                } else {
                  window.location.href = '/';
                }
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Back to Login
            </button>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};

// Layout for Placement System
interface PlacementLayoutProps {
  children: React.ReactNode;
}

const PlacementLayout: React.FC<PlacementLayoutProps> = ({ children }) => {
  const role = getUserRole();
  
  return (
    <>
      {role === "Admin" && <AdminNavbar />}
      {role === "Student" && <StudentNavbar />}
      {role === "Staff" && <StaffNavbar />}
      {children}
    </>
  );
};

// Layout for Records System
interface RecordsLayoutProps {
  children: React.ReactNode;
  location: any;
}

const RecordsLayout: React.FC<RecordsLayoutProps> = ({ children, location }) => {
  const noSidebarRoutes = [
    "/records/login", 
    "/records/forgot-password"
  ];
  
  const shouldShowSidebar =
    !noSidebarRoutes.includes(location.pathname) &&
    !location.pathname.startsWith("/records/reset-password") &&
    isAuthenticated();

  return (
    <div className="min-h-screen bg-gray-50">
      {shouldShowSidebar && <RecordsSidebar />}
      <div className={shouldShowSidebar ? "ml-64 p-4 mt-4" : ""}>
        <ToastContainer />
        {children}
      </div>
    </div>
  );
};

// Component to get location for Records Layout with StudentProvider
const RecordsLayoutWithLocation: React.FC<{ children: React.ReactNode; includeStudentProvider?: boolean }> = ({ 
  children, 
  includeStudentProvider = false 
}) => {
  const location = useLocation();
  
  if (includeStudentProvider) {
    return (
      <StudentProvider>
        <RecordsLayout location={location}>{children}</RecordsLayout>
      </StudentProvider>
    );
  }
  
  return <RecordsLayout location={location}>{children}</RecordsLayout>;
};

// App Routes Component
const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* ==================== MAIN WEBSITE ROUTES ==================== */}
      <Route path="/" element={
        <div className="flex flex-col min-h-screen bg-white">
          <Navbar />
          <ApplyNowButton />
          <FlashNews />
          <Hero />
          <WhyNEC />
          <VisionMissionSection />
          <PlaceMent />
          <ProgramsOffered />
          <Campus />
          <News />
          <Events />
          <div className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4">
              <Marquee />
            </div>
          </div>
          <Footer />
        </div>
      } />

      {/* Main Website Routes */}
      <Route path="/placement-highlights" element={<><Navbar /><ApplyNowButton /><PlacementHighlights /><Footer /></>} />
      <Route path="/fees-payment" element={<><Navbar /><ApplyNowButton /><FeesPayment /><Footer /></>} />
      <Route path="/programmes-offered" element={<><Navbar /><ApplyNowButton /><ProgrammesOffered /><Footer /></>} />
      <Route path="/about" element={<><Navbar /><ApplyNowButton /><About /><Footer /></>} />
      <Route path="/academics/overview" element={<><Navbar /><ApplyNowButton /><AcademicsOverview /><Footer /></>} />
      <Route path="/news" element={<><Navbar /><ApplyNowButton /><AllNewsPage /><Footer /></>} />
      <Route path="/all-events" element={<><Navbar /><ApplyNowButton /><AllEventsPage /><Footer /></>} />
      <Route path="/companies-visited" element={<><Navbar /><ApplyNowButton /><CompaniesList /><Footer /></>} />
      <Route path="/result" element={<><Navbar /><ApplyNowButton /><Result /><Footer /></>} />
      <Route path="/about-us" element={<><Navbar /><ApplyNowButton /><About1 /><Footer /></>} />
      <Route path="/scheme" element={<><Navbar /><ApplyNowButton /><Scheme /><Footer /></>} />
      <Route path="/approval" element={<><Navbar /><ApplyNowButton /><Approval /><Footer /></>} />
      <Route path="/auditedStatements" element={<><Navbar /><ApplyNowButton /><AuditedStatements /><Footer /></>} />
      <Route path="/meeting" element={<><Navbar /><ApplyNowButton /><Meeting /><Footer /></>} />
      <Route path="/approval1" element={<><Navbar /><ApplyNowButton /><ApprovalLetters /><Footer /></>} />
      <Route path="/regulationlist" element={<><Navbar /><ApplyNowButton /><RegulationList /><Footer /></>} />
      <Route path="/AcademicCalender" element={<><Navbar /><ApplyNowButton /><ACADEMICCALENDER /><Footer /></>} />
      <Route path="/cse-dept" element={<><Navbar /><ApplyNowButton /><CSEDepartment /><Footer /></>} />
      <Route path="/academicdeansection" element={<><Navbar /><ApplyNowButton /><AcademicDeanSection /><Footer /></>} />
      <Route path="/academiccouncil" element={<><Navbar /><ApplyNowButton /><ACADEMICCOUNCIL /><Footer /></>} />
      <Route path="/green-energy" element={<><Navbar /><ApplyNowButton /><GreenEnery /><Footer /></>} />
      <Route path="/governing-concil" element={<><Navbar /><ApplyNowButton /><GoverningCouncil /><Footer /></>} />
      <Route path="/admission" element={<><Navbar /><ApplyNowButton /><AdmissionProcess /><Footer /></>} />
      <Route path="/sa&ir" element={<><Navbar /><ApplyNowButton /><DeanSection /><Footer /></>} />
      <Route path="/mech-dept" element={<><Navbar /><ApplyNowButton /><MechDept /><Footer /></>} />
      <Route path="/civil-dept" element={<><Navbar /><ApplyNowButton /><CivilDept /><Footer /></>} />
      <Route path="/it-dept" element={<><Navbar /><ApplyNowButton /><ItDept /><Footer /></>} />

      {/* ==================== PLACEMENT SYSTEM ROUTES ==================== */}
      {/* Placement Public Routes */}
      <Route path="/placement" element={<PublicHome />} />
      <Route path="/placement/login" element={<Login />} />

      {/* Placement Protected Routes */}
      {/* Admin Routes */}
      <Route path="/placement/admin-home" element={
        <ProtectedRoute allowedRoles={['Admin']}>
          <PlacementLayout><HomePage /></PlacementLayout>
        </ProtectedRoute>
      } />
      <Route path="/placement/admin-recruiters" element={
        <ProtectedRoute allowedRoles={['Admin']}>
          <PlacementLayout><AdminRecruiters /></PlacementLayout>
        </ProtectedRoute>
      } />
      <Route path="/placement/admin-drive" element={
        <ProtectedRoute allowedRoles={['Admin']}>
          <PlacementLayout><Drive /></PlacementLayout>
        </ProtectedRoute>
      } />
      <Route path="/placement/admin-upcoming-drive" element={
        <ProtectedRoute allowedRoles={['Admin']}>
          <PlacementLayout><AdminUpcomingDrives /></PlacementLayout>
        </ProtectedRoute>
      } />
      <Route path="/placement/eligible-students" element={
        <ProtectedRoute allowedRoles={['Admin']}>
          <PlacementLayout><EligibleStudents /></PlacementLayout>
        </ProtectedRoute>
      } />
      <Route path="/placement/admin-feedback" element={
        <ProtectedRoute allowedRoles={['Admin']}>
          <PlacementLayout><AdminFeedback /></PlacementLayout>
        </ProtectedRoute>
      } />
      <Route path="/placement/company/:companyName" element={
        <ProtectedRoute allowedRoles={['Admin', 'Staff']}>
          <PlacementLayout><CompanyDetails /></PlacementLayout>
        </ProtectedRoute>
      } />
      <Route path="/placement/admin-registered-students" element={
        <ProtectedRoute allowedRoles={['Admin']}>
          <PlacementLayout><RegisteredStudents /></PlacementLayout>
        </ProtectedRoute>
      } />
      <Route path="/placement/admin-hackathon" element={
        <ProtectedRoute allowedRoles={['Admin']}>
          <AdminNavbar /><AdminHackathon />
        </ProtectedRoute>
      } />
      <Route path="/placement/admin-hackathon-report" element={
        <ProtectedRoute allowedRoles={['Admin']}>
          <AdminNavbar /><HackathonReport />
        </ProtectedRoute>
      } />
      <Route path="/placement/admin/edit-company/:companyName" element={
        <ProtectedRoute allowedRoles={['Admin']}>
          <AdminNavbar /><EditCompany />
        </ProtectedRoute>
      } />

      {/* Student Routes */}
      <Route path="/placement/home" element={
        <ProtectedRoute allowedRoles={['Student']}>
           <Sidebar /><StudentHome />
        </ProtectedRoute>
      } />
      <Route path="/placement/recruiters" element={
        <ProtectedRoute allowedRoles={['Student']}>
           <Sidebar /><StudentRecruiter />
        </ProtectedRoute>
      } />
      <Route path="/placement/feedback" element={
        <ProtectedRoute allowedRoles={['Student']}>
           <Sidebar /><PlacementFeedback />
        </ProtectedRoute>
      } />
      <Route path="/placement/upcoming-drive" element={
        <ProtectedRoute allowedRoles={['Student']}>
           <Sidebar /><UpcomingDrives />
        </ProtectedRoute>
      } />
      <Route path="/placement/status" element={
        <ProtectedRoute allowedRoles={['Student']}>
           <Sidebar /><Status />
        </ProtectedRoute>
      } />
      <Route path="/placement/studentprofile" element={
        <ProtectedRoute allowedRoles={['Student']}>
          <Sidebar /><StudentProfile />
        </ProtectedRoute>
      } />
      <Route path="/placement/hackathon" element={
        <ProtectedRoute allowedRoles={['Student']}>
           <Sidebar /><StudentHackathon />
        </ProtectedRoute>
      } />

      {/* Staff Routes */}
      <Route path="/placement/staff-home" element={
        <ProtectedRoute allowedRoles={['Staff']}>
          <Sidebar /><StaffHome />
        </ProtectedRoute>
      } />
      <Route path="/records/staff-recruiters" element={
        <ProtectedRoute allowedRoles={['Staff']}>
          <Sidebar /><StaffRecruiter />
        </ProtectedRoute>
      } />
      <Route path="/records/staff-upcomingdrive" element={
        <ProtectedRoute allowedRoles={['Staff']}>
          <Sidebar /><StaffUpcommingDrive />
        </ProtectedRoute>
      } />
      <Route path="/records/eligible-staff-students" element={
        <ProtectedRoute allowedRoles={['Staff']}>
          <Sidebar /><StaffEligibleStudents/>
        </ProtectedRoute>
      } />
      <Route path="/records/staff-feedback" element={
        <ProtectedRoute allowedRoles={['Staff']}>
          <Sidebar /><StaffFeedback/>
        </ProtectedRoute>
      } />
      <Route path="/records/staff-tutorward" element={
        <ProtectedRoute allowedRoles={['Staff']}>
          <Sidebar /><Tutorward />
        </ProtectedRoute>
      } />
      <Route path="/records/staff-hackathon" element={
        <ProtectedRoute allowedRoles={['Staff']}>
          <Sidebar /><StaffHackathon />
        </ProtectedRoute>
      } />

      {/* ==================== RECORDS SYSTEM ROUTES ==================== */}
      {/* Records Public Routes */}
      <Route path="/records/login" element={<RecordsLogin />} />
      <Route path="/records/forgot-password" element={<ForgotPassword />} />
      <Route path="/records/reset-password/:token" element={<ResetPassword />} />

      {/* Records Protected Routes */}
      
      {/* Admin Routes */}
      <Route path="/records/admin" element={
        <ProtectedRoute allowedRoles={['Admin']}>
          <RecordsLayoutWithLocation><AdminPanel /></RecordsLayoutWithLocation>
        </ProtectedRoute>
      } />
      <Route path="/records/student-list" element={
        <ProtectedRoute allowedRoles={['Admin']}>
          <RecordsLayoutWithLocation><StudentList /></RecordsLayoutWithLocation>
        </ProtectedRoute>
      } />
      <Route path="/records/staff-list" element={
        <ProtectedRoute allowedRoles={['Admin']}>
          <RecordsLayoutWithLocation><StaffList /></RecordsLayoutWithLocation>
        </ProtectedRoute>
      } />
      <Route path="/records/add-user" element={
        <ProtectedRoute allowedRoles={['Admin']}>
          <RecordsLayoutWithLocation><AddUser /></RecordsLayoutWithLocation>
        </ProtectedRoute>
      } />
      <Route path="/records/bulk" element={
        <ProtectedRoute allowedRoles={['Admin']}>
          <RecordsLayoutWithLocation><Bulk /></RecordsLayoutWithLocation>
        </ProtectedRoute>
      } />
      <Route path="/records/staff-activities" element={
        <ProtectedRoute allowedRoles={['Admin']}>
          <RecordsLayoutWithLocation><StaffActivitiesPage /></RecordsLayoutWithLocation>
        </ProtectedRoute>
      } />
      <Route path="/records/student-activities" element={
        <ProtectedRoute allowedRoles={['Admin']}>
          <RecordsLayoutWithLocation><StudentActivitiesPage /></RecordsLayoutWithLocation>
        </ProtectedRoute>
      } />

      {/* Staff Routes */}
      <Route path="/records/staff" element={
        <ProtectedRoute allowedRoles={['Staff']}>
          <RecordsLayoutWithLocation><DashboardPage /></RecordsLayoutWithLocation>
        </ProtectedRoute>
      } />
      <Route path="/records/staff-dashboard" element={
        <ProtectedRoute allowedRoles={['Staff']}>
          <RecordsLayoutWithLocation>
            <DashboardProvider>
              <OverDashboardPage />
            </DashboardProvider>
          </RecordsLayoutWithLocation>
        </ProtectedRoute>
      } />
      <Route path="/records/myward" element={
        <ProtectedRoute allowedRoles={['Staff']}>
          <RecordsLayoutWithLocation><MyWard /></RecordsLayoutWithLocation>
        </ProtectedRoute>
      } />

      <Route path="/records/proposals" element={
        <ProtectedRoute allowedRoles={['Staff']}>
          <RecordsLayoutWithLocation><ProposalsPage /></RecordsLayoutWithLocation>
        </ProtectedRoute>
      } />
      <Route path="/records/events" element={
        <ProtectedRoute allowedRoles={['Staff']}>
          <RecordsLayoutWithLocation><EventsPage /></RecordsLayoutWithLocation>
        </ProtectedRoute>
      } />
      <Route path="/records/industry" element={
        <ProtectedRoute allowedRoles={['Staff']}>
          <RecordsLayoutWithLocation><IndustryPage /></RecordsLayoutWithLocation>
        </ProtectedRoute>
      } />
      <Route path="/records/certifications" element={
        <ProtectedRoute allowedRoles={['Staff']}>
          <RecordsLayoutWithLocation><CertificationsPage /></RecordsLayoutWithLocation>
        </ProtectedRoute>
      } />
      <Route path="/records/conferences" element={
        <ProtectedRoute allowedRoles={['Staff']}>
          <RecordsLayoutWithLocation><ConferencesPage /></RecordsLayoutWithLocation>
        </ProtectedRoute>
      } />
      <Route path="/records/journals" element={
        <ProtectedRoute allowedRoles={['Staff']}>
          <RecordsLayoutWithLocation><JournalsPage /></RecordsLayoutWithLocation>
        </ProtectedRoute>
      } />
      <Route path="/records/book-chapters" element={
        <ProtectedRoute allowedRoles={['Staff']}>
          <RecordsLayoutWithLocation><BookChaptersPage /></RecordsLayoutWithLocation>
        </ProtectedRoute>
      } />
      <Route path="/records/events-organized" element={
        <ProtectedRoute allowedRoles={['Staff']}>
          <RecordsLayoutWithLocation><EventsOrganizedPage /></RecordsLayoutWithLocation>
        </ProtectedRoute>
      } />
      <Route path="/records/h-index" element={
        <ProtectedRoute allowedRoles={['Staff']}>
          <RecordsLayoutWithLocation><HIndex /></RecordsLayoutWithLocation>
        </ProtectedRoute>
      } />
      <Route path="/records/resource-person" element={
        <ProtectedRoute allowedRoles={['Staff']}>
          <RecordsLayoutWithLocation><ResourcePersonPage /></RecordsLayoutWithLocation>
        </ProtectedRoute>
      } />
      <Route path="/records/seed-money" element={
        <ProtectedRoute allowedRoles={['Staff']}>
          <RecordsLayoutWithLocation><SeedMoneyPage /></RecordsLayoutWithLocation>
        </ProtectedRoute>
      } />
      <Route path="/records/recognition" element={
        <ProtectedRoute allowedRoles={['Staff']}>
          <RecordsLayoutWithLocation><RecognitionPage /></RecordsLayoutWithLocation>
        </ProtectedRoute>
      } />
      <Route path="/records/patent-product" element={
        <ProtectedRoute allowedRoles={['Staff']}>
          <RecordsLayoutWithLocation><PatentDevelopmentPage /></RecordsLayoutWithLocation>
        </ProtectedRoute>
      } />
      <Route path="/records/project-mentors" element={
        <ProtectedRoute allowedRoles={['Staff']}>
          <RecordsLayoutWithLocation><ProjectMentorPage /></RecordsLayoutWithLocation>
        </ProtectedRoute>
      } />
      <Route path="/records/scholars" element={
        <ProtectedRoute allowedRoles={['Staff']}>
          <RecordsLayoutWithLocation><ScholarManagementPage /></RecordsLayoutWithLocation>
        </ProtectedRoute>
      } />
      <Route path="/records/education" element={
        <ProtectedRoute allowedRoles={['Staff']}>
          <RecordsLayoutWithLocation><EducationPage /></RecordsLayoutWithLocation>
        </ProtectedRoute>
      } />
      <Route path="/records/project-proposal" element={
        <ProtectedRoute allowedRoles={['Staff']}>
          <RecordsLayoutWithLocation><ProjectProposalPage /></RecordsLayoutWithLocation>
        </ProtectedRoute>
      } />
      <Route path="/records/personal" element={
        <ProtectedRoute allowedRoles={['Staff']}>
          <RecordsLayoutWithLocation><PersonalForm /></RecordsLayoutWithLocation>
        </ProtectedRoute>
      } />

      <Route path="/records/staff-mou" element={
        <ProtectedRoute allowedRoles={['Staff']}>
          <RecordsLayoutWithLocation><StaffMou /></RecordsLayoutWithLocation>
        </ProtectedRoute>
      } />
      

      {/* Student Routes - WITH StudentProvider */}
      <Route path="/records/student" element={
        <ProtectedRoute allowedRoles={['Student']}>
          <RecordsLayoutWithLocation includeStudentProvider={true}>
            <StudentBackground />
          </RecordsLayoutWithLocation>
        </ProtectedRoute>
      } />
      <Route path="/records/student-background" element={
        <ProtectedRoute allowedRoles={['Student']}>
          <RecordsLayoutWithLocation includeStudentProvider={true}>
            <StudentBackground />
          </RecordsLayoutWithLocation>
        </ProtectedRoute>
      } />
      <Route path="/records/student-personal-details" element={
        <ProtectedRoute allowedRoles={['Student']}>
          <RecordsLayoutWithLocation includeStudentProvider={true}>
            <StudentPersonalDetails />
          </RecordsLayoutWithLocation>
        </ProtectedRoute>
      } />
      <Route path="/records/student-activity" element={
        <ProtectedRoute allowedRoles={['Student']}>
          <RecordsLayoutWithLocation includeStudentProvider={true}>
            <StudentActivity />
          </RecordsLayoutWithLocation>
        </ProtectedRoute>
      } />

      <Route path="/records/student-courses" element={
        <ProtectedRoute allowedRoles={['Student']}>
          <RecordsLayoutWithLocation includeStudentProvider={true}>
            <StudentCourses />
          </RecordsLayoutWithLocation>
        </ProtectedRoute>
      } />
      <Route path="/records/student-event-attended" element={
        <ProtectedRoute allowedRoles={['Student']}>
          <RecordsLayoutWithLocation includeStudentProvider={true}>
            <StudentEventAttended />
          </RecordsLayoutWithLocation>
        </ProtectedRoute>
      } />
      <Route path="/records/student-event-organized" element={
        <ProtectedRoute allowedRoles={['Student']}>
          <RecordsLayoutWithLocation includeStudentProvider={true}>
            <StudentEventOrganized />
          </RecordsLayoutWithLocation>
        </ProtectedRoute>
      } />
      <Route path="/records/student-certificates" element={
        <ProtectedRoute allowedRoles={['Student']}>
          <RecordsLayoutWithLocation includeStudentProvider={true}>
            <StudentCertificate />
          </RecordsLayoutWithLocation>
        </ProtectedRoute>
      } />
      <Route path="/records/student-online-courses" element={
        <ProtectedRoute allowedRoles={['Student']}>
          <RecordsLayoutWithLocation includeStudentProvider={true}>
            <StudentOnlineCourses />
          </RecordsLayoutWithLocation>
        </ProtectedRoute>
      } />
      <Route path="/records/student-achievements" element={
        <ProtectedRoute allowedRoles={['Student']}>
          <RecordsLayoutWithLocation includeStudentProvider={true}>
            <StudentAchievements />
          </RecordsLayoutWithLocation>
        </ProtectedRoute>
      } />
      <Route path="/records/student-internships" element={
        <ProtectedRoute allowedRoles={['Student']}>
          <RecordsLayoutWithLocation includeStudentProvider={true}>
            <StudentInternship />
          </RecordsLayoutWithLocation>
        </ProtectedRoute>
      } />
      <Route path="/records/student-scholarships" element={
        <ProtectedRoute allowedRoles={['Student']}>
          <RecordsLayoutWithLocation includeStudentProvider={true}>
            <StudentScholarship />
          </RecordsLayoutWithLocation>
        </ProtectedRoute>
      } />
      <Route path="/records/student-leave" element={
        <ProtectedRoute allowedRoles={['Student']}>
          <RecordsLayoutWithLocation includeStudentProvider={true}>
            <StudentLeave />
          </RecordsLayoutWithLocation>
        </ProtectedRoute>
      } />
      <Route path="/records/studenthackathon" element={
        <ProtectedRoute allowedRoles={['Student']}>
          <RecordsLayoutWithLocation includeStudentProvider={true}>
            <Hackathon />
          </RecordsLayoutWithLocation>
        </ProtectedRoute>
      } />

      <Route path="/records/student-profile" element={
        <ProtectedRoute allowedRoles={['Student']}>
          <RecordsLayoutWithLocation><MyProfile /></RecordsLayoutWithLocation>
        </ProtectedRoute>
      } />
      <Route path="/records/student-biodata/:userId" element={
        <ProtectedRoute allowedRoles={['Student', 'Staff', 'Admin']}>
          <RecordsLayoutWithLocation includeStudentProvider={true}>
            <StudentBioData />
          </RecordsLayoutWithLocation>
        </ProtectedRoute>
      } />
      <Route path="/records/student-extracurricular" element={
  <ProtectedRoute allowedRoles={['Student']}>
    <RecordsLayoutWithLocation includeStudentProvider={true}>
      <ExtracurricularActivities />
    </RecordsLayoutWithLocation>
  </ProtectedRoute>
} />
      <Route path="/records/student-project" element={
  <ProtectedRoute allowedRoles={['Student']}>
    <RecordsLayoutWithLocation includeStudentProvider={true}>
      <StudentProject />
    </RecordsLayoutWithLocation>
  </ProtectedRoute>
} />

<Route path="/records/student-competency" element={
  <ProtectedRoute allowedRoles={['Student']}>
    <RecordsLayoutWithLocation includeStudentProvider={true}>
      <StudentCompetency />
    </RecordsLayoutWithLocation>
  </ProtectedRoute>
} />

<Route path="/records/student-publication" element={
  <ProtectedRoute allowedRoles={['Student']}>
    <RecordsLayoutWithLocation includeStudentProvider={true}>
      <Publication />
    </RecordsLayoutWithLocation>
  </ProtectedRoute>
} />
<Route path="/records/student-education" element={
  <ProtectedRoute allowedRoles={['Student']}>
    <RecordsLayoutWithLocation includeStudentProvider={true}>
      <StudentEducation />
    </RecordsLayoutWithLocation>
  </ProtectedRoute>
} />

<Route path="/records/noncgpa" element={
  <ProtectedRoute allowedRoles={['Student']}>
    <RecordsLayoutWithLocation includeStudentProvider={true}>
      <NonCGPA />
    </RecordsLayoutWithLocation>
  </ProtectedRoute>
} />
<Route path="/records/noncgpa-category" element={
  <ProtectedRoute allowedRoles={['Admin']}>
    <RecordsLayoutWithLocation includeStudentProvider={true}>
      <NonCGPACategory />
    </RecordsLayoutWithLocation>
  </ProtectedRoute>
} />






      {/* Common Protected Routes (All authenticated users) */}
      <Route path="/records/profile" element={
        <ProtectedRoute>
          <RecordsLayoutWithLocation><MyProfile /></RecordsLayoutWithLocation>
        </ProtectedRoute>
      } />
      <Route path="/records/dashboard" element={
        <ProtectedRoute>
          <RecordsLayoutWithLocation>
            <DashboardProvider>
              <Dashboard />
            </DashboardProvider>
          </RecordsLayoutWithLocation>
        </ProtectedRoute>
      } />
      <Route path="/records/sheet" element={
        <ProtectedRoute allowedRoles={['Staff', 'Admin']}>
          <RecordsLayoutWithLocation><Sheet /></RecordsLayoutWithLocation>
        </ProtectedRoute>
      } />

      {/* Catch all route - redirect to home */}
      <Route path="*" element={
        <div className="flex flex-col min-h-screen bg-white">
          <Navbar />
          <ApplyNowButton />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-800 mb-4">404 - Page Not Found</h1>
              <p className="text-gray-600 mb-8">The page you're looking for doesn't exist.</p>
              <a 
                href="/" 
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Go Home
              </a>
            </div>
          </div>
          <Footer />
        </div>
      } />
    </Routes>
  );
};

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 4800); // Show preloader for 4.8 seconds
    return () => clearTimeout(timer);
  }, []);

  if (loading) return <Preloader />;

  return (
    <StudentDataProvider>
          <CertificateProvider>

      <CourseProvider>
        <NonCGPACategoryProvider>
        <NonCGPAProvider>
        <StudentEducationProvider>
        <ExtracurricularProvider>
          <ProjectProvider>
            <CompetencyCodingProvider>
              <PublicationProvider>
                <HackathonProvider>
          <AchievementProvider>
            <OnlineCoursesProvider>
              <LeaveProvider>
                <OrganizedEventProvider>
                  <ScholarshipProvider>
                    <LocationProvider>
                      <AppProvider>
                        <AttendedEventProvider>
                          <InternProvider> 
                            <DashboardProvider> 
                              <UserProvider>
                                <StudentProvider>
                                  <StaffProvider>
                                    <Router>
                                      <AppRoutes />
                                    </Router>
                                  </StaffProvider>
                                </StudentProvider>
                              </UserProvider>
                            </DashboardProvider>
                          </InternProvider>
                        </AttendedEventProvider>
                      </AppProvider>
                    </LocationProvider>
                  </ScholarshipProvider>
                </OrganizedEventProvider>
              </LeaveProvider>
            </OnlineCoursesProvider>
          </AchievementProvider>
        </HackathonProvider>
        </PublicationProvider>
        </CompetencyCodingProvider>
        </ProjectProvider>
        </ExtracurricularProvider>
</StudentEducationProvider>
</NonCGPAProvider>
</NonCGPACategoryProvider>
      </CourseProvider>
          </CertificateProvider>

    </StudentDataProvider>
  );
}

export default App;