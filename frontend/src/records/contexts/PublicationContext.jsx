import React, { createContext, useContext, useState, useCallback } from "react";
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
  const apiBase = "http://localhost:4000/api/publications";

  const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
  });

  // Fetch user's publications
  const fetchUserPublications = useCallback(async (userId) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${apiBase}/my-publications?UserId=${userId}`,
        getAuthHeader()
      );
      setPublications(response.data.publications || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch publications");
      console.error("Fetch publications error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch pending publications (admin/tutor)
  const fetchPendingPublications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${apiBase}/pending`,
        getAuthHeader()
      );
      setPendingPublications(response.data.publications || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch pending publications");
      console.error("Fetch pending publications error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch all publications (admin/tutor)
  const fetchAllPublications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${apiBase}/all`,
        getAuthHeader()
      );
      setPublications(response.data.publications || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch all publications");
      console.error("Fetch all publications error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Add new publication
  const addPublication = async (publicationData) => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${apiBase}/add`,
        publicationData,
        getAuthHeader()
      );
      await fetchUserPublications(publicationData.Userid);
      setError(null);
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
  const updatePublication = async (publicationId, publicationData) => {
    setLoading(true);
    try {
      const response = await axios.put(
        `${apiBase}/update/${publicationId}`,
        publicationData,
        getAuthHeader()
      );
      await fetchUserPublications(publicationData.Userid);
      setError(null);
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
  const deletePublication = async (publicationId, userId) => {
    setLoading(true);
    try {
      const response = await axios.delete(
        `${apiBase}/delete/${publicationId}`,
        {
          ...getAuthHeader(),
          data: { Userid: userId }
        }
      );
      await fetchUserPublications(userId);
      setError(null);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete publication");
      console.error("Delete publication error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Verify publication (admin/tutor)
  const verifyPublication = async (publicationId, verifierId, comments = "") => {
    setLoading(true);
    try {
      const response = await axios.put(
        `${apiBase}/verify/${publicationId}`,
        { 
          Userid: verifierId,
          verification_comments: comments
        },
        getAuthHeader()
      );
      await fetchPendingPublications();
      setError(null);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to verify publication");
      console.error("Verify publication error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Clear error
  const clearError = () => setError(null);

  return (
    <PublicationContext.Provider
      value={{
        publications,
        pendingPublications,
        loading,
        error,
        fetchUserPublications,
        fetchPendingPublications,
        fetchAllPublications,
        addPublication,
        updatePublication,
        deletePublication,
        verifyPublication,
        clearError
      }}
    >
      {children}
    </PublicationContext.Provider>
  );
};