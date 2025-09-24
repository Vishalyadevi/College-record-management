import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";

// Create the context
const LeaveContext = createContext();

// Custom hook to use the LeaveContext
export const useLeave = () => {
  const context = useContext(LeaveContext);
  if (!context) {
    throw new Error("useLeave must be used within a LeaveProvider");
  }
  return context;
};

// LeaveProvider component
export const LeaveProvider = ({ children }) => {
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [approvedLeaves, setApprovedLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const backendUrl = "http://localhost:4000"; // Update if needed

  // Extract `userid` from the token
  const getUserId = () => {
    const Userid = localStorage.getItem("userId");
    return Userid;
  };

  // Fetch pending leaves
  const fetchPendingLeaves = useCallback(async () => {
    setLoading(true);
    const Userid = getUserId();
    if (!Userid) {
      setError("User ID not found. Please log in again.");
      setLoading(false);
      return;
    }
    try {
      const response = await axios.get(`${backendUrl}/api/pending-leaves`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        params: { Userid }, // Send userid as a parameter
      });
      setPendingLeaves(response.data.leaves || []);
      setError(null);
    } catch (error) {
      console.error("Error fetching pending leaves:", error);
      setError("Failed to fetch pending leaves.");
      setPendingLeaves([]);
    } finally {
      setLoading(false);
    }
  }, [backendUrl]);

  // Fetch approved leaves
  const fetchApprovedLeaves = useCallback(async () => {
    setLoading(true);
    const Userid = getUserId();
    if (!Userid) {
      setError("User ID not found. Please log in again.");
      setLoading(false);
      return;
    }
    try {
      const response = await axios.get(`${backendUrl}/api/fetch-leaves`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        params: { Userid },
      });
      setApprovedLeaves(response.data || []);
      setError(null);
    } catch (error) {
      console.error("Error fetching approved leaves:", error);
      setError("Failed to fetch approved leaves.");
      setApprovedLeaves([]);
    } finally {
      setLoading(false);
    }
  }, [backendUrl]);

  // Add a new leave request
  const addLeave = async (leaveData) => {
    setLoading(true);
    const Userid = getUserId();
    if (!Userid) {
      setError("User ID not found. Please log in again.");
      setLoading(false);
      return;
    }

    try {
      // Create a FormData object
      const formData = new FormData();

      // Append all fields to the FormData object
      formData.append("leave_type", leaveData.leave_type);
      formData.append("start_date", leaveData.start_date);
      formData.append("end_date", leaveData.end_date);
      formData.append("reason", leaveData.reason);
      formData.append("leave_status", leaveData.leave_status);
      formData.append("Userid", Userid);

      // Append the document file if it exists
      if (leaveData.document) {
        formData.append("document", leaveData.document);
      }

      // Send the request with FormData
      const response = await axios.post(`${backendUrl}/api/add-leave`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "multipart/form-data", // Important for file uploads
        },
      });

      await fetchPendingLeaves();
      return response.data;
    } catch (error) {
      console.error("Error adding leave request:", error);
      setError("Error adding leave request");
    } finally {
      setLoading(false);
    }
  };

  // Update a leave request
  const updateLeave = async (leaveId, updatedData) => {
    setLoading(true);
    const Userid = getUserId();
    if (!Userid) {
      setError("User ID not found. Please log in again.");
      setLoading(false);
      return;
    }

    try {
      // Create a FormData object
      const formData = new FormData();

      // Append all fields to the FormData object
      formData.append("leave_type", updatedData.leave_type);
      formData.append("start_date", updatedData.start_date);
      formData.append("end_date", updatedData.end_date);
      formData.append("reason", updatedData.reason);
      formData.append("leave_status", updatedData.leave_status);
      formData.append("Userid", Userid);

      // Append the document file if it exists
      if (updatedData.document) {
        formData.append("document", updatedData.document);
      }

      // Send the request with FormData
      const response = await axios.patch(
        `${backendUrl}/api/student-leave/update-leave/${leaveId}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "multipart/form-data", // Important for file uploads
          },
        }
      );

      await fetchPendingLeaves();
      return response.data;
    } catch (error) {
      console.error("Error updating leave request:", error);
      setError("Error updating leave request");
    } finally {
      setLoading(false);
    }
  };

  // Delete a leave request
  const deleteLeave = async (leaveId) => {
    setLoading(true);
    const Userid = getUserId();
    if (!Userid) {
      setError("User ID not found. Please log in again.");
      setLoading(false);
      return;
    }
    try {
      const response = await axios.delete(`${backendUrl}/api/delete-leave/${leaveId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        params: { Userid },
      });
      await fetchPendingLeaves();
      return response.data;
    } catch (error) {
      console.error("Error deleting leave request:", error);
      setError("Error deleting leave request");
    } finally {
      setLoading(false);
    }
  };

  // Fetch leaves on mount
  useEffect(() => {
    fetchPendingLeaves();
    fetchApprovedLeaves();
  }, [fetchPendingLeaves, fetchApprovedLeaves]);

  // Context value
  const value = {
    pendingLeaves,
    approvedLeaves,
    loading,
    error,
    addLeave,
    updateLeave,
    deleteLeave,
    fetchPendingLeaves,
    fetchApprovedLeaves,
  };

  return <LeaveContext.Provider value={value}>{children}</LeaveContext.Provider>;
};