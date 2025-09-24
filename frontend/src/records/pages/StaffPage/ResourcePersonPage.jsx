import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import {
  getResourcePersonEntries,
  createResourcePersonEntry,
  updateResourcePersonEntry,
  deleteResourcePersonEntry
} from '../../services/api';
import toast from 'react-hot-toast';

const ResourcePersonPage = () => {
  const [entries, setEntries] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    programSpecification: '',
    title: '',
    venue: '',
    eventDate: '',
    proofLink: '',
    photoLink: ''
  });

  const fetchData = async () => {
    try {
      const response = await getResourcePersonEntries();
      setEntries(response.data);
    } catch (error) {
      toast.error('Failed to fetch entries');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (editingItem) {
      setFormData({
        programSpecification: editingItem.program_specification || '',
        title: editingItem.title || '',
        venue: editingItem.venue || '',
        eventDate: editingItem.event_date ? editingItem.event_date.split('T')[0] : '',
        proofLink: editingItem.proof_link || '',
        photoLink: editingItem.photo_link || ''
      });
    } else {
      setFormData({
        programSpecification: '',
        title: '',
        venue: '',
        eventDate: '',
        proofLink: '',
        photoLink: ''
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
      program_specification: formData.programSpecification.trim(),
      title: formData.title.trim(),
      venue: formData.venue.trim(),
      event_date: formData.eventDate,
      proof_link: formData.proofLink.trim(),
      photo_link: formData.photoLink.trim(),
      user_id: 1
    };

    try {
      if (editingItem) {
        await updateResourcePersonEntry(editingItem.id, payload);
        toast.success('Entry updated successfully');
      } else {
        await createResourcePersonEntry(payload);
        toast.success('Entry added successfully');
      }
      setModalOpen(false);
      setEditingItem(null);
      fetchData();
    } catch (error) {
      toast.error('Failed to save entry');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteResourcePersonEntry(id);
      toast.success('Entry deleted');
      fetchData();
    } catch (error) {
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

  // Format date function
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const columns = [
    { header: 'Program Specification', field: 'program_specification' },
    { header: 'Title', field: 'title' },
    { header: 'Venue', field: 'venue' },
    { 
      header: 'Date', 
      field: 'event_date',
      render: (row) => formatDate(row.event_date)
    },
    {
      header: 'Proof Link',
      field: 'proof_link',
      render: (row) => row.proof_link ? <a href={row.proof_link} className="text-blue-500" target="_blank" rel="noreferrer">View</a> : 'N/A'
    },
    {
      header: 'Photo Link',
      field: 'photo_link',
      render: (row) => row.photo_link ? <a href={row.photo_link} className="text-blue-500 " target="_blank" rel="noreferrer">View</a> : 'N/A'
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
        title={editingItem ? 'Edit Entry' : 'Add Resource Person Entry'}
        onSubmit={handleSubmit}
      >
        <FormField label="Program Specification" name="programSpecification" value={formData.programSpecification} onChange={handleChange} />
        <FormField label="Title" name="title" value={formData.title} onChange={handleChange} />
        <FormField label="Venue" name="venue" value={formData.venue} onChange={handleChange} />
        <FormField label="Date" name="eventDate" type="date" value={formData.eventDate} onChange={handleChange} />
        <FormField label="Proof Link" name="proofLink" value={formData.proofLink} onChange={handleChange} />
        <FormField label="Photo Link" name="photoLink" value={formData.photoLink} onChange={handleChange} />
      </Modal>
    </div>
  );
};

export default ResourcePersonPage;