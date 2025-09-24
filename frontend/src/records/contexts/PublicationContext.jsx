import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";

const PublicationContext = createContext();

export const usePublication = () => {
  const context = useContext(PublicationContext);
  if (!context) {
    throw new Error("usePublication must be used within a PublicationProvider");
  }
  return context;
};

export const PublicationProvider = ({ children }) => {
  const [publications, setPublications] = useState([]);
  const [pendingPublications, setPendingPublications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const apiBase = "http://localhost:4000/api"; // Matches your server.js route

  const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
  });

  // Fetch all publications
  const fetchAllPublications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${apiBase}/fetch-publications`, getAuthHeader());
      setPublications(response.data || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch publications");
      console.error("Fetch publications error:", err);
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  // Fetch user-specific publications
  const fetchUserPublications = useCallback(async (userId) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${apiBase}/user-publications/${userId}`,
        getAuthHeader()
      );
      setPublications(response.data || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch user publications");
      console.error("Fetch user publications error:", err);
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  // Fetch pending publications (admin)
  const fetchPendingPublications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${apiBase}/pending-publications`,
        getAuthHeader()
      );
      setPendingPublications(response.data || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch pending publications");
      console.error("Fetch pending publications error:", err);
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  // Fetch publications by type
  const fetchPublicationsByType = useCallback(async (type) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${apiBase}/type/${type}`,
        getAuthHeader()
      );
      setPublications(response.data || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch publications by type");
      console.error("Fetch publications by type error:", err);
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  // Add new publication with file upload
  const addPublication = async (formData) => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${apiBase}/add-publication`,
        formData,
        {
          ...getAuthHeader(),
          "Content-Type": "multipart/form-data"
        }
      );
      await fetchUserPublications(formData.get("Userid"));
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add publication");
      console.error("Add publication error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update publication
  const updatePublication = async (publicationId, formData) => {
    setLoading(true);
    try {
      const response = await axios.patch(
        `${apiBase}/update-publication/${publicationId}`,
        formData,
        {
          ...getAuthHeader(),
          "Content-Type": "multipart/form-data"
        }
      );
      await fetchAllPublications();
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update publication");
      console.error("Update publication error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete publication
  const deletePublication = async (publicationId) => {
    setLoading(true);
    try {
      const response = await axios.delete(
        `${apiBase}/delete-publication/${publicationId}`,
        getAuthHeader()
      );
      await fetchAllPublications();
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete publication");
      console.error("Delete publication error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Verify publication (admin)
  const verifyPublication = async (publicationId, status) => {
    const formData = new FormData();
    formData.append("verification_status", status);
    return updatePublication(publicationId, formData);
  };

  // Get publication by ID
  const getPublicationById = useCallback(async (publicationId) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${apiBase}/${publicationId}`,
        getAuthHeader()
      );
      setError(null);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch publication");
      console.error("Get publication by ID error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  useEffect(() => {
    // Initial data fetch could be done here if needed
  }, []);

  return (
    <PublicationContext.Provider
      value={{
        publications,
        pendingPublications,
        loading,
        error,
        fetchAllPublications,
        fetchUserPublications,
        fetchPendingPublications,
        fetchPublicationsByType,
        addPublication,
        updatePublication,
        deletePublication,
        verifyPublication,
        getPublicationById,
        clearError: () => setError(null)
      }}
    >
      {children}
    </PublicationContext.Provider>
  );
};