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
  const [statistics, setStatistics] = useState(null);
  const [portfolio, setPortfolio] = useState(null);
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

  // Fetch publication statistics
  const fetchStatistics = useCallback(async (userId) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${apiBase}/statistics?UserId=${userId}`,
        getAuthHeader()
      );
      setStatistics(response.data.statistics);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch statistics");
      console.error("Fetch statistics error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch publication portfolio
  const fetchPortfolio = useCallback(async (userId) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${apiBase}/portfolio?UserId=${userId}`,
        getAuthHeader()
      );
      setPortfolio(response.data.portfolio);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch portfolio");
      console.error("Fetch portfolio error:", err);
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

  // Search by publication type
  const searchByType = async (userId, type) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${apiBase}/search-by-type?UserId=${userId}&type=${type}`,
        getAuthHeader()
      );
      setPublications(response.data.publications || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to search publications");
      console.error("Search publications error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Get high impact publications
  const fetchHighImpactPublications = useCallback(async (userId, minImpactFactor = 2.0) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${apiBase}/high-impact?UserId=${userId}&minImpactFactor=${minImpactFactor}`,
        getAuthHeader()
      );
      setPublications(response.data.publications || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch high impact publications");
      console.error("Fetch high impact publications error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get indexed publications
  const fetchIndexedPublications = useCallback(async (userId) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${apiBase}/indexed-publications?UserId=${userId}`,
        getAuthHeader()
      );
      setPublications(response.data.publications || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch indexed publications");
      console.error("Fetch indexed publications error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <PublicationContext.Provider
      value={{
        publications,
        pendingPublications,
        statistics,
        portfolio,
        loading,
        error,
        fetchUserPublications,
        fetchPendingPublications,
        fetchAllPublications,
        fetchStatistics,
        fetchPortfolio,
        addPublication,
        updatePublication,
        deletePublication,
        verifyPublication,
        searchByType,
        fetchHighImpactPublications,
        fetchIndexedPublications,
        clearError: () => setError(null)
      }}
    >
      {children}
    </PublicationContext.Provider>
  );
};