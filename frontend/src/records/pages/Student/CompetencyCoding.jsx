import React, { useState, useEffect } from "react";
import { FaCode, FaTrophy, FaChartLine, FaPlus, FaEdit, FaTrash, FaMedal } from "react-icons/fa";
import { motion } from "framer-motion";
import { useCompetencyCoding } from "../../contexts/CompetencyCodingContext";

const CompetencyCoding = () => {
  const {
    competencyRecord,
    skillRackSummary,
    platforms,
    analytics,
    loading,
    error,
    addOrUpdateCompetency,
    fetchCompetencyRecord,
    fetchSkillRackSummary,
    fetchPlatforms,
    fetchAnalytics,
    updateSkillRackMetrics,
    addPlatform,
    updatePlatform,
    deletePlatform,
    clearError
  } = useCompetencyCoding();

  const [activeTab, setActiveTab] = useState('overview');
  const [localLoading, setLocalLoading] = useState(false);
  const userId = localStorage.getItem("userId");

  // Overview Form State
  const [overviewForm, setOverviewForm] = useState({
    present_competency: "",
    competency_level: "Beginner",
    gaps: [],
    gaps_description: "",
    steps: [],
  });

  // SkillRack Form State
  const [skillRackForm, setSkillRackForm] = useState({
    skillrack_total_programs: 0,
    skillrack_dc: 0,
    skillrack_dt: 0,
    skillrack_level_1: 0,
    skillrack_level_2: 0,
    skillrack_level_3: 0,
    skillrack_level_4: 0,
    skillrack_level_5: 0,
    skillrack_level_6: 0,
    skillrack_code_tracks: 0,
    skillrack_code_tests: 0,
    skillrack_code_tutor: 0,
    skillrack_aptitude_score: 0,
    skillrack_points: 0,
    skillrack_bronze_medal_count: 0,
    skillrack_silver_medal_count: 0,
    skillrack_gold_medal_count: 0,
    skillrack_rank: "",
  });

  // Platform Form State
  const [platformForm, setPlatformForm] = useState({
    platform_name: "",
    level: "",
    no_of_problems_solved: 0,
    rank: "",
    easy_count: 0,
    medium_count: 0,
    hard_count: 0,
    description: "",
  });

  const [editingPlatformId, setEditingPlatformId] = useState(null);
  const [gapInput, setGapInput] = useState("");
  const [stepInput, setStepInput] = useState("");

  useEffect(() => {
    if (userId) {
      fetchCompetencyRecord(userId);
      fetchSkillRackSummary(userId);
      fetchPlatforms(userId);
      fetchAnalytics(userId);
    }
  }, [userId]);

  useEffect(() => {
    if (competencyRecord) {
      setOverviewForm({
        present_competency: competencyRecord.present_competency || "",
        competency_level: competencyRecord.competency_level || "Beginner",
        gaps: competencyRecord.gaps || [],
        gaps_description: competencyRecord.gaps_description || "",
        steps: competencyRecord.steps || [],
      });

      setSkillRackForm({
        skillrack_total_programs: competencyRecord.skillrack_total_programs || 0,
        skillrack_dc: competencyRecord.skillrack_dc || 0,
        skillrack_dt: competencyRecord.skillrack_dt || 0,
        skillrack_level_1: competencyRecord.skillrack_level_1 || 0,
        skillrack_level_2: competencyRecord.skillrack_level_2 || 0,
        skillrack_level_3: competencyRecord.skillrack_level_3 || 0,
        skillrack_level_4: competencyRecord.skillrack_level_4 || 0,
        skillrack_level_5: competencyRecord.skillrack_level_5 || 0,
        skillrack_level_6: competencyRecord.skillrack_level_6 || 0,
        skillrack_code_tracks: competencyRecord.skillrack_code_tracks || 0,
        skillrack_code_tests: competencyRecord.skillrack_code_tests || 0,
        skillrack_code_tutor: competencyRecord.skillrack_code_tutor || 0,
        skillrack_aptitude_score: competencyRecord.skillrack_aptitude_score || 0,
        skillrack_points: competencyRecord.skillrack_points || 0,
        skillrack_bronze_medal_count: competencyRecord.skillrack_bronze_medal_count || 0,
        skillrack_silver_medal_count: competencyRecord.skillrack_silver_medal_count || 0,
        skillrack_gold_medal_count: competencyRecord.skillrack_gold_medal_count || 0,
        skillrack_rank: competencyRecord.skillrack_rank || "",
      });
    }
  }, [competencyRecord]);

  // Overview Handlers
  const handleAddGap = () => {
    if (gapInput.trim()) {
      setOverviewForm(prev => ({
        ...prev,
        gaps: [...prev.gaps, gapInput.trim()]
      }));
      setGapInput("");
    }
  };

  const handleRemoveGap = (index) => {
    setOverviewForm(prev => ({
      ...prev,
      gaps: prev.gaps.filter((_, i) => i !== index)
    }));
  };

  const handleAddStep = () => {
    if (stepInput.trim()) {
      setOverviewForm(prev => ({
        ...prev,
        steps: [...prev.steps, stepInput.trim()]
      }));
      setStepInput("");
    }
  };

  const handleRemoveStep = (index) => {
    setOverviewForm(prev => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index)
    }));
  };

  const handleOverviewSubmit = async (e) => {
    e.preventDefault();
    clearError();
    setLocalLoading(true);

    try {
      await addOrUpdateCompetency({
        Userid: parseInt(userId),
        ...overviewForm,
        gaps: JSON.stringify(overviewForm.gaps),
        steps: JSON.stringify(overviewForm.steps),
      });
      await fetchCompetencyRecord(userId);
      await fetchAnalytics(userId);
    } catch (err) {
      console.error("Error saving overview:", err);
    } finally {
      setLocalLoading(false);
    }
  };

  // SkillRack Handlers
  const handleSkillRackSubmit = async (e) => {
    e.preventDefault();
    clearError();
    setLocalLoading(true);

    try {
      await updateSkillRackMetrics({
        Userid: parseInt(userId),
        ...skillRackForm,
        skillrack_rank: skillRackForm.skillrack_rank ? parseInt(skillRackForm.skillrack_rank) : null,
      });
      await fetchSkillRackSummary(userId);
      await fetchAnalytics(userId);
    } catch (err) {
      console.error("Error updating SkillRack:", err);
    } finally {
      setLocalLoading(false);
    }
  };

  // Platform Handlers
  const handlePlatformSubmit = async (e) => {
    e.preventDefault();
    clearError();
    setLocalLoading(true);

    try {
      if (editingPlatformId) {
        await updatePlatform(editingPlatformId, {
          Userid: parseInt(userId),
          ...platformForm,
        });
      } else {
        await addPlatform({
          Userid: parseInt(userId),
          ...platformForm,
        });
      }
      await fetchPlatforms(userId);
      await fetchAnalytics(userId);
      setPlatformForm({
        platform_name: "",
        level: "",
        no_of_problems_solved: 0,
        rank: "",
        easy_count: 0,
        medium_count: 0,
        hard_count: 0,
        description: "",
      });
      setEditingPlatformId(null);
    } catch (err) {
      console.error("Error saving platform:", err);
    } finally {
      setLocalLoading(false);
    }
  };

  const handleEditPlatform = (platform) => {
    setPlatformForm({
      platform_name: platform.platform_name,
      level: platform.level,
      no_of_problems_solved: platform.no_of_problems_solved || 0,
      rank: platform.rank || "",
      easy_count: platform.easy_count || 0,
      medium_count: platform.medium_count || 0,
      hard_count: platform.hard_count || 0,
      description: platform.description || "",
    });
    setEditingPlatformId(platform.id);
  };

  const handleDeletePlatform = async (platformId) => {
    if (window.confirm("Are you sure you want to delete this platform profile?")) {
      try {
        await deletePlatform(platformId, parseInt(userId));
        await fetchPlatforms(userId);
        await fetchAnalytics(userId);
      } catch (err) {
        console.error("Error deleting platform:", err);
      }
    }
  };

  const getLevelColor = (level) => {
    switch(level) {
      case "Expert": return "bg-purple-100 text-purple-800";
      case "Advanced": return "bg-blue-100 text-blue-800";
      case "Intermediate": return "bg-green-100 text-green-800";
      case "Beginner": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow-md w-full min-h-screen">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        Coding Competency
      </h2>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {(loading || localLoading) && (
        <div className="mb-4 p-4 bg-blue-100 text-blue-700 rounded-lg text-center">
          Loading...
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview', icon: FaCode },
          { id: 'skillrack', label: 'SkillRack', icon: FaTrophy },
          { id: 'platforms', label: 'Other Platforms', icon: FaChartLine },
          { id: 'analytics', label: 'Analytics', icon: FaMedal },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <tab.icon />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-lg p-6"
        >
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Competency Overview</h3>
          <form onSubmit={handleOverviewSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="col-span-2">
                <label className="block text-gray-700 font-medium mb-1">Present Competency</label>
                <textarea
                  value={overviewForm.present_competency}
                  onChange={(e) => setOverviewForm({...overviewForm, present_competency: e.target.value})}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Describe your current coding competencies..."
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">Competency Level</label>
                <select
                  value={overviewForm.competency_level}
                  onChange={(e) => setOverviewForm({...overviewForm, competency_level: e.target.value})}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Expert">Expert</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-gray-700 font-medium mb-1">Skill Gaps</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={gapInput}
                    onChange={(e) => setGapInput(e.target.value)}
                    className="flex-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Add a skill gap..."
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddGap())}
                  />
                  <button
                    type="button"
                    onClick={handleAddGap}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    <FaPlus />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {overviewForm.gaps.map((gap, index) => (
                    <span key={index} className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm flex items-center gap-2">
                      {gap}
                      <button
                        type="button"
                        onClick={() => handleRemoveGap(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="col-span-2">
                <label className="block text-gray-700 font-medium mb-1">Gaps Description</label>
                <textarea
                  value={overviewForm.gaps_description}
                  onChange={(e) => setOverviewForm({...overviewForm, gaps_description: e.target.value})}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="2"
                  placeholder="Detailed description of skill gaps..."
                />
              </div>

              <div className="col-span-2">
                <label className="block text-gray-700 font-medium mb-1">Improvement Steps</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={stepInput}
                    onChange={(e) => setStepInput(e.target.value)}
                    className="flex-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Add an improvement step..."
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddStep())}
                  />
                  <button
                    type="button"
                    onClick={handleAddStep}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    <FaPlus />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {overviewForm.steps.map((step, index) => (
                    <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm flex items-center gap-2">
                      {step}
                      <button
                        type="button"
                        onClick={() => handleRemoveStep(index)}
                        className="text-green-600 hover:text-green-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg shadow-md hover:shadow-lg transition"
                disabled={loading || localLoading}
              >
                {localLoading ? "Saving..." : "Save Overview"}
              </motion.button>
            </div>
          </form>
        </motion.div>
      )}

      {/* SkillRack Tab */}
      {activeTab === 'skillrack' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-lg p-6"
        >
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FaTrophy className="text-yellow-500" /> SkillRack Metrics
          </h3>
          <form onSubmit={handleSkillRackSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 font-medium mb-1">Total Programs</label>
                <input
                  type="number"
                  value={skillRackForm.skillrack_total_programs}
                  onChange={(e) => setSkillRackForm({...skillRackForm, skillrack_total_programs: parseInt(e.target.value) || 0})}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-1">DC Count</label>
                <input
                  type="number"
                  value={skillRackForm.skillrack_dc}
                  onChange={(e) => setSkillRackForm({...skillRackForm, skillrack_dc: parseInt(e.target.value) || 0})}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-1">DT Count</label>
                <input
                  type="number"
                  value={skillRackForm.skillrack_dt}
                  onChange={(e) => setSkillRackForm({...skillRackForm, skillrack_dt: parseInt(e.target.value) || 0})}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-1">Points</label>
                <input
                  type="number"
                  value={skillRackForm.skillrack_points}
                  onChange={(e) => setSkillRackForm({...skillRackForm, skillrack_points: parseInt(e.target.value) || 0})}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">Level 1</label>
                <input
                  type="number"
                  value={skillRackForm.skillrack_level_1}
                  onChange={(e) => setSkillRackForm({...skillRackForm, skillrack_level_1: parseInt(e.target.value) || 0})}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-1">Level 2</label>
                <input
                  type="number"
                  value={skillRackForm.skillrack_level_2}
                  onChange={(e) => setSkillRackForm({...skillRackForm, skillrack_level_2: parseInt(e.target.value) || 0})}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-1">Level 3</label>
                <input
                  type="number"
                  value={skillRackForm.skillrack_level_3}
                  onChange={(e) => setSkillRackForm({...skillRackForm, skillrack_level_3: parseInt(e.target.value) || 0})}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-1">Level 4</label>
                <input
                  type="number"
                  value={skillRackForm.skillrack_level_4}
                  onChange={(e) => setSkillRackForm({...skillRackForm, skillrack_level_4: parseInt(e.target.value) || 0})}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-1">Level 5</label>
                <input
                  type="number"
                  value={skillRackForm.skillrack_level_5}
                  onChange={(e) => setSkillRackForm({...skillRackForm, skillrack_level_5: parseInt(e.target.value) || 0})}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-1">Level 6</label>
                <input
                  type="number"
                  value={skillRackForm.skillrack_level_6}
                  onChange={(e) => setSkillRackForm({...skillRackForm, skillrack_level_6: parseInt(e.target.value) || 0})}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">Code Tracks</label>
                <input
                  type="number"
                  value={skillRackForm.skillrack_code_tracks}
                  onChange={(e) => setSkillRackForm({...skillRackForm, skillrack_code_tracks: parseInt(e.target.value) || 0})}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-1">Code Tests</label>
                <input
                  type="number"
                  value={skillRackForm.skillrack_code_tests}
                  onChange={(e) => setSkillRackForm({...skillRackForm, skillrack_code_tests: parseInt(e.target.value) || 0})}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-1">Code Tutor</label>
                <input
                  type="number"
                  value={skillRackForm.skillrack_code_tutor}
                  onChange={(e) => setSkillRackForm({...skillRackForm, skillrack_code_tutor: parseInt(e.target.value) || 0})}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-1">Aptitude Score (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={skillRackForm.skillrack_aptitude_score}
                  onChange={(e) => setSkillRackForm({...skillRackForm, skillrack_aptitude_score: parseFloat(e.target.value) || 0})}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  max="100"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">🥉 Bronze Medals</label>
                <input
                  type="number"
                  value={skillRackForm.skillrack_bronze_medal_count}
                  onChange={(e) => setSkillRackForm({...skillRackForm, skillrack_bronze_medal_count: parseInt(e.target.value) || 0})}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-1">🥈 Silver Medals</label>
                <input
                  type="number"
                  value={skillRackForm.skillrack_silver_medal_count}
                  onChange={(e) => setSkillRackForm({...skillRackForm, skillrack_silver_medal_count: parseInt(e.target.value) || 0})}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-1">🥇 Gold Medals</label>
                <input
                  type="number"
                  value={skillRackForm.skillrack_gold_medal_count}
                  onChange={(e) => setSkillRackForm({...skillRackForm, skillrack_gold_medal_count: parseInt(e.target.value) || 0})}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-1">Rank</label>
                <input
                  type="number"
                  value={skillRackForm.skillrack_rank}
                  onChange={(e) => setSkillRackForm({...skillRackForm, skillrack_rank: e.target.value})}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  placeholder="Your rank"
                />
              </div>
            </div>

            <div className="flex justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                className="px-6 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg shadow-md hover:shadow-lg transition"
                disabled={loading || localLoading}
              >
                {localLoading ? "Updating..." : "Update SkillRack Metrics"}
              </motion.button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Platforms Tab */}
      {activeTab === 'platforms' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Add/Edit Platform Form */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              {editingPlatformId ? 'Edit Platform Profile' : 'Add Platform Profile'}
            </h3>
            <form onSubmit={handlePlatformSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Platform Name *</label>
                  <input
                    type="text"
                    value={platformForm.platform_name}
                    onChange={(e) => setPlatformForm({...platformForm, platform_name: e.target.value})}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., LeetCode, HackerRank"
                    required
                    disabled={!!editingPlatformId}
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Level *</label>
                  <select
                    value={platformForm.level}
                    onChange={(e) => setPlatformForm({...platformForm, level: e.target.value})}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Level</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Expert">Expert</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Problems Solved</label>
                  <input
                    type="number"
                    value={platformForm.no_of_problems_solved}
                    onChange={(e) => setPlatformForm({...platformForm, no_of_problems_solved: parseInt(e.target.value) || 0})}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Rank</label>
                  <input
                    type="text"
                    value={platformForm.rank}
                    onChange={(e) => setPlatformForm({...platformForm, rank: e.target.value})}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Your rank"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-1">Easy Count</label>
                  <input
                    type="number"
                    value={platformForm.easy_count}
                    onChange={(e) => setPlatformForm({...platformForm, easy_count: parseInt(e.target.value) || 0})}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Medium Count</label>
                  <input
                    type="number"
                    value={platformForm.medium_count}
                    onChange={(e) => setPlatformForm({...platformForm, medium_count: parseInt(e.target.value) || 0})}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Hard Count</label>
                  <input
                    type="number"
                    value={platformForm.hard_count}
                    onChange={(e) => setPlatformForm({...platformForm, hard_count: parseInt(e.target.value) || 0})}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                    min="0"
                  />
                </div>

                <div className="col-span-4">
                  <label className="block text-gray-700 font-medium mb-1">Description</label>
                  <textarea
                    value={platformForm.description}
                    onChange={(e) => setPlatformForm({...platformForm, description: e.target.value})}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="2"
                    placeholder="Additional details about your profile..."
                  />
                </div>
              </div>

              <div className="flex justify-center gap-4">
                {editingPlatformId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPlatformId(null);
                      setPlatformForm({
                        platform_name: "",
                        level: "",
                        no_of_problems_solved: 0,
                        rank: "",
                        easy_count: 0,
                        medium_count: 0,
                        hard_count: 0,
                        description: "",
                      });
                    }}
                    className="px-6 py-2 bg-gray-500 text-white rounded-lg shadow-md hover:shadow-lg transition"
                  >
                    Cancel
                  </button>
                )}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg shadow-md hover:shadow-lg transition"
                  disabled={loading || localLoading}
                >
                  {localLoading ? "Saving..." : editingPlatformId ? "Update Platform" : "Add Platform"}
                </motion.button>
              </div>
            </form>
          </div>

          {/* Platforms List */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">My Platform Profiles</h3>
            {platforms.length === 0 ? (
              <p className="text-gray-500">No platform profiles added yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {platforms.map((platform) => (
                  <div key={platform.id} className="border rounded-lg p-4 hover:shadow-md transition">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-lg text-gray-800">{platform.platform_name}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getLevelColor(platform.level)}`}>
                        {platform.level}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600 mb-3">
                      <p>Problems Solved: <span className="font-semibold">{platform.no_of_problems_solved || 0}</span></p>
                      {platform.rank && <p>Rank: <span className="font-semibold">{platform.rank}</span></p>}
                      <div className="flex gap-2 mt-2">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Easy: {platform.easy_count || 0}</span>
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">Medium: {platform.medium_count || 0}</span>
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">Hard: {platform.hard_count || 0}</span>
                      </div>
                      {platform.description && (
                        <p className="text-xs text-gray-500 mt-2">{platform.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditPlatform(platform)}
                        className="flex-1 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                      >
                        <FaEdit className="inline mr-1" /> Edit
                      </button>
                      <button
                        onClick={() => handleDeletePlatform(platform.id)}
                        className="flex-1 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                      >
                        <FaTrash className="inline mr-1" /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && analytics && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Current Level */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Current Level</h3>
            <div className="flex items-center gap-4">
              <span className={`px-6 py-3 rounded-lg text-2xl font-bold ${getLevelColor(analytics.currentLevel)}`}>
                {analytics.currentLevel}
              </span>
            </div>
          </div>

          {/* SkillRack Analytics */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">SkillRack Analytics</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Total Programs</p>
                <p className="text-2xl font-bold text-blue-600">{analytics.skillRackMetrics.totalPrograms}</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600">Aptitude Score</p>
                <p className="text-2xl font-bold text-purple-600">{analytics.skillRackMetrics.aptitudeScore}%</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Total Points</p>
                <p className="text-2xl font-bold text-green-600">{analytics.skillRackMetrics.totalPoints}</p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm text-gray-600">Rank</p>
                <p className="text-2xl font-bold text-yellow-600">{analytics.skillRackMetrics.rank || 'N/A'}</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-semibold text-gray-700 mb-2">Level Progress</p>
                <div className="space-y-2">
                  {Object.entries(analytics.skillRackMetrics.levelProgress).map(([level, count]) => (
                    <div key={level} className="flex justify-between items-center">
                      <span className="text-sm capitalize">{level.replace('level', 'Level ')}</span>
                      <span className="font-bold">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-semibold text-gray-700 mb-2">Medals</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">🥇 Gold</span>
                    <span className="font-bold">{analytics.skillRackMetrics.medals.gold}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">🥈 Silver</span>
                    <span className="font-bold">{analytics.skillRackMetrics.medals.silver}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">🥉 Bronze</span>
                    <span className="font-bold">{analytics.skillRackMetrics.medals.bronze}</span>
                  </div>
                  <div className="flex justify-between items-center border-t pt-2">
                    <span className="text-sm font-semibold">Total</span>
                    <span className="font-bold text-lg">{analytics.skillRackMetrics.medals.total}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Other Platforms Analytics */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Other Platforms Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="p-4 bg-indigo-50 rounded-lg">
                <p className="text-sm text-gray-600">Total Platforms</p>
                <p className="text-2xl font-bold text-indigo-600">{analytics.otherPlatformsMetrics.totalPlatforms}</p>
              </div>
              <div className="p-4 bg-pink-50 rounded-lg">
                <p className="text-sm text-gray-600">Total Problems</p>
                <p className="text-2xl font-bold text-pink-600">{analytics.otherPlatformsMetrics.totalProblems}</p>
              </div>
            </div>
          </div>

          {/* Gaps & Improvement Steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 text-red-600">Skill Gaps</h3>
              {analytics.gaps.length === 0 ? (
                <p className="text-gray-500">No gaps identified</p>
              ) : (
                <ul className="space-y-2">
                  {analytics.gaps.map((gap, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-red-500 mt-1">•</span>
                      <span className="text-gray-700">{gap}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 text-green-600">Improvement Steps</h3>
              {analytics.improvementSteps.length === 0 ? (
                <p className="text-gray-500">No steps defined</p>
              ) : (
                <ol className="space-y-2">
                  {analytics.improvementSteps.map((step, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-green-500 font-bold">{index + 1}.</span>
                      <span className="text-gray-700">{step}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default CompetencyCoding;