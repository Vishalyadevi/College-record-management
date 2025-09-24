import React, { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  FaUserPlus, FaUsers, FaUserTie, FaChalkboardTeacher, FaTachometerAlt,
  FaUserGraduate, FaBook, FaMedal, FaCertificate, FaLaptopCode, FaCalendarAlt,
  FaSchool, FaPlane, FaAward, FaDownload, FaFileUpload
} from "react-icons/fa";
import { toast } from "react-toastify";
import axios from "axios";

const Sidebar = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [currentUser, setCurrentUser] = useState({
    role: "",
    username: "",
    profileImage: "",
  });
  const navigate = useNavigate();
  const location = useLocation();
  const backendUrl = "http://localhost:4000";

  useEffect(() => {
    const fetchCurrentUserDetails = async () => {
      try {
        const token = localStorage.getItem("token");
        const userId = localStorage.getItem("userId");

        if (!token || !userId) {
          return;
        }

        const response = await axios.get(`${backendUrl}/api/get-user/${userId}`);

        if (response.data.success) {
          setCurrentUser({
            role: response.data.user.role,
            username: response.data.user.username,
            profileImage: response.data.user.profileImage
              ? `${backendUrl}${response.data.user.profileImage}`
              : "https://thumbs.dreamstime.com/b/default-avatar-profile-icon-vector-social-media-user-image-182145777.jpg", // Default profile image
          });
        } else {
          toast.error("Failed to fetch user details");
        }
      } catch (error) {
        toast.error("Error fetching user details");
        console.error(error);
      }
    };

    fetchCurrentUserDetails();
  }, []);

  useEffect(() => {
    setShowDropdown(false);
  }, [location.pathname]);

  const role = localStorage.getItem("userRole");

  const renderSidebarItems = () => {
    switch (role) {
      case "Admin":
         return (
          <>
            <SidebarLink to="/records/admin" icon={<FaChalkboardTeacher />} label="Dashboard" />
            <SidebarLink to="/records/add-user" icon={<FaUserTie />} label="Add User" />
            <SidebarLink to="/records/student-list" icon={<FaUsers />} label="Student List" />
            <SidebarLink to="/records/staff-list" icon={<FaUserTie />} label="Staff List" />
            <SidebarLink to="/records/staff-activities" icon={<FaUserTie />} label="Staff Activities" />
            <SidebarLink to="/records/student-activities" icon={<FaUserTie />} label="Student Activities" />

            <SidebarLink to="/records/bulk" icon={<FaFileUpload />} label="Bulk Import" />
          </>
        );
      case "Staff":
        return (
          <>
            {/* FIXED: Changed routes to match App.tsx exactly */}
            <SidebarLink to="/records/staff" icon={<FaTachometerAlt />} label="Main Dashboard" />
            <SidebarLink to="/records/staff-dashboard" icon={<FaChalkboardTeacher />} label="Staff Dashboard" />
            <SidebarLink to="/records/myward" icon={<FaUsers />} label="My Ward" />
            <SidebarLink to="/records/personal" icon={<FaUserGraduate />} label="Personal" />
            <SidebarLink to="/records/education" icon={<FaBook />} label="Education" />
            <SidebarLink to="/records/scholars" icon={<FaUsers />} label="Scholars" />
            <SidebarLink to="/records/proposals" icon={<FaFileUpload />} label="Consultancy" />
            <SidebarLink to="/records/project-proposal" icon={<FaFileUpload />} label="Funded Project" />
            <SidebarLink to="/records/seed-money" icon={<FaFileUpload />} label="Seed Money" />
            <SidebarLink to="/records/events" icon={<FaCalendarAlt />} label="Events Attended" />
            <SidebarLink to="/records/industry" icon={<FaUserTie />} label="Industry Knowhow" />
            <SidebarLink to="/records/certifications" icon={<FaCertificate />} label="Certification Courses" />
            <SidebarLink to="/records/book-chapters" icon={<FaBook />} label="Publications" />
            <SidebarLink to="/records/events-organized" icon={<FaAward />} label="Events Organized" />
            <SidebarLink to="/records/h-index" icon={<FaFileUpload />} label="H-Index" />
            <SidebarLink to="/records/resource-person" icon={<FaUserGraduate />} label="Resource Person" />
            <SidebarLink to="/records/recognition" icon={<FaAward />} label="Recognition" />
            <SidebarLink to="/records/patent-product" icon={<FaFileUpload />} label="Patent/Product Development" />
            <SidebarLink to="/records/project-mentors" icon={<FaUsers />} label="Project Mentors" />
              <SidebarLink to="/placement/staff-home" icon={<FaUsers />} label="Placement" />
        </>
        );
      case "Student":
        return (
          <>
            <SidebarLink to="/records/student-background" icon={<FaTachometerAlt />} label="Dashboard" />
            <SidebarLink to="/records/student-personal-details" icon={<FaUserGraduate />} label="Personal Details" />
            {/*<SidebarLink to="/records/student-courses" icon={<FaBook />} label="Courses Enrolled" />*/}
            <SidebarLink to="/records/student-event-attended" icon={<FaCalendarAlt />} label="Events Attended" />
            <SidebarLink to="/records/student-event-organized" icon={<FaAward />} label="Events Organized" />
            <SidebarLink to="/records/student-certificates" icon={<FaCertificate />} label="Certifications" />
            <SidebarLink to="/records/student-online-courses" icon={<FaLaptopCode />} label="Online Courses" />
            <SidebarLink to="/records/student-achievements" icon={<FaMedal />} label="Achievements" />
            <SidebarLink to="/records/student-internships" icon={<FaSchool />} label="Internships" />
            <SidebarLink to="/records/student-scholarships" icon={<FaAward />} label="Scholarships" />
            <SidebarLink to="/records/student-leave" icon={<FaPlane />} label="Leave Request" />
                        <SidebarLink to="/placement/home" icon={<FaUsers />} label="Placement" />


          </>
        );
      default:
        return (
          <div className="p-4 text-center text-gray-500">
            <p>No menu items available for role: {role || 'Unknown'}</p>
            <p className="text-xs mt-2">Please contact administrator</p>
          </div>
        );
    }
  };


  return (
    <div className="fixed w-64 bg-white shadow-lg border-r border-gray-200 h-screen flex flex-col">
      {/* Profile Section */}
      <div className="p-6 border-b border-gray-200 flex flex-col items-center">
        {/* Profile Image Container */}
        <div
          className="relative w-24 h-24 rounded-full flex items-center justify-center cursor-pointer"
          style={{
            background: "linear-gradient(135deg, #7F56D9, #9B67FF)",
          }}
          onClick={() => setShowDropdown(!showDropdown)}
        >
          {/* Profile Image */}
          <img
            src={currentUser.profileImage}
            alt="profile"
            className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-sm"
          />
          {/* Dropdown Arrow */}
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md">
            <svg
              className={`w-3 h-3 text-purple-600 transition-transform ${
                showDropdown ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>

        {/* Username and Role */}
        <div className="mt-4 text-center">
          <p className="text-md font-semibold text-gray-700">{currentUser.username}</p>
          <p className="text-sm text-gray-500">{currentUser.role}</p>
        </div>

        {/* Enhanced Dropdown */}
        {showDropdown && (
          <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden w-48">
            <button
              className="block w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gradient-to-r from-purple-100 to-blue-100 transition-colors"
              onClick={() => navigate("/records/profile")}
            >
              My Profile
            </button>
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto py-4">
        {renderSidebarItems()}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-200">
        <button
          className="w-full py-2.5 px-4 text-sm font-medium text-white rounded-lg transition-colors hover:bg-gradient-to-r from-purple-600 to-blue-600"
          style={{
            background: "linear-gradient(135deg, #F87171, #EF4444)",
          }}
          onClick={() => {
            localStorage.removeItem("token");
            localStorage.removeItem("userId");
            toast.success("Logged out successfully");
            navigate("/records/login");
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
};

const SidebarLink = ({ to, icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-3 py-3 px-6 text-sm font-medium text-gray-700 hover:bg-gradient-to-r from-purple-100 to-blue-100 transition-colors ${
        isActive ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white" : ""
      }`
    }
  >
    <span className="text-lg">{icon}</span>
    <span>{label}</span>
  </NavLink>
);

export default Sidebar;