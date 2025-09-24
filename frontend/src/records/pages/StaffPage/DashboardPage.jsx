import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCw, AlertCircle, TrendingUp, Users, Briefcase, FileSpreadsheet, FileText, Calendar, Award, BookOpen, BookMarked } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getDashboardStats, createPollingService } from '../../services/api';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, RadialLinearScale, PointElement, LineElement } from 'chart.js';
import { Pie, PolarArea } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, RadialLinearScale, PointElement, LineElement);

const Dashboard = () => {
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({
    seedmoney: 0,
    scholars: 0,
    proposals: 0,
    projectProposals: 0,
    events: 0,
    industry: 0,
    certifications: 0,
    publications: 0,
    eventsOrganized: 0,
    hIndex: 0,
    resourcePerson: 0,
    recognition: 0,
    patents: 0,
    projectMentors: 0
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const pollingCleanupRef = useRef(null);

  const updateStatsIfIncreased = useCallback((newStats) => {
    setStats((prevStats) => {
      let updated = false;
      const updatedStats = { ...prevStats };
      for (const key in newStats) {
        if (newStats[key] > (prevStats[key] || 0)) {
          updatedStats[key] = newStats[key];
          updated = true;
        }
      }
      return updated ? updatedStats : prevStats;
    });
    setLastUpdated(new Date());
  }, []);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getDashboardStats();
      setStats(response.data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial load
    loadStats();

    // Start polling for real-time updates
    pollingCleanupRef.current = createPollingService(updateStatsIfIncreased, 5000);

    return () => {
      // Cleanup polling on unmount
      if (pollingCleanupRef.current) {
        pollingCleanupRef.current();
      }
    };
  }, [loadStats, updateStatsIfIncreased]);

  const statItems = [
    { 
      key: 'seedmoney', 
      label: 'Seed Money', 
      gradient: 'bg-gradient-to-br from-indigo-500 to-indigo-700',
      hoverGradient: 'hover:from-indigo-600 hover:to-indigo-800',
      icon: <FileText size={24} />,
      path: '/seed-money'
    },
    { 
      key: 'scholars', 
      label: 'Scholars', 
      gradient: 'bg-gradient-to-br from-purple-500 to-purple-700',
      hoverGradient: 'hover:from-purple-600 hover:to-purple-800',
      icon: <Users size={24} />,
      path: '/scholars'
    },
    { 
      key: 'proposals', 
      label: 'Consultancy', 
      gradient: 'bg-gradient-to-br from-green-500 to-green-700',
      hoverGradient: 'hover:from-green-600 hover:to-green-800',
      icon: <Briefcase size={24} />,
      path: '/proposals'
    },
    { 
      key: 'projectProposals', 
      label: 'Funded Project', 
      gradient: 'bg-gradient-to-br from-emerald-500 to-emerald-700',
      hoverGradient: 'hover:from-emerald-600 hover:to-emerald-800',
      icon: <FileSpreadsheet size={24} />,
      path: '/project-proposal'
    },
    { 
      key: 'events', 
      label: 'Events Attended', 
      gradient: 'bg-gradient-to-br from-yellow-500 to-yellow-700',
      hoverGradient: 'hover:from-yellow-600 hover:to-yellow-800',
      icon: <Calendar size={24} />,
      path: '/events'
    },
    { 
      key: 'industry', 
      label: 'Industry Knowhow', 
      gradient: 'bg-gradient-to-br from-orange-500 to-orange-700',
      hoverGradient: 'hover:from-orange-600 hover:to-orange-800',
      icon: <Briefcase size={24} />,
      path: '/industry'
    },
    { 
      key: 'certifications', 
      label: 'Certification Courses', 
      gradient: 'bg-gradient-to-br from-red-500 to-red-700',
      hoverGradient: 'hover:from-red-600 hover:to-red-800',
      icon: <Award size={24} />,
      path: '/certifications'
    },
    { 
      key: 'publications', 
      label: 'Publications', 
      gradient: 'bg-gradient-to-br from-pink-500 to-pink-700',
      hoverGradient: 'hover:from-pink-600 hover:to-pink-800',
      icon: <BookOpen size={24} />,
      path: '/book-chapters'
    },
    { 
      key: 'eventsOrganized', 
      label: 'Events Organized', 
      gradient: 'bg-gradient-to-br from-rose-500 to-rose-700',
      hoverGradient: 'hover:from-rose-600 hover:to-rose-800',
      icon: <BookMarked size={24} />,
      path: '/events-organized'
    },
    { 
      key: 'hIndex', 
      label: 'H-Index', 
      gradient: 'bg-gradient-to-br from-cyan-500 to-cyan-700',
      hoverGradient: 'hover:from-cyan-600 hover:to-cyan-800',
      icon: <FileText size={24} />,
      path: '/h-index'
    },
    { 
      key: 'resourcePerson', 
      label: 'Resource Person', 
      gradient: 'bg-gradient-to-br from-teal-500 to-teal-700',
      hoverGradient: 'hover:from-teal-600 hover:to-teal-800',
      icon: <Users size={24} />,
      path: '/resource-person'
    },
    { 
      key: 'recognition', 
      label: 'Recognition', 
      gradient: 'bg-gradient-to-br from-slate-500 to-slate-700',
      hoverGradient: 'hover:from-slate-600 hover:to-slate-800',
      icon: <Award size={24} />,
      path: '/recognition'
    },
    { 
      key: 'patents', 
      label: 'Patent/Product Development', 
      gradient: 'bg-gradient-to-br from-gray-500 to-gray-700',
      hoverGradient: 'hover:from-gray-600 hover:to-gray-800',
      icon: <FileText size={24} />,
      path: '/patent-product'
    },
    { 
      key: 'projectMentors', 
      label: 'Project Mentors', 
      gradient: 'bg-gradient-to-br from-violet-500 to-violet-700',
      hoverGradient: 'hover:from-violet-600 hover:to-violet-800',
      icon: <Users size={24} />,
      path: '/project-mentors'
    }
  ];

  // Create categories array from statItems for charts
  const categories = statItems.map(item => ({
    name: item.label,
    count: stats[item.key] || 0
  }));

  const chartData = {
    labels: categories.map(cat => cat.name),
    datasets: [
      {
        data: categories.map(cat => cat.count),
        backgroundColor: [
          'rgba(153, 102, 255, 0.6)',
          'rgba(16, 185, 129, 0.6)',
          'rgba(245, 158, 11, 0.6)',
          'rgba(239, 68, 68, 0.6)',
          'rgba(99, 102, 241, 0.6)',
          'rgba(34, 197, 94, 0.6)',
          'rgba(236, 72, 153, 0.6)',
          'rgba(14, 165, 233, 0.6)',
          'rgba(168, 85, 247, 0.6)',
          'rgba(6, 182, 212, 0.6)',
          'rgba(20, 184, 166, 0.6)',
          'rgba(100, 116, 139, 0.6)',
          'rgba(107, 114, 128, 0.6)',
          'rgba(124, 58, 237, 0.6)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const polarData = {
    labels: categories.map(cat => cat.name),
    datasets: [
      {
        data: categories.map(cat => cat.count),
        backgroundColor: [
          'rgba(153, 102, 255, 0.5)',
          'rgba(16, 185, 129, 0.5)',
          'rgba(245, 158, 11, 0.5)',
          'rgba(239, 68, 68, 0.5)',
          'rgba(99, 102, 241, 0.5)',
          'rgba(34, 197, 94, 0.5)',
          'rgba(236, 72, 153, 0.5)',
          'rgba(14, 165, 233, 0.5)',
          'rgba(168, 85, 247, 0.5)',
          'rgba(6, 182, 212, 0.5)',
          'rgba(20, 184, 166, 0.5)',
          'rgba(100, 116, 139, 0.5)',
          'rgba(107, 114, 128, 0.5)',
          'rgba(124, 58, 237, 0.5)',
        ],
        borderWidth: 1,
      },
    ],
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="bg-white rounded-lg shadow-md h-32 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md h-64"></div>
          <div className="bg-white rounded-lg shadow-md h-64"></div>
          <div className="bg-white rounded-lg shadow-md h-64"></div>
        </div>
      </div>
    );
  }

  const totalCount = Object.values(stats).reduce((sum, val) => sum + (val || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Academic Dashboard</h1>
            <p className="text-gray-600">Overview of your academic achievements and activities</p>
          </div>

          <div className="flex items-center gap-4 mt-4 sm:mt-0">
            {lastUpdated && (
              <span className="text-sm text-gray-500">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={loadStats}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-red-800">Connection Error</h3>
              <p className="text-red-700 text-sm mt-1">
                {error}. Showing cached data or default values.
              </p>
            </div>
          </div>
        )}

        {/* Summary Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Total Achievements</h2>
              <p className="text-gray-600 text-sm">Combined count across all categories</p>
            </div>
          </div>
          <div className="text-4xl font-bold text-blue-600">
            {loading ? (
              <div className="animate-pulse bg-gray-200 h-12 w-24 rounded"></div>
            ) : (
              totalCount
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {statItems.map(({ key, label, gradient, hoverGradient, icon, path }) => (
            <div
              key={key}
              onClick={() => navigate(path)}
              className={`${gradient} ${hoverGradient} rounded-xl shadow-lg p-6 cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="text-white text-2xl">
                  {icon}
                </div>
                {loading && (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                )}
              </div>

              <h3 className="text-sm font-medium text-white/90 mb-2">
                {label}
              </h3>

              <div className="text-3xl font-bold text-white">
                {loading ? (
                  <div className="animate-pulse bg-white/20 h-8 w-12 rounded"></div>
                ) : (
                  stats[key] || 0
                )}
              </div>
              
              {/* Subtle indicator for clickability */}
              <div className="mt-3 flex items-center text-white/70 text-xs">
                <span>View Details</span>
                <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">Distribution of Activities</h3>
            <div className="h-64">
              <Pie data={chartData} options={{ maintainAspectRatio: false }} />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">Activity Overview</h3>
            <div className="h-64">
              <PolarArea data={polarData} options={{ maintainAspectRatio: false }} />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;