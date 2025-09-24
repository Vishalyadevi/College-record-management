import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import Navbar from "./AdminNavbar";
import '../../styles/UpcomingDrives.css';

// Set axios base URL
axios.defaults.baseURL = "http://localhost:4000";

const UpcomingDrives = () => {
    const [drives, setDrives] = useState([]);
    const [filteredDrives, setFilteredDrives] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        company_name: '',
        eligibility: '',
        date: '',
        time: '',
        venue: '',
        roles: '',
        salary: ''
    });
    const [postFile, setPostFile] = useState(null);
    const [filters, setFilters] = useState({
        companyName: '',
        fromDate: '',
        toDate: ''
    });

    // Get user ID from localStorage
    const userId = localStorage.getItem('userId') || localStorage.getItem('Userid') || '1';

    useEffect(() => {
        fetchDrives();
    }, []);

    const fetchDrives = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get('/api/placement/upcoming-drives');
            console.log('Fetched drives:', response.data);
            setDrives(response.data);
            setFilteredDrives(response.data); // Initialize filtered drives
        } catch (error) {
            console.error('Error fetching drives:', error);
            setError('Failed to fetch upcoming drives');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    useEffect(() => {
        // Apply filters
        let filtered = drives;

        // Filter by company name
        if (filters.companyName) {
            filtered = filtered.filter((drive) =>
                drive.company_name?.toLowerCase().includes(filters.companyName.toLowerCase())
            );
        }

        // Filter by date range
        if (filters.fromDate) {
            filtered = filtered.filter((drive) => new Date(drive.date) >= new Date(filters.fromDate));
        }
        if (filters.toDate) {
            filtered = filtered.filter((drive) => new Date(drive.date) <= new Date(filters.toDate));
        }

        setFilteredDrives(filtered);
    }, [filters, drives]);

    const handleDownloadExcel = () => {
        const data = filteredDrives.map((drive) => ({
            'Company Name': drive.company_name || 'N/A',
            'Eligibility': drive.eligibility || 'N/A',
            'Date': formatDate(drive.date),
            'Time': formatTime(drive.time),
            'Venue': drive.venue || 'N/A',
            'Package': drive.salary || 'Not specified',
            'Roles': drive.roles || 'Not specified',
            'Posted': formatDate(drive.created_at)
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Upcoming Drives');
        XLSX.writeFile(workbook, 'UpcomingDrives.xlsx');
    };

    const handleDeleteDrive = async (id) => {
        if (!window.confirm("Are you sure you want to delete this drive?")) {
            return;
        }

        setLoading(true);
        try {
            await axios.delete(`/api/placement/upcoming-drives/${id}`);
            alert("Drive deleted successfully!");
            fetchDrives(); // Refresh the list
        } catch (error) {
            console.error("Error deleting drive:", error);
            alert("Failed to delete the drive: " + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ 
            ...formData, 
            [e.target.name]: e.target.value 
        });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
            if (!allowedTypes.includes(file.type)) {
                alert('Only JPEG, PNG, and PDF files are allowed.');
                e.target.value = ''; // Clear the input
                return;
            }
            // Check file size (optional - limit to 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('File size should not exceed 5MB.');
                e.target.value = '';
                return;
            }
        }
        setPostFile(file);
    };

    const resetForm = () => {
        setFormData({
            company_name: '',
            eligibility: '',
            date: '',
            time: '',
            venue: '',
            roles: '',
            salary: ''
        });
        setPostFile(null);
        // Clear file input
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) fileInput.value = '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validation
        if (!formData.company_name || !formData.eligibility || !formData.date || 
            !formData.time || !formData.venue) {
            alert('Please fill in all required fields.');
            return;
        }

        if (!userId) {
            alert('User session not found. Please login again.');
            return;
        }

        setLoading(true);
        setError(null);
        
        const formPayload = new FormData();
        
        // Add file if selected
        if (postFile) {
            formPayload.append('post', postFile);
        }
        
        // Add all form data
        Object.keys(formData).forEach((key) => {
            formPayload.append(key, formData[key]);
        });
        
        // Add created_by from localStorage
        formPayload.append('created_by', userId);
        
        console.log("Submitting Data:");
        for (let [key, value] of formPayload.entries()) {
            console.log(key, value);
        }

        try {
            const response = await axios.post('/api/placement/upcoming-drives', formPayload, {
                headers: { 
                    'Content-Type': 'multipart/form-data'
                },
            });
            
            console.log('Response:', response.data);
            alert('Drive added successfully!');
            setShowForm(false);
            resetForm();
            fetchDrives(); // Refresh the drives list
        } catch (error) {
            console.error('Error adding drive:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Unknown error occurred';
            alert('Error adding drive: ' + errorMessage);
            setError('Failed to add drive: ' + errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString();
        } catch {
            return dateString;
        }
    };

    const formatTime = (timeString) => {
        if (!timeString) return 'N/A';
        try {
            // If it's already in HH:MM format, return as is
            if (timeString.match(/^\d{2}:\d{2}$/)) {
                return timeString;
            }
            // Otherwise try to format it
            const time = new Date(`1970-01-01T${timeString}`);
            return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch {
            return timeString;
        }
    };

    return (
        <>
            <Navbar />
            <br></br>
      <br></br>
      <br></br>
            <div className="upcoming-drives-container">
                <h1 className="title">Upcoming Drives</h1>

                {error && (
                    <div className="error-message" style={{
                        backgroundColor: '#ffebee',
                        color: '#c62828',
                        padding: '10px',
                        borderRadius: '4px',
                        margin: '10px 0'
                    }}>
                        {error}
                    </div>
                )}

                {loading && (
                    <div className="loading" style={{
                        textAlign: 'center',
                        padding: '20px',
                        color: '#666'
                    }}>
                        Loading...
                    </div>
                )}

                {/* Filters Section */}
                <div className="filters" style={{
                    margin: '20px 0',
                    padding: '15px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '4px',
                    display: 'flex',
                    gap: '15px',
                    flexWrap: 'wrap'
                }}>
                    <div>
                        <label>Company Name:</label>
                        <input
                            type="text"
                            name="companyName"
                            value={filters.companyName}
                            onChange={handleFilterChange}
                            placeholder="Filter by company name"
                            style={{ padding: '8px', width: '200px' }}
                        />
                    </div>
                    <div>
                        <label>From Date:</label>
                        <input
                            type="date"
                            name="fromDate"
                            value={filters.fromDate}
                            onChange={handleFilterChange}
                            style={{ padding: '8px' }}
                        />
                    </div>
                    <div>
                        <label>To Date:</label>
                        <input
                            type="date"
                            name="toDate"
                            value={filters.toDate}
                            onChange={handleFilterChange}
                            style={{ padding: '8px' }}
                        />
                    </div>
                    <button
                        onClick={handleDownloadExcel}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#4CAF50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Download as Excel
                    </button>
                </div>

                {/* Toggle Button */}
                <button 
                    className="toggle-form-btn" 
                    onClick={() => setShowForm(!showForm)}
                    disabled={loading}
                >
                    {showForm ? 'Cancel' : 'Add Drive'}
                </button>

                {/* Add Drive Form */}
                {showForm && (
                    <div className="form-card">
                        <h3>Add New Drive</h3>
                        <form onSubmit={handleSubmit}>
                            <label>Upload File (Image or PDF):</label>
                            <input 
                                type="file" 
                                name="post" 
                                onChange={handleFileChange}
                                accept=".jpg,.jpeg,.png,.pdf"
                                disabled={loading}
                            />
                            <small style={{ color: '#666', fontSize: '12px' }}>
                                Accepted formats: JPEG, PNG, PDF (Max 5MB)
                            </small>

                            <label>Company Name: <span style={{color: 'red'}}>*</span></label>
                            <input 
                                type="text" 
                                name="company_name" 
                                value={formData.company_name}
                                onChange={handleChange} 
                                required 
                                disabled={loading}
                                placeholder="Enter company name"
                            />

                            <label>Eligibility: <span style={{color: 'red'}}>*</span></label>
                            <input 
                                type="text" 
                                name="eligibility" 
                                value={formData.eligibility}
                                onChange={handleChange} 
                                required 
                                disabled={loading}
                                placeholder="e.g., B.Tech CSE/IT with 70%+ marks"
                            />

                            <label>Date: <span style={{color: 'red'}}>*</span></label>
                            <input 
                                type="date" 
                                name="date" 
                                value={formData.date}
                                onChange={handleChange} 
                                required 
                                disabled={loading}
                                min={new Date().toISOString().split('T')[0]} // Prevent past dates
                            />

                            <label>Time: <span style={{color: 'red'}}>*</span></label>
                            <input 
                                type="time" 
                                name="time" 
                                value={formData.time}
                                onChange={handleChange} 
                                required 
                                disabled={loading}
                            />

                            <label>Venue: <span style={{color: 'red'}}>*</span></label>
                            <input 
                                type="text" 
                                name="venue" 
                                value={formData.venue}
                                onChange={handleChange} 
                                required 
                                disabled={loading}
                                placeholder="e.g., Seminar Hall, Online"
                            />

                            <label>Package/Salary:</label>
                            <input 
                                type="text" 
                                name="salary" 
                                value={formData.salary}
                                onChange={handleChange} 
                                disabled={loading}
                                placeholder="e.g., 5-8 LPA, Not disclosed"
                            />

                            <label>Roles:</label>
                            <input 
                                type="text" 
                                name="roles" 
                                value={formData.roles}
                                onChange={handleChange} 
                                disabled={loading}
                                placeholder="e.g., Software Developer, Data Analyst"
                            />

                            <button id="up-sub" type="submit" disabled={loading}>
                                {loading ? 'Submitting...' : 'Submit'}
                            </button>
                        </form>
                    </div>
                )}

                {/* Display Upcoming Drives */}
                <div className="admin-drives-list">
                    {filteredDrives.length > 0 ? (
                        filteredDrives.map((drive) => (
                            <div key={drive.id} className="admin-drive-card">
                                {drive.post && (
                                    <>
                                        {drive.post.toLowerCase().endsWith(".pdf") ? (
                                            <div className="pdf-container">
                                                <a 
                                                    href={`http://localhost:4000/Uploads/${drive.post}`} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer" 
                                                    className="admin-drive-pdf"
                                                    style={{
                                                        display: 'inline-block',
                                                        padding: '10px 20px',
                                                        backgroundColor: '#2196F3',
                                                        color: 'white',
                                                        textDecoration: 'none',
                                                        borderRadius: '4px',
                                                        marginBottom: '10px'
                                                    }}
                                                >
                                                    📄 View PDF
                                                </a>
                                            </div>
                                        ) : (
                                            <img 
                                                src={`http://localhost:4000/Uploads/${drive.post}`} 
                                                alt="Drive Post" 
                                                className="admin-drive-img"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    console.error('Failed to load image:', drive.post);
                                                }}
                                                style={{
                                                    maxWidth: '100%',
                                                    height: 'auto',
                                                    borderRadius: '4px',
                                                    marginBottom: '10px'
                                                }}
                                            />
                                        )}
                                    </>
                                )}
                                
                                <div className="drive-details">
                                    <p><strong>Company:</strong> {drive.company_name || 'N/A'}</p>
                                    <p><strong>Eligibility:</strong> {drive.eligibility || 'N/A'}</p>
                                    <p><strong>Date:</strong> {formatDate(drive.date)}</p>
                                    <p><strong>Time:</strong> {formatTime(drive.time)}</p>
                                    <p><strong>Venue:</strong> {drive.venue || 'N/A'}</p>
                                    <p><strong>Package:</strong> {drive.salary || 'Not specified'}</p>
                                    <p><strong>Roles:</strong> {drive.roles || 'Not specified'}</p>
                                    {drive.created_at && (
                                        <p><strong>Posted:</strong> {formatDate(drive.created_at)}</p>
                                    )}
                                </div>
                                
                                <button 
                                    className="delete-btn" 
                                    onClick={() => handleDeleteDrive(drive.id)}
                                    disabled={loading}
                                    style={{
                                        backgroundColor: '#f44336',
                                        color: 'white',
                                        border: 'none',
                                        padding: '8px 16px',
                                        borderRadius: '4px',
                                        cursor: loading ? 'not-allowed' : 'pointer',
                                        marginTop: '10px'
                                    }}
                                >
                                    {loading ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        ))
                    ) : (
                        !loading && <p className="no-drives">No upcoming drives match the filters.</p>
                    )}
                </div>
            </div>
        </>
    );
};

export default UpcomingDrives;