import React, { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Paper,
  Typography,
  Alert,
  Stack
} from '@mui/material';
import {
  Category as CategoryIcon,
  Restaurant as RestaurantIcon,
  MenuBook as MenuBookIcon
} from '@mui/icons-material';
import { CategoryManagement } from './CategoryManagement';
import { MenuItemManagement } from './MenuItemManagement';
import { MenuDisplay } from './MenuDisplay';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types/auth';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`menu-tabpanel-${index}`}
      aria-labelledby={`menu-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `menu-tab-${index}`,
    'aria-controls': `menu-tabpanel-${index}`,
  };
}

export const MenuManagement: React.FC = () => {
  const [value, setValue] = useState(0);
  const { user } = useAuth();

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const canManageMenu = user && [UserRole.ADMIN, UserRole.MANAGER].includes(user.role);

  return (
    <Box sx={{ width: '100%' }}>
      <Paper
        sx={{
          p: { xs: 2.5, md: 3 },
          mb: 3,
          background: 'linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(99,102,241,0.08) 100%)',
        }}
      >
        <Box>
          <Typography variant="h4" component="h1" sx={{ mb: 0.75 }}>
            Menu Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Organize categories, fine-tune items and pricing, and preview the live customer menu.
          </Typography>
        </Box>
      </Paper>
      
      {!canManageMenu && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          You have read-only access to the menu. Contact an administrator or manager to make changes.
        </Alert>
      )}
      
      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={value} 
            onChange={handleChange} 
            aria-label="menu management tabs"
            variant="fullWidth"
          >
            <Tab 
              icon={<CategoryIcon />} 
              label="Categories" 
              {...a11yProps(0)} 
            />
            <Tab 
              icon={<RestaurantIcon />} 
              label="Menu Items" 
              {...a11yProps(1)} 
            />
            <Tab 
              icon={<MenuBookIcon />} 
              label="View Menu" 
              {...a11yProps(2)} 
            />
          </Tabs>
        </Box>
        
        <TabPanel value={value} index={0}>
          <CategoryManagement readOnly={!canManageMenu} />
        </TabPanel>
        
        <TabPanel value={value} index={1}>
          <MenuItemManagement readOnly={!canManageMenu} />
        </TabPanel>
        
        <TabPanel value={value} index={2}>
          <MenuDisplay />
        </TabPanel>
      </Paper>
    </Box>
  );
};