import React, { useState, useEffect } from "react";
import { Calendar, Clock, MapPin, DollarSign, BookOpen, Award, CheckCircle, XCircle, AlertCircle } from "lucide-react";

const StudentPlacementDrives = () => {
  const [drives, setDrives] = useState([]);
  const [registeredDrives, setRegisteredDrives] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");
  const [studentProfile, setStudentProfile] = useState(null);
  const [selectedDrive, setSelectedDrive] = useState(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  const token = localStorage.getItem("token");
  const API_BASE = "http://localhost:4000/api";

  useEffect(() => {
    fetchDrives();
    fetchRegisteredDrives();
    fetchStudentProfile();
  }, []);

  const fetchDrives = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/placement-drives`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch drives');
      
      const data = await response.json();
      setDrives(data.data || []);
    } catch (error) {
      console.error("Error fetching drives:", error);
      alert("Error loading placement drives");
    } finally {
      setLoading(false);
    }
  };

  const fetchRegisteredDrives = async () => {
    try {
      const response = await fetch(`${API_BASE}/registration/my-registrations`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch registrations');
      
      const data = await response.json();
      setRegisteredDrives(data.data || []);
    } catch (error) {
      console.error("Error fetching registrations:", error);
    }
  };

  const fetchStudentProfile = async () => {
    try {
      const response = await fetch(`${API_BASE}/profile`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch profile');
      
      const data = await response.json();
      setStudentProfile(data.data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const checkEligibility = (drive) => {
    if (!studentProfile) return { eligible: false, reasons: ["Profile not loaded"] };

    const reasons = [];
    let eligible = true;

    if (drive.tenth_percentage && studentProfile.tenth_percentage < drive.tenth_percentage) {
      eligible = false;
      reasons.push(`10th: Need ${drive.tenth_percentage}%, you have ${studentProfile.tenth_percentage}%`);
    }

    if (drive.twelfth_percentage && studentProfile.twelfth_percentage < drive.twelfth_percentage) {
      eligible = false;
      reasons.push(`12th: Need ${drive.twelfth_percentage}%, you have ${studentProfile.twelfth_percentage}%`);
    }

    if (drive.cgpa && studentProfile.cgpa < drive.cgpa) {
      eligible = false;
      reasons.push(`CGPA: Need ${drive.cgpa}, you have ${studentProfile.cgpa}`);
    }

    if (drive.departments) {
      const allowedDepts = drive.departments.split(',').map(d => d.trim().toUpperCase());
      if (studentProfile.department && !allowedDepts.includes(studentProfile.department.toUpperCase())) {
        eligible = false;
        reasons.push(`Department: Only for ${drive.departments}`);
      }
    }

    if (drive.batch && studentProfile.batch && studentProfile.batch !== drive.batch) {
      eligible = false;
      reasons.push(`Batch: Only for ${drive.batch}`);
    }

    return { eligible, reasons };
  };

  const isRegistered = (driveId) => {
    return registeredDrives.some(reg => reg.drive_id === driveId);
  };

  const getRegistrationStatus = (driveId) => {
    return registeredDrives.find(reg => reg.drive_id === driveId);
  };

  const handleRegister = async () => {
    if (!selectedDrive) return;

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/registration/register`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ drive_id: selectedDrive.id })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Registration failed');
      }

      alert("Successfully registered for the placement drive!");
      setShowRegisterModal(false);
      setSelectedDrive(null);
      await fetchRegisteredDrives();
    } catch (error) {
      console.error("Error registering:", error);
      alert(error.message || "Error registering for drive");
    } finally {
      setLoading(false);
    }
  };

  const filteredDrives = drives.filter(drive => {
    const now = new Date();
    const driveDate = new Date(drive.drive_date);
    const isUpcoming = driveDate >= now;
    const registered = isRegistered(drive.id);
    const { eligible } = checkEligibility(drive);

    if (filter === "upcoming") return isUpcoming && !registered;
    if (filter === "eligible") return eligible && isUpcoming && !registered;
    if (filter === "registered") return registered;
    return true;
  });

  const getStatusBadge = (status) => {
    const badges = {
      "Cleared": { bg: "bg-green-100", text: "text-green-800" },
      "Not Cleared": { bg: "bg-red-100", text: "text-red-800" },
      "Pending": { bg: "bg-yellow-100", text: "text-yellow-800" },
      "Attended": { bg: "bg-blue-100", text: "text-blue-800" },
    };
    return badges[status] || badges["Pending"];
  };

  const getFilterCounts = () => {
    return {
      all: drives.length,
      upcoming: drives.filter(d => new Date(d.drive_date) >= new Date() && !isRegistered(d.id)).length,
      eligible: drives.filter(d => checkEligibility(d).eligible && new Date(d.drive_date) >= new Date() && !isRegistered(d.id)).length,
      registered: registeredDrives.length
    };
  };

  const counts = getFilterCounts();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6"
          style={{ marginLeft: "250px", padding: "20px" }}
