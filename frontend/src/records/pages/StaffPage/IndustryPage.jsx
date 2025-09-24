import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import { getIndustryKnowhow, createIndustryKnowhow, updateIndustryKnowhow, deleteIndustryKnowhow } from '../../services/api';
import toast from 'react-hot-toast';

const IndustryPage = () => {
  const [industry, setIndustry] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  
  const [formData, setFormData] = useState({
    internship_name: '',
    title: '',
    company: '',
    outcomes: '',
    from_date: '',
    to_date: '',
    venue: '',
    participants: '',
    financial_support: false,
    support_amount: '',
    certificate_link: ''
  });

  const fetchIndustry = async () => {
    try {
      setLoading(true);
      const response = await getIndustryKnowhow();
      
      // Enhanced error handling for response structure
      console.log('API Response:', response); // Debug log
      console.log('Response.data:', response.data); // Debug log
      
      // Handle different possible response structures
      let dataArray = [];
      
      // Check if it's an Axios response (has .data property)
      if (response && response.data) {
        // If response.data has a data property (backend returns {success: true, data: []})
        if (response.data.data && Array.isArray(response.data.data)) {
          dataArray = response.data.data;
        }
        // If response.data is directly an array
        else if (Array.isArray(response.data)) {
          dataArray = response.data;
        }
        // If response.data has success property and data is an array
        else if (response.data.success && Array.isArray(response.data.data)) {
          dataArray = response.data.data;
        }
        else {
          console.warn('Unexpected response.data structure:', response.data);
          dataArray = [];
        }
      }
      // If response is directly an array (unlikely with Axios)
      else if (Array.isArray(response)) {
        dataArray = response;
      }
      else {
        console.warn('Unexpected response structure:', response);
        dataArray = [];
      }
      
      console.log('Final dataArray:', dataArray); // Debug log
      setIndustry(dataArray);
    } catch (error) {
      console.error('Error fetching industry knowhow:', error);
      toast.error('Failed to load industry knowhow');
      // Ensure industry is always an array even on error
      setIndustry([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIndustry();
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
      internship_name: '',
      title: '',
      company: '',
      outcomes: '',
      from_date: '',
      to_date: '',
      venue: '',
      participants: '',
      financial_support: false,
      support_amount: '',
      certificate_link: ''
    });
    setCurrentItem(null);
    setIsViewMode(false);
  };

  const handleAddNew = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleEdit = (item) => {
    setCurrentItem(item);
    setFormData({
      internship_name: item.internship_name || '',
      title: item.title || '',
      company: item.company || '',
      outcomes: item.outcomes || '',
      from_date: item.from_date || '',
      to_date: item.to_date || '',
      venue: item.venue || '',
      participants: item.participants?.toString() || '',
      financial_support: Boolean(item.financial_support),
      support_amount: item.support_amount?.toString() || '',
      certificate_link: item.certificate_link || ''
    });
    setIsViewMode(false);
    setIsModalOpen(true);
  };

  const handleView = (item) => {
    setCurrentItem(item);
    setFormData({
      internship_name: item.internship_name || '',
      title: item.title || '',
      company: item.company || '',
      outcomes: item.outcomes || '',
      from_date: item.from_date || '',
      to_date: item.to_date || '',
      venue: item.venue || '',
      participants: item.participants?.toString() || '',
      financial_support: Boolean(item.financial_support),
      support_amount: item.support_amount?.toString() || '',
      certificate_link: item.certificate_link || ''
    });
    setIsViewMode(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (item) => {
    if (window.confirm(`Are you sure you want to delete this industry knowhow: ${item.title}?`)) {
      try {
        await deleteIndustryKnowhow(item.id);
        toast.success('Industry knowhow deleted successfully');
        fetchIndustry();
      } catch (error) {
        console.error('Error deleting industry knowhow:', error);
        toast.error('Failed to delete industry knowhow');
      }
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      // Validate required fields
      const requiredFields = ['internship_name', 'title', 'company', 'outcomes', 'from_date', 'to_date', 'venue', 'participants'];
      const missingFields = requiredFields.filter(field => !formData[field] || formData[field].toString().trim() === '');
      
      if (missingFields.length > 0) {
        toast.error(`Please fill in all required fields: ${missingFields.join(', ')}`);
        return;
      }

      // Validate date range
      if (new Date(formData.from_date) > new Date(formData.to_date)) {
        toast.error('From date cannot be later than to date');
        return;
      }

      // Validate participants is a positive number
      if (parseInt(formData.participants) <= 0) {
        toast.error('Number of participants must be greater than 0');
        return;
      }

      // Prepare data for submission
      const submitData = {
        ...formData,
        participants: parseInt(formData.participants),
        financial_support: Boolean(formData.financial_support),
        support_amount: formData.financial_support && formData.support_amount ? 
          parseFloat(formData.support_amount) : null,
        certificate_link: formData.certificate_link.trim() || null
      };

      // Validate support amount if financial support is enabled
      if (submitData.financial_support && (!submitData.support_amount || submitData.support_amount <= 0)) {
        toast.error('Please enter a valid support amount');
        return;
      }
      
      if (currentItem) {
        await updateIndustryKnowhow(currentItem.id, submitData);
        toast.success('Industry knowhow updated successfully');
      } else {
        await createIndustryKnowhow(submitData);
        toast.success('Industry knowhow created successfully');
      }
      
      setIsModalOpen(false);
      resetForm();
      fetchIndustry();
    } catch (error) {
      console.error('Error saving industry knowhow:', error);
      
      // More specific error messages
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.response?.status === 400) {
        toast.error('Invalid data provided. Please check all fields.');
      } else if (error.response?.status === 401) {
        toast.error('You are not authorized to perform this action.');
      } else {
        toast.error('Failed to save industry knowhow. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format date for display - only date part, no time
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    // Extract only the date part (YYYY-MM-DD) if it contains a 'T'
    if (dateString.includes('T')) {
      dateString = dateString.split('T')[0];
    }
    
    // Format as DD/MM/YYYY
    const parts = dateString.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    
    return dateString;
  };

  // Custom renderer for certificate link column
  const renderCertificateLink = (value) => {
    if (!value) return '-';
    return (
      <a 
        href={value} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="text-blue-600 hover:text-blue-800 "
      >
        View
      </a>
    );
  };

  // Format financial support for display
  const formatFinancialSupport = (isSupported, amount) => {
    if (!isSupported) return 'No';
    return `Yes (₹${amount || 0})`;
  };

  // Format date range for display in single line
  const formatDateRange = (fromDate, toDate) => {
    const from = formatDate(fromDate);
    const to = formatDate(toDate);
    if (!from && !to) return '-';
    if (!from) return `- to ${to}`;
    if (!to) return `${from} to -`;
    return `${from} to ${to}`;
  };

  // Truncate long text for table display
  const truncateText = (text, maxLength = 50) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const columns = [
    { field: 'internship_name', header: 'Internship/Training' },
    { field: 'title', header: 'Title' },
    { field: 'company', header: 'Company' },
    { 
      field: 'outcomes', 
      header: 'Outcomes',
      render: (item) => truncateText(item.outcomes)
    },
    { 
      field: 'from_date', 
      header: 'From Date',
      render: (item) => formatDate(item.from_date)
    },
    { 
      field: 'to_date', 
      header: 'To Date',
      render: (item) => formatDate(item.to_date)
    },
    { field: 'venue', header: 'Venue' },
    { 
      field: 'participants', 
      header: 'Participants',
      render: (item) => item.participants || '-'
    },
    {
      field: 'financial_support',
      header: 'Financial Support',
      render: (item) => formatFinancialSupport(item.financial_support, item.support_amount)
    },
    { 
      field: 'certificate_link', 
      header: 'Certificate',
      render: renderCertificateLink
    },
  ];

  // Debug log to help identify the issue
  console.log('industry state:', industry, 'Type:', typeof industry, 'IsArray:', Array.isArray(industry));

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
        
        </div>
        <button
          onClick={handleAddNew}
          className="btn flex items-center gap-2 text-white bg-gradient-to-r from-pink-500 to-purple-400 hover:from-pink-600 hover:to-purple-500 px-4 py-2 rounded-md shadow-md transition-all duration-200"
        >
          <Plus size={16} />
          Add New Industry Knowhow
        </button>
      </div>

      <DataTable
        data={Array.isArray(industry) ? industry : []}
        columns={columns}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={loading}
        emptyMessage="No industry knowhow records found. Add your first record to get started."
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isViewMode ? 'View Industry Knowhow' : currentItem ? 'Edit Industry Knowhow' : 'Add New Industry Knowhow'}
        onSubmit={!isViewMode ? handleSubmit : null}
        isSubmitting={isSubmitting}
        size="lg"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Internship/Training Name"
            name="internship_name"
            value={formData.internship_name}
            onChange={handleInputChange}
            required
            disabled={isViewMode}
          />
          <FormField
            label="Title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
            disabled={isViewMode}
          />
          <FormField
            label="Company & Place"
            name="company"
            value={formData.company}
            onChange={handleInputChange}
            required
            disabled={isViewMode}
          />
          <FormField
            label="Outcomes"
            name="outcomes"
            type="textarea"
            value={formData.outcomes}
            onChange={handleInputChange}
            required
            disabled={isViewMode}
          />
          
          {/* Date Range in Single Line */}
          <div className="col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>
          
          <FormField
            label="Venue"
            name="venue"
            value={formData.venue}
            onChange={handleInputChange}
            required
            disabled={isViewMode}
          />
          <FormField
            label="Number of Participants"
            name="participants"
            type="number"
            value={formData.participants}
            onChange={handleInputChange}
            required
            disabled={isViewMode}
            min="1"
          />
          <FormField
            label="Financial Support"
            name="financial_support"
            type="checkbox"
            value={formData.financial_support}
            onChange={handleInputChange}
            disabled={isViewMode}
          />
          {formData.financial_support && (
            <FormField
              label="Support Amount (₹)"
              name="support_amount"
              type="number"
              value={formData.support_amount}
              onChange={handleInputChange}
              disabled={isViewMode}
              min="0"
              step="0.01"
            />
          )}
          <FormField
            label="Certificate Link"
            name="certificate_link"
            value={formData.certificate_link}
            onChange={handleInputChange}
            disabled={isViewMode}
            placeholder="URL to certificate"
          />
          {isViewMode && formData.certificate_link && (
            <div className="col-span-2">
              <a 
                href={formData.certificate_link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                View Certificate
              </a>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default IndustryPage;