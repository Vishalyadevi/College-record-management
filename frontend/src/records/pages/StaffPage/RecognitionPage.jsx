import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import {
  getRecognitionEntries,
  createRecognitionEntry,
  updateRecognitionEntry,
  deleteRecognitionEntry
} from '../../services/api';
import toast from 'react-hot-toast';

const RecognitionPage = () => {
  const [entries, setEntries] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    category: '',
    programName: '',
    recognitionDate: '',
    link: ''
  });

  const fetchData = async () => {
    try {
      const response = await getRecognitionEntries();
      setEntries(response.data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch recognition entries');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (editingItem) {
      const formattedDate = editingItem.recognition_date
        ? editingItem.recognition_date.split('T')[0]
        : '';
      setFormData({
        category: editingItem.category || '',
        programName: editingItem.program_name || '',
        recognitionDate: formattedDate,
        link: editingItem.proof_link || ''
      });
    } else {
      setFormData({
        category: '',
        programName: '',
        recognitionDate: '',
        link: ''
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
    const { category, programName, recognitionDate, link } = formData;

    if (!category.trim()) return toast.error('Category is required');
    if (!programName.trim()) return toast.error('Program Name is required');
    if (!recognitionDate.trim()) return toast.error('Date is required');

    const payload = {
      category: category.trim(),
      program_name: programName.trim(),
      recognition_date: recognitionDate, // must be yyyy-MM-dd
      proof_link: link.trim(),
      user_id: 1 // Update this to dynamic user_id if needed
    };

    try {
      if (editingItem) {
        await updateRecognitionEntry(editingItem.id, payload);
        toast.success('Recognition entry updated successfully');
      } else {
        await createRecognitionEntry(payload);
        toast.success('Recognition entry added successfully');
      }
      setModalOpen(false);
      fetchData();
      setEditingItem(null);
    } catch (error) {
      console.error('Submission error:', error);
      toast.error('Failed to save recognition entry');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteRecognitionEntry(id);
      toast.success('Recognition entry deleted');
      fetchData();
    } catch (error) {
      console.error('Deletion error:', error);
      toast.error('Failed to delete recognition entry');
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
    
    { header: 'Category', field: 'category' },
    { header: 'Program Name', field: 'program_name' },
    {
      header: 'Date',
      field: 'recognition_date',
      render: (row) => {
        const d = new Date(row.recognition_date);
        if (isNaN(d)) return row.recognition_date || 'N/A';
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}-${month}-${year}`;
      }
    },
    {
      header: 'Link',
      field: 'proof_link',
      render: (row) =>
        row.proof_link ? (
          <a href={row.proof_link} className="text-blue-500" target="_blank" rel="noreferrer">View</a>
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
            setModalOpen(true);
          }}
          className="btn flex items-center gap-2 text-white bg-gradient-to-r from-pink-500 to-purple-400 hover:from-pink-800 hover:to-purple-500 px-4 py-2 rounded-md shadow-md"
        >
          <Plus size={16} />
          Add new Entry
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
        title={editingItem ? 'Edit Entry' : 'Add Recognition Entry'}
        onSubmit={handleSubmit}
      >
        <FormField label="Category" name="category" value={formData.category} onChange={handleChange} />
        <FormField label="Program Name" name="programName" value={formData.programName} onChange={handleChange} />
        <FormField label="Date" name="recognitionDate" type="date" value={formData.recognitionDate} onChange={handleChange} />
        <FormField label="Link" name="link" value={formData.link} onChange={handleChange} />
      </Modal>
    </div>
  );
};

export default RecognitionPage;