>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Placement Drives</h1>
          <p className="text-gray-600">View and register for upcoming campus placement opportunities</p>
          
          {/* Student Profile Summary */}
          {studentProfile && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Your Profile</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">10th:</span>
                  <span className="ml-1 font-semibold">{studentProfile.tenth_percentage || 'N/A'}%</span>
                </div>
                <div>
                  <span className="text-gray-600">12th:</span>
                  <span className="ml-1 font-semibold">{studentProfile.twelfth_percentage || 'N/A'}%</span>
                </div>
                <div>
                  <span className="text-gray-600">CGPA:</span>
                  <span className="ml-1 font-semibold">{studentProfile.cgpa || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-600">Dept:</span>
                  <span className="ml-1 font-semibold">{studentProfile.department || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-600">Batch:</span>
                  <span className="ml-1 font-semibold">{studentProfile.batch || 'N/A'}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex gap-2 flex-wrap">
            {[
              { value: "all", label: "All Drives", count: counts.all },
              { value: "upcoming", label: "Upcoming", count: counts.upcoming },
              { value: "eligible", label: "Eligible for Me", count: counts.eligible },
              { value: "registered", label: "My Registrations", count: counts.registered },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === tab.value
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {tab.label} <span className="ml-1 text-xs">({tab.count})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Drives Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredDrives.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Drives Found</h3>
            <p className="text-gray-500">There are no placement drives matching your filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDrives.map((drive) => {
              const { eligible, reasons } = checkEligibility(drive);
              const registered = isRegistered(drive.id);
              const registration = getRegistrationStatus(drive.id);
              const driveDate = new Date(drive.drive_date);
              const isPast = driveDate < new Date();

              return (
                <div
                  key={drive.id}
                  className={`bg-white rounded-lg shadow-md overflow-hidden transition-all hover:shadow-xl ${
                    !eligible && !registered ? "opacity-75" : ""
                  }`}
                >
                  {/* Card Header */}
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white">
                    <h3 className="text-xl font-bold mb-1">{drive.company_name}</h3>
                    <div className="flex items-center gap-2 text-sm opacity-90">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(drive.drive_date).toLocaleDateString()}</span>
                      <Clock className="w-4 h-4 ml-2" />
                      <span>{drive.drive_time}</span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 space-y-3">
                    {/* Venue */}
                    {drive.venue && (
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                        <span className="text-gray-700">{drive.venue}</span>
                      </div>
                    )}

                    {/* Salary */}
                    {drive.salary && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="font-semibold text-gray-800">{drive.salary} LPA</span>
                      </div>
                    )}

                    {/* Roles */}
                    {drive.roles && (
                      <div className="flex items-start gap-2 text-sm">
                        <BookOpen className="w-4 h-4 text-gray-500 mt-0.5" />
                        <span className="text-gray-700">{drive.roles}</span>
                      </div>
                    )}

                    {/* Eligibility Criteria */}
                    <div className="border-t pt-3 mt-3">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Eligibility Criteria</h4>
                      <div className="space-y-1 text-xs text-gray-600">
                        {drive.tenth_percentage && (
                          <div>10th: ≥ {drive.tenth_percentage}%</div>
                        )}
                        {drive.twelfth_percentage && (
                          <div>12th: ≥ {drive.twelfth_percentage}%</div>
                        )}
                        {drive.cgpa && (
                          <div>CGPA: ≥ {drive.cgpa}</div>
                        )}
                        {drive.departments && (
                          <div>Departments: {drive.departments}</div>
                        )}
                        {drive.batch && (
                          <div>Batch: {drive.batch}</div>
                        )}
                      </div>
                    </div>

                    {/* Eligibility Status */}
                    {!registered && (
                      <div className={`p-2 rounded-lg ${eligible ? "bg-green-50" : "bg-red-50"}`}>
                        <div className="flex items-center gap-2">
                          {eligible ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600" />
                          )}
                          <span className={`text-sm font-medium ${eligible ? "text-green-700" : "text-red-700"}`}>
                            {eligible ? "You are eligible!" : "Not eligible"}
                          </span>
                        </div>
                        {!eligible && reasons.length > 0 && (
                          <div className="mt-2 text-xs text-red-600 space-y-1">
                            {reasons.map((reason, idx) => (
                              <div key={idx}>• {reason}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Registration Status */}
                    {registered && registration && (
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-5 h-5 text-blue-600" />
                          <span className="font-semibold text-blue-700">Registered</span>
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600">Status:</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                              getStatusBadge(registration.status).bg
                            } ${getStatusBadge(registration.status).text}`}>
                              {registration.status}
                            </span>
                          </div>
                          {registration.current_round && (
                            <div className="text-gray-600">
                              Current Round: <span className="font-medium">Round {registration.current_round}</span>
                            </div>
                          )}
                          {registration.placed && (
                            <div className="flex items-center gap-1 text-green-600 font-semibold mt-2">
                              <Award className="w-4 h-4" />
                              <span>Placed!</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Button */}
                    {!registered && (
                      <button
                        onClick={() => {
                          setSelectedDrive(drive);
                          setShowRegisterModal(true);
                        }}
                        disabled={!eligible || isPast}
                        className={`w-full py-2 rounded-lg font-medium transition ${
                          eligible && !isPast
                            ? "bg-blue-600 text-white hover:bg-blue-700"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                        }`}
                      >
                        {isPast ? "Drive Completed" : eligible ? "Register Now" : "Not Eligible"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Registration Confirmation Modal */}
      {showRegisterModal && selectedDrive && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Confirm Registration</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to register for the placement drive at{" "}
              <span className="font-semibold text-gray-800">{selectedDrive.company_name}</span>?
            </p>
            <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span>{new Date(selectedDrive.drive_date).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span>{selectedDrive.drive_time}</span>
              </div>
              {selectedDrive.venue && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span>{selectedDrive.venue}</span>
                </div>
              )}
              {selectedDrive.salary && (
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-gray-500" />
                  <span>{selectedDrive.salary} LPA</span>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleRegister}
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
              >
                {loading ? "Registering..." : "Confirm"}
              </button>
              <button
                onClick={() => {
                  setShowRegisterModal(false);
                  setSelectedDrive(null);
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentPlacementDrives;