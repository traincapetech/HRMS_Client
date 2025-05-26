import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Typography, Box, Paper, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Chip, Dialog,
  DialogActions, DialogContent, DialogContentText, DialogTitle,
  CircularProgress, Alert, Avatar, Tooltip, TextField, InputAdornment,
  Divider
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import hrService from '../../services/hrService';
import MainLayout from '../layout/MainLayout';
import { format } from 'date-fns';

const HrList = () => {
  const [hrList, setHrList] = useState([]);
  const [filteredHrList, setFilteredHrList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [hrToDelete, setHrToDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchHrList();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredHrList(hrList);
    } else {
      const lowercasedQuery = searchQuery.toLowerCase();
      const filtered = hrList.filter(hr => 
        hr.fullName?.toLowerCase().includes(lowercasedQuery) ||
        hr.email?.toLowerCase().includes(lowercasedQuery) ||
        hr.department?.toLowerCase().includes(lowercasedQuery) ||
        hr.phoneNumber?.includes(lowercasedQuery)
      );
      setFilteredHrList(filtered);
    }
  }, [searchQuery, hrList]);

  const fetchHrList = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await hrService.getAllHrs();
      const hrData = Array.isArray(data) ? data : [];
      setHrList(hrData);
      setFilteredHrList(hrData);
    } catch (error) {
      console.error('Error fetching HR list:', error);
      setError('Failed to load HR personnel data');
      toast.error('Failed to load HR personnel data');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!hrToDelete) return;
    
    try {
      setLoading(true);
      await hrService.deleteHr(hrToDelete.id);
      setHrList(hrList.filter(hr => hr.id !== hrToDelete.id));
      setFilteredHrList(filteredHrList.filter(hr => hr.id !== hrToDelete.id));
      toast.success('HR personnel deleted successfully');
    } catch (error) {
      console.error('Error deleting HR:', error);
      toast.error('Failed to delete HR personnel');
    } finally {
      setDeleteDialogOpen(false);
      setHrToDelete(null);
      setLoading(false);
    }
  };

  const openDeleteDialog = (hr) => {
    setHrToDelete(hr);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setHrToDelete(null);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      return format(new Date(timestamp), 'dd MMM yyyy');
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE':
        return { color: 'success', textColor: '#2e7d32', bgColor: 'rgba(46, 125, 50, 0.1)' };
      case 'INACTIVE':
        return { color: 'error', textColor: '#d32f2f', bgColor: 'rgba(211, 47, 47, 0.1)' };
      default:
        return { color: 'default', textColor: '#757575', bgColor: 'rgba(117, 117, 117, 0.1)' };
    }
  };

  if (loading && !hrList.length) {
    return (
      <MainLayout title="HR Personnel Management">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="HR Personnel Management">
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 4,
        pb: 2,
        borderBottom: '1px solid rgba(0, 0, 0, 0.06)'
      }}>
        <Typography variant="h4" component="h1" fontWeight="600" color="#2c3e50">
          HR Personnel Management
        </Typography>
        <Box>
          <Button 
            component={Link} 
            to="/admin/dashboard" 
            startIcon={<ArrowBackIcon />}
            sx={{ 
              mr: 2,
              color: '#3f51b5',
              borderColor: '#3f51b5',
              '&:hover': {
                backgroundColor: 'rgba(63, 81, 181, 0.08)',
                borderColor: '#3f51b5',
              }
            }}
            variant="outlined"
          >
            Back to Dashboard
          </Button>
          <Button 
            variant="contained" 
            component={Link} 
            to="/admin/create-hr"
            startIcon={<AddIcon />}
            sx={{
              background: 'linear-gradient(45deg, #3f51b5 30%, #7986cb 90%)',
              boxShadow: '0 3px 5px 2px rgba(63, 81, 181, .3)',
              color: 'white',
              fontWeight: 'bold',
              px: 3,
              py: 1
            }}
          >
            Add HR Personnel
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 4, 
            borderRadius: '8px', 
            boxShadow: '0 2px 10px rgba(0,0,0,0.08)' 
          }}
        >
          {error}
        </Alert>
      )}

      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3 
      }}>
        <TextField
          placeholder="Search HR personnel..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ width: '40%' }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
        <Button
          startIcon={<RefreshIcon />}
          onClick={fetchHrList}
          sx={{ 
            color: '#3f51b5',
            backgroundColor: 'rgba(63, 81, 181, 0.08)',
            '&:hover': {
              backgroundColor: 'rgba(63, 81, 181, 0.15)',
            }
          }}
        >
          Refresh
        </Button>
      </Box>

      <Paper 
        sx={{ 
          width: '100%', 
          overflow: 'hidden',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          mb: 4
        }}
      >
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: '#f5f7fa' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', color: '#2c3e50' }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#2c3e50' }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#2c3e50' }}>Phone Number</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#2c3e50' }}>Department</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#2c3e50' }}>Joining Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#2c3e50' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#2c3e50' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredHrList.length > 0 ? (
                filteredHrList.map((hr) => {
                  const statusInfo = getStatusColor(hr.status);
                  return (
                    <TableRow 
                      key={hr.id}
                      sx={{ 
                        '&:hover': { 
                          backgroundColor: 'rgba(0, 0, 0, 0.04)',
                        }
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar 
                            sx={{ 
                              bgcolor: '#3f51b5', 
                              mr: 1.5,
                              width: 36, 
                              height: 36,
                              fontSize: '0.9rem'
                            }}
                          >
                            {hr.fullName?.charAt(0).toUpperCase() || 'H'}
                          </Avatar>
                          <Typography fontWeight="500">{hr.fullName}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <EmailIcon 
                            sx={{ 
                              color: '#3f51b5', 
                              fontSize: '1rem', 
                              mr: 1,
                              opacity: 0.7
                            }} 
                          />
                          {hr.email}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <PhoneIcon 
                            sx={{ 
                              color: '#3f51b5', 
                              fontSize: '1rem', 
                              mr: 1,
                              opacity: 0.7
                            }} 
                          />
                          {hr.phoneNumber}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <BusinessIcon 
                            sx={{ 
                              color: '#3f51b5', 
                              fontSize: '1rem', 
                              mr: 1,
                              opacity: 0.7
                            }} 
                          />
                          {hr.department}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <CalendarIcon 
                            sx={{ 
                              color: '#3f51b5', 
                              fontSize: '1rem', 
                              mr: 1,
                              opacity: 0.7
                            }} 
                          />
                          {formatDate(hr.joiningDate)}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={hr.status} 
                          sx={{ 
                            fontWeight: 'bold',
                            bgcolor: statusInfo.bgColor,
                            color: statusInfo.textColor
                          }}
                          size="small" 
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Delete">
                          <IconButton 
                            color="error" 
                            onClick={() => openDeleteDialog(hr)}
                            disabled={loading}
                            sx={{ 
                              bgcolor: 'rgba(244, 67, 54, 0.1)', 
                              '&:hover': {
                                bgcolor: 'rgba(244, 67, 54, 0.2)',
                              }
                            }}
                            size="small"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    {searchQuery ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <SearchIcon sx={{ fontSize: 40, color: '#9e9e9e', mb: 1 }} />
                        <Typography variant="body1" color="text.secondary">
                          No HR personnel matching "{searchQuery}"
                        </Typography>
                        <Button 
                          variant="text" 
                          color="primary" 
                          onClick={() => setSearchQuery('')} 
                          sx={{ mt: 1 }}
                        >
                          Clear Search
                        </Button>
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <PersonIcon sx={{ fontSize: 40, color: '#9e9e9e', mb: 1 }} />
                        <Typography variant="body1" color="text.secondary">
                          No HR personnel found
                        </Typography>
                        <Button 
                          variant="contained" 
                          component={Link} 
                          to="/admin/create-hr"
                          startIcon={<AddIcon />}
                          sx={{ mt: 2 }}
                        >
                          Add HR Personnel
                        </Button>
                      </Box>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={closeDeleteDialog}
        PaperProps={{
          sx: {
            borderRadius: '12px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
          }
        }}
      >
        <DialogTitle sx={{ bgcolor: 'rgba(244, 67, 54, 0.1)', color: '#d32f2f', fontWeight: 'bold' }}>
          Delete HR Personnel
        </DialogTitle>
        <DialogContent sx={{ mt: 2, minWidth: 400 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar sx={{ bgcolor: '#f44336', mr: 2 }}>
              <PersonIcon />
            </Avatar>
            <Typography variant="h6">
              {hrToDelete?.fullName}
            </Typography>
          </Box>
          <Divider sx={{ my: 2 }} />
          <DialogContentText>
            Are you sure you want to delete this HR personnel? This action cannot be undone and will remove all associated data.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button 
            onClick={closeDeleteDialog} 
            disabled={loading}
            sx={{ color: '#757575' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDelete} 
            variant="contained"
            color="error" 
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <DeleteIcon />}
            sx={{
              bgcolor: '#f44336',
              '&:hover': {
                bgcolor: '#d32f2f',
              }
            }}
          >
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </MainLayout>
  );
};

export default HrList; 