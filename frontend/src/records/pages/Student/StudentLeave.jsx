import React, { useState, useEffect, useContext } from "react";
import { FaEdit, FaTrash, FaCalendarAlt, FaFileUpload, FaEye, FaTimes } from "react-icons/fa";
import { motion } from "framer-motion";
import { useLeave } from "../../contexts/LeaveContext";
import { useUser } from "../../contexts/UserContext";

const backendUrl = "http://localhost:4000";

const StudentLeave = () => {
  const {
    pendingLeaves,
    approvedLeaves,
    loading,
    error,
    addLeave,
    updateLeave,
    deleteLeave,
    fetchPendingLeaves,
    fetchApprovedLeaves,
  } = useLeave();

  const { user } = useUser();
  const [editingLeave, setEditingLeave] = useState(null);

  // Fetch leaves on component mount
  useEffect(() => {
    fetchPendingLeaves();
    fetchApprovedLeaves();
  }, [fetchPendingLeaves, fetchApprovedLeaves]);

  // Filter leaves to show only those applied by the current user
  const userLeaves = [...pendingLeaves, ...approvedLeaves]
    .filter((leave) => leave.Userid === user.Userid)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Sort by most recent

  // Handle Edit Click
  const handleEdit = (leave) => {
    // Only allow editing pending leaves
    if (leave.leave_status === "pending") {
      setEditingLeave(leave);
    }
  };

  // Handle Delete Click
  const handleDelete = async (id) => {
    await deleteLeave(id);
    fetchPendingLeaves();
    fetchApprovedLeaves();
  };

  // Handle Save or Update Leave
  const handleSaveLeave = async (leaveData) => {
    if (editingLeave) {
      await updateLeave(editingLeave.id, leaveData);
    } else {
      await addLeave(leaveData);
    }
    setEditingLeave(null); // Reset editing state after saving
    fetchPendingLeaves(); // Refresh pending leaves
    fetchApprovedLeaves(); // Refresh approved leaves
  };

  // Handle Cancel Edit
  const handleCancelEdit = () => {
    setEditingLeave(null); // Reset editing state
  };

  return (
    <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow-md w-full min-h-screen">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        Leave Management
      </h2>

      {/* Form and Table */}
      <div className="space-y-6">
        {/* Leave Form */}
        <LeaveForm
          onSave={handleSaveLeave}
          editingLeave={editingLeave}
          onCancelEdit={handleCancelEdit}
        />

        {/* Leave Details Table */}
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <p className="text-center text-red-500">{error}</p>
        ) : (
          <LeaveDetails
            leaves={userLeaves}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </div>
    </div>
  );
};

