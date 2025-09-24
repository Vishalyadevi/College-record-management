import React, { useState, useEffect } from 'react';
import { Plus, ExternalLink } from 'lucide-react';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import { getConferences, createConference, updateConference, deleteConference } from '../../services/api';
import toast from 'react-hot-toast';

const ConferencesPage = () => {
  const [conferences, setConferences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [currentConference, setCurrentConference] = useState(null);
  
  const [formData, setFormData] = useState({
    faculty_name: '',
    conference_name: '',
    paper_title: '',
    authors: '',
    venue: '',
    level: '',
    index_type: '',
    page_no: '',
    from_date: '',
    to_date: '',
    certificate_link: '',
    doi: '',
    citations: ''
  });

  const fetchConferences = async () => {
    try {
      setLoading(true);
      const response = await getConferences();
      setConferences(response.data);
    } catch (error) {
      console.error('Error fetching conferences:', error);
      toast.error('Failed to load conferences');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConferences();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const resetForm = () => {
    setFormData({
      faculty_name: '',
      conference_name: '',
      paper_title: '',
      authors: '',
      venue: '',
      level: '',
      index_type: '',
      page_no: '',
      from_date: '',
      to_date: '',
      certificate_link: '',
      doi: '',
      citations: ''
    });
    setCurrentConference(null);
    setIsViewMode(false);
  };

  const handleAddNew = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleEdit = (conference) => {
    setCurrentConference(conference);
    setFormData({
      faculty_name: conference.faculty_name || '',
      conference_name: conference.conference_name || '',
      paper_title: conference.paper_title || '',
      authors: conference.authors || '',
      venue: conference.venue || '',
      level: conference.level || '',
      index_type: conference.index_type || '',
      page_no: conference.page_no || '',
      from_date: conference.from_date || '',
      to_date: conference.to_date || '',
      certificate_link: conference.certificate_link || '',
      doi: conference.doi || '',
      citations: conference.citations?.toString() || ''
    });
    setIsViewMode(false);
    setIsModalOpen(true);
  };

  const handleView = (conference) => {
    setCurrentConference(conference);
    setFormData({
      faculty_name: conference.faculty_name || '',
      conference_name: conference.conference_name || '',
      paper_title: conference.paper_title || '',
      authors: conference.authors || '',
      venue: conference.venue || '',
      level: conference.level || '',
      index_type: conference.index_type || '',
      page_no: conference.page_no || '',
      from_date: conference.from_date || '',
      to_date: conference.to_date || '',
      certificate_link: conference.certificate_link || '',
      doi: conference.doi || '',
      citations: conference.citations?.toString() || ''
    });
    setIsViewMode(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (conference) => {
    if (window.confirm(`Are you sure you want to delete this conference: ${conference.paper_title}?`)) {
      try {
        await deleteConference(conference.id);
        toast.success('Conference deleted successfully');
        fetchConferences();
      } catch (error) {
        console.error('Error deleting conference:', error);
        toast.error('Failed to delete conference');
      }
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      // Validate required fields
      if (!formData.faculty_name || !formData.conference_name || !formData.paper_title || !formData.authors || !formData.venue || !formData.level || !formData.index_type || !formData.from_date || !formData.to_date) {
        toast.error('Please fill in all required fields');
        return;
      }
      
      if (currentConference) {
        await updateConference(currentConference.id, formData);
        toast.success('Conference updated successfully');
      } else {
        await createConference(formData);
        toast.success('Conference created successfully');
      }
      
      setIsModalOpen(false);
      resetForm();
      fetchConferences();
    } catch (error) {
      console.error('Error saving conference:', error);
      toast.error('Failed to save conference');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render certificate link with clickable icon if exists, matching the style from CertificationsPage
  const renderCertificateLink = (row) => {
    if (!row.certificate_link) return '-';
    
    return (
      <a 
        href={row.certificate_link} 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800 flex items-center"
      >
        View 
      </a>
    );
  };

  // Format date for display
  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString();
  };

  // Custom cell renderer for links and dates
  const renderCell = (row, field) => {
    // Handle certificate link
    if (field === 'certificate_link') {
      return renderCertificateLink(row);
    }
    
    // Handle DOI links
    if (field === 'doi' && row[field]) {
      let doiUrl = row[field];
      if (!doiUrl.startsWith('http')) {
        doiUrl = `https://doi.org/${doiUrl}`;
      }
      
      return (
        <a 
          href={doiUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          {row[field]} <ExternalLink size={14} />
        </a>
      );
    }
    
    // Handle dates
    if (field === 'from_date' || field === 'to_date') {
      return formatDate(row[field]);
    }
    
    // Default rendering
    return row[field];
  };

  const columns = [
    { field: 'faculty_name', header: 'Faculty Name' },
    { field: 'conference_name', header: 'Conference Name' },
    { field: 'paper_title', header: 'Paper Title' },
    { field: 'authors', header: 'Authors' },
    { field: 'venue', header: 'Venue' },
    { field: 'level', header: 'Level' },
    { field: 'index_type', header: 'Index Type' },
    { field: 'page_no', header: 'Page No.' },
    { 
      field: 'from_date', 
      header: 'From Date',
      render: (row) => formatDate(row.from_date)
    },
    { 
      field: 'to_date', 
      header: 'To Date',
      render: (row) => formatDate(row.to_date)
    },
    {
      field: 'certificate_link',
      header: 'Certificate',
      render: renderCertificateLink
    },
    { field: 'doi', header: 'DOI' },
    { field: 'citations', header: 'Citations' }
  ];

  const levelOptions = [
    { value: 'National', label: 'National' },
    { value: 'International', label: 'International' },
  ];

  const indexOptions = [
    { value: 'Scopus', label: 'Scopus' },
    { value: 'IEEE', label: 'IEEE' },
    { value: 'Web of Science', label: 'Web of Science' },
    { value: 'Other', label: 'Other' },
  ];

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <button
          onClick={handleAddNew}
          className="btn flex items-center gap-2 text-white bg-gradient-to-r from-pink-500 to-purple-400 hover:from-pink-800 hover:to-purple-500 px-4 py-2 rounded-md shadow-md"
        >
          <Plus size={16} />
          Add New Conference
        </button>
      </div>

      <DataTable
        data={conferences}
        columns={columns}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={loading}
        renderCell={renderCell}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isViewMode ? 'View Conference' : currentConference ? 'Edit Conference' : 'Add New Conference'}
        onSubmit={!isViewMode ? handleSubmit : null}
        isSubmitting={isSubmitting}
        size="lg"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Faculty Name"
            name="faculty_name"
            value={formData.faculty_name}
            onChange={handleInputChange}
            required
            disabled={isViewMode}
          />
          <FormField
            label="Conference Name"
            name="conference_name"
            value={formData.conference_name}
            onChange={handleInputChange}
            required
            disabled={isViewMode}
          />
          <FormField
            label="Paper Title"
            name="paper_title"
            value={formData.paper_title}
            onChange={handleInputChange}
            required
            disabled={isViewMode}
          />
          <FormField
            label="Authors"
            name="authors"
            value={formData.authors}
            onChange={handleInputChange}
            required
            disabled={isViewMode}
            placeholder="Comma separated list of authors"
          />
          <FormField
            label="Venue"
            name="venue"
            value={formData.venue}
            onChange={handleInputChange}
            required
            disabled={isViewMode}
          />
          <FormField
            label="Level"
            name="level"
            type="select"
            value={formData.level}
            onChange={handleInputChange}
            required
            disabled={isViewMode}
            options={levelOptions}
          />
          <FormField
            label="Index Type"
            name="index_type"
            type="select"
            value={formData.index_type}
            onChange={handleInputChange}
            required
            disabled={isViewMode}
            options={indexOptions}
          />
          <FormField
            label="Page No."
            name="page_no"
            value={formData.page_no}
            onChange={handleInputChange}
            disabled={isViewMode}
            placeholder="e.g., 123-130"
          />
          <FormField
            label="From Date"
            name="from_date"
            type="date"
            value={formData.from_date}
            onChange={handleInputChange}
            required
            disabled={isViewMode}
          />
          <FormField
            label="To Date"
            name="to_date"
            type="date"
            value={formData.to_date}
            onChange={handleInputChange}
            required
            disabled={isViewMode}
          />
          <FormField
            label="Certificate Link"
            name="certificate_link"
            value={formData.certificate_link}
            onChange={handleInputChange}
            disabled={isViewMode}
            placeholder="URL to certificate"
          />
          {isViewMode && formData.certificate_link && (
            <div className="mt-2">
              <a 
                href={formData.certificate_link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 flex items-center"
              >
                View Certificate <ExternalLink size={16} className="ml-1" />
              </a>
            </div>
          )}
          <FormField
            label="DOI"
            name="doi"
            value={formData.doi}
            onChange={handleInputChange}
            disabled={isViewMode}
            placeholder="e.g., 10.1000/xyz123"
          />
          <FormField
            label="Citations"
            name="citations"
            type="number"
            value={formData.citations}
            onChange={handleInputChange}
            disabled={isViewMode}
          />
        </div>
      </Modal>
    </div>
  );
};

export default ConferencesPage;