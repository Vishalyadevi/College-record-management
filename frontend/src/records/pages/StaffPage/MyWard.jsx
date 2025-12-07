import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaSearch, FaUserGraduate, FaUndo, FaEye } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const backendUrl = "http://localhost:4000";

const MyWard = () => {
  const navigate = useNavigate();
  
  const [userId, setUserId] = useState(null);
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(4);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Adjust items per page based on screen size
  useEffect(() => {
    const updateItemsPerPage = () => {
      if (window.innerWidth < 768) {
        setItemsPerPage(4);
      } else if (window.innerWidth < 1024) {
        setItemsPerPage(8);
      } else {
        setItemsPerPage(12);
      }
    };

    updateItemsPerPage();
    window.addEventListener("resize", updateItemsPerPage);
    return () => window.removeEventListener("resize", updateItemsPerPage);
  }, []);

  // Fetch all required data
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        setError(null);

        const userIdFromStorage = localStorage.getItem("userId");
        const token = localStorage.getItem("token");

        if (!userIdFromStorage || !token) {
          throw new Error("Authentication required. Please log in again.");
        }

        const config = {
          headers: { Authorization: `Bearer ${token}` },
        };

        console.log("Fetching data for userId:", userIdFromStorage);
        setUserId(userIdFromStorage);

        // Fetch students and departments in parallel
        const [studentsResponse, departmentsResponse] = await Promise.all([
          axios.get(`${backendUrl}/api/students`, config),
          axios.get(`${backendUrl}/api/departments`, config)
        ]);

        console.log("Students Response:", studentsResponse.data);
        console.log("Departments Response:", departmentsResponse.data);
        
        // Extract students array from response
        let allStudents = [];
        if (Array.isArray(studentsResponse.data)) {
          allStudents = studentsResponse.data;
        } else if (studentsResponse.data?.students) {
          allStudents = studentsResponse.data.students;
        } else if (studentsResponse.data?.data) {
          allStudents = studentsResponse.data.data;
        }

        // Extract departments array from response
        let allDepartments = [];
        if (Array.isArray(departmentsResponse.data)) {
          allDepartments = departmentsResponse.data;
        } else if (departmentsResponse.data?.departments) {
          allDepartments = departmentsResponse.data.departments;
        } else if (departmentsResponse.data?.data) {
          allDepartments = departmentsResponse.data.data;
        }

        console.log("Total Students fetched:", allStudents.length);
        console.log("Departments fetched:", allDepartments.length);

        if (allStudents.length > 0) {
          console.log("First Student Structure:", allStudents[0]);
        }

        setStudents(allStudents);
        setDepartments(allDepartments);

        // Filter students assigned to this staff member
        // staffId in student_details stores the staff's Userid
        const assignedStudents = allStudents.filter((student) => {
          const studentAssignedStaffUserId = student.staffId;
          const matchesStaff = String(studentAssignedStaffUserId) === String(userIdFromStorage);
          
          if (matchesStaff) {
            console.log(`✅ Match: Student ${student.regno || student.username} (Userid: ${student.Userid}) is assigned to staff ${userIdFromStorage}`);
          }
          
          return matchesStaff;
        });

        console.log("Assigned students found:", assignedStudents.length);
        console.log("Assigned students:", assignedStudents);
        
        setFilteredStudents(assignedStudents);

      } catch (error) {
        console.error("Error fetching data:", error);
        const errorMessage = error.response?.data?.message || error.message || "Failed to fetch data";
        setError(errorMessage);
        
        // If unauthorized, redirect to login
        if (error.response?.status === 401) {
          localStorage.clear();
          navigate("/records/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [navigate]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
    setCurrentPage(1);
  };

  const displayedStudents = filteredStudents.filter(
    (student) => {
      const username = student.username || '';
      const regno = student.regno || '';
      
      return username.toLowerCase().includes(searchTerm) ||
             regno.toLowerCase().includes(searchTerm);
    }
  );

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = displayedStudents.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(displayedStudents.length / itemsPerPage);

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleView = (student) => {
    console.log("Navigating to student biodata:", student.Userid);
    navigate(`/records/student-biodata/${student.Userid}`);
  };

  const handleRetry = () => {
    window.location.reload();
  };

  // Show error state
  if (error) {
    return (
      <div className="fixed inset-0 bg-gradient-to-r from-red-50 to-red-100 p-6 ml-64 mt-16 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-red-800 mb-4">Error Loading Data</h2>
          <p className="text-red-600 mb-6">{error}</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Retry
            </button>
            <button
              onClick={() => navigate("/records/staff")}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-r from-blue-50 to-purple-50 p-6 ml-64 mt-16 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your wards...</p>
          <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-r from-blue-50 to-purple-50 p-6 ml-64 mt-16 flex flex-col overflow-hidden">
     

      {/* Search Section */}
      <div className="bg-white p-4 rounded-lg shadow-lg mb-6">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Registration Number or Username"
              value={searchTerm}
              onChange={handleSearch}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => {
              setSearchTerm("");
              setCurrentPage(1);
            }}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg flex items-center justify-center hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          >
            <FaUndo className="mr-2" /> Reset
          </button>
        </div>
        {searchTerm && (
          <p className="mt-2 text-sm text-gray-600">
            Found {displayedStudents.length} student(s) matching "{searchTerm}"
          </p>
        )}
      </div>

      {/* Students Table */}
      <div className="flex-1 overflow-hidden">
        <div className="bg-white rounded-lg shadow-lg h-full flex flex-col">
          {displayedStudents.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <FaUserGraduate className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {filteredStudents.length === 0 ? "No Students Assigned" : "No Students Found"}
                </h3>
                <p className="text-gray-600">
                  {filteredStudents.length === 0 
                    ? "No students have been assigned to you yet."
                    : `No students match your search "${searchTerm}".`
                  }
                </p>
                {searchTerm && (
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setCurrentPage(1);
                    }}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-y-auto flex-1">
                <table className="min-w-full">
                  <thead className="bg-gradient-to-r from-blue-500 to-purple-600 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                        Profile
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                        Department
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                        Batch
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                        Reg No
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentItems.map((student, index) => {
                      const username = student.username || 'N/A';
                      const regno = student.regno || 'N/A';
                      const batch = student.batch || 'N/A';
                      const deptAcronym = student.Deptacronym || 'N/A';
                      const userId = student.Userid;
                      const image = student.image;

                      return (
                        <tr key={userId || index} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <img
                              className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                              src={
                                image 
                                  ? `${backendUrl}${image}` 
                                  : '/default-avatar.png'
                              }
                              alt={`${username}'s avatar`}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '/default-avatar.png';
                              }}
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {username}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {deptAcronym}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {batch}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                            {regno}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <button
                              onClick={() => handleView({...student, Userid: userId})}
                              className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition group"
                              title="View Student Details"
                            >
                              <FaEye className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-gray-50 py-4 px-6 border-t">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, displayedStudents.length)} of {displayedStudents.length} students
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={goToPreviousPage}
                        disabled={currentPage === 1}
                        className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <span className="px-3 py-1 text-sm text-gray-700 bg-gray-100 rounded-lg">
                        {currentPage} / {totalPages}
                      </span>
                      <button
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyWard;