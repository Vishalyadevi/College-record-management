import { useState, useEffect } from "react";
import axios from "axios";
import { FaEdit, FaSave, FaTimes, FaPlus } from "react-icons/fa";
import { motion } from "framer-motion";

const StudentPersonalDetails = () => {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [activeTab, setActiveTab] = useState("personal");

  useEffect(() => {
    const fetchStudentDetails = async () => {
      try {
        const token = localStorage.getItem("token");
        console.log(token);
        if (!token) {
          setError("No authentication token found.");
          setLoading(false);
          return;
        }

        const response = await axios.get("http://localhost:4000/api/student", {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log(response.data);
        setStudent(response.data);
      } catch (err) {
        setError("Failed to load student details");
      } finally {
        setLoading(false);
      }
    };

    fetchStudentDetails();
  }, []);

  useEffect(() => {
    if (student) {
      setFormData({
        regno: student?.regno || "",
        username: student?.studentUser?.username || "",
        email: student?.studentUser?.email || "",
        role: student?.studentUser?.role || "",
        status: student?.studentUser?.status || "",
        blood_group: student?.blood_group || "O+",
        date_of_birth: formData.date_of_birth? new Date(formData.date_of_birth).toISOString().split("T")[0]: null,

        batch: student?.batch || "",
        tutorEmail: student?.tutorEmail || "",
        personal_email: student?.personal_email || "",
        first_graduate: student?.first_graduate || "No",
        aadhar_card_no: student?.aadhar_card_no || "",
        student_type: student?.student_type || "Day-Scholar",
        mother_tongue: student?.mother_tongue || "",
        religion: student?.religion || "Hindu",
        caste: student?.caste || "",
        community: student?.community || "OBC",
        gender: student?.gender || "Female",
        seat_type: student?.seat_type || "Counselling",
        section: student?.section || "",
        pincode: student?.pincode || "",
        personal_phone: student?.personal_phone || "",
        deptid: student?.Deptid || "",
        deptname: student?.studentUser?.Department?.Deptname || "",
        course: "B.E",
        Semester: student?.Semester || "",
        staffid: student?.staffId || "",
        staffname: student?.staffAdvisor?.username || "",
        bank_name: student?.studentUser?.bankDetails?.bank_name || "",
        branch_name: student?.studentUser?.bankDetails?.branch_name || "",
        bank_address:student?.studentUser?.bankDetails?.address||"",
        account_type:student?.studentUser?.bankDetails?.account_type||"",
        account_no: student?.studentUser?.bankDetails?.account_no || "",
        ifsc_code: student?.studentUser?.bankDetails?.ifsc_code || "",
        micr_code: student?.studentUser?.bankDetails?.micr_code || "",
        relations: student?.studentUser?.relationDetails?.map((relation) => ({
          relationship: relation?.relationship,
          name: relation?.relation_name,
          age: relation?.relation_age,
          occupation: relation?.relation_occupation,
          income: relation?.relation_income,
          phone: relation?.relation_phone,
          email: relation?.relation_email,
          photo: relation?.relation_photo || "/uploads/default.jpg",
        })) || [],
      });
    }
  }, [student]);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelClick = () => {
    setIsEditing(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSaveClick = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No authentication token found.");
        return;
      }
  
      // Process relations to replace empty values with "nil" before saving
      const updatedRelations = formData.relations.map((relation) => ({
        ...relation,
        income: relation.income || "0", // Default to "0" if empty
        phone: relation.phone?.trim() || "", // Use ?. to avoid null errors
        email: relation.email?.trim() || "",
      }));
  
      const updatedData = {
        ...formData,
        relations: updatedRelations,
      };
  
      console.log("🛠 Data being sent to backend:", JSON.stringify(updatedData, null, 2));

  
      await axios.put("http://localhost:4000/api/student/update", updatedData, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      const response = await axios.get("http://localhost:4000/api/student", {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      console.log("Received data:", response.data);
      setStudent(null);
      setTimeout(() => setStudent(response.data), 10);
      setIsEditing(false);
    } catch (error) {
      console.error("❌ Update failed:", error.response?.data || error.message);
      setError(error.response?.data?.message || "Failed to update student details.");
    }
    
  };
  

  const handleAddRelation = () => {
    setFormData((prevState) => {
      const newRelations = [
        ...(prevState.relations || []),
        {
          relationship: "",
          name: "",
          age: "",
          occupation: "",
          income: "",
          phone: "",
          email: "",
        },
      ];
      console.log("Updated Relations:", newRelations);
      return { ...prevState, relations: newRelations };
    });
  };
  
  

  const handleRelationChange = (index, field, value) => {
    setFormData((prevState) => {
      const updatedRelations = prevState.relations.map((relation, i) =>
        i === index ? { ...relation, [field]: value } : relation
      );
      return { ...prevState, relations: updatedRelations };
    });
  };
  
  

  const renderPersonalDetails = () => (
    <form className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {[
        { label: "Reg No", name: "regno" },
        { label: "Username", name: "username" },
        { label: "Email", name: "email" },
        {label: "Course", name: "course" },
        { label: "Department Name", name: "deptname" },
        { label: "Batch", name: "batch" },
        { label: "Semester", name: "Semester" },
        { label: "Section", name: "section" },
        { label: "Tutor Name", name: "staffname" },
        { label: "Tutor Email", name: "tutorEmail" },
      ].map((field, index) => (
        <div key={index} className="flex flex-col">
          <label className="text-sm font-medium text-gray-600">{field.label}</label>
          <input
            type="text"
            name={field.name}
            value={formData[field.name] || ""}
            onChange={handleInputChange}
            readOnly={!isEditing}
            className={`border rounded px-3 py-2 ${isEditing ? "bg-white border-gray-400" : "bg-gray-100 border-gray-300"}`}
          />
        </div>
      ))}

<div className="flex flex-col">
  <label className="text-sm font-medium text-gray-600">Date of Birth</label>

  {!isEditing ? (
    // Display as plain text when not editing
    <div className="border rounded px-3 py-2 bg-gray-100">
      {formData.date_of_birth || "N/A"}
    </div>
  ) : (
    // Display as date input when editing
    <input
      type="date"
      name="date_of_birth"
      value={formData.date_of_birth ?? ""}
      onChange={handleInputChange}
      className="border rounded px-3 py-2 bg-white"
    />
  )}
</div>


      {[
        { label: "Personal Email", name: "personal_email" },
         { label: "Phone", name: "personal_phone" },
         { label: "Aadhar Card No", name: "aadhar_card_no" },
         { label: "Mother Tongue", name: "mother_tongue" },
         { label: "Caste", name: "caste" },
         
         { label: "Pincode", name: "pincode" },
        
      ].map((field, index) => (
        <div key={index} className="flex flex-col">
          <label className="text-sm font-medium text-gray-600">{field.label}</label>
          <input
            type="text"
            name={field.name}
            value={formData[field.name] || ""}
            onChange={handleInputChange}
            readOnly={!isEditing}
            className={`border rounded px-3 py-2 ${isEditing ? "bg-white border-gray-400" : "bg-gray-100 border-gray-300"}`}
          />
        </div>
      ))}

{[
  { label: "First Graduate", name: "first_graduate", options: ["Yes", "No"] },
  { label: "Blood Group", name: "blood_group", options: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"] },
  { label: "Student Type", name: "student_type", options: ["Day-Scholar", "Hosteller"] },
  { label: "Religion", name: "religion", options: ["Hindu", "Muslim", "Christian", "Others"] },
  { label: "Community", name: "community", options: ["General", "OBC", "SC", "ST", "Others"] },
  { label: "Gender", name: "gender", options: ["Male", "Female", "Transgender"] },
  { label: "Seat Type", name: "seat_type", options: ["Counselling", "Management"] },
].map((field, index) => (
  <div key={index} className="flex flex-col">
    <label className="text-sm font-medium text-gray-600">{field.label}</label>

    {/* Render as text if not editing, otherwise as dropdown */}
    {!isEditing ? (
      <div className="border rounded px-3 py-2 bg-gray-100">{formData[field.name]}</div>
    ) : (
      <select
        name={field.name}
        value={formData[field.name]}
        onChange={handleInputChange}
        className="border rounded px-3 py-2 bg-white"
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

    </form>
  );

  const relationshipOptions = ["Father", "Mother", "Sibling", "Guardian", "Spouse"];

const renderFamilyDetails = () => (
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
        </tr>
      </thead>
      <tbody>
        {(formData.relations || []).map((relation, index) => (
          <tr key={relation.id || index} className="bg-white hover:bg-gray-50 transition">
            
            {/* Relationship Field - Dropdown when Editing */}
            <td className="border border-gray-300 p-3">
              <select
                value={relation.relationship}
                onChange={(e) => handleRelationChange(index, "relationship", e.target.value)}
                className={`w-full border rounded px-2 py-1 ${isEditing ? "bg-white border-gray-400" : "bg-gray-100 border-gray-300"}`}
                disabled={!isEditing}
              >
                <option value="">Select</option>
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
                <option value="Guardian">Guardian</option>
                <option value="Sibling">Sibling</option>
              </select>
            </td>


            {/* Other Relation Fields */}
            {["name", "age", "occupation", "income", "phone", "email"].map((field, idx) => (
              <td key={idx} className="border border-gray-300 p-3">
                <input
                  type="text"
                  value={
                    isEditing
                      ? relation[field] || "" // Show empty field while editing
                      : relation[field] === null || relation[field] === "" ? "-" : relation[field] // Show "N/A" only after saving
                  }
                  onChange={(e) => handleRelationChange(index, field, e.target.value)}
                  readOnly={!isEditing}
                  className={`w-full border rounded px-2 py-1 ${
                    isEditing ? "bg-white border-gray-400" : "bg-gray-100 border-gray-300"
                  }`}
                />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

  

  const renderBankDetails = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {[
        { label: "Bank Name", name: "bank_name" },
        { label: "Branch Name", name: "branch_name" },
        { label: "Address", name: "bank_address" },
        { label: "Account Number", name: "account_no" },
        { label: "IFSC Code", name: "ifsc_code" },
        { label: "MICR Code", name: "micr_code" },
      ].map((field, index) => (
        <div key={index} className="flex flex-col">
          <label className="text-sm font-medium text-gray-600">{field.label}</label>
          <input
            type="text"
            name={field.name}
            value={formData[field.name] || ""}
            onChange={handleInputChange}
            readOnly={!isEditing}
            className={`border rounded px-3 py-2 ${isEditing ? "bg-white border-gray-400" : "bg-gray-100 border-gray-300"}`}
          />
        </div>
      ))}
  
      {/* Account Type: Dropdown when Editing */}
      <div className="flex flex-col">
        <label className="text-sm font-medium text-gray-600">Account Type</label>
        {isEditing ? (
          <select
            name="account_type"
            value={formData.account_type}
            onChange={handleInputChange}
            className="border rounded px-3 py-2 bg-white border-gray-400"
          >
            <option value="Savings">Savings</option>
            <option value="Current">Current</option>
          </select>
        ) : (
          <input
            type="text"
            name="account_type"
            value={formData.account_type || ""}
            readOnly
            className="border rounded px-3 py-2 bg-gray-100 border-gray-300"
          />
        )}
      </div>
    </div>
  );
  

  if (loading) return <p className="text-center text-gray-500">Loading student details...</p>;
  if (error) return <p className="text-center text-red-500">{error}</p>;

  return (
    <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow-md w-full min-h-screen">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        Student Personal Details
      </h2>

      {/* Edit/Save/Cancel Buttons */}
      <div className="flex justify-end mb-6">
        {!isEditing ? (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleEditClick}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg shadow-md hover:shadow-lg transition"
          >
            <FaEdit className="inline-block mr-2" /> Edit
          </motion.button>
        ) : (
          <div className="flex space-x-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSaveClick}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg shadow-md hover:shadow-lg transition"
            >
              <FaSave className="inline-block mr-2" /> Save
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCancelClick}
              className="px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg shadow-md hover:shadow-lg transition"
            >
              <FaTimes className="inline-block mr-2" /> Cancel
            </motion.button>
            {activeTab === "family" && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAddRelation}
                className="px-6 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-lg shadow-md hover:shadow-lg transition"
              >
                <FaPlus className="inline-block mr-2" /> Add Relation
              </motion.button>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex justify-center space-x-6 mb-6">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setActiveTab("personal")}
          className={`px-6 py-3 rounded text-lg font-medium transition ${
            activeTab === "personal"
              ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
              : "bg-gray-200 hover:bg-gray-300"
          }`}
        >
          Personal Details
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setActiveTab("family")}
          className={`px-6 py-3 rounded text-lg font-medium transition ${
            activeTab === "family"
              ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
              : "bg-gray-200 hover:bg-gray-300"
          }`}
        >
          Family Details
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setActiveTab("bank")}
          className={`px-6 py-3 rounded text-lg font-medium transition ${
            activeTab === "bank"
              ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
              : "bg-gray-200 hover:bg-gray-300"
          }`}
        >
          Bank Details
        </motion.button>
      </div>

      {/* Tab Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full p-6 bg-white rounded-lg shadow-lg"
      >
        {activeTab === "personal" && renderPersonalDetails()}
        {activeTab === "family" && renderFamilyDetails()}
        {activeTab === "bank" && renderBankDetails()}
      </motion.div>
    </div>
  );
};

export default StudentPersonalDetails;