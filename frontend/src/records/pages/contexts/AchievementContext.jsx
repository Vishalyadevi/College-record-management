import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";

const AchievementContext = createContext();

export const useAchievement = () => {
  const context = useContext(AchievementContext);
  if (!context) {
    throw new Error("useAchievement must be used within an AchievementProvider");
  }
  return context;
};

export const AchievementProvider = ({ children }) => {
  const [achievements, setAchievements] = useState([]);
  const [pendingAchievements, setPendingAchievements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const apiBase = "http://localhost:4000/api"; // Matches your server.js route

  const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
  });

  // Fetch all achievements
  const fetchAllAchievements = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${apiBase}/fetch-achievements`, getAuthHeader());
      setAchievements(response.data || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch achievements");
      console.error("Fetch achievements error:", err);
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  // Fetch user-specific achievements
  const fetchUserAchievements = useCallback(async (userId) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${apiBase}/user-achievements/${userId}`,
        getAuthHeader()
      );
      setAchievements(response.data || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch user achievements");
      console.error("Fetch user achievements error:", err);
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  // Fetch pending achievements (admin)
  const fetchPendingAchievements = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${apiBase}/pending-achievements`,
        getAuthHeader()
      );
      setPendingAchievements(response.data || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch pending achievements");
      console.error("Fetch pending achievements error:", err);
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  // Add new achievement with file upload
  const addAchievement = async (formData) => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${apiBase}/add-achievement`,
        formData,
        {
          ...getAuthHeader(),
          "Content-Type": "multipart/form-data"
        }
      );
      await fetchUserAchievements(formData.get("Userid"));
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add achievement");
      console.error("Add achievement error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update achievement
  const updateAchievement = async (achievementId, formData) => {
    setLoading(true);
    try {
      const response = await axios.patch(
        `${apiBase}/update-achievement/${achievementId}`,
        formData,
        {
          ...getAuthHeader(),
          "Content-Type": "multipart/form-data"
        }
      );
      await fetchAllAchievements();
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update achievement");
      console.error("Update achievement error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete achievement
  const deleteAchievement = async (achievementId) => {
    setLoading(true);
    try {
      const response = await axios.delete(
        `${apiBase}/delete-achievement/${achievementId}`,
        getAuthHeader()
      );
      await fetchAllAchievements();
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete achievement");
      console.error("Delete achievement error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Verify achievement (admin)
  const verifyAchievement = async (achievementId, status) => {
    const formData = new FormData();
    formData.append("verification_status", status);
    return updateAchievement(achievementId, formData);
  };

  useEffect(() => {
    // Initial data fetch could be done here if needed
  }, []);

  return (
    <AchievementContext.Provider
      value={{
        achievements,
        pendingAchievements,
        loading,
        error,
        fetchAllAchievements,
        fetchUserAchievements,
        fetchPendingAchievements,
        addAchievement,
        updateAchievement,
        deleteAchievement,
        verifyAchievement,
        clearError: () => setError(null)
      }}
    >
      {children}
    </AchievementContext.Provider>
  );
};