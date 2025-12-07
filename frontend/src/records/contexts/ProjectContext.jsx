import React, { createContext, useContext, useState, useCallback } from "react";
import axios from "axios";

const ProjectContext = createContext();

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error("useProject must be used within a ProjectProvider");
  }
  return context;
};

const API_URL = "http://localhost:4000/api";

export const ProjectProvider = ({ children }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };
  };

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Fetch user projects
  const fetchUserProjects = useCallback(async (userId) => {
    if (!userId) {
      console.error("No userId provided to fetchUserProjects");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("📥 Fetching projects for user:", userId);
      
      const response = await axios.get(
        `${API_URL}/projects/my-projects?UserId=${userId}`,
        getAuthHeaders()
      );

      console.log("✅ Projects fetched:", response.data);
      setProjects(response.data.projects || []);
    } catch (err) {
      console.error("❌ Error fetching projects:", err);
      const errorMessage = err.response?.data?.message || "Failed to fetch projects";
      setError(errorMessage);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Add project
  const addProject = useCallback(async (projectData) => {
    setLoading(true);
    setError(null);

    try {
      console.log("📤 Adding project:", projectData);

      const response = await axios.post(
        `${API_URL}/projects/add`,
        projectData,
        getAuthHeaders()
      );

      console.log("✅ Project added:", response.data);
      return response.data;
    } catch (err) {
      console.error("❌ Error adding project:", err);
      
      let errorMessage = "Failed to add project";
      
      if (err.response) {
        console.error("Server response:", err.response.data);
        errorMessage = err.response.data?.message || err.response.data?.error || errorMessage;
        
        // Show detailed error in console
        console.error("Status:", err.response.status);
        console.error("Error details:", err.response.data);
      } else if (err.request) {
        errorMessage = "No response from server. Check your connection.";
        console.error("No response:", err.request);
      } else {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update project
  const updateProject = useCallback(async (projectId, projectData) => {
    setLoading(true);
    setError(null);

    try {
      console.log("📤 Updating project:", projectId, projectData);

      const response = await axios.put(
        `${API_URL}/projects/update/${projectId}`,
        projectData,
        getAuthHeaders()
      );

      console.log("✅ Project updated:", response.data);
      return response.data;
    } catch (err) {
      console.error("❌ Error updating project:", err);
      
      let errorMessage = "Failed to update project";
      
      if (err.response) {
        console.error("Server response:", err.response.data);
        errorMessage = err.response.data?.message || err.response.data?.error || errorMessage;
      } else if (err.request) {
        errorMessage = "No response from server. Check your connection.";
      } else {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete project
  const deleteProject = useCallback(async (projectId, userId) => {
    setLoading(true);
    setError(null);

    try {
      console.log("🗑️ Deleting project:", projectId);

      await axios.delete(
        `${API_URL}/projects/delete/${projectId}?UserId=${userId}`,
        getAuthHeaders()
      );

      console.log("✅ Project deleted");
    } catch (err) {
      console.error("❌ Error deleting project:", err);
      
      let errorMessage = "Failed to delete project";
      
      if (err.response) {
        errorMessage = err.response.data?.message || errorMessage;
      } else if (err.request) {
        errorMessage = "No response from server";
      } else {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const value = {
    projects,
    loading,
    error,
    fetchUserProjects,
    addProject,
    updateProject,
    deleteProject,
    clearError,
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
};
