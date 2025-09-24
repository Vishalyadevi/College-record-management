import React, { useState } from "react";
import { FaEnvelope, FaInfoCircle, FaCheck, FaTimes, FaPaperPlane, FaBell } from "react-icons/fa";
import { useDashboardContext } from "../../contexts/DashboardContext.jsx";
import { toast } from "react-toastify";

const Dashboard = () => {
  const {
    internships = [],
    scholarships = [],
    leaves = [],
    events = [],
    eventsAttended = [],
    onlineCourses = [],
    achievements = [],
    selectedItem,
    showCommonMessage,
    email,
    commonMessage,
    actionType,
    notifications = [],
    isLoading,
    setState,
    handleSendMessage,
    handleAction,
    addNotification,
    removeNotification
  } = useDashboardContext();

  const [activeTab, setActiveTab] = useState("internships");
  const backendUrl = "http://localhost:4000";

  const tabs = [
    { id: "internships", name: "Pending Internships", data: Array.isArray(internships) ? internships : [] },
    { id: "scholarships", name: "Pending Scholarships", data: Array.isArray(scholarships) ? scholarships : [] },
    { id: "leaves", name: "Pending Leaves", data: Array.isArray(leaves) ? leaves : [] },
    { id: "events", name: "Pending Events", data: Array.isArray(events) ? events : [] },
    { id: "eventsAttended", name: "Pending Events Attended", data: Array.isArray(eventsAttended) ? eventsAttended : [] },
    { id: "onlineCourses", name: "Pending Online Courses", data: Array.isArray(onlineCourses) ? onlineCourses : [] },
    { id: "achievements", name: "Pending Achievements", data: Array.isArray(achievements) ? achievements : [] }
  ];

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setState(prev => ({ ...prev, selectedItem: null }));
  };

  const formatFieldName = (key) => {
    return key
      .replace(/_/g, ' ')
      .replace(/(?:^|\s)\S/g, a => a.toUpperCase())
      .replace(/Id/g, '')
      .replace(/^Is /, '')
      .trim();
  };

  const formatValue = (value) => {
    if (value === null || value === undefined || value === "") {
      return "Not Provided";
    }
    
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    
    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(', ') : 'None';
    }
    
    if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
      return new Date(value).toLocaleDateString();
    }
    
    if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
      return new Date(value).toLocaleString();
    }
    
    return value.toString();
  };

  const renderItemDetails = (item) => {
    if (!item) return <p className="text-sm text-gray-500">No details available</p>;

    // Determine upload path based on item type
    const getUploadPath = () => {
      switch (item.approvetype) {
        case 'internship': return 'uploads/';
        case 'leave': return 'uploads/leaves/';
        case 'online-course': return 'uploads/certificates/';
        case 'achievement': return 'uploads/achievements/';
        case 'event-attended': return 'uploads/event/';
        default: return 'uploads/';
      }
    };
    const baseUploadPath = getUploadPath();

    // Fields to exclude from display
    const excludedFields = [
      "id", "_id", "_v", "__v", "created_at", "updated_at", "createdAt", "updatedAt",
      "Userid", "Created_by", "Updated_by", "pending", "tutor_approval_status", 
      "Approved_by", "approved_at", "messages", "updated_by", "created_by", 
      "approvetype", "approved_by", "staffId", "status", "studentId", "userId","stateID","districtID"
    ];

    // Document fields configuration
    const documentFieldsConfig = {
      'internship': ['document', 'certificate'],
      'scholarship': ['document', 'proof'],
      'event': ['document'],
      'event-attended': ['certificate_file', 'memento_proof', 'cash_prize_proof'],
      'leave': ['document'],
      'online-course': ['certificate_file', 'certificates'],
      'achievement': ['certificate_file']
    };

    const renderDocumentLink = (value) => {
      if (!value) return "Not Provided";
      
      try {
        // Handle array of files
        if (Array.isArray(value)) {
          if (value.length === 0) return "Not Provided";
          
          return (
            <div className="flex flex-col gap-1">
              {value.map((file, index) => {
                const stringValue = String(file);
                if (!stringValue.trim()) return null;
                
                const documentPath = stringValue.startsWith('uploads/') 
                  ? stringValue 
                  : `${baseUploadPath}${stringValue}`;
                
                return (
                  <a
                    key={index}
                    href={`${backendUrl}/${encodeURI(documentPath.replace(/\\/g, "/"))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    View Document {value.length > 1 ? index + 1 : ''}
                  </a>
                );
              })}
            </div>
          );
        }
        
        // Handle single file
        const stringValue = String(value);
        if (!stringValue.trim()) return "Not Provided";
        
        const documentPath = stringValue.startsWith('uploads/') 
          ? stringValue 
          : `${baseUploadPath}${stringValue}`;
        
        return (
          <a
            href={`${backendUrl}/${encodeURI(documentPath.replace(/\\/g, "/"))}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            View Document
          </a>
        );
      } catch (error) {
        console.error("Error rendering document link:", error);
        return "Invalid Document";
      }
    };
    const renderField = (key) => {
      const value = item[key];
      const displayKey = formatFieldName(key);
      const isDocumentField = documentFieldsConfig[item.approvetype]?.includes(key);

      if (isDocumentField) {
        return (
          <div key={key} className="mb-2">
            <p className="text-sm text-gray-700">
              <span className="font-medium">{displayKey}:</span> {renderDocumentLink(value)}
            </p>
          </div>
        );
      }

      if (key === 'achievement_details' && value && typeof value === 'object') {
        return (
          <div key={key} className="mb-3">
            <h3 className="font-semibold text-gray-800 mb-1">{displayKey}:</h3>
            <div className="bg-gray-100 p-3 rounded-md">
              {Object.entries(value).map(([subKey, subValue]) => {
                const subDisplayKey = formatFieldName(subKey);
                const isSubDocField = ['memento_proof', 'cash_prize_proof', 'certificate_file'].includes(subKey);
      
                if (isSubDocField) {
                  // Handle cases where the value might be an object instead of string
                  const getDocumentValue = (val) => {
                    if (!val) return null;
                    if (typeof val === 'string') return val;
                    if (val.path) return val.path; // If it's a file object with path property
                    if (val.url) return val.url;   // If it's a file object with url property
                    return null;
                  };
      
                  const documentValue = Array.isArray(subValue) 
                    ? subValue.map(getDocumentValue).filter(Boolean)
                    : getDocumentValue(subValue);
      
                  if (!documentValue || (Array.isArray(documentValue) && documentValue.length === 0)) {
                    return (
                      <div key={subKey} className="mb-1">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">{subDisplayKey}:</span> Not Provided
                        </p>
                      </div>
                    );
                  }
      
                  if (Array.isArray(documentValue)) {
                    return (
                      <div key={subKey} className="mb-1">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">{subDisplayKey}:</span>
                          <div className="flex flex-col gap-1 mt-1">
                            {documentValue.map((file, index) => {
                              const documentPath = file.startsWith('uploads/') 
                                ? file 
                                : `uploads/event/${file}`;
                              
                              return (
                                <a
                                  key={index}
                                  href={`${backendUrl}/${encodeURI(documentPath.replace(/\\/g, "/"))}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-500 hover:underline"
                                >
                                  View {subDisplayKey} {documentValue.length > 1 ? index + 1 : ''}
                                </a>
                              );
                            })}
                          </div>
                        </p>
                      </div>
                    );
                  }
      
                  const documentPath = documentValue.startsWith('uploads/') 
                    ? documentValue 
                    : `uploads/event/${documentValue}`;
      
                  return (
                    <div key={subKey} className="mb-1">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">{subDisplayKey}:</span>
                        <a
                          href={`${backendUrl}/${encodeURI(documentPath.replace(/\\/g, "/"))}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline ml-1"
                        >
                          View {subDisplayKey}
                        </a>
                      </p>
                    </div>
                  );
                }
      
                return (
                  <div key={subKey} className="mb-1">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">{subDisplayKey}:</span> {formatValue(subValue)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }

      return (
        <div key={key} className="mb-2">
          <p className="text-sm text-gray-700">
            <span className="font-medium">{displayKey}:</span> {formatValue(value)}
          </p>
        </div>
      );
    };

    // Priority fields configuration
    const priorityFields = {
      'internship': ['username', 'regno', 'company', 'position', 'duration', 'description'],
      'scholarship': ['username', 'regno', 'institution_name', 'amount', 'duration', 'reason'],
      'event': ['username', 'regno', 'event_name', 'event_type', 'description', 'from_date', 'to_date'],
      'event-attended': ['username', 'regno', 'event_name', 'event_type', 'description', 'date', 'achievement_details'],
      'leave': ['username', 'regno', 'reason', 'from_date', 'to_date', 'type'],
      'online-course': ['username', 'regno', 'course_name', 'platform', 'duration', 'description'],
      'achievement': ['username', 'regno', 'title', 'description', 'category', 'date', 'achievement_details']
    };

    // Get all fields except excluded ones
    const allFields = Object.keys(item)
      .filter(key => !excludedFields.includes(key))
      .sort((a, b) => {
        const priorityA = priorityFields[item.approvetype]?.indexOf(a) ?? -1;
        const priorityB = priorityFields[item.approvetype]?.indexOf(b) ?? -1;
        
        if (priorityA !== -1 && priorityB !== -1) return priorityA - priorityB;
        if (priorityA !== -1) return -1;
        if (priorityB !== -1) return 1;
        return a.localeCompare(b);
      });

    // Group fields into categories
    const basicInfoFields = [];
    const documentFields = [];
    const otherFields = [];

    allFields.forEach(key => {
      if (priorityFields[item.approvetype]?.includes(key)) {
        basicInfoFields.push(key);
      } else if (documentFieldsConfig[item.approvetype]?.includes(key) || key === 'achievement_details') {
        documentFields.push(key);
      } else {
        otherFields.push(key);
      }
    });

    return (
      <div className="space-y-4">
        {/* Basic Information Section */}
        {basicInfoFields.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-3 border-b pb-1">Basic Information</h3>
            {basicInfoFields.map(renderField)}
          </div>
        )}

        {/* Documents Section */}
        {documentFields.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-3 border-b pb-1">Documents & Achievements</h3>
            {documentFields.map(renderField)}
          </div>
        )}

        {/* Additional Information Section */}
        {otherFields.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-3 border-b pb-1">Additional Information</h3>
            {otherFields.map(renderField)}
          </div>
        )}
      </div>
    );
  };

  const renderPendingItems = (items = []) => {
    if (isLoading) {
      return <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>;
    }

    if (!items || items.length === 0) {
      return <p className="text-sm text-gray-600">No pending items at the moment.</p>;
    }

    return items.map((item) => {
      const isOnlineCourse = activeTab === "onlineCourses";
      const isAchievement = activeTab === "achievements";
      
      const title = isOnlineCourse 
        ? item.course_name || item.name || "Online Course"
        : isAchievement
        ? item.title || item.achievement_name || "Achievement"
        : item.username || item.name || item.event_name || "N/A";
      
      const subtitle = isOnlineCourse
        ? `${item.platform ? `Platform: ${item.platform}` : ''}${item.duration ? ` | Duration: ${item.duration}` : ''}`
        : isAchievement
        ? `${item.description || ''}${item.category ? ` | Category: ${item.category}` : ''}`
        : item?.description || item?.reason || item?.club_name || item?.institution_name || "";

      return (
        <div
          key={item?.id || Math.random()}
          className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow flex justify-between items-center"
        >
          <div className="w-3/4">
            <p className="text-lg font-semibold text-gray-800">
              {title}
              {item?.regno && ` (Reg No: ${item.regno})`}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              {subtitle}
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setState(prev => ({ ...prev, selectedItem: item, actionType: "info" }))}
              className="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 transition-colors"
            >
              <FaInfoCircle />
            </button>
            <button
              onClick={() => setState(prev => ({ ...prev, selectedItem: item, actionType: "approve" }))}
              className="bg-green-500 text-white p-2 rounded-md hover:bg-green-600 transition-colors"
            >
              <FaCheck />
            </button>
            <button
              onClick={() => setState(prev => ({ ...prev, selectedItem: item, actionType: "reject" }))}
              className="bg-red-500 text-white p-2 rounded-md hover:bg-red-600 transition-colors"
            >
              <FaTimes />
            </button>
          </div>
        </div>
      );
    });
  };

  const currentTab = tabs.find(tab => tab.id === activeTab);
  const currentTabData = currentTab?.data || [];

  return (
    <div className="flex flex-col h-screen p-6 space-y-6 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Approval Dashboard</h1>
        <div className="flex space-x-4">
          <div className="relative">
            <FaBell
              onClick={() => addNotification(`You have ${currentTabData.length} pending ${activeTab} to approve/reject.`)}
              className="text-gray-600 text-xl cursor-pointer hover:text-blue-500 transition-colors"
            />
            {currentTabData.length > 0 && (
              <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 transform translate-x-1/2 -translate-y-1/2">
                {currentTabData.length}
              </span>
            )}
          </div>
          <FaEnvelope
            onClick={() => setState(prev => ({ ...prev, showCommonMessage: !prev.showCommonMessage }))}
            className="text-gray-600 text-xl cursor-pointer hover:text-blue-500 transition-colors"
          />
        </div>
      </div>

      {notifications.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Notifications</h2>
          {notifications.map((notification) => (
            <div key={notification.id} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-md transition-colors">
              <p className="text-sm text-gray-700">{notification.message}</p>
              <button
                onClick={() => removeNotification(notification.id)}
                className="text-red-500 hover:text-red-600 text-sm transition-colors"
              >
                Dismiss
              </button>
            </div>
          ))}
        </div>
      )}

      {showCommonMessage && (
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Send Warning / Response</h2>
          <input
            type="email"
            placeholder="Student Email"
            value={email}
            onChange={(e) => setState(prev => ({ ...prev, email: e.target.value }))}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3 text-sm"
          />
          <textarea
            placeholder="Enter your message..."
            value={commonMessage}
            onChange={(e) => setState(prev => ({ ...prev, commonMessage: e.target.value }))}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3 text-sm"
            rows="3"
          />
          <div className="flex justify-end space-x-2">
            <button
              className="bg-blue-500 text-white px-4 py-1.5 rounded-md hover:bg-blue-600 transition-colors text-sm"
              onClick={() => handleSendMessage("Reply")}
            >
              Reply
            </button>
            <button
              className="bg-yellow-500 text-white px-4 py-1.5 rounded-md hover:bg-yellow-600 transition-colors text-sm"
              onClick={() => handleSendMessage("Warning")}
            >
              Warning
            </button>
          </div>
        </div>
      )}

      <div className="flex space-x-2 border-b border-gray-200 overflow-x-auto pb-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`px-4 py-2 text-sm font-semibold whitespace-nowrap ${
              activeTab === tab.id
                ? "border-b-2 border-blue-500 text-blue-500"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => handleTabChange(tab.id)}
          >
            {tab.name} ({tab.data.length})
          </button>
        ))}
      </div>

      <div className="space-y-4 flex-1 overflow-y-auto">
        <h1 className="text-xl font-bold text-gray-800">
          {currentTab?.name || "Pending Items"}
        </h1>
        {renderPendingItems(currentTabData)}
      </div>

      {selectedItem && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {actionType === "info" ? "Details" : actionType === "approve" ? "Approve" : "Reject"}
            </h2>

            {actionType === "info" ? (
              <>
                <div className="mb-4 bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-gray-700">
                    <span className="font-semibold">Name:</span>{" "}
                    {selectedItem.username || selectedItem.name || selectedItem.event_name || selectedItem.course_name || selectedItem.title || "N/A"}
                  </p>
                  {selectedItem.regno && (
                    <p className="text-sm font-medium text-gray-700">
                      <span className="font-semibold">Reg No:</span> {selectedItem.regno}
                    </p>
                  )}
                </div>
                {renderItemDetails(selectedItem)}
              </>
            ) : (
              <div>
                <p className="text-sm font-semibold text-gray-800 mb-3">
                  Are you sure you want to {actionType} this?
                </p>
                <div className="flex items-center border border-gray-300 rounded-full p-2 bg-gray-100">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={commonMessage}
                    onChange={(e) => setState(prev => ({ ...prev, commonMessage: e.target.value }))}
                    className="flex-1 bg-transparent outline-none px-2 text-sm"
                  />
                  <FaPaperPlane
                    className="text-blue-500 text-lg cursor-pointer hover:text-blue-600 transition-colors"
                    onClick={() => handleAction(selectedItem, actionType)}
                  />
                </div>
              </div>
            )}

            <button
              onClick={() => setState(prev => ({ ...prev, selectedItem: null, actionType: null }))}
              className="mt-4 bg-red-500 text-white px-4 py-1.5 rounded-md hover:bg-red-600 transition-colors text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;