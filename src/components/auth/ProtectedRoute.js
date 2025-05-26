import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user, loading } = useAuth();
  
  // Show loading indicator while authentication check is in progress
  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    console.log('Not authenticated, redirecting to login');
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }
  
  console.log('ProtectedRoute - User data:', user);
  console.log('ProtectedRoute - Allowed roles:', allowedRoles);

  // Convert user role to uppercase for case-insensitive comparison
  const userRole = (user?.role || '').toUpperCase();
  const normalizedAllowedRoles = allowedRoles.map(role => role.toUpperCase());
  
  console.log('User role (normalized):', userRole);
  console.log('Allowed roles (normalized):', normalizedAllowedRoles);
  
  // If allowed roles are specified, check if the user role is included
  if (allowedRoles.length > 0 && !normalizedAllowedRoles.includes(userRole)) {
    console.log('User not authorized for this route');
    
    // Redirect to appropriate dashboard based on role if authenticated but not authorized
    let dashboardPath = '/app/profile'; // Default fallback
    
    if (userRole === 'ADMIN') {
      dashboardPath = '/app/admin/dashboard';
    } else if (userRole === 'HR') {
      dashboardPath = '/app/hr/dashboard';
    } else if (userRole === 'EMPLOYEE') {
      dashboardPath = '/app/dashboard';
    }
    
    console.log('Redirecting to:', dashboardPath);
    return <Navigate to={dashboardPath} replace />;
  }

  // User is authenticated and authorized (if roles were specified)
  console.log('User is authenticated and authorized for this route');
  return children;
};

export default ProtectedRoute; 