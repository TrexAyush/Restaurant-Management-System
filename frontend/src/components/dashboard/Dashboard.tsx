import React from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Divider,
  Chip,
  Stack
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
import { DashboardKPIs } from './DashboardKPIs';
import { RecentOrders } from './RecentOrders';
import { SalesTrends } from './SalesTrends';

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
    roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.WAITER],
    color: '#f57c00'
  },
  {
    title: 'Kitchen Display',
    description: 'View and manage kitchen orders',
    icon: <Restaurant sx={{ fontSize: 40 }} />,
    path: '/kitchen',
    roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.KITCHEN_STAFF],
    color: '#00796b'
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

  const spotlightStats = [
    { label: 'Accessible Modules', value: filteredCards.length.toString().padStart(2, '0') },
    { label: 'Role', value: user?.role.replace('_', ' ')?.toUpperCase() || 'UNKNOWN' },
    { label: 'Shift Mode', value: new Date().getHours() < 18 ? 'DAY' : 'EVENING' },
  ];

  return (
    <Box>
      <Paper
        sx={{
          p: { xs: 3, md: 4 },
          mb: 3,
          overflow: 'hidden',
          position: 'relative',
          background:
            'radial-gradient(circle at top right, rgba(255,255,255,0.18), transparent 24%), linear-gradient(135deg, #312e81 0%, #4f46e5 42%, #0ea5e9 100%)',
          color: 'white',
          border: 'none',
          boxShadow: '0 24px 48px -24px rgba(79, 70, 229, 0.45)',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(135deg, rgba(255,255,255,0.06) 25%, transparent 25%) -20px 0 / 40px 40px',
            opacity: 0.45,
          }}
        />
        <Box sx={{ position: 'relative' }}>
          <Chip
            label="Operations Overview"
            sx={{
              mb: 2,
              bgcolor: 'rgba(255,255,255,0.12)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.2)',
            }}
          />
          <Typography variant="h3" gutterBottom>
            {getGreeting()}, {user?.firstName || user?.username}.
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.92, maxWidth: 720, fontWeight: 400 }}>
            Keep service moving with a sharper view of orders, team activity, table status, and business health.
          </Typography>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ mt: 3.5 }}>
            {spotlightStats.map((item) => (
              <Paper
                key={item.label}
                sx={{
                  px: 2,
                  py: 1.5,
                  minWidth: 180,
                  bgcolor: 'rgba(255,255,255,0.12)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.16)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.72)', display: 'block', mb: 0.5 }}>
                  {item.label}
                </Typography>
                <Typography variant="h6">{item.value}</Typography>
              </Paper>
            ))}
          </Stack>
        </Box>
      </Paper>

      {/* KPIs Section */}
      <Box sx={{ mb: 4 }}>
        <DashboardKPIs />
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Recent Orders and Sales Trends */}
      <Box sx={{ mb: 4 }}>
        <SalesTrends />
      </Box>

      {/* Recent Orders */}
      <Box sx={{ mb: 4 }}>
        <RecentOrders />
      </Box>

      <Divider sx={{ my: 3 }} />

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
                background:
                  'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.98) 100%)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-6px)',
                  boxShadow: 4,
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: 'center', pt: 3.5, px: 3 }}>
                <Box
                  sx={{
                    color: card.color,
                    mb: 2.25,
                    width: 72,
                    height: 72,
                    borderRadius: '16px',
                    mx: 'auto',
                    display: 'grid',
                    placeItems: 'center',
                    background: `${card.color}16`,
                    border: `1px solid ${card.color}28`,
                  }}
                >
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
                    minWidth: 120,
                    backgroundColor: card.color,
                    '&:hover': {
                      backgroundColor: card.color,
                      opacity: 0.88,
                    },
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