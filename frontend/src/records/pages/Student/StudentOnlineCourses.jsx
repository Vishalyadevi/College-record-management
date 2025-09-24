import React, { useState, useEffect } from "react";
import { FaEye, FaEdit, FaTrash } from "react-icons/fa";
import { motion } from "framer-motion";
import { useOnlineCourses } from "../../contexts/OnlineCoursesContext"; // Import the context

const StudentOnlineCourses = () => {
  const {
    onlineCourses,
    pendingCourses,
    loading,
    error,
    fetchOnlineCourses,
    fetchPendingCourses,
    addOnlineCourse,
    updateOnlineCourse,
    deleteOnlineCourse,
  } = useOnlineCourses(); // Use the context

  const [formData, setFormData] = useState({
    course_name: "",
    type: "NPTEL",
    other_type: "",
    provider_name: "",
    instructor_name: "",
    status: "Ongoing",
    certificate: null,
    additional_info: "",
  });

  const [editingCourseId, setEditingCourseId] = useState(null); // Track which course is being edited

  // Fetch courses on component mount
  useEffect(() => {
    fetchOnlineCourses();
    fetchPendingCourses();
  }, [fetchOnlineCourses, fetchPendingCourses]);

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    setFormData({
      ...formData,
      [name]: type === "file" ? files[0] : value,
    });
  };

  // ✅ Add new course
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value);
      });

      // Append Userid from localStorage
      const Userid = localStorage.getItem("userId");
      if (Userid) {
        formDataToSend.append("Userid", Userid);
      } else {
        throw new Error("User ID not found in localStorage");
      }

      await addOnlineCourse(formDataToSend); // Use context method
      resetForm();
    } catch (err) {
      console.error("Error adding course:", err);
    }
  };

  // ✅ Edit course (populate form with course data)
  const handleEdit = (course) => {
    setEditingCourseId(course.id);
    setFormData({
      course_name: course.course_name,
      type: course.type,
      other_type: course.other_type || "",
      provider_name: course.provider_name,
      instructor_name: course.instructor_name,
      status: course.status,
      certificate: null, // Reset certificate file input
      additional_info: course.additional_info,
    });
  };

  // ✅ Update existing course
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value);
      });

      // Append Userid from localStorage
      const Userid = localStorage.getItem("userId");
      if (Userid) {
        formDataToSend.append("Userid", Userid);
      } else {
        throw new Error("User ID not found in localStorage");
      }

      await updateOnlineCourse(editingCourseId, formDataToSend); // Use context method
      resetForm();
    } catch (err) {
      console.error("Error updating course:", err);
    }
  };

  // ✅ Delete course
  const handleDelete = async (courseId) => {
    try {
      await deleteOnlineCourse(courseId); // Use context method
    } catch (err) {
      console.error("Error deleting course:", err);
    }
  };

  // ✅ Reset form
  const resetForm = () => {
    setFormData({
      course_name: "",
      type: "NPTEL",
      other_type: "",
      provider_name: "",
      instructor_name: "",
      status: "Ongoing",
      certificate: null,
      additional_info: "",
    });
    setEditingCourseId(null);
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  // Combine pending and approved courses into a single array
  const allCourses = [...pendingCourses, ...onlineCourses];

  return (
    <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow-md w-full min-h-screen">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        Online Courses
      </h2>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full p-6 bg-white rounded-lg shadow-lg mb-6"
      >
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          {editingCourseId ? "Edit Course" : "Add Course"}
        </h3>
        <form onSubmit={editingCourseId ? handleUpdate : handleSubmit} className="space-y-4">
          {/* Grid Container */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Course Name */}
            <div className="col-span-1">
              <label className="block text-gray-700 font-medium mb-1">Course Name</label>
              <input
                type="text"
                name="course_name"
                value={formData.course_name}
                onChange={handleChange}
                className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter course name"
                required
              />
            </div>

            {/* Type */}
            <div className="col-span-1">
              <label className="block text-gray-700 font-medium mb-1">Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="NPTEL">NPTEL</option>
                <option value="Coursera">Coursera</option>
                <option value="Udemy">Udemy</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Other Type (Conditional) */}
            {formData.type === "Other" && (
              <div className="col-span-1">
                <label className="block text-gray-700 font-medium mb-1">Specify Type</label>
                <input
                  type="text"
                  name="other_type"
                  value={formData.other_type}
                  onChange={handleChange}
                  className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter type"
                  required
                />
              </div>
            )}

            {/* Provider Name */}
            <div className="col-span-1">
              <label className="block text-gray-700 font-medium mb-1">Provider Name</label>
              <input
                type="text"
                name="provider_name"
                value={formData.provider_name}
                onChange={handleChange}
                className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter provider name"
              />
            </div>

            {/* Instructor Name */}
            <div className="col-span-1">
              <label className="block text-gray-700 font-medium mb-1">Instructor Name</label>
              <input
                type="text"
                name="instructor_name"
                value={formData.instructor_name}
                onChange={handleChange}
                className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter instructor name"
              />
            </div>

            {/* Status */}
            <div className="col-span-1">
              <label className="block text-gray-700 font-medium mb-1">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Ongoing">Ongoing</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            {/* Certificate (Conditional) */}
            {formData.status === "Completed" && (
              <div className="col-span-1">
                <label className="block text-gray-700 font-medium mb-1">Certificate</label>
                <input
                  type="file"
                  name="certificate"
                  onChange={handleChange}
                  className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {/* Additional Info */}
            <div className="col-span-1 md:col-span-2 lg:col-span-4">
              <label className="block text-gray-700 font-medium mb-1">Additional Info</label>
              <textarea
                name="additional_info"
                value={formData.additional_info}
                onChange={handleChange}
                className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter additional information"
              />
            </div>
          </div>

          {/* Submit/Update Button */}
          <div className="flex justify-center mt-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg shadow-md hover:shadow-lg transition"
            >
              {editingCourseId ? "Update Course" : "Add Course"}
            </motion.button>
          </div>
        </form>
      </motion.div>

      {/* Combined Courses Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full p-6 bg-white rounded-lg shadow-lg"
      >
        <h3 className="text-xl font-semibold text-gray-800 mb-4">All Courses</h3>
        {allCourses.length === 0 ? (
          <p className="text-gray-500">No courses available.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <tr>
                  <th className="border border-gray-300 p-3 text-left">Course Name</th>
                  <th className="border border-gray-300 p-3 text-left">Type</th>
                  <th className="border border-gray-300 p-3 text-left">Provider</th>
                  <th className="border border-gray-300 p-3 text-left">Instructor Name</th>
                  <th className="border border-gray-300 p-3 text-left">Status</th>
                  <th className="border border-gray-300 p-3 text-left">Certificate</th>
                  <th className="border border-gray-300 p-3 text-left">Additional Info</th>
                  <th className="border border-gray-300 p-3 text-left">Approval Status</th>
                  <th className="border border-gray-300 p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {allCourses.map((course) => (
                  <tr key={course.id} className="bg-white hover:bg-gray-50 transition">
                    <td className="border border-gray-300 p-3">{course.course_name}</td>
                    <td className="border border-gray-300 p-3">
                      {course.type}
                      {course.other_type && (
                        <span className="text-gray-500 text-sm ml-2">({course.other_type})</span>
                      )}
                    </td>
                    <td className="border border-gray-300 p-3">{course.provider_name}</td>
                    <td className="border border-gray-300 p-3">{course.instructor_name}</td>
                    <td className="border border-gray-300 p-3">
                      <span
                        className={`px-2 py-1 rounded-full text-sm ${
                          course.status === "pending"
                            ? "bg-orange-100 text-orange-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {course.status}
                      </span>
                    </td>
                    <td className="border border-gray-300 p-3">
                      {course.certificate_file ? (
                        <a
                          href={`http://localhost:4000/uploads/certificates/${course.certificate_file}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-700 transition"
                        >
                          <FaEye className="inline-block text-xl" />
                        </a>
                      ) : (
                        "No Certificate"
                      )}
                    </td>
                    <td className="border border-gray-300 p-3">{course.additional_info}</td>
                    <td className="border border-gray-300 p-3">
                      <span
                        className={`px-2 py-1 rounded-full text-sm ${
                          course.pending==1? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {course.pending==1? "Pending" : "Approved"}
                      </span>
                    </td>
                    <td className="border border-gray-300 p-3">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(course)}
                          className="text-blue-500 hover:text-blue-700 transition"
                        >
                          <FaEdit className="inline-block text-xl" />
                        </button>
                        <button
                          onClick={() => handleDelete(course.id)}
                          className="text-red-500 hover:text-red-700 transition"
                        >
                          <FaTrash className="inline-block text-xl" />
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
    </div>
  );
};

export default StudentOnlineCourses;