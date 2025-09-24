import React, { useEffect, useState } from "react";
import axios from "axios";
import "../../styles/adminStudentsregistered.css";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import Navbar from './AdminNavbar';

// Set axios base URL
axios.defaults.baseURL = "http://localhost:4000";

// Debounce utility for search
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

const AdminRegisteredStudents = () => {
  const [registeredStudents, setRegisteredStudents] = useState([]);
  const [selectedRound, setSelectedRound] = useState("Round 1");
  const [selectedStudents, setSelectedStudents] = useState({});
  const [placementData, setPlacementData] = useState({});
  const [file, setFile] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    regno: "",
    name: "",
    college_email: "",
    personal_email: "",
    company_name: "",
    batch: "",
  });

  // Assume admin's Userid is stored in localStorage after login
  const createdBy = localStorage.getItem("userId") || "1"; // Fallback for testing

  useEffect(() => {
    fetchRegisteredStudents();
  }, []);

  const fetchRegisteredStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get("/api/placement/admin-registered-students");
      console.log('Fetched students:', response.data);
      setRegisteredStudents(response.data);
    } catch (error) {
      console.error("Error fetching registered students:", error);
      setError({
        message: error.response?.data?.message || "Failed to fetch students.",
        details: error.response?.data?.details,
        sqlMessage: error.response?.data?.sqlMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = (regno) => {
    setSelectedStudents((prev) => ({
      ...prev,
      [regno]: !prev[regno],
    }));
  };

  const handleRoundChange = (event) => {
    setSelectedRound(event.target.value);
  };

  const handlePostRounds = async () => {
    const shortlistedStudents = registeredStudents
      .filter((student) => selectedStudents[student.regno])
      .map((student) => ({
        regno: student.regno,
        name: student.name,
        company_name: student.company_name,
        cleared_round: selectedRound,
      }));

    console.log('Posting students:', shortlistedStudents);
    if (shortlistedStudents.length === 0) {
      alert("No students selected for posting.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      localStorage.setItem("studentStatus", JSON.stringify(shortlistedStudents));
      alert("Shortlisted students posted successfully!");
    } catch (error) {
      console.error("Error posting rounds:", error);
      setError({ message: "Failed to post rounds.", details: error.message });
    } finally {
      setLoading(false);
    }
  };

  const generateReport = () => {
    const shortlistedStudents = registeredStudents.filter((student) => selectedStudents[student.regno]);

    if (shortlistedStudents.length === 0) {
      alert("No students selected for the report.");
      return;
    }

    let csvContent = "Reg No,Name,College Email,Personal Email,Company Name,Batch\n";
    shortlistedStudents.forEach((student) => {
      csvContent += `${student.regno},${student.name},${student.college_email || ''},${student.personal_email || ''},${student.company_name},${student.batch}\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "Shortlisted_Students_Report.csv");
  };

  const sendEmails = async () => {
    const shortlistedStudents = registeredStudents.filter((student) => selectedStudents[student.regno]);

    if (shortlistedStudents.length === 0) {
      alert("No students selected for email.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await axios.post("/api/placement/send-emails", {
        students: shortlistedStudents,
        round: selectedRound,
      });
      alert("Emails sent successfully!");
    } catch (error) {
      console.error("Error sending emails:", error);
      setError({
        message: error.response?.data?.message || "Failed to send emails.",
        details: error.response?.data?.details,
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePlacedClick = (regno, name, company_name) => {
    setPlacementData({ regno, name, company_name, role: "", package: "", year: "" });
  };

  const handlePlacementInputChange = (e) => {
    const { name, value } = e.target;
    setPlacementData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePlacementSubmit = async () => {
    if (!placementData.role || !placementData.package || !placementData.year) {
      alert("Please enter Role, Package, and Year before submitting.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await axios.post("/api/placement/placed-students", {
        ...placementData,
        created_by: createdBy,
      });
      alert("Placement details submitted successfully!");
      setPlacementData({});
      fetchRegisteredStudents();
    } catch (error) {
      console.error("Error submitting placement details:", error);
      setError({
        message: error.response?.data?.message || "Failed to submit placement details.",
        details: error.response?.data?.details,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUnselectedStudents = async () => {
    const selectedUserIds = registeredStudents
      .filter((student) => selectedStudents[student.regno])
      .map((student) => student.Userid);

    if (selectedUserIds.length === 0) {
      alert("No students selected. Please select at least one student before deleting unselected ones.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await axios.delete("/api/placement/delete-unselected-students", {
        data: { selectedUserIds },
      });
      alert("Unselected students deleted successfully!");
      fetchRegisteredStudents();
    } catch (error) {
      console.error("Error deleting unselected students:", error);
      setError({
        message: error.response?.data?.message || "Failed to delete unselected students.",
        details: error.response?.data?.details,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile && ![".xlsx", ".xls"].includes(selectedFile.name.slice(-5))) {
      alert("Please select a valid Excel file (.xlsx or .xls).");
      return;
    }
    setFile(selectedFile);
  };

  const handleFileUpload = async () => {
    if (!file) {
      alert("Please select an Excel file before uploading.");
      return;
    }

    setLoading(true);
    setError(null);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        console.log('Parsed Excel data:', jsonData);

        if (!jsonData.length) {
          alert('No data found in the Excel file.');
          setLoading(false);
          return;
        }

        const response = await axios.post("/api/placement/import-placed-students", {
          students: jsonData,
          created_by: createdBy,
        });
        alert(response.data.message);
        fetchRegisteredStudents();
      } catch (error) {
        console.error("Error importing placement data:", error);
        setError({
          message: error.response?.data?.message || "Failed to import placement data.",
          details: error.response?.data?.errors?.join('; ') || error.response?.data?.details,
        });
      } finally {
        setLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFilterChange = debounce((e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  }, 300);

  const filteredStudents = registeredStudents.filter((student) => {
    return (
      (!filters.regno || student.regno?.toString().includes(filters.regno)) &&
      (!filters.name || student.name?.toLowerCase().includes(filters.name.toLowerCase())) &&
      (!filters.college_email || student.college_email?.toLowerCase().includes(filters.college_email.toLowerCase())) &&
      (!filters.personal_email || student.personal_email?.toLowerCase().includes(filters.personal_email.toLowerCase())) &&
      (!filters.company_name || student.company_name?.toLowerCase().includes(filters.company_name.toLowerCase())) &&
      (!filters.batch || student.batch?.toString().includes(filters.batch))
    );
  });

  return (
    <>
      <Navbar />
      <br></br>
      <br></br>
      <br></br>
      <div className="admin-dashboard">
        <h2>Registered Students</h2>
        {error && (
          <div className="error-message">
            {error.message}
            {error.details && <div className="error-details">Details: {error.details}</div>}
            {error.sqlMessage && process.env.NODE_ENV === 'development' && (
              <div className="error-details">SQL Error: {error.sqlMessage}</div>
            )}
          </div>
        )}
        {loading && <div className="loading">Loading...</div>}
        <button
          className="toggle-filter-btn"
          onClick={() => setShowFilters(!showFilters)}
          disabled={loading}
        >
          {showFilters ? "Hide Filters" : "Show Filters"}
        </button>
        {showFilters && (
          <div className="filter-container">
            <input
              type="text"
              name="regno"
              placeholder="Reg No"
              onChange={handleFilterChange}
              disabled={loading}
            />
            <input
              type="text"
              name="name"
              placeholder="Name"
              onChange={handleFilterChange}
              disabled={loading}
            />
            <input
              type="text"
              name="college_email"
              placeholder="College Email"
              onChange={handleFilterChange}
              disabled={loading}
            />
            <input
              type="text"
              name="personal_email"
              placeholder="Personal Email"
              onChange={handleFilterChange}
              disabled={loading}
            />
            <input
              type="text"
              name="company_name"
              placeholder="Company Name"
              onChange={handleFilterChange}
              disabled={loading}
            />
            <input
              type="text"
              name="batch"
              placeholder="Batch"
              onChange={handleFilterChange}
              disabled={loading}
            />
          </div>
        )}
        <div className="admin-controls">
          <label>Select Round: </label>
          <select value={selectedRound} onChange={handleRoundChange} disabled={loading}>
            <option>Round 1</option>
            <option>Round 2</option>
            <option>Round 3</option>
            <option>Round 4</option>
            <option>Round 5</option>
          </select>
          <button className="post-btn" onClick={handlePostRounds} disabled={loading}>
            Post
          </button>
          <button className="generate-report-btn" onClick={generateReport} disabled={loading}>
            Generate Report
          </button>
          <button className="sendmail-btn" onClick={sendEmails} disabled={loading}>
            Send Emails
          </button>
          <button className="delete-btn" onClick={handleDeleteUnselectedStudents} disabled={loading}>
            Delete
          </button>
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileChange}
            disabled={loading}
          />
          <button className="upload-btn" onClick={handleFileUpload} disabled={loading}>
            Upload Excel
          </button>
        </div>
        <table className="display-register-students">
          <thead>
            <tr>
              <th>Select</th>
              <th>Reg No</th>
              <th>Name</th>
              <th>College Email</th>
              <th>Personal Email</th>
              <th>Company</th>
              <th>Batch</th>
              <th>Placed</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student) => (
              <tr key={student.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedStudents[student.regno] || false}
                    onChange={() => handleCheckboxChange(student.regno)}
                    disabled={loading}
                  />
                </td>
                <td>{student.regno || 'N/A'}</td>
                <td>{student.name || 'N/A'}</td>
                <td>{student.college_email || 'N/A'}</td>
                <td>{student.personal_email || 'N/A'}</td>
                <td>{student.company_name || 'N/A'}</td>
                <td>{student.batch || 'N/A'}</td>
                <td>
                  {placementData.regno === student.regno ? (
                    <>
                      <input
                        type="text"
                        name="role"
                        placeholder="Role"
                        value={placementData.role}
                        onChange={handlePlacementInputChange}
                        disabled={loading}
                      />
                      <input
                        type="number"
                        name="package"
                        placeholder="Package (LPA)"
                        value={placementData.package}
                        onChange={handlePlacementInputChange}
                        disabled={loading}
                      />
                      <input
                        type="number"
                        name="year"
                        placeholder="Year"
                        value={placementData.year}
                        onChange={handlePlacementInputChange}
                        disabled={loading}
                      />
                      <button onClick={handlePlacementSubmit} disabled={loading}>
                        Submit
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handlePlacedClick(student.regno, student.name, student.company_name)}
                      disabled={loading}
                    >
                      Placed
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default AdminRegisteredStudents;