import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Alert,
  CircularProgress,
  Autocomplete
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { Table } from '../../types/table';
import { MenuItemWithCategory } from '../../types/menu';
import { CreateOrderRequest, CreateOrderItemRequest } from '../../types/order';
import { TableService } from '../../services/tableService';
import { menuService } from '../../services/menuService';
import { OrderService } from '../../services/orderService';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';

interface OrderItem {
  menuItem: MenuItemWithCategory;
  quantity: number;
  specialInstructions: string;
}

interface CreateOrderDialogProps {
  open: boolean;
  onClose: () => void;
  onOrderCreated: () => void;
}

export const CreateOrderDialog: React.FC<CreateOrderDialogProps> = ({
  open,
  onClose,
  onOrderCreated
}) => {
  const [availableTables, setAvailableTables] = useState<Table[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemWithCategory[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItemWithCategory | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const { user } = useAuth();

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tables, menuResponse] = await Promise.all([
        TableService.getAvailableTables(),
        menuService.getMenuItems({ isAvailable: true })
      ]);
      
      setAvailableTables(tables);
      setMenuItems(menuResponse.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    if (!selectedMenuItem) return;

    const existingItemIndex = orderItems.findIndex(
      item => item.menuItem.id === selectedMenuItem.id
    );

    if (existingItemIndex >= 0) {
      // Increase quantity of existing item
      const updatedItems = [...orderItems];
      updatedItems[existingItemIndex].quantity += 1;
      setOrderItems(updatedItems);
    } else {
      // Add new item
      setOrderItems([
        ...orderItems,
        {
          menuItem: selectedMenuItem,
          quantity: 1,
          specialInstructions: ''
        }
      ]);
    }

    setSelectedMenuItem(null);
  };

  const handleUpdateQuantity = (index: number, change: number) => {
    const updatedItems = [...orderItems];
    const newQuantity = updatedItems[index].quantity + change;
    
    if (newQuantity <= 0) {
      updatedItems.splice(index, 1);
    } else {
      updatedItems[index].quantity = newQuantity;
    }
    
    setOrderItems(updatedItems);
  };

  const handleUpdateInstructions = (index: number, instructions: string) => {
    const updatedItems = [...orderItems];
    updatedItems[index].specialInstructions = instructions;
    setOrderItems(updatedItems);
  };

  const handleRemoveItem = (index: number) => {
    const updatedItems = [...orderItems];
    updatedItems.splice(index, 1);
    setOrderItems(updatedItems);
  };

  const calculateTotal = () => {
    return orderItems.reduce((total, item) => {
      return total + (item.menuItem.price * item.quantity);
    }, 0);
  };

  const handleSubmit = async () => {
    if (!selectedTable || orderItems.length === 0) {
      setError('Please select a table and add at least one item');
      return;
    }

    if (!user) {
      setError('User not authenticated');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const orderData: CreateOrderRequest = {
        tableId: selectedTable,
        waiterId: user.id,
        items: orderItems.map((item): CreateOrderItemRequest => ({
          menuItemId: item.menuItem.id,
          quantity: item.quantity,
          unitPrice: item.menuItem.price,
          specialInstructions: item.specialInstructions || undefined
        }))
      };

      await OrderService.createOrder(orderData);
      toast.success('Order created successfully');
      onOrderCreated();
      handleClose();
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Failed to create order';
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedTable('');
    setOrderItems([]);
    setSelectedMenuItem(null);
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Create New Order</DialogTitle>
      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ pt: 1 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {/* Table Selection */}
            <FormControl fullWidth margin="normal" required>
              <InputLabel>Select Table</InputLabel>
              <Select
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
                label="Select Table"
              >
                {availableTables.map((table) => (
                  <MenuItem key={table.id} value={table.id}>
                    Table {table.number} (Capacity: {table.capacity})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {availableTables.length === 0 && (
              <Alert severity="warning" sx={{ mt: 1, mb: 2 }}>
                No available tables. Please ensure tables are set to available status.
              </Alert>
            )}

            {/* Menu Item Selection */}
            <Box sx={{ mt: 3, mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Add Items to Order
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                <Autocomplete
                  sx={{ flexGrow: 1 }}
                  options={menuItems}
                  getOptionLabel={(option) => `${option.name} - ₹${option.price.toFixed(2)}`}
                  value={selectedMenuItem}
                  onChange={(_, newValue) => setSelectedMenuItem(newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Search menu items"
                      variant="outlined"
                    />
                  )}
                  renderOption={(props, option) => (
                    <li {...props}>
                      <Box>
                        <Typography variant="subtitle2">
                          {option.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {option.category?.name} - ₹{option.price.toFixed(2)}
                        </Typography>
                        {option.description && (
                          <Typography variant="caption" color="text.secondary">
                            {option.description}
                          </Typography>
                        )}
                      </Box>
                    </li>
                  )}
                />
                <Button
                  variant="contained"
                  onClick={handleAddItem}
                  disabled={!selectedMenuItem}
                  startIcon={<AddIcon />}
                >
                  Add
                </Button>
              </Box>
            </Box>

            {/* Order Items List */}
            {orderItems.length > 0 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Order Items
                </Typography>
                <List>
                  {orderItems.map((item, index) => (
                    <React.Fragment key={`${item.menuItem.id}-${index}`}>
                      <ListItem>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="subtitle1">
                                {item.menuItem.name}
                              </Typography>
                              <Typography variant="subtitle1" fontWeight="bold">
                                ₹{(item.menuItem.price * item.quantity).toFixed(2)}
                              </Typography>
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                ₹{item.menuItem.price.toFixed(2)} each
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                                <IconButton
                                  size="small"
                                  onClick={() => handleUpdateQuantity(index, -1)}
                                >
                                  <RemoveIcon />
                                </IconButton>
                                <Typography variant="body1" sx={{ minWidth: 20, textAlign: 'center' }}>
                                  {item.quantity}
                                </Typography>
                                <IconButton
                                  size="small"
                                  onClick={() => handleUpdateQuantity(index, 1)}
                                >
                                  <AddIcon />
                                </IconButton>
                              </Box>
                              <TextField
                                fullWidth
                                size="small"
                                placeholder="Special instructions (optional)"
                                value={item.specialInstructions}
                                onChange={(e) => handleUpdateInstructions(index, e.target.value)}
                                sx={{ mt: 1 }}
                              />
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            onClick={() => handleRemoveItem(index)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                      {index < orderItems.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>

                <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="h6" align="right">
                    Total: ₹{calculateTotal().toFixed(2)}
                  </Typography>
                </Box>
              </Box>
            )}

            {orderItems.length === 0 && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Add menu items to create an order.
              </Alert>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={submitting || !selectedTable || orderItems.length === 0}
        >
          {submitting ? <CircularProgress size={20} /> : 'Create Order'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};