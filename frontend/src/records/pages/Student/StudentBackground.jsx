import React, { useEffect, useMemo, useState } from 'react';
import { useStudentData } from '../../contexts/studentDataContext';
import { useNavigate } from 'react-router-dom';
import { FaUserCircle, FaEye, FaDownload, FaTrophy, FaCertificate, FaClock, FaCheckCircle, FaTimesCircle, FaMedal, FaBookOpen, FaLaptop } from 'react-icons/fa';
import { toast } from 'react-toastify';
import axios from 'axios';

const StudentDashboard = () => {
  const userId = localStorage.getItem('userId');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const { studentData, courses, achievements, loading, error, refreshData, fetchAllData } = useStudentData();
  const navigate = useNavigate();

  // Fetch extra data: NPTEL, SkillRack, Non-CGPA
  const [nptelData, setNptelData] = useState([]);
  const [skillrackData, setSkillrackData] = useState({ rank: '-', medals: 0 });
  const [nonCGPAData, setNonCGPAData] = useState([]);

  useEffect(() => {
    if (userId) {
      fetchAllData(userId)
        .then(() => setLastUpdated(new Date()))
        .catch(() => toast.error('Failed to load data'));

      // Fetch additional data
      axios.all([
        axios.get(`http://localhost:4000/api/nptel/${userId}`),
        axios.get(`http://localhost:4000/api/skillrack/${userId}`),
        axios.get(`http://localhost:4000/api/noncgpa/student/${userId}`)
      ]).then(axios.spread((nptelRes, skillRes, noncgpaRes) => {
        setNptelData(nptelRes.data || []);
        setSkillrackData(skillRes.data || { rank: '-', medals: 0 });
        setNonCGPAData(noncgpaRes.data || []);
      })).catch(() => {});
    }
  }, [userId, fetchAllData]);

  const nptelStats = useMemo(() => {
    const completed = nptelData.filter(c => c.status === 'Completed').length;
    const creditsTransferred = nptelData.filter(c => c.credit_transferred).length;
    const yetToComplete = nptelData.length - completed;
    return { completed, creditsTransferred, yetToComplete };
  }, [nptelData]);

  const approvedFeatures = achievements.filter(a => a.tutor_approval_status === true).length;
  const nonApprovedFeatures = achievements.filter(a => a.tutor_approval_status === false || a.pending).length;
  const pendingNonCGPA = nonCGPAData.filter(c => c.tutor_approval_status !== true).length;

  const handlePreview = async () => { /* Keep your existing preview logic here */ };
  const handleDownload = async () => { /* Keep your existing download logic here */ };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-lg">Loading Dashboard...</p>
      </div>
    </div>
  );

  if (error || !studentData) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
      <div className="text-center text-red-600">
        Error loading data. <button onClick={() => refreshData(userId)} className="underline">Retry</button>
      </div>
    </div>
  );

  // Extract student details safely
  const studentName = studentData.name || studentData.studentUser?.username || 'Student';
  const rollNumber = studentData.regno || studentData.rollNumber || 'N/A';
  const department = studentData.Department?.Deptname || studentData.department || 'Department:CSE';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100" style={{ padding: '1rem', fontFamily: 'Inter, sans-serif' }}>
      <div className="max-w-7xl mx-auto">

        {/* Header with Student Name, Roll No, Department */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl p-6 shadow-xl mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3 mb-2">
                <FaUserCircle className="text-4xl" />
                Welcome, {studentName}!
              </h1>
              <div className="flex flex-wrap gap-4 text-sm">
                <span className="bg-white bg-opacity-20 px-4 py-2 rounded-full font-medium">
                  Roll No: {rollNumber}
                </span>
                <span className="bg-white bg-opacity-20 px-4 py-2 rounded-full font-medium">
                  {department}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handlePreview}
                className="flex items-center gap-2 bg-white bg-opacity-20 hover:bg-opacity-30 px-5 py-3 rounded-lg transition"
              >
                <FaEye /> Preview PDF
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 bg-white bg-opacity-20 hover:bg-opacity-30 px-5 py-3 rounded-lg transition"
              >
                <FaDownload /> Download PDF
              </button>
            </div>
          </div>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

          {/* NPTEL Stats */}
          <div className="bg-white rounded-xl shadow-lg p-5 hover:shadow-xl transition">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <FaBookOpen className="text-green-600" /> NPTEL
              </h3>
              <FaCertificate className="text-2xl text-green-500" />
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Completed</span><strong className="text-green-600">{nptelStats.completed}</strong></div>
              <div className="flex justify-between"><span>Credits Transferred</span><strong className="text-blue-600">{nptelStats.creditsTransferred}</strong></div>
              <div className="flex justify-between"><span>Yet to Complete</span><strong className="text-orange-600">{nptelStats.yetToComplete}</strong></div>
            </div>
          </div>

          {/* SkillRack */}
          <div className="bg-white rounded-xl shadow-lg p-5 hover:shadow-xl transition">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <FaLaptop className="text-purple-600" /> SkillRack
              </h3>
              <FaTrophy className="text-2xl text-yellow-500" />
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">{skillrackData.rank}</p>
              <p className="text-sm text-gray-600">Current Rank</p>
              <div className="flex justify-center gap-2 mt-3 items-center">
                {[...Array(skillrackData.medals || 0)].map((_, i) => (
                  <FaMedal key={i} className="text-yellow-500 text-xl" />
                ))}
                {skillrackData.medals > 0 && <span className="ml-2 text-sm font-medium">{skillrackData.medals} Medals</span>}
              </div>
            </div>
          </div>

          {/* Approval Status */}
          <div className="bg-white rounded-xl shadow-lg p-5 hover:shadow-xl transition">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-800">Approval Status</h3>
              <FaCheckCircle className="text-2xl text-indigo-600" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Approved</span>
                <span className="text-2xl font-bold text-green-600">{approvedFeatures}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Pending/Rejected</span>
                <span className="text-2xl font-bold text-red-600">{nonApprovedFeatures}</span>
              </div>
            </div>
          </div>

          {/* Pending Non-CGPA Reminder */}
          <div className="bg-white rounded-xl shadow-lg p-5 hover:shadow-xl transition">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <FaClock className="text-orange-600" /> Pending Non-CGPA
              </h3>
              <FaTimesCircle className="text-2xl text-orange-500" />
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-orange-600">{pendingNonCGPA}</p>
              <p className="text-sm text-gray-600 mt-1">Items awaiting approval</p>
              {pendingNonCGPA > 0 && (
                <button
                  onClick={() => navigate('/noncgpa')}
                  className="mt-4 text-sm bg-orange-100 text-orange-700 px-5 py-2 rounded-lg hover:bg-orange-200 transition"
                >
                  View & Submit
                </button>
              )}
            </div>
          </div>

        </div>

        {/* Last Updated */}
        <div className="text-center mt-8 text-xs text-gray-500">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;