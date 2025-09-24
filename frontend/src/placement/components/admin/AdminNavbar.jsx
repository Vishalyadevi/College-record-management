import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import '../../styles/Navbar.css';
import LogoutButton from "../Logout";
import axios from "axios";

const Navbar = () => {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    axios.get("http://localhost:4000/api/placement/notifications")
      .then(res => {
        console.log("Notifications response:", res.data);
        setNotifications(res.data);
      })
      .catch(err => {
        console.error("Error fetching notifications:", err);
      });
  }, []);

  return (
    <nav className="navbar">
      {/* Logo Section */}
      <div className="navbar-logo">
        <img 
          src="https://lms.nec.edu.in/pluginfile.php/1/theme_academi/logo/1739862648/logo.jpeg" 
          alt="NEC Logo" 
          className="navbar-logo-img"
        />
        <span>National Engineering College</span>
      </div>

      {/* Navigation Links */}
      <ul className="navbar-links">
        <li><Link to="/placement/admin-home">Home</Link></li>
        <li><Link to="/placement/admin-recruiters">Recruiters</Link></li>  
        <li><Link to="/placement/admin-upcoming-drive">Upcoming Drive</Link></li>
        <li><Link to="/placement/admin-registered-students">Registered Student</Link></li>
        <li><Link to="/placement/admin-hackathon">Hackathon</Link></li>
                <li><Link to="/placement/eligible-students">Eligible Students</Link></li>
                        <li><Link to="/placement/admin-feedback">Feedback</Link></li>


      </ul>

      {/* Right Section: Notifications, Profile, Logout */}
      <div className="navbar-right">
        <div className="navbar-icons">
          {/* Notifications */}
          <div 
            className="notification-wrapper" 
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <span className="material-symbols-outlined">notifications</span>
            {notifications.length > 0 && (
              <span className="notification-badge">{notifications.length}</span>
            )}
            {showDropdown && (
              <div className="notification-dropdown">
                {notifications.length === 0 ? (
                  <p className="notification-item no-notifications">No new notifications</p>
                ) : (
                  notifications.map((notif, index) => (
                    <p key={index} className="notification-item">{notif.message}</p>
                  ))
                )}
              </div>
            )}
          </div>
        

        </div>

        <LogoutButton className="logout-button" />
      </div>
    </nav>
  );
};

export default Navbar;