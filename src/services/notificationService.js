import apiClient from './apiService';

const notificationService = {
  // Get notifications for a recipient
  getNotifications: async (recipientId) => {
    try {
      const response = await apiClient.get(`/notifications/${recipientId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting notifications:', error);
      throw error;
    }
  },

  // Mark notification as read
  markAsRead: async (id) => {
    try {
      const response = await apiClient.put(`/notifications/${id}/read`);
      return response.data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  // Send a notification
  sendNotification: async (notificationData) => {
    try {
      const response = await apiClient.post('/notifications/send', notificationData);
      return response.data;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }
};

export default notificationService; 