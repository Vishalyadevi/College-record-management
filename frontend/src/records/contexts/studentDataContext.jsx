import React, { createContext, useContext, useState, useCallback } from 'react';
import axios from 'axios';

const StudentDataContext = createContext();

export const StudentDataProvider = ({ children }) => {
  const [studentData, setStudentData] = useState(null);
  const [courses, setCourses] = useState([]);
  const [internships, setInternships] = useState([]);
  const [organizedEvents, setOrganizedEvents] = useState([]);
  const [attendedEvents, setAttendedEvents] = useState([]);
  const [scholarships, setScholarships] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const backendUrl = "http://localhost:4000";

  const fetchAllData = useCallback(async (userId) => {
    if (!userId) {
      setError("No user ID provided");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const endpoints = [
        { url: `${backendUrl}/api/biodata/${userId}`, setter: setStudentData },
        { url: `${backendUrl}/api/user-courses/${userId}`, setter: (data) => setCourses(data?.courses || []) },
        { url: `${backendUrl}/api/approved-internships/${userId}`, setter: setInternships },
        { url: `${backendUrl}/api/approved-events-organized/${userId}`, setter: setOrganizedEvents },
        { url: `${backendUrl}/api/approved-events/${userId}`, setter: setAttendedEvents },
        { url: `${backendUrl}/api/fetch-scholarships/${userId}`, setter: setScholarships },
        { url: `${backendUrl}/api/fetch-leaves/${userId}`, setter: setLeaves },
        { url: `${backendUrl}/api/achievements/${userId}`, setter: setAchievements }
      ];

      const requests = endpoints.map(async ({ url, setter }) => {
        try {
          const response = await axios.get(url);
          setter(response.data || []);
        } catch (err) {
          console.error(`Error fetching ${url}:`, err);
          setter([]); // Set empty array if request fails
        }
      });

      await Promise.all(requests);
      
    } catch (err) {
      setError(err.message || "Failed to fetch student data");
      console.error("Error in fetchAllData:", err);
    } finally {
      setLoading(false);
    }
  }, [backendUrl]);

  const refreshData = useCallback((userId) => {
    fetchAllData(userId);
  }, [fetchAllData]);

  const value = {
    studentData,
    courses,
    internships,
    organizedEvents,
    attendedEvents,
    scholarships,
    leaves,
    achievements,
    loading,
    error,
    fetchAllData,
    refreshData
  };

  return (
    <StudentDataContext.Provider value={value}>
      {children}
    </StudentDataContext.Provider>
  );
};

export const useStudentData = () => {
  const context = useContext(StudentDataContext);
  if (!context) {
    throw new Error('useStudentData must be used within a StudentDataProvider');
  }
  return context;
};