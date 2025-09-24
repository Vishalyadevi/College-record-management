import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import Navbar from "./AdminNavbar";
import "../../styles/eligibleStudents.css";

// Set axios base URL
axios.defaults.baseURL = "http://localhost:4000";

const EligibleStudents = () => {
  // State management
  const [students, setStudents] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [filters, setFilters] = useState({
    dept: '',
    batch: '',
    year: '',
    companyName: ''
  });
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all required data on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('🚀 Starting data fetch...');

        // Create an array to store all API calls
        const apiCalls = [];

        // Fetch departments
        apiCalls.push(
          axios.get('/api/departments').catch(err => {
            console.error('Department fetch error:', err.response?.data || err.message);
            throw new Error(`Failed to fetch departments: ${err.response?.status || 'Network Error'}`);
          })
        );

        // Fetch companies
        apiCalls.push(
          axios.get('/api/placement/upcoming-drives').catch(err => {
            console.error('Company fetch error:', err.response?.data || err.message);
            throw new Error(`Failed to fetch companies: ${err.response?.status || 'Network Error'}`);
          })
        );

        // Fetch users
        apiCalls.push(
          axios.get('/api/users').catch(err => {
            console.error('Users fetch error:', err.response?.data || err.message);
            
            if (err.response?.status === 404) {
              throw new Error('Users endpoint not found. Please ensure the backend API is running.');
            }
            throw new Error(`Failed to fetch users: ${err.response?.status || 'Network Error'}`);
          })
        );

        // Fetch student education records
        apiCalls.push(
          axios.get('/api/student-education').catch(err => {
            console.error('Education fetch error:', err.response?.data || err.message);
            throw new Error(`Failed to fetch education data: ${err.response?.status || 'Network Error'}`);
          })
        );

        // Execute all API calls
        console.log('📡 Executing API calls...');
        const [deptResponse, companyResponse, userResponse, educationResponse] = await Promise.all(apiCalls);

        // Validate response data
        if (!Array.isArray(deptResponse.data)) {
          throw new Error('Invalid departments data received from server');
        }
        if (!Array.isArray(companyResponse.data)) {
          throw new Error('Invalid companies data received from server');
        }
        if (!Array.isArray(userResponse.data)) {
          throw new Error('Invalid users data received from server');
        }
        if (!Array.isArray(educationResponse.data)) {
          throw new Error('Invalid education data received from server');
        }

        // Set the data
        setDepartments(deptResponse.data);
        setCompanies(companyResponse.data);
        
        console.log('📊 Data fetched successfully:');
        console.log('- Departments:', deptResponse.data.length);
        console.log('- Companies:', companyResponse.data.length);
        console.log('- Users:', userResponse.data.length);
        console.log('- Education records:', educationResponse.data.length);

        // Combine user data with education data
        const studentsWithEducation = userResponse.data
          .map(user => {
            const educationRecord = educationResponse.data.find(edu => 
              edu.userid === user.Userid || edu.Userid === user.Userid
            );
            
            if (!educationRecord) {
              console.log(`No education record found for user ${user.Userid}`);
              return null; // Skip users without education records
            }
            
            return {
              id: user.Userid,
              userid: user.Userid,
              regno: educationRecord.regno || 'N/A',
              name: user.name || 'Unknown',
              email: user.email || 'N/A',
              Deptid: user.Deptid,
              batch: user.batch,
              // Education data from student_education table
              tenth_percentage: parseFloat(educationRecord.tenth_percentage) || 0,
              twelfth_percentage: parseFloat(educationRecord.twelfth_percentage) || 0,
              ug_sem1_gpa: parseFloat(educationRecord.ug_sem1_gpa) || 0,
              ug_sem2_gpa: parseFloat(educationRecord.ug_sem2_gpa) || 0,
              ug_sem3_gpa: parseFloat(educationRecord.ug_sem3_gpa) || 0,
              ug_sem4_gpa: parseFloat(educationRecord.ug_sem4_gpa) || 0,
              ug_sem5_gpa: parseFloat(educationRecord.ug_sem5_gpa) || 0,
              ug_sem6_gpa: parseFloat(educationRecord.ug_sem6_gpa) || 0,
              ug_sem7_gpa: parseFloat(educationRecord.ug_sem7_gpa) || 0,
              ug_sem8_gpa: parseFloat(educationRecord.ug_sem8_gpa) || 0,
              ug_cgpa: parseFloat(educationRecord.ug_cgpa) || 0,
              has_arrears: educationRecord.has_arrears || 'No',
              no_of_arrears: parseInt(educationRecord.no_of_arrears) || 0,
              has_pg: educationRecord.has_pg || 'No',
              pg_cgpa: parseFloat(educationRecord.pg_cgpa) || 0
            };
          })
          .filter(student => student !== null); // Remove students without education records

        console.log('👥 Students with education records:', studentsWithEducation.length);

        // Calculate eligibility for each student
        const eligibleStudents = studentsWithEducation.map(student => {
          const eligibleCompanies = companyResponse.data
            .filter(company => {
              const isEligible = isStudentEligible(student, company.eligibility);
              return isEligible;
            })
            .map(company => company.company_name || 'Unknown Company');
          
          return { ...student, eligibleCompanies };
        });

        console.log('✅ Eligibility calculation completed');
        
        setStudents(eligibleStudents);
        setFilteredStudents(eligibleStudents);
        
      } catch (err) {
        console.error('❌ Error fetching data:', err);
        setError(err.message || 'Failed to fetch data. Please check your connection and try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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

    // Parse eligibility text with improved regex patterns
    try {
      const sslcMatch = eligibility.match(/(?:10th|SSLC)\s*[>=]+\s*(\d+\.?\d*)%/i);
      const hscMatch = eligibility.match(/(?:12th|HSC|Plus Two)\s*[>=]+\s*(\d+\.?\d*)%/i);
      const cgpaMatch = eligibility.match(/CGPA\s*[>=]+\s*(\d+\.?\d*)/i);
      const arrearsMatch = eligibility.match(/No\s+(?:standing\s+)?arrears/i);

      if (sslcMatch) criteria.sslc = parseFloat(sslcMatch[1]);
      if (hscMatch) criteria.hsc = parseFloat(hscMatch[1]);
      if (cgpaMatch) criteria.cgpa = parseFloat(cgpaMatch[1]);
      if (arrearsMatch) criteria.noStandingArrears = true;
      
    } catch (err) {
      console.warn('Error parsing eligibility:', err, eligibility);
      return false;
    }

    // Calculate student CGPA
    let studentCgpa = student.ug_cgpa;
    if (!studentCgpa || studentCgpa === 0) {
      const semesters = [
        student.ug_sem1_gpa, student.ug_sem2_gpa, student.ug_sem3_gpa, student.ug_sem4_gpa,
        student.ug_sem5_gpa, student.ug_sem6_gpa, student.ug_sem7_gpa, student.ug_sem8_gpa
      ].filter(gpa => gpa && gpa > 0);
      
      studentCgpa = semesters.length > 0 
        ? (semesters.reduce((sum, gpa) => sum + gpa, 0) / semesters.length)
        : 0;
    }

    // Check eligibility conditions
    const tenthPercentage = student.tenth_percentage || 0;
    const twelfthPercentage = student.twelfth_percentage || 0;
    const hasArrears = student.has_arrears === 'Yes' || student.no_of_arrears > 0;

    const isEligible = (
      tenthPercentage >= criteria.sslc &&
      twelfthPercentage >= criteria.hsc &&
      studentCgpa >= criteria.cgpa &&
      (!criteria.noStandingArrears || !hasArrears)
    );

    return isEligible;
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Apply filters whenever filters or students change
  useEffect(() => {
    let filtered = [...students];

    // Filter by department
    if (filters.dept) {
      filtered = filtered.filter(student => {
        const dept = departments.find(d => d.Deptid === student.Deptid);
        return dept && dept.Deptacronym === filters.dept;
      });
    }

    // Filter by batch
    if (filters.batch) {
      filtered = filtered.filter(student => student.batch === filters.batch);
    }

    // Filter by year
    if (filters.year) {
      filtered = filtered.filter(student => {
        const calculatedYear = calculateYear(student.batch);
        return calculatedYear === filters.year;
      });
    }

    // Filter by company name
    if (filters.companyName) {
      filtered = filtered.filter(student => 
        student.eligibleCompanies.some(companyName => 
          companyName.toLowerCase().includes(filters.companyName.toLowerCase())
        )
      );
    }

    setFilteredStudents(filtered);
  }, [filters, students, departments]);

  // Download filtered data as Excel
  const handleDownloadExcel = () => {
    try {
      if (filteredStudents.length === 0) {
        setError('No data to download. Please check your filters.');
        return;
      }

      const data = filteredStudents.map((student, index) => ({
        'S.N': index + 1,
        'Reg No': student.regno,
        'Name': student.name,
        'Department': departments.find(d => d.Deptid === student.Deptid)?.Deptacronym || 'N/A',
        'Batch': student.batch,
        'Year': calculateYear(student.batch),
        '10th (%)': student.tenth_percentage || 'N/A',
        '12th (%)': student.twelfth_percentage || 'N/A',
        'UG CGPA': calculateCgpa(student),
        'Has Arrears': student.has_arrears,
        'No. of Arrears': student.no_of_arrears || 0,
        'Has PG': student.has_pg,
        'PG CGPA': student.pg_cgpa || 'N/A',
        'Eligible Companies': student.eligibleCompanies.length > 0 ? student.eligibleCompanies.join(', ') : 'None'
      }));

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Eligible Students');
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `EligibleStudents_${timestamp}.xlsx`;
      
      XLSX.writeFile(workbook, filename);
      
      console.log('📄 Excel file generated:', filename);
      
    } catch (error) {
      console.error('Error generating Excel file:', error);
      setError('Failed to generate Excel file. Please try again.');
    }
  };

  // Helper function to calculate year from batch
  const calculateYear = (batch) => {
    if (!batch) return 'N/A';
    try {
      const currentYear = new Date().getFullYear();
      const batchYear = parseInt(batch);
      return isNaN(batchYear) ? 'N/A' : (currentYear - batchYear + 1).toString();
    } catch {
      return 'N/A';
    }
  };

  // Helper function to calculate CGPA
  const calculateCgpa = (student) => {
    // Use stored CGPA if available
    if (student.ug_cgpa && student.ug_cgpa > 0) {
      return student.ug_cgpa.toFixed(2);
    }

    // Calculate from semester GPAs
    const semesters = [
      student.ug_sem1_gpa, student.ug_sem2_gpa, student.ug_sem3_gpa, student.ug_sem4_gpa,
      student.ug_sem5_gpa, student.ug_sem6_gpa, student.ug_sem7_gpa, student.ug_sem8_gpa
    ].filter(gpa => gpa && gpa > 0);
    
    return semesters.length > 0 
      ? (semesters.reduce((sum, gpa) => sum + gpa, 0) / semesters.length).toFixed(2)
      : 'N/A';
  };

  // Helper function to format arrears display
  const formatArrears = (student) => {
    if (student.has_arrears === 'No' || student.no_of_arrears === 0) {
      return 'No Arrears';
    }
    return `${student.no_of_arrears} Arrear${student.no_of_arrears > 1 ? 's' : ''}`;
  };

  // Generate unique filter options
  const uniqueDepts = [...new Set(departments.map(d => d.Deptacronym).filter(Boolean))].sort();
  const uniqueBatches = [...new Set(students.map(s => s.batch).filter(Boolean))].sort();
  const uniqueYears = [...new Set(students.map(s => calculateYear(s.batch)).filter(y => y !== 'N/A'))].sort();
  const uniqueCompanies = [...new Set(companies.map(c => c.company_name).filter(Boolean))].sort();

  // Reset filters function
  const resetFilters = () => {
    setFilters({
      dept: '',
      batch: '',
      year: '',
      companyName: ''
    });
  };

  // Retry function for failed requests
  const handleRetry = () => {
    window.location.reload(); // Simple retry by reloading the component
  };

  return (
    <>
      <Navbar />
      <br />
      <br />
      <br />
      <div className="eligible-students-container">
        <div className="main-container">
          {/* Header Section */}
          <div className="header-section">
            <h1 className="title">Eligible Students</h1>
            <p className="subtitle">Students with complete education records and company eligibility</p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="error-message">
              <strong>Error:</strong> {error}
              <div style={{ marginTop: '10px' }}>
                <button 
                  onClick={() => setError(null)} 
                  style={{ 
                    marginRight: '10px', 
                    padding: '5px 10px', 
                    background: '#d32f2f', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '4px',
                    cursor: 'pointer' 
                  }}
                >
                  Dismiss
                </button>
                <button 
                  onClick={handleRetry} 
                  style={{ 
                    padding: '5px 10px', 
                    background: '#388e3c', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '4px',
                    cursor: 'pointer' 
                  }}
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* Loading Display */}
          {loading && (
            <div className="loading">
              <div className="loading-spinner"></div>
              <p>Loading students and education data...</p>
              <small>This may take a few moments while we fetch and process the data...</small>
            </div>
          )}

          {/* Filters Section */}
          {!loading && students.length > 0 && (
            <div className="filters">
              <div className="filter-group">
                <label className="filter-label">Department</label>
                <select 
                  name="dept" 
                  value={filters.dept} 
                  onChange={handleFilterChange} 
                  aria-label="Filter by department"
                >
                  <option value="">All Departments</option>
                  {uniqueDepts.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label className="filter-label">Batch</label>
                <select 
                  name="batch" 
                  value={filters.batch} 
                  onChange={handleFilterChange} 
                  aria-label="Filter by batch"
                >
                  <option value="">All Batches</option>
                  {uniqueBatches.map(batch => (
                    <option key={batch} value={batch}>{batch}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label className="filter-label">Year</label>
                <select 
                  name="year" 
                  value={filters.year} 
                  onChange={handleFilterChange} 
                  aria-label="Filter by year"
                >
                  <option value="">All Years</option>
                  {uniqueYears.map(year => (
                    <option key={year} value={year}>Year {year}</option>
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
                  placeholder="Search company..."
                  aria-label="Filter by company name"
                />
              </div>

              <div className="filter-actions">
                <button 
                  className="reset-btn" 
                  onClick={resetFilters}
                  disabled={!filters.dept && !filters.batch && !filters.year && !filters.companyName}
                >
                  Reset Filters
                </button>
                <button 
                  className="download-btn" 
                  onClick={handleDownloadExcel} 
                  disabled={filteredStudents.length === 0}
                  aria-label="Download as Excel"
                >
                  Download Excel ({filteredStudents.length} records)
                </button>
              </div>
            </div>
          )}

          {/* Students Table */}
          <div className="table-container">
            {!loading && filteredStudents.length > 0 ? (
              <div className="table-wrapper">
                <table className="students-table">
                  <thead>
                    <tr>
                      <th>S.N</th>
                      <th>Reg No</th>
                      <th>Name</th>
                      <th>Department</th>
                      <th>Batch</th>
                      <th>Year</th>
                      <th>10th (%)</th>
                      <th>12th (%)</th>
                      <th>UG CGPA</th>
                      <th>Arrears</th>
                      <th>PG Status</th>
                      <th>Eligible Companies</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student, index) => (
                      <tr key={`${student.userid}-${index}`}>
                        <td>{index + 1}</td>
                        <td>{student.regno}</td>
                        <td>{student.name}</td>
                        <td>{departments.find(d => d.Deptid === student.Deptid)?.Deptacronym || 'N/A'}</td>
                        <td>{student.batch}</td>
                        <td>{calculateYear(student.batch)}</td>
                        <td>{student.tenth_percentage || 'N/A'}</td>
                        <td>{student.twelfth_percentage || 'N/A'}</td>
                        <td>{calculateCgpa(student)}</td>
                        <td>{formatArrears(student)}</td>
                        <td>
                          {student.has_pg === 'Yes' 
                            ? `Yes${student.pg_cgpa ? ` (${student.pg_cgpa.toFixed(2)})` : ''}` 
                            : 'No'
                          }
                        </td>
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
            ) : !loading && (
              <div className="empty-state">
                <div className="empty-icon">📊</div>
                <h3 className="empty-title">
                  {error ? 'Unable to Load Data' : 'No Eligible Students Found'}
                </h3>
                <p className="empty-description">
                  {error ? (
                    'There was an issue loading the student data. Please check your connection and try again.'
                  ) : Object.values(filters).some(f => f) ? (
                    "No students match the current filters. Try adjusting your search criteria."
                  ) : (
                    "No students have complete education records or meet company eligibility criteria."
                  )}
                </p>
                {error && (
                  <button 
                    onClick={handleRetry}
                    style={{ 
                      marginTop: '15px',
                      padding: '10px 20px', 
                      background: '#1976d2', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Try Again
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Summary Statistics */}
          {!loading && !error && students.length > 0 && (
            <div className="summary-stats">
              <div className="stat-card">
                <h4>Total Students</h4>
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
                <h4>Departments</h4>
                <span className="stat-number">{departments.length}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default EligibleStudents;