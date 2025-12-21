// =============================================
// FRONTEND - Student Education Page
// File: pages/student/StudentEducationPage.jsx
// =============================================

import React, { useState, useEffect } from "react";
import { FaGraduationCap, FaChartBar, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";
import { motion } from "framer-motion";
import { useStudentEducation } from "../../contexts/StudentEducationContext";

const StudentEducationPage = () => {
  const {
    educationRecord,
    averages,
    loading,
    error,
    addOrUpdateEducation,
    fetchEducationRecord,
    fetchAverages,
    clearError
  } = useStudentEducation();

  const [activeTab, setActiveTab] = useState('education');
  const [localLoading, setLocalLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const userId = localStorage.getItem("userId");

  // Form State - Only for 10th, 12th, Degree
  const [formData, setFormData] = useState({
    tenth_school_name: "",
    tenth_board: "",
    tenth_percentage: "",
    tenth_year_of_passing: "",
    twelfth_school_name: "",
    twelfth_board: "",
    twelfth_percentage: "",
    twelfth_year_of_passing: "",
    degree_institution_name: "",
    degree_name: "",
    degree_specialization: "",
  });

  useEffect(() => {
    if (userId) {
      fetchEducationRecord(userId);
      fetchAverages(userId);
    }
  }, [userId, fetchEducationRecord, fetchAverages]);

  useEffect(() => {
    if (educationRecord) {
      setFormData({
        tenth_school_name: educationRecord.tenth_school_name || "",
        tenth_board: educationRecord.tenth_board || "",
        tenth_percentage: educationRecord.tenth_percentage || "",
        tenth_year_of_passing: educationRecord.tenth_year_of_passing || "",
        twelfth_school_name: educationRecord.twelfth_school_name || "",
        twelfth_board: educationRecord.twelfth_board || "",
        twelfth_percentage: educationRecord.twelfth_percentage || "",
        twelfth_year_of_passing: educationRecord.twelfth_year_of_passing || "",
        degree_institution_name: educationRecord.degree_institution_name || "",
        degree_name: educationRecord.degree_name || "",
        degree_specialization: educationRecord.degree_specialization || "",
      });
    }
  }, [educationRecord]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setSuccessMessage("");
    clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    setLocalLoading(true);
    setSuccessMessage("");

    try {
      const educationData = {
        Userid: parseInt(userId),
        ...formData,
        tenth_percentage: formData.tenth_percentage ? parseFloat(formData.tenth_percentage) : null,
        tenth_year_of_passing: formData.tenth_year_of_passing ? parseInt(formData.tenth_year_of_passing) : null,
        twelfth_percentage: formData.twelfth_percentage ? parseFloat(formData.twelfth_percentage) : null,
        twelfth_year_of_passing: formData.twelfth_year_of_passing ? parseInt(formData.twelfth_year_of_passing) : null,
      };

      await addOrUpdateEducation(educationData);
      await fetchEducationRecord(userId);
      setSuccessMessage("Education details submitted successfully! Waiting for tutor approval.");
    } catch (err) {
      console.error("Error saving education record:", err);
    } finally {
      setLocalLoading(false);
    }
  };

  const getCGPAColor = (cgpa) => {
    if (!cgpa || cgpa === "N/A") return "text-gray-500";
    const numCgpa = parseFloat(cgpa);
    if (numCgpa >= 9) return "text-green-600";
    if (numCgpa >= 8) return "text-blue-600";
    if (numCgpa >= 7) return "text-yellow-600";
    if (numCgpa >= 6) return "text-orange-600";
    return "text-red-600";
  };

  const getCGPABgColor = (cgpa) => {
    if (!cgpa || cgpa === "N/A") return "bg-gray-50 border-gray-300";
    const numCgpa = parseFloat(cgpa);
    if (numCgpa >= 9) return "bg-green-50 border-green-300";
    if (numCgpa >= 8) return "bg-blue-50 border-blue-300";
    if (numCgpa >= 7) return "bg-yellow-50 border-yellow-300";
    if (numCgpa >= 6) return "bg-orange-50 border-orange-300";
    return "bg-red-50 border-red-300";
  };

  return (
    <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          My Education Records
        </h2>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg border-2 border-green-300">
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg border-2 border-red-300">
            {error}
          </div>
        )}

        {/* Loading Indicator */}
        {(loading || localLoading) && (
          <div className="mb-4 p-4 bg-blue-100 text-blue-700 rounded-lg text-center">
            Loading...
          </div>
        )}

        {/* Verification Status Banner */}
        {educationRecord && (
          <div className={`mb-6 p-4 rounded-lg border-2 ${
            educationRecord.tutor_verification_status
              ? 'bg-green-50 border-green-300'
              : 'bg-yellow-50 border-yellow-300'
          }`}>
            <div className="flex items-center gap-3">
              {educationRecord.tutor_verification_status ? (
                <>
                  <FaCheckCircle className="text-green-600 text-2xl" />
                  <div>
                    <p className="font-semibold text-green-800">✅ Verified by Tutor</p>
                    <p className="text-sm text-green-600">Your education details have been approved</p>
                    {educationRecord.comments && (
                      <p className="text-xs text-green-700 mt-1">Comments: {educationRecord.comments}</p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <FaExclamationTriangle className="text-yellow-600 text-2xl" />
                  <div>
                    <p className="font-semibold text-yellow-800">⏳ Pending Verification</p>
                    <p className="text-sm text-yellow-600">Waiting for tutor approval</p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {[
            { id: 'education', label: 'Education Details', icon: FaGraduationCap },
            { id: 'gpa', label: 'GPA Analysis', icon: FaChartBar },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition whitespace-nowrap ${
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

        {/* Education Details Tab - EDITABLE */}
        {activeTab === 'education' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-lg p-6"
          >
            <form onSubmit={handleSubmit}>
              {/* 10th Standard */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">
                  10th Standard Education
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-1">School Name *</label>
                    <input
                      type="text"
                      name="tenth_school_name"
                      value={formData.tenth_school_name}
                      onChange={handleInputChange}
                      required
                      className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter school name"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-1">Board *</label>
                    <input
                      type="text"
                      name="tenth_board"
                      value={formData.tenth_board}
                      onChange={handleInputChange}
                      required
                      className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., CBSE, State Board"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-1">Percentage *</label>
                    <input
                      type="number"
                      step="0.01"
                      name="tenth_percentage"
                      value={formData.tenth_percentage}
                      onChange={handleInputChange}
                      required
                      className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0-100"
                      min="0"
                      max="100"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-1">Year of Passing *</label>
                    <input
                      type="number"
                      name="tenth_year_of_passing"
                      value={formData.tenth_year_of_passing}
                      onChange={handleInputChange}
                      required
                      className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 2019"
                      min="1950"
                      max={new Date().getFullYear()}
                    />
                  </div>
                </div>
              </div>

              {/* 12th Standard */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">
                  12th Standard Education
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-1">School Name *</label>
                    <input
                      type="text"
                      name="twelfth_school_name"
                      value={formData.twelfth_school_name}
                      onChange={handleInputChange}
                      required
                      className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter school name"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-1">Board *</label>
                    <input
                      type="text"
                      name="twelfth_board"
                      value={formData.twelfth_board}
                      onChange={handleInputChange}
                      required
                      className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., CBSE, State Board"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-1">Percentage *</label>
                    <input
                      type="number"
                      step="0.01"
                      name="twelfth_percentage"
                      value={formData.twelfth_percentage}
                      onChange={handleInputChange}
                      required
                      className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0-100"
                      min="0"
                      max="100"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-1">Year of Passing *</label>
                    <input
                      type="number"
                      name="twelfth_year_of_passing"
                      value={formData.twelfth_year_of_passing}
                      onChange={handleInputChange}
                      required
                      className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 2021"
                      min="1950"
                      max={new Date().getFullYear()}
                    />
                  </div>
                </div>
              </div>

              {/* Degree Education */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">
                  Degree Education
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-1">Institution Name *</label>
                    <input
                      type="text"
                      name="degree_institution_name"
                      value={formData.degree_institution_name}
                      onChange={handleInputChange}
                      required
                      className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="College/University Name"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-1">Degree Name *</label>
                    <input
                      type="text"
                      name="degree_name"
                      value={formData.degree_name}
                      onChange={handleInputChange}
                      required
                      className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., B.Tech, B.E."
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-1">Specialization *</label>
                    <input
                      type="text"
                      name="degree_specialization"
                      value={formData.degree_specialization}
                      onChange={handleInputChange}
                      required
                      className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., CSE, ECE, ME"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg shadow-md hover:shadow-lg transition text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading || localLoading}
                >
                  {localLoading ? "Saving..." : "Submit for Approval"}
                </motion.button>
              </div>
            </form>
          </motion.div>
        )}

        {/* GPA Analysis Tab - READ ONLY */}
        {activeTab === 'gpa' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {!averages || !averages.cgpa || averages.cgpa === "N/A" ? (
              <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                <FaExclamationTriangle className="text-yellow-600 text-6xl mx-auto mb-4" />
                <p className="text-xl text-gray-600 mb-2">No GPA Data Available</p>
                <p className="text-gray-500">Your semester GPA and CGPA will be updated by your tutor</p>
              </div>
            ) : (
              <>
                {/* Overall Performance */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <FaChartBar className="text-blue-600" /> Overall Performance
                  </h3>
                  <div className={`p-6 rounded-lg border-2 ${getCGPABgColor(averages.cgpa)}`}>
                    <p className="text-sm text-gray-600 mb-2">Cumulative GPA (CGPA)</p>
                    <p className={`text-6xl font-bold ${getCGPAColor(averages.cgpa)}`}>
                      {parseFloat(averages.cgpa).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">Out of 10.0</p>
                  </div>
                </div>

                {/* Semester Breakdown */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Semester-wise Performance</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(averages.semesterBreakdown).map(([sem, gpa]) => (
                      <div key={sem} className={`p-4 rounded-lg border-2 ${getCGPABgColor(gpa)}`}>
                        <p className="text-sm text-gray-600 mb-1 capitalize">
                          {sem.replace('_', ' ').replace('semester', 'Sem')}
                        </p>
                        <p className={`text-3xl font-bold ${getCGPAColor(gpa)}`}>
                          {gpa !== "N/A" ? parseFloat(gpa).toFixed(2) : "N/A"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Performance Indicators */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Performance Analysis</h3>
                  <div className="space-y-3">
                    {parseFloat(averages.cgpa) >= 9 && (
                      <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border-2 border-green-300">
                        <FaCheckCircle className="text-green-600 text-3xl flex-shrink-0" />
                        <div>
                          <p className="font-bold text-green-800 text-lg">Excellent Performance! 🎉</p>
                          <p className="text-sm text-green-600">CGPA ≥ 9.0 - Outstanding academic achievement</p>
                        </div>
                      </div>
                    )}
                    {parseFloat(averages.cgpa) >= 8 && parseFloat(averages.cgpa) < 9 && (
                      <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border-2 border-blue-300">
                        <FaCheckCircle className="text-blue-600 text-3xl flex-shrink-0" />
                        <div>
                          <p className="font-bold text-blue-800 text-lg">Very Good Performance! 👏</p>
                          <p className="text-sm text-blue-600">CGPA 8.0-8.9 - Strong academic record</p>
                        </div>
                      </div>
                    )}
                    {parseFloat(averages.cgpa) >= 7 && parseFloat(averages.cgpa) < 8 && (
                      <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg border-2 border-yellow-300">
                        <FaCheckCircle className="text-yellow-600 text-3xl flex-shrink-0" />
                        <div>
                          <p className="font-bold text-yellow-800 text-lg">Good Performance! 👍</p>
                          <p className="text-sm text-yellow-600">CGPA 7.0-7.9 - Keep up the good work</p>
                        </div>
                      </div>
                    )}
                    {parseFloat(averages.cgpa) >= 6 && parseFloat(averages.cgpa) < 7 && (
                      <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg border-2 border-orange-300">
                        <FaExclamationTriangle className="text-orange-600 text-3xl flex-shrink-0" />
                        <div>
                          <p className="font-bold text-orange-800 text-lg">Average Performance</p>
                          <p className="text-sm text-orange-600">CGPA 6.0-6.9 - Room for improvement</p>
                        </div>
                      </div>
                    )}
                    {parseFloat(averages.cgpa) < 6 && parseFloat(averages.cgpa) > 0 && (
                      <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg border-2 border-red-300">
                        <FaExclamationTriangle className="text-red-600 text-3xl flex-shrink-0" />
                        <div>
                          <p className="font-bold text-red-800 text-lg">Needs Improvement ⚠️</p>
                          <p className="text-sm text-red-600">CGPA &lt; 6.0 - Focus on improving grades</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Color Legend */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Performance Scale</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div className="p-3 bg-green-50 border-2 border-green-300 rounded-lg text-center">
                      <p className="text-green-600 font-bold">9.0 - 10.0</p>
                      <p className="text-xs text-gray-600 mt-1">Excellent</p>
                    </div>
                    <div className="p-3 bg-blue-50 border-2 border-blue-300 rounded-lg text-center">
                      <p className="text-blue-600 font-bold">8.0 - 8.9</p>
                      <p className="text-xs text-gray-600 mt-1">Very Good</p>
                    </div>
                    <div className="p-3 bg-yellow-50 border-2 border-yellow-300 rounded-lg text-center">
                      <p className="text-yellow-600 font-bold">7.0 - 7.9</p>
                      <p className="text-xs text-gray-600 mt-1">Good</p>
                    </div>
                    <div className="p-3 bg-orange-50 border-2 border-orange-300 rounded-lg text-center">
                      <p className="text-orange-600 font-bold">6.0 - 6.9</p>
                      <p className="text-xs text-gray-600 mt-1">Average</p>
                    </div>
                    <div className="p-3 bg-red-50 border-2 border-red-300 rounded-lg text-center">
                      <p className="text-red-600 font-bold">&lt; 6.0</p>
                      <p className="text-xs text-gray-600 mt-1">Poor</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default StudentEducationPage;