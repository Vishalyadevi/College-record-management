// AttendedEventContext.js
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
    if (!token || !UserId) return toast.error("Unauthorized: No token or user ID found");

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
      toast.error("Failed to fetch attended events.");
    } finally {
      setLoading(false);
    }
  }, [token, UserId]);

  const addEventAttended = useCallback(async (eventData) => {
    if (!token) return toast.error("Unauthorized: No token found");

    setLoading(true);

    try {
      const response = await axios.post(`${backendUrl}/api/add-event-attended`, eventData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setEventsAttended((prevEvents) => [...prevEvents, response.data]);
      toast.success("Event attended added successfully!");
    } catch (err) {
      console.error("Error adding attended event:", err);
      setError(err.message);
      toast.error("Failed to add attended event.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  const updateEventAttended = useCallback(async (id, eventData) => {
    if (!token) return toast.error("Unauthorized: No token found");

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
      setEventsAttended((prevEvents) =>
        prevEvents.map((event) => (event.id === id ? response.data : event))
      );
      toast.success("Event attended updated successfully!");
    } catch (err) {
      console.error("Error updating attended event:", err);
      setError(err.message);
      toast.error("Failed to update attended event.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  const deleteEventAttended = useCallback(async (id) => {
    if (!token) return toast.error("Unauthorized: No token found");

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
      toast.error("Failed to delete attended event.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchEventsAttended();
  }, [fetchEventsAttended]);

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

export const useAttendedEventContext = () => useContext(AttendedEventContext);