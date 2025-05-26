import React, { useState, useEffect } from 'react';
import { Grid, Paper, Typography, Button, Card, CardContent, CircularProgress, Alert, Chip, Box, Divider } from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import attendanceService, { AttendanceStatus } from '../../services/attendanceService';
import leaveService from '../../services/leaveService';
import { CheckCircle, Cancel, HourglassEmpty, EventBusy, WorkOutline, AccessTimeOutlined, EventAvailableOutlined, AssignmentIndOutlined } from '@mui/icons-material';
import { toast } from 'react-toastify';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState([]);
  const [leaveData, setLeaveData] = useState([]);
  const [clockedIn, setClockedIn] = useState(false);
  const [error, setError] = useState('');
  const [apiAvailable, setApiAvailable] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        try {
          setLoading(true);
          
          // Try to fetch recent attendance data
          try {
            const attendance = await attendanceService.getAttendanceReport(user.sub);
            setAttendanceData(attendance || []);
            
            // Check if already clocked in today
            const today = new Date().toISOString().split('T')[0];
            const todayAttendance = attendance?.find(a => 
              new Date(a.date).toISOString().split('T')[0] === today && a.checkInTime
            );
            setClockedIn(!!todayAttendance && !todayAttendance.checkOutTime);
            
            // API is available
            setApiAvailable(true);
          } catch (err) {
            console.error('Error fetching attendance data:', err);
            setAttendanceData([]);
            setClockedIn(false);
            
            // Check if it's a 404 error (API endpoint not found)
            if (err.response && err.response.status === 404) {
              setApiAvailable(false);
              setError('Attendance system is being set up. Some features may not be available yet.');
            }
          }
          
          // Try to fetch leave requests
          try {
            const leaves = await leaveService.getEmployeeLeaves(user.sub);
            setLeaveData(leaves || []);
          } catch (err) {
            console.error('Error fetching leave data:', err);
            setLeaveData([]);
            // Don't show error for leaves if already showing error for attendance
            if (!error) {
              setError('Leave system is being set up. Some features may not be available yet.');
            }
          }
        } catch (error) {
          console.error('Error fetching dashboard data:', error);
          toast.error('Failed to load dashboard data');
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchData();
  }, [user]);

  const handleCheckIn = async () => {
    if (!apiAvailable) {
      toast.warning('Attendance system is being set up. Please try again later.');
      return;
    }
    
    try {
      const currentTime = new Date().toISOString().substr(11, 8); // HH:MM:SS format
      await attendanceService.checkIn(user.sub, currentTime);
      setClockedIn(true);
      toast.success('Checked in successfully');
      
      // Refresh attendance data
      try {
        const attendance = await attendanceService.getAttendanceReport(user.sub);
        setAttendanceData(attendance || []);
      } catch (err) {
        console.error('Error refreshing attendance data:', err);
      }
    } catch (error) {
      console.error('Check-in error:', error);
      toast.error('Failed to check in');
    }
  };

  const handleCheckOut = async () => {
    if (!apiAvailable) {
      toast.warning('Attendance system is being set up. Please try again later.');
      return;
    }
    
    try {
      const currentTime = new Date().toISOString().substr(11, 8); // HH:MM:SS format
      await attendanceService.checkOut(user.sub, currentTime);
      setClockedIn(false);
      toast.success('Checked out successfully');
      
      // Refresh attendance data
      try {
        const attendance = await attendanceService.getAttendanceReport(user.sub);
        setAttendanceData(attendance || []);
      } catch (err) {
        console.error('Error refreshing attendance data:', err);
      }
    } catch (error) {
      console.error('Check-out error:', error);
      toast.error('Failed to check out');
    }
  };

  const getStatusChip = (status) => {
    switch(status) {
      case AttendanceStatus.PRESENT:
        return (
          <Chip 
            icon={<CheckCircle />} 
            label="Present" 
            color="success" 
            size="small" 
          />
        );
      case AttendanceStatus.ABSENT:
        return (
          <Chip 
            icon={<Cancel />} 
            label="Absent" 
            color="error" 
            size="small" 
          />
        );
      case AttendanceStatus.HALF_DAY:
        return (
          <Chip 
            icon={<HourglassEmpty />} 
            label="Half Day" 
            color="warning" 
            size="small" 
          />
        );
      case AttendanceStatus.LEAVE:
        return (
          <Chip 
            icon={<EventBusy />} 
            label="Leave" 
            color="primary" 
            size="small" 
          />
        );
      default:
        return (
          <Chip 
            label="Not Marked" 
            color="default" 
            size="small" 
          />
        );
    }
  };

  if (loading) {
    return (
      <Grid container justifyContent="center" alignItems="center" style={{ height: '80vh' }}>
        <CircularProgress />
      </Grid>
    );
  }

  // Get recent attendance (last 5 entries)
  const recentAttendance = [...attendanceData]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);
  
  // Get pending leave requests
  const pendingLeaves = leaveData
    .filter(leave => leave.status === 'PENDING')
    .sort((a, b) => new Date(b.requestDate) - new Date(a.requestDate));

  // Calculate attendance count for this month by status
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const thisMonthAttendance = attendanceData.filter(a => {
    const recordDate = new Date(a.date);
    return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
  });

  const presentDays = thisMonthAttendance.filter(a => a.status === AttendanceStatus.PRESENT).length;
  const halfDays = thisMonthAttendance.filter(a => a.status === AttendanceStatus.HALF_DAY).length;
  const leaveDays = thisMonthAttendance.filter(a => a.status === AttendanceStatus.LEAVE).length;
  const absentDays = thisMonthAttendance.filter(a => a.status === AttendanceStatus.ABSENT).length;

  return (
    <Box sx={{ py: 2 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h4" fontWeight="600" color="#2c3e50" gutterBottom>
            Employee Dashboard
          </Typography>
          
          {error && (
            <Alert severity="info" sx={{ mb: 3, borderRadius: '8px' }}>
              {error}
            </Alert>
          )}
        </Grid>
        
        {/* Attendance Stats Cards */}
        <Grid item xs={12}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 3, 
                  height: '100%', 
                  borderRadius: '12px',
                  border: '1px solid rgba(0,0,0,0.08)',
                  background: 'linear-gradient(to right, rgba(76, 175, 80, 0.1), rgba(76, 175, 80, 0.05))',
                  transition: 'transform 0.3s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CheckCircle color="success" sx={{ mr: 1 }} />
                  <Typography variant="h6" color="text.primary" fontWeight="600">
                    Present Days
                  </Typography>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 700, color: '#4caf50', textAlign: 'center', my: 2 }}>
                  {presentDays}
                </Typography>
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  This Month
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 3, 
                  height: '100%', 
                  borderRadius: '12px',
                  border: '1px solid rgba(0,0,0,0.08)',
                  background: 'linear-gradient(to right, rgba(255, 152, 0, 0.1), rgba(255, 152, 0, 0.05))',
                  transition: 'transform 0.3s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <HourglassEmpty color="warning" sx={{ mr: 1 }} />
                  <Typography variant="h6" color="text.primary" fontWeight="600">
                    Half Days
                  </Typography>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 700, color: '#ff9800', textAlign: 'center', my: 2 }}>
                  {halfDays}
                </Typography>
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  This Month
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 3, 
                  height: '100%', 
                  borderRadius: '12px',
                  border: '1px solid rgba(0,0,0,0.08)',
                  background: 'linear-gradient(to right, rgba(33, 150, 243, 0.1), rgba(33, 150, 243, 0.05))',
                  transition: 'transform 0.3s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <EventBusy color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6" color="text.primary" fontWeight="600">
                    Leave Days
                  </Typography>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 700, color: '#2196f3', textAlign: 'center', my: 2 }}>
                  {leaveDays}
                </Typography>
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  This Month
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 3, 
                  height: '100%', 
                  borderRadius: '12px',
                  border: '1px solid rgba(0,0,0,0.08)',
                  background: 'linear-gradient(to right, rgba(244, 67, 54, 0.1), rgba(244, 67, 54, 0.05))',
                  transition: 'transform 0.3s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Cancel color="error" sx={{ mr: 1 }} />
                  <Typography variant="h6" color="text.primary" fontWeight="600">
                    Absent Days
                  </Typography>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 700, color: '#f44336', textAlign: 'center', my: 2 }}>
                  {absentDays}
                </Typography>
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  This Month
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Grid>
        
        {/* Attendance Action Card */}
        <Grid item xs={12} md={6}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              height: '100%', 
              borderRadius: '12px',
              border: '1px solid rgba(0,0,0,0.08)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <AccessTimeOutlined sx={{ color: '#2196f3', mr: 1.5, fontSize: 28 }} />
              <Typography variant="h5" fontWeight="600" color="#2c3e50">
                Today's Attendance
              </Typography>
            </Box>
            
            <Box sx={{ 
              py: 3, 
              px: 4, 
              mb: 3, 
              backgroundColor: clockedIn ? 'rgba(76, 175, 80, 0.1)' : 'rgba(238, 238, 238, 0.5)',
              borderRadius: '8px',
              textAlign: 'center',
              border: clockedIn ? '1px dashed #4caf50' : '1px dashed #bdbdbd'
            }}>
              <Typography variant="h6" color={clockedIn ? '#2e7d32' : '#757575'} fontWeight="500" paragraph>
                {clockedIn ? 'You are currently clocked in' : 'You have not clocked in today'}
              </Typography>
              
              <Typography variant="body2" color="text.secondary" paragraph>
                {clockedIn 
                  ? 'Don\'t forget to clock out at the end of your work day' 
                  : 'Click the button below to mark your attendance for today'
                }
              </Typography>
            </Box>
            
            <Button 
              variant="contained" 
              size="large"
              color={clockedIn ? "secondary" : "primary"}
              onClick={clockedIn ? handleCheckOut : handleCheckIn}
              fullWidth
              disabled={!apiAvailable}
              sx={{
                py: 1.5,
                backgroundColor: clockedIn ? '#f44336' : '#4caf50',
                '&:hover': {
                  backgroundColor: clockedIn ? '#d32f2f' : '#388e3c',
                },
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                borderRadius: '8px',
                fontWeight: 'bold',
                textTransform: 'none',
                fontSize: '1rem'
              }}
            >
              {clockedIn ? 'Check Out' : 'Check In'}
            </Button>
            
            {!apiAvailable && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5, textAlign: 'center' }}>
                Attendance system is being set up. Check-in functionality will be available soon.
              </Typography>
            )}
          </Paper>
        </Grid>
        
        {/* Recent Attendance */}
        <Grid item xs={12} md={6}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              height: '100%', 
              borderRadius: '12px',
              border: '1px solid rgba(0,0,0,0.08)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <EventAvailableOutlined sx={{ color: '#2196f3', mr: 1.5, fontSize: 28 }} />
              <Typography variant="h5" fontWeight="600" color="#2c3e50">
                Recent Attendance
              </Typography>
            </Box>
            
            {recentAttendance.length > 0 ? (
              <Box>
                {recentAttendance.map((record, index) => (
                  <React.Fragment key={index}>
                    <Card 
                      variant="outlined" 
                      sx={{ 
                        mb: 1.5, 
                        borderRadius: '8px',
                        borderColor: 'rgba(0,0,0,0.08)',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 8px rgba(0,0,0,0.05)'
                        }
                      }}
                    >
                      <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <Grid container alignItems="center">
                          <Grid item xs={4}>
                            <Typography variant="body2" fontWeight="500">
                              {new Date(record.date).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric',
                                weekday: 'short'
                              })}
                            </Typography>
                          </Grid>
                          <Grid item xs={4} sx={{ textAlign: 'center' }}>
                            {getStatusChip(record.status)}
                          </Grid>
                          <Grid item xs={4} sx={{ textAlign: 'right' }}>
                            <Typography variant="body2" color="text.secondary">
                              {record.checkInTime && 
                                `${record.checkInTime} - ${record.checkOutTime || '...'}`}
                            </Typography>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                    {index < recentAttendance.length - 1 && (
                      <Box sx={{ height: '4px' }} />
                    )}
                  </React.Fragment>
                ))}
              </Box>
            ) : (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                py: 4,
                backgroundColor: 'rgba(238, 238, 238, 0.3)',
                borderRadius: '8px'
              }}>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                  {apiAvailable ? 'No recent attendance records found.' : 'Attendance records will be available soon.'}
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
        
        {/* Recent Leave Requests */}
        <Grid item xs={12}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              borderRadius: '12px',
              border: '1px solid rgba(0,0,0,0.08)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <AssignmentIndOutlined sx={{ color: '#2196f3', mr: 1.5, fontSize: 28 }} />
              <Typography variant="h5" fontWeight="600" color="#2c3e50">
                Leave Requests
              </Typography>
            </Box>
            
            {pendingLeaves.length > 0 ? (
              <Grid container spacing={2}>
                {pendingLeaves.slice(0, 3).map((leave, index) => (
                  <Grid item xs={12} md={4} key={index}>
                    <Card 
                      variant="outlined" 
                      sx={{ 
                        borderRadius: '8px',
                        borderColor: 'rgba(0,0,0,0.08)',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 8px rgba(0,0,0,0.05)'
                        }
                      }}
                    >
                      <CardContent>
                        <Typography variant="subtitle1" fontWeight="500" gutterBottom>
                          {new Date(leave.fromDate).toLocaleDateString()} - {new Date(leave.toDate).toLocaleDateString()}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                          <Chip 
                            label={leave.status} 
                            size="small" 
                            color={
                              leave.status === 'APPROVED' ? 'success' : 
                              leave.status === 'REJECTED' ? 'error' : 'warning'
                            }
                          />
                          <Typography variant="caption" color="text.secondary">
                            {new Date(leave.requestDate).toLocaleDateString()}
                          </Typography>
                        </Box>
                        
                        <Divider sx={{ my: 1.5 }} />
                        
                        <Typography variant="body2" color="text.secondary">
                          <strong>Reason:</strong> {leave.reason}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                py: 4,
                backgroundColor: 'rgba(238, 238, 238, 0.3)',
                borderRadius: '8px'
              }}>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                  No pending leave requests found.
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EmployeeDashboard; 