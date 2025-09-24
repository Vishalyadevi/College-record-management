import React, { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "./staffnavbar";

const StaffPage = () => {
    const [students, setStudents] = useState([]);
    const [startRegNo, setStartRegNo] = useState("");
    const [endRegNo, setEndRegNo] = useState("");
    const [expandedRows, setExpandedRows] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Fetch student details based on filter
    const fetchStudents = async () => {
        try {
            setLoading(true);
            setError("");
            
            let url = "http://localhost:4000/api/placement/students"; // Fixed URL path
            if (startRegNo && endRegNo) {
                url += `?startRegNo=${startRegNo}&endRegNo=${endRegNo}`;
            }
            
            const response = await axios.get(url);
            setStudents(response.data);
        } catch (error) {
            console.error("Error fetching student details:", error);
            setError("Failed to fetch student details. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudents();
    }, []);

    // Toggle detailed view
    const toggleDetails = (regno) => {
        setExpandedRows((prev) => ({
            ...prev,
            [regno]: !prev[regno],
        }));
    };

    // Clear filters
    const clearFilters = () => {
        setStartRegNo("");
        setEndRegNo("");
        fetchStudents();
    };

    return (
        <div>
            <Navbar />
            <br></br>
      <br></br>
      <br></br>
            <div style={{ padding: "20px" }}>
                <h2>Student Details</h2>

                {/* Filter Section */}
                <div style={{ marginBottom: "20px", padding: "15px", border: "1px solid #ddd", borderRadius: "5px" }}>
                    <h3>Filter Students</h3>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                        <div>
                            <label>Start Register Number: </label>
                            <input 
                                type="text" 
                                value={startRegNo} 
                                onChange={(e) => setStartRegNo(e.target.value)}
                                placeholder="e.g., 21001"
                                style={{ padding: "5px", marginLeft: "5px" }}
                            />
                        </div>
                        <div>
                            <label>End Register Number: </label>
                            <input 
                                type="text" 
                                value={endRegNo} 
                                onChange={(e) => setEndRegNo(e.target.value)}
                                placeholder="e.g., 21100"
                                style={{ padding: "5px", marginLeft: "5px" }}
                            />
                        </div>
                        <button 
                            onClick={fetchStudents}
                            disabled={loading}
                            style={{ 
                                padding: "8px 15px", 
                                backgroundColor: "#007bff", 
                                color: "white", 
                                border: "none", 
                                borderRadius: "4px",
                                cursor: loading ? "not-allowed" : "pointer"
                            }}
                        >
                            {loading ? "Loading..." : "Filter"}
                        </button>
                        <button 
                            onClick={clearFilters}
                            style={{ 
                                padding: "8px 15px", 
                                backgroundColor: "#6c757d", 
                                color: "white", 
                                border: "none", 
                                borderRadius: "4px",
                                cursor: "pointer"
                            }}
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div style={{ 
                        color: "red", 
                        backgroundColor: "#ffe6e6", 
                        padding: "10px", 
                        marginBottom: "20px",
                        borderRadius: "4px",
                        border: "1px solid #ff9999"
                    }}>
                        {error}
                    </div>
                )}

                {/* Student Count */}
                <div style={{ marginBottom: "15px" }}>
                    <strong>Total Students: {students.length}</strong>
                </div>

                {/* Student Table */}
                {students.length > 0 ? (
                    <table border="1" style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ backgroundColor: "#f8f9fa" }}>
                                <th style={{ padding: "10px" ,color:"black"}}>Register No</th>
                                <th style={{ padding: "10px",color:"black" }}>Name</th>
                                <th style={{ padding: "10px",color:"black" }}>Email</th>
                                <th style={{ padding: "10px",color:"black" }}>Batch</th>
                                <th style={{ padding: "10px",color:"black" }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map((student) => (
                                <React.Fragment key={student.regno}>
                                    <tr>
                                        <td style={{ padding: "10px" }}>{student.regno}</td>
                                        <td style={{ padding: "10px" }}>{student.name || student.username || 'N/A'}</td>
                                        <td style={{ padding: "10px" }}>{student.email || student.college_email || 'N/A'}</td>
                                        <td style={{ padding: "10px" }}>{student.batch || 'N/A'}</td>
                                        <td style={{ padding: "10px" }}>
                                            <button 
                                                onClick={() => toggleDetails(student.regno)}
                                                style={{
                                                    padding: "5px 10px",
                                                    backgroundColor: expandedRows[student.regno] ? "#dc3545" : "#007bff",
                                                    color: "white",
                                                    border: "none",
                                                    borderRadius: "4px",
                                                    cursor: "pointer"
                                                }}
                                            >
                                                {expandedRows[student.regno] ? "Hide Details" : "View More"}
                                            </button>
                                        </td>
                                    </tr>
                                    {expandedRows[student.regno] && (
                                        <tr>
                                            <td colSpan="5" style={{ padding: "15px", backgroundColor: "#f8f9fa" }}>
                                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "15px" }}>
                                                    <div>
                                                        <h4>Academic Details</h4>
                                                        <strong>Batch:</strong> {student.batch || 'N/A'} <br />
                                                        <strong>Department ID:</strong> {student.Deptid || 'N/A'} <br />
                                                        <strong>Semester:</strong> {student.Semester || 'N/A'} <br />
                                                        <strong>SSLC Percentage:</strong> {student.sslc_percentage || 'N/A'}% <br />
                                                        <strong>HSC Percentage:</strong> {student.hsc_percentage || 'N/A'}% <br />
                                                        <strong>Semester CGPAs:</strong> <br />
                                                        {[
                                                            { sem: 'Sem 1', cgpa: student.sem1_cgpa },
                                                            { sem: 'Sem 2', cgpa: student.sem2_cgpa },
                                                            { sem: 'Sem 3', cgpa: student.sem3_cgpa },
                                                            { sem: 'Sem 4', cgpa: student.sem4_cgpa },
                                                            { sem: 'Sem 5', cgpa: student.sem5_cgpa },
                                                            { sem: 'Sem 6', cgpa: student.sem6_cgpa },
                                                            { sem: 'Sem 7', cgpa: student.sem7_cgpa },
                                                            { sem: 'Sem 8', cgpa: student.sem8_cgpa }
                                                        ].filter(s => s.cgpa).map((s, i) => (
                                                            <span key={i}>&nbsp;&nbsp;{s.sem}: {s.cgpa}<br /></span>
                                                        ))}
                                                        <strong>History of Arrear:</strong> {student.history_of_arrear || 'N/A'} <br />
                                                        <strong>Standing Arrear:</strong> {student.standing_arrear || 'N/A'} <br />
                                                    </div>
                                                    
                                                    <div>
                                                        <h4>Contact Information</h4>
                                                        <strong>College Email:</strong> {student.college_email || student.email || 'N/A'} <br />
                                                        <strong>Personal Email:</strong> {student.personal_email || 'N/A'} <br />
                                                        <strong>Tutor Email:</strong> {student.tutorEmail || 'N/A'} <br />
                                                        <strong>Student Mobile:</strong> {student.student_mobile || 'N/A'} <br />
                                                        <strong>Secondary Mobile:</strong> {student.secondary_mobile || 'N/A'} <br />
                                                        <strong>Personal Phone:</strong> {student.personal_phone || 'N/A'} <br />
                                                        <strong>Address:</strong> {student.address || 'N/A'} <br />
                                                    </div>

                                                    <div>
                                                        <h4>Personal Details</h4>
                                                        <strong>Date of Birth:</strong> {student.date_of_birth || 'N/A'} <br />
                                                        <strong>Gender:</strong> {student.gender || 'N/A'} <br />
                                                        <strong>Blood Group:</strong> {student.blood_group || 'N/A'} <br />
                                                        <strong>Religion:</strong> {student.religion || 'N/A'} <br />
                                                        <strong>Caste:</strong> {student.caste || 'N/A'} <br />
                                                        <strong>Community:</strong> {student.community || 'N/A'} <br />
                                                        <strong>Mother Tongue:</strong> {student.mother_tongue || 'N/A'} <br />
                                                        <strong>First Graduate:</strong> {student.first_graduate || 'N/A'} <br />
                                                        <strong>Student Type:</strong> {student.student_type || 'N/A'} <br />
                                                    </div>

                                                    <div>
                                                        <h4>Document Details</h4>
                                                        <strong>Aadhar Number:</strong> {student.aadhar_card_no || student.aadhar_number || 'N/A'} <br />
                                                        <strong>PAN Card:</strong> {student.pancard_number || 'N/A'} <br />
                                                        <strong>Passport:</strong> {student.passport || 'N/A'} <br />
                                                        <strong>Identification Mark:</strong> {student.identification_mark || 'N/A'} <br />
                                                        <strong>Seat Type:</strong> {student.seat_type || 'N/A'} <br />
                                                        <strong>Section:</strong> {student.section || 'N/A'} <br />
                                                    </div>

                                                    <div>
                                                        <h4>Address Details</h4>
                                                        <strong>Door No:</strong> {student.door_no || 'N/A'} <br />
                                                        <strong>Street:</strong> {student.street || 'N/A'} <br />
                                                        <strong>City ID:</strong> {student.cityID || 'N/A'} <br />
                                                        <strong>District ID:</strong> {student.districtID || 'N/A'} <br />
                                                        <strong>State ID:</strong> {student.stateID || 'N/A'} <br />
                                                        <strong>Country ID:</strong> {student.countryID || 'N/A'} <br />
                                                        <strong>Pincode:</strong> {student.pincode || 'N/A'} <br />
                                                    </div>

                                                    <div>
                                                        <h4>Other Details</h4>
                                                        <strong>Date of Joining:</strong> {student.date_of_joining || 'N/A'} <br />
                                                        <strong>Extracurricular ID:</strong> {student.extracurricularID || 'N/A'} <br />
                                                        <strong>Created At:</strong> {student.createdAt || student.created_at || 'N/A'} <br />
                                                        <strong>Updated At:</strong> {student.updatedAt || student.updated_at || 'N/A'} <br />
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div style={{ 
                        textAlign: "center", 
                        padding: "40px", 
                        backgroundColor: "#f8f9fa", 
                        borderRadius: "5px" 
                    }}>
                        {loading ? "Loading students..." : "No student records found."}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StaffPage;