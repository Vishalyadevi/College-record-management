import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

const EditCompany = () => {
  const { companyName } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [company, setCompany] = useState(location.state?.company || null);

  useEffect(() => {
    if (!company) {
      axios
        .get(`http://localhost:4000/api/placement/company/${encodeURIComponent(companyName)}`)
        .then((res) => setCompany(res.data))
        .catch((err) => console.error("Failed to fetch company", err));
    }
  }, [company, companyName]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCompany((prev) => ({ ...prev, [name]: value }));
  };

  const handleArrayChange = (e, key) => {
    const value = e.target.value;
    setCompany((prev) => ({
      ...prev,
      [key]: value.split(",").map((item) => item.trim()),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      await axios.put(
        `http://localhost:4000/api/placement/company/${companyName}`,
        company
      );
      console.log("Company updated successfully");
      navigate("/admin-recruiters");
    } catch (err) {
      console.error("Error updating company", err);
    }
  };
  
  
  if (!company) return <p>Loading...</p>;

  return (
    <>
    <button onClick={() => navigate(-1)} className="back-button">
        ← Back
      </button>
      
    <form onSubmit={handleSubmit}>
      <h2>Edit Company - {companyName}</h2>

      <label>Description:</label>
      <textarea name="description" value={company.description} onChange={handleChange} />

      <label>Objective:</label>
      <input type="text" name="objective" value={company.objective} onChange={handleChange} />

      <label>CEO:</label>
      <input type="text" name="ceo" value={company.ceo} onChange={handleChange} />

      <label>Location:</label>
      <input type="text" name="location" value={company.location} onChange={handleChange} />

      <label>Skill Sets (comma separated):</label>
      <input
        type="text"
        value={company.skillSets?.join(", ") || ""}
        onChange={(e) => handleArrayChange(e, "skillSets")}
      />

      <label>Local Branches (comma separated):</label>
      <input
        type="text"
        value={company.localBranches?.join(", ") || ""}
        onChange={(e) => handleArrayChange(e, "localBranches")}
      />

      <label>Roles (comma separated):</label>
      <input
        type="text"
        value={company.roles?.join(", ") || ""}
        onChange={(e) => handleArrayChange(e, "roles")}
      />

      <label>Package:</label>
      <input type="text" name="package" value={company.package} onChange={handleChange} />

      <button type="submit">Save Changes</button>
    </form>
    </>
    
  );
};

export default EditCompany;
