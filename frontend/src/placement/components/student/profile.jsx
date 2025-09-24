import React, { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "./navbar";

const StudentProfile = () => {
    // Get the actual regno from localStorage, not username
    const regno = localStorage.getItem("regno") || localStorage.getItem("username");
    const userId = localStorage.getItem("userId");

    const [formData, setFormData] = useState({
        regno: regno || "",
        name: "",
        batch: "",
        hsc_percentage: "",
        sslc_percentage: "",
        sem1_cgpa: "",
        sem2_cgpa: "",
        sem3_cgpa: "",
        sem4_cgpa: "",
        sem5_cgpa: "",
        sem6_cgpa: "",
        sem7_cgpa: "",
        sem8_cgpa: "",
        history_of_arrear: 0,
        standing_arrear: 0,
        address: "",
        student_mobile: "",
        secondary_mobile: "",
        college_email: "",
        personal_email: "",
        aadhar_number: "",
        pancard_number: "",
        passport: "",
        created_by: userId,
        Deptid: 1,
        Semester: "",
        date_of_joining: "",
        date_of_birth: "",
        blood_group: "",
        tutorEmail: "",
        first_graduate: "",
        student_type: "",
        mother_tongue: "",
        identification_mark: "",
        extracurricularID: "",
        religion: "",
        caste: "",
        community: "",
        gender: "",
        seat_type: "",
        section: "",
        door_no: "",
        street: "",
        cityID: "",
        districtID: "",
        stateID: "",
        countryID: "",
        pincode: "",
        personal_phone: ""
    });

    const [isEditing, setIsEditing] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [studentData, setStudentData] = useState(null);
    const [loading, setLoading] = useState(false);

    // Fetch student data
    useEffect(() => {
        const fetchStudentData = async () => {
            if (!regno) {
                console.error("No registration number found");
                setShowForm(true);
                return;
            }
            
            setLoading(true);
            try {
                const response = await axios.get(`http://localhost:4000/api/placement/student-profile/${regno}`);
                setStudentData(response.data);
                setFormData({...formData, ...response.data});
                setShowForm(false);
            } catch (error) {
                console.error("Error fetching student data:", error);
                if (error.response?.status === 404) {
                    console.log("Student profile not found, showing form to create new profile");
                    setShowForm(true);
                } else {
                    alert("Error fetching profile: " + (error.response?.data?.message || error.message));
                }
            } finally {
                setLoading(false);
            }
        };
        fetchStudentData();
    }, [regno]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const validateForm = () => {
        const phoneRegex = /^[6-9]\d{9}$/;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const aadharRegex = /^\d{12}$/;
        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

        if (formData.student_mobile && !phoneRegex.test(formData.student_mobile)) {
            alert("Invalid Student Mobile Number");
            return false;
        }
        if (formData.secondary_mobile && !phoneRegex.test(formData.secondary_mobile)) {
            alert("Invalid Secondary Mobile Number");
            return false;
        }
        if (formData.college_email && !emailRegex.test(formData.college_email)) {
            alert("Invalid College Email Format");
            return false;
        }
        if (formData.personal_email && !emailRegex.test(formData.personal_email)) {
            alert("Invalid Personal Email Format");
            return false;
        }
        if (formData.aadhar_number && !aadharRegex.test(formData.aadhar_number)) {
            alert("Invalid Aadhar Number (12 digits required)");
            return false;
        }
        if (formData.pancard_number && !panRegex.test(formData.pancard_number)) {
            alert("Invalid PAN Card Number");
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        try {
            const dataToSubmit = {
                ...formData,
                created_by: userId,
                updated_by: userId
            };

            const method = studentData ? "put" : "post";
            const endpoint = studentData
                ? `http://localhost:4000/api/placement/student-profile/${regno}`
                : "http://localhost:4000/api/placement/student-profile";

            const response = await axios[method](endpoint, dataToSubmit);
            alert(response.data.message);
            setShowForm(false);
            setIsEditing(false);
            setStudentData(dataToSubmit);
        } catch (error) {
            console.error("Error submitting form:", error);
            alert("Error submitting form: " + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = () => {
        setIsEditing(true);
        setShowForm(true);
    };

    const renderField = (field, value) => {
        const fieldLabels = {
            regno: "Registration Number",
            name: "Full Name",
            batch: "Batch",
            hsc_percentage: "HSC Percentage",
            sslc_percentage: "SSLC Percentage",
            sem1_cgpa: "Semester 1 CGPA",
            sem2_cgpa: "Semester 2 CGPA",
            sem3_cgpa: "Semester 3 CGPA",
            sem4_cgpa: "Semester 4 CGPA",
            sem5_cgpa: "Semester 5 CGPA",
            sem6_cgpa: "Semester 6 CGPA",
            sem7_cgpa: "Semester 7 CGPA",
            sem8_cgpa: "Semester 8 CGPA",
            history_of_arrear: "History of Arrears",
            standing_arrear: "Standing Arrears",
            address: "Address",
            student_mobile: "Student Mobile",
            secondary_mobile: "Secondary Mobile",
            college_email: "College Email",
            personal_email: "Personal Email",
            aadhar_number: "Aadhar Number",
            pancard_number: "PAN Card Number",
            passport: "Passport",
            date_of_birth: "Date of Birth",
            blood_group: "Blood Group",
            gender: "Gender"
        };

        return fieldLabels[field] || field.replace(/_/g, " ").toUpperCase();
    };

    if (loading) {
        return (
            <>
                <Navbar />
                <div style={styles.container}>
                    <div style={styles.loading}>
                        <div style={styles.spinner}></div>
                        <p>Loading Profile...</p>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <div style={styles.container}>
                <div style={styles.header}>
                    <h1 style={styles.heading}>Student Profile</h1>
                    <div style={styles.divider}></div>
                </div>

                {!showForm && !studentData && (
                    <div style={styles.emptyState}>
                        <h3 style={styles.emptyTitle}>No Profile Found</h3>
                        <p style={styles.emptyText}>Create your student profile to get started</p>
                        <button onClick={() => setShowForm(true)} style={styles.createBtn}>
                            Create Profile
                        </button>
                    </div>
                )}

                {showForm && (
                    <div style={styles.formContainer}>
                        <h3 style={styles.formTitle}>
                            {studentData ? "Edit Profile" : "Create Profile"}
                        </h3>
                        <form onSubmit={handleSubmit} style={styles.form}>
                            <div style={styles.section}>
                                <h4 style={styles.sectionTitle}>Basic Information</h4>
                                
                                <div style={styles.row}>
                                    <div style={styles.inputGroup}>
                                        <label style={styles.label}>Registration Number *</label>
                                        <input
                                            type="text"
                                            name="regno"
                                            value={formData.regno}
                                            onChange={handleChange}
                                            style={styles.input}
                                            required
                                            disabled={studentData ? true : false}
                                        />
                                    </div>

                                    <div style={styles.inputGroup}>
                                        <label style={styles.label}>Full Name *</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            style={styles.input}
                                            required
                                        />
                                    </div>
                                </div>

                                <div style={styles.row}>
                                    <div style={styles.inputGroup}>
                                        <label style={styles.label}>Batch</label>
                                        <input
                                            type="number"
                                            name="batch"
                                            value={formData.batch}
                                            onChange={handleChange}
                                            style={styles.input}
                                        />
                                    </div>

                                    <div style={styles.inputGroup}>
                                        <label style={styles.label}>Gender</label>
                                        <select
                                            name="gender"
                                            value={formData.gender}
                                            onChange={handleChange}
                                            style={styles.input}
                                        >
                                            <option value="">Select Gender</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Transgender">Transgender</option>
                                        </select>
                                    </div>
                                </div>

                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>Date of Birth</label>
                                    <input
                                        type="date"
                                        name="date_of_birth"
                                        value={formData.date_of_birth}
                                        onChange={handleChange}
                                        style={styles.input}
                                    />
                                </div>
                            </div>

                            <div style={styles.section}>
                                <h4 style={styles.sectionTitle}>Contact Information</h4>
                                
                                <div style={styles.row}>
                                    <div style={styles.inputGroup}>
                                        <label style={styles.label}>College Email *</label>
                                        <input
                                            type="email"
                                            name="college_email"
                                            value={formData.college_email}
                                            onChange={handleChange}
                                            style={styles.input}
                                            required
                                        />
                                    </div>

                                    <div style={styles.inputGroup}>
                                        <label style={styles.label}>Personal Email</label>
                                        <input
                                            type="email"
                                            name="personal_email"
                                            value={formData.personal_email}
                                            onChange={handleChange}
                                            style={styles.input}
                                        />
                                    </div>
                                </div>

                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>Student Mobile</label>
                                    <input
                                        type="tel"
                                        name="student_mobile"
                                        value={formData.student_mobile}
                                        onChange={handleChange}
                                        style={styles.input}
                                    />
                                </div>

                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>Address</label>
                                    <textarea
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        style={styles.textarea}
                                        placeholder="Enter your complete address"
                                    />
                                </div>
                            </div>

                            <div style={styles.section}>
                                <h4 style={styles.sectionTitle}>Academic Information</h4>
                                
                                <div style={styles.row}>
                                    <div style={styles.inputGroup}>
                                        <label style={styles.label}>HSC Percentage</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            name="hsc_percentage"
                                            value={formData.hsc_percentage}
                                            onChange={handleChange}
                                            style={styles.input}
                                            min="0"
                                            max="100"
                                        />
                                    </div>

                                    <div style={styles.inputGroup}>
                                        <label style={styles.label}>SSLC Percentage</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            name="sslc_percentage"
                                            value={formData.sslc_percentage}
                                            onChange={handleChange}
                                            style={styles.input}
                                            min="0"
                                            max="100"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div style={styles.section}>
                                <h4 style={styles.sectionTitle}>Identity Information</h4>
                                
                                <div style={styles.row}>
                                    <div style={styles.inputGroup}>
                                        <label style={styles.label}>Aadhar Number</label>
                                        <input
                                            type="text"
                                            name="aadhar_number"
                                            value={formData.aadhar_number}
                                            onChange={handleChange}
                                            style={styles.input}
                                            placeholder="12 digits"
                                        />
                                    </div>

                                    <div style={styles.inputGroup}>
                                        <label style={styles.label}>PAN Card Number</label>
                                        <input
                                            type="text"
                                            name="pancard_number"
                                            value={formData.pancard_number}
                                            onChange={handleChange}
                                            style={styles.input}
                                            placeholder="ABCDE1234F"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div style={styles.buttonContainer}>
                                <button 
                                    type="button" 
                                    onClick={() => setShowForm(false)} 
                                    style={styles.cancelBtn}
                                >
                                    Cancel
                                </button>
                                <button type="submit" style={styles.saveBtn} disabled={loading}>
                                    {loading ? "Saving..." : "Save Profile"}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {!showForm && studentData && (
                    <div style={styles.profileContainer}>
                        <div style={styles.profileHeader}>
                            <h3 style={styles.profileTitle}>Profile Information</h3>
                            <button onClick={handleEditClick} style={styles.editBtn}>
                                Edit Profile
                            </button>
                        </div>
                        
                        <div style={styles.profileContent}>
                            <div style={styles.profileGrid}>
                                {Object.entries(studentData).map(([key, value]) => {
                                    if (key === 'id' || key === 'Userid' || key === 'Created_by' || key === 'Updated_by') return null;
                                    return (
                                        <div key={key} style={styles.profileField}>
                                            <span style={styles.profileLabel}>{renderField(key)}</span>
                                            <span style={styles.profileValue}>{value || 'Not provided'}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default StudentProfile;

const styles = {
    container: {
        maxWidth: "1000px",
        margin: "20px auto",
        padding: "30px",
        background: "#ffffff",
        borderRadius: "10px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        color: "#000000",
        fontWeight: "600"
    },
    
    header: {
        textAlign: "center",
        marginBottom: "40px"
    },
    
    heading: {
        fontSize: "32px",
        fontWeight: "bold",
        color: "#000000",
        margin: "0 0 10px 0"
    },
    
    divider: {
        width: "80px",
        height: "3px",
        background: "linear-gradient(90deg, #007bff, #0056b3)",
        margin: "0 auto",
        borderRadius: "2px"
    },
    
    loading: {
        textAlign: "center",
        padding: "60px 20px",
        color: "#000000",
        fontWeight: "bold"
    },
    
    spinner: {
        width: "40px",
        height: "40px",
        border: "4px solid #f3f3f3",
        borderTop: "4px solid #007bff",
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
        margin: "0 auto 20px"
    },
    
    emptyState: {
        textAlign: "center",
        padding: "60px 20px"
    },
    
    emptyTitle: {
        fontSize: "24px",
        fontWeight: "bold",
        color: "#000000",
        margin: "0 0 10px 0"
    },
    
    emptyText: {
        fontSize: "16px",
        color: "#666666",
        marginBottom: "30px",
        fontWeight: "600"
    },
    
    createBtn: {
        background: "#007bff",
        color: "#ffffff",
        border: "none",
        padding: "14px 30px",
        borderRadius: "6px",
        fontSize: "16px",
        fontWeight: "bold",
        cursor: "pointer",
        transition: "all 0.3s ease"
    },
    
    formContainer: {
        background: "#f8f9fa",
        padding: "30px",
        borderRadius: "8px",
        border: "1px solid #e9ecef"
    },
    
    formTitle: {
        fontSize: "24px",
        fontWeight: "bold",
        color: "#000000",
        marginBottom: "25px",
        textAlign: "center"
    },
    
    form: {
        display: "flex",
        flexDirection: "column",
        gap: "30px"
    },
    
    section: {
        background: "#ffffff",
        padding: "25px",
        borderRadius: "8px",
        border: "1px solid #dee2e6"
    },
    
    sectionTitle: {
        fontSize: "18px",
        fontWeight: "bold",
        color: "#000000",
        marginBottom: "20px",
        paddingBottom: "8px",
        borderBottom: "2px solid #007bff"
    },
    
    row: {
        display: "flex",
        gap: "20px",
        marginBottom: "20px"
    },
    
    inputGroup: {
        display: "flex",
        flexDirection: "column",
        flex: "1"
    },
    
    label: {
        fontSize: "14px",
        fontWeight: "bold",
        color: "#000000",
        marginBottom: "8px"
    },
    
    input: {
        padding: "12px 15px",
        border: "2px solid #dee2e6",
        borderRadius: "6px",
        fontSize: "14px",
        fontWeight: "600",
        color: "#000000",
        transition: "border-color 0.3s ease",
        outline: "none"
    },
    
    textarea: {
        padding: "12px 15px",
        border: "2px solid #dee2e6",
        borderRadius: "6px",
        minHeight: "100px",
        fontSize: "14px",
        fontWeight: "600",
        color: "#000000",
        resize: "vertical",
        outline: "none",
        fontFamily: "inherit"
    },
    
    buttonContainer: {
        display: "flex",
        gap: "15px",
        justifyContent: "center",
        paddingTop: "20px"
    },
    
    saveBtn: {
        background: "#28a745",
        color: "#ffffff",
        border: "none",
        padding: "12px 30px",
        borderRadius: "6px",
        fontSize: "16px",
        fontWeight: "bold",
        cursor: "pointer",
        minWidth: "140px",
        transition: "all 0.3s ease"
    },
    
    cancelBtn: {
        background: "#6c757d",
        color: "#ffffff",
        border: "none",
        padding: "12px 30px",
        borderRadius: "6px",
        fontSize: "16px",
        fontWeight: "bold",
        cursor: "pointer",
        minWidth: "140px",
        transition: "all 0.3s ease"
    },
    
    profileContainer: {
        background: "#f8f9fa",
        borderRadius: "8px",
        border: "1px solid #e9ecef"
    },
    
    profileHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "25px 30px",
        borderBottom: "1px solid #dee2e6"
    },
    
    profileTitle: {
        fontSize: "24px",
        fontWeight: "bold",
        color: "#000000",
        margin: "0"
    },
    
    editBtn: {
        background: "#ffc107",
        color: "#000000",
        border: "none",
        padding: "10px 20px",
        borderRadius: "6px",
        fontSize: "14px",
        fontWeight: "bold",
        cursor: "pointer",
        transition: "all 0.3s ease"
    },
    
    profileContent: {
        padding: "30px"
    },
    
    profileGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "20px"
    },
    
    profileField: {
        background: "#ffffff",
        padding: "18px",
        borderRadius: "6px",
        border: "1px solid #dee2e6",
        display: "flex",
        flexDirection: "column",
        gap: "5px"
    },
    
    profileLabel: {
        fontSize: "12px",
        fontWeight: "bold",
        color: "#6c757d",
        textTransform: "uppercase",
        letterSpacing: "0.5px"
    },
    
    profileValue: {
        fontSize: "16px",
        fontWeight: "bold",
        color: "#000000",
        wordBreak: "break-word"
    }
};