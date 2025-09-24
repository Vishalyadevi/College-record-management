import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from "./navbar";
import "../../styles/studenthackathon.css";

const StudentHackathon = () => {
  const [hackathons, setHackathons] = useState([]);
  const [filteredHackathons, setFilteredHackathons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [filterBy, setFilterBy] = useState('all');

  useEffect(() => {
    const fetchHackathons = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await axios.get('http://localhost:4000/api/placement/hackathons');
        setHackathons(response.data);
        setFilteredHackathons(response.data);
      } catch (err) {
        console.error('Error fetching hackathons:', err);
        setError('Failed to load hackathons. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchHackathons();
  }, []);

  // Apply filters and search
  useEffect(() => {
    let filtered = [...hackathons];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(hack =>
        hack.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Date filter
    const now = new Date();
    if (filterBy === 'recent') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(hack => new Date(hack.created_at) >= sevenDaysAgo);
    } else if (filterBy === 'withLinks') {
      filtered = filtered.filter(hack => hack.link && hack.link.trim() !== '');
    }

    // Sort
    if (sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (sortBy === 'oldest') {
      filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    }

    setFilteredHackathons(filtered);
  }, [hackathons, searchTerm, sortBy, filterBy]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeAgo = (dateString) => {
    const now = new Date();
    const postDate = new Date(dateString);
    const diffTime = Math.abs(now - postDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays <= 7) return `${diffDays} days ago`;
    if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return `${Math.ceil(diffDays / 30)} months ago`;
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (err) {
      return false;
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSortBy('newest');
    setFilterBy('all');
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="hackathon-page">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading hackathons...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <br></br>
      <br></br>
      <br></br>
      <div className="hackathon-page">
        {/* Header Section */}
        <div className="hackathon-header">
          <div className="header-content">
            <h1 className="page-title">Hackathons & Competitions</h1>
            
          </div>
        </div>

        {/* Filters and Search Section */}
        <div className="filters-section">
          <div className="filters-container">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search hackathons..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            
            <div className="filter-controls">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="filter-select"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>

              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Hackathons</option>
                <option value="recent">Recent (7 days)</option>
                <option value="withLinks">With Registration Links</option>
              </select>

              <button onClick={clearFilters} className="clear-filters-btn">
                Clear Filters
              </button>
            </div>
          </div>

          <div className="results-info">
            <span className="results-count">
              {filteredHackathons.length} hackathon{filteredHackathons.length !== 1 ? 's' : ''} found
            </span>
          </div>
        </div>

        {/* Main Content */}
        <div className="hackathon-content">
          {error && (
            <div className="error-card">
              <h3>Error Loading Hackathons</h3>
              <p>{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="retry-btn"
              >
                Try Again
              </button>
            </div>
          )}

          {!error && filteredHackathons.length === 0 && !loading && (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <h3>No Hackathons Found</h3>
              <p>
                {searchTerm || filterBy !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Check back later for exciting opportunities!'
                }
              </p>
              {(searchTerm || filterBy !== 'all') && (
                <button onClick={clearFilters} className="clear-all-btn">
                  Clear All Filters
                </button>
              )}
            </div>
          )}

          {!error && filteredHackathons.length > 0 && (
            <div className="hackathons-grid">
              {filteredHackathons.map((hack) => (
                <div key={hack.id} className="hackathon-card">
                  <div className="card-header">
                    <div className="card-badges">
                      <span className="time-badge">{getTimeAgo(hack.created_at)}</span>
                      {hack.link && <span className="link-badge">Registration Open</span>}
                    </div>
                  </div>

                  <div className="card-body">
                    <h3 className="card-title">Competition Opportunity</h3>
                    <p className="card-description">{hack.content}</p>
                  </div>

                  <div className="card-footer">
                    <div className="card-meta">
                      <span className="post-date">
                        Posted: {formatDate(hack.created_at)}
                      </span>
                    </div>

                    <div className="card-actions">
                      {hack.link && isValidUrl(hack.link) ? (
                        <a
                          href={hack.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="action-btn primary-btn"
                        >
                          Register Now
                        </a>
                      ) : (
                        <span className="no-link-text">Registration details TBA</span>
                      )}
                      
                      <button 
                        className="action-btn secondary-btn"
                        onClick={() => {
                          navigator.clipboard.writeText(hack.content)
                            .then(() => {
                              // You could add a toast notification here
                              const btn = document.activeElement;
                              const originalText = btn.textContent;
                              btn.textContent = 'Copied!';
                              setTimeout(() => {
                                btn.textContent = originalText;
                              }, 2000);
                            })
                            .catch(() => alert('Failed to copy'));
                        }}
                        title="Copy to clipboard"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default StudentHackathon;