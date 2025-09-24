import React, { useState, useEffect } from "react";
import { useLocationContext } from "../../contexts/LocationContext";
import { useAttendedEventContext } from "../../contexts/AttendedEventContext";
import { toast } from "react-toastify";
import { FaEdit, FaTrash, FaEye } from "react-icons/fa";
import { motion } from "framer-motion";

const token = localStorage.getItem("token");

// Reusable InputField Component
const InputField = ({ label, name, value, onChange, type = "text", required = false, placeholder = "" }) => (
  <div className="flex flex-col mb-4">
    <label className="font-medium text-gray-700 mb-1">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      placeholder={placeholder}
      className="border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>
);

// Reusable SelectField Component
const SelectField = ({ label, name, value, onChange, options, required = false, placeholder = "" }) => (
  <div className="flex flex-col mb-4">
    <label className="font-medium text-gray-700 mb-1">{label}</label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      className="border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);

const StudentEventAttended = () => {
  const { states, districts, cities, fetchDistrictsByState, fetchCitiesByDistrict } = useLocationContext();
  const {
    eventsAttended,
    loading,
    addEventAttended,
    deleteEventAttended,
    updateEventAttended,
    fetchEventsAttended,
  } = useAttendedEventContext();

  const [formData, setFormData] = useState({
    event_name: "",
    description: "",
    event_type: "Inter College Event",
    type_of_event: "Competition",
    other_event_type: "",
    institution_name: "",
    mode: "Online",
    stateID: "",
    districtID: "",
    cityID: "",
    from_date: "",
    to_date: "",
    team_size: 1,
    team_members: [],
    participation_status: "Participation",
    is_certificate_available: false,
    certificate_file: null,
    is_other_state_event: false,
    is_other_country_event: false,
    achievement_details: {
      is_certificate_available: false,
      certificate_file: null,
      is_cash_prize: false,
      cash_prize_amount: "",
      cash_prize_proof: null,
      is_memento: false,
      memento_proof: null,
    },
  });

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentEventId, setCurrentEventId] = useState(null);

  useEffect(() => {
    fetchEventsAttended();
  }, [fetchEventsAttended]);

  const handleInputChange = async (e) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (name === "stateID") {
      setFormData((prev) => ({ ...prev, [name]: value, districtID: "", cityID: "" }));
      try {
        await fetchDistrictsByState(value);
      } catch (error) {
        toast.error("Failed to fetch districts for the selected state.");
      }
    } else if (name === "districtID") {
      setFormData((prev) => ({ ...prev, [name]: value, cityID: "" }));
      try {
        await fetchCitiesByDistrict(value);
      } catch (error) {
        toast.error("Failed to fetch cities for the selected district.");
      }
    } else if (name === "team_size") {
      const newTeamSize = Math.max(1, parseInt(value, 10));
      const updatedTeamMembers = Array.from({ length: newTeamSize - 1 }, () => ({
        reg_no: "",
        name: "",
      }));

      setFormData((prev) => ({
        ...prev,
        team_size: newTeamSize,
        team_members: updatedTeamMembers,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleTeamMemberChange = (index, e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updatedTeamMembers = [...prev.team_members];
      updatedTeamMembers[index][name] = value;
      return { ...prev, team_members: updatedTeamMembers };
    });
  };

  const handleFileUpload = (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      if (fieldName.includes(".")) {
        const [parent, child] = fieldName.split(".");
        setFormData((prev) => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: file,
          },
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          [fieldName]: file,
        }));
      }
    }
  };

  const handleAchievementDetailsChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      achievement_details: {
        ...prev.achievement_details,
        [name]: type === "checkbox" ? checked : value,
      },
    }));
  };

  const validateTeamMembers = () => {
    if (formData.team_size === 1) return true;
    return formData.team_members.every(
      (member) => member.reg_no.trim() !== "" && member.name.trim() !== ""
    );
  };

  const prepareFormData = () => {
    let decodedData;
    try {
      const base64Url = token.split(".")[1];
      decodedData = JSON.parse(atob(base64Url.replace(/-/g, "+").replace(/_/g, "/")));
    } catch (error) {
      toast.error("Error fetching user details");
      return null;
    }

    const formDataWithUserId = new FormData();

    // Append non-file fields
    for (const key in formData) {
      if (key === "team_members" || key === "achievement_details") {
        formDataWithUserId.append(key, JSON.stringify(formData[key]));
      } else if (key === "certificate_file" && formData[key]) {
        formDataWithUserId.append("cer_file", formData[key]);
      } else {
        formDataWithUserId.append(key, formData[key]);
      }
    }

    // Append achievement details files
    if (formData.achievement_details) {
      const { achievement_details } = formData;
      if (achievement_details.certificate_file) {
        formDataWithUserId.append("achievement_certificate_file", achievement_details.certificate_file);
      }
      if (achievement_details.cash_prize_proof) {
        formDataWithUserId.append("cash_prize_proof", achievement_details.cash_prize_proof);
      }
      if (achievement_details.memento_proof) {
        formDataWithUserId.append("memento_proof", achievement_details.memento_proof);
      }
    }

    formDataWithUserId.append("Userid", String(decodedData.Userid));

    return formDataWithUserId;
  };

  const handleSubmit = async (e) => {
    if (!token) return toast.error("User not logged in");

    e.preventDefault();

    if (!validateTeamMembers()) {
      toast.error("Please fill in all team member details.");
      return;
    }

    const formDataWithUserId = prepareFormData();
    if (!formDataWithUserId) return;

    setIsSubmitting(true);
    try {
      if (isEditing) {
        await updateEventAttended(currentEventId, formDataWithUserId);
        toast.success("Event updated successfully!");
      } else {
        await addEventAttended(formDataWithUserId);
        toast.success("Event submitted successfully!");
      }
      resetForm();
      fetchEventsAttended();
    } catch (error) {
      toast.error(`Failed to ${isEditing ? "update" : "submit"} event. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (event) => {
    setCurrentEventId(event.id);
    setIsEditing(true);
    
    // Convert team_members array to the correct format if it's a string
    const teamMembers = typeof event.team_members === 'string' 
      ? JSON.parse(event.team_members) 
      : event.team_members || [];
    
    // Convert achievement_details to the correct format if it's a string
    const achievementDetails = typeof event.achievement_details === 'string' 
      ? JSON.parse(event.achievement_details) 
      : event.achievement_details || {
          is_certificate_available: false,
          certificate_file: null,
          is_cash_prize: false,
          cash_prize_amount: "",
          cash_prize_proof: null,
          is_memento: false,
          memento_proof: null,
        };

    // Format dates for input fields (YYYY-MM-DD)
    const formatDateForInput = (dateString) => {
      if (!dateString) return "";
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    };

    // Fetch districts and cities for the selected state/district
    if (event.stateID) {
      await fetchDistrictsByState(event.stateID);
      if (event.districtID) {
        await fetchCitiesByDistrict(event.districtID);
      }
    }

    setFormData({
      event_name: event.event_name || "",
      description: event.description || "",
      event_type: event.event_type || "Inter College Event",
      type_of_event: event.type_of_event || "Competition",
      other_event_type: event.other_event_type || "",
      institution_name: event.institution_name || "",
      mode: event.mode || "Online",
      stateID: event.stateID || "",
      districtID: event.districtID || "",
      cityID: event.cityID || "",
      from_date: formatDateForInput(event.from_date),
      to_date: formatDateForInput(event.to_date),
      team_size: event.team_size || 1,
      team_members: teamMembers,
      participation_status: event.participation_status || "Participation",
      is_certificate_available: event.is_certificate_available || false,
      certificate_file: null, // Reset file input
      is_other_state_event: event.is_other_state_event || false,
      is_other_country_event: event.is_other_country_event || false,
      achievement_details: achievementDetails,
    });

    // Scroll to form
    document.getElementById("event-form").scrollIntoView({ behavior: "smooth" });
  };

  const resetForm = () => {
    setFormData({
      event_name: "",
      description: "",
      event_type: "Inter College Event",
      type_of_event: "Competition",
      other_event_type: "",
      institution_name: "",
      mode: "Online",
      stateID: "",
      districtID: "",
      cityID: "",
      from_date: "",
      to_date: "",
      team_size: 1,
      team_members: [],
      participation_status: "Participation",
      is_certificate_available: false,
      certificate_file: null,
      is_other_state_event: false,
      is_other_country_event: false,
      achievement_details: {
        is_certificate_available: false,
        certificate_file: null,
        is_cash_prize: false,
        cash_prize_amount: "",
        cash_prize_proof: null,
        is_memento: false,
        memento_proof: null,
      },
    });
    setIsEditing(false);
    setCurrentEventId(null);
  };

  const stateOptions = states.map((state) => ({
    value: state.id,
    label: state.name,
  }));

  const districtOptions = districts.map((district) => ({
    value: district.id,
    label: district.name,
  }));

  const cityOptions = cities.map((city) => ({
    value: city.id,
    label: city.name,
  }));

  const renderTable = (data) => (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
        <thead>
          <tr className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
            <th className="py-3 px-4 text-left font-medium">Event Name</th>
            <th className="py-3 px-4 text-left font-medium">Event Type</th>
            <th className="py-3 px-4 text-left font-medium">Type of Event</th>
            <th className="py-3 px-4 text-left font-medium">Institution Name</th>
            <th className="py-3 px-4 text-left font-medium">Mode</th>
            <th className="py-3 px-4 text-left font-medium">Duration</th>
            <th className="py-3 px-4 text-left font-medium">Status</th>
            <th className="py-3 px-4 text-left font-medium">Team Size</th>
            <th className="py-3 px-4 text-left font-medium">Certificate</th>
            <th className="py-3 px-4 text-left font-medium">Actions</th>
            <th className="py-3 px-4 text-left font-medium">View</th>
          </tr>
        </thead>
        <tbody>
          {data.map((event, index) => (
            <tr key={index} className={`${index % 2 === 0 ? "bg-gray-50" : "bg-white"} hover:bg-gray-100 transition-colors`}>
              <td className="py-3 px-4 text-gray-700">{event.event_name}</td>
              <td className="py-3 px-4 text-gray-700">{event.event_type}</td>
              <td className="py-3 px-4 text-gray-700">{event.type_of_event}</td>
              <td className="py-3 px-4 text-gray-700">{event.institution_name}</td>
              <td className="py-3 px-4 text-gray-700">{event.mode}</td>
              <td className="py-3 px-4 text-gray-700">
                {event.from_date && event.to_date
                  ? `${new Date(event.from_date).toLocaleDateString()} - ${new Date(event.to_date).toLocaleDateString()}`
                  : "N/A"}
              </td>
              <td className="py-3 px-4">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    event.participation_status === "Achievement" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {event.participation_status}
                </span>
              </td>
              <td className="py-3 px-4 text-gray-700">{event.team_size}</td>
              <td className="py-3 px-4 text-gray-700">
                {event.is_certificate_available ? "Yes" : "No"}
              </td>
              <td className="py-3 px-4 space-x-2">
                <button 
                  onClick={() => handleEdit(event)} 
                  className="text-blue-500 hover:text-blue-700 transition"
                >
                  <FaEdit className="inline-block text-xl" />
                </button>
                <button 
                  onClick={() => deleteEventAttended(event.id)} 
                  className="text-red-500 hover:text-red-700 transition"
                >
                  <FaTrash className="inline-block text-xl" />
                </button>
              </td>
              <td className="py-3 px-4">
                <button
                  onClick={() => setSelectedEvent(event)}
                  className="text-purple-500 hover:text-purple-700 transition"
                >
                  <FaEye className="inline-block text-xl" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const EventDetailsModal = ({ event, onClose }) => {
    if (!event) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Event Details</h2>
          <div className="space-y-4">
            <p><strong>Event Name:</strong> {event.event_name}</p>
            <p><strong>Event Type:</strong> {event.event_type}</p>
            <p><strong>Type of Event:</strong> {event.type_of_event}</p>
            <p><strong>Institution Name:</strong> {event.institution_name}</p>
            <p><strong>Mode:</strong> {event.mode}</p>
            <p><strong>Duration:</strong> {event.from_date && event.to_date
              ? `${new Date(event.from_date).toLocaleDateString()} - ${new Date(event.to_date).toLocaleDateString()}`
              : "N/A"}</p>
            <p><strong>Status:</strong> {event.participation_status}</p>
            <p><strong>Team Size:</strong> {event.team_size}</p>
            <p><strong>Certificate Available:</strong> {event.is_certificate_available ? "Yes" : "No"}</p>
            {event.is_certificate_available && (
              <p>
                <strong>Certificate:</strong>{" "}
                <a
                  href={event.certificate_file}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  View Certificate
                </a>
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="mt-6 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-2 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    );
  };

  const formFields = [
    [
      { label: "Event Name", name: "event_name", type: "text", required: true, placeholder: "Enter event name" },
      { label: "Description", name: "description", type: "text", required: true, placeholder: "Enter event description" },
      { label: "Event Type", name: "event_type", type: "select", options: [
        { value: "Inter College Event", label: "Inter College Event" },
        { value: "Intra College Event", label: "Intra College Event" },
      ], required: true, placeholder: "Select event type" },
      { label: "Type of Event", name: "type_of_event", type: "select", options: [
        { value: "Competition", label: "Competition" },
        { value: "Hackathon", label: "Hackathon" },
        { value: "Ideation", label: "Ideation" },
        { value: "Seminar", label: "Seminar" },
        { value: "Webinar", label: "Webinar" },
        { value: "Other", label: "Other" },
      ], required: true, placeholder: "Select type of event" },
    ],
    [
      ...(formData.type_of_event === "Other"
        ? [
            {
              label: "Specify Event Type",
              name: "other_event_type",
              type: "text",
              required: true,
              placeholder: "Enter type of event",
            },
          ]
        : []),
      { label: "Institution Name", name: "institution_name", type: "text", required: true, placeholder: "Enter institution name" },
      { label: "Mode", name: "mode", type: "select", options: [
        { value: "Online", label: "Online" },
        { value: "Offline", label: "Offline" },
      ], required: true, placeholder: "Select mode" },
      { label: "State", name: "stateID", type: "select", options: stateOptions, required: true, placeholder: "Select state" },
    ],
    [
      { label: "District", name: "districtID", type: "select", options: districtOptions, required: true, placeholder: "Select district" },
      { label: "City", name: "cityID", type: "select", options: cityOptions, required: true, placeholder: "Select city" },
      { label: "From Date", name: "from_date", type: "date", required: true, placeholder: "Select start date" },
      { label: "To Date", name: "to_date", type: "date", required: true, placeholder: "Select end date" },
    ],
    [
      { label: "Team Size", name: "team_size", type: "number", min: 1, required: true, placeholder: "Enter team size" },
      { label: "Participation Status", name: "participation_status", type: "select", options: [
        { value: "Participation", label: "Participation" },
        { value: "Achievement", label: "Achievement" },
      ], required: true, placeholder: "Select participation status" },
    ],
  ];

  return (
    <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow-md w-full min-h-screen">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        Events Attended
      </h2>

      {/* Form Section */}
      <motion.div
        id="event-form"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full p-6 bg-white rounded-lg shadow-md mb-6"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-800">
            {isEditing ? "Edit Event" : "Submit New Event"}
          </h3>
          {isEditing && (
            <button
              onClick={resetForm}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              Cancel Edit
            </button>
          )}
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Form Fields */}
          {formFields.map((row, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {row.map((field) => (
                field.type === "select" ? (
                  <SelectField
                    key={field.name}
                    label={field.label}
                    name={field.name}
                    value={formData[field.name]}
                    onChange={handleInputChange}
                    options={field.options}
                    required={field.required}
                    placeholder={field.placeholder}
                  />
                ) : (
                  <InputField
                    key={field.name}
                    label={field.label}
                    name={field.name}
                    value={formData[field.name]}
                    onChange={handleInputChange}
                    type={field.type}
                    required={field.required}
                    placeholder={field.placeholder}
                  />
                )
              ))}
            </div>
          ))}

          {/* Team Members Section */}
          {formData.team_size > 1 && (
            <div className="space-y-4">
              <label className="font-medium text-gray-700">Team Members (Excluding You)</label>
              {formData.team_members.map((member, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField
                    label={`Team Member ${index + 1} Reg No`}
                    name="reg_no"
                    value={member.reg_no}
                    onChange={(e) => handleTeamMemberChange(index, e)}
                    required
                    placeholder="Enter registration number"
                  />
                  <InputField
                    label={`Team Member ${index + 1} Name`}
                    name="name"
                    value={member.name}
                    onChange={(e) => handleTeamMemberChange(index, e)}
                    required
                    placeholder="Enter team member name"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Other State/Country Event Checkboxes */}
          <div className="space-y-4">
            <label className="font-medium text-gray-700">Event Location</label>
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="is_other_state_event"
                  checked={formData.is_other_state_event}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                <span>Other State Event</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="is_other_country_event"
                  checked={formData.is_other_country_event}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                <span>Other Country Event</span>
              </label>
            </div>
          </div>

          {/* Certificate Section */}
          {formData.participation_status === "Participation" && (
            <div className="space-y-4">
              <label className="font-medium text-gray-700">Certificate Details</label>
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_certificate_available"
                    checked={formData.is_certificate_available}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <span>Certificate Available</span>
                </label>
                {formData.is_certificate_available && (
                  <input
                    type="file"
                    name="cer_file"
                    onChange={(e) => handleFileUpload(e, "certificate_file")}
                    className="border border-gray-300 p-2 rounded-lg"
                  />
                )}
              </div>
            </div>
          )}

          {/* Achievement Details Section */}
          {formData.participation_status === "Achievement" && (
            <div className="space-y-4">
              <label className="font-medium text-gray-700">Achievement Details</label>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_certificate_available"
                      checked={formData.achievement_details.is_certificate_available}
                      onChange={handleAchievementDetailsChange}
                      className="mr-2"
                    />
                    <span>Certificate Available</span>
                  </label>
                  {formData.achievement_details.is_certificate_available && (
                    <input
                      type="file"
                      name="achievement_certificate_file"
                      onChange={(e) => handleFileUpload(e, "achievement_details.certificate_file")}
                      className="border border-gray-300 p-2 rounded-lg"
                    />
                  )}
                </div>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_cash_prize"
                      checked={formData.achievement_details.is_cash_prize}
                      onChange={handleAchievementDetailsChange}
                      className="mr-2"
                    />
                    <span>Cash Prize</span>
                  </label>
                  {formData.achievement_details.is_cash_prize && (
                    <>
                      <InputField
                        label="Cash Prize Amount"
                        name="cash_prize_amount"
                        value={formData.achievement_details.cash_prize_amount}
                        onChange={handleAchievementDetailsChange}
                        type="number"
                        placeholder="Enter amount"
                      />
                      <input
                        type="file"
                        name="cash_prize_proof"
                        onChange={(e) => handleFileUpload(e, "achievement_details.cash_prize_proof")}
                        className="border border-gray-300 p-2 rounded-lg"
                      />
                    </>
                  )}
                </div>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_memento"
                      checked={formData.achievement_details.is_memento}
                      onChange={handleAchievementDetailsChange}
                      className="mr-2"
                    />
                    <span>Memento</span>
                  </label>
                  {formData.achievement_details.is_memento && (
                    <input
                      type="file"
                      name="memento_proof"
                      onChange={(e) => handleFileUpload(e, "achievement_details.memento_proof")}
                      className="border border-gray-300 p-2 rounded-lg"
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-50"
            >
              {isSubmitting ? "Processing..." : isEditing ? "Update Event" : "Submit Event"}
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-all"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </motion.div>

      {/* Table Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full p-6 bg-white rounded-lg shadow-md"
      >
        <h3 className="text-xl font-semibold text-gray-800 mb-6">Events List</h3>
        {loading ? (
          <p className="text-gray-500">Loading events...</p>
        ) : eventsAttended.length === 0 ? (
          <p className="text-gray-500">No events available.</p>
        ) : (
          renderTable(eventsAttended)
        )}
      </motion.div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <EventDetailsModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
    </div>
  );
};

export default StudentEventAttended;