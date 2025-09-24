import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../../styles/studentUpcomingDrive.css';
import Navbar from './navbar';
import CustomAlert from "../CustomAlert";

const StudentUpcomingDrives = () => {
  const [drives, setDrives] = useState([]);
  const [registeredDrives, setRegisteredDrives] = useState([]);
  const [alertMessage, setAlertMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Get regno and userId from localStorage
  const studentRegNo = localStorage.getItem("studentRegno") || localStorage.getItem("regno");
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    fetchUpcomingDrives();
    if (studentRegNo) {
      fetchRegisteredDrives();
    }
  }, [studentRegNo]);

  // Fetch all upcoming drives
  const fetchUpcomingDrives = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:4000/api/placement/upcoming-drives");
      setDrives(response.data);
      setError("");
    } catch (error) {
      console.error("Error fetching upcoming drives:", error);
      setError("Failed to fetch upcoming drives. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Get already registered drives by regno
  const fetchRegisteredDrives = async () => {
    try {
      const response = await axios.get(`http://localhost:4000/api/placement/registered-drives/${studentRegNo}`);
      const registeredCompanies = response.data.map(item => item.company_name);
      setRegisteredDrives(registeredCompanies);
    } catch (error) {
      console.error("Error fetching registered drives:", error);
    }
  };

  // Handle drive registration
  const handleRegister = async (driveId, companyName) => {
    if (!studentRegNo || !userId) {
      setAlertMessage("Student registration information not found. Please log in again.");
      return;
    }

    if (registeredDrives.includes(companyName)) {
      setAlertMessage(`You have already registered for ${companyName}`);
      return;
    }

    try {
      await axios.post("http://localhost:4000/api/placement/register-drive", {
        drive_id: driveId,
        regno: studentRegNo,
        company_name: companyName,
        register: true,
        created_by: userId
      });

      setAlertMessage(`Successfully registered for ${companyName}`);
      fetchRegisteredDrives(); // Refresh registered drives
    } catch (error) {
      console.error("Error registering for drive:", error.response?.data || error.message);
      const errorMsg = error.response?.data?.message || error.response?.data?.error || "Error registering for drive. Please try again.";
      setAlertMessage(errorMsg);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <br></br>
      <br></br>
      <br></br>
        <div className="student-upcomingdrive">
          <div className="loading">Loading upcoming drives...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <br></br>
      <br></br>
      <br></br>
      {alertMessage && (
        <CustomAlert message={alertMessage} onClose={() => setAlertMessage("")} />
      )}

      <div className="student-upcomingdrive">
        <h1 className="title">Upcoming Drives</h1>
        
        {error && <div className="error-message">{error}</div>}

        <div className="drives-container">
          {drives.length > 0 ? (
            drives.map((drive) => (
              <div key={drive.id} className="drive-card">
                {drive.post && (
                  <div className="company-post">
                    <img
                      src={`http://localhost:4000/Uploads/${drive.post}`} // Fixed path - backend serves from /Uploads
                      alt="Company Post"
                      className="company-logo"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                
                <div className="drive-details">
                  <h3 className="company-name">{drive.company_name}</h3>
                  <div className="drive-info">
                    <p><strong>Eligibility:</strong> {drive.eligibility}</p>
                    <p><strong>Date:</strong> {new Date(drive.date).toLocaleDateString('en-IN')}</p>
                    <p><strong>Time:</strong> {drive.time}</p>
                    <p><strong>Venue:</strong> {drive.venue}</p>
                    <p><strong>Role:</strong> {drive.roles}</p>
                    <p><strong>Package:</strong> {drive.salary}</p>
                  </div>
                </div>

                <div className="drive-actions">
                  <button
                    className={`register-btn ${registeredDrives.includes(drive.company_name) ? 'applied' : ''}`}
                    onClick={() => handleRegister(drive.id, drive.company_name)}
                    disabled={registeredDrives.includes(drive.company_name)}
                  >
                    {registeredDrives.includes(drive.company_name) ? "Applied ✓" : "Apply Now"}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="no-drives">
              <p>No upcoming drives available at the moment.</p>
              <p>Please check back later for new opportunities.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default StudentUpcomingDrives;