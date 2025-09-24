import React, { useState, useCallback, memo } from "react";
import { FaEdit, FaTrash, FaChevronLeft, FaChevronRight, FaPlus } from "react-icons/fa";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { useOrganizedEventContext } from "../../contexts/OrganizedEventContext";

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

const StudentEventOrganized = () => {
  const {
    events, // Ensure `events` is destructured from the context
    loading,
    error,
    addEvent,
    updateEvent,
    deleteEvent,
  } = useOrganizedEventContext();
  console.log(events)

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingEvent, setEditingEvent] = useState({
    id: "",
    event_name: "",
    club_name: "",
    role: "",
    staff_incharge: "",
    start_date: "",
    end_date: "",
    number_of_participants: "",
    mode: "",
    funding_agency: "",
    funding_amount: "",
  });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  // Filter State
  const [filterRole, setFilterRole] = useState("All"); // "All", "Organizer", "Volunteer"

  // Filter events based on role
  const filteredEvents = Array.isArray(events) // Use `events` instead of `fetchEvents`
    ? events.filter((event) => filterRole === "All" ? true : event.role === filterRole)
    : [];

  // Calculate Paginated Data
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentEvents = filteredEvents.slice(indexOfFirstItem, indexOfLastItem);

  // Total Pages
  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);

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
  const handleEdit = useCallback((event) => {
    setEditingEvent(event);
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
      const eventData = {
        event_name: editingEvent.event_name,
        club_name: editingEvent.club_name,
        role: editingEvent.role,
        staff_incharge: editingEvent.staff_incharge,
        start_date: editingEvent.start_date,
        end_date: editingEvent.end_date,
        number_of_participants: editingEvent.number_of_participants,
        mode: editingEvent.mode,
        funding_agency: editingEvent.funding_agency,
        funding_amount: editingEvent.funding_amount,
        Userid: String(decodedData.Userid),
      };

      if (editingEvent.id) {
        await updateEvent(editingEvent.id, eventData);
        toast.success("Event updated successfully!");
      } else {
        await addEvent(eventData);
        toast.success("Event added successfully!");
      }

      // Reset form
      setEditingEvent({
        id: "",
        event_name: "",
        club_name: "",
        role: "",
        staff_incharge: "",
        start_date: "",
        end_date: "",
        number_of_participants: "",
        mode: "",
        funding_agency: "",
        funding_amount: "",
      });
    } catch (error) {
      console.error("Error submitting event:", error);
      toast.error("Failed to submit event. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Field Changes
  const handleFieldChange = useCallback((e) => {
    const { name, value } = e.target;
    setEditingEvent((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  if (loading) {
    return <div className="text-center text-gray-700">Loading events...</div>;
  }

  if (error) {
    return <div className="text-center text-red-600">Error: {error}</div>;
  }

  if (!Array.isArray(events)) {
    return <div className="text-center text-red-600">Invalid events data. Expected an array.</div>;
  }

  return (
    <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg shadow-sm w-full min-h-screen">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
        Events Organized
      </h2>

      {/* Event Form */}
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
          title={editingEvent.id ? "Update" : "Submit"}
        >
          {editingEvent.id ? <FaEdit size={20} /> : <FaPlus size={20} />}
        </motion.button>

        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          {editingEvent.id ? "Edit Event" : "Add Event"}
        </h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-4 gap-4">
          {/* Row 1 */}
          <div>
            <Label htmlFor="event_name">Event Name</Label>
            <FormField
              type="text"
              name="event_name"
              value={editingEvent.event_name}
              onChange={handleFieldChange}
              placeholder="Enter event name"
              required
            />
          </div>
          <div>
            <Label htmlFor="club_name">Club Name</Label>
            <FormField
              type="text"
              name="club_name"
              value={editingEvent.club_name}
              onChange={handleFieldChange}
              placeholder="Enter club name"
              required
            />
          </div>
          <div>
            <Label htmlFor="role">Role</Label>
            <Select
              name="role"
              value={editingEvent.role}
              onChange={handleFieldChange}
              required
            >
              <option value="">Select Role</option>
              <option value="Organizer">Organizer</option>
              <option value="Volunteer">Volunteer</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="staff_incharge">Staff Incharge</Label>
            <FormField
              type="text"
              name="staff_incharge"
              value={editingEvent.staff_incharge}
              onChange={handleFieldChange}
              placeholder="Enter staff incharge"
              required
            />
          </div>

          {/* Row 2 */}
          <div>
            <Label htmlFor="start_date">Start Date</Label>
            <FormField
              type="date"
              name="start_date"
              value={editingEvent.start_date ? editingEvent.start_date.split('T')[0] : ''}
              onChange={handleFieldChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="end_date">End Date</Label>
            <FormField
              type="date"
              name="end_date"
              value={editingEvent.end_date ? editingEvent.end_date.split('T')[0] : ''}
              onChange={handleFieldChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="number_of_participants">Number of Participants</Label>
            <FormField
              type="number"
              name="number_of_participants"
              value={editingEvent.number_of_participants}
              onChange={handleFieldChange}
              placeholder="Enter number of participants"
              required
            />
          </div>
          <div>
            <Label htmlFor="mode">Mode</Label>
            <Select
              name="mode"
              value={editingEvent.mode}
              onChange={handleFieldChange}
              required
            >
              <option value="">Select Mode</option>
              <option value="Online">Online</option>
              <option value="Offline">Offline</option>
            </Select>
          </div>

          {/* Row 3 */}
          <div>
            <Label htmlFor="funding_agency">Funding Agency</Label>
            <FormField
              type="text"
              name="funding_agency"
              value={editingEvent.funding_agency}
              onChange={handleFieldChange}
              placeholder="Enter funding agency"
            />
          </div>
          <div>
            <Label htmlFor="funding_amount">Funding Amount</Label>
            <FormField
              type="number"
              name="funding_amount"
              value={editingEvent.funding_amount}
              onChange={handleFieldChange}
              placeholder="Enter funding amount"
            />
          </div>
        </form>
      </motion.div>

      {/* Filter Controls */}
      <div className="flex justify-end mb-6">
        <Select
          name="filterRole"
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
        >
          <option value="All">All Roles</option>
          <option value="Organizer">Organizer</option>
          <option value="Volunteer">Volunteer</option>
        </Select>
      </div>

      {/* Event Details Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full p-6 bg-white rounded-lg shadow-md"
      >
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Event Details</h3>
        {filteredEvents.length === 0 ? (
          <div className="text-center text-gray-600">No events found.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-200">
                <thead className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                  <tr>
                    <th className="border border-gray-200 p-3 text-left">Event Name</th>
                    <th className="border border-gray-200 p-3 text-left">Club Name</th>
                    <th className="border border-gray-200 p-3 text-left">Role</th>
                    <th className="border border-gray-200 p-3 text-left">Staff Incharge</th>
                    <th className="border border-gray-200 p-3 text-left">Start Date</th>
                    <th className="border border-gray-200 p-3 text-left">End Date</th>
                    <th className="border border-gray-200 p-3 text-left">Participants</th>
                    <th className="border border-gray-200 p-3 text-left">Mode</th>
                    <th className="border border-gray-200 p-3 text-left">Funding Agency</th>
                    <th className="border border-gray-200 p-3 text-left">Funding Amount</th>
                    <th className="border border-gray-200 p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentEvents.map((event) => (
                    <tr key={event.id} className="bg-white hover:bg-gray-50 transition">
                      <td className="border border-gray-200 p-3">{event.event_name}</td>
                      <td className="border border-gray-200 p-3">{event.club_name}</td>
                      <td className="border border-gray-200 p-3">{event.role}</td>
                      <td className="border border-gray-200 p-3">{event.staff_incharge}</td>
                      <td className="border border-gray-200 p-3">
                        {new Date(event.start_date).toLocaleDateString()}
                      </td>
                      <td className="border border-gray-200 p-3">
                        {new Date(event.end_date).toLocaleDateString()}
                      </td>
                      <td className="border border-gray-200 p-3">{event.number_of_participants}</td>
                      <td className="border border-gray-200 p-3">{event.mode}</td>
                      <td className="border border-gray-200 p-3">{event.funding_agency}</td>
                      <td className="border border-gray-200 p-3">{event.funding_amount}</td>
                      <td className="border border-gray-200 p-3">
                        <div className="flex justify-center space-x-4">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleEdit(event)}
                            className="p-2 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 transition-all duration-200"
                            title="Edit"
                          >
                            <FaEdit size={18} />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => deleteEvent(event.id)}
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
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredEvents.length)} of {filteredEvents.length} entries
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
          </>
        )}
      </motion.div>
    </div>
  );
};

export default StudentEventOrganized;