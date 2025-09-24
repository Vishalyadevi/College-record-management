import React, { useState, useCallback, memo } from "react";
import { FaEdit, FaTrash, FaChevronLeft, FaChevronRight, FaPlus } from "react-icons/fa";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { useScholarship } from "../../contexts/ScholarshipContext";

// Memoized FormField Component
const FormField = memo(({ type, name, value, onChange, placeholder, required }) => (
  <input
    type={type}
    name={name}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
    required={required}
  />
));

// Memoized Select Component
const Select = memo(({ name, value, onChange, children, required }) => (
  <select
    name={name}
    value={value}
    onChange={onChange}
    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
    required={required}
  >
    {children}
  </select>
));

const StudentScholarship = () => {
  const {
    scholarships,
    loading,
    error,
    addScholarship,
    updateScholarship,
    deleteScholarship,
  } = useScholarship();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingScholarship, setEditingScholarship] = useState({
    name: "",
    provider: "",
    type: "",
    customType: "",
    year: "",
    status: "",
    appliedDate: "",
    receivedAmount: "",
    receivedDate: "",
  });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  // Filter State
  const [filterStatus, setFilterStatus] = useState("All"); // "All", "Applied", "Received"

  // Calculate Paginated Data
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  // Group scholarships by name and provider
  const groupedScholarships = scholarships.reduce((acc, scholarship) => {
    const key = `${scholarship.name}-${scholarship.provider}`;
    if (!acc[key]) {
      acc[key] = {
        ...scholarship,
        years: [scholarship.year],
        amounts: scholarship.status === "Received" ? { [scholarship.year]: scholarship.receivedAmount } : {},
      };
    } else {
      acc[key].years.push(scholarship.year);
      if (scholarship.status === "Received") {
        acc[key].amounts[scholarship.year] = scholarship.receivedAmount;
      }
    }
    return acc;
  }, {});

  // Filter scholarships based on status
  const filteredScholarships = Object.values(groupedScholarships).filter((scholarship) => {
    if (filterStatus === "All") return true;
    return scholarship.status === filterStatus;
  });

  const currentScholarships = filteredScholarships.slice(indexOfFirstItem, indexOfLastItem);

  // Total Pages
  const totalPages = Math.ceil(filteredScholarships.length / itemsPerPage);

  // Reusable Label Component
  const Label = ({ children, htmlFor }) => (
    <label htmlFor={htmlFor} className="block text-gray-700 font-medium mb-2">
      {children}
    </label>
  );

  // Handle Next Page
  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  }, [currentPage, totalPages]);

  // Handle Previous Page
  const handlePrevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  }, [currentPage]);

  // Handle Edit Click
  const handleEdit = useCallback((scholarship) => {
    setEditingScholarship(scholarship);
  }, []);

  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const token = localStorage.getItem("token");
    if (!token) {
      return toast.error("No token found. Please log in.");
    }
    let decodedData;
    try {
      const base64Url = token.split(".")[1];
      decodedData = JSON.parse(atob(base64Url.replace(/-/g, "+").replace(/_/g, "/")));
    } catch (error) {
      return toast.error("Error fetching user details");
    }

    setIsSubmitting(true);

    try {
      const scholarshipData = {
        name: editingScholarship.name,
        provider: editingScholarship.provider,
        type: editingScholarship.type,
        customType: editingScholarship.type === "Other" ? editingScholarship.customType : "",
        year: editingScholarship.year,
        status: editingScholarship.status,
        appliedDate: editingScholarship.appliedDate,
        receivedAmount: editingScholarship.status === "Received" ? editingScholarship.receivedAmount : "",
        receivedDate: editingScholarship.status === "Received" ? editingScholarship.receivedDate : "",
        Userid: String(decodedData.Userid),
      };

      if (editingScholarship.id) {
        await updateScholarship(editingScholarship.id, scholarshipData);
        toast.success("Scholarship updated successfully!");
      } else {
        await addScholarship(scholarshipData);
        toast.success("Scholarship added successfully!");
      }

      setEditingScholarship({
        id: "",
        name: "",
        provider: "",
        type: "",
        customType: "",
        year: "",
        status: "",
        appliedDate: "",
        receivedAmount: "",
        receivedDate: "",
      });
    } catch (error) {
      console.error("Error submitting scholarship:", error);
      toast.error("Failed to submit scholarship. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Field Changes
  const handleFieldChange = useCallback((e) => {
    const { name, value } = e.target;
    setEditingScholarship((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  if (loading) {
    return <div className="text-center text-gray-700">Loading scholarships...</div>;
  }

  if (error) {
    return <div className="text-center text-red-600">Error: {error}</div>;
  }

  if (!Array.isArray(scholarships)) {
    return <div className="text-center text-red-600">Invalid scholarships data. Expected an array.</div>;
  }

  return (
    <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg shadow-sm w-full min-h-screen">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
        Scholarships Details
      </h2>

      {/* Scholarship Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full p-6 bg-white rounded-lg shadow-md mb-6 relative"
      >
        {/* Submit Button (Top-Right Corner) */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          type="submit"
          onClick={handleSubmit}
          className="absolute top-4 right-4 p-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full shadow-md hover:shadow-lg transition"
          title={editingScholarship.id ? "Update" : "Submit"}
        >
          <FaPlus size={20} />
        </motion.button>

        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          {editingScholarship.id ? "Edit Scholarship" : "Add Scholarship"}
        </h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-4 gap-4">
          {/* Row 1 */}
          <div>
            <Label htmlFor="name">Scholarship Name</Label>
            <FormField
              type="text"
              name="name"
              value={editingScholarship.name}
              onChange={handleFieldChange}
              placeholder="Enter scholarship name"
              required
            />
          </div>
          <div>
            <Label htmlFor="provider">Provider Name</Label>
            <FormField
              type="text"
              name="provider"
              value={editingScholarship.provider}
              onChange={handleFieldChange}
              placeholder="Enter provider name"
              required
            />
          </div>
          <div>
            <Label htmlFor="type">Type</Label>
            <Select
              name="type"
              value={editingScholarship.type}
              onChange={handleFieldChange}
              required
            >
              <option value="">Select Type</option>
              <option value="Merit-Based">Merit-Based</option>
              <option value="Need-Based">Need-Based</option>
              <option value="Athletic">Athletic</option>
              <option value="Other">Other</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="year">Year</Label>
            <Select
              name="year"
              value={editingScholarship.year}
              onChange={handleFieldChange}
              required
            >
              <option value="">Select Year</option>
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
            </Select>
          </div>

          {/* Row 2 */}
          {editingScholarship.type === "Other" && (
            <div>
              <Label htmlFor="customType">Custom Type</Label>
              <FormField
                type="text"
                name="customType"
                value={editingScholarship.customType}
                onChange={handleFieldChange}
                placeholder="Enter custom type"
              />
            </div>
          )}
          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              name="status"
              value={editingScholarship.status}
              onChange={handleFieldChange}
              required
            >
              <option value="">Select Status</option>
              <option value="Applied">Applied</option>
              <option value="Received">Received</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="appliedDate">Applied Date</Label>
            <FormField
              type="date"
              name="appliedDate"
              value={editingScholarship.appliedDate}
              onChange={handleFieldChange}
              required
            />
          </div>
          {editingScholarship.status === "Received" && (
            <div>
              <Label htmlFor="receivedAmount">Amount Received</Label>
              <FormField
                type="number"
                name="receivedAmount"
                value={editingScholarship.receivedAmount}
                onChange={handleFieldChange}
                placeholder="Enter amount received"
              />
            </div>
          )}

          {/* Row 3 */}
          {editingScholarship.status === "Received" && (
            <div>
              <Label htmlFor="receivedDate">Received Date</Label>
              <FormField
                type="date"
                name="receivedDate"
                value={editingScholarship.receivedDate}
                onChange={handleFieldChange}
              />
            </div>
          )}
        </form>
      </motion.div>

      {/* Filter Controls */}
      <div className="flex justify-end mb-6">
        <Select
          name="filterStatus"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="All">All</option>
          <option value="Applied">Applied</option>
          <option value="Received">Received</option>
        </Select>
      </div>

      {/* Scholarship Details Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full p-6 bg-white rounded-lg shadow-md"
      >
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Scholarship Details</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-200">
            <thead className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
              <tr>
                <th className="border border-gray-200 p-3 text-left">Scholarship Name</th>
                <th className="border border-gray-200 p-3 text-left">Provider</th>
                <th className="border border-gray-200 p-3 text-left">Type</th>
                <th className="border border-gray-200 p-3 text-left">Year</th>
                <th className="border border-gray-200 p-3 text-left">Status</th>
                <th className="border border-gray-200 p-3 text-left">Applied Date</th>
                <th className="border border-gray-200 p-3 text-left">Amount Received</th>
                <th className="border border-gray-200 p-3 text-left">Received Date</th>
                <th className="border border-gray-200 p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentScholarships.map((scholarship) => (
                <tr key={`${scholarship.name}-${scholarship.provider}`} className="bg-white hover:bg-gray-50 transition">
                  <td className="border border-gray-200 p-3">{scholarship.name}</td>
                  <td className="border border-gray-200 p-3">{scholarship.provider}</td>
                  <td className="border border-gray-200 p-3">{scholarship.type}</td>
                  <td className="border border-gray-200 p-3">{scholarship.years.join(", ")}</td>
                  <td className="border border-gray-200 p-3">
                    <span
                      className={`px-2 py-1 rounded-full text-sm ${
                        scholarship.status === "Received"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {scholarship.status}
                    </span>
                  </td>
                  <td className="border border-gray-200 p-3">{scholarship.appliedDate}</td>
                  <td className="border border-gray-200 p-3">
                    {Object.entries(scholarship.amounts).map(([year, amount]) => (
                      <div key={year}>
                        {year}: ₹{amount}
                      </div>
                    ))}
                  </td>
                  <td className="border border-gray-200 p-3">{scholarship.receivedDate || "-"}</td>
                  <td className="border border-gray-200 p-3">
                    <div className="flex justify-center space-x-4">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleEdit(scholarship)}
                        className="p-2 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 transition-all duration-200"
                        title="Edit"
                      >
                        <FaEdit size={18} />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => deleteScholarship(scholarship.id)}
                        className="p-2 rounded-full bg-red-100 hover:bg-red-200 text-red-600 transition-all duration-200"
                        title="Delete"
                      >
                        <FaTrash size={18} />
                      </motion.button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex justify-between items-center mt-6">
          <div className="text-sm text-gray-600">
            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredScholarships.length)} of {filteredScholarships.length} entries
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
              Page {currentPage} of {totalPages}
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
      </motion.div>
    </div>
  );
};

export default StudentScholarship;