import React, { createContext, useContext, useState, useCallback } from "react";
import axios from "axios";

const NonCGPAContext = createContext();

export const useNonCGPA = () => {
  const context = useContext(NonCGPAContext);
  if (!context) {
    throw new Error("useNonCGPA must be used within a NonCGPAProvider");
  }
  return context;
};

export const NonCGPAProvider = ({ children }) => {
  const [records, setRecords] = useState([]);
  const [pendingRecords, setPendingRecords] = useState([]);
  const [verifiedRecords, setVerifiedRecords] = useState([]);
  const [categories, setCategories] = useState([]);
  const [courseNames, setCourseNames] = useState([]);
  const [courseCodes, setCourseCodes] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const apiBase = "http://localhost:4000/api/noncgpa";

  const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
  });

  // Fetch categories for dropdown
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${apiBase}/dropdown/categories`,
        getAuthHeader()
      );
      setCategories(response.data.categories || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch categories");
      console.error("Fetch categories error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch course names for dropdown
  const fetchCourseNames = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${apiBase}/dropdown/course-names`,
        getAuthHeader()
      );
      setCourseNames(response.data.courseNames || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch course names");
      console.error("Fetch course names error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch course codes for dropdown
  const fetchCourseCodes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${apiBase}/dropdown/course-codes`,
        getAuthHeader()
      );
      setCourseCodes(response.data.courseCodes || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch course codes");
      console.error("Fetch course codes error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get category details by ID
  const fetchCategoryDetails = async (categoryId) => {
    try {
      const response = await axios.get(
        `${apiBase}/category-details/${categoryId}`,
        getAuthHeader()
      );
      return response.data.category;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch category details");
      console.error("Fetch category details error:", err);
      throw err;
    }
  };

  // Fetch student's non-CGPA records
  const fetchStudentRecords = useCallback(async (userId) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${apiBase}/my-records?UserId=${userId}`,
        getAuthHeader()
      );
      setRecords(response.data.records || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch records");
      console.error("Fetch student records error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch pending records (Tutor)
  const fetchPendingRecords = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${apiBase}/pending`,
        getAuthHeader()
      );
      setPendingRecords(response.data.records || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch pending records");
      console.error("Fetch pending records error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch verified records
  const fetchVerifiedRecords = useCallback(async (userId) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${apiBase}/verified-records?UserId=${userId}`,
        getAuthHeader()
      );
      setVerifiedRecords(response.data.records || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch verified records");
      console.error("Fetch verified records error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Add new non-CGPA record
  const addNonCGPARecord = async (recordData) => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${apiBase}/add`,
        recordData,
        getAuthHeader()
      );
      await fetchStudentRecords(recordData.Userid);
      setError(null);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add record");
      console.error("Add record error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update non-CGPA record
  const updateNonCGPARecord = async (recordId, recordData) => {
    setLoading(true);
    try {
      const response = await axios.put(
        `${apiBase}/update/${recordId}`,
        recordData,
        getAuthHeader()
      );
      await fetchStudentRecords(recordData.Userid);
      setError(null);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update record");
      console.error("Update record error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete non-CGPA record
  const deleteNonCGPARecord = async (recordId, userId) => {
    setLoading(true);
    try {
      const response = await axios.delete(
        `${apiBase}/delete/${recordId}`,
        {
          ...getAuthHeader(),
          data: { Userid: userId }
        }
      );
      await fetchStudentRecords(userId);
      setError(null);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete record");
      console.error("Delete record error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Verify non-CGPA record (Tutor)
  const verifyRecord = async (recordId, verifierId, comments = "") => {
    setLoading(true);
    try {
      const response = await axios.put(
        `${apiBase}/verify/${recordId}`,
        { 
          Userid: verifierId,
          verification_comments: comments
        },
        getAuthHeader()
      );
      await fetchPendingRecords();
      setError(null);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to verify record");
      console.error("Verify record error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Reject non-CGPA record (Tutor)
  const rejectRecord = async (recordId, verifierId, comments = "") => {
    setLoading(true);
    try {
      const response = await axios.put(
        `${apiBase}/reject/${recordId}`,
        { 
          Userid: verifierId,
          verification_comments: comments
        },
        getAuthHeader()
      );
      await fetchPendingRecords();
      setError(null);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reject record");
      console.error("Reject record error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStatistics = useCallback(async (userId) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${apiBase}/statistics?UserId=${userId}`,
        getAuthHeader()
      );
      setStatistics(response.data.statistics);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch statistics");
      console.error("Fetch statistics error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <NonCGPAContext.Provider
      value={{
        records,
        pendingRecords,
        verifiedRecords,
        categories,
        courseNames,
        courseCodes,
        statistics,
        loading,
        error,
        fetchCategories,
        fetchCourseNames,
        fetchCourseCodes,
        fetchCategoryDetails,
        fetchStudentRecords,
        fetchPendingRecords,
        fetchVerifiedRecords,
        addNonCGPARecord,
        updateNonCGPARecord,
        deleteNonCGPARecord,
        verifyRecord,
        rejectRecord,
        fetchStatistics,
        clearError: () => setError(null)
      }}
    >
      {children}
    </NonCGPAContext.Provider>
  );
};