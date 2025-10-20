import React, { createContext, useContext, useState, useCallback } from "react";
import axios from "axios";

const StudentEducationContext = createContext();

export const useStudentEducation = () => {
  const context = useContext(StudentEducationContext);
  if (!context) {
    throw new Error("useStudentEducation must be used within a StudentEducationProvider");
  }
  return context;
};

export const StudentEducationProvider = ({ children }) => {
  const [educationRecord, setEducationRecord] = useState(null);
  const [averages, setAverages] = useState(null);
  const [arrearsInfo, setArrearsInfo] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [allRecords, setAllRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const apiBase = "http://localhost:4000/api/student-education";

  const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
  });

  // ========================
  // MAIN EDUCATION METHODS
  // ========================

  const addOrUpdateEducation = async (educationData) => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${apiBase}/add-or-update`,
        educationData,
        getAuthHeader()
      );
      setError(null);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to save education record";
      setError(errorMsg);
      console.error("Add/Update education error:", err);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const fetchEducationRecord = useCallback(async (userId) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${apiBase}/my-record?UserId=${userId}`,
        getAuthHeader()
      );
      setEducationRecord(response.data.education || null);
      setError(null);
    } catch (err) {
      if (err.response?.status === 404) {
        setEducationRecord(null);
      } else {
        setError(err.response?.data?.message || "Failed to fetch education record");
      }
      console.error("Fetch education record error:", err);
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  const fetchAverages = useCallback(async (userId) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${apiBase}/averages?UserId=${userId}`,
        getAuthHeader()
      );
      setAverages(response.data || null);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch averages");
      console.error("Fetch averages error:", err);
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  const fetchArrearsInfo = useCallback(async (userId) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${apiBase}/arrears-info?UserId=${userId}`,
        getAuthHeader()
      );
      setArrearsInfo(response.data.arrearsInfo || null);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch arrears info");
      console.error("Fetch arrears info error:", err);
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  // ========================
  // ADMIN/TUTOR METHODS
  // ========================

  const fetchAllRecords = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${apiBase}/all-records`,
        getAuthHeader()
      );
      setAllRecords(response.data.records || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch all records");
      console.error("Fetch all records error:", err);
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  const fetchStatistics = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${apiBase}/statistics`,
        getAuthHeader()
      );
      setStatistics(response.data.statistics || null);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch statistics");
      console.error("Fetch statistics error:", err);
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  const searchByGPA = async (minCGPA, maxCGPA) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${apiBase}/search-by-gpa?minCGPA=${minCGPA}&maxCGPA=${maxCGPA}`,
        getAuthHeader()
      );
      setError(null);
      return response.data.records || [];
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to search by GPA";
      setError(errorMsg);
      console.error("Search by GPA error:", err);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentsWithArrears = async (type = 'both') => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${apiBase}/students-with-arrears?type=${type}`,
        getAuthHeader()
      );
      setError(null);
      return response.data.records || [];
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to fetch students with arrears";
      setError(errorMsg);
      console.error("Fetch students with arrears error:", err);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const verifyRecord = async (recordId, userId, comments = "") => {
    setLoading(true);
    try {
      const response = await axios.put(
        `${apiBase}/verify/${recordId}`,
        { Userid: userId, comments },
        getAuthHeader()
      );
      setError(null);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to verify record";
      setError(errorMsg);
      console.error("Verify record error:", err);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return (
    <StudentEducationContext.Provider
      value={{
        educationRecord,
        averages,
        arrearsInfo,
        statistics,
        allRecords,
        loading,
        error,
        addOrUpdateEducation,
        fetchEducationRecord,
        fetchAverages,
        fetchArrearsInfo,
        fetchAllRecords,
        fetchStatistics,
        searchByGPA,
        fetchStudentsWithArrears,
        verifyRecord,
        clearError
      }}
    >
      {children}
    </StudentEducationContext.Provider>
  );
};