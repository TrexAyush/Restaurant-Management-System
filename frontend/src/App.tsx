import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginForm, ProtectedRoute, UserManagement } from './components/auth';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './components/dashboard/Dashboard';
import { MenuManagement } from './components/menu';
import { TableManagement } from './components/tables';
import { OrderManagement, KitchenDisplay } from './components/orders';
import { BillingManagement } from './components/billing';
import { ApplicationSettings } from './components/settings/ApplicationSettings';
import { InventoryManagement } from './components/inventory';
import { ReportsAnalytics } from './components/reports';
import { SystemMonitoring } from './components/monitoring';
import { UserRole } from './types/auth';

const theme = createTheme({
  palette: {
    primary: {
      main: '#F9C483',
      light: '#FFE8D1',
      dark: '#D4A373',
      contrastText: '#4C4C4C',
    },
    secondary: {
      light: '#FFFFFF',
      main: '#4C4C4C',
      dark: '#373C3C',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F5F5F5',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#4C4C4C',
      secondary: '#737373',
    },
  },
  typography: {
    fontFamily: `"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,

    h1: {
      fontFamily: `"Poppins", sans-serif`,
    },
    h2: {
      fontFamily: `"Poppins", sans-serif`,
    },
    h3: {
      fontFamily: `"Poppins", sans-serif`,
    },
    h4: {
      fontFamily: `"Poppins", sans-serif`,
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

        <Route
          path="settings"
          element={
            <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
              <ApplicationSettings />
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
      <ToastContainer position="top-right" autoClose={4000} hideProgressBar={false} closeOnClick pauseOnHover />
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
