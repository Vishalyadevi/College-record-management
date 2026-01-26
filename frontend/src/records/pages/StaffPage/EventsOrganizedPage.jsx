import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import { getEventsOrganized, createEventOrganized, updateEventOrganized, deleteEventOrganized } from '../../services/api';
import toast from 'react-hot-toast';

const EventsOrganizedPage = () => {
  const [eventsOrganized, setEventsOrganized] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);

  const [formData, setFormData] = useState({
    program_name: '',
    program_title: '',
    coordinator_name: '',
    co_coordinator_names: '',
    speaker_details: '',
    from_date: '',
    to_date: '',
    days: '',
    sponsored_by: '',
    amount_sanctioned: '',
    participants: '',
    proof_link: '',
    documentation_link: '',
    proof_file: null,
    documentation_file: null
  });

  const fetchEventsOrganized = async () => {
    try {
      setLoading(true);
      const response = await getEventsOrganized();
      setEventsOrganized(response.data);
    } catch (error) {
      console.error('Error fetching Events Organized data:', error);
      toast.error('Failed to load Events Organized data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventsOrganized();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, files } = e.target;

    if (type === 'file') {
      setFormData((prev) => ({ ...prev, [name]: files[0] || null }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));

      // Auto-calculate days when dates change
      if (name === 'from_date' || name === 'to_date') {
        const fromDate = name === 'from_date' ? value : formData.from_date;
        const toDate = name === 'to_date' ? value : formData.to_date;

        if (fromDate && toDate) {
          const from = new Date(fromDate);
          const to = new Date(toDate);

          if (from <= to) {
            const timeDiff = to.getTime() - from.getTime();
            const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // +1 to include both start and end dates
            setFormData((prev) => ({ ...prev, days: daysDiff.toString() }));
          }
        }
      }
    }
  };

  const resetForm = () => {
    setFormData({
      program_name: '',
      program_title: '',
      coordinator_name: '',
      co_coordinator_names: '',
      speaker_details: '',
      from_date: '',
      to_date: '',
      days: '',
      sponsored_by: '',
      amount_sanctioned: '',
      participants: '',
      proof_link: '',
      documentation_link: ''
    });
    setCurrentRecord(null);
    setIsViewMode(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD for input[type="date"]
  };

  // New function for displaying dates in DD/MM/YYYY format
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {
      return dateString;
    }
  };

  const handleAddNew = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleEdit = (record) => {
    setCurrentRecord(record);
    setFormData({
      program_name: record.program_name || '',
      program_title: record.program_title || '',
      coordinator_name: record.coordinator_name || '',
      co_coordinator_names: record.co_coordinator_names || '',
      speaker_details: record.speaker_details || '',
      from_date: formatDate(record.from_date) || '',
      to_date: formatDate(record.to_date) || '',
      days: record.days?.toString() || '',
      sponsored_by: record.sponsored_by || '',
      amount_sanctioned: record.amount_sanctioned?.toString() || '',
      participants: record.participants?.toString() || '',
      proof_file: null,
      documentation_file: null
    });
    setIsViewMode(false);
    setIsModalOpen(true);
  };

  const handleView = (record) => {
    setCurrentRecord(record);
    setFormData({
      program_name: record.program_name || '',
      program_title: record.program_title || '',
      coordinator_name: record.coordinator_name || '',
      co_coordinator_names: record.co_coordinator_names || '',
      speaker_details: record.speaker_details || '',
      from_date: formatDate(record.from_date) || '',
      to_date: formatDate(record.to_date) || '',
      days: record.days?.toString() || '',
      sponsored_by: record.sponsored_by || '',
      amount_sanctioned: record.amount_sanctioned?.toString() || '',
      participants: record.participants?.toString() || '',
      proof_link: record.proof_link || '',
      documentation_link: record.documentation_link || ''
    });
    setIsViewMode(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (record) => {
    if (window.confirm(`Are you sure you want to delete the event "${record.program_name}"?`)) {
      try {
        await deleteEventOrganized(record.id);
        toast.success('Event record deleted successfully');
        fetchEventsOrganized();
      } catch (error) {
        console.error('Error deleting Event record:', error);
        toast.error('Failed to delete Event record');
      }
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      console.log('Form data before validation:', formData);

      if (!formData.program_name || !formData.program_title || !formData.coordinator_name ||
          !formData.speaker_details || !formData.from_date || !formData.to_date || !formData.participants) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Validate dates
      const fromDate = new Date(formData.from_date);
      const toDate = new Date(formData.to_date);

      if (fromDate > toDate) {
        toast.error('From date cannot be after to date');
        return;
      }

      // Ensure days is calculated and valid
      let daysValue = parseInt(formData.days);
      if (!daysValue || daysValue <= 0) {
        // Auto-calculate days if not provided or invalid
        const timeDiff = toDate.getTime() - fromDate.getTime();
        daysValue = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
      }

      console.log('Calculated days value:', daysValue);

      // Create FormData for file uploads
      const submitData = new FormData();

      // Append all form fields to FormData, excluding file-related URL fields
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== undefined && formData[key] !== '') {
          if (key === 'proof_file' || key === 'documentation_file') {
            // Handle file fields
            if (formData[key]) {
              submitData.append(key, formData[key]);
              console.log(`Appending file ${key}:`, formData[key].name);
            }
          } else if (key !== 'proof_link' && key !== 'documentation_link') {
            // Exclude proof_link and documentation_link as they are handled by file uploads
            submitData.append(key, formData[key]);
            console.log(`Appending field ${key}:`, formData[key]);
          }
        }
      });

      // Ensure days is always included
      submitData.append('days', daysValue.toString());
      console.log('Final FormData contents:');
      for (let [key, value] of submitData.entries()) {
        console.log(key, value);
      }

      if (currentRecord) {
        console.log('Updating event with ID:', currentRecord.id);
        await updateEventOrganized(currentRecord.id, submitData);
        toast.success('Event updated successfully');
      } else {
        console.log('Creating new event');
        await createEventOrganized(submitData);
        toast.success('Event created successfully');
      }

      setIsModalOpen(false);
      resetForm();
      fetchEventsOrganized();
    } catch (error) {
      console.error('Error saving Event:', error);
      console.error('Error details:', error.response?.data || error.message);
      toast.error(error.response?.data?.message || 'Failed to save Event');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    { field: 'program_name', header: 'Program Name' },
    { field: 'program_title', header: 'Program Title' },
    { field: 'coordinator_name', header: 'Coordinator Name' },
    { field: 'co_coordinator_names', header: 'Co-Coordinator Names' },
    { field: 'speaker_details', header: 'Speaker Details' },
    { 
      field: 'from_date', 
      header: 'From Date', 
      render: (rowData) => formatDateForDisplay(rowData.from_date)
    },
    { 
      field: 'to_date', 
      header: 'To Date', 
      render: (rowData) => formatDateForDisplay(rowData.to_date)
    },
    { field: 'days', header: 'Number of Days' },
    { field: 'participants', header: 'Number of Participants' },
    { field: 'sponsored_by', header: 'Sponsored By' },
    { 
      field: 'amount_sanctioned', 
      header: 'Amount Sanctioned',
    },
    { 
      field: 'proof_link', 
      header: 'Proof Link',
      render: (value) => value ? (
        <a 
          href={value} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline"
        >
          View
        </a>
      ) : '-'
    },
    { 
      field: 'documentation_link', 
      header: 'Documentation Link',
      render: (value) => value ? (
        <a 
          href={value} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline"
        >
          View
        </a>
      ) : '-'
    }
  ];

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <button 
          onClick={handleAddNew}           
          className="btn flex items-center gap-2 text-white bg-gradient-to-r from-blue-600 to-purple-400 hover:from-blue-800 hover:to-purple-500 px-4 py-2 rounded-md shadow-md"
        >
          <Plus size={16} />
          Add New Event
        </button>
      </div>

      <DataTable
        data={eventsOrganized}
        columns={columns}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={loading}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isViewMode ? 'View Event' : currentRecord ? 'Edit Event' : 'Add New Event'}
        onSubmit={!isViewMode ? handleSubmit : null}
        isSubmitting={isSubmitting}
        size="xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Program Name"
            name="program_name"
            value={formData.program_name}
            onChange={handleInputChange}
            required
            disabled={isViewMode}
          />
          <FormField
            label="Program Title"
            name="program_title"
            value={formData.program_title}
            onChange={handleInputChange}
            required
            disabled={isViewMode}
          />
          <FormField
            label="Coordinator Name"
            name="coordinator_name"
            value={formData.coordinator_name}
            onChange={handleInputChange}
            required
            disabled={isViewMode}
          />
          <FormField
            label="Co-Coordinator Names"
            name="co_coordinator_names"
            value={formData.co_coordinator_names}
            onChange={handleInputChange}
            disabled={isViewMode}
            placeholder="Separate multiple names with commas"
          />
          <div className="md:col-span-2">
            <FormField
              label="Speaker Details"
              name="speaker_details"
              type="textarea"
              value={formData.speaker_details}
              onChange={handleInputChange}
              required
              disabled={isViewMode}
              placeholder="Enter speaker details, topics, etc."
            />
          </div>
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
            label="Number of Days"
            name="days"
            type="number"
            value={formData.days}
            onChange={handleInputChange}
            required
            disabled={isViewMode || (formData.from_date && formData.to_date)}
            min="1"
            placeholder="Auto-calculated from dates"
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
            label="Sponsored By"
            name="sponsored_by"
            value={formData.sponsored_by}
            onChange={handleInputChange}
            disabled={isViewMode}
            placeholder="Optional"
          />
          <FormField
            label="Amount Sanctioned"
            name="amount_sanctioned"
            type="number"
            value={formData.amount_sanctioned}
            onChange={handleInputChange}
            disabled={isViewMode}
            placeholder="Optional"
            step="0.01"
          />
          <div className="flex flex-col mb-4">
            <label className="font-medium text-gray-700 mb-1">Proof File</label>
            <input
              type="file"
              name="proof_file"
              onChange={handleInputChange}
              disabled={isViewMode}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              className="border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-col mb-4">
            <label className="font-medium text-gray-700 mb-1">Documentation File</label>
            <input
              type="file"
              name="documentation_file"
              onChange={handleInputChange}
              disabled={isViewMode}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              className="border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default EventsOrganizedPage;