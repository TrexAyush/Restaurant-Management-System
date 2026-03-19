import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  TablePagination,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Stack
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { 
  InventoryItem, 
  CreateInventoryItemRequest, 
  UpdateInventoryItemRequest,
  InventoryChangeType,
  CreateInventoryUpdateRequest
} from '../../types/inventory';
import { InventoryService } from '../../services/inventoryService';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types/auth';
import { toast } from 'react-toastify';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface InventoryFormData {
  name: string;
  currentStock: number;
  unit: string;
  lowStockThreshold: number;
  costPerUnit: number;
  supplierId: string;
}

interface StockUpdateData {
  changeAmount: number;
  changeType: InventoryChangeType;
  reason: string;
}

export const InventoryManagement: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dialog states
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [stockUpdateDialogOpen, setStockUpdateDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  
  const [formData, setFormData] = useState<InventoryFormData>({
    name: '',
    currentStock: 0,
    unit: '',
    lowStockThreshold: 0,
    costPerUnit: 0,
    supplierId: ''
  });
  
  const [stockUpdateData, setStockUpdateData] = useState<StockUpdateData>({
    changeAmount: 0,
    changeType: InventoryChangeType.RESTOCK,
    reason: ''
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; title: string; message: string; onConfirm: () => void }>({
    open: false, title: '', message: '', onConfirm: () => {}
  });
  const { user } = useAuth();

  const canManageInventory = user && [UserRole.ADMIN, UserRole.MANAGER].includes(user.role);

  useEffect(() => {
    loadItems();
  }, [page, rowsPerPage]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadItems = async () => {
    try {
      setLoading(true);
      const response = await InventoryService.getAllItems({
        page: page + 1,
        limit: rowsPerPage,
        sortBy: 'name',
        sortOrder: 'asc'
      });
      
      let filteredItems = response.data;
      
      // Apply search filter
      if (searchTerm) {
        filteredItems = filteredItems.filter(item => 
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.unit.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      setItems(filteredItems);
      setTotalItems(response.pagination.total);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load inventory items');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateItem = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      currentStock: 0,
      unit: '',
      lowStockThreshold: 0,
      costPerUnit: 0,
      supplierId: ''
    });
    setItemDialogOpen(true);
  };

  const handleEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      currentStock: item.currentStock,
      unit: item.unit,
      lowStockThreshold: item.lowStockThreshold,
      costPerUnit: item.costPerUnit,
      supplierId: item.supplierId || ''
    });
    setItemDialogOpen(true);
  };

  const handleDeleteItem = (itemId: string) => {
    setConfirmDialog({
      open: true,
      title: 'Delete Inventory Item',
      message: 'Are you sure you want to delete this inventory item?',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, open: false }));
        try {
          await InventoryService.deleteItem(itemId);
          toast.success('Inventory item deleted successfully');
          await loadItems();
        } catch (err: any) {
          const msg = err.response?.data?.error?.message || 'Failed to delete item';
          setError(msg);
          toast.error(msg);
        }
      }
    });
  };

  const handleItemSubmit = async () => {
    try {
      setSubmitting(true);
      setError('');

      if (editingItem) {
        const updateData: UpdateInventoryItemRequest = {
          name: formData.name,
          currentStock: formData.currentStock,
          unit: formData.unit,
          lowStockThreshold: formData.lowStockThreshold,
          costPerUnit: formData.costPerUnit,
          supplierId: formData.supplierId || undefined
        };
        await InventoryService.updateItem(editingItem.id, updateData);
      } else {
        const createData: CreateInventoryItemRequest = {
          name: formData.name,
          currentStock: formData.currentStock,
          unit: formData.unit,
          lowStockThreshold: formData.lowStockThreshold,
          costPerUnit: formData.costPerUnit,
          supplierId: formData.supplierId || undefined
        };
        await InventoryService.createItem(createData);
      }

      setItemDialogOpen(false);
      toast.success(editingItem ? 'Item updated successfully' : 'Item created successfully');
      await loadItems();
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Failed to save item';
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStockUpdate = (item: InventoryItem) => {
    setSelectedItem(item);
    setStockUpdateData({
      changeAmount: 0,
      changeType: InventoryChangeType.RESTOCK,
      reason: ''
    });
    setStockUpdateDialogOpen(true);
  };

  const handleStockUpdateSubmit = async () => {
    if (!selectedItem) return;

    try {
      setSubmitting(true);
      setError('');

      const updateData: CreateInventoryUpdateRequest = {
        inventoryItemId: selectedItem.id,
        changeAmount: stockUpdateData.changeAmount,
        changeType: stockUpdateData.changeType,
        reason: stockUpdateData.reason
      };

      await InventoryService.updateStock(updateData);
      setStockUpdateDialogOpen(false);
      toast.success('Stock updated successfully');
      await loadItems();
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Failed to update stock';
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.currentStock === 0) return 'out_of_stock';
    if (item.currentStock <= item.lowStockThreshold) return 'low_stock';
    return 'in_stock';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, 'success' | 'warning' | 'error'> = {
      in_stock: 'success',
      low_stock: 'warning',
      out_of_stock: 'error'
    };
    return colors[status];
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      in_stock: 'In Stock',
      low_stock: 'Low Stock',
      out_of_stock: 'Out of Stock'
    };
    return labels[status];
  };

  const lowStockItems = items.filter(item => getStockStatus(item) === 'low_stock');
  const outOfStockItems = items.filter(item => getStockStatus(item) === 'out_of_stock');
  const totalValue = items.reduce((sum, item) => sum + (item.currentStock * item.costPerUnit), 0);

  return (
    <Box>
      <Paper
        sx={{
          p: { xs: 2.5, md: 3 },
          mb: 3,
          background: 'linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(16,185,129,0.08) 100%)',
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }}>
          <Box>
            <Typography variant="h4" component="h1" sx={{ mb: 0.75 }}>
              Inventory Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Track stock levels, manage supplies, and get low-stock alerts at a glance.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton onClick={loadItems} title="Refresh" sx={{ bgcolor: 'background.paper' }}>
              <RefreshIcon />
            </IconButton>
            {canManageInventory && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateItem}
              >
                Add Item
              </Button>
            )}
          </Box>
        </Stack>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!canManageInventory && (
        <Alert severity="info" sx={{ mb: 2 }}>
          You have read-only access to inventory information.
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.98) 100%)' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Total Items
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {items.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.98) 100%)' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Low Stock
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
                {lowStockItems.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.98) 100%)' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Out of Stock
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'error.main' }}>
                {outOfStockItems.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.98) 100%)' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Total Value
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                ₹{totalValue.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <TextField
          fullWidth
          placeholder="Search inventory items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Current Stock</TableCell>
              <TableCell>Unit</TableCell>
              <TableCell>Low Stock Threshold</TableCell>
              <TableCell>Cost per Unit</TableCell>
              <TableCell>Total Value</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Last Restocked</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => {
              const status = getStockStatus(item);
              return (
                <TableRow key={item.id}>
                  <TableCell>
                    <Typography variant="subtitle1" fontWeight="medium">
                      {item.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {item.currentStock}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {item.unit}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {item.lowStockThreshold}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      ₹{item.costPerUnit.toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      ₹{(item.currentStock * item.costPerUnit).toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(status)}
                      color={getStatusColor(status)}
                      size="small"
                      icon={status !== 'in_stock' ? <WarningIcon /> : undefined}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(item.lastRestocked).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    {canManageInventory && (
                      <>
                        <IconButton
                          size="small"
                          onClick={() => handleStockUpdate(item)}
                          title="Update Stock"
                          color="primary"
                        >
                          <TrendingUpIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleEditItem(item)}
                          title="Edit Item"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteItem(item.id)}
                          title="Delete Item"
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </>
                    )}
                    {!canManageInventory && (
                      <Typography variant="body2" color="text.secondary">
                        Read Only
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            {!loading && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  <Typography variant="body2" color="text.secondary">
                    No inventory items found. {searchTerm ? 'Try adjusting your search.' : 'Add your first inventory item to get started.'}
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

      {/* Item Form Dialog */}
      <Dialog open={itemDialogOpen} onClose={() => setItemDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingItem ? 'Edit Inventory Item' : 'Add New Inventory Item'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Item Name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Current Stock"
              type="number"
              value={formData.currentStock}
              onChange={(e) => setFormData(prev => ({ ...prev, currentStock: parseFloat(e.target.value) || 0 }))}
              margin="normal"
              required
              inputProps={{ min: 0 }}
            />
            <TextField
              fullWidth
              label="Unit"
              value={formData.unit}
              onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
              margin="normal"
              required
              placeholder="e.g., kg, lbs, pieces, liters"
            />
            <TextField
              fullWidth
              label="Low Stock Threshold"
              type="number"
              value={formData.lowStockThreshold}
              onChange={(e) => setFormData(prev => ({ ...prev, lowStockThreshold: parseFloat(e.target.value) || 0 }))}
              margin="normal"
              required
              inputProps={{ min: 0 }}
              helperText="Alert when stock falls below this level"
            />
            <TextField
              fullWidth
              label="Cost per Unit"
              type="number"
              value={formData.costPerUnit}
              onChange={(e) => setFormData(prev => ({ ...prev, costPerUnit: parseFloat(e.target.value) || 0 }))}
              margin="normal"
              required
              inputProps={{ min: 0, step: 0.01 }}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
            />
            <TextField
              fullWidth
              label="Supplier ID (Optional)"
              value={formData.supplierId}
              onChange={(e) => setFormData(prev => ({ ...prev, supplierId: e.target.value }))}
              margin="normal"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setItemDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleItemSubmit}
            variant="contained"
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={20} /> : (editingItem ? 'Update' : 'Create')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Stock Update Dialog */}
      <Dialog open={stockUpdateDialogOpen} onClose={() => setStockUpdateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Update Stock</DialogTitle>
        <DialogContent>
          {selectedItem && (
            <Box sx={{ pt: 1 }}>
              <Typography variant="h6" gutterBottom>
                {selectedItem.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Current Stock: {selectedItem.currentStock} {selectedItem.unit}
              </Typography>
              
              <FormControl fullWidth margin="normal">
                <InputLabel>Change Type</InputLabel>
                <Select
                  value={stockUpdateData.changeType}
                  onChange={(e) => setStockUpdateData(prev => ({ ...prev, changeType: e.target.value as InventoryChangeType }))}
                  label="Change Type"
                >
                  {Object.values(InventoryChangeType).map((type) => (
                    <MenuItem key={type} value={type}>
                      {type.toUpperCase()}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <TextField
                fullWidth
                label="Change Amount"
                type="number"
                value={stockUpdateData.changeAmount}
                onChange={(e) => setStockUpdateData(prev => ({ ...prev, changeAmount: parseFloat(e.target.value) || 0 }))}
                margin="normal"
                required
                helperText="Positive for increase, negative for decrease"
              />
              
              <TextField
                fullWidth
                label="Reason"
                value={stockUpdateData.reason}
                onChange={(e) => setStockUpdateData(prev => ({ ...prev, reason: e.target.value }))}
                margin="normal"
                required
                multiline
                rows={2}
                placeholder="Describe the reason for this stock change"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStockUpdateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleStockUpdateSubmit}
            variant="contained"
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={20} /> : 'Update Stock'}
          </Button>
        </DialogActions>
      </Dialog>
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
      />
    </Box>
  );
};