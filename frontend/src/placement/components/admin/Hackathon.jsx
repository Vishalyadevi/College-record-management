import React, { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "./AdminNavbar";

const AdminHackathon = () => {
  const [hackathonData, setHackathonData] = useState({
    title: "",
    description: "",
    link: "",
    startDate: "",
    endDate: "",
    prize: "",
    tags: []
  });
  const [hackathons, setHackathons] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const fetchHackathons = async () => {
    setLoading(true);
    try {
      const response = await axios.get("http://localhost:4000/api/placement/hackathons");
      setHackathons(response.data);
    } catch (err) {
      console.error("Error fetching hackathons:", err);
      alert("Error fetching hackathons");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHackathons();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setHackathonData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTagInput = (e) => {
    if (e.key === "Enter" && e.target.value.trim()) {
      e.preventDefault();
      const newTag = e.target.value.trim();
      if (!hackathonData.tags.includes(newTag)) {
        setHackathonData(prev => ({
          ...prev,
          tags: [...prev.tags, newTag]
        }));
      }
      e.target.value = "";
    }
  };

  const removeTag = (index) => {
    setHackathonData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  const resetForm = () => {
    setHackathonData({
      title: "",
      description: "",
      link: "",
      startDate: "",
      endDate: "",
      prize: "",
      tags: []
    });
    setIsEditing(false);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!hackathonData.title.trim() || !hackathonData.link.trim()) {
      alert("Please enter hackathon title and registration link.");
      return;
    }

    const userId = localStorage.getItem("userId") || "1";

    try {
      if (isEditing) {
        await axios.put(`http://localhost:4000/api/placement/hackathons/${editingId}`, {
          ...hackathonData,
          updated_by: userId,
        });
        alert("Hackathon updated successfully!");
      } else {
        await axios.post("http://localhost:4000/api/placement/hackathons", {
          ...hackathonData,
          created_by: userId,
        });
        alert("Hackathon posted successfully!");
      }
      
      resetForm();
      fetchHackathons();
      setShowForm(false);
    } catch (err) {
      console.error("Error posting hackathon:", err);
      alert("Error posting hackathon: " + (err.response?.data?.message || err.message));
    }
  };

  const handleEdit = (hackathon) => {
    setHackathonData({
      title: hackathon.title || "",
      description: hackathon.content || "",
      link: hackathon.link || "",
      startDate: hackathon.startDate || "",
      endDate: hackathon.endDate || "",
      prize: hackathon.prize || "",
      tags: hackathon.tags || []
    });
    setIsEditing(true);
    setEditingId(hackathon.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this hackathon?")) return;
    try {
      await axios.delete(`http://localhost:4000/api/placement/hackathons/${id}`);
      alert("Hackathon deleted successfully!");
      fetchHackathons();
    } catch (err) {
      console.error("Error deleting hackathon:", err);
      alert("Error deleting hackathon: " + (err.response?.data?.message || err.message));
    }
  };

  const formatDate = (dateString) =>
    dateString ? new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }) : "TBD";

  const isUpcoming = (endDate) => {
    return new Date(endDate) > new Date();
  };

  const filteredHackathons = hackathons.filter(hackathon => {
    const matchesSearch = hackathon.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         hackathon.content?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === "upcoming") {
      return matchesSearch && isUpcoming(hackathon.endDate);
    }
    if (activeTab === "past") {
      return matchesSearch && !isUpcoming(hackathon.endDate);
    }
    return matchesSearch;
  });

  const gradientColors = [
    "from-blue-500 to-purple-600",
    "from-green-500 to-teal-600",
    "from-orange-500 to-red-600",
    "from-purple-500 to-indigo-600",
    "from-teal-500 to-blue-600",
    "from-red-500 to-orange-600"
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <br></br>
      <br></br>
      <br></br>
      <div className="pt-20 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Hackathon</h1>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search hackathons..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                />
                {/* <svg className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg> */}
              </div>
              
              <button
                onClick={() => {
                  resetForm();
                  setShowForm(true);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                New Hackathon
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 mt-6">
            <button
              className={`px-4 py-2 font-medium text-sm ${activeTab === "all" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}
              onClick={() => setActiveTab("all")}
            >
              All Hackathons ({hackathons.length})
            </button>
            <button
              className={`px-4 py-2 font-medium text-sm ${activeTab === "upcoming" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}
              onClick={() => setActiveTab("upcoming")}
            >
              Upcoming ({hackathons.filter(h => isUpcoming(h.endDate)).length})
            </button>
            <button
              className={`px-4 py-2 font-medium text-sm ${activeTab === "past" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}
              onClick={() => setActiveTab("past")}
            >
              Past ({hackathons.filter(h => !isUpcoming(h.endDate)).length})
            </button>
          </div>
        </div>

        {/* Hackathon Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">
                {isEditing ? 'Edit Hackathon' : 'Create New Hackathon'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hackathon Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={hackathonData.title}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter hackathon title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prize Pool</label>
                  <input
                    type="text"
                    name="prize"
                    value={hackathonData.prize}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., $10,000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    value={hackathonData.startDate}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    value={hackathonData.endDate}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Registration Link *</label>
                  <input
                    type="url"
                    name="link"
                    value={hackathonData.link}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com/register"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    name="description"
                    value={hackathonData.description}
                    onChange={handleInputChange}
                    rows="4"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe the hackathon theme, rules, and requirements..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                  <input
                    type="text"
                    onKeyDown={handleTagInput}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter tags and press Enter (e.g., AI, Web Development, Blockchain)"
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
                    {hackathonData.tags.map((tag, index) => (
                      <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center">
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(index)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {isEditing ? 'Update Hackathon' : 'Create Hackathon'}
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Hackathon Cards Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredHackathons.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hackathons found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm ? "Try adjusting your search terms" : "Get started by creating your first hackathon"}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Hackathon
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHackathons.map((hackathon, index) => {
              const gradient = gradientColors[index % gradientColors.length];
              const isUpcomingHackathon = isUpcoming(hackathon.endDate);
              
              return (
                <div
                  key={hackathon.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Header with Gradient */}
                  <div className={`h-3 bg-gradient-to-r ${gradient}`}></div>
                  
                  <div className="p-5">
                    {/* Status Badge */}
                    <div className="flex justify-between items-start mb-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        isUpcomingHackathon 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {isUpcomingHackathon ? 'Upcoming' : 'Completed'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(hackathon.created_at)}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {hackathon.title || 'Hackathon'}
                    </h3>

                    {/* Description */}
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {hackathon.content || hackathon.description}
                    </p>

                    {/* Tags */}
                    {hackathon.tags && hackathon.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {hackathon.tags.slice(0, 3).map((tag, tagIndex) => (
                          <span key={tagIndex} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                            {tag}
                          </span>
                        ))}
                        {hackathon.tags.length > 3 && (
                          <span className="text-gray-500 text-xs">+{hackathon.tags.length - 3} more</span>
                        )}
                      </div>
                    )}

                    {/* Details */}
                    <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                      <div className="flex items-center text-gray-600">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {formatDate(hackathon.endDate)}
                      </div>
                      {hackathon.prize && (
                        <div className="flex items-center text-green-600 font-medium">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {hackathon.prize}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-between items-center">
                      <a
                        href={hackathon.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-blue-600 text-white text-center py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium mr-2"
                      >
                        Register Now
                      </a>
                      
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleEdit(hackathon)}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(hackathon.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminHackathon;