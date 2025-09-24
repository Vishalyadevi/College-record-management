// OrganizedEventContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const OrganizedEventContext = createContext();

export const OrganizedEventProvider = ({ children }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const backendUrl = "http://localhost:4000";
  const token = localStorage.getItem("token");
  const UserId = localStorage.getItem("userId");

  const fetchEvents = useCallback(async () => {
    if (!token || !UserId) return toast.error("Unauthorized: No token or user ID found");

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${backendUrl}/api/approved-events?UserId=${UserId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (Array.isArray(response.data)) {
        setEvents(response.data);
      } else {
        console.error("Expected an array but got:", response.data);
        setEvents([]);
      }
    } catch (err) {
      console.error("Error fetching organized events:", err);
      setError(err.message);
      toast.error("Failed to fetch organized events.");
    } finally {
      setLoading(false);
    }
  }, [token, UserId]);

  const addEvent = useCallback(async (eventData) => {
    if (!token) return toast.error("Unauthorized: No token found");

    setLoading(true);

    try {
      const response = await axios.post(`${backendUrl}/api/add-event`, eventData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      setEvents((prevEvents) => [...prevEvents, response.data]);
      toast.success("Event added successfully!");
    } catch (err) {
      console.error("Error adding organized event:", err);
      setError(err.message);
      toast.error("Failed to add organized event.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  const updateEvent = useCallback(async (id, eventData) => {
    if (!token) return toast.error("Unauthorized: No token found");

    setLoading(true);

    try {
      const response = await axios.put(
        `${backendUrl}/api/update-event/${id}`,
        eventData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      setEvents((prevEvents) =>
        prevEvents.map((event) => (event.id === id ? response.data : event))
      );
      toast.success("Event updated successfully!");
    } catch (err) {
      console.error("Error updating organized event:", err);
      setError(err.message);
      toast.error("Failed to update organized event.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  const deleteEvent = useCallback(async (id) => {
    if (!token) return toast.error("Unauthorized: No token found");

    setLoading(true);

    try {
      await axios.delete(`${backendUrl}/api/delete-event/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setEvents((prevEvents) => prevEvents.filter((event) => event.id !== id));
      toast.success("Event deleted successfully!");
    } catch (err) {
      console.error("Error deleting organized event:", err);
      setError(err.message);
      toast.error("Failed to delete organized event.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return (
    <OrganizedEventContext.Provider
      value={{
        events,
        loading,
        error,
        fetchEvents,
        addEvent,
        updateEvent,
        deleteEvent,
      }}
    >
      {children}
    </OrganizedEventContext.Provider>
  );
};

export const useOrganizedEventContext = () => useContext(OrganizedEventContext);