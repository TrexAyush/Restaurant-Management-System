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
  CardContent
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  Payment as PaymentIcon,
  PictureAsPdf as PdfIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { BillWithDetails, PaymentMethod, PaymentStatus, ProcessPaymentRequest } from '../../types/billing';
import { BillingService } from '../../services/billingService';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types/auth';

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
      await loadBills();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to process payment');
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
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to download PDF');
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Billing Management
        </Typography>
        <IconButton onClick={loadBills} title="Refresh">
          <RefreshIcon />
        </IconButton>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!canProcessPayments && (
        <Alert severity="info" sx={{ mb: 2 }}>
          You have read-only access to billing information.
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="warning.main">
                Pending Bills
              </Typography>
              <Typography variant="h4">
                {pendingBills.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ${pendingBills.reduce((sum, bill) => sum + bill.totalAmount, 0).toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="success.main">
                Paid Bills
              </Typography>
              <Typography variant="h4">
                {paidBills.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ${totalRevenue.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">
                Total Bills
              </Typography>
              <Typography variant="h4">
                {Array.isArray(bills) ? bills.length : 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ${Array.isArray(bills) ? bills.reduce((sum, bill) => sum + bill.totalAmount, 0).toFixed(2) : '0.00'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="info.main">
                Avg. Bill Value
              </Typography>
              <Typography variant="h4">
                ${Array.isArray(bills) && bills.length > 0 ? (bills.reduce((sum, bill) => sum + bill.totalAmount, 0) / bills.length).toFixed(2) : '0.00'}
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
                    ${bill.subtotal.toFixed(2)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    ${bill.taxAmount.toFixed(2)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="subtitle2" fontWeight="bold">
                    ${bill.totalAmount.toFixed(2)}
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
                Total Amount: ${selectedBill.totalAmount.toFixed(2)}
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