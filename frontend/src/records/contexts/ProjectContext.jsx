// contexts/ProjectContext.jsx
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

export const ProjectProvider = ({ children }) => {
  const [projects, setProjects] = useState([]);
  const [pendingProjects, setPendingProjects] = useState([]);
  const [approvedProjects, setApprovedProjects] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const apiBase = "http://localhost:4000/api/projects";

  const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
  });

  // Fetch user's projects
  const fetchUserProjects = useCallback(async (userId) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${apiBase}/my-projects?UserId=${userId}`,
        getAuthHeader()
      );
      setProjects(response.data.projects || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch projects");
      console.error("Fetch projects error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch pending projects (for tutors/admins)
  const fetchPendingProjects = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${apiBase}/pending`,
        getAuthHeader()
      );
      setPendingProjects(response.data.projects || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch pending projects");
      console.error("Fetch pending projects error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch approved projects
  const fetchApprovedProjects = useCallback(async (userId) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${apiBase}/approved?UserId=${userId}`,
        getAuthHeader()
      );
      setApprovedProjects(response.data.projects || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch approved projects");
      console.error("Fetch approved projects error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch projects by domain
  const fetchProjectsByDomain = useCallback(async (userId, domain) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${apiBase}/domain/${domain}?UserId=${userId}`,
        getAuthHeader()
      );
      setProjects(response.data.projects || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch projects by domain");
      console.error("Fetch projects by domain error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch project statistics
  const fetchProjectStatistics = useCallback(async (userId) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${apiBase}/statistics?UserId=${userId}`,
        getAuthHeader()
      );
      setStatistics(response.data.statistics || null);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch statistics");
      console.error("Fetch statistics error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Add new project
  const addProject = async (projectData) => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${apiBase}/add`,
        projectData,
        getAuthHeader()
      );
      await fetchUserProjects(projectData.Userid);
      setError(null);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add project");
      console.error("Add project error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update project
  const updateProject = async (projectId, projectData) => {
    setLoading(true);
    try {
      const response = await axios.put(
        `${apiBase}/update/${projectId}`,
        projectData,
        getAuthHeader()
      );
      await fetchUserProjects(projectData.Userid);
      setError(null);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update project");
      console.error("Update project error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete project
  const deleteProject = async (projectId, userId) => {
    setLoading(true);
    try {
      const response = await axios.delete(
        `${apiBase}/delete/${projectId}`,
        getAuthHeader()
      );
      await fetchUserProjects(userId);
      setError(null);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete project");
      console.error("Delete project error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Approve project (tutor/admin)
  const approveProject = async (projectId, approvalData) => {
    setLoading(true);
    try {
      const response = await axios.put(
        `${apiBase}/approve/${projectId}`,
        approvalData,
        getAuthHeader()
      );
      await fetchPendingProjects();
      setError(null);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to approve project");
      console.error("Approve project error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Reject project (tutor/admin)
  const rejectProject = async (projectId, rejectionData) => {
    setLoading(true);
    try {
      const response = await axios.put(
        `${apiBase}/reject/${projectId}`,
        rejectionData,
        getAuthHeader()
      );
      await fetchPendingProjects();
      setError(null);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reject project");
      console.error("Reject project error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        pendingProjects,
        approvedProjects,
        statistics,
        loading,
        error,
        fetchUserProjects,
        fetchPendingProjects,
        fetchApprovedProjects,
        fetchProjectsByDomain,
        fetchProjectStatistics,
        addProject,
        updateProject,
        deleteProject,
        approveProject,
        rejectProject,
        clearError: () => setError(null)
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};