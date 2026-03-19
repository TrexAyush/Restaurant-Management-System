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
      main: '#6366f1',
      light: '#a5b4fc',
      dark: '#4338ca',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#0f172a',
      light: '#334155',
      dark: '#020617',
      contrastText: '#ffffff',
    },
    success: {
      main: '#10b981',
      light: '#d1fae5',
      dark: '#059669',
    },
    warning: {
      main: '#f59e0b',
      light: '#fef3c7',
      dark: '#d97706',
    },
    error: {
      main: '#ef4444',
      light: '#fee2e2',
      dark: '#dc2626',
    },
    info: {
      main: '#3b82f6',
      light: '#dbeafe',
      dark: '#2563eb',
    },
    background: {
      default: '#f8f9fc',
      paper: '#ffffff',
    },
    text: {
      primary: '#1e293b',
      secondary: '#64748b',
    },
    divider: '#e2e8f0',
  },
  shape: {
    borderRadius: 10,
  },
  shadows: [
    'none',
    '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
    '0 2px 4px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06)',
    '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05)',
    '0 6px 12px -2px rgba(0,0,0,0.06), 0 3px 6px -3px rgba(0,0,0,0.05)',
    '0 10px 25px -3px rgba(0,0,0,0.07), 0 4px 6px -4px rgba(0,0,0,0.05)',
    '0 12px 28px -4px rgba(0,0,0,0.08), 0 5px 8px -4px rgba(0,0,0,0.05)',
    '0 14px 32px -4px rgba(0,0,0,0.08)',
    '0 16px 36px -5px rgba(0,0,0,0.09)',
    '0 18px 40px -5px rgba(0,0,0,0.1)',
    '0 20px 44px -6px rgba(0,0,0,0.1)',
    '0 22px 48px -6px rgba(0,0,0,0.11)',
    '0 24px 52px -6px rgba(0,0,0,0.11)',
    '0 26px 56px -7px rgba(0,0,0,0.12)',
    '0 28px 60px -7px rgba(0,0,0,0.12)',
    '0 30px 64px -8px rgba(0,0,0,0.13)',
    '0 32px 68px -8px rgba(0,0,0,0.13)',
    '0 34px 72px -9px rgba(0,0,0,0.14)',
    '0 36px 76px -9px rgba(0,0,0,0.14)',
    '0 38px 80px -10px rgba(0,0,0,0.15)',
    '0 40px 84px -10px rgba(0,0,0,0.15)',
    '0 42px 88px -11px rgba(0,0,0,0.16)',
    '0 44px 92px -11px rgba(0,0,0,0.16)',
    '0 46px 96px -12px rgba(0,0,0,0.17)',
    '0 48px 100px -12px rgba(0,0,0,0.17)',
  ] as any,
  typography: {
    fontFamily: `"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,
    h1: {
      fontFamily: `"Poppins", sans-serif`,
      fontWeight: 700,
      letterSpacing: '-0.025em',
    },
    h2: {
      fontFamily: `"Poppins", sans-serif`,
      fontWeight: 700,
      letterSpacing: '-0.025em',
    },
    h3: {
      fontFamily: `"Poppins", sans-serif`,
      fontWeight: 600,
      letterSpacing: '-0.02em',
    },
    h4: {
      fontFamily: `"Poppins", sans-serif`,
      fontWeight: 600,
      letterSpacing: '-0.02em',
    },
    h5: {
      fontFamily: `"Poppins", sans-serif`,
      fontWeight: 600,
    },
    h6: {
      fontFamily: `"Poppins", sans-serif`,
      fontWeight: 600,
    },
    subtitle1: {
      fontWeight: 500,
    },
    subtitle2: {
      fontWeight: 500,
      letterSpacing: '0.02em',
      textTransform: 'uppercase' as const,
      fontSize: '0.75rem',
    },
    button: {
      fontWeight: 600,
      letterSpacing: '0.02em',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#f8f9fc',
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 20px',
          fontSize: '0.875rem',
          textTransform: 'none' as const,
          fontWeight: 600,
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        },
        contained: {
          boxShadow: '0 1px 3px rgba(99, 102, 241, 0.3)',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
            transform: 'translateY(-1px)',
          },
        },
        outlined: {
          borderWidth: '1.5px',
          '&:hover': {
            borderWidth: '1.5px',
            backgroundColor: 'rgba(99, 102, 241, 0.04)',
          },
        },
      },
    },
    MuiCard: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          borderRadius: 14,
          border: '1px solid #e2e8f0',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            borderColor: '#c7d2fe',
            boxShadow: '0 10px 25px -3px rgba(99, 102, 241, 0.08), 0 4px 6px -4px rgba(99, 102, 241, 0.05)',
          },
        },
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          borderRadius: 14,
          border: '1px solid #e2e8f0',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 600,
          fontSize: '0.75rem',
        },
        filled: {
          border: 'none',
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined' as const,
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            transition: 'all 0.2s ease',
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#a5b4fc',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderWidth: '2px',
            },
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          boxShadow: '0 20px 60px -10px rgba(0,0,0,0.15)',
          border: 'none',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontFamily: '"Poppins", sans-serif',
          fontWeight: 600,
          fontSize: '1.25rem',
          padding: '20px 24px 8px',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            fontWeight: 600,
            fontSize: '0.75rem',
            letterSpacing: '0.05em',
            textTransform: 'uppercase' as const,
            color: '#64748b',
            backgroundColor: '#f8fafc',
            borderBottom: '2px solid #e2e8f0',
            padding: '14px 16px',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #f1f5f9',
          padding: '12px 16px',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background-color 0.15s ease',
          '&:hover': {
            backgroundColor: '#f8fafc',
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          border: 'none',
          fontWeight: 500,
        },
        standardSuccess: {
          backgroundColor: '#ecfdf5',
          color: '#065f46',
        },
        standardError: {
          backgroundColor: '#fef2f2',
          color: '#991b1b',
        },
        standardWarning: {
          backgroundColor: '#fffbeb',
          color: '#92400e',
        },
        standardInfo: {
          backgroundColor: '#eff6ff',
          color: '#1e40af',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          border: 'none',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none' as const,
          fontWeight: 600,
          fontSize: '0.875rem',
          minHeight: 44,
          borderRadius: 10,
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          height: 3,
          borderRadius: 3,
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          transition: 'all 0.2s ease',
        },
      },
    },
    MuiSkeleton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          transition: 'all 0.2s ease',
        },
      },
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
