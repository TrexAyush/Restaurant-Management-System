import React, { useState } from 'react';
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

const drawerWidth = 240;

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
    icon: <SpeedometerIcon size={24} color="#4C4C4C" weight="duotone" />,
    roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.WAITER, UserRole.KITCHEN_STAFF, UserRole.CASHIER]
  },
  {
    label: 'Menu Management',
    path: '/menu',
    icon: <BookOpenTextIcon size={24} color="#4C4C4C" weight="duotone" />,
    roles: [UserRole.ADMIN, UserRole.MANAGER]
  },
  {
    label: 'Table Management',
    path: '/tables',
    icon: <StoolIcon size={24} color="#4C4C4C" weight="duotone" />,
    roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.WAITER]
  },
  {
    label: 'Order Management',
    path: '/orders',
    icon: <ListChecksIcon size={23} color="#4C4C4C" weight="duotone" />,
    roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.WAITER]
  },
  {
    label: 'Kitchen Display',
    path: '/kitchen',
    icon: <ForkKnifeIcon size={24} color="#4C4C4C" weight="duotone" />,
    roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.KITCHEN_STAFF]
  },
  {
    label: 'Billing',
    path: '/billing',
    icon: <ReceiptIcon size={24} color="#4C4C4C" weight="duotone" />,
    roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER]
  },
  {
    label: 'Inventory',
    path: '/inventory',
    icon: <WarehouseIcon size={24} color="#4C4C4C" weight="duotone" />,
    roles: [UserRole.ADMIN, UserRole.MANAGER]
  },
  {
    label: 'Reports',
    path: '/reports',
    icon: <GaugeIcon size={24} color="#4C4C4C" weight="duotone" />,
    roles: [UserRole.ADMIN, UserRole.MANAGER]
  },
  {
    label: 'User Management',
    path: '/users',
    icon: <UsersIcon size={24} color="#4C4C4C" weight="duotone" />,
    roles: [UserRole.ADMIN]
  },
  {
    label: 'Settings',
    path: '/settings',
    icon: <GaugeIcon size={24} color="#4C4C4C" weight="duotone" />,
    roles: [UserRole.ADMIN]
  }
];

export const AppLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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
    <Box>
      <Toolbar sx={{ backgroundColor: 'white', minHeight: 56 }}>
        <Box sx={{
          width: 360,
          height: 120,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mt: -2,
          ml: -4,
          mb: -5
        }}>
          <Box
            component="img"
            src="/images/logo/LogoTrans2.png"
            alt="RMS Logo"
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              transform: 'scale(1.8)', // 👈 zoom factor
              transformOrigin: 'center',
            }}
          />
        </Box>
      </Toolbar>
      <Divider />
      <List>
        {filteredNavigationItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => {
                navigate(item.path);
                setMobileOpen(false);
              }}
              sx={{ mx: 1, borderRadius: 1,
                '&.Mui-selected': { backgroundColor: 'primary.light', color: 'primary.contrastText' },
                '&:hover': { backgroundColor: 'primary.light', color: 'primary.contrastText'} ,
                '&.Mui-selected:hover': { backgroundColor: 'primary.dark', color: 'primary.contrastText'}
              }}
            >
              <ListItemIcon sx={{ minWidth: '40px' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          backgroundColor: 'white',
          color: '#4C4C4C',
          boxShadow: 'none',
          borderBottom: '1px solid #e0e0e0'
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <TextIndentIcon size={28} color='#4C4C4C' weight="duotone" />
          </IconButton>
          <Typography variant="h5" noWrap component="div" sx={{ flexGrow: 1 }}>
            Restaurant Management System
          </Typography>

          {user && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip
                label={user.role.replace('_', ' ').toUpperCase()}
                color={getRoleColor(user.role)}
                size="small"
                variant='outlined'
              />
              <Button
                color="inherit"
                onClick={handleProfileMenuOpen}
                startIcon={<UserCircleIcon size={28} color="#4C4C4C" weight="duotone" />}
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
      >
        <MenuItem onClick={handleProfileMenuClose}>
          <ListItemIcon sx={{ minWidth: '28px'}}>
            <UserCircleIcon size={22} color="#4C4C4C" weight="duotone"/>
          </ListItemIcon>
          Profile
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <ListItemIcon sx={{ minWidth: '28px'}}>
            <SignOutIcon size={22} color='#4c4c4c' weight="duotone" />
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
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
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
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};