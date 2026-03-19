import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  Divider
} from '@mui/material';
import { BookOpenTextIcon, ForkKnifeIcon, GaugeIcon, ListChecksIcon, ReceiptIcon, SignOutIcon, SpeedometerIcon, StoolIcon, TextIndentIcon, UserCircleIcon, UsersIcon, WarehouseIcon } from '@phosphor-icons/react';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types/auth';
import { BillingService } from '../../services/billingService';

const drawerWidth = 260;

interface NavigationItem {
  label: string;
  path: string;
  icon: React.ReactElement;
  roles: UserRole[];
}

const navigationItems: NavigationItem[] = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: <SpeedometerIcon size={22} weight="duotone" />,
    roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.WAITER, UserRole.KITCHEN_STAFF, UserRole.CASHIER]
  },
  {
    label: 'Menu Management',
    path: '/menu',
    icon: <BookOpenTextIcon size={22} weight="duotone" />,
    roles: [UserRole.ADMIN, UserRole.MANAGER]
  },
  {
    label: 'Table Management',
    path: '/tables',
    icon: <StoolIcon size={22} weight="duotone" />,
    roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.WAITER]
  },
  {
    label: 'Order Management',
    path: '/orders',
    icon: <ListChecksIcon size={22} weight="duotone" />,
    roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.WAITER]
  },
  {
    label: 'Kitchen Display',
    path: '/kitchen',
    icon: <ForkKnifeIcon size={22} weight="duotone" />,
    roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.KITCHEN_STAFF]
  },
  {
    label: 'Billing',
    path: '/billing',
    icon: <ReceiptIcon size={22} weight="duotone" />,
    roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER]
  },
  {
    label: 'Inventory',
    path: '/inventory',
    icon: <WarehouseIcon size={22} weight="duotone" />,
    roles: [UserRole.ADMIN, UserRole.MANAGER]
  },
  {
    label: 'Reports',
    path: '/reports',
    icon: <GaugeIcon size={22} weight="duotone" />,
    roles: [UserRole.ADMIN, UserRole.MANAGER]
  },
  {
    label: 'User Management',
    path: '/users',
    icon: <UsersIcon size={22} weight="duotone" />,
    roles: [UserRole.ADMIN]
  },
  {
    label: 'Settings',
    path: '/settings',
    icon: <GaugeIcon size={22} weight="duotone" />,
    roles: [UserRole.ADMIN]
  }
];

export const AppLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [restaurantName, setRestaurantName] = useState(
    () => localStorage.getItem('restaurantName') || 'Plated'
  );
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user && [UserRole.ADMIN, UserRole.MANAGER].includes(user.role)) {
      BillingService.getRestaurantInfo()
        .then((info) => {
          if (info?.name) {
            setRestaurantName(info.name);
            localStorage.setItem('restaurantName', info.name);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleProfileMenuClose();
    await logout();
    navigate('/login');
  };

  const getRoleColor = (role: UserRole) => {
    const colors: Record<UserRole, 'primary' | 'secondary' | 'success' | 'warning' | 'error'> = {
      [UserRole.ADMIN]: 'error',
      [UserRole.MANAGER]: 'primary',
      [UserRole.WAITER]: 'success',
      [UserRole.KITCHEN_STAFF]: 'warning',
      [UserRole.CASHIER]: 'secondary'
    };
    return colors[role];
  };

  const filteredNavigationItems = navigationItems.filter(item =>
    user && item.roles.includes(user.role)
  );

  const drawer = (
    <Box sx={{ height: '100%', background: 'linear-gradient(180deg, #111827 0%, #1f2937 100%)', color: '#e2e8f0' }}>
      <Toolbar sx={{ minHeight: 80, px: 2, justifyContent: 'center' }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: '#f1f5f9',
            textAlign: 'center',
          }}
        >
          {restaurantName}
        </Typography>
      </Toolbar>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mx: 2 }} />
      <List sx={{ px: 1.5, py: 2 }}>
        {filteredNavigationItems.map((item) => {
          const isSelected = location.pathname === item.path;
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.4 }}>
              <ListItemButton
                selected={isSelected}
                onClick={() => {
                  navigate(item.path);
                  setMobileOpen(false);
                }}
                sx={{
                  mx: 0.5,
                  borderRadius: '10px',
                  py: 1.1,
                  px: 2,
                  color: isSelected ? '#ffffff' : '#94a3b8',
                  background: isSelected
                    ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                    : 'transparent',
                  boxShadow: isSelected ? '0 4px 12px rgba(99, 102, 241, 0.4)' : 'none',
                  '&:hover': {
                    backgroundColor: isSelected ? undefined : 'rgba(255,255,255,0.06)',
                    color: '#ffffff',
                  },
                  '&.Mui-selected:hover': {
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  },
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                <ListItemIcon sx={{ minWidth: '36px', color: 'inherit' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: '0.85rem',
                    fontWeight: isSelected ? 600 : 400,
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        background: '#f8fafc',
      }}
    >
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          backgroundColor: 'rgba(248, 250, 252, 0.85)',
          backdropFilter: 'blur(12px)',
          color: '#1e293b',
          boxShadow: 'none',
          borderBottom: '1px solid rgba(226, 232, 240, 0.8)'
        }}
      >
        <Toolbar sx={{ minHeight: 64 }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <TextIndentIcon size={24} weight="duotone" />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 600, color: '#1e293b' }}>
            Restaurant Management System
          </Typography>

          {user && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Chip
                label={user.role.replace('_', ' ').toUpperCase()}
                color={getRoleColor(user.role)}
                size="small"
                variant='filled'
                sx={{ fontWeight: 600, letterSpacing: '0.03em' }}
              />
              <Button
                color="inherit"
                onClick={handleProfileMenuOpen}
                startIcon={<UserCircleIcon size={24} weight="duotone" />}
                sx={{
                  borderRadius: '10px',
                  px: 2,
                  py: 0.8,
                  backgroundColor: 'rgba(99, 102, 241, 0.06)',
                  color: '#334155',
                  fontWeight: 500,
                  '&:hover': {
                    backgroundColor: 'rgba(99, 102, 241, 0.12)',
                  },
                }}
              >
                {user && user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user ? user.username : 'Loading...'}
              </Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        PaperProps={{
          sx: {
            mt: 1.5,
            minWidth: 220,
            borderRadius: '12px',
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 18px 40px -16px rgba(15, 23, 42, 0.24)',
          },
        }}
      >
        <MenuItem onClick={handleProfileMenuClose} sx={{ gap: 1.5, py: 1.25 }}>
          <ListItemIcon sx={{ minWidth: '28px'}}>
            <UserCircleIcon size={22} color="#334155" weight="duotone"/>
          </ListItemIcon>
          Profile
        </MenuItem>
        <MenuItem onClick={handleLogout} sx={{ gap: 1.5, py: 1.25 }}>
          <ListItemIcon sx={{ minWidth: '28px'}}>
            <SignOutIcon size={22} color='#334155' weight="duotone" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>

      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              backgroundImage: 'none',
              borderRadius: 0,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              backgroundImage: 'none',
              boxShadow: 'none',
              borderRight: '1px solid rgba(30, 41, 59, 0.12)',
              borderRadius: 0,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 3 },
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
          minHeight: '100vh',
          background: '#f8fafc',
        }}
      >
        <Box
          sx={{
            maxWidth: 1600,
            mx: 'auto',
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};