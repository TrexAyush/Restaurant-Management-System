import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
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
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import { menuService } from '../../services/menuService';
import { MenuCategory, CreateMenuCategoryRequest, UpdateMenuCategoryRequest } from '../../types/menu';

interface CategoryFormData {
  name: string;
  description: string;
  sortOrder: number;
}

export const CategoryManagement: React.FC<{ readOnly?: boolean }> = ({ readOnly = false }) => {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    sortOrder: 0
  });
  const [submitting, setSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await menuService.getCategories(false); // Get all categories including inactive
      setCategories(data);
      setError(null);
    } catch (err) {
      setError('Failed to load categories');
      console.error('Error loading categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (category?: MenuCategory) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description || '',
        sortOrder: category.sortOrder
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        description: '',
        sortOrder: Math.max(...categories.map(c => c.sortOrder), 0) + 1
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingCategory(null);
    setFormData({ name: '', description: '', sortOrder: 0 });
    setValidationErrors({});
    setError(null);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Category name is required';
    } else if (formData.name.trim().length > 100) {
      errors.name = 'Category name must be 100 characters or less';
    }

    if (formData.description && formData.description.length > 500) {
      errors.description = 'Description must be 500 characters or less';
    }

    if (formData.sortOrder < 0 || !Number.isInteger(formData.sortOrder)) {
      errors.sortOrder = 'Sort order must be a non-negative integer';
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

      if (editingCategory) {
        const updateData: UpdateMenuCategoryRequest = {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          sortOrder: formData.sortOrder
        };
        await menuService.updateCategory(editingCategory.id, updateData);
      } else {
        const createData: CreateMenuCategoryRequest = {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          sortOrder: formData.sortOrder
        };
        await menuService.createCategory(createData);
      }

      await loadCategories();
      handleCloseDialog();
    } catch (err: any) {
      setError(err.message || 'Failed to save category');
      console.error('Error saving category:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (category: MenuCategory) => {
    if (!window.confirm(`Are you sure you want to ${category.isActive ? 'deactivate' : 'activate'} "${category.name}"?`)) {
      return;
    }

    try {
      setError(null);
      const updateData: UpdateMenuCategoryRequest = {
        isActive: !category.isActive
      };
      await menuService.updateCategory(category.id, updateData);
      await loadCategories();
    } catch (err: any) {
      setError(err.message || 'Failed to update category status');
      console.error('Error updating category status:', err);
    }
  };

  const handleDelete = async (category: MenuCategory) => {
    const confirmMessage = `Are you sure you want to delete "${category.name}"?\n\nThis action cannot be undone and will fail if the category contains menu items.`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setError(null);
      await menuService.deleteCategory(category.id);
      await loadCategories();
    } catch (err: any) {
      setError(err.message || 'Failed to delete category');
      console.error('Error deleting category:', err);
    }
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
        <Typography variant="h4" component="h1">
          Menu Categories
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          disabled={readOnly}
        >
          Add Category
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Sort Order</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell>
                  <Typography variant="subtitle1" fontWeight="medium">
                    {category.name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {category.description || '-'}
                  </Typography>
                </TableCell>
                <TableCell>{category.sortOrder}</TableCell>
                <TableCell>
                  <Chip
                    label={category.isActive ? 'Active' : 'Inactive'}
                    color={category.isActive ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {new Date(category.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell align="right">
                  {!readOnly && (
                    <>
                      <IconButton
                        size="small"
                        onClick={() => handleToggleActive(category)}
                        title={category.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {category.isActive ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(category)}
                        title="Edit"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(category)}
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
            {categories.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography variant="body2" color="text.secondary">
                    No categories found. Create your first category to get started.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Category Form Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingCategory ? 'Edit Category' : 'Add New Category'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Category Name"
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
              helperText={validationErrors.name || 'Enter a unique category name'}
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
              helperText={validationErrors.description || 'Optional description for the category'}
            />
            <TextField
              fullWidth
              label="Sort Order"
              type="number"
              value={formData.sortOrder}
              onChange={(e) => {
                setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 });
                if (validationErrors.sortOrder) {
                  setValidationErrors({ ...validationErrors, sortOrder: '' });
                }
              }}
              margin="normal"
              error={!!validationErrors.sortOrder}
              helperText={validationErrors.sortOrder || 'Lower numbers appear first in the menu'}
              inputProps={{ min: 0, step: 1 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={submitting || Object.keys(validationErrors).length > 0}
          >
            {submitting ? <CircularProgress size={20} /> : (editingCategory ? 'Update' : 'Create')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};