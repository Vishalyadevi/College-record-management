import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import {
  getPatentEntries,
  createPatentEntry,
  updatePatentEntry,
  deletePatentEntry
} from '../../services/api';
import toast from 'react-hot-toast';

const PatentDevelopmentPage = () => {
  const [entries, setEntries] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    projectTitle: '',
    patentStatus: '',
    monthYear: '',
    patentProof: '',
    workingModel: '',
    workingModelProof: '',
    prototype: '',
    prototypeProof: ''
  });

  const fetchData = async () => {
    try {
      const response = await getPatentEntries();
      // Fix: Access the data array from the response structure
      setEntries(response.data?.data || []); // Use optional chaining and fallback to empty array
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to fetch entries');
      setEntries([]); // Ensure entries is always an array
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (editingItem) {
      setFormData({
        projectTitle: editingItem.project_title || '',
        patentStatus: editingItem.patent_status || '',
        monthYear: editingItem.month_year || '',
        patentProof: editingItem.patent_proof_link || '',
        workingModel: editingItem.working_model ? 'Yes' : 'No',
        workingModelProof: editingItem.working_model_proof_link || '',
        prototype: editingItem.prototype_developed ? 'Yes' : 'No',
        prototypeProof: editingItem.prototype_proof_link || ''
      });
    } else {
      setFormData({
        projectTitle: '',
        patentStatus: '',
        monthYear: '',
        patentProof: '',
        workingModel: '',
        workingModelProof: '',
        prototype: '',
        prototypeProof: ''
      });
    }
  }, [editingItem]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    const payload = {
      project_title: formData.projectTitle.trim(),
      patent_status: formData.patentStatus.trim(),
      month_year: formData.monthYear.trim(),
      patent_proof_link: formData.patentProof.trim(),
      working_model: formData.workingModel.trim().toLowerCase() === 'yes',
      working_model_proof_link: formData.workingModelProof.trim(),
      prototype_developed: formData.prototype.trim().toLowerCase() === 'yes',
      prototype_proof_link: formData.prototypeProof.trim(),
      user_id: 1,
    };

    try {
      if (editingItem) {
        await updatePatentEntry(editingItem.id, payload);
        toast.success('Entry updated successfully');
      } else {
        await createPatentEntry(payload);
        toast.success('Entry added successfully');
      }
      setModalOpen(false);
      setEditingItem(null);
      fetchData();
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Failed to save entry');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deletePatentEntry(id);
      toast.success('Entry deleted');
      fetchData();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete entry');
    }
  };

  const handleView = (item) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const columns = [
    { header: 'Project Title', field: 'project_title' },
    { header: 'Patent Status', field: 'patent_status' },
    { header: 'Month & Year', field: 'month_year' },
    {
      header: 'Patent Proof',
      field: 'patent_proof_link',
      render: (row) => row.patent_proof_link ? 
        <a href={row.patent_proof_link} className="text-blue-500" target="_blank" rel="noreferrer">View</a> : 'N/A'
    },
    { 
      header: 'Working Model', 
      field: 'working_model',
      render: (row) => row.working_model ? 'Yes' : 'No'
    },
    {
      header: 'Working Model Proof',
      field: 'working_model_proof_link',
      render: (row) => row.working_model_proof_link ? 
        <a href={row.working_model_proof_link} className="text-blue-500" target="_blank" rel="noreferrer">View</a> : 'N/A'
    },
    { 
      header: 'Prototype', 
      field: 'prototype_developed',
      render: (row) => row.prototype_developed ? 'Yes' : 'No'
    },
    {
      header: 'Prototype Proof',
      field: 'prototype_proof_link',
      render: (row) => row.prototype_proof_link ? 
        <a href={row.prototype_proof_link} className="text-blue-500" target="_blank" rel="noreferrer">View</a> : 'N/A'
    },
  ];

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => {
            setEditingItem(null);
            setModalOpen(true);
          }}
          className="btn flex items-center gap-2 text-white bg-gradient-to-r from-pink-500 to-purple-400 hover:from-pink-800 hover:to-purple-500 px-4 py-2 rounded-md shadow-md"
        >
          <Plus size={16} />
          Add Entry
        </button>
      </div>

      <DataTable
        data={entries}
        columns={columns}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={(item) => handleDelete(item.id)}
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? 'Edit Entry' : 'Add Patent / Product Development Entry'}
        onSubmit={handleSubmit}
      >
        <FormField label="Project Title" name="projectTitle" value={formData.projectTitle} onChange={handleChange} />
        <FormField label="Patent Granted / Published" name="patentStatus" value={formData.patentStatus} onChange={handleChange} />
        <FormField label="Month & Year" name="monthYear" type="month" value={formData.monthYear} onChange={handleChange} />
        <FormField label="Patent Proof Link" name="patentProof" value={formData.patentProof} onChange={handleChange} />
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Working Model</label>
          <select
            name="workingModel"
            value={formData.workingModel}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select...</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>

        <FormField label="Working Model Proof Link" name="workingModelProof" value={formData.workingModelProof} onChange={handleChange} />
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Prototype Developed</label>
          <select
            name="prototype"
            value={formData.prototype}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select...</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>

        <FormField label="Prototype Proof Link" name="prototypeProof" value={formData.prototypeProof} onChange={handleChange} />
      </Modal>
    </div>
  );
};

export default PatentDevelopmentPage;