import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import Navbar from "./StaffNavbar"; // Changed to StaffNavbar
import "../../styles/eligibleStudents.css";

axios.defaults.baseURL = "http://localhost:4000";

const EligibleStudents = () => {
  const [students, setStudents] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [currentStaffId, setCurrentStaffId] = useState(null);
  const [filters, setFilters] = useState({
    dept: '',
    batch: '',
    year: '',
    semester: '',
    companyName: ''
  });
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get current staff ID from token or context
  useEffect(() => {
    const getCurrentStaff = async () => {
      try {
        const token = localStorage.getItem('authToken');
        console.log('Token found:', !!token, 'Token value:', token?.substring(0, 20) + '...'); // Debug log
        
        if (!token) {
          setError('Authentication token not found. Please login again.');
          return;
        }

        console.log('Making API call to /api/auth/profile'); // Debug log
        
        // Make the API call with better error handling
        const response = await axios.get('/api/auth/profile', {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 5000 // 5 second timeout
        });
        
        console.log('Profile response:', response.data); // Debug log
        
        if (!response.data) {
          throw new Error('No data received from profile endpoint');
        }
        
        // Try different possible field names for staff ID
        const staffId = response.data.Userid || response.data.userId || response.data.id || response.data.staffId || response.data.staff_id;
        
        if (!staffId) {
          console.error('Available fields in response:', Object.keys(response.data));
          throw new Error('No valid staff ID field found in profile data');
        }
        
        setCurrentStaffId(staffId);
        console.log('Staff ID set:', staffId); // Debug log
        
      } catch (err) {
        console.error('Error getting current staff info:', err);
        
        if (err.code === 'ECONNABORTED') {
          setError('Request timeout. Please check if the backend server is running on http://localhost:4000');
        } else if (err.response?.status === 401) {
          setError('Session expired. Please login again.');
          localStorage.removeItem('authToken');
        } else if (err.response?.status === 404) {
          setError('Profile endpoint not found. Please check backend configuration.');
        } else if (err.response) {
          setError(`Server error: ${err.response.status} - ${err.response.data?.message || err.response.statusText}`);
        } else if (err.request) {
          setError('Cannot connect to server. Please check if backend is running on http://localhost:4000');
        } else {
          setError(`Error: ${err.message}`);
        }
      }
    };

    // Add a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (!currentStaffId) {
        setError('Loading timeout. Please refresh the page or login again.');
      }
    }, 10000); // 10 second timeout

    getCurrentStaff();

    return () => clearTimeout(timeoutId);
  }, []);

  // Fetch departments, companies, and students assigned to current staff
  useEffect(() => {
    if (!currentStaffId) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log('Fetching data for staff ID:', currentStaffId); // Debug log

        // Fetch departments
        const deptResponse = await axios.get('/api/departments').catch(err => {
          throw new Error(`Failed to fetch departments: ${err.response?.status} ${err.response?.statusText}`);
        });
        console.log('Departments response:', deptResponse.data); // Debug log
        
        if (!Array.isArray(deptResponse.data)) {
          throw new Error('Departments data is not an array');
        }
        setDepartments(deptResponse.data);

        // Fetch companies
        const companyResponse = await axios.get('/api/placement/upcoming-drives').catch(err => {
          throw new Error(`Failed to fetch companies: ${err.response?.status} ${err.response?.statusText}`);
        });
        console.log('Companies response:', companyResponse.data); // Debug log
        
        if (!Array.isArray(companyResponse.data)) {
          throw new Error('Companies data is not an array');
        }
        setCompanies(companyResponse.data);

        // Fetch student details for current staff only
        const studentDetailsResponse = await axios.get(`/api/student-details/staff/${currentStaffId}`).catch(err => {
          throw new Error(`Failed to fetch student details: ${err.response?.status} ${err.response?.statusText}`);
        });
        console.log('Student details response:', studentDetailsResponse.data); // Debug log
        
        if (!Array.isArray(studentDetailsResponse.data)) {
          throw new Error('Student details data is not an array');
        }

        // Fetch users data to get names
        const userResponse = await axios.get('/api/users').catch(err => {
          throw new Error(`Failed to fetch users: ${err.response?.status} ${err.response?.statusText}`);
        });
        console.log('Users response length:', userResponse.data?.length); // Debug log
        
        if (!Array.isArray(userResponse.data)) {
          throw new Error('Users data is not an array');
        }

        // Fetch all student education records
        const educationResponse = await axios.get('/api/student-education').catch(err => {
          throw new Error(`Failed to fetch student education data: ${err.response?.status} ${err.response?.statusText}`);
        });
        console.log('Education response length:', educationResponse.data?.length); // Debug log
        
        if (!Array.isArray(educationResponse.data)) {
          throw new Error('Student education data is not an array');
        }

        // Combine student details with user info and education data
        const studentsWithEducation = studentDetailsResponse.data.map(studentDetail => {
          const userInfo = userResponse.data.find(user => user.Userid === studentDetail.Userid);
          const educationRecord = educationResponse.data.find(edu => edu.userid === studentDetail.Userid);
          
          if (!userInfo) {
            console.warn(`No user info found for student ID: ${studentDetail.Userid}`);
            return null;
          }
          
          if (!educationRecord) {
            console.warn(`No education record found for student ID: ${studentDetail.Userid}`);
            // Don't skip students without education records, just use default values
          }
          
          return {
            id: studentDetail.id,
            userid: studentDetail.Userid,
            regno: studentDetail.regno,
            name: userInfo.name,
            email: userInfo.email,
            personal_email: studentDetail.personal_email,
            Deptid: studentDetail.Deptid,
            batch: studentDetail.batch,
            semester: studentDetail.Semester,
            staffId: studentDetail.staffId,
            student_type: studentDetail.student_type,
            tutor_email: studentDetail.tutorEmail,
            section: studentDetail.section,
            // Education data from student_education table (with defaults)
            tenth_percentage: educationRecord?.tenth_percentage || 0,
            twelfth_percentage: educationRecord?.twelfth_percentage || 0,
            ug_sem1_gpa: educationRecord?.ug_sem1_gpa || 0,
            ug_sem2_gpa: educationRecord?.ug_sem2_gpa || 0,
            ug_sem3_gpa: educationRecord?.ug_sem3_gpa || 0,
            ug_sem4_gpa: educationRecord?.ug_sem4_gpa || 0,
            ug_sem5_gpa: educationRecord?.ug_sem5_gpa || 0,
            ug_sem6_gpa: educationRecord?.ug_sem6_gpa || 0,
            ug_sem7_gpa: educationRecord?.ug_sem7_gpa || 0,
            ug_sem8_gpa: educationRecord?.ug_sem8_gpa || 0,
            ug_cgpa: educationRecord?.ug_cgpa || 0,
            has_arrears: educationRecord?.has_arrears || 'No',
            no_of_arrears: educationRecord?.no_of_arrears || 0,
            has_pg: educationRecord?.has_pg || 'No',
            pg_cgpa: educationRecord?.pg_cgpa || 0
          };
        }).filter(student => student !== null); // Remove students without user info

        console.log('Students with education:', studentsWithEducation.length); // Debug log

        // Calculate eligibility for each student
        const eligibleStudents = studentsWithEducation.map(student => {
          const eligibleCompanies = companyResponse.data.filter(company => 
            isStudentEligible(student, company.eligibility)
          ).map(company => company.company_name);
          return { ...student, eligibleCompanies };
        });

        console.log('Final eligible students:', eligibleStudents.length); // Debug log
        setStudents(eligibleStudents);
        setFilteredStudents(eligibleStudents);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message || 'Failed to fetch data. Please check the backend APIs.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentStaffId]);

  // Parse eligibility criteria and check if student meets them
  const isStudentEligible = (student, eligibility) => {
    if (!eligibility || typeof eligibility !== 'string') {
      console.warn('Invalid eligibility format:', eligibility);
      return false;
    }

    // Default criteria
    const criteria = {
      sslc: 0,
      hsc: 0,
      cgpa: 0,
      noStandingArrears: false
    };

    // Parse eligibility text (more robust handling)
    try {
      const sslcMatch = eligibility.match(/10th\s*>=?\s*(\d+\.?\d*)%/i);
      const hscMatch = eligibility.match(/12th\s*>=?\s*(\d+\.?\d*)%/i);
      const cgpaMatch = eligibility.match(/CGPA\s*>=?\s*(\d+\.?\d*)/i);
      const arrearsMatch = eligibility.match(/No standing arrears|No arrears/i);

      if (sslcMatch) criteria.sslc = parseFloat(sslcMatch[1]);
      if (hscMatch) criteria.hsc = parseFloat(hscMatch[1]);
      if (cgpaMatch) criteria.cgpa = parseFloat(cgpaMatch[1]);
      if (arrearsMatch) criteria.noStandingArrears = true;
    } catch (err) {
      console.warn('Error parsing eligibility:', err, eligibility);
      return false;
    }

    // Use CGPA from database or calculate from semester GPAs
    let studentCgpa = student.ug_cgpa;
    if (!studentCgpa || studentCgpa === 0) {
      const semesters = [
        student.ug_sem1_gpa, student.ug_sem2_gpa, student.ug_sem3_gpa, student.ug_sem4_gpa,
        student.ug_sem5_gpa, student.ug_sem6_gpa, student.ug_sem7_gpa, student.ug_sem8_gpa
      ].filter(gpa => gpa !== null && gpa !== undefined && gpa > 0);
      
      studentCgpa = semesters.length > 0 
        ? (semesters.reduce((sum, gpa) => sum + gpa, 0) / semesters.length)
        : 0;
    }

    // Check eligibility
    const tenthPercentage = student.tenth_percentage || 0;
    const twelfthPercentage = student.twelfth_percentage || 0;
    const hasArrears = student.has_arrears === 'Yes' || student.no_of_arrears > 0;

    return (
      tenthPercentage >= criteria.sslc &&
      twelfthPercentage >= criteria.hsc &&
      studentCgpa >= criteria.cgpa &&
      (!criteria.noStandingArrears || !hasArrears)
    );
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Apply filters
  useEffect(() => {
    let filtered = students;

    if (filters.dept) {
      filtered = filtered.filter(student => {
        const dept = departments.find(d => d.Deptid === student.Deptid);
        return dept && dept.Deptacronym === filters.dept;
      });
    }
    if (filters.batch) {
      filtered = filtered.filter(student => student.batch === parseInt(filters.batch));
    }
    if (filters.year) {
      filtered = filtered.filter(student => {
        const currentYear = new Date().getFullYear();
        const batchYear = parseInt(student.batch);
        const yearDiff = currentYear - batchYear + 1;
        return yearDiff.toString() === filters.year;
      });
    }
    if (filters.semester) {
      filtered = filtered.filter(student => student.semester === filters.semester);
    }
    if (filters.companyName) {
      filtered = filtered.filter(student => 
        student.eligibleCompanies.some(name => 
          name.toLowerCase().includes(filters.companyName.toLowerCase())
        )
      );
    }

    setFilteredStudents(filtered);
  }, [filters, students, departments]);

  // Download as Excel
  const handleDownloadExcel = () => {
    const data = filteredStudents.map((student, index) => ({
      'S.N': index + 1,
      'Reg No': student.regno,
      'Name': student.name,
      'Email': student.email,
      'Personal Email': student.personal_email,
      'Department': departments.find(d => d.Deptid === student.Deptid)?.Deptacronym || 'N/A',
      'Batch': student.batch,
      'Year': calculateYear(student.batch),
      'Semester': student.semester,
      'Section': student.section,
      'Student Type': student.student_type,
      '10th (%)': student.tenth_percentage || 'N/A',
      '12th (%)': student.twelfth_percentage || 'N/A',
      'UG CGPA': calculateCgpa(student),
      'Has Arrears': student.has_arrears,
      'No. of Arrears': student.no_of_arrears || 0,
      'Has PG': student.has_pg,
      'PG CGPA': student.pg_cgpa || 'N/A',
      'Eligible Companies': student.eligibleCompanies.join(', ') || 'None'
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'My Students - Eligible');
    XLSX.writeFile(workbook, `MyStudents_Eligible_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Helper functions
  const calculateYear = (batch) => {
    const currentYear = new Date().getFullYear();
    const batchYear = parseInt(batch);
    return batchYear ? (currentYear - batchYear + 1).toString() : 'N/A';
  };

  const calculateCgpa = (student) => {
    // Use stored CGPA if available
    if (student.ug_cgpa && student.ug_cgpa > 0) {
      return student.ug_cgpa.toFixed(2);
    }

    // Calculate from semester GPAs
    const semesters = [
      student.ug_sem1_gpa, student.ug_sem2_gpa, student.ug_sem3_gpa, student.ug_sem4_gpa,
      student.ug_sem5_gpa, student.ug_sem6_gpa, student.ug_sem7_gpa, student.ug_sem8_gpa
    ].filter(gpa => gpa !== null && gpa !== undefined && gpa > 0);
    
    return semesters.length > 0 
      ? (semesters.reduce((sum, gpa) => sum + gpa, 0) / semesters.length).toFixed(2)
      : 'N/A';
  };

  const formatArrears = (student) => {
    if (student.has_arrears === 'No' || student.no_of_arrears === 0) {
      return 'No Arrears';
    }
    return `${student.no_of_arrears} Arrears`;
  };

  // Unique filter options (from current staff's students only)
  const uniqueDepts = [...new Set(departments.filter(d => 
    students.some(s => s.Deptid === d.Deptid)
  ).map(d => d.Deptacronym).filter(Boolean))];
  
  const uniqueBatches = [...new Set(students.map(s => s.batch).filter(Boolean))];
  const uniqueYears = [...new Set(students.map(s => calculateYear(s.batch)).filter(Boolean))];
  const uniqueSemesters = [...new Set(students.map(s => s.semester).filter(Boolean))];
  const uniqueCompanies = [...new Set(companies.map(c => c.company_name))];

  // For testing purposes - UNCOMMENT ONE OF THESE TO BYPASS AUTHENTICATION:
  
  // Option 1: Use a hardcoded staff ID for testing
  // useEffect(() => {
  //   setCurrentStaffId('STAFF001'); // Replace with actual staff ID
  // }, []);

  // Option 2: Try to get staff ID from localStorage directly
  // useEffect(() => {
  //   const staffId = localStorage.getItem('staffId') || localStorage.getItem('userId');
  //   if (staffId) {
  //     setCurrentStaffId(staffId);
  //   } else {
  //     setError('No staff ID found in localStorage');
  //   }
  // }, []);

  // Option 3: Skip authentication and use demo data
  // useEffect(() => {
  //   setCurrentStaffId('DEMO_STAFF');
  // }, []);

  if (!currentStaffId && !error) {
    return (
      <>
        <Navbar />
        <div className="eligible-students-container">
          <div className="loading">
            <div className="loading-spinner"></div>
            Loading staff information...
            <br />
            <small>If this persists, check console for errors</small>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <br></br>
      <br></br>
      <br></br>
      <div className="eligible-students-container">
        <div className="main-container">
          <div className="header-section">
            <h1 className="title">My Students - Eligible for Placements</h1>
            <p className="subtitle">
              Students assigned to you with company eligibility status
              {currentStaffId && <span> (Staff ID: {currentStaffId})</span>}
            </p>
          </div>

          {error && (
            <div className="error-message">
              <strong>Error:</strong> {error}
              <br />
              <small>Check browser console for more details</small>
            </div>
          )}

          {loading && (
            <div className="loading">
              <div className="loading-spinner"></div>
              Loading your students and education data...
            </div>
          )}

          {/* Filters Section */}
          <div className="filters">
            <div className="filter-group">
              <label className="filter-label">Department</label>
              <select name="dept" value={filters.dept} onChange={handleFilterChange} aria-label="Filter by department">
                <option value="">All Departments</option>
                {uniqueDepts.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label className="filter-label">Batch</label>
              <select name="batch" value={filters.batch} onChange={handleFilterChange} aria-label="Filter by batch">
                <option value="">All Batches</option>
                {uniqueBatches.map(batch => (
                  <option key={batch} value={batch}>{batch}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label className="filter-label">Year</label>
              <select name="year" value={filters.year} onChange={handleFilterChange} aria-label="Filter by year">
                <option value="">All Years</option>
                {uniqueYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label className="filter-label">Semester</label>
              <select name="semester" value={filters.semester} onChange={handleFilterChange} aria-label="Filter by semester">
                <option value="">All Semesters</option>
                {uniqueSemesters.map(sem => (
                  <option key={sem} value={sem}>{sem}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label className="filter-label">Company Name</label>
              <input
                type="text"
                name="companyName"
                value={filters.companyName}
                onChange={handleFilterChange}
                placeholder="Filter by company name"
                aria-label="Filter by company name"
              />
            </div>
            <button 
              className="download-btn" 
              onClick={handleDownloadExcel} 
              disabled={filteredStudents.length === 0}
              aria-label="Download as Excel"
            >
              Download My Students ({filteredStudents.length} records)
            </button>
          </div>

          {/* Students Table */}
          <div className="table-container">
            {filteredStudents.length > 0 ? (
              <div className="table-wrapper">
                <table className="students-table">
                  <thead>
                    <tr>
                      <th>S.N</th>
                      <th>Reg No</th>
                      <th>Name</th>
                      <th>Department</th>
                      <th>Batch</th>
                      <th>Semester</th>
                      <th>Section</th>
                      <th>Student Type</th>
                      <th>10th (%)</th>
                      <th>12th (%)</th>
                      <th>UG CGPA</th>
                      <th>Arrears</th>
                      <th>Eligible Companies</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student, index) => (
                      <tr key={student.userid}>
                        <td>{index + 1}</td>
                        <td>{student.regno}</td>
                        <td>{student.name}</td>
                        <td>{departments.find(d => d.Deptid === student.Deptid)?.Deptacronym || 'N/A'}</td>
                        <td>{student.batch}</td>
                        <td>{student.semester}</td>
                        <td>{student.section || 'N/A'}</td>
                        <td>{student.student_type || 'N/A'}</td>
                        <td>{student.tenth_percentage || 'N/A'}</td>
                        <td>{student.twelfth_percentage || 'N/A'}</td>
                        <td>{calculateCgpa(student)}</td>
                        <td>{formatArrears(student)}</td>
                        <td>
                          {student.eligibleCompanies.length > 0 ? (
                            <div className="companies-list">
                              {student.eligibleCompanies.map((company, idx) => (
                                <span key={idx} className="company-tag">{company}</span>
                              ))}
                            </div>
                          ) : (
                            <span className="no-companies">No eligible companies</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              !loading && (
                <div className="empty-state">
                  <div className="empty-icon">👨‍🎓</div>
                  <h3 className="empty-title">No Eligible Students Found</h3>
                  <p className="empty-description">
                    {filters.dept || filters.batch || filters.year || filters.semester || filters.companyName
                      ? "No students match the current filters. Try adjusting your search criteria."
                      : "You don't have any students assigned or none have complete education records."
                    }
                  </p>
                </div>
              )
            )}
          </div>

          {/* Summary Statistics */}
          {!loading && students.length > 0 && (
            <div className="summary-stats">
              <div className="stat-card">
                <h4>My Total Students</h4>
                <span className="stat-number">{students.length}</span>
              </div>
              <div className="stat-card">
                <h4>Filtered Results</h4>
                <span className="stat-number">{filteredStudents.length}</span>
              </div>
              <div className="stat-card">
                <h4>Available Companies</h4>
                <span className="stat-number">{companies.length}</span>
              </div>
              <div className="stat-card">
                <h4>Eligible Students</h4>
                <span className="stat-number">
                  {filteredStudents.filter(s => s.eligibleCompanies.length > 0).length}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default EligibleStudents;