import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const AttendedEventContext = createContext();

export const AttendedEventProvider = ({ children }) => {
  const [eventsAttended, setEventsAttended] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const backendUrl = "http://localhost:4000";
  const token = localStorage.getItem("token");
  const UserId = localStorage.getItem("userId");

  const fetchEventsAttended = useCallback(async () => {
    if (!token || !UserId) {
      console.warn("No token or user ID found");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${backendUrl}/api/events-attended?UserId=${UserId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (Array.isArray(response.data)) {
        setEventsAttended(response.data);
      } else {
        console.error("Expected an array but got:", response.data);
        setEventsAttended([]);
      }
    } catch (err) {
      console.error("Error fetching attended events:", err);
      setError(err.message);
      if (err.response?.status !== 401) {
        toast.error("Failed to fetch attended events.");
      }
    } finally {
      setLoading(false);
    }
  }, [token, UserId, backendUrl]);

  const addEventAttended = useCallback(async (eventData) => {
    if (!token) {
      toast.error("Unauthorized: No token found");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${backendUrl}/api/add-event-attended`, eventData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      // Refresh the events list after adding
      await fetchEventsAttended();
      toast.success("Event attended added successfully!");
      return response.data;
    } catch (err) {
      console.error("Error adding attended event:", err);
      setError(err.message);
      toast.error(err.response?.data?.message || "Failed to add attended event.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token, backendUrl, fetchEventsAttended]);

  const updateEventAttended = useCallback(async (id, eventData) => {
    if (!token) {
      toast.error("Unauthorized: No token found");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.put(
        `${backendUrl}/api/update-event-attended/${id}`,
        eventData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      
      // Refresh the events list after updating
      await fetchEventsAttended();
      toast.success("Event attended updated successfully!");
      return response.data;
    } catch (err) {
      console.error("Error updating attended event:", err);
      setError(err.message);
      toast.error(err.response?.data?.message || "Failed to update attended event.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token, backendUrl, fetchEventsAttended]);

  const deleteEventAttended = useCallback(async (id) => {
    if (!token) {
      toast.error("Unauthorized: No token found");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this event?")) {
      return;
    }

    setLoading(true);

    try {
      await axios.delete(`${backendUrl}/api/delete-event-attended/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setEventsAttended((prevEvents) => prevEvents.filter((event) => event.id !== id));
      toast.success("Event attended deleted successfully!");
    } catch (err) {
      console.error("Error deleting attended event:", err);
      setError(err.message);
      toast.error(err.response?.data?.message || "Failed to delete attended event.");
    } finally {
      setLoading(false);
    }
  }, [token, backendUrl]);

  useEffect(() => {
    if (token && UserId) {
      fetchEventsAttended();
    }
  }, [fetchEventsAttended, token, UserId]);

  return (
    <AttendedEventContext.Provider
      value={{
        eventsAttended,
        loading,
        error,
        fetchEventsAttended,
        addEventAttended,
        updateEventAttended,
        deleteEventAttended,
      }}
    >
      {children}
    </AttendedEventContext.Provider>
  );
};

export const useAttendedEventContext = () => {
  const context = useContext(AttendedEventContext);
  if (!context) {
    throw new Error("useAttendedEventContext must be used within an AttendedEventProvider");
  }
  return context;
};