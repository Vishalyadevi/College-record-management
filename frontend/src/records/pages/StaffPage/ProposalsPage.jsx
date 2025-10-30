import React, { useState, useEffect } from 'react';
import { Plus, DollarSign, Edit, Trash2, Eye, ExternalLink } from 'lucide-react';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import { 
  getProposals, createProposal, updateProposal, deleteProposal,
  getPaymentDetails, createPaymentDetail, updatePaymentDetail, deletePaymentDetail 
} from '../../services/api';
import toast from 'react-hot-toast';

const ProposalsPage = () => {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [currentProposal, setCurrentProposal] = useState(null);
  
  // Payment details states
  const [showAmountDetails, setShowAmountDetails] = useState(false);
  const [amountDetails, setAmountDetails] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [currentPaymentDetail, setCurrentPaymentDetail] = useState(null);
  const [isPaymentViewMode, setIsPaymentViewMode] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    pi_name: '',
    co_pi_names: '',
    project_title: '',
    industry: '',
    from_date: '',
    to_date: '',
    amount: '',
    proof: '',
    organization_name: ''
  });

  const [paymentFormData, setPaymentFormData] = useState({
    date: '',
    amount: ''
  });

  const fetchProposals = async () => {
    try {
      setLoading(true);
      const response = await getProposals();
      setProposals(response.data);
    } catch (error) {
      console.error('Error fetching proposals:', error);
      toast.error('Failed to load proposals');
    } finally {
      setLoading(false);
    }
  };

  const fetchAmountDetails = async (projectId) => {
    try {
      setPaymentLoading(true);
      const response = await getPaymentDetails(projectId);
      setAmountDetails(response.data);
    } catch (error) {
      console.error('Error fetching payment details:', error);
      toast.error('Failed to load payment details');
      setAmountDetails([]);
    } finally {
      setPaymentLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handlePaymentInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentFormData({
      ...paymentFormData,
      [name]: value
    });
  };

  const resetForm = () => {
    setFormData({
      pi_name: '',
      co_pi_names: '',
      project_title: '',
      industry: '',
      from_date: '',
      to_date: '',
      amount: '',
      proof: '',
      organization_name: ''
    });
    setCurrentProposal(null);
    setIsViewMode(false);
  };

  const resetPaymentForm = () => {
    setPaymentFormData({
      date: '',
      amount: ''
    });
    setCurrentPaymentDetail(null);
    setIsPaymentViewMode(false);
  };

  // Proposal handlers
  const handleAddNew = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleEdit = (proposal) => {
    setCurrentProposal(proposal);
    setFormData({
      pi_name: proposal.pi_name || '',
      co_pi_names: proposal.co_pi_names || '',
      project_title: proposal.project_title || '',
      industry: proposal.industry || '',
      from_date: proposal.from_date ? proposal.from_date.split('T')[0] : '',
      to_date: proposal.to_date ? proposal.to_date.split('T')[0] : '',
      amount: proposal.amount?.toString() || '',
      proof: proposal.proof || '',
      organization_name: proposal.organization_name || ''
    });
    setIsViewMode(false);
    setIsModalOpen(true);
  };

  const handleView = (proposal) => {
    setCurrentProposal(proposal);
    setFormData({
      pi_name: proposal.pi_name || '',
      co_pi_names: proposal.co_pi_names || '',
      project_title: proposal.project_title || '',
      industry: proposal.industry || '',
      from_date: proposal.from_date ? proposal.from_date.split('T')[0] : '',
      to_date: proposal.to_date ? proposal.to_date.split('T')[0] : '',
      amount: proposal.amount?.toString() || '',
      proof: proposal.proof || '',
      organization_name: proposal.organization_name || ''
    });
    setIsViewMode(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (proposal) => {
    if (window.confirm(`Are you sure you want to delete this proposal: ${proposal.project_title}?`)) {
      try {
        await deleteProposal(proposal.id);
        toast.success('Proposal deleted successfully');
        fetchProposals();
      } catch (error) {
        console.error('Error deleting proposal:', error);
        toast.error('Failed to delete proposal');
      }
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      if (!formData.pi_name || !formData.project_title || !formData.industry || 
          !formData.from_date || !formData.to_date || !formData.amount || !formData.organization_name) {
        toast.error('Please fill in all required fields');
        return;
      }
      
      if (currentProposal) {
        await updateProposal(currentProposal.id, formData);
        toast.success('Proposal updated successfully');
      } else {
        await createProposal(formData);
        toast.success('Proposal created successfully');
      }
      
      setIsModalOpen(false);
      resetForm();
      fetchProposals();
    } catch (error) {
      console.error('Error saving proposal:', error);
      toast.error('Failed to save proposal');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Payment details handlers
  const handleViewAmountDetails = (projectId) => {
    setSelectedProjectId(projectId);
    fetchAmountDetails(projectId);
    setShowAmountDetails(true);
  };

  const handleAddPaymentDetail = () => {
    resetPaymentForm();
    setIsPaymentModalOpen(true);
  };

  const handleEditPaymentDetail = (paymentDetail) => {
    setCurrentPaymentDetail(paymentDetail);
    setPaymentFormData({
      date: paymentDetail.date ? paymentDetail.date.split('T')[0] : '',
      amount: paymentDetail.amount?.toString() || ''
    });
    setIsPaymentViewMode(false);
    setIsPaymentModalOpen(true);
  };

  const handleViewPaymentDetail = (paymentDetail) => {
    setCurrentPaymentDetail(paymentDetail);
    setPaymentFormData({
      date: paymentDetail.date ? paymentDetail.date.split('T')[0] : '',
      amount: paymentDetail.amount?.toString() || ''
    });
    setIsPaymentViewMode(true);
    setIsPaymentModalOpen(true);
  };

  const handleDeletePaymentDetail = async (paymentDetail) => {
    if (window.confirm(`Are you sure you want to delete this payment of ₹${Number(paymentDetail.amount).toLocaleString()}?`)) {
      try {
        await deletePaymentDetail(paymentDetail.id);
        toast.success('Payment detail deleted successfully');
        fetchAmountDetails(selectedProjectId);
      } catch (error) {
        console.error('Error deleting payment detail:', error);
        toast.error('Failed to delete payment detail');
      }
    }
  };

  const handlePaymentSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      if (!paymentFormData.date || !paymentFormData.amount) {
        toast.error('Please fill in all required fields');
        return;
      }
      
      const paymentData = {
        ...paymentFormData,
        proposal_id: selectedProjectId
      };
      
      if (currentPaymentDetail) {
        await updatePaymentDetail(currentPaymentDetail.id, paymentData);
        toast.success('Payment detail updated successfully');
      } else {
        await createPaymentDetail(paymentData);
        toast.success('Payment detail created successfully');
      }
      
      setIsPaymentModalOpen(false);
      resetPaymentForm();
      fetchAmountDetails(selectedProjectId);
    } catch (error) {
      console.error('Error saving payment detail:', error);
      toast.error('Failed to save payment detail');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDuration = (fromDate, toDate) => {
    if (!fromDate || !toDate) return '';
    
    const from = new Date(fromDate);
    const to = new Date(toDate);
    
    return `${from.toLocaleDateString()} - ${to.toLocaleDateString()}`;
  };

  const renderProofLink = (proofUrl) => {
    if (!proofUrl) return <span className="text-gray-400">No proof</span>;
    
    const isValidUrl = proofUrl.startsWith('http://') || proofUrl.startsWith('https://');
    
    if (isValidUrl) {
      return (
        <a
          href={proofUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
          title="View proof document"
        >
          View
        </a>
      );
    } else {
      return (
        <span className="text-gray-600 text-sm" title={proofUrl}>
          {proofUrl.length > 20 ? `${proofUrl.substring(0, 20)}...` : proofUrl}
        </span>
      );
    }
  };

  const renderCoPiNames = (coPiNames) => {
    if (!coPiNames) return <span className="text-gray-400">None</span>;
    
    const names = coPiNames.split(',').map(name => name.trim()).filter(name => name);
    
    if (names.length === 0) return <span className="text-gray-400">None</span>;
    
    if (names.length === 1) return <span>{names[0]}</span>;
    
    return (
      <div className="text-sm">
        <span>{names[0]}</span>
        {names.length > 1 && (
          <span className="text-gray-500 ml-1" title={names.slice(1).join(', ')}>
            +{names.length - 1} more
          </span>
        )}
      </div>
    );
  };

  const columns = [
    { field: 'pi_name', header: 'PI Name' },
    { 
      field: 'co_pi_names', 
      header: 'Co-PI Names',
      render: (row) => renderCoPiNames(row.co_pi_names)
    },
    { field: 'project_title', header: 'Project Title' },
    { field: 'industry', header: 'Industry' },
    { 
      field: 'duration', 
      header: 'Duration', 
      render: (row) => formatDuration(row.from_date, row.to_date)
    },
    { 
      field: 'amount', 
      header: 'Amount (₹)', 
      render: (row) => (
        <div className="flex items-center gap-2">
          <span>₹{Number(row.amount).toLocaleString()}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleViewAmountDetails(row.id);
            }}
            className="text-blue-500 hover:text-blue-700 flex items-center"
            title="View Amount Details"
          >
            <DollarSign size={16} />
          </button>
        </div>
      )
    },
    { field: 'organization_name', header: 'Organization' },
    { 
      field: 'proof', 
      header: 'Proof Link',
      render: (row) => renderProofLink(row.proof)
    },
  ];

  const selectedProject = proposals.find(p => p.id === selectedProjectId);
  const totalPaidAmount = amountDetails.reduce((sum, detail) => sum + Number(detail.amount), 0);

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <button
          onClick={handleAddNew}
          className="btn flex items-center gap-2 text-white bg-gradient-to-r from-blue-600 to-purple-400 hover:from-blue-800 hover:to-purple-500 px-4 py-2 rounded-md shadow-md"
        >
          <Plus size={16} />
          Add New Consultancy
        </button>
      </div>

      <DataTable
        data={proposals}
        columns={columns}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={loading}
      />

      {showAmountDetails && selectedProject && (
        <div className="mt-8 border rounded-md p-4 bg-white shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold">
                Payment Details for: {selectedProject.project_title}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Total Project Amount: ₹{Number(selectedProject.amount).toLocaleString()} | 
                Total Paid: ₹{totalPaidAmount.toLocaleString()} | 
                Remaining: ₹{(Number(selectedProject.amount) - totalPaidAmount).toLocaleString()}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddPaymentDetail}
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-md flex items-center gap-2 text-sm"
              >
                <Plus size={14} />
                Add Payment
              </button>
              <button
                onClick={() => setShowAmountDetails(false)}
                className="text-gray-500 hover:text-gray-700 px-3 py-2"
              >
                Close
              </button>
            </div>
          </div>
          
          {paymentLoading ? (
            <div className="text-center py-4">Loading payment details...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount (₹)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {amountDetails.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="px-6 py-4 text-center text-gray-500">
                        No payment details found. Click "Add Payment" to create one.
                      </td>
                    </tr>
                  ) : (
                    amountDetails.map((detail) => (
                      <tr key={detail.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(detail.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          ₹{Number(detail.amount).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleViewPaymentDetail(detail)}
                              className="text-blue-600 hover:text-blue-900"
                              title="View"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => handleEditPaymentDetail(detail)}
                              className="text-yellow-600 hover:text-yellow-900"
                              title="Edit"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeletePaymentDetail(detail)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {amountDetails.length > 0 && (
                  <tfoot className="bg-gray-50">
                    <tr className="font-medium">
                      <td className="px-6 py-4 text-sm">Total Paid</td>
                      <td className="px-6 py-4 text-sm font-bold">
                        ₹{totalPaidAmount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm"></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </div>
      )}

      {/* Proposal Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isViewMode ? 'View Proposal' : currentProposal ? 'Edit Proposal' : 'Add New Proposal'}
        onSubmit={!isViewMode ? handleSubmit : null}
        isSubmitting={isSubmitting}
        size="lg"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="PI Name"
            name="pi_name"
            value={formData.pi_name}
            onChange={handleInputChange}
            required
            disabled={isViewMode}
          />
          <FormField
            label="Co-PI Names"
            name="co_pi_names"
            value={formData.co_pi_names}
            onChange={handleInputChange}
            disabled={isViewMode}
            placeholder="Separate with commas"
          />
          <FormField
            label="Project Title"
            name="project_title"
            value={formData.project_title}
            onChange={handleInputChange}
            required
            disabled={isViewMode}
          />
          <FormField
            label="Industry"
            name="industry"
            value={formData.industry}
            onChange={handleInputChange}
            required
            disabled={isViewMode}
          />
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
            label="Amount (₹)"
            name="amount"
            type="number"
            value={formData.amount}
            onChange={handleInputChange}
            required
            disabled={isViewMode}
          />
          <FormField
            label="Organization Name"
            name="organization_name"
            value={formData.organization_name}
            onChange={handleInputChange}
            required
            disabled={isViewMode}
          />
          <FormField
            label="Proof Link"
            name="proof"
            value={formData.proof}
            onChange={handleInputChange}
            disabled={isViewMode}
            placeholder="URL to document or proof"
            className="md:col-span-2"
          />
        </div>
      </Modal>

      {/* Payment Detail Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title={isPaymentViewMode ? 'View Payment Detail' : currentPaymentDetail ? 'Edit Payment Detail' : 'Add New Payment Detail'}
        onSubmit={!isPaymentViewMode ? handlePaymentSubmit : null}
        isSubmitting={isSubmitting}
        size="md"
      >
        <div className="grid grid-cols-1 gap-4">
          <FormField
            label="Date"
            name="date"
            type="date"
            value={paymentFormData.date}
            onChange={handlePaymentInputChange}
            required
            disabled={isPaymentViewMode}
          />
          <FormField
            label="Amount (₹)"
            name="amount"
            type="number"
            value={paymentFormData.amount}
            onChange={handlePaymentInputChange}
            required
            disabled={isPaymentViewMode}
            min="0"
            step="0.01"
          />
        </div>
      </Modal>
    </div>
  );
};

export default ProposalsPage;