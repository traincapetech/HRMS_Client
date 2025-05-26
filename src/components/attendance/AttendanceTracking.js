import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Button, 
  FormControlLabel, Switch, TextField, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, Paper, Chip, IconButton, Divider, Alert,
  Dialog, DialogActions, DialogContent, DialogTitle,
  Snackbar, Radio, RadioGroup, FormControl, FormLabel
} from '@mui/material';
import { 
  CalendarMonth, Today, CheckCircle, Cancel, 
  Add, Search, Refresh, Edit, ErrorOutline,
  HourglassEmpty, EventBusy
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { toast } from 'react-toastify';
import employeeService from '../../services/employeeService';
import attendanceService, { AttendanceStatus } from '../../services/attendanceService';

const AttendanceTracking = () => {
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [markingAttendance, setMarkingAttendance] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showError, setShowError] = useState(false);
  
  // For individual attendance dialog
  const [openAttendanceDialog, setOpenAttendanceDialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(AttendanceStatus.PRESENT);
  const [attendanceNote, setAttendanceNote] = useState('');
  
  // For bulk attendance dialog
  const [openBulkDialog, setOpenBulkDialog] = useState(false);
  const [bulkStatus, setBulkStatus] = useState(AttendanceStatus.PRESENT);
  const [note, setNote] = useState('');

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    // When date changes, fetch attendance for that date
    if (selectedDate) {
      fetchAttendanceForDate(selectedDate);
    }
  }, [selectedDate]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const data = await employeeService.getAllEmployees();
      setEmployees(data.filter(emp => emp.status === 'ACTIVE'));
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to load employees');
      setErrorMessage('Failed to load employees. Please try again later.');
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceForDate = async (date) => {
    try {
      setLoading(true);
      // Format date as YYYY-MM-DD for the backend
      const formattedDate = date.toISOString().split('T')[0];
      
      try {
        const data = await attendanceService.getAttendanceByDate(formattedDate);
        setAttendanceRecords(data || []);
      } catch (error) {
        console.error('Error fetching attendance:', error);
        // Just set empty records and continue - this is likely because the endpoint doesn't exist yet
        setAttendanceRecords([]);
        // Don't show error toast here as the API might not be implemented yet
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAttendanceDialog = (employee) => {
    setSelectedEmployee(employee);
    const existingRecord = attendanceRecords.find(record => record.employeeId === employee.id);
    setSelectedStatus(existingRecord?.status || AttendanceStatus.PRESENT);
    setAttendanceNote(existingRecord?.note || '');
    setOpenAttendanceDialog(true);
  };

  const handleMarkAttendance = async () => {
    if (!selectedEmployee) return;
    
    try {
      setMarkingAttendance(true);
      const formattedDate = selectedDate.toISOString().split('T')[0];
      
      try {
        const response = await attendanceService.markAttendance({
          employeeId: selectedEmployee.id,
          date: formattedDate,
          status: selectedStatus,
          note: attendanceNote
        });
        
        toast.success('Attendance marked successfully');
        setOpenAttendanceDialog(false);
        
        // Update attendance records locally to avoid additional API call
        const updatedRecords = [...attendanceRecords];
        const existingIndex = updatedRecords.findIndex(
          record => record.employeeId === selectedEmployee.id
        );
        
        if (existingIndex >= 0) {
          // Update existing record
          updatedRecords[existingIndex] = {
            ...updatedRecords[existingIndex],
            status: selectedStatus,
            note: attendanceNote
          };
        } else {
          // Add new record
          updatedRecords.push({
            employeeId: selectedEmployee.id,
            date: formattedDate,
            status: selectedStatus,
            note: attendanceNote,
            id: response.id || `temp-${Date.now()}`
          });
        }
        
        setAttendanceRecords(updatedRecords);
        
        // Then refresh attendance data to ensure we have up-to-date data
        await fetchAttendanceForDate(selectedDate);
      } catch (error) {
        console.error('Error marking attendance:', error);
        
        // If the API returns 404, show a more specific message
        if (error.response && error.response.status === 404) {
          setErrorMessage('The attendance system is still being set up. Please try again later.');
        } else {
          setErrorMessage('Failed to mark attendance. Please try again later.');
        }
        
        setShowError(true);
        
        // Even if API call failed, update UI with the status change
        // This shows feedback to user while backend issues are resolved
        try {
          const updatedRecords = [...attendanceRecords];
          const existingIndex = updatedRecords.findIndex(
            record => record.employeeId === selectedEmployee.id
          );
          
          if (existingIndex >= 0) {
            // Update existing record
            updatedRecords[existingIndex] = {
              ...updatedRecords[existingIndex],
              status: selectedStatus,
              note: attendanceNote
            };
          } else {
            // Add new record
            updatedRecords.push({
              employeeId: selectedEmployee.id,
              date: formattedDate,
              status: selectedStatus,
              note: attendanceNote,
              id: `temp-error-${Date.now()}`
            });
          }
          
          setAttendanceRecords(updatedRecords);
          setOpenAttendanceDialog(false);
        } catch (e) {
          console.error('Error updating UI after API failure:', e);
        }
      }
    } finally {
      setMarkingAttendance(false);
    }
  };

  const handleBulkAttendance = async () => {
    try {
      setMarkingAttendance(true);
      const formattedDate = selectedDate.toISOString().split('T')[0];
      
      try {
        await attendanceService.markBulkAttendance({
          date: formattedDate,
          status: bulkStatus,
          note,
          employeeIds: employees.map(emp => emp.id)
        });
        
        toast.success('Bulk attendance marked successfully');
        setOpenBulkDialog(false);
        
        // Create new array of attendance records for all employees
        const updatedRecords = employees.map(emp => ({
          employeeId: emp.id,
          date: formattedDate,
          status: bulkStatus,
          note: note,
          id: `temp-bulk-${emp.id}-${Date.now()}`
        }));
        
        setAttendanceRecords(updatedRecords);
        
        // Then refresh attendance data to ensure we have up-to-date data
        await fetchAttendanceForDate(selectedDate);
      } catch (error) {
        console.error('Error marking bulk attendance:', error);
        
        // If the API returns 404, show a more specific message
        if (error.response && error.response.status === 404) {
          setErrorMessage('The attendance system is still being set up. Please try again later.');
        } else {
          setErrorMessage('Failed to mark bulk attendance. Please try again later.');
        }
        
        setShowError(true);
        
        // Even if API call failed, update UI with the status change
        // This shows feedback to user while backend issues are resolved
        try {
          const updatedRecords = employees.map(emp => ({
            employeeId: emp.id,
            date: formattedDate,
            status: bulkStatus,
            note: note,
            id: `temp-bulk-error-${emp.id}-${Date.now()}`
          }));
          
          setAttendanceRecords(updatedRecords);
          setOpenBulkDialog(false);
        } catch (e) {
          console.error('Error updating UI after bulk API failure:', e);
        }
      }
    } finally {
      setMarkingAttendance(false);
    }
  };

  const getAttendanceStatus = (employeeId) => {
    const record = attendanceRecords.find(rec => rec.employeeId === employeeId);
    return record ? record.status : 'NOT_MARKED';
  };

  const getAttendanceNote = (employeeId) => {
    const record = attendanceRecords.find(rec => rec.employeeId === employeeId);
    return record ? record.note : '';
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

  const filteredEmployees = employees.filter(emp => 
    emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (emp.phoneNumber && emp.phoneNumber.includes(searchTerm))
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="500">
          Attendance Tracking
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<Add />}
          onClick={() => setOpenBulkDialog(true)}
          sx={{ 
            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
            boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
            color: 'white',
            fontWeight: 'bold'
          }}
        >
          Mark Bulk Attendance
        </Button>
      </Box>

      {/* Error Snackbar */}
      <Snackbar
        open={showError}
        autoHideDuration={6000}
        onClose={() => setShowError(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowError(false)} 
          severity="error" 
          sx={{ width: '100%' }}
          icon={<ErrorOutline />}
        >
          {errorMessage}
        </Alert>
      </Snackbar>

      <Card sx={{ mb: 3, borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Select Date"
                  value={selectedDate}
                  onChange={(newDate) => setSelectedDate(newDate)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                  maxDate={new Date()} // Cannot select future dates
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Search Employees"
                variant="outlined"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search color="action" sx={{ mr: 1 }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={() => {
                  fetchEmployees();
                  fetchAttendanceForDate(selectedDate);
                }}
                fullWidth
                sx={{
                  borderColor: '#2196F3',
                  color: '#2196F3',
                  '&:hover': {
                    backgroundColor: 'rgba(33, 150, 243, 0.08)',
                    borderColor: '#2196F3',
                  }
                }}
              >
                Refresh Data
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
        <Today color="primary" sx={{ mr: 1 }} />
        <Typography variant="h6">
          Date: {selectedDate.toLocaleDateString()}
        </Typography>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
          <Table>
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Employee</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Department</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Role</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Attendance</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Note</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map((employee) => {
                  const attendanceStatus = getAttendanceStatus(employee.id);
                  const attendanceNote = getAttendanceNote(employee.id);
                  
                  return (
                    <TableRow key={employee.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>{employee.fullName}</Typography>
                          <Typography variant="body2" color="text.secondary">{employee.email}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{employee.department}</TableCell>
                      <TableCell>{employee.role}</TableCell>
                      <TableCell>
                        {getStatusChip(attendanceStatus)}
                      </TableCell>
                      <TableCell>{attendanceNote || '-'}</TableCell>
                      <TableCell>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => handleOpenAttendanceDialog(employee)}
                          disabled={markingAttendance}
                          sx={{
                            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                            boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                          }}
                        >
                          Mark Attendance
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body1">
                      {searchTerm ? 'No matching employees found' : 'No active employees found'}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Individual Attendance Dialog */}
      <Dialog 
        open={openAttendanceDialog} 
        onClose={() => setOpenAttendanceDialog(false)}
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
          }
        }}
      >
        <DialogTitle sx={{ backgroundColor: '#f5f5f5', fontWeight: 'bold' }}>
          Mark Attendance for {selectedEmployee?.fullName}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Box sx={{ my: 2 }}>
            <FormControl component="fieldset" sx={{ mb: 3, width: '100%' }}>
              <FormLabel component="legend" sx={{ fontWeight: 'bold', color: '#2196F3' }}>Attendance Status</FormLabel>
              <RadioGroup
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                sx={{ 
                  display: 'flex', 
                  flexDirection: 'row', 
                  flexWrap: 'wrap',
                  '& .MuiFormControlLabel-root': {
                    minWidth: '45%',
                    margin: '8px 0',
                  }
                }}
              >
                <FormControlLabel 
                  value={AttendanceStatus.PRESENT} 
                  control={<Radio color="success" />} 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CheckCircle color="success" sx={{ mr: 0.5, fontSize: 20 }} />
                      <Typography>Present</Typography>
                    </Box>
                  }
                />
                <FormControlLabel 
                  value={AttendanceStatus.ABSENT} 
                  control={<Radio color="error" />} 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Cancel color="error" sx={{ mr: 0.5, fontSize: 20 }} />
                      <Typography>Absent</Typography>
                    </Box>
                  }
                />
                <FormControlLabel 
                  value={AttendanceStatus.HALF_DAY} 
                  control={<Radio color="warning" />} 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <HourglassEmpty color="warning" sx={{ mr: 0.5, fontSize: 20 }} />
                      <Typography>Half Day</Typography>
                    </Box>
                  }
                />
                <FormControlLabel 
                  value={AttendanceStatus.LEAVE} 
                  control={<Radio color="primary" />} 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <EventBusy color="primary" sx={{ mr: 0.5, fontSize: 20 }} />
                      <Typography>Leave</Typography>
                    </Box>
                  }
                />
              </RadioGroup>
            </FormControl>
            
            <TextField
              margin="dense"
              label="Note (Optional)"
              fullWidth
              multiline
              rows={2}
              value={attendanceNote}
              onChange={(e) => setAttendanceNote(e.target.value)}
              variant="outlined"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ padding: '16px 24px' }}>
          <Button 
            onClick={() => setOpenAttendanceDialog(false)} 
            disabled={markingAttendance}
            sx={{ color: '#757575' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleMarkAttendance} 
            variant="contained" 
            color="primary" 
            disabled={markingAttendance}
            sx={{
              background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
              boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
            }}
          >
            {markingAttendance ? 'Marking...' : 'Mark Attendance'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Attendance Dialog */}
      <Dialog 
        open={openBulkDialog} 
        onClose={() => setOpenBulkDialog(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
          }
        }}
      >
        <DialogTitle sx={{ backgroundColor: '#f5f5f5', fontWeight: 'bold' }}>Mark Bulk Attendance</DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Box sx={{ my: 2 }}>
            <Alert severity="info" sx={{ mb: 2, borderRadius: '8px' }}>
              This will mark attendance for all {employees.length} active employees
            </Alert>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                Date: {selectedDate.toLocaleDateString()}
              </Typography>
            </Box>
            
            <FormControl component="fieldset" sx={{ mb: 3, width: '100%' }}>
              <FormLabel component="legend" sx={{ fontWeight: 'bold', color: '#2196F3' }}>Attendance Status</FormLabel>
              <RadioGroup
                value={bulkStatus}
                onChange={(e) => setBulkStatus(e.target.value)}
                sx={{ 
                  display: 'flex', 
                  flexDirection: 'row', 
                  flexWrap: 'wrap',
                  '& .MuiFormControlLabel-root': {
                    minWidth: '45%',
                    margin: '8px 0',
                  }
                }}
              >
                <FormControlLabel 
                  value={AttendanceStatus.PRESENT} 
                  control={<Radio color="success" />} 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CheckCircle color="success" sx={{ mr: 0.5, fontSize: 20 }} />
                      <Typography>Present</Typography>
                    </Box>
                  }
                />
                <FormControlLabel 
                  value={AttendanceStatus.ABSENT} 
                  control={<Radio color="error" />} 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Cancel color="error" sx={{ mr: 0.5, fontSize: 20 }} />
                      <Typography>Absent</Typography>
                    </Box>
                  }
                />
                <FormControlLabel 
                  value={AttendanceStatus.HALF_DAY} 
                  control={<Radio color="warning" />} 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <HourglassEmpty color="warning" sx={{ mr: 0.5, fontSize: 20 }} />
                      <Typography>Half Day</Typography>
                    </Box>
                  }
                />
                <FormControlLabel 
                  value={AttendanceStatus.LEAVE} 
                  control={<Radio color="primary" />} 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <EventBusy color="primary" sx={{ mr: 0.5, fontSize: 20 }} />
                      <Typography>Leave</Typography>
                    </Box>
                  }
                />
              </RadioGroup>
            </FormControl>
            
            <TextField
              margin="dense"
              label="Note (Optional)"
              fullWidth
              multiline
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              variant="outlined"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ padding: '16px 24px' }}>
          <Button 
            onClick={() => setOpenBulkDialog(false)} 
            disabled={markingAttendance}
            sx={{ color: '#757575' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleBulkAttendance} 
            variant="contained" 
            disabled={markingAttendance}
            sx={{
              background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
              boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
            }}
          >
            {markingAttendance ? 'Processing...' : 'Mark Attendance'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AttendanceTracking; 