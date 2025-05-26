import React, { useState, useEffect, useRef } from 'react';
import {
  Paper, Typography, Grid, Avatar, Card, CardContent,
  List, ListItem, ListItemText, Divider, IconButton,
  Button, TextField, Box, CircularProgress, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Slider, Badge, Tooltip, Menu, MenuItem
} from '@mui/material';
import { 
  Edit, Save, PhotoCamera, Close, CloudUpload,
  ZoomIn, ZoomOut, Refresh, HighlightOff, Check,
  MoreVert
} from '@mui/icons-material';
import AvatarEditor from 'react-avatar-editor';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import employeeService from '../../services/employeeService';

const Profile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [employee, setEmployee] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editableFields, setEditableFields] = useState({
    email: '',
    phoneNumber: '',
    whatsappNumber: '',
    linkedInUrl: '',
    currentAddress: '',
    permanentAddress: ''
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  
  // Photo upload and editing states
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [uploadedPhoto, setUploadedPhoto] = useState(null);
  const [profilePicture, setProfilePicture] = useState(null);
  const [zoom, setZoom] = useState(1.2);
  const [rotation, setRotation] = useState(0);
  const [cropperKey, setCropperKey] = useState(Date.now()); // For resetting the editor
  const editorRef = useRef(null);
  
  // Image menu states
  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);
  
  useEffect(() => {
    if (user) {
      fetchEmployeeData();
    }
  }, [user]);

  const fetchEmployeeData = async () => {
    try {
      setLoading(true);
      
      // Try to get all employees first
      const employees = await employeeService.getAllEmployees();
      
      // Find the employee that matches the current user
      let userEmployee = null;
      if (employees && Array.isArray(employees) && employees.length > 0) {
        console.log('Current user:', user);
        console.log('Available employees:', employees);
        
        // Try multiple ways to match the user to an employee record
        userEmployee = employees.find(emp => 
          // Match by email
          (emp.email && user.sub && emp.email.toLowerCase() === user.sub.toLowerCase()) ||
          // Match by ID
          (emp.id && user.sub && emp.id.toString() === user.sub.toString()) ||
          // Match by username if available
          (emp.username && user.sub && emp.username.toLowerCase() === user.sub.toLowerCase()) ||
          // For admin users, also check if the name or fullName matches
          (user.role === 'ADMIN' && 
            ((user.name && emp.fullName && emp.fullName.toLowerCase().includes(user.name.toLowerCase())) ||
             (user.name && emp.name && emp.name.toLowerCase().includes(user.name.toLowerCase()))))
        );
        
        // If still not found and we have just one employee for admin, use that
        if (!userEmployee && user.role === 'ADMIN' && employees.length === 1) {
          userEmployee = employees[0];
          console.log('Using the only available employee record for admin user');
        }
      }
      
      // If employee not found through listing, try direct fetch if we have an ID
      if (!userEmployee && user.sub) {
        try {
          console.log('Trying to fetch employee directly by ID:', user.sub);
          userEmployee = await employeeService.getEmployeeById(user.sub);
          console.log('Direct employee fetch result:', userEmployee);
        } catch (directFetchError) {
          console.log('Direct employee fetch failed:', directFetchError);
        }
      }
      
      console.log('Found matching employee:', userEmployee);
      
      if (!userEmployee) {
        toast.info('Could not find your employee profile. You may need to create one.');
        setLoading(false);
        return;
      }
      
      setEmployee(userEmployee);
      
      // Load profile picture if available
      if (userEmployee.profilePictureUrl) {
        setProfilePicture(userEmployee.profilePictureUrl);
      }
      
      // Initialize editable fields with current values
      setEditableFields({
        email: userEmployee.email || '',
        phoneNumber: userEmployee.phoneNumber || '',
        whatsappNumber: userEmployee.whatsappNumber || '',
        linkedInUrl: userEmployee.linkedInUrl || '',
        currentAddress: userEmployee.currentAddress || '',
        permanentAddress: userEmployee.permanentAddress || ''
      });
    } catch (error) {
      console.error('Error fetching employee data:', error);
      toast.error('Failed to load profile data');
      
      // Set a fallback employee object to prevent blank page
      setEmployee({
        id: user?.sub || 'unknown',
        fullName: user?.name || 'User',
        email: user?.email || '',
        role: user?.role || 'Employee',
        department: 'Not Assigned',
        joiningDate: Date.now()
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditableFields(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    // Validate email format
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(editableFields.email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    setSaving(true);
    setError('');
    
    try {
      const updatedEmployee = {
        ...employee,
        ...editableFields
      };
      
      await employeeService.updateEmployee(employee.id, updatedEmployee);
      setEmployee(updatedEmployee);
      setEditMode(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile. Please try again.');
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };
  
  // Photo handling functions
  const handlePhotoUpload = (event) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      
      // Check file type
      if (!file.type.includes('image/')) {
        toast.error('Only image files are allowed');
        return;
      }
      
      setUploadedPhoto(URL.createObjectURL(file));
      setPhotoDialogOpen(true);
    }
  };
  
  const handlePhotoSave = async () => {
    if (editorRef.current) {
      try {
        // Get the canvas with the image data
        const canvas = editorRef.current.getImageScaledToCanvas();
        
        // Convert canvas to blob
        canvas.toBlob(async (blob) => {
          // Create a new file from blob
          const photoFile = new File([blob], 'profile-photo.jpg', { type: 'image/jpeg' });
          
          setSaving(true);
          
          try {
            // Update employee with new profile picture
            const formData = new FormData();
            formData.append('profilePicture', photoFile);
            
            // For demo, we'll just update the employee with URL
            // In a real implementation, this would upload to a server
            const photoUrl = URL.createObjectURL(blob);
            
            const updatedEmployee = {
              ...employee,
              profilePictureUrl: photoUrl
            };
            
            await employeeService.updateEmployee(employee.id, updatedEmployee);
            setEmployee(updatedEmployee);
            setProfilePicture(photoUrl);
            setPhotoDialogOpen(false);
            toast.success('Profile picture updated successfully');
          } catch (error) {
            console.error('Error updating profile picture:', error);
            toast.error('Failed to update profile picture');
          } finally {
            setSaving(false);
          }
        }, 'image/jpeg', 0.85); // 85% quality JPEG
      } catch (error) {
        console.error('Error processing image:', error);
        toast.error('Failed to process image');
      }
    }
  };
  
  const resetEditor = () => {
    setZoom(1.2);
    setRotation(0);
    setCropperKey(Date.now());
  };
  
  const handlePhotoMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handlePhotoMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleRemovePhoto = async () => {
    handlePhotoMenuClose();
    
    try {
      setSaving(true);
      const updatedEmployee = {
        ...employee,
        profilePictureUrl: null
      };
      
      await employeeService.updateEmployee(employee.id, updatedEmployee);
      setEmployee(updatedEmployee);
      setProfilePicture(null);
      toast.success('Profile picture removed');
    } catch (error) {
      console.error('Error removing profile picture:', error);
      toast.error('Failed to remove profile picture');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!employee) {
    return (
      <Box 
        display="flex" 
        flexDirection="column" 
        alignItems="center" 
        justifyContent="center" 
        minHeight="60vh"
        p={3}
      >
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3, 
            width: '100%', 
            maxWidth: 500,
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
          }}
        >
          Failed to load profile data. Please try refreshing the page.
        </Alert>
        <Button 
          variant="contained" 
          color="primary"
          onClick={fetchEmployeeData}
          startIcon={<Refresh />}
        >
          Retry Loading Profile
        </Button>
      </Box>
    );
  }

  // Format joining date for display
  const formattedJoiningDate = employee.joiningDate 
    ? new Date(employee.joiningDate).toLocaleDateString() 
    : 'Not specified';

  return (
    <div>
      <Typography variant="h4" gutterBottom fontWeight="600" color="#2c3e50">
        My Profile
      </Typography>
      
      <Grid container spacing={3}>
        {/* Basic Info Card */}
        <Grid item xs={12}>
          <Paper 
            sx={{ 
              p: 3, 
              position: 'relative',
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              overflow: 'hidden'
            }}
          >
            <Box sx={{ 
              height: '8px', 
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bgcolor: '#3f51b5',
              background: 'linear-gradient(90deg, #3f51b5 0%, #7986cb 100%)'
            }} />
            
            {!editMode && (
              <IconButton 
                sx={{ position: 'absolute', top: 16, right: 16 }}
                onClick={() => setEditMode(true)}
              >
                <Edit />
              </IconButton>
            )}
            
            <Grid container spacing={3} alignItems="center" sx={{ mt: 0.5 }}>
              <Grid item xs={12} md={2} sx={{ textAlign: 'center' }}>
                <Box sx={{ position: 'relative', display: 'inline-block' }}>
                  <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    badgeContent={
                      <Tooltip title="Change profile picture">
                        <IconButton
                          component="label"
                          sx={{
                            bgcolor: '#3f51b5',
                            color: 'white',
                            width: 36,
                            height: 36,
                            '&:hover': { bgcolor: '#303f9f' }
                          }}
                        >
                          <input
                            hidden
                            accept="image/*"
                            type="file"
                            onChange={handlePhotoUpload}
                          />
                          <PhotoCamera fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    }
                  >
                    <Avatar
                      src={profilePicture}
                      alt={employee.fullName}
                      sx={{
                        width: 120,
                        height: 120,
                        margin: '0 auto',
                        bgcolor: 'primary.main',
                        fontSize: '3rem',
                        border: '3px solid white',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                        cursor: profilePicture ? 'pointer' : 'default'
                      }}
                      onClick={profilePicture ? handlePhotoMenuOpen : undefined}
                    >
                      {employee.fullName?.charAt(0).toUpperCase() || 'U'}
                    </Avatar>
                  </Badge>
                  
                  {/* Profile Picture Menu */}
                  <Menu
                    anchorEl={anchorEl}
                    open={menuOpen}
                    onClose={handlePhotoMenuClose}
                    PaperProps={{
                      sx: { borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.15)' }
                    }}
                  >
                    <MenuItem 
                      onClick={() => {
                        handlePhotoMenuClose();
                        document.getElementById('profile-photo-upload').click();
                      }}
                    >
                      <CloudUpload sx={{ mr: 1.5, color: '#3f51b5' }} />
                      Change photo
                    </MenuItem>
                    <MenuItem onClick={handleRemovePhoto}>
                      <HighlightOff sx={{ mr: 1.5, color: '#f44336' }} />
                      Remove photo
                    </MenuItem>
                  </Menu>
                  <input
                    id="profile-photo-upload"
                    hidden
                    accept="image/*"
                    type="file"
                    onChange={handlePhotoUpload}
                  />
                </Box>
              </Grid>
              
              <Grid item xs={12} md={10}>
                <Typography variant="h5" gutterBottom fontWeight="600" color="#2c3e50">
                  {employee.fullName}
                </Typography>
                
                <Grid container spacing={1}>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="subtitle2" color="textSecondary" fontWeight="500">
                      Role
                    </Typography>
                    <Typography variant="body1" fontWeight="500">
                      {employee.role}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <Typography variant="subtitle2" color="textSecondary" fontWeight="500">
                      Department
                    </Typography>
                    <Typography variant="body1" fontWeight="500">
                      {employee.department}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <Typography variant="subtitle2" color="textSecondary" fontWeight="500">
                      Joined
                    </Typography>
                    <Typography variant="body1" fontWeight="500">
                      {formattedJoiningDate}
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        {/* Contact Information */}
        <Grid item xs={12} md={6}>
          <Card 
            sx={{ 
              height: '100%',
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              overflow: 'hidden'
            }}
          >
            <Box sx={{ 
              height: '8px', 
              bgcolor: '#2196f3',
              background: 'linear-gradient(90deg, #2196f3 0%, #64b5f6 100%)'
            }} />
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom fontWeight="600" color="#2c3e50">
                Contact Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {editMode ? (
                <>
                  {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Email"
                        name="email"
                        value={editableFields.email}
                        onChange={handleChange}
                        required
                        variant="outlined"
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Phone Number"
                        name="phoneNumber"
                        value={editableFields.phoneNumber}
                        onChange={handleChange}
                        variant="outlined"
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="WhatsApp Number"
                        name="whatsappNumber"
                        value={editableFields.whatsappNumber}
                        onChange={handleChange}
                        variant="outlined"
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="LinkedIn URL"
                        name="linkedInUrl"
                        value={editableFields.linkedInUrl}
                        onChange={handleChange}
                        variant="outlined"
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Current Address"
                        name="currentAddress"
                        value={editableFields.currentAddress}
                        onChange={handleChange}
                        multiline
                        rows={2}
                        variant="outlined"
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Permanent Address"
                        name="permanentAddress"
                        value={editableFields.permanentAddress}
                        onChange={handleChange}
                        multiline
                        rows={2}
                        variant="outlined"
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                        <Button 
                          variant="outlined" 
                          onClick={() => setEditMode(false)}
                          disabled={saving}
                          startIcon={<Close />}
                          sx={{ 
                            color: '#757575',
                            borderColor: '#757575'
                          }}
                        >
                          Cancel
                        </Button>
                        <Button 
                          variant="contained" 
                          startIcon={saving ? <CircularProgress size={20} /> : <Save />}
                          onClick={handleSave}
                          disabled={saving}
                          sx={{
                            background: 'linear-gradient(45deg, #3f51b5 30%, #7986cb 90%)',
                            boxShadow: '0 3px 5px 2px rgba(63, 81, 181, .3)',
                            fontWeight: 'bold',
                          }}
                        >
                          {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </>
              ) : (
                <List dense disablePadding>
                  <ListItem>
                    <ListItemText 
                      primary={<Typography fontWeight="500">Email</Typography>} 
                      secondary={employee.email || 'Not provided'} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary={<Typography fontWeight="500">Phone</Typography>} 
                      secondary={employee.phoneNumber || 'Not provided'} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary={<Typography fontWeight="500">WhatsApp</Typography>} 
                      secondary={employee.whatsappNumber || 'Not provided'} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary={<Typography fontWeight="500">LinkedIn</Typography>} 
                      secondary={employee.linkedInUrl ? (
                        <a href={employee.linkedInUrl} target="_blank" rel="noopener noreferrer">
                          {employee.linkedInUrl}
                        </a>
                      ) : 'Not provided'} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary={<Typography fontWeight="500">Current Address</Typography>}
                      secondary={employee.currentAddress || 'Not provided'}
                      secondaryTypographyProps={{ style: { whiteSpace: 'pre-wrap' } }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary={<Typography fontWeight="500">Permanent Address</Typography>}
                      secondary={employee.permanentAddress || 'Not provided'}
                      secondaryTypographyProps={{ style: { whiteSpace: 'pre-wrap' } }}
                    />
                  </ListItem>
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Employment Details */}
        <Grid item xs={12} md={6}>
          <Card 
            sx={{ 
              height: '100%',
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              overflow: 'hidden'
            }}
          >
            <Box sx={{ 
              height: '8px', 
              bgcolor: '#4caf50',
              background: 'linear-gradient(90deg, #4caf50 0%, #81c784 100%)'
            }} />
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom fontWeight="600" color="#2c3e50">
                Employment Details
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <List dense disablePadding>
                <ListItem>
                  <ListItemText 
                    primary={<Typography fontWeight="500">Employee ID</Typography>} 
                    secondary={employee.id} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary={<Typography fontWeight="500">Department</Typography>} 
                    secondary={employee.department} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary={<Typography fontWeight="500">Role</Typography>} 
                    secondary={employee.role} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary={<Typography fontWeight="500">Joining Date</Typography>} 
                    secondary={formattedJoiningDate} 
                  />
                </ListItem>
                {employee.status && (
                  <ListItem>
                    <ListItemText 
                      primary={<Typography fontWeight="500">Status</Typography>} 
                      secondary={employee.status} 
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Photo Edit Dialog */}
      <Dialog
        open={photoDialogOpen}
        onClose={() => setPhotoDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: '12px', overflow: 'hidden' }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: '#f5f7fa', 
          fontWeight: 'bold',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Typography variant="h6">Edit Profile Picture</Typography>
          <IconButton onClick={() => setPhotoDialogOpen(false)}>
            <Close />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ pb: 0, pt: 3 }}>
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              mb: 2
            }}
          >
            <AvatarEditor
              ref={editorRef}
              key={cropperKey}
              image={uploadedPhoto}
              width={250}
              height={250}
              border={50}
              borderRadius={125}
              color={[255, 255, 255, 0.6]} // RGBA
              scale={zoom}
              rotate={rotation}
              style={{ marginBottom: 20 }}
            />
            
            <Box sx={{ width: '100%', px: 2, mb: 2 }}>
              <Typography id="zoom-slider" gutterBottom>
                Zoom
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ZoomOut color="action" />
                <Slider
                  aria-labelledby="zoom-slider"
                  value={zoom}
                  onChange={(_, newValue) => setZoom(newValue)}
                  min={1}
                  max={3}
                  step={0.1}
                  sx={{ mx: 2, color: '#3f51b5' }}
                />
                <ZoomIn color="action" />
              </Box>
            </Box>
            
            <Box sx={{ width: '100%', px: 2, mb: 3 }}>
              <Typography id="rotation-slider" gutterBottom>
                Rotation
              </Typography>
              <Slider
                aria-labelledby="rotation-slider"
                value={rotation}
                onChange={(_, newValue) => setRotation(newValue)}
                min={0}
                max={360}
                step={1}
                sx={{ color: '#3f51b5' }}
              />
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <Button
                startIcon={<Refresh />}
                onClick={resetEditor}
                sx={{ mr: 1 }}
              >
                Reset
              </Button>
            </Box>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, py: 2, bgcolor: '#f5f7fa' }}>
          <Button 
            onClick={() => setPhotoDialogOpen(false)}
            startIcon={<Close />}
            sx={{ color: '#757575' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handlePhotoSave}
            variant="contained"
            color="primary"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={20} /> : <Check />}
            sx={{
              background: 'linear-gradient(45deg, #3f51b5 30%, #7986cb 90%)',
              boxShadow: '0 3px 5px 2px rgba(63, 81, 181, .3)',
            }}
          >
            {saving ? 'Saving...' : 'Save Photo'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Profile; 