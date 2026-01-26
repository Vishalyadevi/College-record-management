import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { FaEye, FaDownload, FaCheckSquare, FaSquare } from "react-icons/fa";

const ResumeGenerator = () => {
  const [selectedSections, setSelectedSections] = useState({
    "Student Details": true, // Always included
    "Events Attended": true,
    "Events Organized": false,
    "Online Courses": true,
    "Achievements": true,
    "Internships": true,
    "Scholarships": true,
    "Hackathon Event Details": true,
    "Extracurricular Details": true,
    "Project Details": true,
    "Competency Coding Details": true,
    "Student Publication Details": false,
    "Student Non-CGPA Details": true,
  });

  const [studentData, setStudentData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = user?.Userid;

  // Fetch all approved student data
  useEffect(() => {
    const fetchAllData = async () => {
      if (!userId) {
        setError("User not logged in");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        const endpoints = {
          "Student Details": `/api/student-details/${userId}`,
          "Events Attended": `/api/events-attended/approved/${userId}`,
          "Events Organized": `/api/events-organized/approved/${userId}`,
          "Online Courses": `/api/online-courses/approved/${userId}`,
          "Achievements": `/api/achievements/approved/${userId}`,
          "Internships": `/api/internships/approved/${userId}`,
          "Scholarships": `/api/scholarships/approved/${userId}`,
          "Hackathon Event Details": `/api/hackathon/my-events/approved/${userId}`,
          "Extracurricular Details": `/api/extracurricular/approved/${userId}`,
          "Project Details": `/api/projects/approved/${userId}`,
          "Competency Coding Details": `/api/competency-coding/${userId}`,
          "Student Publication Details": `/api/publications/approved/${userId}`,
          "Student Non-CGPA Details": `/api/noncgpa/approved/${userId}`,
        };

        const requests = Object.entries(endpoints).map(async ([key, url]) => {
          try {
            const res = await axios.get(url, { headers });
            return [key, res.data.data || res.data.events || res.data || []];
          } catch (err) {
            console.warn(`Failed to load ${key}:`, err.response?.data || err.message);
            return [key, []];
          }
        });

        const results = await Promise.all(requests);
        const dataObj = Object.fromEntries(results);

        // Add basic user info
        dataObj.userInfo = {
          name: user.username,
          email: user.email,
          department: user.department || "N/A",
          regno: user.regno || "N/A",
        };

        setStudentData(dataObj);
      } catch (err) {
        setError("Failed to load resume data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [userId]);

  const toggleSection = (section) => {
    if (section === "Student Details") return; // Always included
    setSelectedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const generatePDF = (isPreview = false) => {
    const doc = new jsPDF();
    let yPos = 20;

    const { userInfo } = studentData;

    // Header
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text(userInfo?.name || "Student Name", 105, yPos, { align: "center" });
    yPos += 8;
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`${userInfo?.regno || ""} | ${userInfo?.email || ""}`, 105, yPos, { align: "center" });
    yPos += 8;
    doc.text(userInfo?.department || "", 105, yPos, { align: "center" });
    yPos += 15;

    // Sections
    const sectionsOrder = Object.keys(selectedSections).filter(
      (key) => selectedSections[key]
    );

    sectionsOrder.forEach((sectionKey) => {
      const data = studentData[sectionKey] || [];
      if (!Array.isArray(data) || data.length === 0) return;

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(sectionKey, 14, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");

      if (sectionKey === "Student Details" && data.length > 0) {
        const sd = data[0];
        const details = [
          ["Register Number", sd.regno || "-"],
          ["Batch", sd.batch || "-"],
          ["Phone", sd.phone || "-"],
          ["Email", userInfo.email],
          ["Address", `${sd.city || ""}, ${sd.state || ""}`],
        ];
        doc.autoTable({
          startY: yPos,
          head: [["Field", "Details"]],
          body: details,
          theme: "grid",
          styles: { fontSize: 10 },
        });
        yPos = doc.lastAutoTable.finalY + 10;
      } else {
        // Generic table for other sections
        const headers = Object.keys(data[0]).filter(
          (k) =>
            ![
              "id",
              "userid",
              "Userid",
              "pending",
              "tutor_approval_status",
              "created_by",
              "updated_by",
              "created_at",
              "updated_at",
              "approved_by",
              "approved_at",
              "messages",
              "comments",
              "student_name",
              "department",
            ].includes(k)
        );

        const rows = data.map((item) =>
          headers.map((h) => {
            let val = item[h] || "-";
            if (h.includes("date") && val) {
              val = new Date(val).toLocaleDateString("en-IN");
            }
            return String(val).substring(0, 80);
          })
        );

        doc.autoTable({
          startY: yPos,
          head: [headers.map((h) => h.replace(/_/g, " ").toUpperCase())],
          body: rows,
          theme: "striped",
          styles: { fontSize: 9, cellPadding: 3 },
          headStyles: { fillColor: [59, 130, 246] },
        });
        yPos = doc.lastAutoTable.finalY + 15;
      }

      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
    });

    if (isPreview) {
      setPreviewMode(doc.output("bloburl"));
    } else {
      doc.save(`${userInfo?.name.replace(" ", "_")}_Resume.pdf`);
    }
  };

  if (loading) return <div className="text-center p-10">Loading your data...</div>;
  if (error) return <div className="text-red-600 text-center p-10">{error}</div>;

  return (
    <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 min-h-screen">
      <h1 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        Resume Generator
      </h1>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto bg-white rounded-xl shadow-xl p-8"
      >
        <h2 className="text-2xl font-semibold mb-6">Select Sections for Resume</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {Object.keys(selectedSections).map((section) => (
            <label
              key={section}
              className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition"
            >
              <button
                type="button"
                onClick={() => toggleSection(section)}
                disabled={section === "Student Details"}
              >
                {selectedSections[section] ? (
                  <FaCheckSquare className="text-blue-600 text-2xl" />
                ) : (
                  <FaSquare className="text-gray-400 text-2xl" />
                )}
              </button>
              <span className="font-medium">{section}</span>
              {section === "Student Details" && (
                <span className="ml-auto text-sm text-gray-500">(Required)</span>
              )}
            </label>
          ))}
        </div>

        <div className="flex justify-center space-x-6">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => generatePDF(true)}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg shadow-lg flex items-center space-x-3 text-lg"
          >
            <FaEye />
            <span>Preview PDF</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => generatePDF(false)}
            className="px-8 py-4 bg-green-600 text-white rounded-lg shadow-lg flex items-center space-x-3 text-lg"
          >
            <FaDownload />
            <span>Generate & Download PDF</span>
          </motion.button>
        </div>
      </motion.div>

      {/* PDF Preview Modal */}
      {previewMode && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewMode(false)}
        >
          <div className="bg-white rounded-lg max-w-5xl w-full h-[90vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold">Resume Preview</h3>
              <button
                onClick={() => setPreviewMode(false)}
                className="text-3xl text-gray-600 hover:text-gray-900"
              >
                ×
              </button>
            </div>
            <iframe src={previewMode} className="flex-1 w-full" title="Resume Preview" />
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeGenerator;