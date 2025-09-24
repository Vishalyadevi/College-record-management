import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
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
    certificate_link: '',
    proof_link: ''
  });

  const fetchProjectMentors = async () => {
    try {
      setLoading(true);
      const response = await getProjectMentors();
      setProjectMentors(response.data);
    } catch (error) {
      console.error('Error fetching project mentors:', error);
      toast.error('Failed to load project mentors');
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

  const resetForm = () => {
    setFormData({
      project_title: '',
      student_details: '',
      event_details: '',
      participation_status: '',
      certificate_link: '',
      proof_link: ''
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
      certificate_link: projectMentor.certificate_link || '',
      proof_link: projectMentor.proof_link || ''
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
      certificate_link: projectMentor.certificate_link || '',
      proof_link: projectMentor.proof_link || ''
    });
    setIsViewMode(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (projectMentor) => {
    if (window.confirm(`Are you sure you want to delete this record: ${projectMentor.project_title}?`)) {
      try {
        await deleteProjectMentor(projectMentor.id);
        toast.success('Project mentor record deleted successfully');
        fetchProjectMentors();
      } catch (error) {
        console.error('Error deleting project mentor:', error);
        toast.error('Failed to delete project mentor');
      }
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      if (!formData.project_title || !formData.student_details || !formData.event_details || !formData.participation_status) {
        toast.error('Please fill in all required fields');
        return;
      }

      if (currentProjectMentor) {
        await updateProjectMentor(currentProjectMentor.id, formData);
        toast.success('Project mentor updated successfully');
      } else {
        await createProjectMentor(formData);
        toast.success('Project mentor created successfully');
      }

      setIsModalOpen(false);
      resetForm();
      fetchProjectMentors();
    } catch (error) {
      console.error('Error saving project mentor:', error);
      toast.error('Failed to save project mentor');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Custom cell renderer for links
  const renderLinkCell = (value) => {
    if (!value) return '-';
    
    return (
      <a 
        href={value} 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800"
        onClick={(e) => e.stopPropagation()}
      >
        View
      </a>
    );
  };

  const columns = [
    { field: 'project_title', header: 'Project Title' },
    { field: 'student_details', header: 'Students Name & Register Number' },
    { field: 'event_details', header: 'Hackathon/Expo/etc Details' },
    { field: 'participation_status', header: 'Participation/Winning' },
    { 
      field: 'certificate_link', 
      header: 'Certificate Link',
      render: renderLinkCell
    },
    { 
      field: 'proof_link', 
      header: 'Any Proof Link',
      render: renderLinkCell
    }
  ];

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <button onClick={handleAddNew}           className="btn flex items-center gap-2 text-white bg-gradient-to-r from-pink-500 to-purple-400 hover:from-pink-800 hover:to-purple-500 px-4 py-2 rounded-md shadow-md"
>
          <Plus size={16} />
          Add New Project Mentor
        </button>
      </div>

      <DataTable
        data={projectMentors}
        columns={columns}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={loading}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isViewMode ? 'View Project Mentor' : currentProjectMentor ? 'Edit Project Mentor' : 'Add New Project Mentor'}
        onSubmit={!isViewMode ? handleSubmit : null}
        isSubmitting={isSubmitting}
        size="lg"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Project Title" name="project_title" value={formData.project_title} onChange={handleInputChange} required disabled={isViewMode} />
          <FormField label="Students Name & Register Number" name="student_details" value={formData.student_details} onChange={handleInputChange} required disabled={isViewMode} />
          <FormField label="Hackathon/Expo/etc Details" name="event_details" value={formData.event_details} onChange={handleInputChange} required disabled={isViewMode} />
          <FormField label="Participation/Winning" name="participation_status" value={formData.participation_status} onChange={handleInputChange} required disabled={isViewMode} />
          <FormField label="Certificate Link" name="certificate_link" value={formData.certificate_link} onChange={handleInputChange} disabled={isViewMode} />
          <FormField label="Any Proof Link" name="proof_link" value={formData.proof_link} onChange={handleInputChange} disabled={isViewMode} />
        </div>
      </Modal>
    </div>
  );
};

export default ProjectMentorPage;