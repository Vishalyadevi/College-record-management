import React, { useState, useEffect } from "react";
import { FaGraduationCap, FaChartBar, FaExclamationTriangle, FaCheckCircle } from "react-icons/fa";
import { motion } from "framer-motion";
import { useStudentEducation } from "../../contexts/StudentEducationContext";

const StudentEducation = () => {
  const {
    educationRecord,
    averages,
    arrearsInfo,
    loading,
    error,
    addOrUpdateEducation,
    fetchEducationRecord,
    fetchAverages,
    fetchArrearsInfo,
    clearError
  } = useStudentEducation();

  const [activeTab, setActiveTab] = useState('education');
  const [localLoading, setLocalLoading] = useState(false);
  const userId = localStorage.getItem("userId");

  // Form State
  const [formData, setFormData] = useState({
    // 10th Standard
    tenth_school_name: "",
    tenth_board: "",
    tenth_percentage: "",
    tenth_year_of_passing: "",
    // 12th Standard
    twelfth_school_name: "",
    twelfth_board: "",
    twelfth_percentage: "",
    twelfth_year_of_passing: "",
    // Degree
    degree_institution_name: "",
    degree_name: "",
    degree_specialization: "",
    // Semester GPA
    semester_1_gpa: "",
    semester_2_gpa: "",
    semester_3_gpa: "",
    semester_4_gpa: "",
    semester_5_gpa: "",
    semester_6_gpa: "",
    semester_7_gpa: "",
    semester_8_gpa: "",
    // Overall
    gpa: "",
    cgpa: "",
    // Arrears
    has_arrears_history: false,
    arrears_history_count: 0,
    has_standing_arrears: false,
    standing_arrears_count: 0,
  });

  useEffect(() => {
    if (userId) {
      fetchEducationRecord(userId);
      fetchAverages(userId);
      fetchArrearsInfo(userId);
    }
  }, [userId]);

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
        semester_1_gpa: educationRecord.semester_1_gpa || "",
        semester_2_gpa: educationRecord.semester_2_gpa || "",
        semester_3_gpa: educationRecord.semester_3_gpa || "",
        semester_4_gpa: educationRecord.semester_4_gpa || "",
        semester_5_gpa: educationRecord.semester_5_gpa || "",
        semester_6_gpa: educationRecord.semester_6_gpa || "",
        semester_7_gpa: educationRecord.semester_7_gpa || "",
        semester_8_gpa: educationRecord.semester_8_gpa || "",
        gpa: educationRecord.gpa || "",
        cgpa: educationRecord.cgpa || "",
        has_arrears_history: educationRecord.has_arrears_history || false,
        arrears_history_count: educationRecord.arrears_history_count || 0,
        has_standing_arrears: educationRecord.has_standing_arrears || false,
        standing_arrears_count: educationRecord.standing_arrears_count || 0,
      });
    }
  }, [educationRecord]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    setLocalLoading(true);

    try {
      const educationData = {
        Userid: parseInt(userId),
        ...formData,
        tenth_percentage: formData.tenth_percentage ? parseFloat(formData.tenth_percentage) : null,
        tenth_year_of_passing: formData.tenth_year_of_passing ? parseInt(formData.tenth_year_of_passing) : null,
        twelfth_percentage: formData.twelfth_percentage ? parseFloat(formData.twelfth_percentage) : null,
        twelfth_year_of_passing: formData.twelfth_year_of_passing ? parseInt(formData.twelfth_year_of_passing) : null,
        semester_1_gpa: formData.semester_1_gpa ? parseFloat(formData.semester_1_gpa) : null,
        semester_2_gpa: formData.semester_2_gpa ? parseFloat(formData.semester_2_gpa) : null,
        semester_3_gpa: formData.semester_3_gpa ? parseFloat(formData.semester_3_gpa) : null,
        semester_4_gpa: formData.semester_4_gpa ? parseFloat(formData.semester_4_gpa) : null,
        semester_5_gpa: formData.semester_5_gpa ? parseFloat(formData.semester_5_gpa) : null,
        semester_6_gpa: formData.semester_6_gpa ? parseFloat(formData.semester_6_gpa) : null,
        semester_7_gpa: formData.semester_7_gpa ? parseFloat(formData.semester_7_gpa) : null,
        semester_8_gpa: formData.semester_8_gpa ? parseFloat(formData.semester_8_gpa) : null,
        gpa: formData.gpa ? parseFloat(formData.gpa) : null,
        cgpa: formData.cgpa ? parseFloat(formData.cgpa) : null,
        arrears_history_count: formData.has_arrears_history ? parseInt(formData.arrears_history_count) : 0,
        standing_arrears_count: formData.has_standing_arrears ? parseInt(formData.standing_arrears_count) : 0,
      };

      await addOrUpdateEducation(educationData);
      await fetchEducationRecord(userId);
      await fetchAverages(userId);
      await fetchArrearsInfo(userId);
    } catch (err) {
      console.error("Error saving education record:", err);
    } finally {
      setLocalLoading(false);
    }
  };

  const getCGPAColor = (cgpa) => {
    if (!cgpa) return "text-gray-500";
    if (cgpa >= 9) return "text-green-600";
    if (cgpa >= 8) return "text-blue-600";
    if (cgpa >= 7) return "text-yellow-600";
    if (cgpa >= 6) return "text-orange-600";
    return "text-red-600";
  };

  return (
    <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow-md w-full min-h-screen">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        Education Records
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
          { id: 'education', label: 'Education Details', icon: FaGraduationCap },
          { id: 'averages', label: 'GPA Analysis', icon: FaChartBar },
          { id: 'arrears', label: 'Arrears Info', icon: FaExclamationTriangle },
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

      {/* Education Details Tab */}
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
                  <label className="block text-gray-700 font-medium mb-1">School Name</label>
                  <input
                    type="text"
                    name="tenth_school_name"
                    value={formData.tenth_school_name}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="School Name"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Board</label>
                  <input
                    type="text"
                    name="tenth_board"
                    value={formData.tenth_board}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., CBSE, State Board"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Percentage</label>
                  <input
                    type="number"
                    step="0.01"
                    name="tenth_percentage"
                    value={formData.tenth_percentage}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0-100"
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Year of Passing</label>
                  <input
                    type="number"
                    name="tenth_year_of_passing"
                    value={formData.tenth_year_of_passing}
                    onChange={handleInputChange}
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
                  <label className="block text-gray-700 font-medium mb-1">School Name</label>
                  <input
                    type="text"
                    name="twelfth_school_name"
                    value={formData.twelfth_school_name}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="School Name"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Board</label>
                  <input
                    type="text"
                    name="twelfth_board"
                    value={formData.twelfth_board}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., CBSE, State Board"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Percentage</label>
                  <input
                    type="number"
                    step="0.01"
                    name="twelfth_percentage"
                    value={formData.twelfth_percentage}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0-100"
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Year of Passing</label>
                  <input
                    type="number"
                    name="twelfth_year_of_passing"
                    value={formData.twelfth_year_of_passing}
                    onChange={handleInputChange}
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
                  <label className="block text-gray-700 font-medium mb-1">Institution Name</label>
                  <input
                    type="text"
                    name="degree_institution_name"
                    value={formData.degree_institution_name}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="College/University Name"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Degree Name</label>
                  <input
                    type="text"
                    name="degree_name"
                    value={formData.degree_name}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., B.Tech, B.E."
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Specialization</label>
                  <input
                    type="text"
                    name="degree_specialization"
                    value={formData.degree_specialization}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., CSE, ECE, ME"
                  />
                </div>
              </div>
            </div>

            {/* Semester GPA */}
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">
                Semester-wise GPA
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                  <div key={sem}>
                    <label className="block text-gray-700 font-medium mb-1">Semester {sem}</label>
                    <input
                      type="number"
                      step="0.01"
                      name={`semester_${sem}_gpa`}
                      value={formData[`semester_${sem}_gpa`]}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0-10"
                      min="0"
                      max="10"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Overall GPA */}
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">
                Overall Performance
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">GPA</label>
                  <input
                    type="number"
                    step="0.01"
                    name="gpa"
                    value={formData.gpa}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0-10"
                    min="0"
                    max="10"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">CGPA</label>
                  <input
                    type="number"
                    step="0.01"
                    name="cgpa"
                    value={formData.cgpa}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0-10"
                    min="0"
                    max="10"
                  />
                </div>
              </div>
            </div>

            {/* Arrears Information */}
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">
                Arrears Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      name="has_arrears_history"
                      checked={formData.has_arrears_history}
                      onChange={handleInputChange}
                      className="w-5 h-5"
                    />
                    <label className="text-gray-700 font-medium">Has Arrears History</label>
                  </div>
                  {formData.has_arrears_history && (
                    <div>
                      <label className="block text-gray-700 font-medium mb-1">History Count</label>
                      <input
                        type="number"
                        name="arrears_history_count"
                        value={formData.arrears_history_count}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      name="has_standing_arrears"
                      checked={formData.has_standing_arrears}
                      onChange={handleInputChange}
                      className="w-5 h-5"
                    />
                    <label className="text-gray-700 font-medium">Has Standing Arrears</label>
                  </div>
                  {formData.has_standing_arrears && (
                    <div>
                      <label className="block text-gray-700 font-medium mb-1">Standing Count</label>
                      <input
                        type="number"
                        name="standing_arrears_count"
                        value={formData.standing_arrears_count}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg shadow-md hover:shadow-lg transition text-lg font-semibold"
                disabled={loading || localLoading}
              >
                {localLoading ? "Saving..." : "Save Education Record"}
              </motion.button>
            </div>
          </form>
        </motion.div>
      )}

      {/* GPA Analysis Tab */}
      {activeTab === 'averages' && averages && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FaChartBar className="text-blue-600" /> Overall Performance
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">CGPA</p>
                <p className={`text-4xl font-bold ${getCGPAColor(parseFloat(averages.cgpa))}`}>
                  {averages.cgpa}
                </p>
                <p className="text-xs text-gray-500 mt-2">Cumulative Grade Point Average</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Semester-wise Breakdown</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(averages.semesterBreakdown).map(([sem, gpa]) => (
                <div key={sem} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600 mb-1 capitalize">{sem.replace('_', ' ')}</p>
                  <p className={`text-2xl font-bold ${getCGPAColor(parseFloat(gpa))}`}>
                    {gpa !== "N/A" ? parseFloat(gpa).toFixed(2) : "N/A"}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Performance Indicators</h3>
            <div className="space-y-3">
              {parseFloat(averages.cgpa) >= 9 && (
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <FaCheckCircle className="text-green-600 text-2xl" />
                  <div>
                    <p className="font-semibold text-green-800">Excellent Performance</p>
                    <p className="text-sm text-green-600">CGPA above 9.0 - Outstanding academic achievement!</p>
                  </div>
                </div>
              )}
              {parseFloat(averages.cgpa) >= 8 && parseFloat(averages.cgpa) < 9 && (
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <FaCheckCircle className="text-blue-600 text-2xl" />
                  <div>
                    <p className="font-semibold text-blue-800">Very Good Performance</p>
                    <p className="text-sm text-blue-600">CGPA between 8.0-9.0 - Strong academic record!</p>
                  </div>
                </div>
              )}
              {parseFloat(averages.cgpa) >= 7 && parseFloat(averages.cgpa) < 8 && (
                <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                  <FaCheckCircle className="text-yellow-600 text-2xl" />
                  <div>
                    <p className="font-semibold text-yellow-800">Good Performance</p>
                    <p className="text-sm text-yellow-600">CGPA between 7.0-8.0 - Keep up the good work!</p>
                  </div>
                </div>
              )}
              {parseFloat(averages.cgpa) < 7 && parseFloat(averages.cgpa) > 0 && (
                <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                  <FaExclamationTriangle className="text-orange-600 text-2xl" />
                  <div>
                    <p className="font-semibold text-orange-800">Room for Improvement</p>
                    <p className="text-sm text-orange-600">Focus on improving your grades in upcoming semesters.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Arrears Info Tab */}
      {activeTab === 'arrears' && arrearsInfo && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FaExclamationTriangle className="text-orange-600" /> Arrears Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Arrears History */}
              <div className={`p-6 rounded-lg border-2 ${
                arrearsInfo.history.hasHistory 
                  ? 'bg-yellow-50 border-yellow-300' 
                  : 'bg-green-50 border-green-300'
              }`}>
                <div className="flex items-center gap-3 mb-3">
                  {arrearsInfo.history.hasHistory ? (
                    <FaExclamationTriangle className="text-yellow-600 text-2xl" />
                  ) : (
                    <FaCheckCircle className="text-green-600 text-2xl" />
                  )}
                  <h4 className="text-lg font-semibold text-gray-800">Arrears History</h4>
                </div>
                {arrearsInfo.history.hasHistory ? (
                  <div>
                    <p className="text-3xl font-bold text-yellow-700 mb-2">
                      {arrearsInfo.history.count}
                    </p>
                    <p className="text-sm text-gray-600">Total historical arrears</p>
                    {arrearsInfo.history.details && arrearsInfo.history.details.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <p className="text-sm font-semibold text-gray-700">Details:</p>
                        {arrearsInfo.history.details.map((detail, index) => (
                          <div key={index} className="text-sm text-gray-600 bg-white p-2 rounded">
                            {JSON.stringify(detail)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <p className="text-2xl font-bold text-green-700 mb-2">No History</p>
                    <p className="text-sm text-gray-600">Clean academic record!</p>
                  </div>
                )}
              </div>

              {/* Standing Arrears */}
              <div className={`p-6 rounded-lg border-2 ${
                arrearsInfo.standing.hasStanding 
                  ? 'bg-red-50 border-red-300' 
                  : 'bg-green-50 border-green-300'
              }`}>
                <div className="flex items-center gap-3 mb-3">
                  {arrearsInfo.standing.hasStanding ? (
                    <FaExclamationTriangle className="text-red-600 text-2xl" />
                  ) : (
                    <FaCheckCircle className="text-green-600 text-2xl" />
                  )}
                  <h4 className="text-lg font-semibold text-gray-800">Standing Arrears</h4>
                </div>
                {arrearsInfo.standing.hasStanding ? (
                  <div>
                    <p className="text-3xl font-bold text-red-700 mb-2">
                      {arrearsInfo.standing.count}
                    </p>
                    <p className="text-sm text-gray-600">Current pending arrears</p>
                    {arrearsInfo.standing.subjects && arrearsInfo.standing.subjects.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <p className="text-sm font-semibold text-gray-700">Subjects:</p>
                        {arrearsInfo.standing.subjects.map((subject, index) => (
                          <div key={index} className="text-sm text-gray-600 bg-white p-2 rounded">
                            {JSON.stringify(subject)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <p className="text-2xl font-bold text-green-700 mb-2">No Arrears</p>
                    <p className="text-sm text-gray-600">All subjects cleared!</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Overall Status */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Academic Status</h3>
            {!arrearsInfo.history.hasHistory && !arrearsInfo.standing.hasStanding ? (
              <div className="p-6 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                <div className="flex items-center gap-4">
                  <FaCheckCircle className="text-green-600 text-4xl" />
                  <div>
                    <p className="text-xl font-bold text-green-800 mb-1">Excellent Academic Standing</p>
                    <p className="text-gray-600">
                      No arrears history or standing arrears. Keep up the great work!
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg">
                <div className="flex items-center gap-4">
                  <FaExclamationTriangle className="text-orange-600 text-4xl" />
                  <div>
                    <p className="text-xl font-bold text-orange-800 mb-1">Action Required</p>
                    <p className="text-gray-600">
                      {arrearsInfo.standing.hasStanding && "Clear your standing arrears as soon as possible. "}
                      {arrearsInfo.history.hasHistory && "Work on maintaining a clean record going forward."}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default StudentEducation;