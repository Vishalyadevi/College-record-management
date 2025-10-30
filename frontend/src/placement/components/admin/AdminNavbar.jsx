import React, { useEffect, useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { 
  FaHome, 
  FaBuilding, 
  FaCalendarAlt, 
  FaUserGraduate, 
  FaCode, 
  FaUsers, 
  FaComments,
  FaBell
} from "react-icons/fa";

const Sidebar = () => {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get("http://localhost:4000/api/placement/notifications")
      .then((res) => setNotifications(res.data || []))
      .catch((err) => console.error("Error fetching notifications:", err));
  }, []);

  useEffect(() => {
    setShowDropdown(false);
  }, [location.pathname]);

  const menuItems = [
    // { name: "Home", path: "/placement/admin-home", icon: <FaHome /> },
    { name: "Recruiters", path: "/placement/admin-recruiters", icon: <FaBuilding /> },
    { name: "Upcoming Drive", path: "/placement/admin-upcoming-drive", icon: <FaCalendarAlt /> },
    { name: "Registered Student", path: "/placement/admin-registered-students", icon: <FaUserGraduate /> },
    { name: "Hackathon", path: "/placement/admin-hackathon", icon: <FaCode /> },
        { name: "Report Hackathon", path: "/placement/admin-hackathon-report", icon: <FaCode /> },

    { name: "Eligible Students", path: "/placement/eligible-students", icon: <FaUsers /> },
    { name: "Feedback", path: "/placement/admin-feedback", icon: <FaComments /> },
  ];

  const handleLogout = () => {
    localStorage.clear();
    navigate("/placement/login");
  };

  return (
    <div className="fixed w-64 h-screen flex flex-col shadow-xl"
      style={{
background: "linear-gradient(135deg, #1c1182ff 0%, #180e9cff 100%)"
   }}
    >
      {/* Logo Section */}
      <div className="p-6 border-b border-white/20 flex flex-col items-center">
        <div className="w-24 h-24 rounded-full flex items-center justify-center bg-white/10 backdrop-blur-sm border-2 border-white/30 shadow-lg">
          <img
            src="https://lms.nec.edu.in/pluginfile.php/1/theme_academi/logo/1739862648/logo.jpeg"
            alt="NEC Logo"
            className="w-20 h-20 rounded-full object-contain"
          />
        </div>

        <div className="mt-4 text-center">
          <p className="text-lg font-semibold text-white">National Engineering College</p>
          <p className="text-sm text-white/80 mt-1">Placement Portal</p>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto py-6 px-3">
        {menuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 py-3 px-4 mb-2 text-sm font-medium rounded-xl transition-all duration-300 ${
                isActive 
                  ? "bg-white/20 text-white shadow-lg backdrop-blur-sm border border-white/30" 
                  : "text-white/90 hover:bg-white/10 hover:shadow-md backdrop-blur-sm border border-transparent"
              }`
            }
          >
            <span className={`text-lg ${location.pathname === item.path ? 'text-white' : 'text-white/80'}`}>
              {item.icon}
            </span>
            <span className="font-medium">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Notifications & Logout Section */}
      <div className="p-4 border-t border-white/20">
        {/* Notifications */}
        <div className="relative mb-3">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center justify-between w-full py-3 px-4 text-sm font-medium text-white bg-white/15 hover:bg-white/25 rounded-xl transition-all duration-300 backdrop-blur-sm border border-white/20 hover:shadow-md"
          >
            <span className="flex items-center gap-3">
              <FaBell className="text-lg" />
              Notifications
            </span>
            {notifications.length > 0 && (
              <span className="bg-rose-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                {notifications.length}
              </span>
            )}
          </button>

          {showDropdown && (
            <div className="absolute bottom-full left-0 mb-2 w-full bg-white/95 backdrop-blur-lg border border-white/30 rounded-xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto z-50">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-600 text-sm">
                  No new notifications
                </div>
              ) : (
                notifications.map((notif, index) => (
                  <div
                    key={index}
                    className="px-4 py-3 text-sm text-gray-700 hover:bg-gray-50/80 transition-colors border-b border-gray-100 last:border-b-0"
                  >
                    {notif.message}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Logout Button */}
        <button
          className="w-full py-3 px-4 text-sm font-semibold text-white rounded-xl transition-all duration-300 hover:shadow-lg backdrop-blur-sm border border-white/30"
          style={{
            background: "linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)",
          }}
          onClick={handleLogout}
          onMouseOver={(e) => {
            e.target.style.background = "linear-gradient(135deg, #ff5252 0%, #e53935 100%)";
          }}
          onMouseOut={(e) => {
            e.target.style.background = "linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)";
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;