import React, { useState, useEffect } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import { motion } from "framer-motion";
import { useHackathon } from "../../contexts/HackathonContext";

const HackathonEvents = () => {
  const {
    hackathonEvents,
    loading,
    error,
    fetchStudentEvents,
    addHackathonEvent,
    updateHackathonEvent,
    deleteHackathonEvent,
    clearError
  } = useHackathon();

  const [formData, setFormData] = useState({
    event_name: "",
    organized_by: "",
    from_date: "",
    to_date: "",
    level_cleared: "",
    rounds: 1,
    status: "participate",
  });

  const [editingId, setEditingId] = useState(null);
  const [localLoading, setLocalLoading] = useState(false);
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    if (userId) {
      fetchStudentEvents(userId);
    }
  }, [userId, fetchStudentEvents]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const validateForm = () => {
    if (!formData.event_name.trim()) {
      throw new Error("Event name is required");
    }
    if (!formData.organized_by.trim()) {
      throw new Error("Organizer name is required");
    }
    if (!formData.from_date) {
      throw new Error("From date is required");
    }
    if (!formData.to_date) {
      throw new Error("To date is required");
    }
    if (new Date(formData.from_date) > new Date(formData.to_date)) {
      throw new Error("From date cannot be after to date");
    }
    if (!formData.level_cleared || formData.level_cleared < 1 || formData.level_cleared > 10) {
      throw new Error("Level cleared must be between 1 and 10");
    }
    if (!formData.rounds || formData.rounds < 1) {
      throw new Error("Rounds must be at least 1");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    setLocalLoading(true);
    
    try {
      validateForm();

      const eventData = {
        ...formData,
        Userid: parseInt(userId),
        level_cleared: parseInt(formData.level_cleared),
        rounds: parseInt(formData.rounds),
      };

      if (editingId) {
        await updateHackathonEvent(editingId, eventData);
      } else {
        await addHackathonEvent(eventData);
      }

      // Refresh the events list
      await fetchStudentEvents(userId);

      // Reset form
      setFormData({
        event_name: "",
        organized_by: "",
        from_date: "",
        to_date: "",
        level_cleared: "",
        rounds: 1,
        status: "participate",
      });
      setEditingId(null);
    } catch (err) {
      console.error("Error submitting hackathon event:", err);
    } finally {
      setLocalLoading(false);
    }
  };

  const handleEdit = (event) => {
    setFormData({
      event_name: event.event_name,
      organized_by: event.organized_by,
      from_date: event.from_date.split('T')[0],
      to_date: event.to_date.split('T')[0],
      level_cleared: event.level_cleared,
      rounds: event.rounds,
      status: event.status,
    });
    setEditingId(event.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this hackathon event?")) {
      try {
        await deleteHackathonEvent(id);
        await fetchStudentEvents(userId);
      } catch (err) {
        console.error("Error deleting event:", err);
      }
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({
      event_name: "",
      organized_by: "",
      from_date: "",
      to_date: "",
      level_cleared: "",
      rounds: 1,
      status: "participate",
    });
    clearError();
  };

  const getStatusColor = (status) => {
    switch(status) {
      case "approved": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow-md w-full min-h-screen">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        Hackathon Events
      </h2>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {(loading || localLoading) && (
        <div className="mb-4 p-4 bg-blue-100 text-blue-700 rounded-lg text-center">
          Loading...
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full p-6 bg-white rounded-lg shadow-lg mb-6"
      >
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          {editingId ? "Edit Hackathon Event" : "Add Hackathon Event"}
        </h3>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="col-span-1">
              <label className="block text-gray-700 font-medium mb-1">Event Name *</label>
              <input
                type="text"
                name="event_name"
                value={formData.event_name}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Event Name"
                required
              />
            </div>

            <div className="col-span-1">
              <label className="block text-gray-700 font-medium mb-1">Organized By *</label>
              <input
                type="text"
                name="organized_by"
                value={formData.organized_by}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Organizer"
                required
              />
            </div>

            <div className="col-span-1">
              <label className="block text-gray-700 font-medium mb-1">From Date *</label>
              <input
                type="date"
                name="from_date"
                value={formData.from_date}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="col-span-1">
              <label className="block text-gray-700 font-medium mb-1">To Date *</label>
              <input
                type="date"
                name="to_date"
                value={formData.to_date}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="col-span-1">
              <label className="block text-gray-700 font-medium mb-1">Level Cleared (1-10) *</label>
              <input
                type="number"
                name="level_cleared"
                value={formData.level_cleared}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="1-10"
                min="1"
                max="10"
                required
              />
            </div>

            <div className="col-span-1">
              <label className="block text-gray-700 font-medium mb-1">Rounds *</label>
              <input
                type="number"
                name="rounds"
                value={formData.rounds}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Rounds"
                min="1"
                required
              />
            </div>

            <div className="col-span-1">
              <label className="block text-gray-700 font-medium mb-1">Status *</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="participate">Participate</option>
                <option value="achievement">Achievement</option>
              </select>
            </div>
          </div>

          <div className="flex justify-center space-x-4">
            {editingId && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={handleCancel}
                className="px-6 py-2 bg-gray-500 text-white rounded-lg shadow-md hover:shadow-lg transition"
              >
                Cancel
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg shadow-md hover:shadow-lg transition"
              disabled={loading || localLoading}
            >
              {localLoading ? "Processing..." : editingId ? "Update" : "Add"}
            </motion.button>
          </div>
        </form>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full p-6 bg-white rounded-lg shadow-lg"
      >
        <h3 className="text-xl font-semibold text-gray-800 mb-4">My Hackathon Events</h3>
        {hackathonEvents.length === 0 && !loading ? (
          <p className="text-gray-500">No hackathon events available.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300"style={{ minWidth: '2000px', width: '100%' }}>
              <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <tr>
                  <th className="border border-gray-300 p-3 text-left">Event Name</th>
                  <th className="border border-gray-300 p-3 text-left">Organized By</th>
                  <th className="border border-gray-300 p-3 text-left">From Date</th>
                  <th className="border border-gray-300 p-3 text-left">To Date</th>
                  <th className="border border-gray-300 p-3 text-left">Level</th>
                  <th className="border border-gray-300 p-3 text-left">Rounds</th>
                  <th className="border border-gray-300 p-3 text-left">Type</th>
                  <th className="border border-gray-300 p-3 text-left">Status</th>
                  <th className="border border-gray-300 p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {hackathonEvents.map((event) => (
                  <tr key={event.id} className="bg-white hover:bg-gray-50 transition">
                    <td className="border border-gray-300 p-3">{event.event_name}</td>
                    <td className="border border-gray-300 p-3">{event.organized_by}</td>
                    <td className="border border-gray-300 p-3">
                      {new Date(event.from_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="border border-gray-300 p-3">
                      {new Date(event.to_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="border border-gray-300 p-3">{event.level_cleared}/10</td>
                    <td className="border border-gray-300 p-3">{event.rounds}</td>
                    <td className="border border-gray-300 p-3 capitalize">{event.status}</td>
                    <td className="border border-gray-300 p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                        event.pending ? "pending" : 
                        event.tutor_approval_status ? "approved" : "rejected"
                      )}`}>
                        {event.pending ? "Pending" : 
                         event.tutor_approval_status ? "Approved" : "Rejected"}
                      </span>
                      {event.comments && (
                        <div className="text-xs text-gray-600 mt-1">
                          {event.comments}
                        </div>
                      )}
                    </td>
                    <td className="border border-gray-300 p-3">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleEdit(event)}
                          className={`p-1 ${event.pending ? 
                            "text-blue-600 hover:text-blue-800" : 
                            "text-gray-400 cursor-not-allowed"} transition`}
                          title={event.pending ? "Edit" : "Cannot edit approved/rejected events"}
                          disabled={!event.pending}
                        >
                          <FaEdit />
                        </button>
                        <button 
                          onClick={() => handleDelete(event.id)}
                          className={`p-1 ${event.pending ? 
                            "text-red-600 hover:text-red-800" : 
                            "text-gray-400 cursor-not-allowed"} transition`}
                          title={event.pending ? "Delete" : "Cannot delete approved/rejected events"}
                          disabled={!event.pending}
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
    </div>
  );
};

export default HackathonEvents;