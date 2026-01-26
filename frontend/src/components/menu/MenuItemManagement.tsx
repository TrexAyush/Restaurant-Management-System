import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem as MuiMenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Chip,
  Alert,
  CircularProgress,
  TablePagination,
  InputAdornment,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import { menuService } from '../../services/menuService';
import {
  MenuCategory,
  MenuItemWithCategory,
  CreateMenuItemRequest,
  UpdateMenuItemRequest,
  MenuItemSearchFilters,
  PaginationParams
} from '../../types/menu';

interface MenuItemFormData {
  name: string;
  description: string;
  price: number;
  categoryId: string;
}

export const MenuItemManagement: React.FC<{ readOnly?: boolean }> = ({ readOnly = false }) => {
  const [menuItems, setMenuItems] = useState<MenuItemWithCategory[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItemWithCategory | null>(null);
  const [formData, setFormData] = useState<MenuItemFormData>({
    name: '',
    description: '',
    price: 0,
    categoryId: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Pagination and filtering
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadMenuItems();
  }, [page, rowsPerPage, searchTerm, selectedCategory, showAvailableOnly]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadCategories = async () => {
    try {
      const data = await menuService.getCategories(true); // Only active categories
      setCategories(data);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const loadMenuItems = async () => {
    try {
      setLoading(true);
      const filters: MenuItemSearchFilters = {
        categoryId: selectedCategory || undefined,
        isAvailable: showAvailableOnly ? true : undefined,
        searchTerm: searchTerm || undefined
      };

      const pagination: PaginationParams = {
        page: page + 1, // API uses 1-based pagination
        limit: rowsPerPage,
        sortBy: 'name',
        sortOrder: 'asc'
      };

      const response = await menuService.getMenuItems(filters, pagination);
      setMenuItems(response.data);
      setTotalItems(response.pagination.total);
      setError(null);
    } catch (err) {
      setError('Failed to load menu items');
      console.error('Error loading menu items:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (item?: MenuItemWithCategory) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        description: item.description || '',
        price: item.price,
        categoryId: item.categoryId
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        description: '',
        price: 0,
        categoryId: categories.length > 0 ? categories[0].id : ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingItem(null);
    setFormData({ name: '', description: '', price: 0, categoryId: '' });
    setValidationErrors({});
    setError(null);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Menu item name is required';
    } else if (formData.name.trim().length > 200) {
      errors.name = 'Menu item name must be 200 characters or less';
    }

    if (formData.description && formData.description.length > 1000) {
      errors.description = 'Description must be 1000 characters or less';
    }

    if (typeof formData.price !== 'number' || formData.price <= 0) {
      errors.price = 'Price must be greater than 0';
    } else if (formData.price > 999999.99) {
      errors.price = 'Price must be less than $999,999.99';
    }

    if (!formData.categoryId) {
      errors.categoryId = 'Category is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      if (editingItem) {
        const updateData: UpdateMenuItemRequest = {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          price: formData.price,
          categoryId: formData.categoryId
        };
        await menuService.updateMenuItem(editingItem.id, updateData);
      } else {
        const createData: CreateMenuItemRequest = {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          price: formData.price,
          categoryId: formData.categoryId
        };
        await menuService.createMenuItem(createData);
      }

      await loadMenuItems();
      handleCloseDialog();
    } catch (err: any) {
      setError(err.message || 'Failed to save menu item');
      console.error('Error saving menu item:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleAvailability = async (item: MenuItemWithCategory) => {
    const action = item.isAvailable ? 'make unavailable' : 'make available';
    if (!window.confirm(`Are you sure you want to ${action} "${item.name}"?`)) {
      return;
    }

    try {
      setError(null);
      await menuService.toggleMenuItemAvailability(item.id, !item.isAvailable);
      await loadMenuItems();
    } catch (err: any) {
      setError(err.message || 'Failed to update item availability');
      console.error('Error updating item availability:', err);
    }
  };

  const handleDelete = async (item: MenuItemWithCategory) => {
    const confirmMessage = `Are you sure you want to delete "${item.name}"?\n\nThis will make it unavailable but preserve it in order history.`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setError(null);
      await menuService.deleteMenuItem(item.id);
      await loadMenuItems();
    } catch (err: any) {
      setError(err.message || 'Failed to delete menu item');
      console.error('Error deleting menu item:', err);
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0); // Reset to first page when searching
  };

  const handleCategoryFilterChange = (event: any) => {
    setSelectedCategory(event.target.value);
    setPage(0); // Reset to first page when filtering
  };

  const handleAvailabilityFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setShowAvailableOnly(event.target.checked);
    setPage(0); // Reset to first page when filtering
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Unknown Category';
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Menu Items
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          disabled={categories.length === 0 || readOnly}
        >
          Add Menu Item
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {categories.length === 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          No categories available. Please create at least one category before adding menu items.
        </Alert>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
          <Box sx={{ minWidth: 200, flexGrow: 1 }}>
            <TextField
              fullWidth
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
          <Box sx={{ minWidth: 150 }}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={selectedCategory}
                onChange={handleCategoryFilterChange}
                label="Category"
              >
                <MuiMenuItem value="">All Categories</MuiMenuItem>
                {categories.map((category) => (
                  <MuiMenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MuiMenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={showAvailableOnly}
                  onChange={handleAvailabilityFilterChange}
                />
              }
              label="Available only"
            />
          </Box>
        </Box>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {menuItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Box>
                    <Typography variant="subtitle1" fontWeight="medium">
                      {item.name}
                    </Typography>
                    {item.description && (
                      <Typography variant="body2" color="text.secondary">
                        {item.description}
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={item.category?.name || getCategoryName(item.categoryId)}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="subtitle1" fontWeight="medium">
                    ${item.price.toFixed(2)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={item.isAvailable ? 'Available' : 'Unavailable'}
                    color={item.isAvailable ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {new Date(item.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell align="right">
                  {!readOnly && (
                    <>
                      <IconButton
                        size="small"
                        onClick={() => handleToggleAvailability(item)}
                        title={item.isAvailable ? 'Make Unavailable' : 'Make Available'}
                      >
                        {item.isAvailable ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(item)}
                        title="Edit"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(item)}
                        title="Delete"
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </>
                  )}
                  {readOnly && (
                    <Typography variant="body2" color="text.secondary">
                      Read Only
                    </Typography>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {!loading && menuItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography variant="body2" color="text.secondary">
                    No menu items found. {searchTerm || selectedCategory || showAvailableOnly ? 'Try adjusting your filters.' : 'Create your first menu item to get started.'}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {loading && (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        )}
      </TableContainer>

      <TablePagination
        component="div"
        count={totalItems}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(event) => {
          setRowsPerPage(parseInt(event.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[5, 10, 25, 50]}
      />

      {/* Menu Item Form Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Item Name"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (validationErrors.name) {
                  setValidationErrors({ ...validationErrors, name: '' });
                }
              }}
              margin="normal"
              required
              error={!!validationErrors.name}
              helperText={validationErrors.name || 'Enter a unique menu item name'}
            />
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => {
                setFormData({ ...formData, description: e.target.value });
                if (validationErrors.description) {
                  setValidationErrors({ ...validationErrors, description: '' });
                }
              }}
              margin="normal"
              multiline
              rows={3}
              error={!!validationErrors.description}
              helperText={validationErrors.description || 'Optional description of the menu item'}
            />
            <TextField
              fullWidth
              label="Price"
              type="number"
              value={formData.price}
              onChange={(e) => {
                const price = parseFloat(e.target.value) || 0;
                setFormData({ ...formData, price });
                if (validationErrors.price) {
                  setValidationErrors({ ...validationErrors, price: '' });
                }
              }}
              margin="normal"
              required
              inputProps={{ min: 0, step: 0.01 }}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              error={!!validationErrors.price}
              helperText={validationErrors.price || 'Enter the price for this item'}
            />
            <FormControl fullWidth margin="normal" required error={!!validationErrors.categoryId}>
              <InputLabel>Category</InputLabel>
              <Select
                value={formData.categoryId}
                onChange={(e) => {
                  setFormData({ ...formData, categoryId: e.target.value });
                  if (validationErrors.categoryId) {
                    setValidationErrors({ ...validationErrors, categoryId: '' });
                  }
                }}
                label="Category"
              >
                {categories.map((category) => (
                  <MuiMenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MuiMenuItem>
                ))}
              </Select>
              {validationErrors.categoryId && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                  {validationErrors.categoryId}
                </Typography>
              )}
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={submitting || Object.keys(validationErrors).length > 0}
          >
            {submitting ? <CircularProgress size={20} /> : (editingItem ? 'Update' : 'Create')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};