import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import { getEvents, createEvent, updateEvent, deleteEvent } from '../../services/api';
import toast from 'react-hot-toast';

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
  
  const [formData, setFormData] = useState({
    programme_name: '',
    title: '',
    from_date: '',
    to_date: '',
    mode: '',
    organized_by: '',
    participants: '',
    financial_support: false,
    support_amount: '',
    permission_letter_link: '',
    certificate_link: '',
    financial_proof_link: '',
    programme_report_link: ''
  });

  // Dropdown options
  const programmeOptions = [
    { value: '', label: 'Select Programme Type' },
    { value: 'FDP', label: 'Faculty Development Programme (FDP)' },
    { value: 'Workshop', label: 'Workshop' },
    { value: 'Seminar', label: 'Seminar' },
    { value: 'STTP', label: 'Short Term Training Programme (STTP)' },
    { value: 'Industry Know How', label: 'Industry Know How' },
    { value: 'Conference', label: 'Conference' },
    { value: 'Symposium', label: 'Symposium' },
    { value: 'Training Program', label: 'Training Program' },
    { value: 'Webinar', label: 'Webinar' }
  ];

  const modeOptions = [
    { value: '', label: 'Select Mode' },
    { value: 'Online', label: 'Online' },
    { value: 'Offline', label: 'Offline' },
    { value: 'Hybrid', label: 'Hybrid' }
  ];

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await getEvents();
      // Handle different response structures
      const eventsData = response.data || response || [];
      setEvents(Array.isArray(eventsData) ? eventsData : []);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to load events');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
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
      programme_name: '',
      title: '',
      from_date: '',
      to_date: '',
      mode: '',
      organized_by: '',
      participants: '',
      financial_support: false,
      support_amount: '',
      permission_letter_link: '',
      certificate_link: '',
      financial_proof_link: '',
      programme_report_link: ''
    });
    setCurrentEvent(null);
    setIsViewMode(false);
  };

  const handleAddNew = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleEdit = (event) => {
    setCurrentEvent(event);
    setFormData({
      programme_name: event.programme_name || '',
      title: event.title || '',
      from_date: event.from_date || '',
      to_date: event.to_date || '',
      mode: event.mode || '',
      organized_by: event.organized_by || '',
      participants: event.participants?.toString() || '',
      financial_support: Boolean(event.financial_support),
      support_amount: event.support_amount?.toString() || '',
      permission_letter_link: event.permission_letter_link || '',
      certificate_link: event.certificate_link || '',
      financial_proof_link: event.financial_proof_link || '',
      programme_report_link: event.programme_report_link || ''
    });
    setIsViewMode(false);
    setIsModalOpen(true);
  };

  const handleView = (event) => {
    setCurrentEvent(event);
    setFormData({
      programme_name: event.programme_name || '',
      title: event.title || '',
      from_date: event.from_date || '',
      to_date: event.to_date || '',
      mode: event.mode || '',
      organized_by: event.organized_by || '',
      participants: event.participants?.toString() || '',
      financial_support: Boolean(event.financial_support),
      support_amount: event.support_amount?.toString() || '',
      permission_letter_link: event.permission_letter_link || '',
      certificate_link: event.certificate_link || '',
      financial_proof_link: event.financial_proof_link || '',
      programme_report_link: event.programme_report_link || ''
    });
    setIsViewMode(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (event) => {
    if (window.confirm(`Are you sure you want to delete this event: ${event.title}?`)) {
      try {
        await deleteEvent(event.id);
        toast.success('Event deleted successfully');
        fetchEvents();
      } catch (error) {
        console.error('Error deleting event:', error);
        toast.error('Failed to delete event');
      }
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      // Validate required fields
      if (!formData.programme_name?.trim() || !formData.title?.trim() || 
          !formData.from_date || !formData.to_date || !formData.mode || 
          !formData.organized_by?.trim() || !formData.participants) {
        toast.error('Please fill in all required fields');
        return;
      }
      
      // Validate dates
      const fromDate = new Date(formData.from_date);
      const toDate = new Date(formData.to_date);
      
      if (fromDate > toDate) {
        toast.error('Start date must be before end date');
        return;
      }

      // Prepare data for submission
      const submitData = {
        programme_name: formData.programme_name.trim(),
        title: formData.title.trim(),
        from_date: formData.from_date,
        to_date: formData.to_date,
        mode: formData.mode,
        organized_by: formData.organized_by.trim(),
        participants: parseInt(formData.participants) || 0,
        financial_support: Boolean(formData.financial_support),
        support_amount: formData.financial_support ? (parseFloat(formData.support_amount) || 0) : 0,
        permission_letter_link: formData.permission_letter_link?.trim() || '',
        certificate_link: formData.certificate_link?.trim() || '',
        financial_proof_link: formData.financial_proof_link?.trim() || '',
        programme_report_link: formData.programme_report_link?.trim() || ''
      };
      
      if (currentEvent) {
        await updateEvent(currentEvent.id, submitData);
        toast.success('Event updated successfully');
      } else {
        await createEvent(submitData);
        toast.success('Event created successfully');
      }
      
      setIsModalOpen(false);
      resetForm();
      fetchEvents();
    } catch (error) {
      console.error('Error saving event:', error);
      // Show more specific error message if available
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save event';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    try {
      // Handle both ISO date strings and date objects
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString; // Return original if invalid
      
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`; // Changed from DD-MM-YYYY to DD/MM/YYYY format
    } catch (error) {
      return dateString; // Return original if formatting fails
    }
  };

  const formatCurrency = (amount) => {
    if (!amount || amount === 0) return '-';
    return `₹${parseFloat(amount).toLocaleString('en-IN')}`;
  };

  const columns = [
    { field: 'programme_name', header: 'Programme Name' },
    { field: 'title', header: 'Title' },
    { 
      field: 'from_date', 
      header: 'From Date', 
      render: (rowData) => formatDate(rowData.from_date)
    },
    { 
      field: 'to_date', 
      header: 'To Date', 
      render: (rowData) => formatDate(rowData.to_date)
    },
    { field: 'mode', header: 'Mode' },
    { field: 'organized_by', header: 'Organized By' },
    { field: 'participants', header: 'Participants' },
    {
      field: 'financial_support',
      header: 'Financial Support',
      render: (rowData) => (
        <div className="text-center">
          {rowData.financial_support ? (
            <div>
              <span >
                Yes
              </span>
              {rowData.support_amount && (
                <div className="text-xs text-gray-600">
                  {formatCurrency(rowData.support_amount)}
                </div>
              )}
            </div>
          ) : (
            <span >
              No
            </span>
          )}
        </div>
      )
    },
    {
      field: 'permission_letter_link',
      header: 'Permission Link',
      render: (rowData) => (
        <div className="text-center">
          {rowData.permission_letter_link ? (
            <a
              href={rowData.permission_letter_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              View
            </a>
          ) : (
            <span className="text-gray-400 text-sm">-</span>
          )}
        </div>
      )
    },
    {
      field: 'certificate_link',
      header: 'Certificate Link',
      render: (rowData) => (
        <div className="text-center">
          {rowData.certificate_link ? (
            <a
              href={rowData.certificate_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              View
            </a>
          ) : (
            <span className="text-gray-400 text-sm">-</span>
          )}
        </div>
      )
    },
    {
      field: 'financial_proof_link',
      header: 'Financial Proof',
      render: (rowData) => (
        <div className="text-center">
          {rowData.financial_proof_link ? (
            <a
              href={rowData.financial_proof_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              View
            </a>
          ) : (
            <span className="text-gray-400 text-sm">-</span>
          )}
        </div>
      )
    },
    {
      field: 'programme_report_link',
      header: 'Report Link',
      render: (rowData) => (
        <div className="text-center">
          {rowData.programme_report_link ? (
            <a
              href={rowData.programme_report_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              View
            </a>
          ) : (
            <span className="text-gray-400 text-sm">-</span>
          )}
        </div>
      )
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
          Add New Event
        </button>
      </div>

      <DataTable
        data={events}
        columns={columns}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={loading}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={isViewMode ? 'View Event' : currentEvent ? 'Edit Event' : 'Add New Event'}
        onSubmit={!isViewMode ? handleSubmit : null}
        isSubmitting={isSubmitting}
        size="lg"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="mb-4">
            <label htmlFor="programme_name" className="block text-sm font-medium text-gray-700 mb-1">
              Name of the Programme
              <span className="text-red-500 ml-1">*</span>
            </label>
            <select
              id="programme_name"
              name="programme_name"
              value={formData.programme_name}
              onChange={handleInputChange}
              required
              disabled={isViewMode}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100"
            >
              {programmeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <FormField
            label="Title of the Programme"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
            disabled={isViewMode}
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
          <div className="mb-4">
            <label htmlFor="mode" className="block text-sm font-medium text-gray-700 mb-1">
              Mode
              <span className="text-red-500 ml-1">*</span>
            </label>
            <select
              id="mode"
              name="mode"
              value={formData.mode}
              onChange={handleInputChange}
              required
              disabled={isViewMode}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100"
            >
              {modeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <FormField
            label="Organized By"
            name="organized_by"
            value={formData.organized_by}
            onChange={handleInputChange}
            required
            disabled={isViewMode}
          />
          <FormField
            label="No. of Participants"
            name="participants"
            type="number"
            value={formData.participants}
            onChange={handleInputChange}
            required
            disabled={isViewMode}
            min="1"
          />
          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="financial_support"
                checked={formData.financial_support}
                onChange={handleInputChange}
                disabled={isViewMode}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">
                Received Financial support from NEC
              </span>
            </label>
          </div>
          {formData.financial_support && (
            <FormField
              label="If Received Mention the Amount"
              name="support_amount"
              type="number"
              value={formData.support_amount}
              onChange={handleInputChange}
              disabled={isViewMode}
              min="0"
              step="0.01"
            />
          )}
          
          <div className="md:col-span-2">
            <h3 className="text-md font-medium text-gray-800 mb-3">Documents</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isViewMode ? (
                <>
                  {formData.permission_letter_link && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Permission Letter</label>
                      <a 
                        href={formData.permission_letter_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        View Permission Letter
                      </a>
                    </div>
                  )}
                  {formData.certificate_link && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Certificate</label>
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
                  {formData.financial_support && formData.financial_proof_link && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Financial Assistance Proof</label>
                      <a 
                        href={formData.financial_proof_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        View Financial Proof
                      </a>
                    </div>
                  )}
                  {formData.programme_report_link && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Programme Report</label>
                      <a 
                        href={formData.programme_report_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        View Programme Report
                      </a>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <FormField
                    label="Permission Letter Link"
                    name="permission_letter_link"
                    value={formData.permission_letter_link}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    placeholder="URL to scanned copy of permission letter"
                  />
                  <FormField
                    label="Certificate Link"
                    name="certificate_link"
                    value={formData.certificate_link}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    placeholder="URL to certificate"
                  />
                  {formData.financial_support && (
                    <FormField
                      label="Financial Assistance Proof Link"
                      name="financial_proof_link"
                      value={formData.financial_proof_link}
                      onChange={handleInputChange}
                      disabled={isViewMode}
                      placeholder="URL to proof of financial assistance"
                    />
                  )}
                  <FormField
                    label="Programme Report Link"
                    name="programme_report_link"
                    value={formData.programme_report_link}
                    onChange={handleInputChange}
                    disabled={isViewMode}
                    placeholder="URL to programme report"
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default EventsPage;