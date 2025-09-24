import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import { getBookChapters, createBookChapter, updateBookChapter, deleteBookChapter } from '../../services/api';
import toast from 'react-hot-toast';

const BookChaptersPage = () => {
  const [bookChapters, setBookChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [currentBookChapter, setCurrentBookChapter] = useState(null);
  
  const [formData, setFormData] = useState({
    publication_type: 'book_chapter',
    publication_name: '',
    publication_title: '',
    authors: '',
    index_type: '',
    doi: '',
    citations: '',
    publisher: '',
    page_no: '',
    publication_date: '',
    impact_factor: '',
    publication_link: ''
  });

  const fetchBookChapters = async () => {
    try {
      setLoading(true);
      const response = await getBookChapters();
      setBookChapters(response.data);
    } catch (error) {
      console.error('Error fetching book chapters:', error);
      toast.error('Failed to load book chapters');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookChapters();
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
      publication_type: 'book_chapter',
      publication_name: '',
      publication_title: '',
      authors: '',
      index_type: '',
      doi: '',
      citations: '',
      publisher: '',
      page_no: '',
      publication_date: '',
      impact_factor: '',
      publication_link: ''
    });
    setCurrentBookChapter(null);
    setIsViewMode(false);
  };

  const handleAddNew = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleEdit = (bookChapter) => {
    setCurrentBookChapter(bookChapter);
    setFormData({
      publication_type: bookChapter.publication_type || 'book_chapter',
      publication_name: bookChapter.publication_name || '',
      publication_title: bookChapter.publication_title || '',
      authors: bookChapter.authors || '',
      index_type: bookChapter.index_type || '',
      doi: bookChapter.doi || '',
      citations: bookChapter.citations?.toString() || '',
      publisher: bookChapter.publisher || '',
      page_no: bookChapter.page_no || '',
      publication_date: bookChapter.publication_date || '',
      impact_factor: bookChapter.impact_factor?.toString() || '',
      publication_link: bookChapter.publication_link || ''
    });
    setIsViewMode(false);
    setIsModalOpen(true);
  };

  const handleView = (bookChapter) => {
    setCurrentBookChapter(bookChapter);
    setFormData({
      publication_type: bookChapter.publication_type || 'book_chapter',
      publication_name: bookChapter.publication_name || '',
      publication_title: bookChapter.publication_title || '',
      authors: bookChapter.authors || '',
      index_type: bookChapter.index_type || '',
      doi: bookChapter.doi || '',
      citations: bookChapter.citations?.toString() || '',
      publisher: bookChapter.publisher || '',
      page_no: bookChapter.page_no || '',
      publication_date: bookChapter.publication_date || '',
      impact_factor: bookChapter.impact_factor?.toString() || '',
      publication_link: bookChapter.publication_link || ''
    });
    setIsViewMode(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (bookChapter) => {
    if (window.confirm(`Are you sure you want to delete this publication: ${bookChapter.publication_title}?`)) {
      try {
        await deleteBookChapter(bookChapter.id);
        toast.success('Publication deleted successfully');
        fetchBookChapters();
      } catch (error) {
        console.error('Error deleting publication:', error);
        toast.error('Failed to delete publication');
      }
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      // Validate required fields
      if (!formData.publication_name || !formData.publication_title || !formData.authors || !formData.index_type || !formData.publication_date) {
        toast.error('Please fill in all required fields');
        return;
      }
      
      if (currentBookChapter) {
        await updateBookChapter(currentBookChapter.id, formData);
        toast.success('Publication updated successfully');
      } else {
        await createBookChapter(formData);
        toast.success('Publication created successfully');
      }
      
      setIsModalOpen(false);
      resetForm();
      fetchBookChapters();
    } catch (error) {
      console.error('Error saving publication:', error);
      toast.error('Failed to save publication');
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

  // Custom renderer for publication link column
  const renderPublicationLink = (value) => {
    if (!value) return '-';
    return (
      <a 
        href={value} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="text-blue-600 hover:text-blue-800"
      >
        View
      </a>
    );
  };

  // Updated columns to match new publication attributes
  const columns = [
    { field: 'publication_type', header: 'Type' },
    { field: 'publication_name', header: 'Publication Name' },
    { field: 'publication_title', header: 'Title' },
    { field: 'authors', header: 'Authors' },
    { field: 'index_type', header: 'Index Type' },
    { 
      field: 'publication_date', 
      header: 'Date',
      render: (item) => formatDate(item.publication_date)
    },
    { field: 'publisher', header: 'Publisher' },
    { field: 'citations', header: 'Citations' },
    { field: 'impact_factor', header: 'Impact Factor' },
    { 
      field: 'publication_link', 
      header: 'Link',
      render: renderPublicationLink
    }
  ];

  const publicationTypes = [
    { value: 'journal', label: 'Journal Article' },
    { value: 'book_chapter', label: 'Book Chapter' },
    { value: 'conference', label: 'Conference Paper' }
  ];

  const indexTypes = [
    { value: 'Scopus', label: 'Scopus' },
    { value: 'SCI', label: 'SCI' },
    { value: 'SCIE', label: 'SCIE' },
    { value: 'SSCI', label: 'SSCI' },
    { value: 'A&HCI', label: 'A&HCI' },
    { value: 'ESCI', label: 'ESCI' },
    { value: 'UGC CARE', label: 'UGC CARE' },
    { value: 'Other', label: 'Other' }
  ];

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
       <button
          onClick={handleAddNew}
          className="btn flex items-center gap-2 text-white bg-gradient-to-r from-pink-500 to-purple-400 hover:from-pink-800 hover:to-purple-500 px-4 py-2 rounded-md shadow-md"
        >
          <Plus size={16} />
          Add New Publication
        </button>
      </div>

      <DataTable
        data={bookChapters}
        columns={columns}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={loading}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isViewMode ? 'View Publication' : currentBookChapter ? 'Edit Publication' : 'Add New Publication'}
        onSubmit={!isViewMode ? handleSubmit : null}
        isSubmitting={isSubmitting}
        size="lg"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Publication Type"
            name="publication_type"
            type="select"
            value={formData.publication_type}
            onChange={handleInputChange}
            required
            disabled={isViewMode}
            options={publicationTypes}
          />
          <FormField
            label="Publication Name"
            name="publication_name"
            value={formData.publication_name}
            onChange={handleInputChange}
            required
            disabled={isViewMode}
            placeholder="e.g., Journal name or Book name"
          />
          <FormField
            label="Publication Title"
            name="publication_title"
            value={formData.publication_title}
            onChange={handleInputChange}
            required
            disabled={isViewMode}
            placeholder="Title of the article/chapter"
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
            label="Index Type"
            name="index_type"
            type="select"
            value={formData.index_type}
            onChange={handleInputChange}
            required
            disabled={isViewMode}
            options={indexTypes}
          />
          <FormField
            label="Publication Date"
            name="publication_date"
            type="date"
            value={formData.publication_date}
            onChange={handleInputChange}
            required
            disabled={isViewMode}
          />
          <FormField
            label="Publisher"
            name="publisher"
            value={formData.publisher}
            onChange={handleInputChange}
            disabled={isViewMode}
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
          <FormField
            label="Impact Factor"
            name="impact_factor"
            type="number"
            step="0.001"
            value={formData.impact_factor}
            onChange={handleInputChange}
            disabled={isViewMode}
          />
          <FormField
            label="Publication Link"
            name="publication_link"
            type="url"
            value={formData.publication_link}
            onChange={handleInputChange}
            disabled={isViewMode}
            placeholder="https://..."
          />
        </div>
      </Modal>
    </div>
  );
};

export default BookChaptersPage;