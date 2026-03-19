import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  Skeleton,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Schedule as ScheduleIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { apiClient } from '../../config/api';
import { ApiResponse } from '../../types/menu';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types/auth';

interface OrderItem {
  id: string;
  quantity: number;
  menuItemId: string;
  unitPrice: number;
  specialInstructions?: string;
  createdAt: string;
  updatedAt: string;
  menuItem: {
    id: string;
    name: string;
    description: string;
    price: number;
    categoryId: string;
  };
}

interface Order {
  id: string;
  tableId: string;
  waiterId: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  table: {
    id: string;
    number: number;
  };
  waiter: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export const RecentOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const { user } = useAuth();

  const canViewOrders = user && [UserRole.ADMIN, UserRole.MANAGER, UserRole.WAITER].includes(user.role);

  useEffect(() => {
    if (canViewOrders) {
      loadRecentOrders();
    }
  }, [canViewOrders]);

  const loadRecentOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiClient.get<ApiResponse<Order[]>>('/reports/recent-orders?limit=10');
      
      if (response.data.success && response.data.data) {
        setOrders(response.data.data);
      } else {
        setError('Failed to load recent orders');
      }
    } catch (err) {
      console.error('Error loading recent orders:', err);
      setError('Failed to load recent orders');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const getTimeDifference = (dateString: string) => {
    const now = new Date();
    const orderTime = new Date(dateString);
    const diffMs = now.getTime() - orderTime.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;

    if (hours > 0) {
      return `${hours}h ${mins}m ago`;
    }
    return `${mins}m ago`;
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PLACED':
        return 'info';
      case 'PREPARING':
        return 'warning';
      case 'READY':
        return 'success';
      case 'SERVED':
        return 'success';
      case 'COMPLETED':
        return 'default';
      default:
        return 'default';
    }
  };

  if (!canViewOrders) {
    return null;
  }

  return (
    <Card>
      <CardHeader
        title="Recent Orders"
        subheader={`Last 10 orders`}
        avatar={<InfoIcon sx={{ color: 'primary.main' }} />}
      />
      <CardContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {loading ? (
          <Box>
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} height={50} sx={{ mb: 1 }} />
            ))}
          </Box>
        ) : orders.length === 0 ? (
          <Typography color="textSecondary" align="center" sx={{ py: 3 }}>
            No recent orders
          </Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: 'action.hover' }}>
                  <TableCell>Order ID</TableCell>
                  <TableCell align="right">Table</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Time</TableCell>
                  <TableCell align="center">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {order.id.substring(0, 8)}...
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Chip label={`#${order.table?.number}`} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        ₹{order.totalAmount?.toFixed(2) || '0.00'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={order.status || 'Unknown'}
                        size="small"
                        color={getStatusColor(order.status) as any}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <ScheduleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="caption" color="textSecondary">
                          {getTimeDifference(order.createdAt)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Button
                        size="small"
                        startIcon={<VisibilityIcon />}
                        onClick={() => {
                          setSelectedOrder(order);
                          setDetailsOpen(true);
                        }}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>

      {/* Order Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Order Details - {selectedOrder?.id.substring(0, 8)}</DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box sx={{ pt: 2 }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="textSecondary">Table Number</Typography>
                <Typography variant="h6">Table {selectedOrder.table?.number}</Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="textSecondary">Waiter</Typography>
                <Typography variant="body2">{selectedOrder.waiter?.firstName} {selectedOrder.waiter?.lastName}</Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="textSecondary">Order Status</Typography>
                <Chip
                  label={selectedOrder.status || 'Unknown'}
                  color={getStatusColor(selectedOrder.status) as any}
                  variant="outlined"
                  sx={{ mt: 0.5 }}
                />
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Ordered Items
                </Typography>
                <List dense>
                  {selectedOrder.items?.map((item) => (
                    <ListItem key={item.id} disablePadding>
                      <ListItemText
                        primary={`${item.quantity}x ${item.menuItem?.name || 'Unknown Item'}`}
                        secondary={item.specialInstructions || 'No special instructions'}
                      />
                      <Typography variant="caption" color="primary" sx={{ ml: 2 }}>
                        ₹{(item.unitPrice * item.quantity).toFixed(2)}
                      </Typography>
                    </ListItem>
                  ))}
                </List>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="textSecondary">Total Amount</Typography>
                <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                  ₹{selectedOrder.totalAmount?.toFixed(2) || '0.00'}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="textSecondary">Order Time</Typography>
                <Typography variant="body2">
                  {formatDate(selectedOrder.createdAt)} at {formatTime(selectedOrder.createdAt)}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};
