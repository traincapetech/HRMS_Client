import apiClient from './apiService';

const hrService = {
  // Create HR personnel
  createHr: async (hrData) => {
    try {
      console.log('Creating new HR personnel:', hrData);
      const response = await apiClient.post('/hrs', hrData);
      console.log('HR personnel created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating HR personnel:', error);
      throw error;
    }
  },

  // Get all HRs
  getAllHrs: async () => {
    try {
      console.log('Fetching all HR personnel...');
      const response = await apiClient.get('/hrs');
      console.log('HR personnel fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error getting HR personnel:', error);
      return [];
    }
  },

  // Get HR by ID
  getHrById: async (id) => {
    try {
      console.log(`Fetching HR with ID ${id}...`);
      const response = await apiClient.get(`/hrs/${id}`);
      console.log('HR fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error getting HR with ID ${id}:`, error);
      return null;
    }
  },

  // Delete HR
  deleteHr: async (id) => {
    try {
      console.log(`Deleting HR with ID ${id}...`);
      const response = await apiClient.delete(`/hrs/${id}`);
      console.log('HR deleted successfully');
      return response.data;
    } catch (error) {
      console.error(`Error deleting HR with ID ${id}:`, error);
      throw error;
    }
  }
};

export default hrService; 