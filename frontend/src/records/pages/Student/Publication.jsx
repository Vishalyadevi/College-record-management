import React, { useState, useEffect } from "react";
import { FaPlus, FaEdit, FaTrash, FaLink, FaFilePdf, FaBook } from "react-icons/fa";
import { motion } from "framer-motion";
import { usePublication } from "../../contexts/PublicationContext";

const Publications = () => {
  const {
    publications,
    loading,
    error,
    fetchUserPublications,
    addPublication,
    updatePublication,
    deletePublication,
    clearError
  } = usePublication();

  const publicationTypes = [
    'Journal', 'Conference', 'Book', 'Book Chapter', 
    'Workshop', 'Thesis', 'Preprint', 'White Paper', 
    'Patent', 'Other'
  ];

  const indexTypes = [
    'Scopus', 'Web of Science', 'PubMed', 'IEEE Xplore', 
    'ACM Digital Library', 'SSRN', 'Not Indexed', 'Other'
  ];

  const publicationStatuses = [
    'Draft', 'Under Review', 'Accepted', 'Published', 
    'Rejected', 'Withdrawn'
  ];

  const [formData, setFormData] = useState({
    publication_type: 'Journal',
    publication_name: '',
    title: '',
    authors: '',
    index_type: 'Not Indexed',
    doi: '',
    publisher: '',
    page_no: '',
    publication_date: '',
    impact_factor: '',
    publication_link: '',
    pdf_link: '',
    preprint_link: '',
    publication_status: 'Draft',
    abstract: '',
    keywords: '',
    volume: '',
    issue: '',
    journal_abbreviation: '',
    issn: '',
    isbn: '',
    contribution_description: '',
    corresponding_author: false,
    first_author: false,
  });

  const [editingId, setEditingId] = useState(null);
  const [localLoading, setLocalLoading] = useState(false);
  const [showFullForm, setShowFullForm] = useState(false);
  const userId = parseInt(localStorage.getItem("userId"));

  useEffect(() => {
    if (userId) {
      fetchUserPublications(userId);
    }
  }, [userId, fetchUserPublications]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    setLocalLoading(true);
    
    try {
      const data = {
        Userid: userId,
        publication_type: formData.publication_type,
        publication_name: formData.publication_name || null,
        title: formData.title,
        authors: formData.authors ? JSON.parse(`["${formData.authors.split(',').map(a => a.trim()).join('","')}"]`) : [],
        index_type: formData.index_type,
        doi: formData.doi || null,
        publisher: formData.publisher || null,
        page_no: formData.page_no || null,
        publication_date: formData.publication_date || null,
        impact_factor: formData.impact_factor ? parseFloat(formData.impact_factor) : null,
        publication_link: formData.publication_link || null,
        pdf_link: formData.pdf_link || null,
        preprint_link: formData.preprint_link || null,
        publication_status: formData.publication_status,
        abstract: formData.abstract || null,
        keywords: formData.keywords ? JSON.parse(`["${formData.keywords.split(',').map(k => k.trim()).join('","')}"]`) : [],
        volume: formData.volume || null,
        issue: formData.issue || null,
        journal_abbreviation: formData.journal_abbreviation || null,
        issn: formData.issn || null,
        isbn: formData.isbn || null,
        contribution_description: formData.contribution_description || null,
        corresponding_author: formData.corresponding_author,
        first_author: formData.first_author,
      };

      if (editingId) {
        await updatePublication(editingId, data);
      } else {
        await addPublication(data);
      }

      await fetchUserPublications(userId);
      resetForm();
    } catch (err) {
      console.error("Error submitting publication:", err);
    } finally {
      setLocalLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      publication_type: 'Journal',
      publication_name: '',
      title: '',
      authors: '',
      index_type: 'Not Indexed',
      doi: '',
      publisher: '',
      page_no: '',
      publication_date: '',
      impact_factor: '',
      publication_link: '',
      pdf_link: '',
      preprint_link: '',
      publication_status: 'Draft',
      abstract: '',
      keywords: '',
      volume: '',
      issue: '',
      journal_abbreviation: '',
      issn: '',
      isbn: '',
      contribution_description: '',
      corresponding_author: false,
      first_author: false,
    });
    setEditingId(null);
    setShowFullForm(false);
  };

  const handleEdit = (publication) => {
    setFormData({
      publication_type: publication.publication_type,
      publication_name: publication.publication_name || '',
      title: publication.title,
      authors: Array.isArray(publication.authors) ? publication.authors.join(', ') : '',
      index_type: publication.index_type || 'Not Indexed',
      doi: publication.doi || '',
      publisher: publication.publisher || '',
      page_no: publication.page_no || '',
      publication_date: publication.publication_date ? publication.publication_date.split('T')[0] : '',
      impact_factor: publication.impact_factor || '',
      publication_link: publication.publication_link || '',
      pdf_link: publication.pdf_link || '',
      preprint_link: publication.preprint_link || '',
      publication_status: publication.publication_status,
      abstract: publication.abstract || '',
      keywords: Array.isArray(publication.keywords) ? publication.keywords.join(', ') : '',
      volume: publication.volume || '',
      issue: publication.issue || '',
      journal_abbreviation: publication.journal_abbreviation || '',
      issn: publication.issn || '',
      isbn: publication.isbn || '',
      contribution_description: publication.contribution_description || '',
      corresponding_author: publication.corresponding_author || false,
      first_author: publication.first_author || false,
    });
    setEditingId(publication.id);
    setShowFullForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this publication?")) {
      try {
        await deletePublication(id, userId);
        await fetchUserPublications(userId);
      } catch (err) {
        console.error("Error deleting publication:", err);
      }
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case "Published": return "bg-green-100 text-green-800";
      case "Accepted": return "bg-blue-100 text-blue-800";
      case "Under Review": return "bg-yellow-100 text-yellow-800";
      case "Draft": return "bg-gray-100 text-gray-800";
      case "Rejected": return "bg-red-100 text-red-800";
      case "Withdrawn": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getVerificationStatusColor = (pending, verified) => {
    if (verified) return "bg-green-100 text-green-800";
    if (pending) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow-md w-full min-h-screen">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        Research Publications
      </h2>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {(loading || localLoading) && (
        <div className="mb-4 p-4 bg-blue-100 text-blue-700 rounded-lg text-center">
          Loading...
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full p-6 bg-white rounded-lg shadow-lg mb-6"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800">
            {editingId ? "Edit Publication" : "Add Publication"}
          </h3>
          <button
            type="button"
            onClick={() => setShowFullForm(!showFullForm)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            {showFullForm ? "Show Less" : "Show All Fields"}
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          {/* Basic Required Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 font-medium mb-1">Publication Type *</label>
              <select
                name="publication_type"
                value={formData.publication_type}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {publicationTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Publication Title"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">Publication Status</label>
              <select
                name="publication_status"
                value={formData.publication_status}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {publicationStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">Publication Name</label>
              <input
                type="text"
                name="publication_name"
                value={formData.publication_name}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Journal/Conference Name"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">Authors (comma-separated)</label>
              <input
                type="text"
                name="authors"
                value={formData.authors}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="John Doe, Jane Smith"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">Publication Date</label>
              <input
                type="date"
                name="publication_date"
                value={formData.publication_date}
                onChange={handleInputChange}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Extended Fields - Show when toggled */}
          {showFullForm && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Index Type</label>
                  <select
                    name="index_type"
                    value={formData.index_type}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {indexTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-1">DOI</label>
                  <input
                    type="text"
                    name="doi"
                    value={formData.doi}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="10.1000/xyz123"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-1">Publisher</label>
                  <input
                    type="text"
                    name="publisher"
                    value={formData.publisher}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Publisher Name"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-1">Page Numbers</label>
                  <input
                    type="text"
                    name="page_no"
                    value={formData.page_no}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="1-10"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-1">Impact Factor</label>
                  <input
                    type="number"
                    step="0.0001"
                    name="impact_factor"
                    value={formData.impact_factor}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="2.5"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-1">Volume</label>
                  <input
                    type="text"
                    name="volume"
                    value={formData.volume}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Volume"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-1">Issue</label>
                  <input
                    type="text"
                    name="issue"
                    value={formData.issue}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Issue"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-1">ISSN</label>
                  <input
                    type="text"
                    name="issn"
                    value={formData.issn}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="ISSN"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-1">ISBN</label>
                  <input
                    type="text"
                    name="isbn"
                    value={formData.isbn}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="ISBN"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-1">Publication Link</label>
                  <input
                    type="url"
                    name="publication_link"
                    value={formData.publication_link}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-1">PDF Link</label>
                  <input
                    type="url"
                    name="pdf_link"
                    value={formData.pdf_link}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-1">Preprint Link</label>
                  <input
                    type="url"
                    name="preprint_link"
                    value={formData.preprint_link}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-1">Journal Abbreviation</label>
                  <input
                    type="text"
                    name="journal_abbreviation"
                    value={formData.journal_abbreviation}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="J. Abbrev."
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-1">Keywords (comma-separated)</label>
                  <input
                    type="text"
                    name="keywords"
                    value={formData.keywords}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="AI, Machine Learning"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 mb-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Abstract</label>
                  <textarea
                    name="abstract"
                    value={formData.abstract}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="Publication abstract..."
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-1">Your Contribution</label>
                  <textarea
                    name="contribution_description"
                    value={formData.contribution_description}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="2"
                    placeholder="Describe your contribution..."
                  />
                </div>
              </div>

              <div className="flex gap-6 mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="first_author"
                    checked={formData.first_author}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <span className="text-gray-700">First Author</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="corresponding_author"
                    checked={formData.corresponding_author}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <span className="text-gray-700">Corresponding Author</span>
                </label>
              </div>
            </>
          )}

          <div className="flex justify-center space-x-4 mt-6">
            {editingId && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={resetForm}
                className="px-6 py-2 bg-gray-500 text-white rounded-lg shadow-md hover:shadow-lg transition"
              >
                Cancel
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg shadow-md hover:shadow-lg transition"
              disabled={loading || localLoading}
            >
              {localLoading ? "Processing..." : editingId ? "Update Publication" : "Add Publication"}
            </motion.button>
          </div>
        </form>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full p-6 bg-white rounded-lg shadow-lg"
      >
        <h3 className="text-xl font-semibold text-gray-800 mb-4">My Publications</h3>
        {publications.length === 0 && !loading ? (
          <p className="text-gray-500">No publications available.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <tr>
                  <th className="border border-gray-300 p-3 text-left">Title</th>
                  <th className="border border-gray-300 p-3 text-left">Type</th>
                  <th className="border border-gray-300 p-3 text-left">Authors</th>
                  <th className="border border-gray-300 p-3 text-left">Status</th>
                  <th className="border border-gray-300 p-3 text-left">Index</th>
                  <th className="border border-gray-300 p-3 text-left">Date</th>
                  <th className="border border-gray-300 p-3 text-left">Impact</th>
                  <th className="border border-gray-300 p-3 text-left">Links</th>
                  <th className="border border-gray-300 p-3 text-left">Verification</th>
                  <th className="border border-gray-300 p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {publications.map((publication) => (
                  <tr key={publication.id} className="bg-white hover:bg-gray-50 transition">
                    <td className="border border-gray-300 p-3">
                      <div className="font-medium text-gray-900">{publication.title}</div>
                      {publication.publication_name && (
                        <div className="text-sm text-gray-600 mt-1">{publication.publication_name}</div>
                      )}
                    </td>
                    <td className="border border-gray-300 p-3">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                        {publication.publication_type}
                      </span>
                    </td>
                    <td className="border border-gray-300 p-3">
                      <div className="text-sm">
                        {Array.isArray(publication.authors) && publication.authors.length > 0
                          ? publication.authors.slice(0, 2).join(", ") + 
                            (publication.authors.length > 2 ? "..." : "")
                          : "N/A"}
                      </div>
                      <div className="flex gap-1 mt-1">
                        {publication.first_author && (
                          <span className="px-1 py-0.5 bg-green-100 text-green-700 rounded text-xs">1st</span>
                        )}
                        {publication.corresponding_author && (
                          <span className="px-1 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">Corr</span>
                        )}
                      </div>
                    </td>
                    <td className="border border-gray-300 p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(publication.publication_status)}`}>
                        {publication.publication_status}
                      </span>
                    </td>
                    <td className="border border-gray-300 p-3 text-sm">
                      {publication.index_type || "Not Indexed"}
                    </td>
                    <td className="border border-gray-300 p-3 text-sm">
                      {publication.publication_date
                        ? new Date(publication.publication_date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })
                        : "N/A"}
                    </td>
                    <td className="border border-gray-300 p-3 text-sm">
                      {publication.impact_factor ? (
                        <span className="font-semibold text-blue-600">
                          {parseFloat(publication.impact_factor).toFixed(2)}
                        </span>
                      ) : (
                        "N/A"
                      )}
                    </td>
                    <td className="border border-gray-300 p-3">
                      <div className="flex gap-2">
                        {publication.publication_link && (
                          <a
                            href={publication.publication_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 transition"
                            title="Publication Link"
                          >
                            <FaLink className="text-lg" />
                          </a>
                        )}
                        {publication.pdf_link && (
                          <a
                            href={publication.pdf_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-red-600 hover:text-red-800 transition"
                            title="PDF Link"
                          >
                            <FaFilePdf className="text-lg" />
                          </a>
                        )}
                        {publication.preprint_link && (
                          <a
                            href={publication.preprint_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 hover:text-green-800 transition"
                            title="Preprint Link"
                          >
                            <FaBook className="text-lg" />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="border border-gray-300 p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getVerificationStatusColor(
                        publication.pending,
                        publication.tutor_verification_status
                      )}`}>
                        {publication.tutor_verification_status
                          ? "Verified"
                          : publication.pending
                          ? "Pending"
                          : "Not Verified"}
                      </span>
                      {publication.verification_comments && (
                        <div className="text-xs text-gray-600 mt-1" title={publication.verification_comments}>
                          {publication.verification_comments.substring(0, 30)}...
                        </div>
                      )}
                    </td>
                    <td className="border border-gray-300 p-3">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleEdit(publication)}
                          className={`p-1 ${publication.pending ? 
                            "text-blue-600 hover:text-blue-800" : 
                            "text-gray-400 cursor-not-allowed"} transition`}
                          title={publication.pending ? "Edit" : "Cannot edit verified publications"}
                          disabled={!publication.pending}
                        >
                          <FaEdit />
                        </button>
                        <button 
                          onClick={() => handleDelete(publication.id)}
                          className={`p-1 ${publication.pending ? 
                            "text-red-600 hover:text-red-800" : 
                            "text-gray-400 cursor-not-allowed"} transition`}
                          title={publication.pending ? "Delete" : "Cannot delete verified publications"}
                          disabled={!publication.pending}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Publications;