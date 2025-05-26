import apiClient from './apiService';
import authService from './authService';

// Attendance status types from backend
export const AttendanceStatus = {
  PRESENT: 'PRESENT',
  ABSENT: 'ABSENT',
  LEAVE: 'LEAVE',
  HALF_DAY: 'HALF_DAY'
};

// Get attendance for a specific date with fallback to individual lookups
const getAttendanceByDate = async (date) => {
  try {
    // First try the range endpoint
    const response = await apiClient.get(`/attendance/range?startDate=${date}&endDate=${date}`);
    
    // If we got data, return it
    if (response.data && response.data.length > 0) {
      return response.data;
    }
    
    // If no data from range endpoint, check session storage
    const storedAttendance = sessionStorage.getItem(`attendance_${date}`);
    if (storedAttendance) {
      try {
        const parsedAttendance = JSON.parse(storedAttendance);
        return parsedAttendance;
      } catch (e) {
        console.error('Error parsing stored attendance:', e);
      }
    }
    
    // Return empty array if everything fails
    return [];
  } catch (error) {
    console.error('Error fetching attendance by date:', error);
    
    // Try to get stored attendance as a fallback
    const storedAttendance = sessionStorage.getItem(`attendance_${date}`);
    if (storedAttendance) {
      try {
        return JSON.parse(storedAttendance);
      } catch (e) {
        console.error('Error parsing stored attendance:', e);
      }
    }
    
    return [];
  }
};

