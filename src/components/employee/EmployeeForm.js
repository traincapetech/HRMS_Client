import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Paper, Typography, TextField, Button, Grid, FormControl,
  InputLabel, Select, MenuItem, CircularProgress, Box, Divider,
  Alert, Tabs, Tab, Card, CardContent, Stepper, Step, StepLabel,
  AlertTitle, Collapse, IconButton
} from '@mui/material';
import { 
  ArrowBack, Save, Person, School, 
  Description, Work, AccountCircle, Close, 
  BugReport, ExpandMore, ExpandLess
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import employeeService from '../../services/employeeService';

// Tab Panel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`employee-tabpanel-${index}`}
      aria-labelledby={`employee-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const EmployeeForm = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [employee, setEmployee] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    whatsappNumber: '',
    linkedInUrl: '',
    currentAddress: '',
    permanentAddress: '',
    photographPath: '',
    
    // Education information
    collegeName: '',
    tenthMarksheetPath: '',
    twelfthMarksheetPath: '',
    bachelorDegreePath: '',
    postgraduateDegreePath: '',
    
    // Document information
    aadharCardPath: '',
    panCardPath: '',
    pccPath: '',
    resumePath: '',
    
    // Employment information
    role: '',
    department: '',
    joiningDate: '',
    internshipDuration: 0,
    offerLetterPath: '',
    status: 'ACTIVE',
    salary: '',
    hrId: '7db70203-df1f-4e4f-b1f2-603df0cbc23f', // Admin ID as the reference ID
  });

  // For user account creation
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [userRole, setUserRole] = useState('EMPLOYEE');
  
  // For file uploads
  const [files, setFiles] = useState({
    photograph: null,
    tenthMarksheet: null,
    twelfthMarksheet: null,
    bachelorDegree: null,
    postgraduateDegree: null,
    aadharCard: null,
    panCard: null,
    pcc: null,
    resume: null,
    offerLetter: null
  });

  // Add debug state
  const [showDebug, setShowDebug] = useState(false);
  const [debugInfo, setDebugInfo] = useState({
    lastError: null,
    errorDetails: null,
    submitData: null
  });

  useEffect(() => {
    if (isEditMode) {
      fetchEmployee();
    }
  }, [id]);

  const fetchEmployee = async () => {
    try {
      const data = await employeeService.getEmployeeById(id);
      setEmployee({
        ...data,
        // Format date for form field
        joiningDate: data.joiningDate 
          ? new Date(data.joiningDate).toISOString().split('T')[0]
          : ''
      });
      // For edit mode, we don't need to create a user account again
    } catch (error) {
      console.error('Error fetching employee:', error);
      toast.error('Failed to load employee data');
      navigate('/employees');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEmployee(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      // Update files state with the file object
      setFiles(prev => ({
        ...prev,
        [fieldName]: file
      }));
      
      // Update employee state with the file name
      setEmployee(prev => ({
        ...prev,
        [`${fieldName}Path`]: file.name
      }));
      
      console.log(`File selected for ${fieldName}:`, file.name, `(${file.type}, ${file.size} bytes)`);
    } else {
      console.log(`No file selected for ${fieldName}`);
    }
  };

  const validateForm = () => {
    const requiredFields = [
      { field: 'fullName', label: 'Full Name' },
      { field: 'email', label: 'Email' },
      { field: 'phoneNumber', label: 'Phone Number' },
      { field: 'currentAddress', label: 'Current Address' },
      { field: 'role', label: 'Role' },
      { field: 'department', label: 'Department' },
      { field: 'joiningDate', label: 'Joining Date' },
      { field: 'salary', label: 'Salary' }
    ];

    // Check for empty required fields
    const missingFields = requiredFields.filter(
      ({ field }) => !employee[field]
    );

    if (missingFields.length > 0) {
      setError(`Please fill all required fields: ${missingFields.map(f => f.label).join(', ')}`);
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
    
    // In create mode, validate username and password
    if (!isEditMode) {
      if (!username || !password) {
        setError('Username and password are required');
        return false;
      }
      
      if (password.length < 6) {
        setError('Password must be at least 6 characters long');
        return false;
      }
    }
    
    return true;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setSaving(true);
      setError('');
      
      // Convert numeric values
      const employeeData = {
        ...employee,
        salary: parseFloat(employee.salary),
        internshipDuration: employee.internshipDuration ? parseInt(employee.internshipDuration) : null,
        joiningDate: new Date(employee.joiningDate).getTime()
      };

      // Store submission data for debugging
      const debugSubmitData = {
        ...employeeData,
        username,
        password: "********",
        files: Object.keys(files).filter(k => files[k] !== null).map(k => ({
          key: k,
          name: files[k]?.name,
          size: files[k]?.size,
          type: files[k]?.type
        }))
      };
      
      setDebugInfo(prev => ({
        ...prev,
        submitData: debugSubmitData
      }));

      // Log data being sent for debugging
      console.log("Submitting employee data:", debugSubmitData);

      if (isEditMode) {
        // Just update the employee
        const savedEmployee = await employeeService.updateEmployee(id, employeeData);
        toast.success('Employee updated successfully');
      } else {
        // Create employee with user account
        try {
          const savedEmployee = await employeeService.createEmployee({
            ...employeeData,
            username,
            password,
            hrId: employee.hrId, // Admin/creator ID passed as hrId and will be used as referenceId
            // Add file objects for upload
            files
          });
          toast.success('Employee created successfully');
        } catch (createError) {
          console.error('Detailed error creating employee:', {
            message: createError.message,
            response: createError.response?.data,
            status: createError.response?.status,
            headers: createError.response?.headers,
            stack: createError.stack
          });
          
          // Store error details for debugging
          setDebugInfo(prev => ({
            ...prev,
            lastError: createError.message,
            errorDetails: {
              response: createError.response?.data,
              status: createError.response?.status,
              message: createError.message,
              stack: createError.stack?.split('\n')
            }
          }));
          
          // Show debug panel automatically when there's an error
          setShowDebug(true);
          
          // Re-throw to be caught by outer catch
          throw createError;
        }
      }
      
      navigate('/employees');
      
    } catch (error) {
      console.error('Error saving employee:', error);
      let errorMessage = 'Unknown error occurred';
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Server error details:', {
          data: error.response.data,
          status: error.response.status,
          headers: error.response.headers
        });
        errorMessage = error.response.data?.message || 
                      error.response.data?.error || 
                      `Server error: ${error.response.status}`;
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received:', error.request);
        errorMessage = 'No response received from server';
      } else {
        // Something happened in setting up the request that triggered an Error
        errorMessage = error.message || 'Error preparing request';
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Add this after the main form rendering, before the closing component bracket
  const renderDebugPanel = () => {
    return (
      <Card sx={{ mt: 3, mb: 3, borderRadius: 2, bgcolor: '#f5f5f5' }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
              <BugReport sx={{ mr: 1 }} /> Debug Information
            </Typography>
            <IconButton onClick={() => setShowDebug(!showDebug)}>
              {showDebug ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>
          
          <Collapse in={showDebug}>
            <Box sx={{ mt: 2 }}>
              {debugInfo.lastError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  <AlertTitle>Last Error</AlertTitle>
                  {debugInfo.lastError}
                </Alert>
              )}
              
              {debugInfo.errorDetails && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold">Error Details:</Typography>
                  <Box component="pre" sx={{ 
                    bgcolor: '#f0f0f0', 
                    p: 2, 
                    borderRadius: 1, 
                    fontSize: '0.8rem',
                    overflow: 'auto',
                    maxHeight: '300px'
                  }}>
                    {JSON.stringify(debugInfo.errorDetails, null, 2)}
                  </Box>
                </Box>
              )}
              
              <Typography variant="subtitle1" fontWeight="bold">Submit Data:</Typography>
              <Box component="pre" sx={{ 
                bgcolor: '#f0f0f0', 
                p: 2, 
                borderRadius: 1, 
                fontSize: '0.8rem',
                overflow: 'auto',
                maxHeight: '300px'
              }}>
                {JSON.stringify(debugInfo.submitData, null, 2)}
              </Box>
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold">Troubleshooting Tips:</Typography>
                <Typography variant="body2">
                  1. Ensure all required fields are filled out (backend requires all document files)
                </Typography>
                <Typography variant="body2">
                  2. File size limit might be causing issues - try smaller files
                </Typography>
                <Typography variant="body2">
                  3. Special characters in filenames might cause problems
                </Typography>
                <Typography variant="body2">
                  4. Contact system administrator if problem persists
                </Typography>
              </Box>
            </Box>
          </Collapse>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="500">
          {isEditMode ? 'Edit Employee' : 'Add New Employee'}
        </Typography>
        <Button 
          variant="outlined"
          startIcon={<ArrowBack />} 
          onClick={() => navigate('/employees')}
        >
          Back to Employees
        </Button>
      </Box>
      
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Debug Panel */}
      {renderDebugPanel()}

      <form onSubmit={handleSave}>
        <Card sx={{ mb: 3, borderRadius: 2, boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.05)' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              variant="scrollable"
              scrollButtons="auto"
              sx={{ 
                px: 2, 
                pt: 2,
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 500,
                }
              }}
            >
              <Tab icon={<Person />} label="Personal Information" iconPosition="start" />
              <Tab icon={<School />} label="Education Information" iconPosition="start" />
              <Tab icon={<Description />} label="Documents" iconPosition="start" />
              <Tab icon={<Work />} label="Employment" iconPosition="start" />
              {!isEditMode && <Tab icon={<AccountCircle />} label="User Account" iconPosition="start" />}
            </Tabs>
          </Box>

          <CardContent sx={{ p: 4 }}>
            {/* Personal Information Tab */}
            <TabPanel value={tabValue} index={0}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    required
                    label="Full Name"
                    name="fullName"
                    value={employee.fullName}
                    onChange={handleChange}
                    placeholder="John Doe"
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
                    placeholder="johndoe@example.com"
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
                    helperText="10 digits without spaces or dashes"
                    placeholder="9876543210"
                    variant="outlined"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="WhatsApp Number"
                    name="whatsappNumber"
                    value={employee.whatsappNumber}
                    onChange={handleChange}
                    helperText="Optional"
                    placeholder="9876543210"
                    variant="outlined"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="LinkedIn URL"
                    name="linkedInUrl"
                    value={employee.linkedInUrl}
                    onChange={handleChange}
                    helperText="Optional"
                    placeholder="https://linkedin.com/in/johndoe"
                    variant="outlined"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Photograph"
                    name="photographPath"
                    type="file"
                    onChange={(e) => handleFileChange(e, 'photograph')}
                    inputProps={{
                      accept: "image/*"
                    }}
                    helperText="Select employee photograph (JPG, PNG)"
                    variant="outlined"
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    required
                    label="Current Address"
                    name="currentAddress"
                    multiline
                    rows={3}
                    value={employee.currentAddress}
                    onChange={handleChange}
                    variant="outlined"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Permanent Address"
                    name="permanentAddress"
                    multiline
                    rows={3}
                    value={employee.permanentAddress}
                    onChange={handleChange}
                    helperText="Optional"
                    variant="outlined"
                  />
                </Grid>
              </Grid>
            </TabPanel>

            {/* Education Information Tab */}
            <TabPanel value={tabValue} index={1}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="College Name"
                    name="collegeName"
                    value={employee.collegeName}
                    onChange={handleChange}
                    placeholder="University of Technology"
                    variant="outlined"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="10th Marksheet"
                    name="tenthMarksheetPath"
                    type="file"
                    onChange={(e) => handleFileChange(e, 'tenthMarksheet')}
                    inputProps={{
                      accept: "application/pdf"
                    }}
                    helperText="Select PDF file of 10th marksheet"
                    variant="outlined"
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="12th Marksheet"
                    name="twelfthMarksheetPath"
                    type="file"
                    onChange={(e) => handleFileChange(e, 'twelfthMarksheet')}
                    inputProps={{
                      accept: "application/pdf"
                    }}
                    helperText="Select PDF file of 12th marksheet"
                    variant="outlined"
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Bachelor Degree"
                    name="bachelorDegreePath"
                    type="file"
                    onChange={(e) => handleFileChange(e, 'bachelorDegree')}
                    inputProps={{
                      accept: "application/pdf"
                    }}
                    helperText="Select PDF file of bachelor degree"
                    variant="outlined"
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Postgraduate Degree"
                    name="postgraduateDegreePath"
                    type="file"
                    onChange={(e) => handleFileChange(e, 'postgraduateDegree')}
                    inputProps={{
                      accept: "application/pdf"
                    }}
                    helperText="Select PDF file of postgraduate degree (if applicable)"
                    variant="outlined"
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Grid>
              </Grid>
            </TabPanel>

            {/* Documents Tab */}
            <TabPanel value={tabValue} index={2}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Aadhar Card"
                    name="aadharCardPath"
                    type="file"
                    onChange={(e) => handleFileChange(e, 'aadharCard')}
                    inputProps={{
                      accept: "application/pdf"
                    }}
                    helperText="Select PDF file of Aadhar Card"
                    variant="outlined"
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="PAN Card"
                    name="panCardPath"
                    type="file"
                    onChange={(e) => handleFileChange(e, 'panCard')}
                    inputProps={{
                      accept: "application/pdf"
                    }}
                    helperText="Select PDF file of PAN Card"
                    variant="outlined"
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Police Clearance Certificate"
                    name="pccPath"
                    type="file"
                    onChange={(e) => handleFileChange(e, 'pcc')}
                    inputProps={{
                      accept: "application/pdf"
                    }}
                    helperText="Select PDF file of Police Clearance Certificate"
                    variant="outlined"
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Resume"
                    name="resumePath"
                    type="file"
                    onChange={(e) => handleFileChange(e, 'resume')}
                    inputProps={{
                      accept: "application/pdf"
                    }}
                    helperText="Select PDF file of resume"
                    variant="outlined"
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Offer Letter"
                    name="offerLetterPath"
                    type="file"
                    onChange={(e) => handleFileChange(e, 'offerLetter')}
                    inputProps={{
                      accept: "application/pdf"
                    }}
                    helperText="Select PDF file of offer letter"
                    variant="outlined"
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Grid>
              </Grid>
            </TabPanel>

            {/* Employment Tab */}
            <TabPanel value={tabValue} index={3}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required variant="outlined">
                    <InputLabel>Department</InputLabel>
                    <Select
                      name="department"
                      value={employee.department}
                      onChange={handleChange}
                      label="Department"
                    >
                      <MenuItem value="Engineering">Engineering</MenuItem>
                      <MenuItem value="Design">Design</MenuItem>
                      <MenuItem value="Product">Product</MenuItem>
                      <MenuItem value="Marketing">Marketing</MenuItem>
                      <MenuItem value="Sales">Sales</MenuItem>
                      <MenuItem value="HR">Human Resources</MenuItem>
                      <MenuItem value="Finance">Finance</MenuItem>
                      <MenuItem value="Operations">Operations</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required variant="outlined">
                    <InputLabel>Role</InputLabel>
                    <Select
                      name="role"
                      value={employee.role}
                      onChange={handleChange}
                      label="Role"
                    >
                      <MenuItem value="Developer">Developer</MenuItem>
                      <MenuItem value="Designer">Designer</MenuItem>
                      <MenuItem value="Manager">Manager</MenuItem>
                      <MenuItem value="Director">Director</MenuItem>
                      <MenuItem value="HR Manager">HR Manager</MenuItem>
                      <MenuItem value="Finance Analyst">Finance Analyst</MenuItem>
                      <MenuItem value="Marketing Executive">Marketing Executive</MenuItem>
                      <MenuItem value="Sales Executive">Sales Executive</MenuItem>
                      <MenuItem value="Intern">Intern</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    required
                    label="Joining Date"
                    name="joiningDate"
                    type="date"
                    value={employee.joiningDate}
                    onChange={handleChange}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    variant="outlined"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Internship Duration (Months)"
                    name="internshipDuration"
                    type="number"
                    value={employee.internshipDuration}
                    onChange={handleChange}
                    helperText="Leave empty if not an intern"
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
                      <MenuItem value="ON_LEAVE">On Leave</MenuItem>
                      <MenuItem value="TERMINATED">Terminated</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    required
                    label="Monthly Salary"
                    name="salary"
                    type="number"
                    value={employee.salary}
                    onChange={handleChange}
                    helperText="Base monthly salary in INR"
                    variant="outlined"
                    InputProps={{
                      startAdornment: "₹"
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    required
                    label="HR ID"
                    name="hrId"
                    value={employee.hrId}
                    onChange={handleChange}
                    helperText="ID of HR who is adding this employee"
                    variant="outlined"
                  />
                </Grid>
              </Grid>
            </TabPanel>

            {/* User Account Tab (Only for new employee) */}
            {!isEditMode && (
              <TabPanel value={tabValue} index={4}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      required
                      label="Username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      variant="outlined"
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      required
                      label="Password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      helperText="Minimum 6 characters"
                      variant="outlined"
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth required variant="outlined">
                      <InputLabel>User Role</InputLabel>
                      <Select
                        value={userRole}
                        onChange={(e) => setUserRole(e.target.value)}
                        label="User Role"
                      >
                        <MenuItem value="EMPLOYEE">Employee</MenuItem>
                        <MenuItem value="HR">HR</MenuItem>
                        <MenuItem value="ADMIN">Admin</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </TabPanel>
            )}
          </CardContent>
        </Card>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button 
            variant="outlined" 
            onClick={() => navigate('/employees')}
            disabled={saving}
          >
            Cancel
          </Button>
          
          <Box>
            {tabValue > 0 && (
              <Button
                variant="outlined"
                onClick={() => setTabValue(tabValue - 1)}
                sx={{ mr: 2 }}
              >
                Previous
              </Button>
            )}
            
            {tabValue < (isEditMode ? 3 : 4) ? (
              <Button
                variant="contained"
                onClick={() => setTabValue(tabValue + 1)}
              >
                Next
              </Button>
            ) : (
              <Button 
                type="submit" 
                variant="contained" 
                color="primary"
                startIcon={<Save />} 
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Employee'}
              </Button>
            )}
          </Box>
        </Box>
      </form>
    </Box>
  );
};

export default EmployeeForm; 