import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react";
import axios from "axios";

// Create User Context
const UserContext = createContext();

// Custom Hook to use the User Context
export const useUser = () => useContext(UserContext);

// User Provider Component
export const UserProvider = ({ children }) => {
  const [user, setUserState] = useState(null);
  const [bulkHistory, setBulkHistory] = useState([]); // Bulk upload history
  const [uploadHistory, setUploadHistory] = useState([]); // File upload history

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUserState(JSON.parse(storedUser)); // Ensure user state is set
      console.log(user);
    }
  }, []);
  
  // Function to update user state and localStorage
  const setUser = (newUser) => {
    setUserState(newUser);
    if (newUser) {
      localStorage.setItem("user", JSON.stringify(newUser));
    } else {
      localStorage.removeItem("user");
    }
  };
  

  // Function to handle data export
  const handleExport = useCallback(async (role, columns, filters = {}, fileType = "csv") => {
    try {
      const response = await axios.post(
        "http://localhost:4000/api/export",
        { role, columns, filters, type: fileType },
        { responseType: "blob" } // Expecting a file response
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${role.toLowerCase()}_data.${fileType}`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      console.log(`Export Successful! Type: ${fileType}, Size: ${fileSize}, Records: ${totalRecords}`);
    } catch (error) {
      console.error("Error exporting data:", error);
      throw error;
    }
  }, []);

  // Fetch bulk upload history
  const fetchBulkHistory = useCallback(async () => {
    try {
      const response = await axios.get("http://localhost:4000/api/bulk-history");
      const mappedBulkHistory = response.data.map((item) => ({
        filename: item.filename, // Ensure the key matches the expected format
        download_type: item.download_type || "N/A", // Add default value if missing
        file_size: item.file_size || 0, // Add default value if missing
        total_records: item.total_records || 0, // Add default value if missing
        created_at: item.created_at, // Ensure the key matches the expected format
      }));

      setBulkHistory(mappedBulkHistory);
    } catch (error) {
      console.error("Error fetching bulk history:", error);
    }
  }, []);

  // Fetch file upload history
  const fetchUploadHistory = useCallback(async () => {
    try {
      const response = await axios.get("http://localhost:4000/api/upload-history");
      const mappedUploadHistory = response.data.map((item) => ({
        filename: item.filename, // Ensure the key matches the expected format
        download_type: item.download_type || "N/A", // Add default value if missing
        file_size: item.file_size || 0, // Add default value if missing
        total_records: item.total_records || 0, // Add default value if missing
        created_at: item.created_at, // Ensure the key matches the expected format
      }));
      setUploadHistory(mappedUploadHistory);
    } catch (error) {
      console.error("Error fetching upload history:", error);
    }
  }, []);


  

 
  
  useEffect(() => {
    fetchBulkHistory();
    fetchUploadHistory();
  }, [fetchBulkHistory, fetchUploadHistory]);

  // Memoized context value
  const contextValue = useMemo(
    () => ({
      user,
      setUser,
      handleExport,
      bulkHistory,
      uploadHistory,
      fetchBulkHistory,
      fetchUploadHistory,
    }),
    [
      user,
      setUser,
      handleExport,
      bulkHistory,
      uploadHistory,
      fetchBulkHistory,
      fetchUploadHistory,
    ]
  );

  return <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>;
};