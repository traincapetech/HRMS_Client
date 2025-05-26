import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import authService from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          // Set auth token in axios headers
          authService.setAuthToken(token);
          
          // Decode JWT to get user information
          const decoded = jwtDecode(token);
          console.log('Token from localStorage - decoded:', decoded);
          
          // Extract or set role (defaults to ADMIN for admin users)
          const role = decoded.role || (decoded.sub === 'superadmin' ? 'ADMIN' : null);
          
          // Set user with role information
          setUser({
            ...decoded,
            role: role || 'ADMIN' // Default to ADMIN if no role found
          });
          
          console.log('User set on init:', {...decoded, role: role || 'ADMIN'});
          
          // Check if token is valid (simplified)
          if (!authService.isAuthenticated()) {
            handleLogout();
          }
        } catch (error) {
          console.error('Authentication error:', error);
          handleLogout();
        }
      }
      
      setLoading(false);
    };
    
    initAuth();
  }, [navigate]);

  const login = async (username, password) => {
    try {
      const response = await authService.login(username, password);
      
      if (response && response.token) {
        // Store token
        localStorage.setItem('token', response.token);
        authService.setAuthToken(response.token);
        
        // Get role from response or from decoded token
        let userRole = response.role;
        
        // Decode JWT to get user info
        const decoded = jwtDecode(response.token);
        console.log('Decoded token:', decoded);
        
        // If no role in response, check the decoded token
        if (!userRole && decoded && decoded.role) {
          userRole = decoded.role;
        }
        
        // If still no role, use a default based on login
        if (!userRole && username === "superadmin") {
          userRole = "ADMIN";
        }
        
        // Merge role info with decoded token data
        const userData = {
          ...decoded,
          role: userRole || "ADMIN" // Default to ADMIN if no role found
        };
        
        console.log('User data after login:', userData);
        setUser(userData);
        
        return { 
          role: userData.role, 
          success: true 
        };
      }
      
      return { success: false, error: 'Invalid credentials' };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    navigate('/login');
  };

  // Check if user has permission for a specific route
  const hasPermission = (allowedRoles = []) => {
    if (!user) return false;
    
    if (allowedRoles.length === 0) return true; // No specific roles required
    
    return allowedRoles.includes(user.role);
  };

  const value = {
    user,
    loading,
    login,
    logout: handleLogout,
    hasPermission,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 