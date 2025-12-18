import React, { useState, useEffect } from "react";
import { FaEdit, FaTrash, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { motion } from "framer-motion";
import { useNPTEL } from "../../contexts/NPTELContext";

const StudentNPTEL = () => {
  const {
    courses,
    enrollments,
    loading,
    error,
    fetchAllCourses,
    fetchStudentEnrollments,
    enrollCourse,
    updateEnrollment,
    deleteEnrollment,
    clearError,
  } = useNPTEL();

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showEnrollForm, setShowEnrollForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    assessment_marks: "",
    exam_marks: "",
    status: "In Progress",
    credit_transfer: "No",
  });
  const [showCreditConfirmation, setShowCreditConfirmation] = useState(false);

  const userId = parseInt(localStorage.getItem("userId"));

  useEffect(() => {
    fetchAllCourses();
    if (userId) {
      fetchStudentEnrollments(userId);
    }
  }, [fetchAllCourses, fetchStudentEnrollments, userId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "credit_transfer" && value === "Yes") {
      setShowCreditConfirmation(true);
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const confirmCreditTransfer = (confirmed) => {
    if (confirmed) {
      setFormData({ ...formData, credit_transfer: "Yes" });
    } else {
      setFormData({ ...formData, credit_transfer: "No" });
    }
    setShowCreditConfirmation(false);
  };

  const handleEnrollClick = (course) => {
    setSelectedCourse(course);
    setShowEnrollForm(true);
    setEditingId(null);
    setFormData({
      assessment_marks: "",
      exam_marks: "",
      status: "In Progress",
      credit_transfer: "No",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();

    try {
      const data = {
        Userid: userId,
        course_id: selectedCourse.id,
        assessment_marks: parseFloat(formData.assessment_marks) || 0,
        exam_marks: parseFloat(formData.exam_marks) || 0,
        status: formData.status,
        credit_transfer: formData.credit_transfer,
      };

      if (editingId) {
        await updateEnrollment(editingId, data);
      } else {
        await enrollCourse(data);
      }

      resetForm();
    } catch (err) {
      console.error("Error submitting enrollment:", err);
    }
  };

  const resetForm = () => {
    setFormData({
      assessment_marks: "",
      exam_marks: "",
      status: "In Progress",
      credit_transfer: "No",
    });
    setSelectedCourse(null);
    setShowEnrollForm(false);
    setEditingId(null);
  };

  const handleEdit = (enrollment) => {
    setSelectedCourse(enrollment.course);
    setFormData({
      assessment_marks: enrollment.assessment_marks || "",
      exam_marks: enrollment.exam_marks || "",
      status: enrollment.status,
      credit_transfer: enrollment.credit_transfer,
    });
    setEditingId(enrollment.id);
    setShowEnrollForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this enrollment?")) {
      try {
        await deleteEnrollment(id, userId);
      } catch (err) {
        console.error("Error deleting enrollment:", err);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800";
      case "In Progress":
        return "bg-blue-100 text-blue-800";
      case "Not Completed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getGradeColor = (grade) => {
    if (grade === "O" || grade === "A+" || grade === "A") return "text-green-600";
    if (grade === "B+" || grade === "B") return "text-blue-600";
    if (grade === "C") return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow-md w-full min-h-screen">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        NPTEL Courses
      </h2>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {loading && (
        <div className="mb-4 p-4 bg-blue-100 text-blue-700 rounded-lg text-center">
          Loading...
        </div>
      )}

      {/* Credit Transfer Confirmation Modal */}
      {showCreditConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white p-6 rounded-lg shadow-xl max-w-md"
          >
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Confirm Credit Transfer
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to transfer credits for this course? Your grade will be calculated based on your marks.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => confirmCreditTransfer(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
              >
                No
              </button>
              <button
                onClick={() => confirmCreditTransfer(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Yes
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Enrollment Form */}
      {showEnrollForm && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full p-6 bg-white rounded-lg shadow-lg mb-6"
        >
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            {editingId ? "Update Enrollment" : `Enroll in ${selectedCourse?.course_name}`}
          </h3>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  Course Name
                </label>
                <input
                  type="text"
                  value={selectedCourse?.course_name || ""}
                  className="w-full p-2 border rounded bg-gray-100"
                  disabled
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  Instructor
                </label>
                <input
                  type="text"
                  value={selectedCourse?.instructor_name || ""}
                  className="w-full p-2 border rounded bg-gray-100"
                  disabled
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  Assessment Marks (0-100)
                </label>
                <input
                  type="number"
                  name="assessment_marks"
                  value={formData.assessment_marks}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  Exam Marks (0-100)
                </label>
                <input
                  type="number"
                  name="exam_marks"
                  value={formData.exam_marks}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Not Completed">Not Completed</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  Credit Transfer
                </label>
                <select
                  name="credit_transfer"
                  value={formData.credit_transfer}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
            </div>

            {formData.credit_transfer === "Yes" && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Your grade will be calculated based on total marks:
                  Assessment + Exam = {(parseFloat(formData.assessment_marks) || 0) + (parseFloat(formData.exam_marks) || 0)} marks
                </p>
              </div>
            )}

            <div className="flex justify-center space-x-4 mt-6">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={resetForm}
                className="px-6 py-2 bg-gray-500 text-white rounded-lg shadow-md hover:shadow-lg transition"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg shadow-md hover:shadow-lg transition"
                disabled={loading}
              >
                {loading ? "Processing..." : editingId ? "Update" : "Enroll"}
              </motion.button>
            </div>
          </form>
        </motion.div>
      )}

      {/* My Enrollments */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full p-6 bg-white rounded-lg shadow-lg mb-6"
      >
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          My Enrolled Courses
        </h3>
        {enrollments.length === 0 && !loading ? (
          <p className="text-gray-500">No enrollments yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <tr>
                  <th className="border border-gray-300 p-3 text-left">Course</th>
                  <th className="border border-gray-300 p-3 text-left">Provider</th>
                  <th className="border border-gray-300 p-3 text-left">Instructor</th>
                  <th className="border border-gray-300 p-3 text-left">Department</th>
                  <th className="border border-gray-300 p-3 text-left">Weeks</th>
                  <th className="border border-gray-300 p-3 text-left">Status</th>
                  <th className="border border-gray-300 p-3 text-left">Marks</th>
                  <th className="border border-gray-300 p-3 text-left">Grade</th>
                  <th className="border border-gray-300 p-3 text-left">Credit Transfer</th>
                  <th className="border border-gray-300 p-3 text-left">Verification</th>
                  <th className="border border-gray-300 p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((enrollment) => (
                  <tr key={enrollment.id} className="bg-white hover:bg-gray-50 transition">
                    <td className="border border-gray-300 p-3 font-medium">
                      {enrollment.course?.course_name}
                    </td>
                    <td className="border border-gray-300 p-3">
                      {enrollment.course?.provider_name}
                    </td>
                    <td className="border border-gray-300 p-3">
                      {enrollment.course?.instructor_name}
                    </td>
                    <td className="border border-gray-300 p-3">
                      {enrollment.course?.department || "N/A"}
                    </td>
                    <td className="border border-gray-300 p-3">
                      {enrollment.course?.weeks}
                    </td>
                    <td className="border border-gray-300 p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(enrollment.status)}`}>
                        {enrollment.status}
                      </span>
                    </td>
                    <td className="border border-gray-300 p-3">
                      <div className="text-sm">
                        <div>Assessment: {enrollment.assessment_marks}</div>
                        <div>Exam: {enrollment.exam_marks}</div>
                        <div className="font-semibold">Total: {enrollment.total_marks}</div>
                      </div>
                    </td>
                    <td className="border border-gray-300 p-3">
                      <span className={`text-2xl font-bold ${getGradeColor(enrollment.grade)}`}>
                        {enrollment.grade}
                      </span>
                    </td>
                    <td className="border border-gray-300 p-3">
                      <div className="flex items-center">
                        {enrollment.credit_transfer === "Yes" ? (
                          <>
                            <FaCheckCircle className="text-green-600 mr-2" />
                            <span className="text-sm">
                              Yes ({enrollment.credit_transfer_grade})
                            </span>
                          </>
                        ) : (
                          <>
                            <FaTimesCircle className="text-red-600 mr-2" />
                            <span className="text-sm">No</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="border border-gray-300 p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        enrollment.tutor_verification_status
                          ? "bg-green-100 text-green-800"
                          : enrollment.pending
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}>
                        {enrollment.tutor_verification_status
                          ? "Verified"
                          : enrollment.pending
                          ? "Pending"
                          : "Not Verified"}
                      </span>
                    </td>
                    <td className="border border-gray-300 p-3">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(enrollment)}
                          className={`p-1 ${enrollment.pending ? 
                            "text-blue-600 hover:text-blue-800" : 
                            "text-gray-400 cursor-not-allowed"} transition`}
                          title={enrollment.pending ? "Edit" : "Cannot edit verified enrollments"}
                          disabled={!enrollment.pending}
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(enrollment.id)}
                          className={`p-1 ${enrollment.pending ? 
                            "text-red-600 hover:text-red-800" : 
                            "text-gray-400 cursor-not-allowed"} transition`}
                          title={enrollment.pending ? "Delete" : "Cannot delete verified enrollments"}
                          disabled={!enrollment.pending}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Available Courses */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full p-6 bg-white rounded-lg shadow-lg"
      >
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          Available Courses
        </h3>
        {courses.length === 0 && !loading ? (
          <p className="text-gray-500">No courses available.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) => {
              const isEnrolled = enrollments.some(e => e.course_id === course.id);
              return (
                <motion.div
                  key={course.id}
                  whileHover={{ scale: 1.02 }}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-400 transition"
                >
                  <h4 className="font-bold text-lg text-gray-800 mb-2">
                    {course.course_name}
                  </h4>
                  <div className="text-sm text-gray-600 space-y-1 mb-3">
                    <p><strong>Provider:</strong> {course.provider_name}</p>
                    <p><strong>Instructor:</strong> {course.instructor_name}</p>
                    <p><strong>Department:</strong> {course.department || "N/A"}</p>
                    <p><strong>Duration:</strong> {course.weeks} weeks</p>
                  </div>
                  <button
                    onClick={() => handleEnrollClick(course)}
                    disabled={isEnrolled}
                    className={`w-full py-2 rounded-lg font-semibold transition ${
                      isEnrolled
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    {isEnrolled ? "Already Enrolled" : "Enroll Now"}
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default StudentNPTEL;