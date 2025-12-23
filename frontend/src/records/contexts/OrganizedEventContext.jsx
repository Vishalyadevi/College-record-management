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
    if (!token || !UserId) {
      console.log("Missing token or UserId");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("Fetching events for UserId:", UserId);
      
      // Fetch both pending and approved events in parallel
      const [approvedRes, pendingRes] = await Promise.allSettled([
        axios.get(`${backendUrl}/api/approved-events?UserId=${UserId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${backendUrl}/api/pending-events?UserId=${UserId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      ]);

      console.log("Approved Response:", approvedRes);
      console.log("Pending Response:", pendingRes);

      let allEvents = [];

      // Process approved events
      if (approvedRes.status === 'fulfilled' && approvedRes.value?.data) {
        const approvedData = Array.isArray(approvedRes.value.data) 
          ? approvedRes.value.data 
          : approvedRes.value.data.events || [];
        
        const processedApproved = approvedData.map(item => {
          if (item.event && typeof item.event === 'object') {
            return {
              ...item.event,
              approval_status: 'Approved'
            };
          }
          return {
            ...item,
            approval_status: 'Approved'
          };
        });
        allEvents = [...allEvents, ...processedApproved];
        console.log("Processed Approved Events:", processedApproved);
      }

      // Process pending events
      if (pendingRes.status === 'fulfilled' && pendingRes.value?.data) {
        const pendingData = Array.isArray(pendingRes.value.data) 
          ? pendingRes.value.data 
          : pendingRes.value.data.events || [];
        
        const processedPending = pendingData.map(item => {
          if (item.event && typeof item.event === 'object') {
            return {
              ...item.event,
              approval_status: 'Pending'
            };
          }
          return {
            ...item,
            approval_status: 'Pending'
          };
        });
        allEvents = [...allEvents, ...processedPending];
        console.log("Processed Pending Events:", processedPending);
      }

      console.log("All Events Combined:", allEvents);
      setEvents(allEvents);

      if (allEvents.length === 0) {
        console.log("No events found");
      }
    } catch (err) {
      console.error("Error fetching events:", err);
      console.error("Error response:", err.response?.data);
      setError(err.message);
      setEvents([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  }, [token, UserId, backendUrl]);

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

      console.log("Add event response:", response.data);

      // Extract the event from response (handle nested structure)
      let newEvent;
      if (response.data.event && typeof response.data.event === 'object') {
        newEvent = {
          ...response.data.event,
          approval_status: response.data.approval_status || 'Pending'
        };
      } else {
        newEvent = {
          ...response.data,
          approval_status: response.data.approval_status || 'Pending'
        };
      }

      setEvents((prevEvents) => [...prevEvents, newEvent]);
      toast.success("Event added successfully! Awaiting approval.");
      
      // Optionally refetch to ensure sync with backend
      setTimeout(() => fetchEvents(), 1000);
    } catch (err) {
      console.error("Error adding event:", err);
      console.error("Error response:", err.response?.data);
      setError(err.message);
      toast.error("Failed to add event.");
    } finally {
      setLoading(false);
    }
  }, [token, backendUrl, fetchEvents]);

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

      console.log("Update event response:", response.data);

      // Extract updated event (handle nested structure)
      let updatedEvent;
      if (response.data.event && typeof response.data.event === 'object') {
        updatedEvent = {
          ...response.data.event,
          approval_status: response.data.approval_status || 'Pending'
        };
      } else {
        updatedEvent = {
          ...response.data,
          approval_status: response.data.approval_status || 'Pending'
        };
      }

      setEvents((prevEvents) =>
        prevEvents.map((event) => (event.id === id ? updatedEvent : event))
      );
      toast.success("Event updated successfully!");
      
      // Optionally refetch to ensure sync with backend
      setTimeout(() => fetchEvents(), 1000);
    } catch (err) {
      console.error("Error updating event:", err);
      console.error("Error response:", err.response?.data);
      setError(err.message);
      toast.error("Failed to update event.");
    } finally {
      setLoading(false);
    }
  }, [token, backendUrl, fetchEvents]);

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
      console.error("Error deleting event:", err);
      console.error("Error response:", err.response?.data);
      setError(err.message);
      toast.error("Failed to delete event.");
    } finally {
      setLoading(false);
    }
  }, [token, backendUrl]);

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