import React, { useState, useEffect } from 'react';
import { Search, Download, Eye, FileText, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

const AdminPlacementFeedback = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [downloadingIds, setDownloadingIds] = useState(new Set());
  
  // Filter states
  const [filters, setFilters] = useState({
    studentName: '',
    department: '',
    batch: '',
    year: '',
    companyName: ''
  });

  const [pagination, setPagination] = useState({
    currentPage: 1,
    itemsPerPage: 10,
    total: 0
  });

  const API_BASE_URL = 'http://localhost:4000/api';

  // Fetch feedbacks from backend
  useEffect(() => {
    fetchFeedbacks();
  }, [filters, pagination.currentPage]);

  const fetchFeedbacks = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      
      // Add filters with correct parameter names
      if (filters.studentName) params.append('student_name', filters.studentName);
      if (filters.department) params.append('course', filters.department);
      if (filters.batch) params.append('batch', filters.batch);
      if (filters.year) params.append('year', filters.year);
      if (filters.companyName) params.append('company', filters.companyName);
      
      // Add pagination
      params.append('limit', pagination.itemsPerPage);
      params.append('offset', (pagination.currentPage - 1) * pagination.itemsPerPage);
      
      const response = await fetch(`${API_BASE_URL}/placement/feedback?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      setFeedbacks(data.feedback || []);
      setPagination(prev => ({
        ...prev,
        total: data.total || 0
      }));
    } catch (error) {
      setError(`Failed to fetch feedbacks: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      studentName: '',
      department: '',
      batch: '',
      year: '',
      companyName: ''
    });
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const downloadAllPDF = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      // Use correct parameter names for PDF endpoint
      if (filters.studentName) params.append('student_name', filters.studentName);
      if (filters.department) params.append('course', filters.department);
      if (filters.batch) params.append('batch', filters.batch);
      if (filters.year) params.append('year', filters.year);
      if (filters.companyName) params.append('company', filters.companyName);
      
      const response = await fetch(`${API_BASE_URL}/placement/feedback/pdf?${params}`);
      if (!response.ok) throw new Error('Failed to download PDF');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'placement-feedback-report.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setSuccess('PDF downloaded successfully!');
    } catch (error) {
      setError('Failed to download PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadSinglePDF = async (feedbackId, studentName, companyName) => {
    setDownloadingIds(prev => new Set(prev).add(feedbackId));
    
    try {
      // Try multiple possible endpoint patterns
      const possibleEndpoints = [
        `${API_BASE_URL}/placement/feedback/${feedbackId}/pdf`,
        `${API_BASE_URL}/placement/feedback/pdf/${feedbackId}`,
        `${API_BASE_URL}/placement/feedback/${feedbackId}/download`,
        `${API_BASE_URL}/placement/pdf/${feedbackId}`
      ];

      let response = null;
      let workingEndpoint = null;

      // Try each endpoint until one works
      for (const endpoint of possibleEndpoints) {
        try {
          response = await fetch(endpoint, {
            method: 'GET',
            headers: {
              'Accept': 'application/pdf'
            }
          });
          
          if (response.ok) {
            workingEndpoint = endpoint;
            break;
          }
        } catch (err) {
          continue;
        }
      }

      if (!response || !response.ok) {
        // If no PDF endpoint works, try to generate PDF from feedback data
        const feedbackResponse = await fetch(`${API_BASE_URL}/placement/feedback/${feedbackId}`);
        if (feedbackResponse.ok) {
          const feedbackData = await feedbackResponse.json();
          await generatePDFFromData(feedbackData, studentName, companyName, feedbackId);
          return;
        }
        throw new Error(`Failed to download PDF: Server responded with ${response?.status || 'network error'}`);
      }
      
      const blob = await response.blob();
      
      if (blob.size === 0) {
        throw new Error('Received empty PDF file');
      }
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const cleanStudentName = (studentName || 'student').replace(/[^a-zA-Z0-9]/g, '_');
      const cleanCompanyName = (companyName || 'company').replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `${cleanStudentName}_${cleanCompanyName}_feedback_${feedbackId}.pdf`;
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      setSuccess(`PDF for ${studentName || 'student'} downloaded successfully!`);
      
    } catch (error) {
      console.error('PDF download error:', error);
      setError(`Failed to download PDF for ${studentName || 'this student'}: ${error.message}. The PDF endpoint might not be available on the server.`);
    } finally {
      setDownloadingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(feedbackId);
        return newSet;
      });
    }
  };

  // Fallback function to generate PDF from data (client-side)
  const generatePDFFromData = async (feedbackData, studentName, companyName, feedbackId) => {
    try {
      // Create a simple HTML representation
      const htmlContent = generateHTMLReport(feedbackData);
      
      // Use browser's print functionality to generate PDF
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>Placement Feedback Report</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .section { margin-bottom: 20px; }
              .section h3 { color: #333; border-bottom: 2px solid #ddd; padding-bottom: 5px; }
              .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px; }
              .info-item { padding: 5px 0; }
              .label { font-weight: bold; }
              .rating { color: #f39c12; }
              @media print { body { margin: 0; } }
            </style>
          </head>
          <body>
            ${htmlContent}
          </body>
        </html>
      `);
      printWindow.document.close();
      
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
      
      setSuccess(`PDF preview opened for ${studentName || 'student'}. Use browser's print function to save as PDF.`);
    } catch (error) {
      setError(`Failed to generate PDF preview: ${error.message}`);
    }
  };

  const generateHTMLReport = (feedback) => {
    return `
      <div class="header">
        <h1>Placement Feedback Report</h1>
        <h2>${feedback.company_name || 'N/A'} - ${feedback.display_name || feedback.student_name || 'Anonymous'}</h2>
      </div>
      
      <div class="section">
        <h3>Student Information</h3>
        <div class="info-grid">
          <div class="info-item"><span class="label">Name:</span> ${feedback.display_name || feedback.student_name || 'N/A'}</div>
          <div class="info-item"><span class="label">Roll Number:</span> ${feedback.regno || 'N/A'}</div>
          <div class="info-item"><span class="label">Department:</span> ${feedback.course_branch || 'N/A'}</div>
          <div class="info-item"><span class="label">Batch Year:</span> ${feedback.batch_year || 'N/A'}</div>
        </div>
      </div>
      
      <div class="section">
        <h3>Company Information</h3>
        <div class="info-grid">
          <div class="info-item"><span class="label">Company:</span> ${feedback.company_name || 'N/A'}</div>
          <div class="info-item"><span class="label">Job Role:</span> ${feedback.job_role || 'N/A'}</div>
          <div class="info-item"><span class="label">Industry:</span> ${feedback.industry_sector || 'N/A'}</div>
          <div class="info-item"><span class="label">Location:</span> ${feedback.work_location || 'N/A'}</div>
          <div class="info-item"><span class="label">Total CTC:</span> ${feedback.ctc_total ? `₹${feedback.ctc_total} LPA` : 'N/A'}</div>
          <div class="info-item"><span class="label">Final Outcome:</span> ${feedback.final_outcome || 'N/A'}</div>
        </div>
      </div>
      
      ${feedback.technical_questions ? `
        <div class="section">
          <h3>Technical Questions</h3>
          <p>${feedback.technical_questions}</p>
        </div>
      ` : ''}
      
      ${feedback.hr_questions ? `
        <div class="section">
          <h3>HR Questions</h3>
          <p>${feedback.hr_questions}</p>
        </div>
      ` : ''}
      
      ${feedback.tips_suggestions ? `
        <div class="section">
          <h3>Tips & Suggestions</h3>
          <p>${feedback.tips_suggestions}</p>
        </div>
      ` : ''}
      
      <div class="section">
        <h3>Ratings</h3>
        <div class="info-grid">
          <div class="info-item"><span class="label">Process Difficulty:</span> <span class="rating">${renderStars(feedback.process_difficulty_rating)}</span></div>
          <div class="info-item"><span class="label">Company Communication:</span> <span class="rating">${renderStars(feedback.company_communication_rating)}</span></div>
          <div class="info-item"><span class="label">Overall Experience:</span> <span class="rating">${renderStars(feedback.overall_experience_rating)}</span></div>
        </div>
      </div>
    `;
  };

  const openModal = (feedback) => {
    setSelectedFeedback(feedback);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedFeedback(null);
  };

  const renderStars = (rating) => {
    if (!rating) return 'N/A';
    return '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
  };

  const totalPages = Math.ceil(pagination.total / pagination.itemsPerPage);

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
        <br></br>
      <br></br>
      <br></br>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 text-center">Placement Feedback</h1>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 flex justify-between items-center">
            <span className="text-red-700">{error}</span>
            <button onClick={clearMessages} className="text-red-700 hover:text-red-900 text-xl">&times;</button>
          </div>
        )}
        {success && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6 flex justify-between items-center">
            <span className="text-green-700">{success}</span>
            <button onClick={clearMessages} className="text-green-700 hover:text-green-900 text-xl">&times;</button>
          </div>
        )}

        <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
          <div className="flex items-center gap-2 mb-4">
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Student Name</label>
              <input
                type="text"
                placeholder="Search by name..."
                value={filters.studentName}
                onChange={(e) => handleFilterChange('studentName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select
                value={filters.department}
                onChange={(e) => handleFilterChange('department', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Departments</option>
                <option value="CSE">CSE</option>
                <option value="IT">IT</option>
                <option value="AIDS">AIDS</option>
                <option value="EEE">EEE</option>
                <option value="ECE">ECE</option>
                <option value="CIVIL">CIVIL</option>
                <option value="MECH">MECH</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Batch</label>
              <input
                type="text"
                placeholder="e.g., 2024"
                value={filters.batch}
                onChange={(e) => handleFilterChange('batch', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
           
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
              <input
                type="text"
                placeholder="Search by company..."
                value={filters.companyName}
                onChange={(e) => handleFilterChange('companyName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Clear Filters
            </button>
            <button
              onClick={downloadAllPDF}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400"
            >
              <Download className="h-4 w-4" />
              Download All as PDF
            </button>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
          <p className="text-gray-700">
            Showing <span className="font-semibold">{feedbacks.length}</span> of{' '}
            <span className="font-semibold">{pagination.total}</span> feedback records
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company & Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CTC
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Outcome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <div className="flex justify-center items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-2 text-gray-600">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : feedbacks.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      No feedback records found. Try adjusting your filters.
                    </td>
                  </tr>
                ) : (
                  feedbacks.map((feedback) => (
                    <tr key={feedback.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {feedback.display_name || feedback.student_name || 'Anonymous'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {feedback.regno} • {feedback.course_branch} • {feedback.batch_year}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {feedback.company_name || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {feedback.job_role || 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {feedback.ctc_total ? `₹${feedback.ctc_total} LPA` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          feedback.final_outcome === 'Selected' 
                            ? 'bg-green-100 text-green-800'
                            : feedback.final_outcome === 'Rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {feedback.final_outcome || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {feedback.created_at ? new Date(feedback.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openModal(feedback)}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                          >
                            <Eye className="h-3 w-3" />
                            View
                          </button>
                         
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 rounded-b-lg">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{' '}
                {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.total)} of{' '}
                {pagination.total} results
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                  disabled={pagination.currentPage === 1}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-md"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>
                
                <span className="text-sm text-gray-700">
                  Page {pagination.currentPage} of {totalPages}
                </span>
                
                <button
                  onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                  disabled={pagination.currentPage === totalPages}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-md"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {showModal && selectedFeedback && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedFeedback.company_name} - {selectedFeedback.display_name || selectedFeedback.student_name}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  &times;
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Student Information</h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Name:</span> {selectedFeedback.display_name || selectedFeedback.student_name}</p>
                      <p><span className="font-medium">Roll Number:</span> {selectedFeedback.regno}</p>
                      <p><span className="font-medium">Department:</span> {selectedFeedback.course_branch}</p>
                      <p><span className="font-medium">Batch Year:</span> {selectedFeedback.batch_year}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Company Information</h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Company:</span> {selectedFeedback.company_name}</p>
                      <p><span className="font-medium">Job Role:</span> {selectedFeedback.job_role}</p>
                      <p><span className="font-medium">Industry:</span> {selectedFeedback.industry_sector}</p>
                      <p><span className="font-medium">Location:</span> {selectedFeedback.work_location}</p>
                      <p><span className="font-medium">Total CTC:</span> {selectedFeedback.ctc_total ? `₹${selectedFeedback.ctc_total} LPA` : 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Process Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <p><span className="font-medium">Drive Mode:</span> {selectedFeedback.drive_mode}</p>
                    <p><span className="font-medium">Final Outcome:</span> 
                      <span className={`ml-2 px-2 py-1 text-xs rounded ${
                        selectedFeedback.final_outcome === 'Selected' 
                          ? 'bg-green-100 text-green-800'
                          : selectedFeedback.final_outcome === 'Rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {selectedFeedback.final_outcome}
                      </span>
                    </p>
                  </div>
                  {selectedFeedback.eligibility_criteria && (
                    <div className="mt-3">
                      <p className="font-medium text-sm">Eligibility Criteria:</p>
                      <p className="text-sm text-gray-600">{selectedFeedback.eligibility_criteria}</p>
                    </div>
                  )}
                </div>

                {(selectedFeedback.technical_questions || selectedFeedback.hr_questions) && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Interview Experience</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedFeedback.technical_questions && (
                        <div>
                          <p className="font-medium text-sm mb-1">Technical Questions:</p>
                          <p className="text-sm text-gray-600">{selectedFeedback.technical_questions}</p>
                        </div>
                      )}
                      {selectedFeedback.hr_questions && (
                        <div>
                          <p className="font-medium text-sm mb-1">HR Questions:</p>
                          <p className="text-sm text-gray-600">{selectedFeedback.hr_questions}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedFeedback.tips_suggestions && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Tips & Suggestions</h3>
                    <p className="text-sm text-gray-600">{selectedFeedback.tips_suggestions}</p>
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Ratings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <p><span className="font-medium">Process Difficulty:</span> {renderStars(selectedFeedback.process_difficulty_rating)}</p>
                    <p><span className="font-medium">Company Communication:</span> {renderStars(selectedFeedback.company_communication_rating)}</p>
                    <p><span className="font-medium">Overall Experience:</span> {renderStars(selectedFeedback.overall_experience_rating)}</p>
                  </div>
                </div>

                {selectedFeedback.rounds && selectedFeedback.rounds.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Interview Rounds</h3>
                    <div className="space-y-2">
                      {selectedFeedback.rounds.map((round, index) => (
                        <div key={index} className="border border-gray-200 rounded p-3">
                          <div className="flex justify-between items-start">
                            <span className="font-medium text-sm">Round {round.round_number}: {round.round_type}</span>
                            <span className={`px-2 py-1 text-xs rounded ${
                              round.difficulty_level === 'Easy' ? 'bg-green-100 text-green-800' :
                              round.difficulty_level === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {round.difficulty_level}
                            </span>
                          </div>
                          {round.round_description && (
                            <p className="text-sm text-gray-600 mt-1">{round.round_description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t">
                <div className="flex justify-end gap-3">

                  <button
                    onClick={closeModal}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPlacementFeedback;