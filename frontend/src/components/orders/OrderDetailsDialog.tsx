import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Paper,
  Grid
} from '@mui/material';
import {
  TableRestaurant as TableIcon,
  Person as PersonIcon,
  AccessTime as TimeIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';
import { OrderWithDetails, OrderStatus, UpdateOrderStatusRequest } from '../../types/order';
import { OrderService } from '../../services/orderService';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types/auth';

interface OrderDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  order: OrderWithDetails;
  onOrderUpdated: () => void;
}

export const OrderDetailsDialog: React.FC<OrderDetailsDialogProps> = ({
  open,
  onClose,
  order,
  onOrderUpdated
}) => {
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string>('');
  const { user } = useAuth();

  const canUpdateStatus = user && [UserRole.ADMIN, UserRole.MANAGER, UserRole.KITCHEN_STAFF].includes(user.role);

  const handleStatusUpdate = async (newStatus: OrderStatus) => {
    try {
      setUpdating(true);
      setError('');

      const statusData: UpdateOrderStatusRequest = { status: newStatus };
      await OrderService.updateOrderStatus(order.id, statusData);
      
      onOrderUpdated();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    const colors: Record<OrderStatus, 'default' | 'primary' | 'warning' | 'success'> = {
      [OrderStatus.PLACED]: 'default',
      [OrderStatus.PREPARING]: 'primary',
      [OrderStatus.READY]: 'warning',
      [OrderStatus.SERVED]: 'success'
    };
    return colors[status];
  };

  const getNextStatus = (currentStatus: OrderStatus): OrderStatus | null => {
    const statusFlow: Record<OrderStatus, OrderStatus | null> = {
      [OrderStatus.PLACED]: OrderStatus.PREPARING,
      [OrderStatus.PREPARING]: OrderStatus.READY,
      [OrderStatus.READY]: OrderStatus.SERVED,
      [OrderStatus.SERVED]: null
    };
    return statusFlow[currentStatus];
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getOrderDuration = () => {
    const now = new Date();
    const created = new Date(order.createdAt);
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const nextStatus = getNextStatus(order.status);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Order Details
          </Typography>
          <Chip
            label={order.status.toUpperCase()}
            color={getStatusColor(order.status)}
          />
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Order Summary */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <ReceiptIcon color="primary" />
                <Typography variant="subtitle1" fontWeight="bold">
                  Order ID: {order.id.slice(-8)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <TableIcon color="action" />
                <Typography variant="body2">
                  Table {order.table.number}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <PersonIcon color="action" />
                <Typography variant="body2">
                  Waiter: {order.waiter.firstName} {order.waiter.lastName}
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <TimeIcon color="action" />
                <Typography variant="body2">
                  Duration: {getOrderDuration()}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Created: {formatDateTime(order.createdAt)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Updated: {formatDateTime(order.updatedAt)}
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        {/* Status Update */}
        {canUpdateStatus && nextStatus && (
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Update Status
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Typography variant="body2">
                Current: <Chip label={order.status.toUpperCase()} color={getStatusColor(order.status)} size="small" />
              </Typography>
              <Button
                variant="contained"
                onClick={() => handleStatusUpdate(nextStatus)}
                disabled={updating}
                size="small"
              >
                {updating ? <CircularProgress size={20} /> : `Mark as ${nextStatus.toUpperCase()}`}
              </Button>
            </Box>
          </Paper>
        )}

        {/* Order Items */}
        <Typography variant="h6" gutterBottom>
          Order Items ({order.items.length})
        </Typography>
        <List>
          {order.items.map((item, index) => (
            <React.Fragment key={item.id}>
              <ListItem>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="subtitle1">
                        {item.quantity}x {item.menuItem.name}
                      </Typography>
                      <Typography variant="subtitle1" fontWeight="bold">
                        ${(item.unitPrice * item.quantity).toFixed(2)}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        ${item.unitPrice.toFixed(2)} each
                      </Typography>
                      {item.menuItem.description && (
                        <Typography variant="body2" color="text.secondary">
                          {item.menuItem.description}
                        </Typography>
                      )}
                      {item.specialInstructions && (
                        <Typography variant="body2" color="primary" sx={{ mt: 0.5 }}>
                          Special instructions: {item.specialInstructions}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </ListItem>
              {index < order.items.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>

        {/* Order Total */}
        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="h6" align="right">
            Total: ${order.totalAmount.toFixed(2)}
          </Typography>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};