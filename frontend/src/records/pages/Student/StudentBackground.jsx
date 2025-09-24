import React, { useEffect, useMemo, useState } from 'react';
import { useStudentData } from '../../contexts/studentDataContext';
import { useNavigate } from 'react-router-dom';
import { 
  FaBook, FaBriefcase, FaCalendarAlt, FaTrophy, FaGraduationCap,
  FaUser, FaChartLine, FaCertificate, FaHistory, FaUserTie,
  FaLaptop, FaUserCircle, FaCheckCircle, FaRunning, FaChalkboardTeacher
} from 'react-icons/fa';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { toast } from 'react-toastify';

const StudentDashboard = () => {
  const userId = localStorage.getItem('userId');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  
  const {
    studentData,
    courses,
    internships,
    organizedEvents,
    attendedEvents,
    scholarships,
    leaves,
    achievements,
    loading,
    error,
    refreshData,
    fetchAllData
  } = useStudentData();

  const navigate = useNavigate();

  useEffect(() => {
    if (userId) {
      fetchAllData(userId)
        .then(() => setLastUpdated(new Date()))
        .catch(err => {
          toast.error('Failed to fetch data. Please try again.');
        });
    }
  }, [userId, fetchAllData]);

  // Performance metrics calculations based on provided models
  const performanceMetrics = useMemo(() => {
    // OnlineCourses model
    const completedCourses = courses.filter(c => c.status === 'Completed').length;
    const ongoingCourses = courses.filter(c => c.status === 'Ongoing').length;

    // EventAttended model
    const upcomingEvents = attendedEvents.filter(e => new Date(e.start_date) > new Date()).length;
    const pastEvents = attendedEvents.length - upcomingEvents;

    // Internship model
    const activeInternships = internships.filter(i => i.status === 'Ongoing').length;
    const completedInternships = internships.filter(i => i.status === 'completed').length;

    // Achievement model
    const approvedAchievements = achievements.filter(a => a.tutor_approval_status === true).length;
    const pendingAchievements = achievements.filter(a => a.pending === true).length;

    // Scholarship model
    const receivedScholarships = scholarships.filter(s => s.status === 'Received').length;
    const appliedScholarships = scholarships.filter(s => s.status === 'Applied').length;

    // StudentLeave model
    const approvedLeaves = leaves.filter(l => l.leave_status === 'approved').length;
    const pendingLeaves = leaves.filter(l => l.leave_status === 'pending').length;
    const rejectedLeaves = leaves.filter(l => l.leave_status === 'rejected').length;

    return {
      completedCourses,
      ongoingCourses,
      upcomingEvents,
      pastEvents,
      activeInternships,
      completedInternships,
      approvedAchievements,
      pendingAchievements,
      receivedScholarships,
      appliedScholarships,
      approvedLeaves,
      pendingLeaves,
      rejectedLeaves,
      totalCourses: courses.length,
      totalEvents: attendedEvents.length,
      totalInternships: internships.length,
      totalAchievements: achievements.length,
      totalScholarships: scholarships.length,
      totalLeaves: leaves.length
    };
  }, [courses, internships, attendedEvents, achievements, scholarships, leaves]);

  // Performance score calculation
  const performanceScore = useMemo(() => {
    const maxScore = 100;
    let score = 0;
    
    // Course completion (30% weight)
    score += (performanceMetrics.completedCourses / performanceMetrics.totalCourses) * 30 || 0;
    
    // Internships (20% weight)
    score += (performanceMetrics.completedInternships / (performanceMetrics.totalInternships || 1)) * 20;
    
    // Events attended (15% weight)
    score += (performanceMetrics.pastEvents / 10) * 15; // Cap at 10 events
    
    // Achievements (20% weight)
    score += (performanceMetrics.approvedAchievements / 5) * 20; // Cap at 5 achievements
    
    // Scholarships (15% weight)
    score += (performanceMetrics.receivedScholarships / 3) * 15; // Cap at 3 scholarships
    
    return Math.min(Math.round(score), maxScore);
  }, [performanceMetrics]);

  // Course progress data
  const courseProgressData = [
    { name: 'Completed', value: performanceMetrics.completedCourses, color: '#10B981' },
    { name: 'Ongoing', value: performanceMetrics.ongoingCourses, color: '#3B82F6' },
    { name: 'Not Started', value: performanceMetrics.totalCourses - performanceMetrics.completedCourses - performanceMetrics.ongoingCourses, color: '#F59E0B' }
  ];

  // Leave status data
  const leaveStatusData = [
    { name: 'Approved', value: performanceMetrics.approvedLeaves, color: '#10B981' },
    { name: 'Pending', value: performanceMetrics.pendingLeaves, color: '#F59E0B' },
    { name: 'Rejected', value: performanceMetrics.rejectedLeaves, color: '#EF4444' }
  ];

  // Performance radar chart data
  const performanceRadarData = [
    { subject: 'Courses', A: (performanceMetrics.completedCourses / performanceMetrics.totalCourses) * 100 || 0, fullMark: 100 },
    { subject: 'Internships', A: (performanceMetrics.completedInternships / (performanceMetrics.totalInternships || 1)) * 100, fullMark: 100 },
    { subject: 'Events', A: Math.min((performanceMetrics.pastEvents / 10) * 100, 100), fullMark: 100 },
    { subject: 'Achievements', A: Math.min((performanceMetrics.approvedAchievements / 5) * 100, 100), fullMark: 100 },
    { subject: 'Scholarships', A: Math.min((performanceMetrics.receivedScholarships / 3) * 100, 100), fullMark: 100 },
  ];

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-8 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        <p className="mt-4 text-lg text-gray-700 font-medium">Loading your dashboard...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-8 flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="text-red-500 text-xl mb-4 font-medium">{error}</div>
        <button 
          onClick={() => refreshData(userId)}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
        >
          Retry
        </button>
      </div>
    </div>
  );

  if (!studentData) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-8 flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="text-red-500 text-xl mb-4 font-medium">No student data found</div>
        <button 
          onClick={() => navigate('/')}
          className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
        >
          Go Home
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 md:p-6">
      {/* Header */}
      <div className="mb-6 p-6 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl shadow-xl text-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-full">
                <FaUserCircle className="text-2xl" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">Student Dashboard</h1>
                <p className="text-indigo-100">
                  Welcome back, <span className="font-semibold text-white">{studentData.studentUser?.username || 'Student'}</span>!
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              <div className="flex items-center text-sm bg-white bg-opacity-10 px-3 py-1 rounded-full">
                <FaUserTie className="mr-2 text-yellow-300" />
                {studentData.department || 'Department'}
              </div>
              <div className="flex items-center text-sm bg-white bg-opacity-10 px-3 py-1 rounded-full">
                <FaGraduationCap className="mr-2 text-yellow-300" />
                {studentData.rollNumber || 'Roll Number'}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-white bg-opacity-20 flex items-center justify-center shadow-inner">
                <div className="text-2xl md:text-3xl font-bold text-white">{performanceScore}</div>
              </div>
              <div className="absolute -bottom-4 left-0 right-0 text-center text-xs font-semibold bg-indigo-700 rounded-full px-2 py-1 mx-auto w-3/4">
                Performance Score
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <MetricCard 
          icon={<FaLaptop className="text-blue-500" />}
          title="Online Courses"
          mainValue={performanceMetrics.completedCourses}
          secondaryValue={`of ${performanceMetrics.totalCourses}`}
          description="Courses completed"
          progress={(performanceMetrics.completedCourses / performanceMetrics.totalCourses) * 100}
          color="blue"
        />

        <MetricCard 
          icon={<FaBriefcase className="text-green-500" />}
          title="Internships"
          mainValue={performanceMetrics.completedInternships}
          secondaryValue={`of ${performanceMetrics.totalInternships}`}
          description="Internships completed"
          progress={(performanceMetrics.completedInternships / performanceMetrics.totalInternships) * 100}
          color="green"
        />

        <MetricCard 
          icon={<FaTrophy className="text-yellow-500" />}
          title="Achievements"
          mainValue={performanceMetrics.approvedAchievements}
          secondaryValue={`of ${performanceMetrics.totalAchievements}`}
          description="Approved achievements"
          progress={(performanceMetrics.approvedAchievements / performanceMetrics.totalAchievements) * 100}
          color="yellow"
        />
      </div>

      {/* Performance Overview */}
      <div className="bg-white p-6 rounded-2xl shadow-lg mb-6">
        <h2 className="text-xl font-bold text-gray-700 mb-4 flex items-center gap-2">
          <FaChartLine className="text-indigo-600" /> Performance Overview
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-2 text-gray-700">Performance Breakdown</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={performanceRadarData}>
                  <PolarGrid gridType="circle" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#4B5563' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#4B5563' }} />
                  <Radar name="Performance" dataKey="A" stroke="#6366F1" fill="#6366F1" fillOpacity={0.4} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white',
                      borderRadius: '0.5rem',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      border: 'none'
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2 text-gray-700">Performance Summary</h3>
            <div className="space-y-4">
              <PerformanceIndicator 
                label="Course Completion"
                value={`${performanceMetrics.completedCourses}/${performanceMetrics.totalCourses}`}
                progress={(performanceMetrics.completedCourses / performanceMetrics.totalCourses) * 100}
              />
              <PerformanceIndicator 
                label="Internship Completion"
                value={`${performanceMetrics.completedInternships}/${performanceMetrics.totalInternships}`}
                progress={(performanceMetrics.completedInternships / performanceMetrics.totalInternships) * 100}
              />
              <PerformanceIndicator 
                label="Approved Achievements"
                value={`${performanceMetrics.approvedAchievements}/${performanceMetrics.totalAchievements}`}
                progress={(performanceMetrics.approvedAchievements / performanceMetrics.totalAchievements) * 100}
              />
              <PerformanceIndicator 
                label="Received Scholarships"
                value={`${performanceMetrics.receivedScholarships}/${performanceMetrics.totalScholarships}`}
                progress={(performanceMetrics.receivedScholarships / performanceMetrics.totalScholarships) * 100}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard 
          icon={<FaCalendarAlt className="text-purple-500" />}
          title="Events Attended"
          value={performanceMetrics.pastEvents}
          change={`+${performanceMetrics.upcomingEvents} upcoming`}
          color="purple"
        />

        <StatCard 
          icon={<FaGraduationCap className="text-red-500" />}
          title="Scholarships"
          value={performanceMetrics.receivedScholarships}
          change={`${performanceMetrics.appliedScholarships} applied`}
          color="red"
        />

        <StatCard 
          icon={<FaRunning className="text-indigo-500" />}
          title="Leave Applications"
          value={performanceMetrics.approvedLeaves}
          change={`${performanceMetrics.pendingLeaves} pending`}
          color="indigo"
        />

        <StatCard 
          icon={<FaChalkboardTeacher className="text-teal-500" />}
          title="Events Organized"
          value={organizedEvents.length}
          change=""
          color="teal"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-2xl shadow-lg">
        <h2 className="text-xl font-bold text-gray-700 mb-4 flex items-center gap-2">
          <FaCertificate className="text-indigo-600" /> Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <QuickAction 
            icon={<FaLaptop className="text-blue-600" />}
            label="Add Course"
            onClick={() => navigate('/student-online-courses')}
            color="blue"
          />
          <QuickAction 
            icon={<FaBriefcase className="text-green-600" />}
            label="Add Internship"
            onClick={() => navigate('/student-internships')}
            color="green"
          />
          <QuickAction 
            icon={<FaCalendarAlt className="text-purple-600" />}
            label="Add Event"
            onClick={() => navigate('/student-event-attended')}
            color="purple"
          />
          <QuickAction 
            icon={<FaTrophy className="text-yellow-600" />}
            label="Add Achievement"
            onClick={() => navigate('/student-achievements')}
            color="yellow"
          />
          <QuickAction 
            icon={<FaGraduationCap className="text-red-600" />}
            label="Add Scholarship"
            onClick={() => navigate('/student-scholarships')}
            color="red"
          />
          <QuickAction 
            icon={<FaUserCircle className="text-indigo-600" />}
            label="View Profile"
            onClick={() => navigate(`/student-biodata/${userId}`)}
            color="indigo"
          />
        </div>
      </div>
    </div>
  );
};

// Reusable Metric Card Component
const MetricCard = ({ icon, title, mainValue, secondaryValue, description, progress, color }) => {
  const colorClasses = {
    blue: 'from-blue-100 to-blue-50 border-blue-200',
    green: 'from-green-100 to-green-50 border-green-200',
    yellow: 'from-yellow-100 to-yellow-50 border-yellow-200',
    purple: 'from-purple-100 to-purple-50 border-purple-200',
    red: 'from-red-100 to-red-50 border-red-200',
    indigo: 'from-indigo-100 to-indigo-50 border-indigo-200',
    teal: 'from-teal-100 to-teal-50 border-teal-200'
  };

  return (
    <motion.div 
      whileHover={{ y: -3 }}
      className={`bg-gradient-to-b ${colorClasses[color]} border rounded-xl p-4 shadow-sm`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-full bg-white shadow-sm`}>
            {icon}
          </div>
          <h3 className="font-semibold text-gray-700">{title}</h3>
        </div>
        <span className="text-sm text-gray-500">{description}</span>
      </div>
      
      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-bold text-gray-800">{mainValue}</p>
          <p className="text-sm text-gray-500">{secondaryValue}</p>
        </div>
        <div className="text-right">
          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full ${
                color === 'blue' ? 'bg-blue-500' :
                color === 'green' ? 'bg-green-500' :
                color === 'yellow' ? 'bg-yellow-500' :
                color === 'purple' ? 'bg-purple-500' :
                color === 'red' ? 'bg-red-500' :
                color === 'indigo' ? 'bg-indigo-500' : 'bg-teal-500'
              }`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-1">{Math.round(progress)}% completed</p>
        </div>
      </div>
    </motion.div>
  );
};

// Reusable Performance Indicator Component
const PerformanceIndicator = ({ label, value, progress }) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-xs font-medium text-gray-500">{value}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="h-2 rounded-full bg-indigo-600" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
};

// Reusable Stat Card Component
const StatCard = ({ icon, title, value, change, color }) => {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-100',
    green: 'text-green-600 bg-green-100',
    yellow: 'text-yellow-600 bg-yellow-100',
    purple: 'text-purple-600 bg-purple-100',
    red: 'text-red-600 bg-red-100',
    indigo: 'text-indigo-600 bg-indigo-100',
    teal: 'text-teal-600 bg-teal-100'
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <div className={`p-2 rounded-full ${colorClasses[color]}`}>
          {icon}
        </div>
        {change && (
          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
            {change}
          </span>
        )}
      </div>
      <div className="mt-3">
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );
};

// Reusable Quick Action Component
const QuickAction = ({ icon, label, onClick, color }) => {
  const bgColors = {
    blue: 'bg-blue-50 hover:bg-blue-100',
    green: 'bg-green-50 hover:bg-green-100',
    yellow: 'bg-yellow-50 hover:bg-yellow-100',
    purple: 'bg-purple-50 hover:bg-purple-100',
    red: 'bg-red-50 hover:bg-red-100',
    indigo: 'bg-indigo-50 hover:bg-indigo-100',
    teal: 'bg-teal-50 hover:bg-teal-100'
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`flex flex-col items-center p-3 rounded-lg transition-colors ${bgColors[color]}`}
    >
      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center mb-2 shadow-sm">
        {icon}
      </div>
      <span className="text-xs font-medium text-gray-700">{label}</span>
    </motion.button>
  );
};

export default StudentDashboard;