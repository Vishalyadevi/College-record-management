import { useState, useEffect } from "react";
import axios from "axios";
import { FaEdit, FaSave, FaTimes, FaPlus, FaTrash } from "react-icons/fa";
import { motion } from "framer-motion";

const StudentPersonalDetails = () => {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [activeTab, setActiveTab] = useState("personal");
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    fetchStudentDetails();
  }, []);

  const fetchStudentDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      if (!token) {
        setError("No authentication token found. Please log in.");
        setLoading(false);
        return;
      }

      const response = await axios.get("http://localhost:4000/api/student", {
        headers: { Authorization: `Bearer ${token}` }
      });

      setStudent(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching student details:", err);
      setError(err.response?.data?.message || "Failed to load student details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (student) {
      setFormData({
        regno: student?.regno || "",
        username: student?.studentUser?.username || "",
        email: student?.studentUser?.email || "",
        batch: student?.batch || "",
        Semester: student?.Semester || "",
        section: student?.section || "",
        tutorEmail: student?.tutorEmail || "",
        staffname: student?.staffAdvisor?.username || "",
        deptname: student?.studentUser?.Department?.Deptname || "",
        date_of_birth: student?.date_of_birth 
          ? new Date(student.date_of_birth).toISOString().split("T")[0] 
          : "",
        personal_email: student?.personal_email || "",
        personal_phone: student?.personal_phone || "",
        aadhar_card_no: student?.aadhar_card_no || "",
        mother_tongue: student?.mother_tongue || "",
        caste: student?.caste || "",
        city: student?.city || "",
        address: student?.address || "",
        pincode: student?.pincode || "",
        first_graduate: student?.first_graduate || "No",
        blood_group: student?.blood_group || "O+",
        student_type: student?.student_type || "Day-Scholar",
        religion: student?.religion || "Hindu",
        community: student?.community || "OBC",
        gender: student?.gender || "Male",
        seat_type: student?.seat_type || "Counselling",
        bank_name: student?.studentUser?.bankDetails?.bank_name || "",
        branch_name: student?.studentUser?.bankDetails?.branch_name || "",
        bank_address: student?.studentUser?.bankDetails?.address || "",
        account_type: student?.studentUser?.bankDetails?.account_type || "Savings",
        account_no: student?.studentUser?.bankDetails?.account_no || "",
        ifsc_code: student?.studentUser?.bankDetails?.ifsc_code || "",
        micr_code: student?.studentUser?.bankDetails?.micr_code || "",
        relations: student?.studentUser?.relationDetails?.map((relation) => ({
          relationship: relation?.relationship || "",
          name: relation?.relation_name || "",
          age: relation?.relation_age || "",
          occupation: relation?.relation_occupation || "",
          income: relation?.relation_income || "",
          phone: relation?.relation_phone || "",
          email: relation?.relation_email || "",
          photo: relation?.relation_photo || ""
        })) || []
      });
    }
  }, [student]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRelationChange = (index, field, value) => {
    setFormData(prev => {
      const updatedRelations = [...prev.relations];
      updatedRelations[index] = { ...updatedRelations[index], [field]: value };
      return { ...prev, relations: updatedRelations };
    });
  };

  const handleAddRelation = () => {
    setFormData(prev => ({
      ...prev,
      relations: [
        ...prev.relations,
        {
          relationship: "",
          name: "",
          age: "",
          occupation: "",
          income: "",
          phone: "",
          email: ""
        }
      ]
    }));
  };

  const handleRemoveRelation = (index) => {
    setFormData(prev => ({
      ...prev,
      relations: prev.relations.filter((_, i) => i !== index)
    }));
  };

  const handleSaveClick = async () => {
    try {
      setSaveLoading(true);
      const token = localStorage.getItem("token");
      
      if (!token) {
        setError("No authentication token found.");
        return;
      }

      // Prepare data for backend
      const updateData = {
        username: formData.username,
        email: formData.email,
        batch: formData.batch,
        Semester: formData.Semester,
        section: formData.section,
        tutorEmail: formData.tutorEmail,
        date_of_birth: formData.date_of_birth,
        personal_email: formData.personal_email,
        personal_phone: formData.personal_phone,
        aadhar_card_no: formData.aadhar_card_no,
        mother_tongue: formData.mother_tongue,
        caste: formData.caste,
        city: formData.city,
        address: formData.address,
        pincode: formData.pincode,
        first_graduate: formData.first_graduate,
        blood_group: formData.blood_group,
        student_type: formData.student_type,
        religion: formData.religion,
        community: formData.community,
        gender: formData.gender,
        seat_type: formData.seat_type,
        bank_name: formData.bank_name,
        branch_name: formData.branch_name,
        bank_address: formData.bank_address,
        account_type: formData.account_type,
        account_no: formData.account_no,
        ifsc_code: formData.ifsc_code,
        micr_code: formData.micr_code,
        relations: formData.relations.map(rel => ({
          relationship: rel.relationship,
          name: rel.name,
          age: rel.age || null,
          occupation: rel.occupation || null,
          income: rel.income || "0",
          phone: rel.phone || null,
          email: rel.email || null
        }))
      };

      await axios.put(
        "http://localhost:4000/api/student/update",
        updateData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Refresh data
      await fetchStudentDetails();
      setIsEditing(false);
      setError(null);
      alert("Details updated successfully!");
    } catch (error) {
      console.error("Error updating details:", error);
      setError(error.response?.data?.message || "Failed to update details");
      alert("Failed to update details. Please try again.");
    } finally {
      setSaveLoading(false);
    }
  };

  const renderPersonalDetails = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {/* Read-only fields */}
      {[
        { label: "Registration No", name: "regno", readOnly: true },
        { label: "Username", name: "username", readOnly: true },
        { label: "Email", name: "email", readOnly: true },
        { label: "Department", name: "deptname", readOnly: true },
        { label: "Tutor Name", name: "staffname", readOnly: true }
      ].map((field, index) => (
        <div key={index} className="flex flex-col">
          <label className="text-sm font-medium text-gray-600 mb-1">{field.label}</label>
          <input
            type="text"
            name={field.name}
            value={formData[field.name] || ""}
            readOnly
            className="border rounded px-3 py-2 bg-gray-100 border-gray-300"
          />
        </div>
      ))}

      {/* Editable text fields */}
      {[
        { label: "Batch", name: "batch" },
        { label: "Semester", name: "Semester" },
        { label: "Section", name: "section" },
        { label: "Tutor Email", name: "tutorEmail" },
        { label: "Personal Email", name: "personal_email" },
        { label: "Phone", name: "personal_phone" },
        { label: "Aadhar Card No", name: "aadhar_card_no" },
        { label: "Mother Tongue", name: "mother_tongue" },
        { label: "Caste", name: "caste" },
        { label: "City", name: "city" },
        { label: "Pincode", name: "pincode" }
      ].map((field, index) => (
        <div key={index} className="flex flex-col">
          <label className="text-sm font-medium text-gray-600 mb-1">{field.label}</label>
          <input
            type="text"
            name={field.name}
            value={formData[field.name] || ""}
            onChange={handleInputChange}
            readOnly={!isEditing}
            className={`border rounded px-3 py-2 ${
              isEditing ? "bg-white border-blue-400" : "bg-gray-100 border-gray-300"
            }`}
          />
        </div>
      ))}

      {/* Address - full width */}
      <div className="flex flex-col md:col-span-3">
        <label className="text-sm font-medium text-gray-600 mb-1">Address</label>
        <textarea
          name="address"
          value={formData.address || ""}
          onChange={handleInputChange}
          readOnly={!isEditing}
          rows={2}
          className={`border rounded px-3 py-2 ${
            isEditing ? "bg-white border-blue-400" : "bg-gray-100 border-gray-300"
          }`}
        />
      </div>

      {/* Date of Birth */}
      <div className="flex flex-col">
        <label className="text-sm font-medium text-gray-600 mb-1">Date of Birth</label>
        {!isEditing ? (
          <div className="border rounded px-3 py-2 bg-gray-100">
            {formData.date_of_birth || "N/A"}
          </div>
        ) : (
          <input
            type="date"
            name="date_of_birth"
            value={formData.date_of_birth || ""}
            onChange={handleInputChange}
            className="border rounded px-3 py-2 bg-white border-blue-400"
          />
        )}
      </div>

      {/* Dropdown fields */}
      {[
        { label: "First Graduate", name: "first_graduate", options: ["Yes", "No"] },
        { label: "Blood Group", name: "blood_group", options: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"] },
        { label: "Student Type", name: "student_type", options: ["Day-Scholar", "Hosteller"] },
        { label: "Religion", name: "religion", options: ["Hindu", "Muslim", "Christian", "Others"] },
        { label: "Community", name: "community", options: ["General", "OBC", "SC", "ST", "Others"] },
        { label: "Gender", name: "gender", options: ["Male", "Female", "Transgender"] },
        { label: "Seat Type", name: "seat_type", options: ["Counselling", "Management"] }
      ].map((field, index) => (
        <div key={index} className="flex flex-col">
          <label className="text-sm font-medium text-gray-600 mb-1">{field.label}</label>
          {!isEditing ? (
            <div className="border rounded px-3 py-2 bg-gray-100">
              {formData[field.name]}
            </div>
          ) : (
            <select
              name={field.name}
              value={formData[field.name]}
              onChange={handleInputChange}
              className="border rounded px-3 py-2 bg-white border-blue-400"
            >
              {field.options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          )}
        </div>
      ))}
    </div>
  );

  const renderFamilyDetails = () => (
    <div className="space-y-4">
      {formData.relations?.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No family details added yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <tr>
                <th className="border border-gray-300 p-3 text-left">Relationship</th>
                <th className="border border-gray-300 p-3 text-left">Name</th>
                <th className="border border-gray-300 p-3 text-left">Age</th>
                <th className="border border-gray-300 p-3 text-left">Occupation</th>
                <th className="border border-gray-300 p-3 text-left">Income</th>
                <th className="border border-gray-300 p-3 text-left">Phone</th>
                <th className="border border-gray-300 p-3 text-left">Email</th>
                {isEditing && <th className="border border-gray-300 p-3 text-left">Action</th>}
              </tr>
            </thead>
            <tbody>
              {formData.relations.map((relation, index) => (
                <tr key={index} className="bg-white hover:bg-gray-50">
                  <td className="border border-gray-300 p-3">
                    {!isEditing ? (
                      <div>{relation.relationship || "-"}</div>
                    ) : (
                      <select
                        value={relation.relationship}
                        onChange={(e) => handleRelationChange(index, "relationship", e.target.value)}
                        className="w-full border rounded px-2 py-1 border-blue-400"
                      >
                        <option value="">Select</option>
                        <option value="Father">Father</option>
                        <option value="Mother">Mother</option>
                        <option value="Guardian">Guardian</option>
                        <option value="Sibling">Sibling</option>
                      </select>
                    )}
                  </td>
                  {["name", "age", "occupation", "income", "phone", "email"].map((field) => (
                    <td key={field} className="border border-gray-300 p-3">
                      <input
                        type="text"
                        value={relation[field] || ""}
                        onChange={(e) => handleRelationChange(index, field, e.target.value)}
                        readOnly={!isEditing}
                        placeholder={isEditing ? field.charAt(0).toUpperCase() + field.slice(1) : ""}
                        className={`w-full border rounded px-2 py-1 ${
                          isEditing ? "bg-white border-blue-400" : "bg-gray-100 border-gray-300"
                        }`}
                      />
                    </td>
                  ))}
                  {isEditing && (
                    <td className="border border-gray-300 p-3 text-center">
                      <button
                        onClick={() => handleRemoveRelation(index)}
                        className="text-red-600 hover:text-red-800"
                        title="Remove relation"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderBankDetails = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {[
        { label: "Bank Name", name: "bank_name" },
        { label: "Branch Name", name: "branch_name" },
        { label: "Account Number", name: "account_no" },
        { label: "IFSC Code", name: "ifsc_code" },
        { label: "MICR Code", name: "micr_code" }
      ].map((field, index) => (
        <div key={index} className="flex flex-col">
          <label className="text-sm font-medium text-gray-600 mb-1">{field.label}</label>
          <input
            type="text"
            name={field.name}
            value={formData[field.name] || ""}
            onChange={handleInputChange}
            readOnly={!i  sEditing}
            className={`border rounded px-3 py-2 ${
              isEditing ? "bg-white border-blue-400" : "bg-gray-100 border-gray-300"
            }`}
          />
        </div>
      ))}

      <div className="flex flex-col md:col-span-3">
        <label className="text-sm font-medium text-gray-600 mb-1">Bank Address</label>
        <textarea
          name="bank_address"
          value={formData.bank_address || ""}
          onChange={handleInputChange}
          readOnly={!isEditing}
          rows={2}
          className={`border rounded px-3 py-2 ${
            isEditing ? "bg-white border-blue-400" : "bg-gray-100 border-gray-300"
          }`}
        />
      </div>

      <div className="flex flex-col">
        <label className="text-sm font-medium text-gray-600 mb-1">Account Type</label>
        {!isEditing ? (
          <div className="border rounded px-3 py-2 bg-gray-100">
            {formData.account_type}
          </div>
        ) : (
          <select
            name="account_type"
            value={formData.account_type || "Savings"}
            onChange={handleInputChange}
            className="border rounded px-3 py-2 bg-white border-blue-400"
          >
            <option value="Savings">Savings</option>
            <option value="Current">Current</option>
          </select>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading student details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-6 bg-red-50 rounded-lg">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchStudentDetails}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Student Personal Details
        </h2>

        {/* Action Buttons */}
        <div className="flex justify-end mb-6 gap-3">
          {!isEditing ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsEditing(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg shadow-md hover:shadow-lg flex items-center gap-2"
            >
              <FaEdit /> Edit
            </motion.button>
          ) : (
            <>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSaveClick}
                disabled={saveLoading}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg shadow-md hover:shadow-lg flex items-center gap-2 disabled:opacity-50"
              >
                <FaSave /> {saveLoading ? "Saving..." : "Save"}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setIsEditing(false);
                  setFormData({});
                  setTimeout(() => fetchStudentDetails(), 100);
                }}
                className="px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <FaTimes /> Cancel
              </motion.button>
              {activeTab === "family" && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAddRelation}
                  className="px-6 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-lg shadow-md hover:shadow-lg flex items-center gap-2"
                >
                  <FaPlus /> Add Relation
                </motion.button>
              )}
            </>
          )}
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-4 mb-6 flex-wrap">
          {[
            { id: "personal", label: "Personal Details" },
            { id: "family", label: "Family Details" },
            { id: "bank", label: "Bank Details" }
          ].map((tab) => (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-lg text-lg font-medium transition ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                  : "bg-white text-gray-700 hover:bg-gray-100 shadow"
              }`}
            >
              {tab.label}
            </motion.button>
          ))}
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-lg shadow-lg p-6"
        >
          {activeTab === "personal" && renderPersonalDetails()}
          {activeTab === "family" && renderFamilyDetails()}
          {activeTab === "bank" && renderBankDetails()}
        </motion.div>
      </div>
    </div>
  );
};

export default StudentPersonalDetails;