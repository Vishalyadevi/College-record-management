import React, { useState, useEffect } from 'react';
import { Edit2 } from 'lucide-react';

// API Configuration - Updated to match your backend
const API_BASE_URL = 'http://localhost:4000/api';

const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};

// Updated API functions to match your backend routes
const getPersonalInfoEntries = async () => {
  return await apiCall('/personal');
};

const createPersonalInfoEntry = async (data) => {
  return await apiCall('/personal', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

const updatePersonalInfoEntry = async (id, data) => {
  return await apiCall(`/personal/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

const deletePersonalInfoEntry = async (id) => {
  return await apiCall(`/personal/${id}`, {
    method: 'DELETE',
  });
};

const PersonalInfoPage = () => {
  const [personalInfoData, setPersonalInfoData] = useState([]);
  const [formData, setFormData] = useState({
    full_name: '',
    date_of_birth: '',
    age: '',
    gender: '',
    email: '',
    mobile_number: '',
    communication_address: '',
    permanent_address: '',
    religion: '',
    community: '',
    caste: '',
    post: '',
    department: '',
    applied_date: '',
    anna_university_faculty_id: '',
    aicte_faculty_id: '',
    orcid: '',
    researcher_id: '',
    google_scholar_id: '',
    scopus_profile: '',
    vidwan_profile: '',
    supervisor_id: '',
    h_index: '',
    citation_index: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [isEditable, setIsEditable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchPersonalInfo();
  }, []);

  const fetchPersonalInfo = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getPersonalInfoEntries();
      console.log('Fetched data:', response);
      
      const data = Array.isArray(response) ? response : (response.data || []);
      setPersonalInfoData(data);
      
      if (data.length > 0) {
        const firstEntry = data[0];
        setFormData({
          full_name: firstEntry.full_name || '',
          date_of_birth: firstEntry.date_of_birth || '',
          age: firstEntry.age || '',
          gender: firstEntry.gender || '',
          email: firstEntry.email || '',
          mobile_number: firstEntry.mobile_number || '',
          communication_address: firstEntry.communication_address || '',
          permanent_address: firstEntry.permanent_address || '',
          religion: firstEntry.religion || '',
          community: firstEntry.community || '',
          caste: firstEntry.caste || '',
          post: firstEntry.post || '',
          department: firstEntry.department || '',
          applied_date: firstEntry.applied_date || '',
          anna_university_faculty_id: firstEntry.anna_university_faculty_id || '',
          aicte_faculty_id: firstEntry.aicte_faculty_id || '',
          orcid: firstEntry.orcid || '',
          researcher_id: firstEntry.researcher_id || '',
          google_scholar_id: firstEntry.google_scholar_id || '',
          scopus_profile: firstEntry.scopus_profile || '',
          vidwan_profile: firstEntry.vidwan_profile || '',
          supervisor_id: firstEntry.supervisor_id || '',
          h_index: firstEntry.h_index || '',
          citation_index: firstEntry.citation_index || ''
        });
        setEditingId(firstEntry.id);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError(`Failed to fetch data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = () => {
    setIsEditable(true);
    setError('');
    setSuccess('');
  };

  const handleChange = (e) => {
    if (!isEditable) return;
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const requiredFields = [
      'full_name', 'date_of_birth', 'gender', 'email', 
      'mobile_number', 'communication_address', 'permanent_address',
      'religion', 'community', 'caste', 'post', 'department'
    ];
    
    const missingFields = requiredFields.filter(field => !formData[field] || formData[field].trim() === '');
    
    if (missingFields.length > 0) {
      setError(`Missing required fields: ${missingFields.join(', ')}`);
      return false;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Invalid email format');
      return false;
    }

    // Validate mobile number (should be 10 digits)
    const mobileRegex = /^\d{10}$/;
    if (!mobileRegex.test(formData.mobile_number)) {
      setError('Mobile number should be 10 digits');
      return false;
    }

    // Validate gender
    const validGenders = ['Male', 'Female', 'Other'];
    if (!validGenders.includes(formData.gender)) {
      setError('Gender must be Male, Female, or Other');
      return false;
    }

    return true;
  };

  const handleSaveClick = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      // Prepare clean data object, removing empty strings
      const cleanData = Object.keys(formData).reduce((acc, key) => {
        const value = formData[key];
        if (value !== null && value !== undefined && value !== '') {
          acc[key] = value;
        }
        return acc;
      }, {});
      
      console.log('Saving data:', cleanData);
      
      let response;
      if (editingId && personalInfoData.length > 0) {
        response = await updatePersonalInfoEntry(editingId, cleanData);
        setSuccess('Personal information updated successfully');
      } else {
        response = await createPersonalInfoEntry(cleanData);
        setSuccess('Personal information created successfully');
      }
      
      console.log('Save response:', response);
      setIsEditable(false);
      await fetchPersonalInfo();
    } catch (err) {
      console.error('Save error:', err);
      setError(`Failed to save: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditEntry = (entry) => {
    setFormData({
      full_name: entry.full_name || '',
      date_of_birth: entry.date_of_birth || '',
      age: entry.age || '',
      gender: entry.gender || '',
      email: entry.email || '',
      mobile_number: entry.mobile_number || '',
      communication_address: entry.communication_address || '',
      permanent_address: entry.permanent_address || '',
      religion: entry.religion || '',
      community: entry.community || '',
      caste: entry.caste || '',
      post: entry.post || '',
      department: entry.department || '',
      applied_date: entry.applied_date || '',
      anna_university_faculty_id: entry.anna_university_faculty_id || '',
      aicte_faculty_id: entry.aicte_faculty_id || '',
      orcid: entry.orcid || '',
      researcher_id: entry.researcher_id || '',
      google_scholar_id: entry.google_scholar_id || '',
      scopus_profile: entry.scopus_profile || '',
      vidwan_profile: entry.vidwan_profile || '',
      supervisor_id: entry.supervisor_id || '',
      h_index: entry.h_index || '',
      citation_index: entry.citation_index || ''
    });
    setEditingId(entry.id);
    setIsEditable(false);
    setError('');
    setSuccess('');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      try {
        setLoading(true);
        setError('');
        await deletePersonalInfoEntry(id);
        setSuccess('Entry deleted successfully');
        await fetchPersonalInfo();
        
        // Reset form if we deleted the current entry
        if (editingId === id) {
          setFormData({
            full_name: '',
            date_of_birth: '',
            age: '',
            gender: '',
            email: '',
            mobile_number: '',
            communication_address: '',
            permanent_address: '',
            religion: '',
            community: '',
            caste: '',
            post: '',
            department: '',
            applied_date: '',
            anna_university_faculty_id: '',
            aicte_faculty_id: '',
            orcid: '',
            researcher_id: '',
            google_scholar_id: '',
            scopus_profile: '',
            vidwan_profile: '',
            supervisor_id: '',
            h_index: '',
            citation_index: ''
          });
          setEditingId(null);
        }
      } catch (err) {
        console.error('Delete error:', err);
        setError(`Failed to delete: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }
  };

  const personalInfoFields = [
    { name: 'full_name', label: 'Full Name', type: 'text', required: true },
    { name: 'date_of_birth', label: 'Date of Birth', type: 'date', required: true },
    { name: 'age', label: 'Age', type: 'number' },
    { name: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'], required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'mobile_number', label: 'Mobile Number', type: 'tel', required: true },
    
    { name: 'communication_address', label: 'Communication Address', type: 'textarea', required: true },
    { name: 'permanent_address', label: 'Permanent Address', type: 'textarea', required: true },
    
    { name: 'religion', label: 'Religion', type: 'text', required: true },
    { name: 'community', label: 'Community', type: 'text', required: true },
    { name: 'caste', label: 'Caste', type: 'text', required: true },
    
    { name: 'post', label: 'Post', type: 'text', required: true },
    { name: 'department', label: 'Department', type: 'text', required: true },
    { name: 'applied_date', label: 'Applied Date', type: 'date' },
    
    { name: 'anna_university_faculty_id', label: 'Anna University Faculty ID', type: 'text' },
    { name: 'aicte_faculty_id', label: 'AICTE Faculty ID', type: 'text' },
    { name: 'orcid', label: 'ORCID', type: 'text' },
    { name: 'researcher_id', label: 'Researcher ID', type: 'text' },
    { name: 'google_scholar_id', label: 'Google Scholar ID', type: 'text' },
    { name: 'scopus_profile', label: 'Scopus Profile', type: 'url' },
    { name: 'vidwan_profile', label: 'Vidwan Profile', type: 'url' },
    
    { name: 'supervisor_id', label: 'Supervisor ID', type: 'number' },
    { name: 'h_index', label: 'H-Index', type: 'number' },
    { name: 'citation_index', label: 'Citation Index', type: 'number' }
  ];

  const renderField = (field) => {
    const commonProps = {
      name: field.name,
      value: formData[field.name] || '',
      onChange: handleChange,
      className: `w-full px-3 py-2 border rounded-lg focus:ring-2 ${
        isEditable
          ? 'border-gray-300 focus:ring-blue-500 focus:border-transparent'
          : 'border-gray-200 bg-gray-100 cursor-not-allowed'
      }`,
      readOnly: !isEditable,
      required: field.required
    };

    if (field.type === 'select') {
      return (
        <select {...commonProps} disabled={!isEditable}>
          <option value="">Select {field.label}</option>
          {field.options.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      );
    }

    if (field.type === 'textarea') {
      return (
        <textarea
          {...commonProps}
          rows="3"
          placeholder={`Enter ${field.label.toLowerCase()}`}
        />
      );
    }

    return (
      <input
        {...commonProps}
        type={field.type}
        placeholder={`Enter ${field.label.toLowerCase()}`}
      />
    );
  };

  const fieldSections = [
    {
      title: 'Basic Information',
      fields: personalInfoFields.slice(0, 6)
    },
    {
      title: 'Address Information',
      fields: personalInfoFields.slice(6, 8)
    },
    {
      title: 'Personal Details',
      fields: personalInfoFields.slice(8, 11)
    },
    {
      title: 'Professional Information',
      fields: personalInfoFields.slice(11, 14)
    },
    {
      title: 'Academic IDs & Profiles',
      fields: personalInfoFields.slice(14, 21)
    },
    {
      title: 'Research Metrics',
      fields: personalInfoFields.slice(21, 24)
    }
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="w-full">
        <div className="px-8 py-6 relative">
          {loading && (
            <div className="mb-4 p-4 bg-blue-100 border border-blue-300 rounded">
              <p className="text-blue-700">Loading...</p>
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-300 rounded">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-100 border border-green-300 rounded">
              <p className="text-green-700">{success}</p>
            </div>
          )}

          <div className="flex justify-between items-center mb-4">
            <button
              type="button"
              onClick={handleEditClick}
              className="flex items-center space-x-2 px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-white rounded disabled:opacity-50"
              disabled={isEditable || loading}
              title="Edit"
            >
              <Edit2 size={18} />
              <span>Edit</span>
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6 space-y-8">
            {fieldSections.map((section) => (
              <div key={section.title}>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">
                  {section.title}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {section.fields.map((field) => (
                    <div key={field.name} className={field.type === 'textarea' ? 'md:col-span-2 lg:col-span-3' : ''}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      {renderField(field)}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {isEditable && (
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditable(false);
                    setError('');
                    setSuccess('');
                  }}
                  className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition duration-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveClick}
                  disabled={loading}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white rounded-lg shadow-md hover:shadow-xl transition duration-300 ease-in-out font-semibold disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default PersonalInfoPage;