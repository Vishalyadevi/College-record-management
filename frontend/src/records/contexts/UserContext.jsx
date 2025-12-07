import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react";
import axios from "axios";

// Create User Context
const UserContext = createContext();

// Custom Hook to use the User Context
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

// Axios instance with interceptors
const api = axios.create({
  baseURL: "http://localhost:4000/api",
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Token expired or invalid
      localStorage.clear();
      window.location.href = "/records/login";
    }
    return Promise.reject(error);
  }
);

// User Provider Component
export const UserProvider = ({ children }) => {
  const [user, setUserState] = useState(null);
  const [token, setTokenState] = useState(null); // Add token to state
  const [loading, setLoading] = useState(true);
  const [bulkHistory, setBulkHistory] = useState([]);
  const [uploadHistory, setUploadHistory] = useState([]);

  // Load user from localStorage on mount
  useEffect(() => {
    const initializeUser = () => {
      try {
        const storedUser = localStorage.getItem("user");
        const storedToken = localStorage.getItem("token");
        
        if (storedUser && storedToken) {
          const parsedUser = JSON.parse(storedUser);
          setUserState(parsedUser);
          setTokenState(storedToken); // Set token in state
          console.log("User loaded from localStorage:", parsedUser);
        }
      } catch (error) {
        console.error("Error loading user from localStorage:", error);
        localStorage.clear();
      } finally {
        setLoading(false);
      }
    };

    initializeUser();
  }, []);

  // Function to update user state and localStorage
  const setUser = useCallback((newUser) => {
    setUserState(newUser);
    if (newUser) {
      localStorage.setItem("user", JSON.stringify(newUser));
      console.log("User state updated:", newUser);
    } else {
      localStorage.removeItem("user");
      console.log("User state cleared");
    }
  }, []);

  // Login function
  const login = useCallback(async (email, password) => {
    try {
      const response = await api.post("/auth/login", { email, password });
      const { token, user: userData } = response.data;

      if (!token || !userData) {
        throw new Error("Invalid response from server");
      }

      // Store in localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("userRole", userData.role);
      localStorage.setItem("userId", userData.Userid);
      localStorage.setItem("userImage", userData.profileImage);
      localStorage.setItem("deptid", userData.Deptid);

      if (userData.role === "Staff" && userData.staffId) {
        localStorage.setItem("staffId", userData.staffId);
      }

      // Update state - IMPORTANT: Set both user and token
      setUserState(userData);
      setTokenState(token);

      return response.data;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear all storage and state
      localStorage.clear();
      setUserState(null);
      setTokenState(null);
      window.location.href = "/records/login";
    }
  }, []);

  // Get current user from server
  const fetchCurrentUser = useCallback(async () => {
    try {
      const response = await api.get("/auth/me");
      const userData = response.data.user;
      
      setUserState(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      
      return userData;
    } catch (error) {
      console.error("Error fetching current user:", error);
      logout();
      throw error;
    }
  }, [logout]);

  // Update user profile
  const updateProfile = useCallback(async (userId, formData) => {
    try {
      const response = await api.put(`/auth/update-profile/${userId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Update user state with new profile image
      if (response.data.profileImage) {
        setUserState((prev) => ({
          ...prev,
          profileImage: response.data.profileImage,
        }));
        localStorage.setItem("userImage", response.data.profileImage);
      }

      return response.data;
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  }, []);

  // Function to handle data export
  const handleExport = useCallback(async (role, columns, filters = {}, fileType = "csv") => {
    try {
      const response = await api.post(
        "/export",
        { role, columns, filters, type: fileType },
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${role.toLowerCase()}_data.${fileType}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      console.log(`Export Successful! Type: ${fileType}`);
      return { success: true };
    } catch (error) {
      console.error("Error exporting data:", error);
      throw error;
    }
  }, []);

  // Fetch bulk upload history
  const fetchBulkHistory = useCallback(async () => {
    try {
      const response = await api.get("/bulk-history");
      const mappedBulkHistory = response.data.map((item) => ({
        filename: item.filename || "N/A",
        download_type: item.download_type || "N/A",
        file_size: item.file_size || 0,
        total_records: item.total_records || 0,
        created_at: item.created_at,
      }));

      setBulkHistory(mappedBulkHistory);
      return mappedBulkHistory;
    } catch (error) {
      console.error("Error fetching bulk history:", error);
      throw error;
    }
  }, []);

  // Fetch file upload history
  const fetchUploadHistory = useCallback(async () => {
    try {
      const response = await api.get("/upload-history");
      const mappedUploadHistory = response.data.map((item) => ({
        filename: item.filename || "N/A",
        download_type: item.download_type || "N/A",
        file_size: item.file_size || 0,
        total_records: item.total_records || 0,
        created_at: item.created_at,
      }));
      
      setUploadHistory(mappedUploadHistory);
      return mappedUploadHistory;
    } catch (error) {
      console.error("Error fetching upload history:", error);
      throw error;
    }
  }, []);

  // Load histories on mount if user is authenticated
  useEffect(() => {
    if (user && token) {
      fetchBulkHistory();
      fetchUploadHistory();
    }
  }, [user, token, fetchBulkHistory, fetchUploadHistory]);

  // Check if user is authenticated
  const isAuthenticated = useMemo(() => {
    return !!user && !!token;
  }, [user, token]);

  // Check if user has specific role
  const hasRole = useCallback((roles) => {
    if (!user) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(user.role);
  }, [user]);

  // Memoized context value
  const contextValue = useMemo(
    () => ({
      user,
      token, // Add token to context value
      setUser,
      login,
      logout,
      loading,
      isAuthenticated,
      hasRole,
      fetchCurrentUser,
      updateProfile,
      handleExport,
      bulkHistory,
      uploadHistory,
      fetchBulkHistory,
      fetchUploadHistory,
    }),
    [
      user,
      token, // Include token in dependencies
      setUser,
      login,
      logout,
      loading,
      isAuthenticated,
      hasRole,
      fetchCurrentUser,
      updateProfile,
      handleExport,
      bulkHistory,
      uploadHistory,
      fetchBulkHistory,
      fetchUploadHistory,
    ]
  );

  return <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>;
};