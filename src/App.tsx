import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { WebSocketProvider } from './contexts/WebSocketContext';
import { LoginForm, ProtectedRoute, UserManagement } from './components/auth';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './components/dashboard/Dashboard';
import { MenuManagement } from './components/menu';
import { TableManagement } from './components/tables';
import { OrderManagement, KitchenDisplay } from './components/orders';
import { BillingManagement } from './components/billing';
import { InventoryManagement } from './components/inventory';
import { ReportsAnalytics } from './components/reports';
import { SystemMonitoring } from './components/monitoring';
import { UserRole } from './types/auth';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const AppRoutes: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/dashboard" replace />} />
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        
        <Route 
          path="menu" 
          element={
            <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.MANAGER]}>
              <MenuManagement />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="users" 
          element={
            <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
              <UserManagement />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="tables" 
          element={
            <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.MANAGER, UserRole.WAITER]}>
              <TableManagement />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="orders" 
          element={
            <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.MANAGER, UserRole.WAITER, UserRole.KITCHEN_STAFF]}>
              <OrderManagement />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="kitchen" 
          element={
            <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.MANAGER, UserRole.KITCHEN_STAFF]}>
              <KitchenDisplay />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="billing" 
          element={
            <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER]}>
              <BillingManagement />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="inventory" 
          element={
            <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.MANAGER]}>
              <InventoryManagement />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="reports" 
          element={
            <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.MANAGER]}>
              <ReportsAnalytics />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="monitoring" 
          element={
            <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.MANAGER]}>
              <SystemMonitoring />
            </ProtectedRoute>
          } 
        />
      </Route>
    </Routes>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <WebSocketProvider>
          <Router>
            <AppRoutes />
          </Router>
        </WebSocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
