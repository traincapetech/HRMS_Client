import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Grid, Button, Divider,
  Chip, List, ListItem, ListItemIcon, ListItemText, CircularProgress, Avatar
} from '@mui/material';
import {
  Person, Email, Phone, Home, School, Work, 
  AttachMoney, CalendarMonth, Description, ArrowBack
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import employeeService from '../../services/employeeService';

const EmployeeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEmployee();
  }, [id]);

  const fetchEmployee = async () => {
    try {
      setLoading(true);
      const data = await employeeService.getEmployeeById(id);
      setEmployee(data);
    } catch (err) {
      console.error('Error fetching employee:', err);
      setError('Failed to load employee data');
      toast.error('Error loading employee data');
    } finally {
      setLoading(false);
    }
  };

  // Function to convert bytes to base64 string for display
  const bytesToBase64 = (bytes) => {
    if (!bytes || bytes.length === 0) return null;
    
    // Check if bytes is already a string (likely base64)
    if (typeof bytes === 'string') return bytes;
    
    let binary = '';
    const len = bytes.length;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  // Function to open PDF in new tab
  const openPdfInNewTab = (pdfBytes, filename) => {
    if (!pdfBytes || pdfBytes.length === 0) {
      toast.error(`No ${filename} available`);
      return;
    }
    
    try {
      let base64;
      
      // Handle different data formats
      if (typeof pdfBytes === 'string') {
        // If it's already a string, assume it's either base64 or a URL
        if (pdfBytes.startsWith('http')) {
          // If it's a URL, just open it in a new tab
          window.open(pdfBytes, '_blank');
          return;
        } else {
          base64 = pdfBytes; // Already a base64 string
        }
      } else {
        // Convert byte array to base64
        base64 = bytesToBase64(pdfBytes);
      }
      
      // Create and open a new window with the PDF
      const pdfWindow = window.open();
      pdfWindow.document.write(
        `<!DOCTYPE html>
        <html>
          <head><title>${filename}</title></head>
          <body style="margin:0;padding:0;overflow:hidden">
            <iframe width="100%" height="100%" style="border:none;position:absolute;top:0;left:0;right:0;bottom:0" 
              src="data:application/pdf;base64,${base64}"></iframe>
          </body>
        </html>`
      );
      pdfWindow.document.close();
    } catch (error) {
      console.error(`Error displaying ${filename}:`, error);
      toast.error(`Failed to open ${filename}`);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Typography color="error" variant="h6">{error}</Typography>
        <Button variant="contained" onClick={() => navigate('/employees')}>
          Back to Employees
        </Button>
      </Box>
    );
  }

  if (!employee) {
    return (
      <Box>
        <Typography variant="h6">Employee not found</Typography>
        <Button variant="contained" onClick={() => navigate('/employees')}>
          Back to Employees
        </Button>
      </Box>
    );
  }

  // Format date from timestamp
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="500">
          Employee Details
        </Typography>
        <Button 
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/employees')}
        >
          Back to Employees
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Personal Information Card */}
        <Grid item xs={12} md={4}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Person sx={{ fontSize: 32, mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Personal Information</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                {employee.photograph && (
                  <Avatar 
                    src={`data:image/jpeg;base64,${bytesToBase64(employee.photograph)}`}
                    sx={{ width: 120, height: 120 }}
                  />
                )}
                {!employee.photograph && (
                  <Avatar sx={{ width: 120, height: 120 }}>{employee.fullName.charAt(0)}</Avatar>
                )}
              </Box>

              <List dense>
                <ListItem>
                  <ListItemIcon><Person /></ListItemIcon>
                  <ListItemText primary="Name" secondary={employee.fullName} />
                </ListItem>
                <ListItem>
                  <ListItemIcon><Email /></ListItemIcon>
                  <ListItemText primary="Email" secondary={employee.email} />
                </ListItem>
                <ListItem>
                  <ListItemIcon><Phone /></ListItemIcon>
                  <ListItemText primary="Phone" secondary={employee.phoneNumber} />
                </ListItem>
                {employee.whatsappNumber && (
                  <ListItem>
                    <ListItemIcon><Phone /></ListItemIcon>
                    <ListItemText primary="WhatsApp" secondary={employee.whatsappNumber} />
                  </ListItem>
                )}
                <ListItem>
                  <ListItemIcon><Home /></ListItemIcon>
                  <ListItemText primary="Current Address" secondary={employee.currentAddress} />
                </ListItem>
                {employee.permanentAddress && (
                  <ListItem>
                    <ListItemIcon><Home /></ListItemIcon>
                    <ListItemText primary="Permanent Address" secondary={employee.permanentAddress} />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Employment Information Card */}
        <Grid item xs={12} md={4}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Work sx={{ fontSize: 32, mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Employment Details</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />

              <List dense>
                <ListItem>
                  <ListItemIcon><Work /></ListItemIcon>
                  <ListItemText primary="Role" secondary={employee.role} />
                </ListItem>
                <ListItem>
                  <ListItemIcon><Work /></ListItemIcon>
                  <ListItemText primary="Department" secondary={employee.department} />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CalendarMonth /></ListItemIcon>
                  <ListItemText primary="Joining Date" secondary={formatDate(employee.joiningDate)} />
                </ListItem>
                <ListItem>
                  <ListItemIcon><AttachMoney /></ListItemIcon>
                  <ListItemText primary="Salary" secondary={`₹${employee.salary.toLocaleString()}`} />
                </ListItem>
                <ListItem>
                  <Box>
                    <Chip 
                      label={employee.status} 
                      color={
                        employee.status === 'ACTIVE' ? 'success' : 
                        employee.status === 'ON_LEAVE' ? 'warning' : 
                        'error'
                      } 
                      size="small" 
                    />
                  </Box>
                </ListItem>
              </List>

              {employee.internshipDuration > 0 && (
                <Box mt={2}>
                  <Typography variant="subtitle2">
                    Internship Duration: {employee.internshipDuration} months
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Education Information Card */}
        <Grid item xs={12} md={4}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <School sx={{ fontSize: 32, mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Education</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />

              {employee.collegeName && (
                <Typography variant="body1" gutterBottom>
                  <strong>College:</strong> {employee.collegeName}
                </Typography>
              )}

              <Typography variant="subtitle1" sx={{ mt: 2 }}>Educational Documents</Typography>
              <Grid container spacing={1} sx={{ mt: 1 }}>
                <Grid item xs={6}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Description />}
                    onClick={() => openPdfInNewTab(employee.tenthMarksheet, '10th Marksheet')}
                    fullWidth
                  >
                    10th Marksheet
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Description />}
                    onClick={() => openPdfInNewTab(employee.twelfthMarksheet, '12th Marksheet')}
                    fullWidth
                  >
                    12th Marksheet
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Description />}
                    onClick={() => openPdfInNewTab(employee.bachelorDegree, 'Bachelor Degree')}
                    fullWidth
                  >
                    Bachelor Degree
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Description />}
                    onClick={() => openPdfInNewTab(employee.postgraduateDegree, 'PG Degree')}
                    fullWidth
                  >
                    PG Degree
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Documents Card */}
        <Grid item xs={12}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Description sx={{ fontSize: 32, mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Official Documents</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={6} md={2}>
                  <Button
                    variant="outlined"
                    startIcon={<Description />}
                    onClick={() => openPdfInNewTab(employee.aadharCard, 'Aadhar Card')}
                    fullWidth
                  >
                    Aadhar Card
                  </Button>
                </Grid>
                <Grid item xs={6} md={2}>
                  <Button
                    variant="outlined"
                    startIcon={<Description />}
                    onClick={() => openPdfInNewTab(employee.panCard, 'PAN Card')}
                    fullWidth
                  >
                    PAN Card
                  </Button>
                </Grid>
                <Grid item xs={6} md={2}>
                  <Button
                    variant="outlined"
                    startIcon={<Description />}
                    onClick={() => openPdfInNewTab(employee.pcc, 'Police Clearance')}
                    fullWidth
                  >
                    Police Clearance
                  </Button>
                </Grid>
                <Grid item xs={6} md={2}>
                  <Button
                    variant="outlined"
                    startIcon={<Description />}
                    onClick={() => openPdfInNewTab(employee.resume, 'Resume')}
                    fullWidth
                  >
                    Resume
                  </Button>
                </Grid>
                <Grid item xs={6} md={2}>
                  <Button
                    variant="outlined"
                    startIcon={<Description />}
                    onClick={() => openPdfInNewTab(employee.offerLetter, 'Offer Letter')}
                    fullWidth
                  >
                    Offer Letter
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EmployeeDetails; 