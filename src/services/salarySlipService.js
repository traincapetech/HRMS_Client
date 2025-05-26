import apiClient from './apiService';

const salarySlipService = {
  // Generate salary slip for an employee
  generateSalarySlip: async (employeeId, salaryData) => {
    try {
      const response = await apiClient.post(`/salaryslip/generate/${employeeId}`, salaryData);
      return response.data;
    } catch (error) {
      console.error('Error generating salary slip:', error);
      throw error;
    }
  },

  // Download salary slip for an employee
  downloadSalarySlip: async (employeeId) => {
    try {
      const response = await apiClient.get(`/salaryslip/download/${employeeId}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error downloading salary slip:', error);
      throw error;
    }
  }
};

export default salarySlipService; 