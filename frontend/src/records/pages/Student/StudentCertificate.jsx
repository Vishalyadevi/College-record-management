import React, { useState } from "react";
import { FaChevronLeft, FaChevronRight, FaPlus, FaEye, FaUpload, FaGraduationCap, FaIdCard, FaTrophy } from "react-icons/fa";
import { motion } from "framer-motion";

const StudentCertificate = () => {
  const [activeTab, setActiveTab] = useState("academic");

  // State for file uploads in each category
  const [academicFiles, setAcademicFiles] = useState([]);
  const [personalFiles, setPersonalFiles] = useState([]);
  const [extracurricularFiles, setExtracurricularFiles] = useState([]);

  // Define certificate categories
  const certificateCategories = {
    academic: [
      "Marksheets",
      "Degree Certificate",
      "Transfer Certificate (TC)",
      "Course Completion Certificate",
      "Internship Certificate",
    ],
    personal: [
      "Aadhar Card / National ID",
      "Birth Certificate",
      "Passport",
      "Driving License",
      "Voter ID",
    ],
    extracurricular: [
      "Online Course Certificates",
      "Hackathon Participation",
      "Sports Certificates",
      "Cultural Event Certificates",
      "Language Proficiency Certificates",
    ],
  };

  // Handle file change for each tab
  const handleFileChange = (e, category) => {
    const files = Array.from(e.target.files);
    if (category === "academic") {
      setAcademicFiles(files);
    } else if (category === "personal") {
      setPersonalFiles(files);
    } else if (category === "extracurricular") {
      setExtracurricularFiles(files);
    }
  };

  return (
    <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow-md w-full min-h-screen">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        Student Certificates
      </h2>

      {/* Tab Navigation */}
      <div className="flex justify-center space-x-6 mb-6">
        {["academic", "personal", "extracurricular"].map((category) => (
          <motion.button
            key={category}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab(category)}
            className={`px-6 py-3 rounded text-lg font-medium transition ${
              activeTab === category
                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            <div className="flex items-center space-x-2">
              {category === "academic" && <FaGraduationCap className="inline-block" />}
              {category === "personal" && <FaIdCard className="inline-block" />}
              {category === "extracurricular" && <FaTrophy className="inline-block" />}
              <span>
                {category === "academic" && "Academic"}
                {category === "personal" && "Personal ID"}
                {category === "extracurricular" && "Extra-Curricular"}
              </span>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Tab Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full p-6 bg-white rounded-lg shadow-lg"
      >
        <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center space-x-2">
          {activeTab === "academic" && <FaGraduationCap className="inline-block" />}
          {activeTab === "personal" && <FaIdCard className="inline-block" />}
          {activeTab === "extracurricular" && <FaTrophy className="inline-block" />}
          <span>
            {activeTab === "academic" && "Academic Certificates"}
            {activeTab === "personal" && "Personal Identification"}
            {activeTab === "extracurricular" && "Extra-Curricular & Skills"}
          </span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {certificateCategories[activeTab].map((cert, index) => (
            <div
              key={index}
              className="bg-gray-50 p-4 rounded-lg shadow-sm flex flex-col space-y-4"
            >
              <span className="text-gray-700 font-medium">{cert}</span>
              <label className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-100 text-blue-600 rounded-lg cursor-pointer hover:bg-blue-200 transition">
                <FaUpload className="inline-block" />
                <span>Upload File</span>
                <input
                  type="file"
                  onChange={(e) => handleFileChange(e, activeTab)}
                  multiple
                  className="hidden"
                />
              </label>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Display uploaded files */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full p-6 bg-white rounded-lg shadow-lg mt-6"
      >
        <h4 className="text-xl font-semibold text-gray-800 mb-4">Uploaded Files:</h4>
        {activeTab === "academic" && academicFiles.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <tr>
                  <th className="border border-gray-300 p-3 text-left">File Name</th>
                  <th className="border border-gray-300 p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {academicFiles.map((file, idx) => (
                  <tr key={idx} className="bg-white hover:bg-gray-50 transition">
                    <td className="border border-gray-300 p-3">{file.name}</td>
                    <td className="border border-gray-300 p-3">
                      <button className="text-blue-500 hover:text-blue-700 transition">
                        <FaEye className="inline-block text-xl" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {activeTab === "personal" && personalFiles.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <tr>
                  <th className="border border-gray-300 p-3 text-left">File Name</th>
                  <th className="border border-gray-300 p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {personalFiles.map((file, idx) => (
                  <tr key={idx} className="bg-white hover:bg-gray-50 transition">
                    <td className="border border-gray-300 p-3">{file.name}</td>
                    <td className="border border-gray-300 p-3">
                      <button className="text-blue-500 hover:text-blue-700 transition">
                        <FaEye className="inline-block text-xl" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {activeTab === "extracurricular" && extracurricularFiles.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <tr>
                  <th className="border border-gray-300 p-3 text-left">File Name</th>
                  <th className="border border-gray-300 p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {extracurricularFiles.map((file, idx) => (
                  <tr key={idx} className="bg-white hover:bg-gray-50 transition">
                    <td className="border border-gray-300 p-3">{file.name}</td>
                    <td className="border border-gray-300 p-3">
                      <button className="text-blue-500 hover:text-blue-700 transition">
                        <FaEye className="inline-block text-xl" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {(activeTab === "academic" && academicFiles.length === 0) ||
        (activeTab === "personal" && personalFiles.length === 0) ||
        (activeTab === "extracurricular" && extracurricularFiles.length === 0) ? (
          <p className="text-gray-500">No files uploaded yet.</p>
        ) : null}
      </motion.div>
    </div>
  );
};

export default StudentCertificate;