// Leave Details Component
const LeaveDetails = ({ leaves, onEdit, onDelete }) => {
  // Function to format date as "date/month/year"
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.getMonth() + 1; // Months are zero-based
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Ensure leaves is an array before using .map()
  if (!leaves || !Array.isArray(leaves)) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full p-6 bg-white rounded-lg shadow-md"
      >
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Leave Details</h3>
        <p className="text-center p-4">No leave records found.</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full p-6 bg-white rounded-lg shadow-md"
    >
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Leave Details</h3>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
            <tr>
              <th className="border border-gray-300 p-3 text-left">Leave Type</th>
              <th className="border border-gray-300 p-3 text-left">Start Date</th>
              <th className="border border-gray-300 p-3 text-left">End Date</th>
              <th className="border border-gray-300 p-3 text-left">Reason</th>
              <th className="border border-gray-300 p-3 text-left">Status</th>
              <th className="border border-gray-300 p-3 text-left">Document</th>
              <th className="border border-gray-300 p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {leaves.length > 0 ? (
              leaves.map((leave) => (
                <tr key={leave.id} className="bg-white hover:bg-gray-50 transition-all">
                  <td className="border border-gray-300 p-3">{leave.leave_type}</td>
                  <td className="border border-gray-300 p-3">{formatDate(leave.start_date)}</td>
                  <td className="border border-gray-300 p-3">{formatDate(leave.end_date)}</td>
                  <td className="border border-gray-300 p-3">{leave.reason}</td>
                  <td className="border border-gray-300 p-3">
                    <span
                      className={`px-2 py-1 rounded-full text-sm ${
                        leave.leave_status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : leave.leave_status === "approved"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {leave.leave_status}
                    </span>
                  </td>
                  <td className="border border-gray-300 p-3">
                    {leave.document ? (
                      <a
                        href={`${backendUrl}/uploads/leaves/${encodeURI(leave.document.replace(/\\/g, "/"))}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <FaEye size={18} />
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="border border-gray-300 p-3">
                    <div className="flex justify-center space-x-4">
                      {/* Edit Button - Only show for pending leaves */}
                      {leave.leave_status === "pending" && (
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => onEdit(leave)}
                          className="p-2 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 transition-all duration-200"
                          title="Edit"
                        >
                          <FaEdit size={18} />
                        </motion.button>
                      )}

                      {/* Delete Button - Only show for pending leaves */}
                      {leave.leave_status === "pending" && (
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => onDelete(leave.id)}
                          className="p-2 rounded-full bg-red-100 hover:bg-red-200 text-red-600 transition-all duration-200"
                          title="Delete"
                        >
                          <FaTrash size={18} />
                        </motion.button>
                      )}

                      {/* For approved/rejected leaves, show a disabled state or nothing */}
                      {leave.leave_status !== "pending" && (
                        <span className="text-gray-400 p-2" title="No actions available">
                          <FaTimes size={18} />
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="text-center p-4">
                  No leave records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

// Leave Form Component (Remains the same as in your original code)
const LeaveForm = ({ onSave, editingLeave, onCancelEdit }) => {
  const [leaveData, setLeaveData] = useState({
    leave_type: "Sick",
    start_date: "",
    end_date: "",
    reason: "",
    leave_status: "pending",
    document: null,
  });

  const [documentPreview, setDocumentPreview] = useState(null);

  // Function to format date for input[type="date"]
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    if (editingLeave) {
      setLeaveData({
        leave_type: editingLeave.leave_type,
        start_date: formatDateForInput(editingLeave.start_date),
        end_date: formatDateForInput(editingLeave.end_date),
        reason: editingLeave.reason,
        leave_status: editingLeave.leave_status,
        document: null,
      });
      if (editingLeave.document) {
        setDocumentPreview(editingLeave.document);
      }
    } else {
      setLeaveData({
        leave_type: "Sick",
        start_date: "",
        end_date: "",
        reason: "",
        leave_status: "pending",
        document: null,
      });
      setDocumentPreview(null);
    }
  }, [editingLeave]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLeaveData({ ...leaveData, [name]: value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLeaveData({ ...leaveData, document: file });
      setDocumentPreview(URL.createObjectURL(file));
    }
  };

  const calculateDays = () => {
    if (!leaveData.start_date || !leaveData.end_date) return 0;
    const start = new Date(leaveData.start_date);
    const end = new Date(leaveData.end_date);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const days = calculateDays();

    if (days > 5 && !leaveData.document) {
      alert("Document is required for leaves longer than 5 days.");
      return;
    }

    onSave(leaveData);
    setLeaveData({
      leave_type: "Sick",
      start_date: "",
      end_date: "",
      reason: "",
      leave_status: "pending",
      document: null,
    });
    setDocumentPreview(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full p-6 bg-white rounded-lg shadow-md"
    >
      <h3 className="text-xl font-semibold text-gray-800 mb-4">
        {editingLeave ? "Edit Leave" : "Apply Leave"}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Leave Type */}
          <div>
            <label className="block font-medium">Leave Type</label>
            <select
              name="leave_type"
              value={leaveData.leave_type}
              onChange={handleChange}
              className="w-full border p-2 rounded"
              required
            >
              <option value="Sick">Sick</option>
              <option value="Casual">Casual</option>
              <option value="Emergency">Emergency</option>
            </select>
          </div>

          {/* Reason Field */}
          <div>
            <label className="block font-medium">Reason</label>
            <input
              type="text"
              name="reason"
              className="w-full p-2 border rounded"
              value={leaveData.reason}
              onChange={handleChange}
              required
            />
          </div>

          {/* Start Date */}
          <div>
            <label className="block font-medium">Start Date</label>
            <div className="relative">
              <input
                type="date"
                name="start_date"
                value={leaveData.start_date}
                onChange={handleChange}
                className="w-full border p-2 rounded pl-10"
                required
              />
              <FaCalendarAlt className="absolute left-3 top-3 text-gray-500" />
            </div>
          </div>

          {/* End Date */}
          <div>
            <label className="block font-medium">End Date</label>
            <div className="relative">
              <input
                type="date"
                name="end_date"
                value={leaveData.end_date}
                onChange={handleChange}
                className="w-full border p-2 rounded pl-10"
                required
              />
              <FaCalendarAlt className="absolute left-3 top-3 text-gray-500" />
            </div>
          </div>
        </div>

        {/* Days Calculation */}
        <div className="text-sm text-gray-600">
          Total Days: {calculateDays()} {calculateDays() > 1 ? "days" : "day"}
        </div>

        {/* Document Upload (If leave exceeds 5 days) */}
        {calculateDays() > 5 && (
          <div className="mt-4">
            <label className="block font-medium">Upload Document</label>
            <div className="relative">
              <input
                type="file"
                onChange={handleFileChange}
                className="w-full border p-2 rounded pl-10"
                required={calculateDays() > 5 && !editingLeave}
              />
              <FaFileUpload className="absolute left-3 top-3 text-gray-500" />
            </div>
          </div>
        )}

        {/* Submit and Cancel Buttons */}
        <div className="mt-6 flex space-x-4">
          <button
            type="submit"
            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-2 rounded hover:from-blue-600 hover:to-purple-600 transition-all"
          >
            {editingLeave ? "Update Leave" : "Apply Leave"}
          </button>
          {editingLeave && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600 transition-all"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </motion.div>
  );
};

export default StudentLeave;