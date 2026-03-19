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
  Payment as PaymentIcon,
  PictureAsPdf as PdfIcon,
  Refresh as RefreshIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';
import { BillWithDetails, PaymentMethod, PaymentStatus, ProcessPaymentRequest } from '../../types/billing';
import { BillingService } from '../../services/billingService';
import { OrderService } from '../../services/orderService';
import { OrderWithDetails } from '../../types/order';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types/auth';
import { toast } from 'react-toastify';

export const BillingManagement: React.FC = () => {
  const [bills, setBills] = useState<BillWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalBills, setTotalBills] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('');
  
  // Payment dialog
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<BillWithDetails | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [processing, setProcessing] = useState(false);
  
  // Generate bill dialog
  const [generateBillDialogOpen, setGenerateBillDialogOpen] = useState(false);
  const [readyOrders, setReadyOrders] = useState<OrderWithDetails[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null);
  const [generatingBill, setGeneratingBill] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  
  const { user } = useAuth();

  const canProcessPayments = user && [UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER].includes(user.role);

  useEffect(() => {
    loadBills();
  }, [page, rowsPerPage, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadBills = async () => {
    try {
      setLoading(true);
      const response = await BillingService.getAllBills({
        page: page + 1,
        limit: rowsPerPage,
        sortBy: 'generatedAt',
        sortOrder: 'desc'
      });
      
      let filteredBills = response.data || [];
      
      // Ensure filteredBills is an array
      if (!Array.isArray(filteredBills)) {
        console.error('Bills data is not an array:', filteredBills);
        filteredBills = [];
      }
      
      // Apply status filter
      if (statusFilter) {
        filteredBills = filteredBills.filter(bill => bill.paymentStatus === statusFilter);
      }
      
      // Filter out bills without proper order/table data to prevent runtime errors
      filteredBills = filteredBills.filter(bill => 
        bill && 
        bill.order && 
        typeof bill.order === 'object' &&
        bill.order.table &&
        typeof bill.order.table === 'object'
      );
      
      setBills(filteredBills);
      setTotalBills(response.pagination?.total || 0);
      setError('');
    } catch (err: any) {
      console.error('Failed to load bills:', err);
      setError(err.response?.data?.error?.message || err.message || 'Failed to load bills');
      setBills([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayment = (bill: BillWithDetails) => {
    setSelectedBill(bill);
    setSelectedPaymentMethod(PaymentMethod.CASH);
    setPaymentDialogOpen(true);
  };

  const handlePaymentSubmit = async () => {
    if (!selectedBill) return;

    try {
      setProcessing(true);
      setError('');

      const paymentData: ProcessPaymentRequest = {
        paymentMethod: selectedPaymentMethod
      };

      await BillingService.processPayment(selectedBill.id, paymentData);
      setPaymentDialogOpen(false);
      toast.success('Payment processed successfully');
      await loadBills();
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Failed to process payment';
      setError(msg);
      toast.error(msg);
    } finally {
      setProcessing(false);
    }
  };

  const handleDownloadPDF = async (billId: string) => {
    try {
      const pdfBlob = await BillingService.generatePDF(billId);
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bill-${billId.slice(-8)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('PDF downloaded successfully');
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Failed to download PDF';
      setError(msg);
      toast.error(msg);
    }
  };

  const handleOpenGenerateBillDialog = async () => {
    try {
      setLoadingOrders(true);
      setError('');
      const servedOrders = await OrderService.getOrdersByStatus('served');
      // Filter out orders that already have a bill
      const billChecks = await Promise.all(
        servedOrders.map(async (order) => {
          const hasBill = await BillingService.checkBillExists(order.id);
          return { order, hasBill };
        })
      );
      setReadyOrders(billChecks.filter(({ hasBill }) => !hasBill).map(({ order }) => order));
      setGenerateBillDialogOpen(true);
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Failed to load served orders';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleGenerateBill = async () => {
    if (!selectedOrder) return;
    
    try {
      setGeneratingBill(true);
      setError('');
      
      await BillingService.generateBill(selectedOrder.id);
      toast.success('Bill generated successfully');
      setSuccessMessage('Bill generated successfully');
      setGenerateBillDialogOpen(false);
      setSelectedOrder(null);
      
      setTimeout(() => {
        loadBills();
        setSuccessMessage('');
      }, 1000);
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Failed to generate bill';
      setError(msg);
      toast.error(msg);
    } finally {
      setGeneratingBill(false);
    }
  };

  const getStatusColor = (status: PaymentStatus) => {
    const colors: Record<PaymentStatus, 'default' | 'warning' | 'success' | 'error'> = {
      [PaymentStatus.PENDING]: 'warning',
      [PaymentStatus.PAID]: 'success',
      [PaymentStatus.CANCELLED]: 'error'
    };
    return colors[status];
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const pendingBills = Array.isArray(bills) ? bills.filter(bill => bill.paymentStatus === PaymentStatus.PENDING) : [];
  const paidBills = Array.isArray(bills) ? bills.filter(bill => bill.paymentStatus === PaymentStatus.PAID) : [];
  const totalRevenue = paidBills.reduce((sum, bill) => sum + bill.totalAmount, 0);

  return (
    <Box>
      <Paper
        sx={{
          p: { xs: 2.5, md: 3 },
          mb: 3,
          background: 'linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(99,102,241,0.08) 100%)',
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }}>
          <Box>
            <Typography variant="h4" component="h1" sx={{ mb: 0.75 }}>
              Billing Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Process payments, generate invoices, and track revenue across all service channels.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {canProcessPayments && (
              <Button
                variant="contained"
                startIcon={<ReceiptIcon />}
                onClick={handleOpenGenerateBillDialog}
                disabled={loadingOrders}
              >
                {loadingOrders ? <CircularProgress size={20} /> : 'Generate Bill'}
              </Button>
            )}
            <IconButton onClick={loadBills} title="Refresh" disabled={loading} sx={{ bgcolor: 'background.paper' }}>
              <RefreshIcon />
            </IconButton>
          </Box>
        </Stack>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}

      {/* Generate Bill Dialog */}
      <Dialog
        open={generateBillDialogOpen}
        onClose={() => setGenerateBillDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Generate Bill from Order</DialogTitle>
        <DialogContent>
          {loadingOrders ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress />
            </Box>
          ) : readyOrders.length === 0 ? (
            <Typography color="textSecondary">
              No served orders available for billing
            </Typography>
          ) : (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                Select an order to generate a bill:
              </Typography>
              {readyOrders.map((order) => (
                <Box
                  key={order.id}
                  sx={{
                    p: 2,
                    mb: 1,
                    border: '1px solid',
                    borderRadius: 2,
                    cursor: 'pointer',
                    backgroundColor: selectedOrder?.id === order.id ? 'rgba(99, 102, 241, 0.08)' : 'background.paper',
                    borderColor: selectedOrder?.id === order.id ? 'primary.main' : 'divider',
                  }}
                  onClick={() => setSelectedOrder(order)}
                >
                  <Grid container spacing={1}>
                    <Grid size={6}>
                      <Typography variant="body2">
                        <strong>Table:</strong> {order.table?.number || 'Unknown'}
                      </Typography>
                    </Grid>
                    <Grid size={6}>
                      <Typography variant="body2">
                        <strong>Order ID:</strong> {order.id}
                      </Typography>
                    </Grid>
                    <Grid size={6}>
                      <Typography variant="body2">
                        <strong>Items:</strong> {order.items?.length || 0}
                      </Typography>
                    </Grid>
                    <Grid size={6}>
                      <Typography variant="body2">
                        <strong>Total:</strong> ₹{(order.totalAmount || 0).toFixed(2)}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGenerateBillDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleGenerateBill}
            variant="contained"
            disabled={!selectedOrder || generatingBill}
          >
            {generatingBill ? <CircularProgress size={24} /> : 'Generate Bill'}
          </Button>
        </DialogActions>
      </Dialog>

      {!canProcessPayments && (
        <Alert severity="info" sx={{ mb: 2 }}>
          You have read-only access to billing information.
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.98) 100%)' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Pending Bills
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
                {pendingBills.length}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                ₹{pendingBills.reduce((sum, bill) => sum + bill.totalAmount, 0).toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.98) 100%)' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Paid Bills
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                {paidBills.length}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                ₹{totalRevenue.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.98) 100%)' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Total Bills
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {Array.isArray(bills) ? bills.length : 0}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                ₹{Array.isArray(bills) ? bills.reduce((sum, bill) => sum + bill.totalAmount, 0).toFixed(2) : '0.00'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.98) 100%)' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Avg. Bill Value
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main' }}>
                ₹{Array.isArray(bills) && bills.length > 0 ? (bills.reduce((sum, bill) => sum + bill.totalAmount, 0) / bills.length).toFixed(2) : '0.00'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Across all bills
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Payment Status</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              label="Payment Status"
            >
              <MenuItem value="">All Statuses</MenuItem>
              {Object.values(PaymentStatus).map((status) => (
                <MenuItem key={status} value={status}>
                  {status.toUpperCase()}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Bill ID</TableCell>
              <TableCell>Table</TableCell>
              <TableCell>Subtotal</TableCell>
              <TableCell>Tax</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Payment Method</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Generated</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.isArray(bills) && bills.map((bill) => (
              <TableRow key={bill.id}>
                <TableCell>
                  <Typography variant="body2" fontFamily="monospace">
                    {bill.id.slice(-8)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="subtitle2">
                    Table {bill.order?.table?.number || 'N/A'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    ₹{bill.subtotal.toFixed(2)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    ₹{bill.taxAmount.toFixed(2)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="subtitle2" fontWeight="bold">
                    ₹{bill.totalAmount.toFixed(2)}
                  </Typography>
                </TableCell>
                <TableCell>
                  {bill.paymentMethod ? (
                    <Chip
                      label={bill.paymentMethod.toUpperCase()}
                      size="small"
                      variant="outlined"
                    />
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      -
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    label={bill.paymentStatus.toUpperCase()}
                    color={getStatusColor(bill.paymentStatus)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {formatDateTime(bill.generatedAt)}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={() => handleDownloadPDF(bill.id)}
                    title="Download PDF"
                  >
                    <PdfIcon />
                  </IconButton>
                  {canProcessPayments && bill.paymentStatus === PaymentStatus.PENDING && (
                    <IconButton
                      size="small"
                      onClick={() => handleProcessPayment(bill)}
                      title="Process Payment"
                      color="primary"
                    >
                      <PaymentIcon />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {!loading && (!Array.isArray(bills) || bills.length === 0) && (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  <Typography variant="body2" color="text.secondary">
                    No bills found. {statusFilter ? 'Try adjusting your filters.' : 'Bills will appear here when orders are completed.'}
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
        count={totalBills}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(event) => {
          setRowsPerPage(parseInt(event.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[5, 10, 25, 50]}
      />

      {/* Payment Processing Dialog */}
      <Dialog open={paymentDialogOpen} onClose={() => setPaymentDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Process Payment</DialogTitle>
        <DialogContent>
          {selectedBill && (
            <Box sx={{ pt: 1 }}>
              <Typography variant="h6" gutterBottom>
                Bill Details
              </Typography>
              <Typography variant="body2" gutterBottom>
                Bill ID: {selectedBill.id.slice(-8)}
              </Typography>
              <Typography variant="body2" gutterBottom>
                Table: {selectedBill.order?.table?.number || 'N/A'}
              </Typography>
              <Typography variant="body2" gutterBottom>
                Items: {selectedBill.order?.items?.length || 0}
              </Typography>
              <Typography variant="h6" color="primary" gutterBottom>
                Total Amount: ₹{selectedBill.totalAmount.toFixed(2)}
              </Typography>

              <FormControl fullWidth margin="normal">
                <InputLabel>Payment Method</InputLabel>
                <Select
                  value={selectedPaymentMethod}
                  onChange={(e) => setSelectedPaymentMethod(e.target.value as PaymentMethod)}
                  label="Payment Method"
                >
                  {Object.values(PaymentMethod).map((method) => (
                    <MenuItem key={method} value={method}>
                      {method.toUpperCase()}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handlePaymentSubmit}
            variant="contained"
            disabled={processing}
            startIcon={processing ? <CircularProgress size={20} /> : <PaymentIcon />}
          >
            {processing ? 'Processing...' : 'Process Payment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};