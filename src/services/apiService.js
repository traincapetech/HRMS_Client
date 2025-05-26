import axios from 'axios';
import authService from './authService';

// Direct backend URL
const BACKEND_URL = 'https://employee-management-system-pahv.onrender.com/api';

// Create a client with retry and fallback capability
const createAxiosClient = () => {
  const client = axios.create({
    baseURL: BACKEND_URL,
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 5000  // 5 second timeout
  });
  
  // Add request interceptor
  client.interceptors.request.use(
    (config) => {
      const token = authService.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log(`Setting auth token: ${token.substring(0, 15)}...`);
      }
      
      // For multipart/form-data requests
      if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
        config.headers['Accept'] = 'application/json';
        config.transformRequest = [];
      }
      
      return config;
    },
    (error) => Promise.reject(error)
  );
  
  // Add response interceptor with fallback to proxy
  client.interceptors.response.use(
    (response) => {
      console.log('Response success for:', response.config.url);
      return response;
    },
    async (error) => {
      const originalRequest = error.config;
      
      // If the error is due to CORS and we haven't tried the proxy yet
      if ((error.message.includes('Network Error') || 
           error.code === 'ERR_NETWORK' || 
           error.response?.status === 0) && 
          !originalRequest._retryWithProxy) {
        
        console.log('Request failed, trying with proxy:', originalRequest.url);
        originalRequest._retryWithProxy = true;
        
        // Create proxy URL
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(originalRequest.url)}`;
        
        try {
          // Make a new request using the proxy
          const proxyResponse = await axios({
            ...originalRequest,
            url: proxyUrl,
            baseURL: null, // Don't use the base URL
          });
          
          console.log('Proxy request successful');
          return proxyResponse;
        } catch (proxyError) {
          console.error('Proxy request also failed:', proxyError.message);
          return Promise.reject(proxyError);
        }
      }
      
      // Handle token expiration
      if (error.response && error.response.status === 401) {
        console.log('Authentication failed - logging out');
        authService.logout();
        window.location.href = '/login';
      }
      
      return Promise.reject(error);
    }
  );
  
  return client;
};

const apiClient = createAxiosClient();

export default apiClient;