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
      setEvents([]);
      setLoading(false);
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
        axios.get(`${backendUrl}/api/pending-events`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      ]);

      let allEvents = [];

      // Process approved events
      if (approvedRes.status === 'fulfilled' && approvedRes.value?.data) {
        const approvedData = Array.isArray(approvedRes.value.data) 
          ? approvedRes.value.data 
          : approvedRes.value.data.events || [];
        
        const processedApproved = approvedData
          .filter(event => event.Userid === parseInt(UserId))
          .map(event => ({
            ...event,
            approval_status: 'Approved'
          }));
        allEvents = [...allEvents, ...processedApproved];
        console.log("Processed Approved Events:", processedApproved.length);
      }

      // Process pending events
      if (pendingRes.status === 'fulfilled' && pendingRes.value?.data) {
        const pendingData = Array.isArray(pendingRes.value.data) 
          ? pendingRes.value.data 
          : pendingRes.value.data.events || [];
        
        const processedPending = pendingData
          .filter(event => event.Userid === parseInt(UserId))
          .map(event => ({
            ...event,
            approval_status: 'Pending'
          }));
        allEvents = [...allEvents, ...processedPending];
        console.log("Processed Pending Events:", processedPending.length);
      }

      console.log("Total Events Combined:", allEvents.length);
      setEvents(allEvents);

    } catch (err) {
      console.error("Error fetching events:", err);
      setError(err.message);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [token, UserId, backendUrl]);

  const addEvent = useCallback(async (eventData) => {
    if (!token) {
      toast.error("Unauthorized: No token found");
      return;
    }

    setLoading(true);

    try {
      console.log("Adding event:", eventData);
      
      const response = await axios.post(`${backendUrl}/api/add-event`, eventData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Add event response:", response.data);

      if (response.data.success) {
        toast.success("Event added successfully! Awaiting approval.");
        // Refetch events to get the latest data
        setTimeout(() => fetchEvents(), 500);
      }
    } catch (err) {
      console.error("Error adding event:", err);
      const errorMessage = err.response?.data?.message || err.message || "Failed to add event";
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token, backendUrl, fetchEvents]);

  const updateEvent = useCallback(async (id, eventData) => {
    if (!token) {
      toast.error("Unauthorized: No token found");
      return;
    }

    setLoading(true);

    try {
      console.log("Updating event:", id, eventData);
      
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

      if (response.data.success) {
        toast.success("Event updated successfully!");
        // Refetch events to get the latest data
        setTimeout(() => fetchEvents(), 500);
      }
    } catch (err) {
      console.error("Error updating event:", err);
      const errorMessage = err.response?.data?.message || err.message || "Failed to update event";
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token, backendUrl, fetchEvents]);

  const deleteEvent = useCallback(async (id) => {
    if (!token) {
      toast.error("Unauthorized: No token found");
      return;
    }

    setLoading(true);

    try {
      console.log("Deleting event:", id);
      
      const response = await axios.delete(`${backendUrl}/api/delete-event/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Delete event response:", response.data);

      if (response.data.success) {
        toast.success("Event deleted successfully!");
        // Refetch events to get the latest data
        setTimeout(() => fetchEvents(), 500);
      }
    } catch (err) {
      console.error("Error deleting event:", err);
      const errorMessage = err.response?.data?.message || err.message || "Failed to delete event";
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token, backendUrl, fetchEvents]);

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

export const useOrganizedEventContext = () => {
  const context = useContext(OrganizedEventContext);
  if (!context) {
    throw new Error('useOrganizedEventContext must be used within OrganizedEventProvider');
  }
  return context;
};