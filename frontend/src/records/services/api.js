import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: 'http://localhost:4000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth services
export const login = (username, password) => api.post('/auth/login', { username, password });
export const getCurrentUser = () => api.get('/auth/me');

// Personal Information services
export const getPersonal = (userId) => api.get(`/personal/${userId}`);
export const createPersonal = (data) => {
  return api.post('/personal', data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
export const updatePersonal = (userId, data) => {
  return api.put(`/personal/${userId}`, data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
export const deletePersonal = (userId) => api.delete(`/personal/${userId}`);

// Personal Info entries (alternative endpoint)
export const getPersonalInfoEntries = () => api.get('/personal-info');
export const getPersonalInfoById = (id) => api.get(`/personal-info/${id}`);
export const getPersonalInfoByUserId = (userId) => api.get(`/personal-info/user/${userId}`);
export const createPersonalInfoEntry = (data) => api.post('/personal-info', data);
export const updatePersonalInfoEntry = (id, data) => api.put(`/personal-info/${id}`, data);
export const deletePersonalInfoEntry = (id) => api.delete(`/personal-info/${id}`);

// Education services
export const getEducationEntries = async () => {
  try {
    const response = await api.get('/education');
    console.log('Get Education Response:', response.data); // Debug log
    return response.data; // Backend returns { data: [...] }
  } catch (error) {
    console.error('Error fetching education entries:', error);
    throw error;
  }
};

export const getEducationEntry = async (id) => {
  try {
    const response = await api.get(`/education/${id}`);
    console.log('Get Education Entry Response:', response.data); // Debug log
    return { data: response.data }; // Wrap single entry in data object for consistency
  } catch (error) {
    console.error('Error fetching education entry:', error);
    throw error;
  }
};

export const createEducationEntry = async (data) => {
  try {
    console.log('Creating education entry with data:', data); // Debug log
    const response = await api.post('/education', data);
    console.log('Create Education Response:', response.data); // Debug log
    return response.data;
  } catch (error) {
    console.error('Error creating education entry:', error);
    throw error;
  }
};

export const updateEducationEntry = async (id, data) => {
  try {
    console.log('Updating education entry with ID:', id, 'Data:', data); // Debug log
    const response = await api.put(`/education/${id}`, data);
    console.log('Update Education Response:', response.data); // Debug log
    return response.data;
  } catch (error) {
    console.error('Error updating education entry:', error);
    throw error;
  }
};

export const deleteEducationEntry = async (id) => {
  try {
    console.log('Deleting education entry with ID:', id); // Debug log
    const response = await api.delete(`/education/${id}`);
    console.log('Delete Education Response:', response.data); // Debug log
    return response.data;
  } catch (error) {
    console.error('Error deleting education entry:', error);
    throw error;
  }
};

// Scholars services
export const getScholars = () => api.get('/scholars');
export const getScholar = (id) => api.get(`/scholars/${id}`);
export const createScholar = (data) => api.post('/scholars', data);
export const updateScholar = (id, data) => api.put(`/scholars/${id}`, data);
export const deleteScholar = (id) => api.delete(`/scholars/${id}`);

// Consultancy Proposals services
export const getProposals = () => api.get('/proposals');
export const getProposal = (id) => api.get(`/proposals/${id}`);
export const createProposal = (data) => api.post('/proposals', data);
export const updateProposal = (id, data) => api.put(`/proposals/${id}`, data);
export const deleteProposal = (id) => api.delete(`/proposals/${id}`);

// Consultancy Payment Details services
export const getPaymentDetails = (proposalId) => api.get(`/payment-details/proposal/${proposalId}`);
export const getPaymentDetail = (id) => api.get(`/payment-details/${id}`);
export const createPaymentDetail = (data) => api.post('/payment-details', data);
export const updatePaymentDetail = (id, data) => api.put(`/payment-details/${id}`, data);
export const deletePaymentDetail = (id) => api.delete(`/payment-details/${id}`);

// Project Proposals services (Funded Projects)
export const getProjectProposals = () => api.get('/project-proposal');
export const getProjectProposal = (id) => api.get(`/project-proposal/${id}`);
export const createProjectProposal = (data) => api.post('/project-proposal', data);
export const updateProjectProposal = (id, data) => api.put(`/project-proposal/${id}`, data);
export const deleteProjectProposal = (id) => api.delete(`/project-proposal/${id}`);

// Project Payment Details services
export const getProjectPaymentDetails = (proposalId) => api.get(`/project-payment-details/proposal/${proposalId}`);
export const getProjectPaymentDetail = (id) => api.get(`/project-payment-details/${id}`);
export const createProjectPaymentDetail = (data) => api.post('/project-payment-details', data);
export const updateProjectPaymentDetail = (id, data) => api.put(`/project-payment-details/${id}`, data);
export const deleteProjectPaymentDetail = (id) => api.delete(`/project-payment-details/${id}`);

// Events services
export const getEvents = () => api.get('/events');
export const getEvent = (id) => api.get(`/events/${id}`);
export const createEvent = (data) => api.post('/events', data);
export const updateEvent = (id, data) => api.put(`/events/${id}`, data);
export const deleteEvent = (id) => api.delete(`/events/${id}`);

// Industry Know-how services
export const getIndustryKnowhow = () => api.get('/industry');
export const getIndustryKnowhowItem = (id) => api.get(`/industry/${id}`);
export const createIndustryKnowhow = (data) => api.post('/industry', data);
export const updateIndustryKnowhow = (id, data) => api.put(`/industry/${id}`, data);
export const deleteIndustryKnowhow = (id) => api.delete(`/industry/${id}`);

// Certifications services
export const getCertifications = () => api.get('/certifications');
export const getCertification = (id) => api.get(`/certifications/${id}`);
export const createCertification = (data) => api.post('/certifications', data);
export const updateCertification = (id, data) => api.put(`/certifications/${id}`, data);
export const deleteCertification = (id) => api.delete(`/certifications/${id}`);

// Conferences services
export const getConferences = () => api.get('/conferences');
export const getConference = (id) => api.get(`/conferences/${id}`);
export const createConference = (data) => api.post('/conferences', data);
export const updateConference = (id, data) => api.put(`/conferences/${id}`, data);
export const deleteConference = (id) => api.delete(`/conferences/${id}`);

// Journals services
export const getJournals = () => api.get('/journals');
export const getJournal = (id) => api.get(`/journals/${id}`);
export const createJournal = (data) => api.post('/journals', data);
export const updateJournal = (id, data) => api.put(`/journals/${id}`, data);
export const deleteJournal = (id) => api.delete(`/journals/${id}`);

// Book Chapters services (Publications)
export const getBookChapters = () => api.get('/book-chapters');
export const getBookChapter = (id) => api.get(`/book-chapters/${id}`);
export const createBookChapter = (data) => api.post('/book-chapters', data);
export const updateBookChapter = (id, data) => api.put(`/book-chapters/${id}`, data);
export const deleteBookChapter = (id) => api.delete(`/book-chapters/${id}`);

// Events Organized services
export const getEventsOrganized = () => api.get('/events-organized');
export const getEventOrganized = (id) => api.get(`/events-organized/${id}`);
export const createEventOrganized = (data) => api.post('/events-organized', data);
export const updateEventOrganized = (id, data) => api.put(`/events-organized/${id}`, data);
export const deleteEventOrganized = (id) => api.delete(`/events-organized/${id}`);


// H-Index services
export const getHIndexes = () => api.get('/h-index');
export const getHIndex = (id) => api.get(`/h-index/${id}`);
export const createHIndex = (data) => api.post('/h-index', data);
export const updateHIndex = (id, data) => api.put(`/h-index/${id}`, data);
export const deleteHIndex = (id) => api.delete(`/h-index/${id}`);

// Resource Person services
export const getResourcePersonEntries = () => api.get('/resource-person');
export const getResourcePersonEntry = (id) => api.get(`/resource-person/${id}`);
export const createResourcePersonEntry = (data) => api.post('/resource-person', data);
export const updateResourcePersonEntry = (id, data) => api.put(`/resource-person/${id}`, data);
export const deleteResourcePersonEntry = (id) => api.delete(`/resource-person/${id}`);

// Recognition services
export const getRecognitionEntries = () => api.get('/recognition');
export const getRecognitionEntry = (id) => api.get(`/recognition/${id}`);
export const createRecognitionEntry = (data) => api.post('/recognition', data);
export const updateRecognitionEntry = (id, data) => api.put(`/recognition/${id}`, data);
export const deleteRecognitionEntry = (id) => api.delete(`/recognition/${id}`);

// Patent/Product Development services
export const getPatentEntries = () => api.get('/patent-product');
export const getPatentEntry = (id) => api.get(`/patent-product/${id}`);
export const createPatentEntry = (data) => api.post('/patent-product', data);
export const updatePatentEntry = (id, data) => api.put(`/patent-product/${id}`, data);
export const deletePatentEntry = (id) => api.delete(`/patent-product/${id}`);

// Project Mentors services
export const getProjectMentors = () => api.get('/project-mentors');
export const getProjectMentor = (id) => api.get(`/project-mentors/${id}`);
export const createProjectMentor = (data) => api.post('/project-mentors', data);
export const updateProjectMentor = (id, data) => api.put(`/project-mentors/${id}`, data);
export const deleteProjectMentor = (id) => api.delete(`/project-mentors/${id}`);

// Seed Money services
export const getSeedMoneyEntries = () => api.get('/seed-money');
export const getSeedMoneyEntry = (id) => api.get(`/seed-money/${id}`);
export const createSeedMoneyEntry = (data) => api.post('/seed-money', data);
export const updateSeedMoneyEntry = (id, data) => api.put(`/seed-money/${id}`, data);
export const deleteSeedMoneyEntry = (id) => api.delete(`/seed-money/${id}`);

// REAL-TIME DASHBOARD STATS SERVICE
export const getDashboardStats = async () => {
  try {
    // Fetch all data concurrently for better performance
    const [
      
      seedMoneyResponse,
      scholarsResponse,
      proposalsResponse,
      projectProposalsResponse,
      eventsResponse,
      industryResponse,
      certificationsResponse,
      publicationsResponse,
      eventsOrganizedResponse,
      hIndexResponse,
      resourcePersonResponse,
      recognitionResponse,
      patentsResponse,
      projectMentorsResponse
    ] = await Promise.all([
      api.get('/seed-money').catch(() => ({ data: [] })),
      api.get('/scholars').catch(() => ({ data: [] })),
      api.get('/proposals').catch(() => ({ data: [] })),
      api.get('/project-proposal').catch(() => ({ data: [] })),
      api.get('/events').catch(() => ({ data: [] })),
      api.get('/industry').catch(() => ({ data: [] })),
      api.get('/certifications').catch(() => ({ data: [] })),
      api.get('/book-chapters').catch(() => ({ data: [] })),
      api.get('/other/events-organized').catch(() => ({ data: [] })),
      api.get('/h-index').catch(() => ({ data: [] })),
      api.get('/resource-person').catch(() => ({ data: [] })),
      api.get('/recognition').catch(() => ({ data: [] })),
      api.get('/patent-product').catch(() => ({ data: [] })),
      api.get('/project-mentors').catch(() => ({ data: [] }))
    ]);

    // Return aggregated stats
    return {
      data: {
        seedmoney: Array.isArray(seedMoneyResponse.data) ? seedMoneyResponse.data.length : 0,
        scholars: Array.isArray(scholarsResponse.data) ? scholarsResponse.data.length : 0,
        proposals: Array.isArray(proposalsResponse.data) ? proposalsResponse.data.length : 0,
        projectProposals: Array.isArray(projectProposalsResponse.data) ? projectProposalsResponse.data.length : 0,
        events: Array.isArray(eventsResponse.data) ? eventsResponse.data.length : 0,
        industry: Array.isArray(industryResponse.data) ? industryResponse.data.length : 0,
        certifications: Array.isArray(certificationsResponse.data) ? certificationsResponse.data.length : 0,
        publications: Array.isArray(publicationsResponse.data) ? publicationsResponse.data.length : 0,
        eventsOrganized: Array.isArray(eventsOrganizedResponse.data) ? eventsOrganizedResponse.data.length : 0,
        hIndex: Array.isArray(hIndexResponse.data) ? hIndexResponse.data.length : 0,
        resourcePerson: Array.isArray(resourcePersonResponse.data) ? resourcePersonResponse.data.length : 0,
        recognition: Array.isArray(recognitionResponse.data) ? recognitionResponse.data.length : 0,
        patents: Array.isArray(patentsResponse.data) ? patentsResponse.data.length : 0,
        projectMentors: Array.isArray(projectMentorsResponse.data) ? projectMentorsResponse.data.length : 0
      }
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
};

// ALTERNATIVE: If your backend has a dedicated dashboard stats endpoint
export const getDashboardStatsOptimized = () => api.get('/other/dashboard-stats');

// Real-time WebSocket connection for live updates (if your backend supports it)
export const createWebSocketConnection = (onStatsUpdate) => {
  const wsUrl = 'ws://localhost:5000/ws/dashboard';
  const socket = new WebSocket(wsUrl);
  
  socket.onopen = () => {
    console.log('WebSocket connected for real-time dashboard updates');
  };
  
  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === 'STATS_UPDATE') {
        onStatsUpdate(data.stats);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  };
  
  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
  
  socket.onclose = () => {
    console.log('WebSocket connection closed');
    // Attempt to reconnect after 5 seconds
    setTimeout(() => {
      createWebSocketConnection(onStatsUpdate);
    }, 5000);
  };
  
  return socket;
};

// Polling service for real-time updates (alternative to WebSocket)
export const createPollingService = (onStatsUpdate, interval = 5000) => {
  const pollStats = async () => {
    try {
      const response = await getDashboardStats();
      onStatsUpdate(response.data);
    } catch (error) {
      console.error('Error polling dashboard stats:', error);
    }
  };
  
  const intervalId = setInterval(pollStats, interval);
  
  // Initial fetch
  pollStats();
  
  // Return cleanup function
  return () => clearInterval(intervalId);
};

// Batch operations for better performance
export const batchGetStats = async (endpoints) => {
  const requests = endpoints.map(endpoint => api.get(endpoint).catch(() => ({ data: [] })));
  const responses = await Promise.all(requests);
  return responses.map(response => Array.isArray(response.data) ? response.data.length : 0);
};

// Cache service for dashboard data
const CACHE_DURATION = 30000; // 30 seconds
const statsCache = {
  data: null,
  timestamp: 0
};

export const getCachedDashboardStats = async () => {
  const now = Date.now();
  
  if (statsCache.data && (now - statsCache.timestamp) < CACHE_DURATION) {
    return { data: statsCache.data };
  }
  
  const response = await getDashboardStats();
  statsCache.data = response.data;
  statsCache.timestamp = now;
  
  return response;
};

// Clear cache when data is updated
export const clearStatsCache = () => {
  statsCache.data = null;
  statsCache.timestamp = 0;
};

export default api;