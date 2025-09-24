import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import {
  getSeedMoneyEntries,
  createSeedMoneyEntry,
  updateSeedMoneyEntry,
  deleteSeedMoneyEntry
} from '../../services/api';
import toast from 'react-hot-toast';

const SeedMoneyPage = () => {
  const [entries, setEntries] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [formData, setFormData] = useState({
    projectTitle: '',
    duration: '',
    amount: '',
    outcomes: '',
    proofLink: ''
  });

  const fetchData = async () => {
    try {
      const response = await getSeedMoneyEntries();
      setEntries(response.data);
    } catch (error) {
      toast.error('Failed to fetch seed money entries');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (editingItem) {
      setFormData({
        projectTitle: editingItem.project_title || '',
        duration: editingItem.project_duration || '',
        amount: editingItem.amount || '',
        outcomes: editingItem.outcomes || '',
        proofLink: editingItem.proof_link || ''
      });
    } else {
      setFormData({
        projectTitle: '',
        duration: '',
        amount: '',
        outcomes: '',
        proofLink: ''
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
    if (isViewOnly) return; // prevent saving in view-only mode

    if (!formData.projectTitle.trim()) return toast.error('Project Title is required');
    if (!formData.duration.trim()) return toast.error('Duration is required');
    if (!formData.amount.trim()) return toast.error('Amount is required');
    if (!formData.outcomes.trim()) return toast.error('Outcomes are required');

    const payload = {
      project_title: formData.projectTitle.trim(),
      project_duration: formData.duration.trim(),
      amount: formData.amount.trim(),
      outcomes: formData.outcomes.trim(),
      proof_link: formData.proofLink.trim() || '',
      user_id: 1,  // Replace with dynamic user_id if needed
    };

    try {
      if (editingItem) {
        await updateSeedMoneyEntry(editingItem.id, payload);
        toast.success('Seed money entry updated successfully');
      } else {
        await createSeedMoneyEntry(payload);
        toast.success('Seed money entry added successfully');
      }
      setModalOpen(false);
      fetchData();
      setEditingItem(null);
    } catch (error) {
      toast.error('Failed to save seed money entry');
    }
  };

  const handleDelete = async (id) => {
    console.log('Deleting ID:', id);
    try {
      await deleteSeedMoneyEntry(id);
      toast.success('Seed Money entry deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete seed money entry');
    }
  };

  const handleView = (item) => {
    setEditingItem(item);
    setIsViewOnly(true);     // View-only mode
    setModalOpen(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setIsViewOnly(false);    // Editable mode
    setModalOpen(true);
  };

  const columns = [
    { header: 'Project Title', field: 'project_title' },
    { header: 'Duration', field: 'project_duration' },
    { header: 'Amount (Lacs)', field: 'amount' },
    { header: 'Outcomes', field: 'outcomes' },
    {
      header: 'Proof',
      field: 'proof_link',
      render: (row) =>
        row.proof_link ? (
          <a href={row.proof_link} className="text-blue-500 " target="_blank" rel="noreferrer">View</a>
        ) : (
          'N/A'
        ),
    },
  ];

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => {
            setEditingItem(null);
            setIsViewOnly(false); // Ensure editable mode
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
        title={editingItem ? (isViewOnly ? 'View Entry' : 'Edit Entry') : 'Add Seed Money Entry'}
        onSubmit={handleSubmit}
        disableSubmit={isViewOnly}
      >
        <FormField label="Project Title" name="projectTitle" value={formData.projectTitle} onChange={handleChange} readOnly={isViewOnly} />
        <FormField label="Duration" name="duration" value={formData.duration} onChange={handleChange} readOnly={isViewOnly} />
        <FormField label="Amount (Lacs)" name="amount" value={formData.amount} onChange={handleChange} readOnly={isViewOnly} />
        <FormField label="Outcomes" name="outcomes" value={formData.outcomes} onChange={handleChange} readOnly={isViewOnly} />
        <FormField label="Proof Link" name="proofLink" value={formData.proofLink} onChange={handleChange} readOnly={isViewOnly} />
      </Modal>
    </div>
  );
};

export default SeedMoneyPage;