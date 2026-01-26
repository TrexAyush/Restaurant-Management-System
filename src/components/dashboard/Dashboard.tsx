import React from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button
} from '@mui/material';
import {
  Restaurant,
  TableRestaurant,
  ShoppingCart,
  Receipt,
  Inventory,
  Analytics,
  People
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types/auth';

interface DashboardCard {
  title: string;
  description: string;
  icon: React.ReactElement;
  path: string;
  roles: UserRole[];
  color: string;
}

const dashboardCards: DashboardCard[] = [
  {
    title: 'Menu Management',
    description: 'Manage menu items, categories, and pricing',
    icon: <Restaurant sx={{ fontSize: 40 }} />,
    path: '/menu',
    roles: [UserRole.ADMIN, UserRole.MANAGER],
    color: '#1976d2'
  },
  {
    title: 'Table Management',
    description: 'Monitor table status and manage seating',
    icon: <TableRestaurant sx={{ fontSize: 40 }} />,
    path: '/tables',
    roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.WAITER],
    color: '#388e3c'
  },
  {
    title: 'Orders',
    description: 'Create and manage customer orders',
    icon: <ShoppingCart sx={{ fontSize: 40 }} />,
    path: '/orders',
    roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.WAITER, UserRole.KITCHEN_STAFF],
    color: '#f57c00'
  },
  {
    title: 'Billing',
    description: 'Process payments and generate invoices',
    icon: <Receipt sx={{ fontSize: 40 }} />,
    path: '/billing',
    roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER],
    color: '#7b1fa2'
  },
  {
    title: 'Inventory',
    description: 'Track stock levels and manage supplies',
    icon: <Inventory sx={{ fontSize: 40 }} />,
    path: '/inventory',
    roles: [UserRole.ADMIN, UserRole.MANAGER],
    color: '#d32f2f'
  },
  {
    title: 'Reports & Analytics',
    description: 'View sales reports and business insights',
    icon: <Analytics sx={{ fontSize: 40 }} />,
    path: '/reports',
    roles: [UserRole.ADMIN, UserRole.MANAGER],
    color: '#303f9f'
  },
  {
    title: 'User Management',
    description: 'Manage staff accounts and permissions',
    icon: <People sx={{ fontSize: 40 }} />,
    path: '/users',
    roles: [UserRole.ADMIN],
    color: '#c2185b'
  }
];

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const filteredCards = dashboardCards.filter(card =>
    user && card.roles.includes(user.role)
  );

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <Typography variant="h4" gutterBottom>
          {getGreeting()}, {user?.firstName}!
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.9 }}>
          Welcome to the Restaurant Management System
        </Typography>
        <Typography variant="body1" sx={{ mt: 1, opacity: 0.8 }}>
          Role: {user?.role.replace('_', ' ').toUpperCase()}
        </Typography>
      </Paper>

      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        Quick Access
      </Typography>

      <Grid container spacing={3}>
        {filteredCards.map((card) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={card.path}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: 'center', pt: 3 }}>
                <Box sx={{ color: card.color, mb: 2 }}>
                  {card.icon}
                </Box>
                <Typography variant="h6" component="h2" gutterBottom>
                  {card.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {card.description}
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                <Button
                  variant="contained"
                  onClick={() => navigate(card.path)}
                  sx={{
                    backgroundColor: card.color,
                    '&:hover': {
                      backgroundColor: card.color,
                      opacity: 0.8
                    }
                  }}
                >
                  Open
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredCards.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No modules available for your role
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Contact your administrator for access to system features
          </Typography>
        </Paper>
      )}
    </Box>
  );
};