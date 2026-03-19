import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Alert,
  CircularProgress,
  FormControlLabel,
  Switch,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Restaurant as RestaurantIcon
} from '@mui/icons-material';
import { menuService } from '../../services/menuService';
import { MenuCategory, MenuItem } from '../../types/menu';

export const MenuDisplay: React.FC = () => {
  const [menuByCategories, setMenuByCategories] = useState<Array<MenuCategory & { items: MenuItem[] }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAvailableOnly, setShowAvailableOnly] = useState(true);

  useEffect(() => {
    loadMenu();
  }, [showAvailableOnly]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMenu = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await menuService.getMenuByCategories(showAvailableOnly);
      setMenuByCategories(data);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load menu';
      setError(errorMessage);
      console.error('Error loading menu:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    loadMenu();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <RestaurantIcon />
          Restaurant Menu
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={showAvailableOnly}
              onChange={(e) => setShowAvailableOnly(e.target.checked)}
            />
          }
          label="Available items only"
        />
      </Box>

      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={handleRetry}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {menuByCategories.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="h6" align="center" color="text.secondary">
              No menu items available
            </Typography>
            <Typography variant="body2" align="center" color="text.secondary">
              {showAvailableOnly 
                ? 'There are no available menu items at the moment. Try showing all items.'
                : 'The menu is empty. Please add some categories and menu items.'
              }
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Box>
          {menuByCategories.map((category, index) => (
            <Accordion key={category.id} defaultExpanded={index === 0}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                  <Box>
                    <Typography variant="h6" component="h2">
                      {category.name}
                    </Typography>
                    {category.description && (
                      <Typography variant="body2" color="text.secondary">
                        {category.description}
                      </Typography>
                    )}
                  </Box>
                  <Chip 
                    label={`${category.items.length} item${category.items.length !== 1 ? 's' : ''}`}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Box 
                  sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
                    gap: 2 
                  }}
                >
                  {category.items.map((item) => (
                    <Card 
                      key={item.id}
                      variant="outlined" 
                      sx={{ 
                        height: '100%',
                        opacity: item.isAvailable ? 1 : 0.6,
                        border: item.isAvailable ? undefined : '1px dashed',
                      }}
                    >
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                          <Typography variant="h6" component="h3" sx={{ flexGrow: 1 }}>
                            {item.name}
                          </Typography>
                          <Typography variant="h6" color="primary" fontWeight="bold">
                            ₹{item.price.toFixed(2)}
                          </Typography>
                        </Box>
                        
                        {item.description && (
                          <Typography variant="body2" color="text.secondary" paragraph>
                            {item.description}
                          </Typography>
                        )}

                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Chip
                            label={item.isAvailable ? 'Available' : 'Unavailable'}
                            color={item.isAvailable ? 'success' : 'default'}
                            size="small"
                          />
                          {item.ingredients && item.ingredients.length > 0 && (
                            <Typography variant="caption" color="text.secondary">
                              {item.ingredients.length} ingredient{item.ingredients.length !== 1 ? 's' : ''}
                            </Typography>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}
    </Box>
  );
};