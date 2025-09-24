import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from 'xlsx';
import Navbar from './navbar';

const AdminRecruiters = () => {
  const [companyData, setCompanyData] = useState({
    companyName: '',
    description: '',
    ceo: '',
    location: '',
    logo: null,
    skillSets: [],
    localBranches: [],
    roles: [],
    package: '',
    objective: ''
  });

  const navigate = useNavigate();
  const [companyLogos, setCompanyLogos] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingCompanyId, setEditingCompanyId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get user ID from localStorage
  const userId = localStorage.getItem('userId') || '1';

  // Fetch company data when the component mounts
  useEffect(() => {
    const fetchCompanyLogos = async () => {
      try {
        const response = await axios.get('http://localhost:4000/api/placement/companies');
        console.log('Fetched companies:', response.data);
        setCompanyLogos(response.data.companies || []);
      } catch (error) {
        console.error('Error fetching companies:', error.response ? error.response.data : error.message);
        setCompanyLogos([]);
      }
    };

    fetchCompanyLogos();
  }, []);

  // Handle text input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setCompanyData({ ...companyData, [name]: value });
  };

  // Handle file input change for the logo
  const handleFileChange = (e) => {
    setCompanyData({ ...companyData, logo: e.target.files[0] });
  };

  // Handle adding items to arrays (Skill Sets, Local Branches, Roles)
  const handleArrayChange = (field, e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const newValue = e.target.value.trim();

      if (newValue && !companyData[field].includes(newValue)) {
        setCompanyData((prevState) => ({
          ...prevState,
          [field]: [...prevState[field], newValue],
        }));
        e.target.value = "";
      }
    }
  };

  // Remove item from array
  const removeFromArray = (field, index) => {
    setCompanyData((prevState) => ({
      ...prevState,
      [field]: prevState[field].filter((_, i) => i !== index)
    }));
  };

  // Validate form data
  const validateForm = () => {
    const errors = [];
    
    if (!companyData.companyName.trim()) errors.push("Company Name");
    if (!companyData.description.trim()) errors.push("Description");
    if (!companyData.ceo.trim()) errors.push("CEO");
    if (!companyData.location.trim()) errors.push("Location");
    if (!companyData.package.trim()) errors.push("Package");
    if (!companyData.objective.trim()) errors.push("Objective");
    if (companyData.skillSets.length === 0) errors.push("At least one Skill Set");
    if (companyData.localBranches.length === 0) errors.push("At least one Local Branch");
    if (companyData.roles.length === 0) errors.push("At least one Role");
    
    if (!isEditing && !companyData.logo) errors.push("Logo");

    return errors;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      alert(`Please fill in the following required fields:\n• ${validationErrors.join('\n• ')}`);
      return;
    }

    const packageValue = parseFloat(companyData.package);
    if (isNaN(packageValue) || packageValue <= 0) {
      alert("Package must be a valid positive number");
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('companyName', companyData.companyName.trim());
    formData.append('description', companyData.description.trim());
    formData.append('ceo', companyData.ceo.trim());
    formData.append('location', companyData.location.trim());
    formData.append('package', packageValue.toString());
    formData.append('objective', companyData.objective.trim());
    formData.append('created_by', userId);

    if (companyData.logo) {
      formData.append('logo', companyData.logo);
    }

    formData.append('skillSets', JSON.stringify(companyData.skillSets));
    formData.append('localBranches', JSON.stringify(companyData.localBranches));
    formData.append('roles', JSON.stringify(companyData.roles));

    try {
      let response;
      if (isEditing) {
        formData.append('updated_by', userId);
        response = await axios.put(
          `http://localhost:4000/api/placement/company/${companyData.companyName}`, 
          formData,
          { 
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 30000
          }
        );
        
        alert("Company updated successfully!");
        setIsEditing(false);
        setEditingCompanyId(null);
      } else {
        response = await axios.post('http://localhost:4000/api/placement/add-company', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 30000
        });

        alert("Company added successfully!");
      }

      const companiesResponse = await axios.get('http://localhost:4000/api/placement/companies');
      setCompanyLogos(companiesResponse.data.companies || []);
      
      resetForm();
      setShowForm(false);

    } catch (error) {
      console.error("Error with company operation:", error);
      
      let errorMessage = `Error ${isEditing ? 'updating' : 'adding'} company: `;
      
      if (error.response) {
        errorMessage += error.response.data?.message || error.response.data || 'Server error';
        if (error.response.status === 409) {
          errorMessage = "Company already exists. Please use a different company name.";
        } else if (error.response.status === 400) {
          errorMessage += "\nPlease check all required fields are filled correctly.";
        }
      } else if (error.request) {
        errorMessage += "No response from server. Please check your connection.";
      } else {
        errorMessage += error.message;
      }
      
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form data
  const resetForm = () => {
    setCompanyData({
      companyName: '',
      description: '',
      ceo: '',
      location: '',
      package: '',
      objective: '',
      logo: null,
      skillSets: [],
      localBranches: [],
      roles: []
    });
    
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  // Toggle form visibility
  const toggleForm = () => {
    if (showForm) {
      resetForm();
      setIsEditing(false);
      setEditingCompanyId(null);
    }
    setShowForm(!showForm);
  };

  // Edit company
  const handleEdit = (company, e) => {
    e.preventDefault();
    
    try {
      setCompanyData({
        companyName: company.companyName || '',
        description: company.description || '',
        ceo: company.ceo || '',
        location: company.location || '',
        package: company.package || '',
        objective: company.objective || '',
        logo: null,
        skillSets: Array.isArray(company.skillSets) ? company.skillSets : 
                   (typeof company.skillSets === 'string' && company.skillSets ? 
                    JSON.parse(company.skillSets) : []),
        localBranches: Array.isArray(company.localBranches) ? company.localBranches : 
                       (typeof company.localBranches === 'string' && company.localBranches ? 
                        JSON.parse(company.localBranches) : []),
        roles: Array.isArray(company.roles) ? company.roles : 
               (typeof company.roles === 'string' && company.roles ? 
                JSON.parse(company.roles) : [])
      });
      
      setIsEditing(true);
      setEditingCompanyId(company.id);
      setShowForm(true);
    } catch (error) {
      console.error('Error parsing company data:', error);
      alert('Error loading company data for editing');
    }
  };

  // Delete company
  const handleDelete = async (companyId, e) => {
    e.preventDefault();
    
    const confirmDelete = window.confirm("Are you sure you want to delete this company? This action cannot be undone.");
    if (!confirmDelete) return;

    try {
      await axios.delete(`http://localhost:4000/api/placement/company/${companyId}`);
      setCompanyLogos(prev => prev.filter(company => company.id !== companyId));
      alert("Company deleted successfully.");
    } catch (error) {
      console.error("Error deleting company:", error.response?.data || error.message);
      alert("Error deleting company. Please try again.");
    }
  };

  // Download as Excel
  const handleDownloadExcel = () => {
    const data = companyLogos.map(company => ({
      'Company Name': company.companyName || '',
      'CEO': company.ceo || '',
      'Location': company.location || '',
      'Package (LPA)': company.package || '',
      'Description': company.description || '',
      'Objective': company.objective || '',
      'Skill Sets': Array.isArray(company.skillSets) ? company.skillSets.join(', ') : 
                    (typeof company.skillSets === 'string' && company.skillSets ? 
                     JSON.parse(company.skillSets).join(', ') : ''),
      'Local Branches': Array.isArray(company.localBranches) ? company.localBranches.join(', ') : 
                        (typeof company.localBranches === 'string' && company.localBranches ? 
                         JSON.parse(company.localBranches).join(', ') : ''),
      'Roles': Array.isArray(company.roles) ? company.roles.join(', ') : 
               (typeof company.roles === 'string' && company.roles ? 
                JSON.parse(company.roles).join(', ') : ''),
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Companies');
    XLSX.writeFile(workbook, 'Recruiters.xlsx');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <br></br>
      <br></br>
      <br></br>
  <div className="pt-[100px] container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold">Recruiters ({companyLogos.length})</h3>
          <div>

            <button 
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              onClick={handleDownloadExcel}
            >
              Download as Excel
            </button>
          </div>
        </div>

        {showForm && (
          <div className="bg-blue p-6 rounded shadow mb-6">
            <h2 className="text-xl font-semibold mb-4">{isEditing ? 'Edit Company' : 'Add New Recruiter'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input 
                  type="text" 
                  name="companyName" 
                  placeholder="Company Name *" 
                  value={companyData.companyName} 
                  onChange={handleChange}
                  disabled={isEditing}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              
              <div>
                <textarea 
                  name="description" 
                  placeholder="Company Description *" 
                  value={companyData.description} 
                  onChange={handleChange}
                  rows="3"
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              
              <div>
                <input 
                  type="text" 
                  name="ceo" 
                  placeholder="CEO Name *" 
                  value={companyData.ceo} 
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              
              <div>
                <input 
                  type="text" 
                  name="location" 
                  placeholder="Headquarters Location *" 
                  value={companyData.location} 
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              
              <div>
                <input 
                  type="number" 
                  step="0.01"
                  min="0"
                  name="package" 
                  placeholder="Package (LPA) *" 
                  value={companyData.package} 
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              
              <div>
                <textarea 
                  name="objective" 
                  placeholder="Company Objective/Mission *" 
                  value={companyData.objective} 
                  onChange={handleChange}
                  rows="3"
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              
              <div>
                <input 
                  type="file" 
                  name="logo" 
                  onChange={handleFileChange} 
                  accept="image/*"
                  className="w-full p-2 border rounded"
                  {...(!isEditing && { required: true })}
                />
                {!isEditing && <small className="text-gray-500">* Logo is required for new companies</small>}
              </div>

              <div>
                <label className="block font-medium">Skill Sets Required *</label>
                <input 
                  type="text" 
                  placeholder="Enter skill and press Enter to add" 
                  onKeyDown={(e) => handleArrayChange('skillSets', e)} 
                  className="w-full p-2 border rounded"
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {companyData.skillSets.map((skill, index) => (
                    <span key={index} className="bg-gray-200 px-2 py-1 rounded flex items-center">
                      {skill} 
                      <button 
                        type="button" 
                        onClick={() => removeFromArray('skillSets', index)}
                        className="ml-2 text-red-500"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                {companyData.skillSets.length === 0 && (
                  <small className="text-red-500">At least one skill is required</small>
                )}
              </div>

              <div>
                <label className="block font-medium">Local Branches *</label>
                <input 
                  type="text" 
                  placeholder="Enter branch location and press Enter to add" 
                  onKeyDown={(e) => handleArrayChange('localBranches', e)} 
                  className="w-full p-2 border rounded"
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {companyData.localBranches.map((branch, index) => (
                    <span key={index} className="bg-gray-200 px-2 py-1 rounded flex items-center">
                      {branch} 
                      <button 
                        type="button" 
                        onClick={() => removeFromArray('localBranches', index)}
                        className="ml-2 text-red-500"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                {companyData.localBranches.length === 0 && (
                  <small className="text-red-500">At least one branch is required</small>
                )}
              </div>

              <div>
                <label className="block font-medium">Available Roles *</label>
                <input 
                  type="text" 
                  placeholder="Enter role and press Enter to add" 
                  onKeyDown={(e) => handleArrayChange('roles', e)} 
                  className="w-full p-2 border rounded"
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {companyData.roles.map((role, index) => (
                    <span key={index} className="bg-gray-200 px-2 py-1 rounded flex items-center">
                      {role} 
                      <button 
                        type="button" 
                        onClick={() => removeFromArray('roles', index)}
                        className="ml-2 text-red-500"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                {companyData.roles.length === 0 && (
                  <small className="text-red-500">At least one role is required</small>
                )}
              </div>

              <div className="flex gap-2">
                <button 
                  type="submit" 
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Processing...' : (isEditing ? 'Update Company' : 'Add Company')}
                </button>
                
                {isEditing && (
                  <button 
                    type="button" 
                    onClick={() => {
                      resetForm();
                      setIsEditing(false);
                      setEditingCompanyId(null);
                      setShowForm(false);
                    }}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded shadow overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead className="bg-blue-600">
              <tr>
                <th className="px-4 py-2 text-left">Logo</th>
                <th className="px-4 py-2 text-left">Company Name</th>
                <th className="px-4 py-2 text-left">CEO</th>
                <th className="px-4 py-2 text-left">Location</th>
                <th className="px-4 py-2 text-left">Package (LPA)</th>
                <th className="px-4 py-2 text-left">Description</th>
                <th className="px-4 py-2 text-left">Objective</th>
                <th className="px-4 py-2 text-left">Skill Sets</th>
                <th className="px-4 py-2 text-left">Branches</th>
                <th className="px-4 py-2 text-left">Roles</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(companyLogos) && companyLogos.length > 0 ? (
                companyLogos.map((company, index) => (
                  company && company.companyName ? (
                    <tr key={company.id || index} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2">
                        {company.logo ? (
                          <img
                            src={`http://localhost:4000/Uploads/${company.logo}`}
                            alt={company.companyName}
                            className="w-12 h-12 object-contain"
                            onError={(e) => {
                              e.target.src = '/placeholder-logo.png';
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 flex items-center justify-center text-xl font-bold">
                            {company.companyName.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2">{company.companyName}</td>
                      <td className="px-4 py-2">{company.ceo}</td>
                      <td className="px-4 py-2">{company.location}</td>
                      <td className="px-4 py-2">{company.package}</td>
                      <td className="px-4 py-2">{company.description}</td>
                      <td className="px-4 py-2">{company.objective}</td>
                      <td className="px-4 py-2">
                        {(Array.isArray(company.skillSets) ? company.skillSets : 
                          (typeof company.skillSets === 'string' && company.skillSets ? 
                           JSON.parse(company.skillSets) : [])).join(', ')}
                      </td>
                      <td className="px-4 py-2">
                        {(Array.isArray(company.localBranches) ? company.localBranches : 
                          (typeof company.localBranches === 'string' && company.localBranches ? 
                           JSON.parse(company.localBranches) : [])).join(', ')}
                      </td>
                      <td className="px-4 py-2">
                        {(Array.isArray(company.roles) ? company.roles : 
                          (typeof company.roles === 'string' && company.roles ? 
                           JSON.parse(company.roles) : [])).join(', ')}
                      </td>
                      
                    </tr>
                  ) : null
                ))
              ) : (
                <tr>
                  <td colSpan="11" className="px-4 py-2 text-center">
                    No company recruiters available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminRecruiters;