import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Typography, Box, Grid, Paper, Card, CardContent, 
  Divider, Button, List, ListItem, ListItemIcon, ListItemText,
  CircularProgress, Alert, Avatar, IconButton, Tooltip,
  useTheme
} from '@mui/material';
import { 
  People, SupervisorAccount, Business, Security, Person,
  BarChart, Refresh, Add, ArrowForward, AccountCircle
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import employeeService from '../../services/employeeService';
import hrService from '../../services/hrService';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalEmployees: 0,
    totalHr: 0,
    departments: [],
    recentEmployees: []
  });
  const theme = useTheme();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch both employees and HR personnel
      const [employees, hrPersonnel] = await Promise.all([
        employeeService.getAllEmployees(),
        hrService.getAllHrs()
      ]);
      
      // Process employees for dashboard stats
      const departmentsMap = {};
      
      // Count regular employees
      if (Array.isArray(employees)) {
        employees.forEach(emp => {
          if (emp.department) {
            if (!departmentsMap[emp.department]) {
              departmentsMap[emp.department] = 0;
            }
            departmentsMap[emp.department]++;
          }
        });
      }
      
      // Include HR personnel in department counts
      if (Array.isArray(hrPersonnel)) {
        hrPersonnel.forEach(hr => {
          if (hr.department) {
            if (!departmentsMap[hr.department]) {
              departmentsMap[hr.department] = 0;
            }
            departmentsMap[hr.department]++;
          }
        });
      }
      
      // Format department data for display
      const departmentStats = Object.keys(departmentsMap).map(dept => ({
        name: dept,
        count: departmentsMap[dept]
      }));
      
      // Get recent employees (last 5)
      const allPersonnel = [
        ...(Array.isArray(employees) ? employees : []),
        ...(Array.isArray(hrPersonnel) ? hrPersonnel : [])
      ];
      
      const recentEmployees = allPersonnel
        .sort((a, b) => (b.joiningDate || 0) - (a.joiningDate || 0))
        .slice(0, 5);
      
      setStats({
        totalEmployees: (Array.isArray(employees) ? employees.length : 0) + 
                        (Array.isArray(hrPersonnel) ? hrPersonnel.length : 0),
        totalHr: Array.isArray(hrPersonnel) ? hrPersonnel.length : 0,
        departments: departmentStats,
        recentEmployees
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please try again later.');
      
      // Set default empty stats
      setStats({
        totalEmployees: 0,
        totalHr: 0,
        departments: [],
        recentEmployees: []
      });
    } finally {
      setLoading(false);
    }
  };

  // Generate a color based on the name of a department
  const getDepartmentColor = (name) => {
    const colors = [
      '#4caf50', '#2196f3', '#ff9800', '#f44336', 
      '#9c27b0', '#3f51b5', '#009688', '#ff5722'
    ];
    
    // Simple hash function to deterministically pick a color
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 4,
        pb: 2,
        borderBottom: '1px solid rgba(0, 0, 0, 0.06)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="h4" component="h1" fontWeight="600" color="#2c3e50">
            Admin Dashboard
          </Typography>
          <Tooltip title="Refresh Data">
            <IconButton 
              onClick={fetchDashboardData} 
              sx={{ ml: 2, bgcolor: 'rgba(33, 150, 243, 0.1)' }}
            >
              <Refresh color="primary" />
            </IconButton>
          </Tooltip>
        </Box>
        <Button 
          variant="contained" 
          component={Link} 
          to="/admin/create-hr"
          startIcon={<Add />}
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
      
      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 5 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <Card 
            sx={{ 
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              overflow: 'hidden',
              transition: 'transform 0.3s',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
              }
            }}
          >
            <Box sx={{ 
              height: '8px', 
              bgcolor: '#3f51b5',
              background: 'linear-gradient(90deg, #3f51b5 0%, #7986cb 100%)'
            }} />
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Typography variant="h3" fontWeight="700" color="#2c3e50">
                    {stats.totalEmployees}
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary" fontWeight="500">
                    Total Employees
                  </Typography>
                </div>
                <Avatar 
                  sx={{ 
                    bgcolor: 'rgba(63, 81, 181, 0.1)', 
                    height: 60, 
                    width: 60 
                  }}
                >
                  <People sx={{ color: '#3f51b5', fontSize: 30 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} lg={3}>
          <Card 
            sx={{ 
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              overflow: 'hidden',
              transition: 'transform 0.3s',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
              }
            }}
          >
            <Box sx={{ 
              height: '8px', 
              bgcolor: '#673ab7',
              background: 'linear-gradient(90deg, #673ab7 0%, #9575cd 100%)'
            }} />
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Typography variant="h3" fontWeight="700" color="#2c3e50">
                    {stats.totalHr}
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary" fontWeight="500">
                    HR Personnel
                  </Typography>
                </div>
                <Avatar 
                  sx={{ 
                    bgcolor: 'rgba(103, 58, 183, 0.1)', 
                    height: 60, 
                    width: 60 
                  }}
                >
                  <SupervisorAccount sx={{ color: '#673ab7', fontSize: 30 }} />
                </Avatar>
              </Box>
              <Box sx={{ mt: 2 }}>
                <Button 
                  variant="text" 
                  component={Link} 
                  to="/admin/manage-hr"
                  endIcon={<ArrowForward />}
                  sx={{ 
                    fontSize: '0.8rem', 
                    color: '#673ab7',
                    fontWeight: 'medium' 
                  }}
                >
                  Manage HR
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} lg={3}>
          <Card 
            sx={{ 
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              overflow: 'hidden',
              transition: 'transform 0.3s',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
              }
            }}
          >
            <Box sx={{ 
              height: '8px', 
              bgcolor: '#2196f3',
              background: 'linear-gradient(90deg, #2196f3 0%, #64b5f6 100%)'
            }} />
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Typography variant="h3" fontWeight="700" color="#2c3e50">
                    {stats.departments.length}
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary" fontWeight="500">
                    Departments
                  </Typography>
                </div>
                <Avatar 
                  sx={{ 
                    bgcolor: 'rgba(33, 150, 243, 0.1)', 
                    height: 60, 
                    width: 60 
                  }}
                >
                  <Business sx={{ color: '#2196f3', fontSize: 30 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} lg={3}>
          <Card 
            sx={{ 
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              overflow: 'hidden',
              transition: 'transform 0.3s',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
              }
            }}
          >
            <Box sx={{ 
              height: '8px', 
              bgcolor: '#4caf50',
              background: 'linear-gradient(90deg, #4caf50 0%, #81c784 100%)'
            }} />
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Typography variant="h3" fontWeight="700" color="#2c3e50">
                    Admin
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary" fontWeight="500">
                    Your Role
                  </Typography>
                </div>
                <Avatar 
                  sx={{ 
                    bgcolor: 'rgba(76, 175, 80, 0.1)', 
                    height: 60, 
                    width: 60 
                  }}
                >
                  <Security sx={{ color: '#4caf50', fontSize: 30 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <Grid container spacing={4}>
        {/* Department Overview */}
        <Grid item xs={12} lg={6}>
          <Paper 
            sx={{ 
              p: 3, 
              height: '100%', 
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <BarChart color="primary" sx={{ mr: 1.5, fontSize: 24 }} />
              <Typography variant="h5" fontWeight="600" color="#2c3e50">
                Department Overview
              </Typography>
            </Box>
            <Divider sx={{ mb: 3 }} />
            
            {stats.departments.length > 0 ? (
              <List sx={{ p: 0 }}>
                {stats.departments.map((dept, index) => {
                  const color = getDepartmentColor(dept.name);
                  return (
                    <ListItem 
                      key={index} 
                      sx={{ 
                        py: 1.5, 
                        px: 2, 
                        mb: 1.5,
                        borderRadius: '8px',
                        border: '1px solid rgba(0,0,0,0.08)',
                        transition: 'all 0.2s',
                        '&:hover': {
                          backgroundColor: 'rgba(0,0,0,0.02)',
                          transform: 'translateX(5px)'
                        }
                      }}
                    >
                      <Box 
                        sx={{ 
                          width: 40, 
                          height: 40, 
                          borderRadius: '8px', 
                          backgroundColor: `${color}20`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 2
                        }}
                      >
                        <Business sx={{ color }} />
                      </Box>
                      <ListItemText 
                        primary={
                          <Typography variant="subtitle1" fontWeight="600">
                            {dept.name}
                          </Typography>
                        } 
                        secondary={
                          <Typography variant="body2" color="text.secondary">
                            {dept.count} employee{dept.count !== 1 ? 's' : ''}
                          </Typography>
                        } 
                      />
                      <Box 
                        sx={{ 
                          bgcolor: `${color}20`, 
                          color,
                          borderRadius: '6px',
                          px: 2,
                          py: 0.5,
                          fontWeight: 'bold',
                          fontSize: '0.875rem'
                        }}
                      >
                        {dept.count}
                      </Box>
                    </ListItem>
                  );
                })}
              </List>
            ) : (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                justifyContent: 'center',
                py: 4,
                backgroundColor: 'rgba(0,0,0,0.02)',
                borderRadius: '8px'
              }}>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                  No departments found
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
        
        {/* Recent Employees */}
        <Grid item xs={12} lg={6}>
          <Paper 
            sx={{ 
              p: 3, 
              height: '100%', 
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <AccountCircle color="primary" sx={{ mr: 1.5, fontSize: 24 }} />
              <Typography variant="h5" fontWeight="600" color="#2c3e50">
                Recently Added Employees
              </Typography>
            </Box>
            <Divider sx={{ mb: 3 }} />
            
            {stats.recentEmployees.length > 0 ? (
              <List sx={{ p: 0 }}>
                {stats.recentEmployees.map((emp) => (
                  <ListItem 
                    key={emp.id} 
                    sx={{ 
                      py: 1.5, 
                      px: 2, 
                      mb: 1.5, 
                      borderRadius: '8px',
                      border: '1px solid rgba(0,0,0,0.08)',
                      transition: 'all 0.2s',
                      '&:hover': {
                        backgroundColor: 'rgba(0,0,0,0.02)',
                        transform: 'translateX(5px)'
                      }
                    }}
                  >
                    <Avatar 
                      sx={{ 
                        bgcolor: 'primary.light', 
                        mr: 2, 
                        width: 40, 
                        height: 40,
                        fontSize: '1rem'
                      }}
                    >
                      {(emp.fullName || 'U')[0].toUpperCase()}
                    </Avatar>
                    <ListItemText 
                      primary={
                        <Typography variant="subtitle1" fontWeight="600">
                          {emp.fullName || 'Unknown'}
                        </Typography>
                      } 
                      secondary={
                        <Typography variant="body2" color="text.secondary">
                          {emp.role || 'No Role'} - {emp.department || 'No Department'}
                        </Typography>
                      } 
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                justifyContent: 'center',
                py: 4,
                backgroundColor: 'rgba(0,0,0,0.02)',
                borderRadius: '8px'
              }}>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                  No recent employees found
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </>
  );
};

export default AdminDashboard; 