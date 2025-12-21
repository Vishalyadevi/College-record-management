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
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [allRecords, setAllRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const apiBase = "http://localhost:4000/api/student-education";

  const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
  });

  // STUDENT METHODS
  const addOrUpdateEducation = async (educationData) => {
    setLoading(true);
    try {
      const response = await axios.post(`${apiBase}/add-or-update`, educationData, getAuthHeader());
      setError(null);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to save education record";
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const fetchEducationRecord = useCallback(async (userId) => {
    setLoading(true);
    try {
      const response = await axios.get(`${apiBase}/my-record?UserId=${userId}`, getAuthHeader());
      setEducationRecord(response.data.education || null);
      setError(null);
    } catch (err) {
      if (err.response?.status === 404) {
        setEducationRecord(null);
      } else {
        setError(err.response?.data?.message || "Failed to fetch education record");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAverages = useCallback(async (userId) => {
    setLoading(true);
    try {
      const response = await axios.get(`${apiBase}/averages?UserId=${userId}`, getAuthHeader());
      setAverages(response.data || null);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch averages");
    } finally {
      setLoading(false);
    }
  }, []);

  // STAFF METHODS
  const fetchPendingApprovals = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${apiBase}/pending-approvals`, getAuthHeader());
      setPendingApprovals(response.data.records || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch pending approvals");
    } finally {
      setLoading(false);
    }
  }, []);

  const approveRecord = async (recordId, userId, comments = "") => {
    setLoading(true);
    try {
      const response = await axios.put(`${apiBase}/approve/${recordId}`, { Userid: userId, comments }, getAuthHeader());
      setError(null);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to approve record";
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const rejectRecord = async (recordId, userId, reason = "") => {
    setLoading(true);
    try {
      const response = await axios.put(`${apiBase}/reject/${recordId}`, { Userid: userId, reason }, getAuthHeader());
      setError(null);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to reject record";
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const bulkUploadGPA = async (data) => {
    setLoading(true);
    try {
      const response = await axios.post(`${apiBase}/bulk-upload-gpa`, { data }, getAuthHeader());
      setError(null);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to upload GPA data";
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllRecords = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${apiBase}/all-records`, getAuthHeader());
      setAllRecords(response.data.records || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch all records");
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = () => setError(null);

  return (
    <StudentEducationContext.Provider
      value={{
        educationRecord,
        averages,
        pendingApprovals,
        allRecords,
        loading,
        error,
        addOrUpdateEducation,
        fetchEducationRecord,
        fetchAverages,
        fetchPendingApprovals,
        approveRecord,
        rejectRecord,
        bulkUploadGPA,
        fetchAllRecords,
        clearError
      }}
    >
      {children}
    </StudentEducationContext.Provider>
  );
};