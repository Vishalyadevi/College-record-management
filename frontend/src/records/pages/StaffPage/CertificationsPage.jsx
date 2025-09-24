import React, { useState, useEffect } from 'react';
import { Plus, ExternalLink } from 'lucide-react';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import { getCertifications, createCertification, updateCertification, deleteCertification } from '../../services/api';
import toast from 'react-hot-toast';

const CertificationsPage = () => {
  const [certifications, setCertifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [currentCertification, setCurrentCertification] = useState(null);
  
  const [formData, setFormData] = useState({
    course_name: '',
    forum: '',
    from_date: '',
    to_date: '',
    days: '',
    certification_date: '',
    certificate_link: ''
  });

  const fetchCertifications = async () => {
    try {
      setLoading(true);
      const response = await getCertifications();
      setCertifications(response.data);
    } catch (error) {
      console.error('Error fetching certifications:', error);
      toast.error('Failed to load certifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertifications();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });

    // Auto-calculate days when dates change
    if (name === 'from_date' || name === 'to_date') {
      if (formData.from_date && name === 'to_date' && value) {
        const fromDate = new Date(formData.from_date);
        const toDate = new Date(value);
        const differenceInTime = toDate - fromDate;
        const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24)) + 1; // +1 to include both start and end days
        
        if (differenceInDays > 0) {
          setFormData(prev => ({
            ...prev,
            [name]: value,
            days: differenceInDays.toString()
          }));
        }
      }
    }
  };

  const resetForm = () => {
    setFormData({
      course_name: '',
      forum: '',
      from_date: '',
      to_date: '',
      days: '',
      certification_date: '',
      certificate_link: ''
    });
    setCurrentCertification(null);
    setIsViewMode(false);
  };

  const handleAddNew = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleEdit = (certification) => {
    setCurrentCertification(certification);
    
    // Format dates for the form
    const fromDate = certification.from_date ? certification.from_date.split('T')[0] : '';
    const toDate = certification.to_date ? certification.to_date.split('T')[0] : '';
    
    setFormData({
      course_name: certification.course_name || '',
      forum: certification.forum || '',
      from_date: fromDate,
      to_date: toDate,
      days: certification.days?.toString() || '',
      certification_date: certification.certification_date ? certification.certification_date.split('T')[0] : '',
      certificate_link: certification.certificate_link || ''
    });
    setIsViewMode(false);
    setIsModalOpen(true);
  };

  const handleView = (certification) => {
    setCurrentCertification(certification);
    
    // Format dates for the form
    const fromDate = certification.from_date ? certification.from_date.split('T')[0] : '';
    const toDate = certification.to_date ? certification.to_date.split('T')[0] : '';
    
    setFormData({
      course_name: certification.course_name || '',
      forum: certification.forum || '',
      from_date: fromDate,
      to_date: toDate,
      days: certification.days?.toString() || '',
      certification_date: certification.certification_date ? certification.certification_date.split('T')[0] : '',
      certificate_link: certification.certificate_link || ''
    });
    setIsViewMode(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (certification) => {
    if (window.confirm(`Are you sure you want to delete this certification: ${certification.course_name}?`)) {
      try {
        await deleteCertification(certification.id);
        toast.success('Certification deleted successfully');
        fetchCertifications();
      } catch (error) {
        console.error('Error deleting certification:', error);
        toast.error('Failed to delete certification');
      }
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      // Validate required fields
      if (!formData.course_name || !formData.forum || 
          !formData.from_date || !formData.to_date || !formData.days || !formData.certification_date) {
        toast.error('Please fill in all required fields');
        setIsSubmitting(false);
        return;
      }
      
      if (currentCertification) {
        await updateCertification(currentCertification.id, formData);
        toast.success('Certification updated successfully');
      } else {
        await createCertification(formData);
        toast.success('Certification created successfully');
      }
      
      setIsModalOpen(false);
      resetForm();
      fetchCertifications();
    } catch (error) {
      console.error('Error saving certification:', error);
      toast.error('Failed to save certification');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format date for display
  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString();
  };

  // Render certificate link with clickable icon if exists
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

  const columns = [
    { field: 'course_name', header: 'Course Name' },
    { field: 'forum', header: 'Forum' },
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
    { field: 'days', header: 'Days' },
    { 
      field: 'certification_date', 
      header: 'Certification Date',
      render: (row) => formatDate(row.certification_date)
    },
    {
      field: 'certificate_link',
      header: 'Certificate',
      render: renderCertificateLink
    }
  ];

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <button
          onClick={handleAddNew}
          className="btn flex items-center gap-2 text-white bg-gradient-to-r from-pink-500 to-purple-400 hover:from-pink-800 hover:to-purple-500 px-4 py-2 rounded-md shadow-md"
        >
          <Plus size={16} />
          Add New Certification
        </button>
      </div>

      <DataTable
        data={certifications}
        columns={columns}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={loading}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isViewMode ? 'View Certification' : currentCertification ? 'Edit Certification' : 'Add New Certification'}
        onSubmit={!isViewMode ? handleSubmit : null}
        isSubmitting={isSubmitting}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Course Name"
            name="course_name"
            value={formData.course_name}
            onChange={handleInputChange}
            required
            disabled={isViewMode}
          />
          <FormField
            label="Forum"
            name="forum"
            value={formData.forum}
            onChange={handleInputChange}
            required
            disabled={isViewMode}
            placeholder="e.g., SWAYAM, NPTEL"
          />
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>
          <FormField
            label="Number of Days"
            name="days"
            type="number"
            value={formData.days}
            onChange={handleInputChange}
            required
            disabled={isViewMode || (formData.from_date && formData.to_date)}
          />
          <FormField
            label="Certification Date"
            name="certification_date"
            type="date"
            value={formData.certification_date}
            onChange={handleInputChange}
            required
            disabled={isViewMode}
          />
          <div className="md:col-span-2">
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
                  View
                </a>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CertificationsPage;