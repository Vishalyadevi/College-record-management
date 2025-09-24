import React, { useEffect, useState } from "react";

// Mock Navbar component
import Navbar from "./navbar";

const Status = () => {
  const [placedStudents, setPlacedStudents] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({});

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      fetchPlacedStudentsByCompany(selectedCompany);
    } else {
      fetchAllPlacedStudents();
    }
  }, [selectedCompany]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [studentsResponse, companiesResponse, statsResponse] = await Promise.all([
        fetch("http://localhost:4000/api/placement/placed-students"),
        fetch("http://localhost:4000/api/placement/placed-student-companies"),
        fetch("http://localhost:4000/api/placement/stats")
      ]);
      
      if (!studentsResponse.ok || !companiesResponse.ok || !statsResponse.ok) {
        throw new Error('Failed to fetch data');
      }
      
      const studentsData = await studentsResponse.json();
      const companiesData = await companiesResponse.json();
      const statsData = await statsResponse.json();
      
      setPlacedStudents(studentsData);
      setCompanies(companiesData);
      setStats(statsData);
      setError("");
    } catch (error) {
      console.error("Error fetching initial data:", error);
      setError("Failed to fetch placement data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllPlacedStudents = async () => {
    try {
      const response = await fetch("http://localhost:4000/api/placement/placed-students");
      if (!response.ok) throw new Error('Failed to fetch students');
      
      const data = await response.json();
      setPlacedStudents(data);
    } catch (error) {
      console.error("Error fetching all placed students:", error);
      setError("Failed to fetch placement data.");
    }
  };

  const fetchPlacedStudentsByCompany = async (companyName) => {
    try {
      const response = await fetch(`http://localhost:4000/api/placement/placed-students?company=${encodeURIComponent(companyName)}`);
      if (!response.ok) throw new Error('Failed to fetch students by company');
      
      const data = await response.json();
      setPlacedStudents(data);
    } catch (error) {
      console.error("Error fetching students by company:", error);
      setError("Failed to fetch company-specific data.");
    }
  };

  const filteredStudents = placedStudents.filter((student) => {
    const matchesSearch = 
      student.regno.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.role.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const getDepartmentName = (deptId) => {
    switch(deptId) {
      case 1: return "Computer Science and Engineering";
      case 3: return "Electronics and Communication Engineering";
      default: return `Department ${deptId}`;
    }
  };

  const formatPackage = (packageValue) => {
    if (!packageValue) return "N/A";
    return `${parseFloat(packageValue).toFixed(1)} LPA`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading placement data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Student Placement Status</h2>

        {/* Statistics Cards */}
        {Object.keys(stats).length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Placements</h3>
              <p className="text-3xl font-bold text-blue-600">{stats.total_students || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Average Package</h3>
              <p className="text-3xl font-bold text-green-600">
                {stats.avg_salary ? `${parseFloat(stats.avg_salary).toFixed(1)} LPA` : "N/A"}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Highest Package</h3>
              <p className="text-3xl font-bold text-purple-600">
                {stats.highest_salary ? `${parseFloat(stats.highest_salary).toFixed(1)} LPA` : "N/A"}
              </p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="company-select" className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Company:
              </label>
              <select
                id="company-select"
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Companies</option>
                {companies.map((company, index) => (
                  <option key={index} value={company.company_name}>
                    {company.company_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Search:
              </label>
              <input
                id="search"
                type="text"
                placeholder="Search by Register Number, Name, Company, or Role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {filteredStudents.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-600 text-lg">
              {searchTerm || selectedCompany 
                ? "No students found matching your criteria." 
                : "No placed students found."}
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <p className="text-gray-600">
                Showing {filteredStudents.length} placement{filteredStudents.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full table-auto divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Reg No
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Department
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Batch
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Company
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Package
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Year
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredStudents.map((student, index) => (
                      <tr key={`${student.id}-${index}`} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                          {student.regno}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {student.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs break-words">
                          {student.personal_email || student.tutorEmail || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs break-words">
                          {getDepartmentName(student.Deptid)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {student.batch || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs break-words">
                          {student.company_name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs break-words">
                          {student.role}
                        </td>
                        <td className="px-6 py-4 text-sm text-green-600 font-semibold whitespace-nowrap">
                          {formatPackage(student.package)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {student.year}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                          {formatDate(student.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredStudents.length > 10 && (
                <div className="bg-gray-50 px-6 py-3">
                  <p className="text-sm text-gray-600">
                    Total records: {filteredStudents.length}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Status;