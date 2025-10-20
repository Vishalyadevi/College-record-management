import React, { createContext, useContext, useState, useCallback } from "react";
import axios from "axios";

const CompetencyCodingContext = createContext();

export const useCompetencyCoding = () => {
  const context = useContext(CompetencyCodingContext);
  if (!context) {
    throw new Error("useCompetencyCoding must be used within a CompetencyCodingProvider");
  }
  return context;
};

export const CompetencyCodingProvider = ({ children }) => {
  const [competencyRecord, setCompetencyRecord] = useState(null);
  const [skillRackSummary, setSkillRackSummary] = useState(null);
  const [platforms, setPlatforms] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [allRecords, setAllRecords] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const apiBase = "http://localhost:4000/api/competency-coding";

  const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
  });

  // ========================
  // MAIN COMPETENCY METHODS
  // ========================

  const addOrUpdateCompetency = async (competencyData) => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${apiBase}/add-or-update`,
        competencyData,
        getAuthHeader()
      );
      setError(null);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to save competency record";
      setError(errorMsg);
      console.error("Add/Update competency error:", err);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompetencyRecord = useCallback(async (userId) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${apiBase}/my-record?UserId=${userId}`,
        getAuthHeader()
      );
      setCompetencyRecord(response.data.competency || null);
      setError(null);
    } catch (err) {
      if (err.response?.status === 404) {
        setCompetencyRecord(null);
      } else {
        setError(err.response?.data?.message || "Failed to fetch competency record");
      }
      console.error("Fetch competency record error:", err);
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  const fetchAnalytics = useCallback(async (userId) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${apiBase}/analytics?UserId=${userId}`,
        getAuthHeader()
      );
      setAnalytics(response.data.analytics || null);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch analytics");
      console.error("Fetch analytics error:", err);
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  // ========================
  // SKILLRACK METHODS
  // ========================

  const updateSkillRackMetrics = async (metricsData) => {
    setLoading(true);
    try {
      const response = await axios.put(
        `${apiBase}/skillrack/update`,
        metricsData,
        getAuthHeader()
      );
      setError(null);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to update SkillRack metrics";
      setError(errorMsg);
      console.error("Update SkillRack metrics error:", err);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const fetchSkillRackSummary = useCallback(async (userId) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${apiBase}/skillrack/summary?UserId=${userId}`,
        getAuthHeader()
      );
      setSkillRackSummary(response.data.skillRackSummary || null);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch SkillRack summary");
      console.error("Fetch SkillRack summary error:", err);
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  // ========================
  // PLATFORM METHODS
  // ========================

  const addPlatform = async (platformData) => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${apiBase}/platform/add`,
        platformData,
        getAuthHeader()
      );
      setError(null);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to add platform";
      setError(errorMsg);
      console.error("Add platform error:", err);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlatforms = useCallback(async (userId) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${apiBase}/platform/all?UserId=${userId}`,
        getAuthHeader()
      );
      setPlatforms(response.data.platforms || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch platforms");
      console.error("Fetch platforms error:", err);
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  const updatePlatform = async (platformId, platformData) => {
    setLoading(true);
    try {
      const response = await axios.put(
        `${apiBase}/platform/update/${platformId}`,
        platformData,
        getAuthHeader()
      );
      setError(null);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to update platform";
      setError(errorMsg);
      console.error("Update platform error:", err);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const deletePlatform = async (platformId, userId) => {
    setLoading(true);
    try {
      const response = await axios.delete(
        `${apiBase}/platform/delete/${platformId}`,
        {
          ...getAuthHeader(),
          data: { Userid: userId }
        }
      );
      setError(null);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to delete platform";
      setError(errorMsg);
      console.error("Delete platform error:", err);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // ========================
  // ADMIN/TUTOR METHODS
  // ========================

  const fetchAllRecords = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${apiBase}/all-records`,
        getAuthHeader()
      );
      setAllRecords(response.data.records || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch all records");
      console.error("Fetch all records error:", err);
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  const fetchStatistics = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${apiBase}/statistics`,
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
  }, [apiBase]);

  const searchByLevel = async (level) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${apiBase}/search-by-level?level=${level}`,
        getAuthHeader()
      );
      setError(null);
      return response.data.records || [];
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to search by level";
      setError(errorMsg);
      console.error("Search by level error:", err);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const fetchTopPerformers = async (limit = 10, sortBy = 'aptitude') => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${apiBase}/top-performers?limit=${limit}&sortBy=${sortBy}`,
        getAuthHeader()
      );
      setError(null);
      return response.data.records || [];
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to fetch top performers";
      setError(errorMsg);
      console.error("Fetch top performers error:", err);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlatformStatistics = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${apiBase}/platform-statistics`,
        getAuthHeader()
      );
      setError(null);
      return response.data.platformStatistics || {};
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to fetch platform statistics";
      setError(errorMsg);
      console.error("Fetch platform statistics error:", err);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const verifyRecord = async (recordId, userId, comments = "") => {
    setLoading(true);
    try {
      const response = await axios.put(
        `${apiBase}/verify/${recordId}`,
        { Userid: userId, comments },
        getAuthHeader()
      );
      setError(null);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to verify record";
      setError(errorMsg);
      console.error("Verify record error:", err);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return (
    <CompetencyCodingContext.Provider
      value={{
        competencyRecord,
        skillRackSummary,
        platforms,
        analytics,
        allRecords,
        statistics,
        loading,
        error,
        addOrUpdateCompetency,
        fetchCompetencyRecord,
        fetchAnalytics,
        updateSkillRackMetrics,
        fetchSkillRackSummary,
        addPlatform,
        fetchPlatforms,
        updatePlatform,
        deletePlatform,
        fetchAllRecords,
        fetchStatistics,
        searchByLevel,
        fetchTopPerformers,
        fetchPlatformStatistics,
        verifyRecord,
        clearError
      }}
    >
      {children}
    </CompetencyCodingContext.Provider>
  );
};