import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaExternalLinkAlt, FaCheck, FaTimes, FaCalendarAlt } from "react-icons/fa";

const StudentHackathon = () => {
  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(false);

  // Get student ID from localStorage or auth context
  const getStudentId = () => {
    // Get from localStorage where your auth stores user info
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.Userid || user.id || user.student_id;
  };

  // Get auth token from localStorage
  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  // Create axios instance with auth header
  const axiosInstance = axios.create({
    baseURL: 'http://localhost:4000',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  // Add token to every request
  axiosInstance.interceptors.request.use(
    (config) => {
      const token = getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Handle auth errors
  axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401 || error.response?.status === 403) {
        alert('Session expired. Please login again.');
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );

  useEffect(() => {
    const studentId = getStudentId();
    if (!studentId) {
      alert('Please login to view hackathons');
      window.location.href = '/login';
      return;
    }
    fetchHackathons();
  }, []);

  const fetchHackathons = async () => {
    try {
      setLoading(true);
      const studentId = getStudentId();
      
      if (!studentId) {
        throw new Error('Student ID not found');
      }

      const response = await axiosInstance.get(`/api/student-hackathons?student_id=${studentId}`);
      setHackathons(response.data.data || []);
    } catch (error) {
      console.error('Error fetching hackathons:', error);
      alert(error.response?.data?.message || 'Error fetching hackathons');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (hackathonId) => {
    try {
      const studentId = getStudentId();
      
      if (!studentId) {
        alert('Please login to register');
        return;
      }

      await axiosInstance.post('/api/student-hackathons/register', {
        student_id: studentId,
        hackathon_id: hackathonId
      });
      alert('Registered successfully!');
      fetchHackathons();
    } catch (error) {
      console.error('Error registering:', error);
      alert(error.response?.data?.message || 'Error registering for hackathon');
    }
  };

  const handleAttempt = async (hackathonId) => {
    const attemptDate = prompt('Enter attempt date (YYYY-MM-DD):');
    if (!attemptDate) return;

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(attemptDate)) {
      alert('Invalid date format. Please use YYYY-MM-DD');
      return;
    }

    try {
      const studentId = getStudentId();
      
      if (!studentId) {
        alert('Please login to mark attempt');
        return;
      }

      await axiosInstance.put('/api/student-hackathons/attempt', {
        student_id: studentId,
        hackathon_id: hackathonId,
        attempt_date: attemptDate
      });
      alert('Attempt recorded successfully!');
      fetchHackathons();
    } catch (error) {
      console.error('Error recording attempt:', error);
      alert(error.response?.data?.message || 'Error recording attempt');
    }
  };

  const StatusBadge = ({ registered, attempted }) => {
    if (attempted) {
      return <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">Attempted</span>;
    }
    if (registered) {
      return <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">Registered</span>;
    }
    return <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">Not Registered</span>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return 'Invalid Date';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6"
          style={{ marginLeft: "250px", padding: "20px" }}
>
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Available Hackathons</h1>
          <p className="text-gray-600">Register and track your hackathon participation</p>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading hackathons...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hackathons.map((hackathon) => (
              <div key={hackathon.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 flex-1">{hackathon.contest_name}</h3>
                    <a
                      href={hackathon.contest_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 ml-2"
                    >
                      <FaExternalLinkAlt />
                    </a>
                  </div>
                  
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Date:</span>
                      <span className="font-medium">{formatDate(hackathon.date)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Host:</span>
                      <span className="font-medium">{hackathon.host_by}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Eligibility:</span>
                      <span className="font-medium">{hackathon.eligibility_year}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Department:</span>
                      <span className="font-medium">{hackathon.department}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Attempt By:</span>
                      <span className="font-medium">{formatDate(hackathon.attempt_date)}</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <StatusBadge registered={hackathon.registered} attempted={hackathon.attempted} />
                  </div>

                  <div className="space-y-2">
                    {!hackathon.registered && (
                      <button
                        onClick={() => handleRegister(hackathon.id)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <FaCheck /> Register Now
                      </button>
                    )}
                    
                    {hackathon.registered && !hackathon.attempted && (
                      <button
                        onClick={() => handleAttempt(hackathon.id)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <FaCalendarAlt /> Mark as Attempted
                      </button>
                    )}

                    {hackathon.attempted && (
                      <div className="text-center text-sm text-gray-600">
                        Attempted on: {formatDate(hackathon.student_attempt_date)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {hackathons.length === 0 && !loading && (
          <div className="text-center py-12 bg-white rounded-xl shadow-lg">
            <FaCalendarAlt className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Hackathons Available</h3>
            <p className="text-gray-500">Check back later for upcoming hackathons.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentHackathon;