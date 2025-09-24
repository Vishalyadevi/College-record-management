import React, { useState, useEffect } from "react";
import { useStudent } from "../../contexts/StudentContext";
import { useUser } from "../../contexts/UserContext"; // Import useUser for handleExport
import { FaSearch, FaUserGraduate, FaUndo, FaEye, FaFileExport } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
const backendUrl = "http://localhost:4000";

function StudentList() {
  const navigate=useNavigate();
  const { students, staff, departments, loading } = useStudent();
  const { handleExport, user } = useUser(); // Use handleExport from UserContext
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchRegNo, setSearchRegNo] = useState("");
  const [searchDepartment, setSearchDepartment] = useState("");
  const [searchBatch, setSearchBatch] = useState("");
  const [searchTutor, setSearchTutor] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(4);

  // Get the user's department ID
  const userDeptId = user?.Deptid || null;

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

  useEffect(() => {
    // Filter students based on the user's department
    if (userDeptId !== null) {
      const filtered = students.filter((student) => student.Deptid === userDeptId);
      setFilteredStudents(filtered);
    } else {
      setFilteredStudents(students);
    }
  }, [students, userDeptId]);

  const handleSearch = () => {
    const filtered = students.filter((student) => {
      const regNoMatch = searchRegNo
        ? String(student.regno).toLowerCase().includes(searchRegNo.toLowerCase())
        : true;

      const batchMatch = searchBatch
        ? String(student.batch).toLowerCase().includes(searchBatch.toLowerCase())
        : true;

      const departmentMatch = searchDepartment
        ? departments
            .find((dept) => dept.Deptid === student.Deptid)
            ?.Deptacronym?.toLowerCase()
            .includes(searchDepartment.toLowerCase())
        : true;

      const tutorMatch = searchTutor
        ? student.tutorName?.toLowerCase().includes(searchTutor.toLowerCase())
        : true;

      return regNoMatch && batchMatch && departmentMatch && tutorMatch;
    });

    setFilteredStudents(filtered);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearchRegNo("");
    setSearchDepartment("");
    setSearchBatch("");
    setSearchTutor("");
    setFilteredStudents(students);
    setCurrentPage(1);
  };

  const handleView = (student) => {
    navigate(`/records/student-biodata/${student.Userid}`); // Navigate to biodata page
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedStudent(null);
  };

  // Export functionality for students
  const handleExportStudents = async () => {
    const columns = ["regno", "username", "batch", "Deptid", "tutorName"]; // Columns to export
    const filters = {
      regno: searchRegNo,
      batch: searchBatch,
      Deptid: searchDepartment,
      tutorName: searchTutor,
    };

    try {
      await handleExport("student", columns, filters); // Call handleExport with student-specific data
    } catch (error) {
      console.error("Error exporting student data:", error);
    }
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredStudents.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-600">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-r from-purple-50 to-blue-50 p-6 ml-64 mt-16 flex flex-col overflow-hidden">
      {/* Search Section */}
      <div className="bg-white p-4 rounded-lg shadow-lg">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="Search by Reg No"
            value={searchRegNo}
            onChange={(e) => setSearchRegNo(e.target.value)}
            className="p-2 border border-purple-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
          />
          {/* Conditionally render department filter based on user's Deptid */}
          {userDeptId === null && (
            <input
              type="text"
              placeholder="Search by department (acronym)"
              value={searchDepartment}
              onChange={(e) => setSearchDepartment(e.target.value)}
              className="p-2 border border-purple-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            />
          )}
          <input
            type="text"
            placeholder="Search by batch"
            value={searchBatch}
            onChange={(e) => setSearchBatch(e.target.value)}
            className="p-2 border border-purple-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
          />
          <input
            type="text"
            placeholder="Search by tutor"
            value={searchTutor}
            onChange={(e) => setSearchTutor(e.target.value)}
            className="p-2 border border-purple-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
          />
          <button
            onClick={handleSearch}
            className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg flex items-center justify-center hover:from-purple-600 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-purple-500 transition text-sm"
          >
            <FaSearch className="mr-1" /> Search
          </button>
          <button
            onClick={resetFilters}
            className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg flex items-center justify-center hover:from-purple-600 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-purple-500 transition text-sm"
          >
            <FaUndo className="mr-1" /> Reset
          </button>
          {/* Export Button */}
          <button
            onClick={handleExportStudents}
            className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg flex items-center justify-center hover:from-purple-600 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-purple-500 transition text-sm"
          >
            <FaFileExport className="mr-1" /> Export
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="mt-6 flex-1 overflow-hidden">
        <div className="bg-white rounded-lg shadow-lg h-full flex flex-col">
          <div className="overflow-y-auto flex-1">
            <table className="min-w-full">
              {filteredStudents.length > 0 && (
                <thead className="bg-gradient-to-r from-purple-500 to-blue-500 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Image</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Reg No</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Batch</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Tutor</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
              )}
              <tbody className="bg-white divide-y divide-gray-200">
                {currentItems.length > 0 ? (
                  currentItems.map((student, index) => {
                    const username = student.username || "Unknown";
                    const batch = student.batch || "No batch";
                    const email = student.email || "No email";
                    const regNo = student.regno || "No Reg No";
                    const image = `${backendUrl}${student.image}` || `${backendUrl}/uploads/default.jpg`;
                    const tutorName = student.tutorName || "NO tutor";

                    const staffArray = Array.isArray(staff?.staff) ? staff.staff : [];
                    const tutor = staffArray.find((t) => t.name === student.tutorName) || null;

                    const department = Array.isArray(departments)
                      ? departments.find((dept) => dept.Deptid === student.Deptid)?.Deptacronym || "N/A"
                      : "N/A";

                    return (
                      <tr key={index} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          {image ? (
                            <img
                              src={image}
                              alt={`${username}'s avatar`}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                              <FaUserGraduate className="w-6 h-6 text-purple-500" />
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {regNo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {username}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {batch}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {department}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {tutor ? tutor.name : "NO tutor"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                  <button
                                                    onClick={() => handleView(student)}
                                                    className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                                  >
                                                    <FaEye className="w-4 h-4" />
                                                  </button>
                                                </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                      No students found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="bg-gray-50 py-4 px-6 border-t">
              <div className="flex justify-between">
                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className="p-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-700">Page {currentPage} of {totalPages}</span>
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="p-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal for Viewing Student Details */}
      {isModalOpen && selectedStudent && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-lg w-11/12 md:w-1/2 lg:w-1/3 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">{selectedStudent.username || "Unknown"}</h2>
              <button
                onClick={closeModal}
                className="p-2 text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                &times;
              </button>
            </div>
            <div className="flex flex-col items-center">
              {selectedStudent.image ? (
                <img
                  src={selectedStudent.image}
                  alt={`${selectedStudent.username || "Unknown"}'s avatar`}
                  className="w-32 h-32 rounded-full object-cover mb-4"
                />
              ) : (
                <div className="w-32 h-32 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <FaUserGraduate className="w-16 h-16 text-purple-500" />
                </div>
              )}
              <div className="text-center">
                <p className="text-gray-600">Reg No: {selectedStudent.regno || "No Reg No"}</p>
                <p className="text-gray-600">Batch: {selectedStudent.batch || "No batch"}</p>
                <p className="text-gray-600">Department: {departments.find((dept) => dept.Deptid === selectedStudent.Deptid)?.Deptacronym || "N/A"}</p>
                <p className="text-gray-600">Tutor: {staff?.staff?.find((t) => t.name === selectedStudent.tutorName)?.name || "No tutor assigned"}</p>
                <p className="text-gray-600 mt-4">More details coming soon...</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentList;