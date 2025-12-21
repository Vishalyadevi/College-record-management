import React, { useState, useEffect } from 'react';
import { RefreshCw, AlertCircle, TrendingUp, Users, Briefcase, FileSpreadsheet, FileText, Calendar, Award, BookOpen, BookMarked, Download, Sparkles } from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const Dashboard = () => {
  const [stats, setStats] = useState({
    seedmoney: 1,
    scholars: 0,
    proposals: 2,
    projectProposals: 2,
    events: 1,
    industry: 0,
    certifications: 1,
    publications: 0,
    eventsOrganized: 2,
    hIndex: 2,
    resourcePerson: 0,
    recognition: 0,
    patents: 1,
    projectMentors: 4
  });

  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [notification, setNotification] = useState(null);

  // Get user ID from localStorage or context (adjust based on your auth setup)
  const getUserId = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.Userid || user.id;
  };

  const statItems = [
    { key: 'seedmoney', label: 'Seed Money', color: 'from-violet-400 via-purple-500 to-indigo-500', bgGlow: 'shadow-purple-500/50', icon: <FileText size={20} /> },
    { key: 'scholars', label: 'Scholars', color: 'from-pink-400 via-rose-500 to-red-500', bgGlow: 'shadow-pink-500/50', icon: <Users size={20} /> },
    { key: 'proposals', label: 'Consultancy', color: 'from-emerald-400 via-teal-500 to-cyan-500', bgGlow: 'shadow-emerald-500/50', icon: <Briefcase size={20} /> },
    { key: 'projectProposals', label: 'Funded Project', color: 'from-blue-400 via-indigo-500 to-purple-500', bgGlow: 'shadow-blue-500/50', icon: <FileSpreadsheet size={20} /> },
    { key: 'events', label: 'Events Attended', color: 'from-amber-400 via-orange-500 to-red-500', bgGlow: 'shadow-amber-500/50', icon: <Calendar size={20} /> },
    { key: 'industry', label: 'Industry Knowhow', color: 'from-lime-400 via-green-500 to-emerald-500', bgGlow: 'shadow-lime-500/50', icon: <Briefcase size={20} /> },
    { key: 'certifications', label: 'Certifications', color: 'from-fuchsia-400 via-pink-500 to-rose-500', bgGlow: 'shadow-fuchsia-500/50', icon: <Award size={20} /> },
    { key: 'publications', label: 'Publications', color: 'from-cyan-400 via-blue-500 to-indigo-500', bgGlow: 'shadow-cyan-500/50', icon: <BookOpen size={20} /> },
    { key: 'eventsOrganized', label: 'Events Organized', color: 'from-rose-400 via-red-500 to-pink-500', bgGlow: 'shadow-rose-500/50', icon: <BookMarked size={20} /> },
    { key: 'hIndex', label: 'H-Index', color: 'from-teal-400 via-cyan-500 to-blue-500', bgGlow: 'shadow-teal-500/50', icon: <FileText size={20} /> },
    { key: 'resourcePerson', label: 'Resource Person', color: 'from-yellow-400 via-amber-500 to-orange-500', bgGlow: 'shadow-yellow-500/50', icon: <Users size={20} /> },
    { key: 'recognition', label: 'Recognition', color: 'from-indigo-400 via-purple-500 to-pink-500', bgGlow: 'shadow-indigo-500/50', icon: <Award size={20} /> },
    { key: 'patents', label: 'Patent/Product', color: 'from-green-400 via-emerald-500 to-teal-500', bgGlow: 'shadow-green-500/50', icon: <FileText size={20} /> },
    { key: 'projectMentors', label: 'Project Mentors', color: 'from-purple-400 via-fuchsia-500 to-pink-500', bgGlow: 'shadow-purple-500/50', icon: <Users size={20} /> }
  ];

  const categories = statItems.map(item => ({
    name: item.label,
    count: stats[item.key] || 0
  }));

  const doughnutData = {
    labels: categories.map(cat => cat.name),
    datasets: [{
      data: categories.map(cat => cat.count),
      backgroundColor: [
        'rgba(139, 92, 246, 0.9)', 'rgba(244, 114, 182, 0.9)', 'rgba(52, 211, 153, 0.9)',
        'rgba(99, 102, 241, 0.9)', 'rgba(251, 191, 36, 0.9)', 'rgba(132, 204, 22, 0.9)',
        'rgba(236, 72, 153, 0.9)', 'rgba(34, 211, 238, 0.9)', 'rgba(251, 113, 133, 0.9)',
        'rgba(20, 184, 166, 0.9)', 'rgba(250, 204, 21, 0.9)', 'rgba(168, 85, 247, 0.9)',
        'rgba(52, 211, 153, 0.9)', 'rgba(217, 70, 239, 0.9)',
      ],
      borderWidth: 3,
      borderColor: '#1e1b4b',
    }],
  };

  const barData = {
    labels: categories.map(cat => cat.name),
    datasets: [{
      label: 'Count',
      data: categories.map(cat => cat.count),
      backgroundColor: [
        'rgba(139, 92, 246, 0.8)', 'rgba(244, 114, 182, 0.8)', 'rgba(52, 211, 153, 0.8)',
        'rgba(99, 102, 241, 0.8)', 'rgba(251, 191, 36, 0.8)', 'rgba(132, 204, 22, 0.8)',
        'rgba(236, 72, 153, 0.8)', 'rgba(34, 211, 238, 0.8)', 'rgba(251, 113, 133, 0.8)',
        'rgba(20, 184, 166, 0.8)', 'rgba(250, 204, 21, 0.8)', 'rgba(168, 85, 247, 0.8)',
        'rgba(52, 211, 153, 0.8)', 'rgba(217, 70, 239, 0.8)',
      ],
      borderWidth: 0,
      borderRadius: 8,
    }],
  };

  const totalCount = Object.values(stats).reduce((sum, val) => sum + (val || 0), 0);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleExportPDF = async () => {
    const userId = getUserId();
    
    if (!userId) {
      showNotification('User not authenticated. Please log in.', 'error');
      return;
    }

    setPdfLoading(true);

    try {
      // Call the backend API to generate PDF
      const response = await fetch(`http://localhost:5000/api/pdf/faculty-profile/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/pdf',
          // Add authentication token if required
          // 'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to generate PDF: ${response.statusText}`);
      }

      // Convert response to blob
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `faculty_profile_${userId}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showNotification('PDF generated and downloaded successfully!', 'success');
    } catch (error) {
      console.error('Error generating PDF:', error);
      showNotification(`Failed to generate PDF: ${error.message}`, 'error');
    } finally {
      setPdfLoading(false);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setLastUpdated(new Date());
      showNotification('Data refreshed successfully!');
    }, 1000);
  };

  return (
    <div className="h-screen bg-white overflow-hidden">
      {/* Animated Background Effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-2xl ${
          notification.type === 'success' 
            ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
            : 'bg-gradient-to-r from-red-500 to-rose-600'
        } text-white font-semibold animate-slide-in-right`}>
          <div className="flex items-center gap-3">
            {notification.type === 'success' ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <AlertCircle className="w-6 h-6" />
            )}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      <div className="relative h-full p-4 flex flex-col">
        <div className="max-w-[1920px] mx-auto w-full h-full flex flex-col">
          
          {/* Modern Header */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Academic Dashboard</h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-lg border border-white/20">
                <span className="text-xs text-gray-500">{lastUpdated.toLocaleTimeString()}</span>
              </div>
              
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 text-gray-800 rounded-lg hover:bg-white/20 disabled:opacity-50 transition-all text-sm"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>

              {/* Premium PDF Button */}
              <button
                onClick={handleExportPDF}
                disabled={pdfLoading}
                className="relative flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-pink-500 via-rose-500 to-orange-500 text-white rounded-xl hover:shadow-2xl hover:shadow-pink-500/50 transition-all transform hover:scale-105 text-sm font-semibold group overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-30 transform -skew-x-12 transition-all duration-700 group-hover:translate-x-full"></div>
                <Download className={`w-4 h-4 relative z-10 ${pdfLoading ? 'animate-bounce' : ''}`} />
                <span className="relative z-10">{pdfLoading ? 'Generating...' : 'Export PDF'}</span>
                <div className="absolute inset-0 rounded-xl bg-white opacity-0 group-hover:opacity-10"></div>
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 grid grid-cols-12 gap-4 overflow-hidden">
            
            {/* Left Column - Stats Cards */}
            <div className="col-span-8 flex flex-col gap-4 overflow-hidden">
              
              {/* Hero Summary Card */}
              <div className="relative bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl shadow-2xl p-5 overflow-hidden group hover:shadow-purple-500/50 transition-all">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                      <TrendingUp className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">Total Achievements</h2>
                      <p className="text-sm text-white/80">Combined count across all categories</p>
                    </div>
                  </div>
                  <div className="text-6xl font-black text-white drop-shadow-2xl">{totalCount}</div>
                </div>
              </div>

              {/* Rectangle Stats Cards Grid */}
              <div className="flex-1 grid grid-cols-4 gap-3 overflow-auto">
                {statItems.map(({ key, label, color, bgGlow, icon }) => (
                  <div
                    key={key}
                    className={`relative bg-gradient-to-br ${color} rounded-xl shadow-xl hover:shadow-2xl ${bgGlow} p-4 cursor-pointer transform transition-all duration-300 hover:scale-105 group overflow-hidden`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transform -skew-x-12 transition-all duration-500"></div>
                    <div className="absolute top-3 right-3 w-2 h-2 bg-white rounded-full opacity-60 group-hover:animate-ping"></div>
                    
                    <div className="relative flex flex-col h-full">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-white drop-shadow-lg">{icon}</div>
                      </div>
                      <h3 className="text-xs font-bold text-white mb-2 leading-tight flex-1">{label}</h3>
                      <div className="text-4xl font-black text-white drop-shadow-lg mb-2">{stats[key] || 0}</div>
                      <div className="text-white/70 text-[10px] font-semibold">Click to view →</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column - Charts */}
            <div className="col-span-4 flex flex-col gap-4 overflow-hidden">
              
              {/* Doughnut Chart */}
              <div className="flex-1 bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-4 border border-white/20">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-gray-800">Distribution Overview</h3>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                </div>
                <div className="h-[calc(100%-2.5rem)]">
                  <Doughnut 
                    data={doughnutData} 
                    options={{ 
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false },
                        tooltip: {
                          backgroundColor: 'rgba(0, 0, 0, 0.8)',
                          titleColor: 'white',
                          bodyColor: 'white',
                          padding: 12,
                          borderColor: 'rgba(255, 255, 255, 0.2)',
                          borderWidth: 1
                        }
                      },
                      cutout: '65%'
                    }} 
                  />
                </div>
              </div>
              
              {/* Bar Chart */}
              <div className="flex-1 bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-4 border border-white/20">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-gray-800">Activity Comparison</h3>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                </div>
                <div className="h-[calc(100%-2.5rem)]">
                  <Bar 
                    data={barData} 
                    options={{ 
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false },
                        tooltip: {
                          backgroundColor: 'rgba(0, 0, 0, 0.8)',
                          titleColor: 'white',
                          bodyColor: 'white',
                          padding: 12,
                          borderColor: 'rgba(255, 255, 255, 0.2)',
                          borderWidth: 1
                        }
                      },
                      scales: {
                        x: {
                          ticks: {
                            color: 'rgba(0, 0, 0, 0.8)',
                            font: { size: 9 },
                            maxRotation: 45,
                            minRotation: 45
                          },
                          grid: { color: 'rgba(255, 255, 255, 0.1)' }
                        },
                        y: {
                          ticks: {
                            color: 'rgba(0, 0, 0, 0.8)',
                            font: { size: 10 }
                          },
                          grid: { color: 'rgba(255, 255, 255, 0.1)' }
                        }
                      }
                    }} 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;