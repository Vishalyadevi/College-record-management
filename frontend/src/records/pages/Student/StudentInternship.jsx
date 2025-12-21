import React, { useState, useEffect, useCallback } from "react";
import { useInternContext } from "../../contexts/InternContext.jsx";
import { toast } from "react-toastify";
import { FaEye, FaEdit, FaTrash, FaChevronLeft, FaChevronRight, FaClock, FaCheckCircle } from "react-icons/fa";
import { motion } from "framer-motion";

const backendUrl = "http://localhost:4000";

// Status Badge Component
const StatusBadge = ({ status }) => {
  const isCompleted = status?.toLowerCase() === 'completed';
  return (
    <span
      className={`px-3 py-1 rounded-full text-sm font-medium ${
        isCompleted
          ? 'bg-green-100 text-green-700'
          : 'bg-yellow-100 text-yellow-700'
      }`}
    >
      {status || 'Ongoing'}
    </span>
  );
};

// Approval Status Badge Component
const ApprovalBadge = ({ status }) => {
  const isApproved = status === 'Approved';
  return (
    <span
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
        isApproved
          ? 'bg-green-100 text-green-700'
          : 'bg-yellow-100 text-yellow-700'
      }`}
    >
      {isApproved ? <FaCheckCircle size={12} /> : <FaClock size={12} />}
      {status || 'Pending'}
    </span>
  );
};

// Reusable Input/Select Field Component
const Field = ({ label, name, value, onChange, type = "text", options, required = false, disabled = false, placeholder }) => (
  <div>
    <label className="block text-gray-700 font-medium mb-1">{label}</label>
    {type === "select" ? (
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        disabled={disabled}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    ) : (
      <input
        type={type}
        name={name}
        value={value || ""}
        onChange={onChange}
        className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        required={required}
        disabled={disabled}
        placeholder={placeholder}
      />
    )}
  </div>
);

// Main Component
const StudentInternship = () => {
  const { internships, loading, addInternship, updateInternship, deleteInternship } = useInternContext();

  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    provider_name: "",
    domain: "",
    mode: "online",
    start_date: "",
    end_date: "",
    stipend_amount: "",
    status: "ongoing",
    certificate: false,
    cer_file: null,
  });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  // Filter State
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterApproval, setFilterApproval] = useState("all");

  const token = localStorage.getItem("token");

  // Debug: Log internships data
  useEffect(() => {
    console.log("Internships data:", internships);
    console.log("Is array:", Array.isArray(internships));
    console.log("Length:", internships?.length);
  }, [internships]);

  // Filtered Internships - with proper null checks
  const filteredInternships = React.useMemo(() => {
    if (!Array.isArray(internships)) {
      console.log("Internships is not an array:", internships);
      return [];
    }
    
    return internships.filter((internship) => {
      if (!internship) return false;
      
      const statusMatch = filterStatus === "all" || 
        (internship.status && internship.status.toLowerCase() === filterStatus);
      
      const approvalMatch = filterApproval === "all" || 
        internship.approval_status === filterApproval;
      
      return statusMatch && approvalMatch;
    });
  }, [internships, filterStatus, filterApproval]);

  // Calculate Paginated Data
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentInternships = filteredInternships.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredInternships.length / itemsPerPage);

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (name === "status" && value === "ongoing") {
      setFormData({ ...formData, [name]: value, certificate: false, cer_file: null });
    } else if (name === "certificate" && checked && formData.status === "ongoing") {
      toast.warning("Please update the status to 'Completed' before providing a certificate.");
    } else {
      setFormData({ ...formData, [name]: type === "checkbox" ? checked : type === "file" ? files[0] : value });
    }
  };

  const handleEdit = (internship) => {
    console.log("Editing internship:", internship);
    
    // Only allow editing of pending internships
    if (internship.approval_status === 'Approved') {
      toast.warning("Cannot edit approved internships.");
      return;
    }

    if (internship.status !== "ongoing") {
      toast.warning("Only ongoing internships can be edited.");
      return;
    }

    const formattedStartDate = internship.start_date ? new Date(internship.start_date).toISOString().split('T')[0] : "";
    const formattedEndDate = internship.end_date ? new Date(internship.end_date).toISOString().split('T')[0] : "";

    setFormData({
      id: internship.id,
      provider_name: internship.provider_name || "",
      domain: internship.domain || "",
      mode: internship.mode || "online",
      start_date: formattedStartDate,
      end_date: formattedEndDate,
      stipend_amount: internship.stipend_amount || "",
      status: internship.status || "ongoing",
      certificate: !!internship.certificate,
      cer_file: null,
    });

    setIsEditMode(true);
  };

  const handleDelete = async (internship) => {
    console.log("Deleting internship:", internship);
    
    // Only allow deleting pending internships
    if (internship.approval_status === 'Approved') {
      toast.warning("Cannot delete approved internships.");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this internship?")) return;
    
    try {
      await deleteInternship(internship.id);
    } catch (error) {
      console.error("Error in handleDelete:", error);
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setFormData({
      provider_name: "",
      domain: "",
      mode: "online",
      start_date: "",
      end_date: "",
      stipend_amount: "",
      status: "ongoing",
      certificate: false,
      cer_file: null,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!token) return toast.error("User not logged in");
    
    if (new Date(formData.end_date) <= new Date(formData.start_date)) {
      return toast.error("End date must be after the start date.");
    }

    if (!window.confirm("Are you sure you want to proceed?")) return;

    let decodedData;
    try {
      const base64Url = token.split(".")[1];
      decodedData = JSON.parse(atob(base64Url.replace(/-/g, "+").replace(/_/g, "/")));
    } catch (error) {
      return toast.error("Error fetching user details");
    }

    if (formData.status === "completed" && !formData.cer_file && !formData.certificate) {
      return toast.error("Please upload a certificate before marking as 'Completed'.");
    }

    const stipendAmount = formData.stipend_amount ? parseFloat(formData.stipend_amount) : null;
    if (formData.stipend_amount && isNaN(stipendAmount)) {
      return toast.error("Invalid stipend amount. Please enter a valid number.");
    }

    const formToSubmit = new FormData();
    formToSubmit.append("provider_name", formData.provider_name);
    formToSubmit.append("domain", formData.domain);
    formToSubmit.append("mode", formData.mode);
    formToSubmit.append("start_date", formData.start_date);
    formToSubmit.append("end_date", formData.end_date);
    formToSubmit.append("stipend_amount", stipendAmount || "");
    formToSubmit.append("status", formData.status);
    formToSubmit.append("certificate", formData.certificate ? "true" : "false");
    formToSubmit.append("Userid", String(decodedData.Userid));
    formToSubmit.append("description", isEditMode ? "Updated Internship" : "New Internship");

    if (formData.cer_file) {
      formToSubmit.append("cer_file", formData.cer_file);
    }

    console.log("Submitting internship:", Object.fromEntries(formToSubmit));

    try {
      if (isEditMode) {
        await updateInternship(formData.id, formToSubmit);
      } else {
        await addInternship(formToSubmit);
      }
      handleCancelEdit();
    } catch (error) {
      console.error("❌ Error submitting internship:", error);
    }
  };

  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  }, [currentPage, totalPages]);

  const handlePrevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  }, [currentPage]);

  // Loading state
  if (loading && (!internships || internships.length === 0)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-xl text-gray-700 mb-2">Loading internships...</div>
          <div className="text-sm text-gray-500">Please wait...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow-md w-full min-h-screen">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        Internships
      </h2>

      {/* Form Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full p-6 bg-white rounded-lg shadow-lg mb-6"
      >
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          {isEditMode ? "Edit Internship" : "Add Internship"}
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <Field 
              label="Provider Name" 
              name="provider_name" 
              value={formData.provider_name} 
              onChange={handleInputChange} 
              required 
              placeholder="Enter provider name" 
            />
            <Field 
              label="Domain" 
              name="domain" 
              value={formData.domain} 
              onChange={handleInputChange} 
              required 
              placeholder="Enter domain" 
            />
            <Field
              label="Mode"
              name="mode"
              value={formData.mode}
              onChange={handleInputChange}
              type="select"
              options={[
                { value: "online", label: "Online" },
                { value: "offline", label: "Offline" },
              ]}
            />
            <Field 
              label="Stipend Amount" 
              name="stipend_amount" 
              value={formData.stipend_amount} 
              onChange={handleInputChange} 
              type="number" 
              placeholder="Enter stipend amount" 
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-medium mb-1">Duration</label>
              <div className="flex space-x-4">
                <Field 
                  type="date" 
                  name="start_date" 
                  value={formData.start_date} 
                  onChange={handleInputChange} 
                  required 
                />
                <Field 
                  type="date" 
                  name="end_date" 
                  value={formData.end_date} 
                  onChange={handleInputChange} 
                  required 
                />
              </div>
            </div>
            <Field
              label="Status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              type="select"
              options={[
                { value: "ongoing", label: "Ongoing" },
                { value: "completed", label: "Completed" },
              ]}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="certificate"
              checked={formData.certificate}
              onChange={handleInputChange}
              className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
              disabled={formData.status === "ongoing"}
            />
            <label className="text-gray-700">Provide Certificate</label>
          </div>
          
          {formData.certificate && formData.status === "completed" && (
            <Field 
              label="Certificate File" 
              name="cer_file" 
              onChange={handleInputChange} 
              type="file" 
            />
          )}
          
          <div className="flex space-x-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={handleSubmit}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg shadow-md hover:shadow-lg transition"
            >
              {isEditMode ? "Update Internship" : "Add Internship"}
            </motion.button>
            {isEditMode && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                className="px-6 py-3 bg-gray-500 text-white rounded-lg shadow-md hover:shadow-lg transition"
                onClick={handleCancelEdit}
              >
                Cancel
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Filter Controls */}
      <div className="flex justify-end gap-4 mb-6">
        <div className="w-48">
          <Field
            label="Internship Status"
            name="filterStatus"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            type="select"
            options={[
              { value: "all", label: "All Status" },
              { value: "ongoing", label: "Ongoing" },
              { value: "completed", label: "Completed" },
            ]}
          />
        </div>
        <div className="w-48">
          <Field
            label="Approval Status"
            name="filterApproval"
            value={filterApproval}
            onChange={(e) => setFilterApproval(e.target.value)}
            type="select"
            options={[
              { value: "all", label: "All Approvals" },
              { value: "Approved", label: "Approved" },
              { value: "Pending", label: "Pending" },
            ]}
          />
        </div>
      </div>

      {/* Table Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full p-6 bg-white rounded-lg shadow-lg"
      >
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Your Internships</h3>
        
        {filteredInternships.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No internships available.</p>
            {internships && internships.length > 0 && (
              <p className="text-sm text-gray-400 mt-2">Try adjusting your filters</p>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <div className="max-h-[400px] overflow-y-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm" style={{ minWidth: '2400px', width: '100%' }}>
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                      <th className="py-3 px-4 text-left font-medium" style={{ minWidth: '130px' }}>Approval Status</th>
                      <th className="py-3 px-4 text-left font-medium" style={{ minWidth: '150px' }}>Provider</th>
                      <th className="py-3 px-4 text-left font-medium" style={{ minWidth: '150px' }}>Domain</th>
                      <th className="py-3 px-4 text-left font-medium" style={{ minWidth: '100px' }}>Mode</th>
                      <th className="py-3 px-4 text-left font-medium" style={{ minWidth: '300px' }}>Duration</th>
                      <th className="py-3 px-4 text-left font-medium" style={{ minWidth: '120px' }}>Stipend</th>
                      <th className="py-3 px-4 text-left font-medium" style={{ minWidth: '120px' }}>Certificate</th>
                      <th className="py-3 px-4 text-left font-medium" style={{ minWidth: '130px' }}>Status</th>
                      <th className="py-3 px-4 text-left font-medium" style={{ minWidth: '150px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentInternships.map((internship, index) => (
                      <tr
                        key={internship.id || index}
                        className={`${index % 2 === 0 ? "bg-gray-50" : "bg-white"} hover:bg-gray-100 transition-colors`}
                      >
                        <td className="py-3 px-4">
                          <ApprovalBadge status={internship.approval_status} />
                        </td>
                        <td className="py-3 px-4 text-gray-700">{internship.provider_name || "N/A"}</td>
                        <td className="py-3 px-4 text-gray-700">{internship.domain || "N/A"}</td>
                        <td className="py-3 px-4 text-gray-700">{internship.mode || "N/A"}</td>
                        <td className="py-3 px-4 text-gray-700">
                          {internship.start_date && internship.end_date
                            ? `${new Date(internship.start_date).toLocaleDateString()} - ${new Date(internship.end_date).toLocaleDateString()}`
                            : "N/A"}
                        </td>
                        <td className="py-3 px-4 text-gray-700">
                          {internship.stipend_amount ? `₹${internship.stipend_amount}` : "Unpaid"}
                        </td>
                        <td className="py-3 px-4 text-gray-700">
                          {internship.certificate ? (
                            <a
                              href={`${backendUrl}/${encodeURI(internship.certificate.replace(/\\/g, "/"))}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:text-blue-700 transition"
                            >
                              <FaEye className="inline-block text-xl" />
                            </a>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={internship.status} />
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEdit(internship)}
                              className={`transition ${
                                internship.approval_status === 'Pending'
                                  ? 'text-blue-500 hover:text-blue-700 cursor-pointer'
                                  : 'text-gray-400 cursor-not-allowed'
                              }`}
                              aria-label="Edit"
                              title={internship.approval_status === 'Pending' ? 'Edit' : 'Cannot edit approved internships'}
                            >
                              <FaEdit className="inline-block text-xl" />
                            </button>
                            <button
                              onClick={() => handleDelete(internship)}
                              className={`transition ${
                                internship.approval_status === 'Pending'
                                  ? 'text-red-500 hover:text-red-700 cursor-pointer'
                                  : 'text-gray-400 cursor-not-allowed'
                              }`}
                              aria-label="Delete"
                              title={internship.approval_status === 'Pending' ? 'Delete' : 'Cannot delete approved internships'}
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
            </div>

            {/* Pagination Controls */}
            <div className="flex justify-between items-center mt-6">
              <div className="text-sm text-gray-600">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredInternships.length)} of {filteredInternships.length} entries
              </div>
              <div className="flex items-center space-x-4">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-full ${
                    currentPage === 1
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-blue-100 hover:bg-blue-200 text-blue-600"
                  } transition-all duration-200`}
                >
                  <FaChevronLeft size={18} />
                </motion.button>
                <span className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages || 1}
                </span>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-full ${
                    currentPage === totalPages
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-blue-100 hover:bg-blue-200 text-blue-600"
                  } transition-all duration-200`}
                >
                  <FaChevronRight size={18} />
                </motion.button>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default StudentInternship;