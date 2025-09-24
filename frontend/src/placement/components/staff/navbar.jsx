import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import LogoutButton from "../Logout";

const Navbar = () => {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    // Fetch notifications from the placement API
    axios
      .get("http://localhost:4000/api/placement/notifications")
      .then((res) => {
        setNotifications(res.data);
      })
      .catch((err) => {
        console.error("Error fetching notifications:", err);
      });
  }, []);

  const styles = {
    navbar: {
      background: "#003087",
      color: "white",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "12px 20px",
      boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
      fontFamily: '"Arial", sans-serif',
      width: "100%",
      position: "fixed",
      top: 0,
      left: 0,
      zIndex: 1000,
      height: "80px",
    },
    navbarLogo: {
      display: "flex",
      alignItems: "center",
      fontSize: "18px",
      fontWeight: "bold",
      gap: "12px",
      whiteSpace: "nowrap",
    },
    navbarLogoImg: {
      width: "60px",
      height: "auto",
      borderRadius: "10px",
      marginLeft: "20px",
    },
    navbarLinks: {
      listStyle: "none",
      display: "flex",
      gap: "30px",
      margin: 0,
      padding: 0,
      flex: 1,
      justifyContent: "center",
    },
    navbarLinksA: {
      textDecoration: "none",
      color: "white",
      fontSize: "18px",
      fontWeight: "500",
      padding: "8px 12px",
      borderRadius: "5px",
      transition: "0.3s ease-in-out",
    },
    navbarRight: {
      display: "flex",
      alignItems: "center",
      gap: "30px",
      marginRight: "20px",
    },
    materialIcon: {
      fontSize: "34px",
      cursor: "pointer",
      transition: "0.3s ease-in-out",
      color: "white",
    },
    notificationIcon: {
      fontSize: "30px",
      marginRight: "15px",
      position: "relative",
      cursor: "pointer",
      transition: "0.3s ease",
    },
    notificationWrapper: {
      position: "relative",
      display: "inline-block",
    },
    notificationDropdown: {
      position: "absolute",
      top: "40px",
      right: 0,
      width: "300px",
      maxHeight: "300px",
      overflowY: "auto",
      backgroundColor: "#fff",
      border: "1px solid #ccc",
      borderRadius: "5px",
      boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
      zIndex: 1000,
      padding: "10px",
    },
    notificationItem: {
      padding: "10px",
      borderBottom: "1px solid #f0f0f0",
      fontSize: "14px",
      color: "#333",
      cursor: "pointer",
    },
    logoutButton: {
      background: "#ff4c4c",
      color: "white",
      padding: "7px 14px",
      border: "none",
      borderRadius: "5px",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "bold",
      transition: "0.3s ease-in-out",
    },
  };

  return (
    <>
      <nav style={styles.navbar}>
        {/* Logo */}
        <div style={styles.navbarLogo}>
          <img
            src="https://lms.nec.edu.in/pluginfile.php/1/theme_academi/logo/1739862648/logo.jpeg"
            alt="NEC Logo"
            style={styles.navbarLogoImg}
          />
          <span>National Engineering College</span>
        </div>

        {/* Navigation Links */}
        <ul style={styles.navbarLinks}>
          <li>
            <Link to="/placement/home" style={styles.navbarLinksA}>
              Home
            </Link>
          </li>
          <li>
            <Link to="/placement/staff-recruiters" style={styles.navbarLinksA}>
              Recruiters
            </Link>
          </li>
          <li>
            <Link to="/placement/upcoming-drive" style={styles.navbarLinksA}>
              Upcoming Drive
            </Link>
          </li>
          <li>
            <Link to="/placement/status" style={styles.navbarLinksA}>
              Status
            </Link>
          </li>
          <li>
            <Link to="/placement/hackathon" style={styles.navbarLinksA}>
              Hackathon
            </Link>
          </li>
        </ul>

        {/* Right Section */}
        <div style={styles.navbarRight}>
          {/* Notifications */}
          <div
            style={styles.notificationWrapper}
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <span className="material-symbols-outlined" style={styles.notificationIcon}>
              notifications
            </span>
            {showDropdown && (
              <div style={styles.notificationDropdown}>
                {notifications.length === 0 ? (
                  <p style={{ ...styles.notificationItem, textAlign: "center", color: "#888" }}>
                    No new notifications
                  </p>
                ) : (
                  notifications.map((notif, index) => (
                    <p
                      key={notif.id || index}
                      style={{
                        ...styles.notificationItem,
                        borderBottom:
                          index === notifications.length - 1 ? "none" : "1px solid #f0f0f0",
                      }}
                    >
                      {notif.message}
                    </p>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Profile */}
          <Link to="/placement/studentprofile" title="Profile">
            <span className="material-symbols-outlined" style={styles.materialIcon}>
              account_circle
            </span>
          </Link>

          {/* Logout */}
          <LogoutButton style={styles.logoutButton} />
        </div>
      </nav>

      {/* Push content down */}
      <div style={{ marginTop: "90px" }} />
    </>
  );
};

export default Navbar;