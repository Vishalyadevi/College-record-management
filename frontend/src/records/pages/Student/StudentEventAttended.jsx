import React, { useState, useEffect } from "react";
import { useAttendedEventContext } from "../../contexts/AttendedEventContext";
import { toast } from "react-toastify";
import { FaEdit, FaTrash, FaEye } from "react-icons/fa";
import { motion } from "framer-motion";

const token = localStorage.getItem("token");

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
    event_state: "",
    district: "",
    city: "",
    from_date: "",
    to_date: "",
    team_size: 1,
    team_members: [],
    participation_status: "Participation",
    is_certificate_available: false,
    certificate_file: null,
    is_other_state_event: false,
    is_other_country_event: false,
    is_nirf_ranked: false,
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

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: checked }));
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
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    decodedData = JSON.parse(atob(base64));
  } catch (error) {
    toast.error("Error fetching user details");
    return null;
  }

  if (!formData.event_state?.trim() || !formData.district?.trim() || !formData.city?.trim()) {
    toast.error("Please enter State, District, and City");
    return null;
  }

  const fd = new FormData();

  // Append basic fields (excluding nested objects and files)
  const basicFields = [
    'event_name', 'description', 'event_type', 'type_of_event', 
    'other_event_type', 'institution_name', 'mode', 'event_state',
    'district', 'city', 'from_date', 'to_date', 'team_size',
    'participation_status', 'is_certificate_available', 
    'is_other_state_event', 'is_other_country_event', 'is_nirf_ranked'
  ];

  basicFields.forEach(key => {
    const value = formData[key];
    if (value !== null && value !== undefined && value !== '') {
      fd.append(key, value);
    }
  });

  // Append team_members as JSON string
  fd.append('team_members', JSON.stringify(formData.team_members));

  // Handle certificate file for Participation status
  if (formData.certificate_file instanceof File) {
    fd.append('certificate_file', formData.certificate_file);
  }

  // Handle achievement details
  const achievementDetails = {
    is_certificate_available: formData.achievement_details.is_certificate_available,
    is_cash_prize: formData.achievement_details.is_cash_prize,
    cash_prize_amount: formData.achievement_details.cash_prize_amount,
    is_memento: formData.achievement_details.is_memento,
  };
  fd.append('achievement_details', JSON.stringify(achievementDetails));

  // Append achievement files separately
  if (formData.achievement_details.certificate_file instanceof File) {
    fd.append('achievement_certificate_file', formData.achievement_details.certificate_file);
  }
  if (formData.achievement_details.cash_prize_proof instanceof File) {
    fd.append('cash_prize_proof', formData.achievement_details.cash_prize_proof);
  }
  if (formData.achievement_details.memento_proof instanceof File) {
    fd.append('memento_proof', formData.achievement_details.memento_proof);
  }

  // DEBUG: Log all entries
  console.log("Final FormData contents:");
  for (let [key, value] of fd.entries()) {
    console.log(key, value);
  }

  return fd;
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
      console.error("Error submitting event:", error);
      toast.error(`Failed to ${isEditing ? "update" : "submit"} event. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (event) => {
    console.log("Editing event:", event);
    setCurrentEventId(event.id);
    setIsEditing(true);
    
    const teamMembers = typeof event.team_members === 'string' 
      ? JSON.parse(event.team_members) 
      : event.team_members || [];
    
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

    const formatDateForInput = (dateString) => {
      if (!dateString) return "";
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    };

    setFormData({
      event_name: event.event_name || "",
      description: event.description || "",
      event_type: event.event_type || "Inter College Event",
      type_of_event: event.type_of_event || "Competition",
      other_event_type: event.other_event_type || "",
      institution_name: event.institution_name || "",
      mode: event.mode || "Online",
      event_state: event.event_state || "",
      district: event.district || "",
      city: event.city || "",
      from_date: formatDateForInput(event.from_date),
      to_date: formatDateForInput(event.to_date),
      team_size: event.team_size || 1,
      team_members: teamMembers,
      participation_status: event.participation_status || "Participation",
      is_certificate_available: event.is_certificate_available || false,
      certificate_file: null,
      is_other_state_event: event.is_other_state_event || false,
      is_other_country_event: event.is_other_country_event || false,
      is_nirf_ranked: event.is_nirf_ranked || false,
      achievement_details: achievementDetails,
    });

    document.getElementById("event-form")?.scrollIntoView({ behavior: "smooth" });
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
      event_state: "",
      district: "",
      city: "",
      from_date: "",
      to_date: "",
      team_size: 1,
      team_members: [],
      participation_status: "Participation",
      is_certificate_available: false,
      certificate_file: null,
      is_other_state_event: false,
      is_other_country_event: false,
      is_nirf_ranked: false,
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

  const renderTable = (data) => (
  <div className="w-full">
    <div className="overflow-x-auto shadow-lg rounded-lg border border-gray-200 max-w-full">
      <div className="inline-block min-w-full align-middle">
        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 table-fixed">
            <thead className="bg-gradient-to-r from-blue-500 to-purple-500 sticky top-0 z-10">
              <tr>
                <th className="py-3 px-2 text-left font-semibold text-white whitespace-nowrap w-12">S.No</th>
                <th className="py-3 px-2 text-left font-semibold text-white whitespace-nowrap w-48">Event Name</th>
                <th className="py-3 px-2 text-left font-semibold text-white whitespace-nowrap w-32">Event Type</th>
                <th className="py-3 px-2 text-left font-semibold text-white whitespace-nowrap w-32">Type</th>
                <th className="py-3 px-2 text-left font-semibold text-white whitespace-nowrap w-40">Institution</th>
                <th className="py-3 px-2 text-left font-semibold text-white whitespace-nowrap w-20">Mode</th>
                <th className="py-3 px-2 text-left font-semibold text-white whitespace-nowrap w-48">Location</th>
                <th className="py-3 px-2 text-left font-semibold text-white whitespace-nowrap w-32">Duration</th>
                <th className="py-3 px-2 text-left font-semibold text-white whitespace-nowrap w-24">Status</th>
                <th className="py-3 px-2 text-left font-semibold text-white whitespace-nowrap w-20">Team</th>
                <th className="py-3 px-2 text-left font-semibold text-white whitespace-nowrap w-20">NIRF</th>
                <th className="py-3 px-2 text-left font-semibold text-white whitespace-nowrap w-24 sticky right-[60px] bg-gradient-to-r from-blue-500 to-purple-500">Actions</th>
                <th className="py-3 px-2 text-left font-semibold text-white whitespace-nowrap w-16 sticky right-0 bg-gradient-to-r from-blue-500 to-purple-500">View</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((event, index) => (
                <tr
                  key={event.id || index}
                  className={`${
                    index % 2 === 0 ? "bg-gray-50" : "bg-white"
                  } hover:bg-blue-50 transition-colors`}
                >
                  <td className="py-3 px-2 text-gray-700 whitespace-nowrap text-sm">{index + 1}</td>
                  <td className="py-3 px-2 text-gray-700 font-medium text-sm">
                    <div className="truncate max-w-48" title={event.event_name}>
                      {event.event_name}
                    </div>
                  </td>
                  <td className="py-3 px-2 text-gray-700 text-sm">
                    <div className="truncate max-w-32" title={event.event_type}>
                      {event.event_type}
                    </div>
                  </td>
                  <td className="py-3 px-2 text-gray-700 text-sm">
                    <div className="truncate max-w-32" title={event.type_of_event}>
                      {event.type_of_event}
                    </div>
                  </td>
                  <td className="py-3 px-2 text-gray-700 text-sm">
                    <div className="truncate max-w-40" title={event.institution_name}>
                      {event.institution_name}
                    </div>
                  </td>
                  <td className="py-3 px-2 text-gray-700">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      event.mode === "Online" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                    }`}>
                      {event.mode}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-gray-700 text-sm">
                    <div className="truncate max-w-48" title={`${event.city}, ${event.district}, ${event.event_state}`}>
                      {event.city}, {event.district}, {event.event_state}
                    </div>
                  </td>
                  <td className="py-3 px-2 text-gray-700 text-xs">
                    {event.from_date && event.to_date ? (
                      <div className="flex flex-col">
                        <span>{new Date(event.from_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
                        <span className="text-gray-500">-</span>
                        <span>{new Date(event.to_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
                      </div>
                    ) : (
                      "N/A"
                    )}
                  </td>
                  <td className="py-3 px-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                        event.participation_status === "Achievement"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {event.participation_status === "Achievement" ? "Achieved" : "Participated"}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-gray-700 text-center text-sm">{event.team_size}</td>
                  <td className="py-3 px-2 text-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        event.is_nirf_ranked ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {event.is_nirf_ranked ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="py-3 px-2 sticky right-[60px] bg-inherit">
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleEdit(event)}
                        className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-1.5 rounded-full transition-all"
                        title="Edit Event"
                      >
                        <FaEdit className="text-sm" />
                      </button>
                      <button
                        onClick={() => deleteEventAttended(event.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-full transition-all"
                        title="Delete Event"
                      >
                        <FaTrash className="text-sm" />
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-2 sticky right-0 bg-inherit">
                    <button
                      onClick={() => setSelectedEvent(event)}
                      className="text-purple-500 hover:text-purple-700 hover:bg-purple-50 p-1.5 rounded-full transition-all"
                      title="View Details"
                    >
                      <FaEye className="text-sm" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <div className="mt-4 text-sm text-gray-600 flex items-center justify-center">
      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
      </svg>
      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
      </svg>
      Scroll horizontally to view all columns
    </div>
  </div>
);

  const EventDetailsModal = ({ event, onClose }) => {
    if (!event) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
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
            <p><strong>Location:</strong> {event.city}, {event.district}, {event.event_state}</p>
            <p><strong>Duration:</strong> {event.from_date && event.to_date
              ? `${new Date(event.from_date).toLocaleDateString()} - ${new Date(event.to_date).toLocaleDateString()}`
              : "N/A"}</p>
            <p><strong>Status:</strong> {event.participation_status}</p>
            <p><strong>Team Size:</strong> {event.team_size}</p>
            <p><strong>NIRF Ranked:</strong> {event.is_nirf_ranked ? "Yes" : "No"}</p>
            <p><strong>Certificate Available:</strong> {event.is_certificate_available ? "Yes" : "No"}</p>
            {event.is_certificate_available && event.certificate_file && (
              <p>
                <strong>Certificate:</strong>{" "}
                <a
                  href={`http://localhost:4000/uploads/events/${event.certificate_file}`}
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
        { value: "State", label: "State" },
        { value: "National", label: "National" },
        { value: "International", label: "International" },
        { value: "Industry", label: "Industry" },
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
      { label: "State", name: "event_state", type: "text", required: true, placeholder: "Enter state" },
    ],
    [
      { label: "District", name: "district", type: "text", required: true, placeholder: "Enter district" },
      { label: "City", name: "city", type: "text", required: true, placeholder: "Enter city" },
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
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="is_nirf_ranked"
                  checked={formData.is_nirf_ranked}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                <span>NIRF Ranked Institute</span>
              </label>
            </div>
          </div>

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

      {selectedEvent && (
        <EventDetailsModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
    </div>
  );
};

export default StudentEventAttended;