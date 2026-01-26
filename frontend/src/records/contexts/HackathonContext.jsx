import React, { createContext, useContext, useState, useCallback } from "react";
import axios from "axios";

const HackathonContext = createContext();

export const useHackathon = () => {
  const context = useContext(HackathonContext);
  if (!context) {
    throw new Error("useHackathon must be used within a HackathonProvider");
  }
  return context;
};

export const HackathonProvider = ({ children }) => {
  const [hackathonEvents, setHackathonEvents] = useState([]);
  const [pendingEvents, setPendingEvents] = useState([]);
  const [approvedEvents, setApprovedEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const apiBase = "http://localhost:4000/api/hackathon";

  const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
  });

  // Fetch student's hackathon events
  const fetchStudentEvents = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${apiBase}/my-events`,
        getAuthHeader()
      );
      setHackathonEvents(response.data.events || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch hackathon events");
      console.error("Fetch events error:", err);
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  // Fetch pending events (for tutors/admins)
  const fetchPendingEvents = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${apiBase}/pending`,
        getAuthHeader()
      );
      setPendingEvents(response.data.events || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch pending events");
      console.error("Fetch pending events error:", err);
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  // Fetch approved events
  const fetchApprovedEvents = useCallback(async (userId) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${apiBase}/approved?UserId=${userId}`,
        getAuthHeader()
      );
      setApprovedEvents(response.data.events || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch approved events");
      console.error("Fetch approved events error:", err);
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  // Add new hackathon event
  const addHackathonEvent = async (eventData) => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${apiBase}/add`,
        eventData,
        getAuthHeader()
      );
      setError(null);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to add hackathon event";
      setError(errorMsg);
      console.error("Add event error:", err);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Update hackathon event
  const updateHackathonEvent = async (eventId, eventData) => {
    setLoading(true);
    try {
      const response = await axios.put(
        `${apiBase}/update/${eventId}`,
        eventData,
        getAuthHeader()
      );
      setError(null);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to update hackathon event";
      setError(errorMsg);
      console.error("Update event error:", err);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Delete hackathon event
  const deleteHackathonEvent = async (eventId) => {
    setLoading(true);
    try {
      const response = await axios.delete(
        `${apiBase}/delete/${eventId}`,
        getAuthHeader()
      );
      setError(null);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to delete hackathon event";
      setError(errorMsg);
      console.error("Delete event error:", err);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Approve hackathon event (tutor/admin)
  const approveEvent = async (eventId, userId, comments = "") => {
    setLoading(true);
    try {
      const response = await axios.put(
        `${apiBase}/approve/${eventId}`,
        { Userid: userId, comments },
        getAuthHeader()
      );
      setError(null);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to approve event";
      setError(errorMsg);
      console.error("Approve event error:", err);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Reject hackathon event (tutor/admin)
  const rejectEvent = async (eventId, userId, comments = "") => {
    setLoading(true);
    try {
      const response = await axios.put(
        `${apiBase}/reject/${eventId}`,
        { Userid: userId, comments },
        getAuthHeader()
      );
      setError(null);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to reject event";
      setError(errorMsg);
      console.error("Reject event error:", err);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return (
    <HackathonContext.Provider
      value={{
        hackathonEvents,
        pendingEvents,
        approvedEvents,
        loading,
        error,
        fetchStudentEvents,
        fetchPendingEvents,
        fetchApprovedEvents,
        addHackathonEvent,
        updateHackathonEvent,
        deleteHackathonEvent,
        approveEvent,
        rejectEvent,
        clearError
      }}
    >
      {children}
    </HackathonContext.Provider>
  );
};