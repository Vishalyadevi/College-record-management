import React, { createContext, useContext, useState, useCallback } from "react";
import axios from "axios";

const ExtracurricularContext = createContext();

export const useExtracurricular = () => {
  const context = useContext(ExtracurricularContext);
  if (!context) {
    throw new Error("useExtracurricular must be used within an ExtracurricularProvider");
  }
  return context;
};

export const ExtracurricularProvider = ({ children }) => {
  const [activities, setActivities] = useState([]);
  const [pendingActivities, setPendingActivities] = useState([]);
  const [approvedActivities, setApprovedActivities] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const apiBase = "http://localhost:4000/api/extracurricular";

  const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
  });

  // Fetch student's extracurricular activities
  const fetchStudentActivities = useCallback(async (userId) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${apiBase}/my-activities?UserId=${userId}`,
        getAuthHeader()
      );
      setActivities(response.data.activities || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch activities");
      console.error("Fetch activities error:", err);
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  // Fetch pending activities (for tutors/admins)
  const fetchPendingActivities = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${apiBase}/pending`,
        getAuthHeader()
      );
      setPendingActivities(response.data.activities || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch pending activities");
      console.error("Fetch pending activities error:", err);
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  // Fetch approved activities
  const fetchApprovedActivities = useCallback(async (userId) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${apiBase}/approved?UserId=${userId}`,
        getAuthHeader()
      );
      setApprovedActivities(response.data.activities || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch approved activities");
      console.error("Fetch approved activities error:", err);
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  // Fetch statistics
  const fetchStatistics = useCallback(async (userId) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${apiBase}/statistics?UserId=${userId}`,
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

  // Add new extracurricular activity
  const addActivity = async (activityData) => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${apiBase}/add`,
        activityData,
        getAuthHeader()
      );
      setError(null);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to add activity";
      setError(errorMsg);
      console.error("Add activity error:", err);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Update extracurricular activity
  const updateActivity = async (activityId, activityData) => {
    setLoading(true);
    try {
      const response = await axios.put(
        `${apiBase}/update/${activityId}`,
        activityData,
        getAuthHeader()
      );
      setError(null);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to update activity";
      setError(errorMsg);
      console.error("Update activity error:", err);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Delete extracurricular activity
  const deleteActivity = async (activityId) => {
    setLoading(true);
    try {
      const response = await axios.delete(
        `${apiBase}/delete/${activityId}`,
        getAuthHeader()
      );
      setError(null);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to delete activity";
      setError(errorMsg);
      console.error("Delete activity error:", err);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Approve activity (tutor/admin)
  const approveActivity = async (activityId, userId, comments = "") => {
    setLoading(true);
    try {
      const response = await axios.put(
        `${apiBase}/approve/${activityId}`,
        { Userid: userId, comments },
        getAuthHeader()
      );
      setError(null);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to approve activity";
      setError(errorMsg);
      console.error("Approve activity error:", err);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Reject activity (tutor/admin)
  const rejectActivity = async (activityId, userId, comments = "") => {
    setLoading(true);
    try {
      const response = await axios.put(
        `${apiBase}/reject/${activityId}`,
        { Userid: userId, comments },
        getAuthHeader()
      );
      setError(null);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to reject activity";
      setError(errorMsg);
      console.error("Reject activity error:", err);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return (
    <ExtracurricularContext.Provider
      value={{
        activities,
        pendingActivities,
        approvedActivities,
        statistics,
        loading,
        error,
        fetchStudentActivities,
        fetchPendingActivities,
        fetchApprovedActivities,
        fetchStatistics,
        addActivity,
        updateActivity,
        deleteActivity,
        approveActivity,
        rejectActivity,
        clearError
      }}
    >
      {children}
    </ExtracurricularContext.Provider>
  );
};