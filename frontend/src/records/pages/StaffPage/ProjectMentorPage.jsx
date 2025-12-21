import React, { useState, useEffect } from 'react';
import { Plus, FileText } from 'lucide-react';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import { getProjectMentors, createProjectMentor, updateProjectMentor, deleteProjectMentor } from '../../services/api';
import toast from 'react-hot-toast';

const ProjectMentorPage = () => {
  const [projectMentors, setProjectMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [currentProjectMentor, setCurrentProjectMentor] = useState(null);

  const [formData, setFormData] = useState({
    project_title: '',
    student_details: '',
    event_details: '',
    participation_status: '',
    certificate_link: null,
    proof_link: null
  });

  const fetchProjectMentors = async () => {
    try {
      setLoading(true);
      const response = await getProjectMentors();
      setProjectMentors(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching project mentors:', error);
      toast.error('Failed to load project mentors');
      setProjectMentors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectMentors();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      const file = files[0];
      // Validate PDF
      if (file.type !== 'application/pdf') {
        toast.error('Only PDF files are allowed');
        e.target.value = '';
        return;
      }
      // Validate size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        e.target.value = '';
        return;
      }
      setFormData({
        ...formData,
        [name]: file
      });
    }
  };

  const resetForm = () => {
    setFormData({
      project_title: '',
      student_details: '',
      event_details: '',
      participation_status: '',
      certificate_link: null,
      proof_link: null
    });
    setCurrentProjectMentor(null);
    setIsViewMode(false);
  };

  const handleAddNew = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleEdit = (projectMentor) => {
    setCurrentProjectMentor(projectMentor);
    setFormData({
      project_title: projectMentor.project_title || '',
      student_details: projectMentor.student_details || '',
      event_details: projectMentor.event_details || '',
      participation_status: projectMentor.participation_status || '',
      certificate_link: null,
      proof_link: null
    });
    setIsViewMode(false);
    setIsModalOpen(true);
  };

  const handleView = (projectMentor) => {
    setCurrentProjectMentor(projectMentor);
    setFormData({
      project_title: projectMentor.project_title || '',
      student_details: projectMentor.student_details || '',
      event_details: projectMentor.event_details || '',
      participation_status: projectMentor.participation_status || '',
      certificate_link: null,
      proof_link: null
    });
    setIsViewMode(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (projectMentor) => {
    if (window.confirm(`Are you sure you want to delete this record: ${projectMentor.project_title}?`)) {
      try {
        setLoading(true);
        await deleteProjectMentor(projectMentor.id);
        toast.success('Project mentor record deleted successfully');
        await fetchProjectMentors();
      } catch (error) {
        console.error('Error deleting project mentor:', error);
        toast.error('Failed to delete project mentor');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      // Validation
      if (!formData.project_title || !formData.student_details || !formData.event_details || !formData.participation_status) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Prepare FormData for multipart/form-data
      const formDataToSend = new FormData();
      formDataToSend.append('project_title', formData.project_title.trim());
      formDataToSend.append('student_details', formData.student_details.trim());
      formDataToSend.append('event_details', formData.event_details.trim());
      formDataToSend.append('participation_status', formData.participation_status.trim());
      
      if (formData.certificate_link) {
        formDataToSend.append('certificate_link', formData.certificate_link);
        console.log('Uploading certificate file:', formData.certificate_link.name);
      }
      
      if (formData.proof_link) {
        formDataToSend.append('proof_link', formData.proof_link);
        console.log('Uploading proof file:', formData.proof_link.name);
      }

      if (currentProjectMentor) {
        await updateProjectMentor(currentProjectMentor.id, formDataToSend);
        toast.success('Project mentor updated successfully');
      } else {
        await createProjectMentor(formDataToSend);
        toast.success('Project mentor created successfully');
      }

      setIsModalOpen(false);
      resetForm();
      await fetchProjectMentors();
    } catch (error) {
      console.error('Error saving project mentor:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save project mentor';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle PDF viewing
  const handleViewPDF = async (id, type) => {
    try {
      const endpoint = type === 'certificate' 
        ? `http://localhost:4000/api/project-mentors/certificate/${id}`
        : `http://localhost:4000/api/project-mentors/proof/${id}`;

      const res = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Backend Error: ${res.status} - ${text}`);
      }

      const blob = await res.blob();
      const pdfUrl = window.URL.createObjectURL(blob);

      // Open PDF in new tab
      window.open(pdfUrl, "_blank");
    } catch (err) {
      console.error("Error fetching PDF:", err);
      toast.error('Failed to load PDF document');
    }
  };

  const columns = [
    { field: 'project_title', header: 'Project Title' },
    { field: 'student_details', header: 'Students Name & Register Number' },
    { field: 'event_details', header: 'Hackathon/Expo/etc Details' },
    { field: 'participation_status', header: 'Participation/Winning' },
    { 
      field: 'certificate_link', 
      header: 'Certificate',
      render: (row) => (
        row.certificate_link ? (
          <button
            onClick={() => handleViewPDF(row.id, 'certificate')}
            className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 rounded-full transition-colors duration-200 border border-blue-200"
            title="Click to view PDF"
          >
            <FileText size={14} />
            View PDF
          </button>
        ) : (
          <span className="text-gray-400 text-sm">No file</span>
        )
      )
    },
    { 
      field: 'proof_link', 
      header: 'Proof Document',
      render: (row) => (
        row.proof_link ? (
          <button
            onClick={() => handleViewPDF(row.id, 'proof')}
            className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 rounded-full transition-colors duration-200 border border-green-200"
            title="Click to view PDF"
          >
            <FileText size={14} />
            View PDF
          </button>
        ) : (
          <span className="text-gray-400 text-sm">No file</span>
        )
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-center">
            <button
              onClick={handleAddNew}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg shadow-lg transform transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={18} />
              Add New Project Mentor
            </button>
          </div>
        </div>

        {/* Data Table Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
              <span className="ml-2 text-gray-600">Loading...</span>
            </div>
          ) : projectMentors.length === 0 ? (
            <div className="text-center py-12">
              <FileText size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No records found</h3>
              <p className="text-gray-500">Get started by adding your first project mentor record.</p>
            </div>
          ) : (
            <DataTable
              data={projectMentors}
              columns={columns}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
              isLoading={loading}
            />
          )}
        </div>

        {/* Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={isViewMode ? 'View Project Mentor' : currentProjectMentor ? 'Edit Project Mentor' : 'Add New Project Mentor'}
          onSubmit={!isViewMode ? handleSubmit : null}
          isSubmitting={isSubmitting}
          size="lg"
        >
          <div className="space-y-4">
            {/* Project Title */}
            <FormField 
              label="Project Title" 
              name="project_title" 
              value={formData.project_title} 
              onChange={handleInputChange} 
              required 
              disabled={isViewMode}
              placeholder="Enter project title"
            />
            
            {/* Student Details */}
            <FormField 
              label="Students Name & Register Number" 
              name="student_details" 
              type="textarea"
              rows="3"
              value={formData.student_details} 
              onChange={handleInputChange} 
              required 
              disabled={isViewMode}
              placeholder="Enter student details (name and register number)"
            />
            
            {/* Event Details */}
            <FormField 
              label="Hackathon/Expo/etc Details" 
              name="event_details" 
              value={formData.event_details} 
              onChange={handleInputChange} 
              required 
              disabled={isViewMode}
              placeholder="Enter event details"
            />
            
            {/* Participation Status */}
            <FormField 
              label="Participation/Winning" 
              name="participation_status" 
              value={formData.participation_status} 
              onChange={handleInputChange} 
              required 
              disabled={isViewMode}
              placeholder="e.g., Winner, Participant, Runner-up"
            />
            
            {/* Certificate Link - File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Certificate (PDF only, max 10MB)
              </label>
              {isViewMode ? (
                currentProjectMentor?.certificate_link ? (
                  <button
                    onClick={() => handleViewPDF(currentProjectMentor.id, 'certificate')}
                    className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 rounded-full transition-colors duration-200 border border-blue-200"
                    title="View Certificate"
                  >
                    <FileText size={14} />
                    View Certificate
                  </button>
                ) : (
                  <span className="text-gray-400">No certificate uploaded</span>
                )
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    name="certificate_link"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {formData.certificate_link && (
                    <span className="text-sm text-green-600 flex items-center gap-1">
                      <FileText size={14} />
                      {formData.certificate_link.name}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Proof Link - File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Any Proof Document (PDF only, max 10MB)
              </label>
              {isViewMode ? (
                currentProjectMentor?.proof_link ? (
                  <button
                    onClick={() => handleViewPDF(currentProjectMentor.id, 'proof')}
                    className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 rounded-full transition-colors duration-200 border border-green-200"
                    title="View Proof Document"
                  >
                    <FileText size={14} />
                    View Proof Document
                  </button>
                ) : (
                  <span className="text-gray-400">No proof document uploaded</span>
                )
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    name="proof_link"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {formData.proof_link && (
                    <span className="text-sm text-green-600 flex items-center gap-1">
                      <FileText size={14} />
                      {formData.proof_link.name}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default ProjectMentorPage;