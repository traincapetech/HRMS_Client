import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import Login from './components/auth/Login';
import AdminSignup from './components/auth/AdminSignup';
import LandingPage from './components/landing/LandingPage';
import EmployeeDashboard from './components/employee/EmployeeDashboard';
import HrDashboard from './components/hr/HrDashboard';
import AdminDashboard from './components/admin/AdminDashboard';
import HrCreationForm from './components/admin/HrCreationForm';
import HrList from './components/admin/HrList';
import EmployeeAttendance from './components/attendance/EmployeeAttendance';
import AttendanceManagement from './components/attendance/AttendanceManagement';
import EmployeeLeaves from './components/leave/EmployeeLeaves';
import LeaveManagement from './components/leave/LeaveManagement';
import EmployeeList from './components/employee/EmployeeList';
import EmployeeForm from './components/employee/EmployeeForm';
import SalarySlipGenerator from './components/salaryslip/SalarySlipGenerator';
import Profile from './components/profile/Profile';
import EmployeeDetails from './components/employee/EmployeeDetails';
import AttendanceTracking from './components/attendance/AttendanceTracking';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastContainer position="top-right" autoClose={5000} />
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin/signup" element={<AdminSignup />} />
          
          {/* Protected routes */}
          <Route path="/app" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/app/dashboard" />} />
            <Route path="dashboard" element={<EmployeeDashboard />} />
            
            {/* Employee routes */}
            <Route path="employees" element={<EmployeeList />} />
            <Route path="employees/add" element={<EmployeeForm />} />
            <Route path="employees/edit/:id" element={<EmployeeForm />} />
            <Route path="employees/:id" element={<EmployeeDetails />} />
            
            {/* Attendance routes */}
            <Route path="attendance" element={<AttendanceTracking />} />
            
            {/* HR routes */}
            <Route path="hr" element={<ProtectedRoute allowedRoles={['HR', 'ADMIN']}><MainLayout /></ProtectedRoute>}>
              <Route index element={<Navigate to="dashboard" />} />
              <Route path="dashboard" element={<HrDashboard />} />
              <Route path="employees" element={<EmployeeList />} />
              <Route path="employees/add" element={<EmployeeForm />} />
              <Route path="employees/:id" element={<EmployeeDetails />} />
              <Route path="attendance" element={<AttendanceManagement />} />
              <Route path="leave-requests" element={<LeaveManagement />} />
              <Route path="salary-slips" element={<SalarySlipGenerator />} />
            </Route>
            
            {/* Admin routes */}
            <Route path="admin" element={<ProtectedRoute allowedRoles={['ADMIN']}><MainLayout /></ProtectedRoute>}>
              <Route index element={<Navigate to="dashboard" />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="create-hr" element={<HrCreationForm />} />
              <Route path="manage-hr" element={<HrList />} />
            </Route>
            
            {/* Profile route - accessible to all authenticated users */}
            <Route path="profile" element={<Profile />} />
          </Route>
          
          {/* Catch all - 404 */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
