import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Divider,
  Paper
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  AccessTime as TimeIcon,
  TableRestaurant as TableIcon
} from '@mui/icons-material';
import { OrderWithDetails, OrderStatus } from '../../types/order';
import { OrderService } from '../../services/orderService';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types/auth';

export const KitchenDisplay: React.FC = () => {
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [updating, setUpdating] = useState<string>(''); // Order ID being updated
  const { user } = useAuth();

  const canUpdateOrders = user && [UserRole.ADMIN, UserRole.MANAGER, UserRole.KITCHEN_STAFF].includes(user.role);

  useEffect(() => {
    let isMounted = true;
    
    const load = async () => {
      try {
        setLoading(true);
        const kitchenOrders = await OrderService.getKitchenOrders();
        if (isMounted) {
          console.log('Loaded kitchen orders:', kitchenOrders);
          setOrders(kitchenOrders);
          setError('');
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.response?.data?.error?.message || 'Failed to load kitchen orders');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    load();
    // Auto-refresh every 30 seconds
    const interval = setInterval(load, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const loadKitchenOrders = async () => {
    try {
      setLoading(true);
      const kitchenOrders = await OrderService.getKitchenOrders();
      console.log('Loaded kitchen orders:', kitchenOrders);
      setOrders(kitchenOrders);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load kitchen orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    try {
      setUpdating(orderId);
      setError('');

      await OrderService.updateOrderStatus(orderId, { status: newStatus });
      await loadKitchenOrders();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to update order status');
    } finally {
      setUpdating('');
    }
  };

  const getOrderDuration = (createdAt: string) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;

    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getCardColor = (status: OrderStatus, createdAt: string) => {
    const duration = new Date().getTime() - new Date(createdAt).getTime();
    const minutes = Math.floor(duration / (1000 * 60));

    if (minutes > 30) return '#ffebee'; // Light red for urgent
    if (minutes > 15) return '#fff3e0'; // Light orange for attention
    return 'white'; // Normal
  };

  const groupedOrders = {
    placed: orders.filter(order => order.status === OrderStatus.PLACED),
    preparing: orders.filter(order => order.status === OrderStatus.PREPARING),
    ready: orders.filter(order => order.status === OrderStatus.READY)
  };

  if (loading && orders.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Paper
        sx={{
          p: { xs: 2.5, md: 3 },
          mb: 3,
          background: 'linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(239,68,68,0.08) 100%)',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
          <Box>
            <Typography variant="h4" component="h1" sx={{ mb: 0.75 }}>
              Kitchen Display
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Prioritize tickets by age, move dishes through prep, and keep pickup visibility clear.
            </Typography>
          </Box>
          <IconButton onClick={loadKitchenOrders} title="Refresh" disabled={loading} sx={{ bgcolor: 'background.paper' }}>
            <RefreshIcon />
          </IconButton>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!canUpdateOrders && (
        <Alert severity="info" sx={{ mb: 2 }}>
          You have read-only access to kitchen orders.
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* New Orders */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Typography variant="h6" gutterBottom color="text.secondary">
            New Orders ({groupedOrders.placed.length})
          </Typography>
          <Box sx={{ maxHeight: '76vh', minHeight: '76vh', overflowY: 'auto', bgcolor: 'rgba(255,255,255,0.72)', p: 1.25, borderRadius: '14px', border: '1px solid #dbeafe', backdropFilter: 'blur(8px)' }}>
            {groupedOrders.placed.map((order) => (
              <Card
                key={order.id}
                sx={{
                  mb: 2,
                  backgroundColor: getCardColor(order.status, order.createdAt),
                  border: '2px solid',
                  borderColor: 'primary.main',
                  borderRadius: '14px'
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TableIcon fontSize="small" />
                      <Typography variant="h6">
                        Table {order.table?.number || 'Unknown'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TimeIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {getOrderDuration(order.createdAt)}
                      </Typography>
                    </Box>
                  </Box>

                  <List dense>
                    {order.items.map((item, index) => (
                      <React.Fragment key={item.id}>
                        <ListItem disablePadding>
                          <ListItemText
                            primary={`${item.quantity}x ${item.menuItem?.name || 'Unknown Item'}`}
                            secondary={item.specialInstructions || 'No special instructions'}
                          />
                        </ListItem>
                        {index < order.items.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>

                  {canUpdateOrders && (
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={() => handleStatusUpdate(order.id, OrderStatus.PREPARING)}
                      disabled={updating === order.id}
                      sx={{ mt: 2 }}
                    >
                      {updating === order.id ? <CircularProgress size={20} /> : 'Start Preparing'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
            {groupedOrders.placed.length === 0 && (
              <Typography variant="body2" color="text.secondary" align="center">
                No new orders
              </Typography>
            )}
          </Box>
        </Grid>

        {/* Preparing Orders */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Typography variant="h6" gutterBottom color="text.secondary">
            Preparing ({groupedOrders.preparing.length})
          </Typography>
          <Box sx={{ maxHeight: '76vh', minHeight: '76vh', overflowY: 'auto', bgcolor: 'rgba(255,255,255,0.72)', p: 1.25, borderRadius: '14px', border: '1px solid #fde68a', backdropFilter: 'blur(8px)' }}>
            {groupedOrders.preparing.map((order) => (
              <Card
                key={order.id}
                sx={{
                  mb: 2,
                  backgroundColor: getCardColor(order.status, order.createdAt),
                  border: '2px solid',
                  borderColor: 'warning.main',
                  borderRadius: '14px'
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TableIcon fontSize="small" />
                      <Typography variant="h6">
                        Table {order.table?.number || 'Unknown'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TimeIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {getOrderDuration(order.createdAt)}
                      </Typography>
                    </Box>
                  </Box>

                  <List dense>
                    {order.items.map((item, index) => (
                      <React.Fragment key={item.id}>
                        <ListItem disablePadding>
                          <ListItemText
                            primary={`${item.quantity}x ${item.menuItem?.name || 'Unknown Item'}`}
                            secondary={item.specialInstructions || 'No special instructions'}
                          />
                        </ListItem>
                        {index < order.items.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>

                  {canUpdateOrders && (
                    <Button
                      fullWidth
                      variant="contained"
                      color="warning"
                      onClick={() => handleStatusUpdate(order.id, OrderStatus.READY)}
                      disabled={updating === order.id}
                      sx={{ mt: 2 }}
                    >
                      {updating === order.id ? <CircularProgress size={20} /> : 'Mark Ready'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
            {groupedOrders.preparing.length === 0 && (
              <Typography variant="body2" color="text.secondary" align="center">
                No orders being prepared
              </Typography>
            )}
          </Box>
        </Grid>

        {/* Ready Orders */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Typography variant="h6" gutterBottom color="text.secondary">
            Ready for Pickup ({groupedOrders.ready.length})
          </Typography>
          <Box sx={{ maxHeight: '76vh', minHeight: '76vh', overflowY: 'auto', bgcolor: 'rgba(255,255,255,0.72)', p: 1.25, borderRadius: '14px', border: '1px solid #bbf7d0', backdropFilter: 'blur(8px)' }}>
            {groupedOrders.ready.map((order) => (
              <Card
                key={order.id}
                sx={{
                  mb: 2,
                  backgroundColor: getCardColor(order.status, order.createdAt),
                  border: '2px solid',
                  borderColor: 'success.main',
                  borderRadius: '14px'
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TableIcon fontSize="small" />
                      <Typography variant="h6">
                        Table {order.table?.number || 'Unknown'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TimeIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {getOrderDuration(order.createdAt)}
                      </Typography>
                    </Box>
                  </Box>

                  <List dense>
                    {order.items.map((item, index) => (
                      <React.Fragment key={item.id}>
                        <ListItem disablePadding>
                          <ListItemText
                            primary={`${item.quantity}x ${item.menuItem?.name || 'Unknown Item'}`}
                            secondary={item.specialInstructions || 'No special instructions'}
                          />
                        </ListItem>
                        {index < order.items.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>

                  <Typography variant="body2" color="success.main" align="center" sx={{ mt: 2, fontWeight: 'bold' }}>
                    Ready for Pickup!
                  </Typography>
                </CardContent>
              </Card>
            ))}
            {groupedOrders.ready.length === 0 && (
              <Typography variant="body2" color="text.secondary" align="center">
                No orders ready
              </Typography>
            )}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};