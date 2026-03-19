import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { OrderWithDetails, OrderStatus } from '../../types/order';
import { OrderService } from '../../services/orderService';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types/auth';
import { CreateOrderDialog } from './CreateOrderDialog';
import { OrderDetailsDialog } from './OrderDetailsDialog';

export const OrderManagement: React.FC = () => {
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalOrders, setTotalOrders] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dialog states
  const [createOrderOpen, setCreateOrderOpen] = useState(false);
  const [orderDetailsOpen, setOrderDetailsOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null);
  
  const { user } = useAuth();

  const canCreateOrders = user && [UserRole.ADMIN, UserRole.MANAGER, UserRole.WAITER].includes(user.role);
  const canViewAllOrders = user && [UserRole.ADMIN, UserRole.MANAGER].includes(user.role);

  useEffect(() => {
    loadOrders();
  }, [page, rowsPerPage, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await OrderService.getAllOrders({
        page: page + 1,
        limit: rowsPerPage,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
      
      let filteredOrders = response.data;
      
      // Apply status filter
      if (statusFilter) {
        filteredOrders = filteredOrders.filter(order => order.status === statusFilter);
      }
      
      // Apply search filter
      if (searchTerm) {
        filteredOrders = filteredOrders.filter(order => 
          order.table?.number?.toString().includes(searchTerm) ||
          order.waiter?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.waiter?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.id.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      setOrders(filteredOrders);
      setTotalOrders(response.pagination.total);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrder = (order: OrderWithDetails) => {
    setSelectedOrder(order);
    setOrderDetailsOpen(true);
  };

  const handleOrderCreated = () => {
    setCreateOrderOpen(false);
    loadOrders();
  };

  const handleOrderUpdated = () => {
    setOrderDetailsOpen(false);
    loadOrders();
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

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
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

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Order Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton onClick={loadOrders} title="Refresh">
            <RefreshIcon />
          </IconButton>
          {canCreateOrders && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateOrderOpen(true)}
            >
              New Order
            </Button>
          )}
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!canViewAllOrders && (
        <Alert severity="info" sx={{ mb: 2 }}>
          You can only view orders you have created.
        </Alert>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
          <Box sx={{ minWidth: 200, flexGrow: 1 }}>
            <TextField
              fullWidth
              placeholder="Search orders..."
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
          </Box>
          <Box sx={{ minWidth: 150 }}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
              >
                <MenuItem value="">All Statuses</MenuItem>
                {Object.values(OrderStatus).map((status) => (
                  <MenuItem key={status} value={status}>
                    {status.toUpperCase()}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Order ID</TableCell>
              <TableCell>Table</TableCell>
              <TableCell>Waiter</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Items</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>
                  <Typography variant="body2" fontFamily="monospace">
                    {order.id.slice(-8)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="subtitle2">
                    Table {order.table?.number || 'N/A'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {order.waiter?.firstName || 'N/A'} {order.waiter?.lastName || ''}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={order.status.toUpperCase()}
                    color={getStatusColor(order.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="subtitle2" fontWeight="bold">
                    ₹{order.totalAmount?.toFixed(2) || '0.00'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {getOrderDuration(order.createdAt)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {formatDateTime(order.createdAt)}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={() => handleViewOrder(order)}
                    title="View Details"
                  >
                    <ViewIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {!loading && orders.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  <Typography variant="body2" color="text.secondary">
                    No orders found. {searchTerm || statusFilter ? 'Try adjusting your filters.' : 'Create your first order to get started.'}
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
        count={totalOrders}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(event) => {
          setRowsPerPage(parseInt(event.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[5, 10, 25, 50]}
      />

      {/* Create Order Dialog */}
      <CreateOrderDialog
        open={createOrderOpen}
        onClose={() => setCreateOrderOpen(false)}
        onOrderCreated={handleOrderCreated}
      />

      {/* Order Details Dialog */}
      {selectedOrder && (
        <OrderDetailsDialog
          open={orderDetailsOpen}
          onClose={() => setOrderDetailsOpen(false)}
          order={selectedOrder}
          onOrderUpdated={handleOrderUpdated}
        />
      )}
    </Box>
  );
};