// Store attendance record in session storage for immediate UI updates
const storeAttendanceRecord = (date, employeeId, status, note) => {
  try {
    // Get existing records for today
    const storedAttendance = sessionStorage.getItem(`attendance_${date}`);
    let records = [];
    
    if (storedAttendance) {
      records = JSON.parse(storedAttendance);
    }
    
    // Find if this employee already has a record for today
    const existingIndex = records.findIndex(record => record.employeeId === employeeId);
    
    if (existingIndex >= 0) {
      // Update existing record
      records[existingIndex] = {
        ...records[existingIndex],
        status,
        note,
        updatedAt: new Date().toISOString()
      };
    } else {
      // Add new record
      records.push({
        employeeId,
        date,
        status,
        note,
        id: `local-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    
    // Store back in session storage
    sessionStorage.setItem(`attendance_${date}`, JSON.stringify(records));
    
    return records;
  } catch (e) {
    console.error('Error storing attendance in session storage:', e);
    return [];
  }
};

// Get attendance for a specific employee
const getAttendanceByEmployee = async (employeeId) => {
  try {
    const response = await apiClient.get(`/attendance/${employeeId}/report`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching attendance for employee ${employeeId}:`, error);
    return [];
  }
};

// Get attendance report for an employee (used in dashboard)
const getAttendanceReport = async (employeeId) => {
  try {
    const response = await apiClient.get(`/attendance/${employeeId}/report`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching attendance report for employee ${employeeId}:`, error);
    return [];
  }
};

// Check in for an employee
const checkIn = async (employeeId, time) => {
  try {
    // Convert time format if needed (HH:MM:SS)
    const response = await apiClient.post(`/attendance/${employeeId}/checkin?time=${time}`);
    return response.data;
  } catch (error) {
    console.error('Error during check-in:', error);
    throw error;
  }
};

// Check out for an employee
const checkOut = async (employeeId, time) => {
  try {
    // Convert time format if needed (HH:MM:SS)
    const response = await apiClient.post(`/attendance/${employeeId}/checkout?time=${time}`);
    return response.data;
  } catch (error) {
    console.error('Error during check-out:', error);
    throw error;
  }
};

// Mark attendance for a single employee
const markAttendance = async (attendanceData) => {
  try {
    // Extract the status or default to PRESENT
    const status = attendanceData.status || AttendanceStatus.PRESENT;
    
    // Validate that the status is one of the allowed values
    if (!Object.values(AttendanceStatus).includes(status)) {
      throw new Error(`Invalid attendance status: ${status}`);
    }
    
    // Make the API call
    const response = await apiClient.post(`/attendance/${attendanceData.employeeId}/mark?status=${status}`);
    
    // Add the status to the response data if not included in the response
    if (response.data && !response.data.status) {
      response.data.status = status;
    }
    
    // Store in local session storage for immediate UI updates
    const formattedDate = attendanceData.date || new Date().toISOString().split('T')[0];
    storeAttendanceRecord(formattedDate, attendanceData.employeeId, status, attendanceData.note || '');
    
    return response.data;
  } catch (error) {
    console.error('Error marking attendance:', error);
    
    // Even if the API fails, still update the local storage to provide UI feedback
    // This is useful during development or when backend is unavailable
    try {
      const formattedDate = attendanceData.date || new Date().toISOString().split('T')[0];
      storeAttendanceRecord(
        formattedDate,
        attendanceData.employeeId,
        attendanceData.status || AttendanceStatus.PRESENT,
        attendanceData.note || ''
      );
    } catch (e) {
      console.error('Failed to update local storage after API failure:', e);
    }
    
    throw error;
  }
};

// Mark attendance for multiple employees at once
const markBulkAttendance = async (bulkAttendanceData) => {
  try {
    // Since there's no bulk endpoint, mark each employee individually
    const results = [];
    const status = bulkAttendanceData.status || AttendanceStatus.PRESENT;
    const formattedDate = bulkAttendanceData.date || new Date().toISOString().split('T')[0];
    
    // Validate that the status is one of the allowed values
    if (!Object.values(AttendanceStatus).includes(status)) {
      throw new Error(`Invalid attendance status: ${status}`);
    }
    
    const allEmployeeIds = bulkAttendanceData.employeeIds || [];
    
    // Track successful and failed operations
    const successful = [];
    const failed = [];
    
    for (const employeeId of allEmployeeIds) {
      try {
        const result = await apiClient.post(`/attendance/${employeeId}/mark?status=${status}`);
        
        // Add the status to the response data if not included
        if (result.data && !result.data.status) {
          result.data.status = status;
        }
        
        // Store in local session storage for immediate UI updates
        storeAttendanceRecord(formattedDate, employeeId, status, bulkAttendanceData.note || '');
        
        successful.push(employeeId);
        results.push(result.data);
      } catch (err) {
        console.error(`Error marking attendance for employee ${employeeId}:`, err);
        // Continue with other employees even if one fails
        failed.push(employeeId);
        
        // Still update local storage even if API fails
        storeAttendanceRecord(formattedDate, employeeId, status, bulkAttendanceData.note || '');
        
        results.push({ 
          employeeId, 
          status, 
          error: true,
          message: err.message || 'Unknown error'
        });
      }
    }
    
    // Show warning if some operations failed
    if (failed.length > 0) {
      console.warn(`Attendance marking failed for ${failed.length} employees, but succeeded for ${successful.length} employees`);
    }
    
    return results;
  } catch (error) {
    console.error('Error marking bulk attendance:', error);
    
    // Try to update local storage even if the main operation failed
    try {
      const formattedDate = bulkAttendanceData.date || new Date().toISOString().split('T')[0];
      const status = bulkAttendanceData.status || AttendanceStatus.PRESENT;
      
      for (const employeeId of bulkAttendanceData.employeeIds || []) {
        storeAttendanceRecord(formattedDate, employeeId, status, bulkAttendanceData.note || '');
      }
    } catch (e) {
      console.error('Failed to update local storage after bulk API failure:', e);
    }
    
    throw error;
  }
};

// Update an existing attendance record
const updateAttendance = async (id, attendanceData) => {
  try {
    const response = await apiClient.put(`/attendance/${id}`, attendanceData);
    
    // Update local storage as well
    if (attendanceData.date && attendanceData.employeeId) {
      storeAttendanceRecord(
        attendanceData.date,
        attendanceData.employeeId,
        attendanceData.status,
        attendanceData.note || ''
      );
    }
    
    return response.data;
  } catch (error) {
    console.error(`Error updating attendance record ${id}:`, error);
    throw error;
  }
};

// Delete an attendance record - No direct endpoint, but keeping for API completeness
const deleteAttendance = async (id) => {
  try {
    console.warn('Delete attendance endpoint not available in backend');
    return { success: false, message: 'Operation not supported' };
  } catch (error) {
    console.error(`Error deleting attendance record ${id}:`, error);
    throw error;
  }
};

// Get attendance statistics (present/absent count) for a date range
const getAttendanceStats = async (startDate, endDate) => {
  try {
    const response = await apiClient.get(`/attendance/range?startDate=${startDate}&endDate=${endDate}`);
    
    // Process the data to get statistics
    const data = response.data || [];
    
    // If no data from API, try to get from session storage for today
    let combinedData = [...data];
    
    if (data.length === 0 && startDate === endDate) {
      const storedAttendance = sessionStorage.getItem(`attendance_${startDate}`);
      if (storedAttendance) {
        try {
          const parsedAttendance = JSON.parse(storedAttendance);
          combinedData = parsedAttendance;
        } catch (e) {
          console.error('Error parsing stored attendance for stats:', e);
        }
      }
    }
    
    const totalPresent = combinedData.filter(a => a.status === AttendanceStatus.PRESENT).length;
    const totalAbsent = combinedData.filter(a => a.status === AttendanceStatus.ABSENT).length;
    const totalHalfDay = combinedData.filter(a => a.status === AttendanceStatus.HALF_DAY).length;
    const totalLeave = combinedData.filter(a => a.status === AttendanceStatus.LEAVE).length;
    
    // Group by employee
    const employeeMap = {};
    combinedData.forEach(record => {
      if (!employeeMap[record.employeeId]) {
        employeeMap[record.employeeId] = { 
          present: 0, 
          absent: 0,
          halfDay: 0,
          leave: 0
        };
      }
      
      if (record.status === AttendanceStatus.PRESENT) {
        employeeMap[record.employeeId].present++;
      } else if (record.status === AttendanceStatus.ABSENT) {
        employeeMap[record.employeeId].absent++;
      } else if (record.status === AttendanceStatus.HALF_DAY) {
        employeeMap[record.employeeId].halfDay++;
      } else if (record.status === AttendanceStatus.LEAVE) {
        employeeMap[record.employeeId].leave++;
      }
    });
    
    const employeeStats = Object.keys(employeeMap).map(id => ({
      employeeId: id,
      present: employeeMap[id].present,
      absent: employeeMap[id].absent,
      halfDay: employeeMap[id].halfDay,
      leave: employeeMap[id].leave
    }));
    
    return {
      totalPresent,
      totalAbsent,
      totalHalfDay,
      totalLeave,
      employeeStats
    };
  } catch (error) {
    console.error('Error fetching attendance statistics:', error);
    return {
      totalPresent: 0,
      totalAbsent: 0,
      totalHalfDay: 0,
      totalLeave: 0,
      employeeStats: []
    };
  }
};

// Calculate salary based on attendance for a month
const calculateSalary = async (employeeId, month, year) => {
  try {
    const response = await apiClient.get(`/attendance/${employeeId}/salary?month=${month}&year=${year}`);
    return response.data;
  } catch (error) {
    console.error(`Error calculating salary for employee ${employeeId}:`, error);
    throw error;
  }
};

// Export all methods
const attendanceService = {
  getAttendanceByDate,
  getAttendanceByEmployee,
  getAttendanceReport,
  checkIn,
  checkOut,
  markAttendance,
  markBulkAttendance,
  updateAttendance,
  deleteAttendance,
  getAttendanceStats,
  calculateSalary,
  AttendanceStatus
};

export default attendanceService; 