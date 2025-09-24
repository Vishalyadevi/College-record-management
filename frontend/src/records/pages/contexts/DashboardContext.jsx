import React, { createContext, useState, useContext, useEffect, useCallback } from "react";
import { toast } from "react-toastify";

const DashboardContext = createContext();

const backendUrl = "http://localhost:4000";

const approvalTypes = {
  internship: { endpoint: "internships", name: "Internship" },
  scholarship: { endpoint: "scholarships", name: "Scholarship" },
  event: { endpoint: "events", name: "Event" },
  "event-attended": { endpoint: "events-attended", name: "Event Attended" },
  leave: { endpoint: "student-leave", name: "Leave" },
  "online-course": { endpoint: "online-courses", name: "Online Course" },
  achievement: { endpoint: "achievements", name: "Achievement" }
};

// Helper function to safely access and filter arrays
const safeFilter = (data, staffId) => {
  if (!Array.isArray(data)) return [];
  return data.filter(item => item && String(item?.staffId) === String(staffId));
};

export const DashboardProvider = ({ children }) => {
  const [pendingData, setPendingData] = useState({
    internships: [],
    scholarships: [],
    events: [],
    eventsAttended: [],
    leaves: [],
    onlineCourses: [],
    achievements: []
  });
  
  const [state, setState] = useState({
    selectedItem: null,
    showCommonMessage: false,
    email: "",
    commonMessage: "",
    actionType: null,
    isLoading: false,
    notifications: [],
    error: null
  });

  const staffId = localStorage.getItem("userId") || "";
  const token = localStorage.getItem("token") || "";

  const fetchPendingData = useCallback(async () => {
    if (!token || !staffId) {
      toast.error("Authentication token or staff ID missing. Please log in.");
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const endpoints = [
        "pending-internships",
        "pending-scholarships",
        "pending-events",
        "pending-events-attended",
        "pending-leaves",
        "pending-online-courses",
        "pending-achievements"
      ];

      const responses = await Promise.all(
        endpoints.map(async endpoint => {
          try {
            const response = await fetch(`${backendUrl}/api/${endpoint}`, { 
              headers: { 
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
              } 
            });

            if (!response.ok) {
              throw new Error(`Failed to fetch ${endpoint}`);
            }
            return await response.json();
          } catch (error) {
            console.error(`Error fetching ${endpoint}:`, error);
            return { data: [] }; // Return empty array structure if request fails
          }
        })
      );

      setPendingData({
        internships: safeFilter(responses[0]?.internships || [], staffId).map(item => ({ 
          ...item, 
          approvetype: "internship" 
        })),
        scholarships: safeFilter(responses[1]?.scholarships || [], staffId).map(item => ({ 
          ...item, 
          approvetype: "scholarship" 
        })),
        events: safeFilter(responses[2]?.events || [], staffId).map(item => ({ 
          ...item, 
          approvetype: "event" 
        })),
        eventsAttended: safeFilter(responses[3]?.events || [], staffId).map(item => ({ 
          ...item, 
          approvetype: "event-attended" 
        })),
        leaves: safeFilter(responses[4]?.leaves || [], staffId).map(item => ({ 
          ...item, 
          approvetype: "leave" 
        })),
        onlineCourses: safeFilter(responses[5]?.courses || [], staffId).map(item => ({ 
          ...item, 
          approvetype: "online-course" 
        })),
        achievements: safeFilter(responses[6]?.achievements || [], staffId).map(item => ({
          ...item,
          approvetype: "achievement"
        }))
      });
    } catch (error) {
      console.error("Error in fetchPendingData:", error);
      setState(prev => ({ ...prev, error: error.message }));
      toast.error("Error loading dashboard data");
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [token, staffId]);

  const handleSendMessage = useCallback(async (type) => {
    if (!state.email || !state.commonMessage) {
      toast.error("Please enter an email and message.");
      return;
    }

    try {
      const isConfirmed = window.confirm(`Are you sure you want to send this ${type}?`);
      if (!isConfirmed) return;

      const response = await fetch(`${backendUrl}/api/messages/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          email: state.email, 
          message: state.commonMessage, 
          type 
        }),
      });

      if (!response.ok) throw new Error("Failed to send message");

      toast.success(`${type} sent successfully.`);
      setState(prev => ({ 
        ...prev, 
        email: "", 
        commonMessage: "", 
        showCommonMessage: false 
      }));
    } catch (error) {
      console.error("Error in handleSendMessage:", error);
      toast.error("Error sending message");
    }
  }, [token, state.email, state.commonMessage]);

  const handleAction = useCallback(async (item, action) => {
    if (!item?.approvetype || !item?.id) {
      toast.error("Invalid item data");
      return;
    }

    try {
      const isConfirmed = window.confirm(`Are you sure you want to ${action} this ${item.approvetype}?`);
      if (!isConfirmed) return;

      const { endpoint } = approvalTypes[item.approvetype] || {};
      if (!endpoint) throw new Error("Invalid approval type");

      const response = await fetch(`${backendUrl}/api/${endpoint}/${item.id}/approve`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          approved: action === "approve",
          message: state.commonMessage,
        }),
      });

      if (!response.ok) throw new Error("Failed to process request");

      toast.success(`Request ${action}d successfully.`);
      setPendingData(prev => ({
        ...prev,
        [endpoint]: (prev[endpoint] || []).filter(req => req.id !== item.id)
      }));

      setState(prev => ({ 
        ...prev, 
        selectedItem: null, 
        actionType: null, 
        commonMessage: "" 
      }));
    } catch (error) {
      console.error("Error in handleAction:", error);
      toast.error("Error processing request");
    }
  }, [token, state.commonMessage]);

  const addNotification = useCallback((message) => {
    setState(prev => ({
      ...prev,
      notifications: [...(prev.notifications || []), { id: Date.now(), message }]
    }));
  }, []);

  const removeNotification = useCallback((id) => {
    setState(prev => ({
      ...prev,
      notifications: (prev.notifications || []).filter(n => n.id !== id)
    }));
  }, []);

  useEffect(() => {
    let interval;
    try {
      fetchPendingData();
      interval = setInterval(fetchPendingData, 5 * 60 * 1000);
    } catch (error) {
      console.error("Error initializing dashboard:", error);
    }
    return () => clearInterval(interval);
  }, [fetchPendingData]);

  const contextValue = {
    ...pendingData,
    ...state,
    setState,
    handleSendMessage,
    handleAction,
    addNotification,
    removeNotification,
    staffId,
    fetchPendingData
  };

  return (
    <DashboardContext.Provider value={contextValue}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboardContext = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboardContext must be used within a DashboardProvider");
  }
  return context;
};