import React, { useState } from 'react';
import { 
  Paper, Typography, TextField, Button, Grid, 
  FormControl, InputLabel, Select, MenuItem, Box,
  CircularProgress, Alert, Divider, Card, CardContent,
  Avatar, Stepper, Step, StepLabel, StepContent,
  InputAdornment, IconButton
} from '@mui/material';
import { 
  ArrowBack, 
  Save, 
  Person, 
  Email, 
  Phone, 
  BusinessCenter, 
  DateRange,
  Visibility,
  VisibilityOff,
  Badge,
  Lock
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import hrService from '../../services/hrService';

const HrCreationForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  
  const [employee, setEmployee] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    role: 'HR Manager',
    department: 'HR',
    joiningDate: new Date().toISOString().split('T')[0],
    status: 'ACTIVE'
  });

  // For user account creation
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEmployee(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const validateForm = () => {
    if (!employee.fullName || !employee.email || !employee.phoneNumber || 
        !employee.joiningDate || !username || !password) {
      setError('Please fill all required fields');
      return false;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(employee.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    // Phone validation
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(employee.phoneNumber)) {
      setError('Phone number must be 10 digits');
      return false;
    }
    
    // Password validation
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    
    return true;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Map frontend data to match the backend HrCreationRequest DTO
      const hrData = {
        fullName: employee.fullName,
        email: employee.email,
        phoneNumber: employee.phoneNumber,
        department: employee.department,
        joiningDate: new Date(employee.joiningDate).getTime(), // Convert to timestamp
        status: employee.status,
        username: username,
        password: password
      };

      // Use hrService instead of employeeService
      await hrService.createHr(hrData);
      
      toast.success('HR personnel created successfully');
      navigate('/admin/dashboard');
      
    } catch (error) {
      console.error('Error creating HR personnel:', error);
      setError('Failed to create HR personnel');
      toast.error('Failed to create HR personnel');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      label: 'Personal Information',
      description: 'Enter the personal details of the HR personnel',
      content: (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Person color="primary" sx={{ mr: 1.5, fontSize: 24 }} />
              <Typography variant="h6" fontWeight="600" color="#2c3e50">
                Personal Information
              </Typography>
            </Box>
            <Divider sx={{ mb: 3 }} />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              label="Full Name"
              name="fullName"
              value={employee.fullName}
              onChange={handleChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person color="action" />
                  </InputAdornment>
                ),
              }}
              placeholder="Enter full name"
              variant="outlined"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              label="Email"
              name="email"
              type="email"
              value={employee.email}
              onChange={handleChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email color="action" />
                  </InputAdornment>
                ),
              }}
              placeholder="example@company.com"
              variant="outlined"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              label="Phone Number"
              name="phoneNumber"
              value={employee.phoneNumber}
              onChange={handleChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Phone color="action" />
                  </InputAdornment>
                ),
              }}
              placeholder="10 digits only"
              helperText="10 digits without spaces or dashes"
              variant="outlined"
            />
          </Grid>
        </Grid>
      )
    },
    {
      label: 'Employment Information',
      description: 'Enter employment and role details',
      content: (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <BusinessCenter color="primary" sx={{ mr: 1.5, fontSize: 24 }} />
              <Typography variant="h6" fontWeight="600" color="#2c3e50">
                Employment Information
              </Typography>
            </Box>
            <Divider sx={{ mb: 3 }} />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              disabled
              label="Department"
              name="department"
              value={employee.department}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <BusinessCenter color="action" />
                  </InputAdornment>
                ),
              }}
              variant="outlined"
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              disabled
              label="Role"
              name="role"
              value={employee.role}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Badge color="action" />
                  </InputAdornment>
                ),
              }}
              variant="outlined"
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              required
              label="Joining Date"
              name="joiningDate"
              type="date"
              value={employee.joiningDate}
              onChange={handleChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <DateRange color="action" />
                  </InputAdornment>
                ),
              }}
              InputLabelProps={{
                shrink: true,
              }}
              variant="outlined"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth required variant="outlined">
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={employee.status}
                onChange={handleChange}
                label="Status"
              >
                <MenuItem value="ACTIVE">Active</MenuItem>
                <MenuItem value="INACTIVE">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      )
    },
    {
      label: 'Account Details',
      description: 'Create login credentials for the HR personnel',
      content: (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Lock color="primary" sx={{ mr: 1.5, fontSize: 24 }} />
              <Typography variant="h6" fontWeight="600" color="#2c3e50">
                HR Account Details
              </Typography>
            </Box>
            <Divider sx={{ mb: 3 }} />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person color="action" />
                  </InputAdornment>
                ),
              }}
              placeholder="Username for login"
              variant="outlined"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              helperText="Password must be at least 6 characters"
              variant="outlined"
            />
          </Grid>
        </Grid>
      )
    },
  ];

  return (
    <div>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 4,
        pb: 2,
        borderBottom: '1px solid rgba(0, 0, 0, 0.06)'
      }}>
        <Typography variant="h4" component="h1" fontWeight="600" color="#2c3e50">
          Add HR Personnel
        </Typography>
        <Button 
          startIcon={<ArrowBack />} 
          onClick={() => navigate('/admin/dashboard')}
          variant="outlined"
          sx={{ 
            color: '#3f51b5',
            borderColor: '#3f51b5',
            '&:hover': {
              backgroundColor: 'rgba(63, 81, 181, 0.08)',
              borderColor: '#3f51b5',
            }
          }}
        >
          Back to Dashboard
        </Button>
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
      
      <Card 
        sx={{ 
          mb: 4, 
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}
      >
        <Box sx={{ 
          height: '8px', 
          bgcolor: '#3f51b5',
          background: 'linear-gradient(90deg, #3f51b5 0%, #7986cb 100%)'
        }} />
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', mb: 4 }}>
            <Box sx={{ width: '30%', mr: 5, display: { xs: 'none', md: 'block' } }}>
              <Stepper activeStep={activeStep} orientation="vertical">
                {steps.map((step, index) => (
                  <Step key={step.label}>
                    <StepLabel
                      optional={
                        <Typography variant="caption" color="text.secondary">
                          {step.description}
                        </Typography>
                      }
                    >
                      <Typography 
                        variant="subtitle1" 
                        fontWeight={activeStep === index ? 'bold' : 'normal'}
                        color={activeStep === index ? '#3f51b5' : 'inherit'}
                      >
                        {step.label}
                      </Typography>
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Box>
            
            <Box sx={{ width: { xs: '100%', md: '70%' } }}>
              <form onSubmit={handleSave}>
                {steps[activeStep].content}
                
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
                  <Button
                    disabled={activeStep === 0}
                    onClick={handleBack}
                    sx={{ mr: 1, color: '#757575' }}
                  >
                    Back
                  </Button>
                  {activeStep === steps.length - 1 ? (
                    <Button
                      variant="contained"
                      color="primary"
                      type="submit"
                      disabled={loading}
                      startIcon={loading ? <CircularProgress size={20} /> : <Save />}
                      sx={{
                        background: 'linear-gradient(45deg, #3f51b5 30%, #7986cb 90%)',
                        boxShadow: '0 3px 5px 2px rgba(63, 81, 181, .3)',
                        fontWeight: 'bold',
                      }}
                    >
                      {loading ? 'Saving...' : 'Create HR Personnel'}
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleNext}
                      sx={{
                        bgcolor: '#3f51b5',
                        '&:hover': {
                          bgcolor: '#303f9f',
                        }
                      }}
                    >
                      Next
                    </Button>
                  )}
                </Box>
              </form>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </div>
  );
};

export default HrCreationForm; 