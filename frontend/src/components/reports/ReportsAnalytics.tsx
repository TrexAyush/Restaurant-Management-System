import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip
} from '@mui/material';
import {
  Download as DownloadIcon,
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  Inventory as InventoryIcon
} from '@mui/icons-material';
import { SalesReport, InventoryReport, ReportFilters } from '../../types/reports';
import { ReportingService } from '../../services/reportingService';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types/auth';

export const ReportsAnalytics: React.FC = () => {
  const [salesReport, setSalesReport] = useState<SalesReport | null>(null);
  const [inventoryReport, setInventoryReport] = useState<InventoryReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [filters, setFilters] = useState<ReportFilters>({
    period: 'daily',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const { user } = useAuth();

  const canViewReports = user && [UserRole.ADMIN, UserRole.MANAGER].includes(user.role);

  useEffect(() => {
    if (canViewReports) {
      loadReports();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadReports = async () => {
    try {
      setLoading(true);
      setError('');

      const [salesData, inventoryData] = await Promise.all([
        ReportingService.getSalesReport(filters).catch(err => {
          console.error('Sales report error:', err);
          return null;
        }),
        ReportingService.getInventoryReport().catch(err => {
          console.error('Inventory report error:', err);
          return null;
        })
      ]);

      setSalesReport(salesData);
      setInventoryReport(inventoryData);

      if (!salesData && !inventoryData) {
        setError('Failed to load any reports. Please check your connection and try again.');
      } else if (!salesData) {
        setError('Failed to load sales report, but inventory report loaded successfully.');
      } else if (!inventoryData) {
        setError('Failed to load inventory report, but sales report loaded successfully.');
      }
    } catch (err: any) {
      console.error('Error loading reports:', err);
      setError(err.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field: keyof ReportFilters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleExportReport = async (type: 'sales' | 'inventory', format: 'pdf' | 'csv' | 'excel') => {
    try {
      let blob: Blob;
      
      if (type === 'sales') {
        blob = await ReportingService.exportSalesReport(filters, format);
      } else {
        blob = await ReportingService.exportInventoryReport(format);
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${type}-report-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to export report');
    }
  };

  if (!canViewReports) {
    return (
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Reports & Analytics
        </Typography>
        <Alert severity="warning">
          You don't have permission to view reports. Contact an administrator or manager for access.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Reports & Analytics
        </Typography>
        <Button
          variant="contained"
          startIcon={<AssessmentIcon />}
          onClick={loadReports}
          disabled={loading}
        >
          {loading ? <CircularProgress size={20} /> : 'Refresh Reports'}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Report Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Report Filters
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
          <Box sx={{ minWidth: 200, flex: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Period</InputLabel>
              <Select
                value={filters.period}
                onChange={(e) => handleFilterChange('period', e.target.value)}
                label="Period"
              >
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
                <MenuItem value="custom">Custom Range</MenuItem>
              </Select>
            </FormControl>
          </Box>
          {filters.period === 'custom' && (
            <>
              <Box sx={{ minWidth: 150 }}>
                <TextField
                  fullWidth
                  label="Start Date"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
              <Box sx={{ minWidth: 150 }}>
                <TextField
                  fullWidth
                  label="End Date"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
            </>
          )}
          <Box sx={{ minWidth: 120 }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={loadReports}
              disabled={loading}
            >
              Apply Filters
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Sales Report */}
      {salesReport && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUpIcon />
              Sales Report - {salesReport.period}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                size="small"
                startIcon={<DownloadIcon />}
                onClick={() => handleExportReport('sales', 'pdf')}
              >
                PDF
              </Button>
              <Button
                size="small"
                startIcon={<DownloadIcon />}
                onClick={() => handleExportReport('sales', 'csv')}
              >
                CSV
              </Button>
              <Button
                size="small"
                startIcon={<DownloadIcon />}
                onClick={() => handleExportReport('sales', 'excel')}
              >
                Excel
              </Button>
            </Box>
          </Box>

          {/* Sales Summary Cards */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2, mb: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="primary">
                  Total Revenue
                </Typography>
                <Typography variant="h4">
                  ₹{salesReport.totalRevenue.toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <Typography variant="h6" color="secondary">
                  Total Orders
                </Typography>
                <Typography variant="h4">
                  {salesReport.totalOrders}
                </Typography>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <Typography variant="h6" color="success.main">
                  Avg. Order Value
                </Typography>
                <Typography variant="h4">
                  ₹{salesReport.averageOrderValue.toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <Typography variant="h6" color="info.main">
                  Top Items Sold
                </Typography>
                <Typography variant="h4">
                  {salesReport.topSellingItems.length}
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {/* Top Selling Items */}
          <Typography variant="h6" gutterBottom>
            Top Selling Items
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Item Name</TableCell>
                  <TableCell>Quantity Sold</TableCell>
                  <TableCell>Revenue</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Array.isArray(salesReport.topSellingItems) && salesReport.topSellingItems.length > 0 ? (
                  salesReport.topSellingItems.slice(0, 5).map((item, index) => (
                    <TableRow key={item.menuItemId || index}>
                      <TableCell>
                        <Typography variant="subtitle2">
                          #{index + 1} {item.menuItemName}
                        </Typography>
                      </TableCell>
                      <TableCell>{item.quantitySold}</TableCell>
                      <TableCell>₹{item.revenue.toFixed(2)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      <Typography variant="body2" color="text.secondary">
                        No top selling items data available
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Revenue by Payment Method */}
          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            Revenue by Payment Method
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
            {Array.isArray(salesReport.revenueByPaymentMethod) && salesReport.revenueByPaymentMethod.length > 0 ? (
              salesReport.revenueByPaymentMethod.map((method) => (
                <Card variant="outlined" key={method.paymentMethod}>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      {method.paymentMethod.toUpperCase()}
                    </Typography>
                    <Typography variant="h6">
                      ₹{method.amount.toFixed(2)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {method.percentage.toFixed(1)}% of total
                    </Typography>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    No payment method data available
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Box>
        </Paper>
      )}

      {/* Inventory Report */}
      {inventoryReport && (
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <InventoryIcon />
              Inventory Report
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                size="small"
                startIcon={<DownloadIcon />}
                onClick={() => handleExportReport('inventory', 'pdf')}
              >
                PDF
              </Button>
              <Button
                size="small"
                startIcon={<DownloadIcon />}
                onClick={() => handleExportReport('inventory', 'csv')}
              >
                CSV
              </Button>
              <Button
                size="small"
                startIcon={<DownloadIcon />}
                onClick={() => handleExportReport('inventory', 'excel')}
              >
                Excel
              </Button>
            </Box>
          </Box>

          {/* Inventory Summary Cards */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2, mb: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="primary">
                  Total Items
                </Typography>
                <Typography variant="h4">
                  {inventoryReport.totalItems}
                </Typography>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <Typography variant="h6" color="warning.main">
                  Low Stock Items
                </Typography>
                <Typography variant="h4">
                  {inventoryReport.lowStockItems}
                </Typography>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <Typography variant="h6" color="error.main">
                  Out of Stock
                </Typography>
                <Typography variant="h4">
                  {inventoryReport.outOfStockItems}
                </Typography>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <Typography variant="h6" color="success.main">
                  Total Value
                </Typography>
                <Typography variant="h4">
                  ₹{inventoryReport.totalValue.toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {/* Inventory Items Table */}
          <Typography variant="h6" gutterBottom>
            Inventory Status
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Item Name</TableCell>
                  <TableCell>Current Stock</TableCell>
                  <TableCell>Unit</TableCell>
                  <TableCell>Threshold</TableCell>
                  <TableCell>Value</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Array.isArray(inventoryReport.items) && inventoryReport.items.length > 0 ? (
                  inventoryReport.items.slice(0, 10).map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Typography variant="subtitle2">
                          {item.name}
                        </Typography>
                      </TableCell>
                      <TableCell>{item.currentStock}</TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell>{item.lowStockThreshold}</TableCell>
                      <TableCell>₹{item.value.toFixed(2)}</TableCell>
                      <TableCell>
                        <Chip
                          label={item.status.replace('_', ' ').toUpperCase()}
                          color={
                            item.status === 'in_stock' ? 'success' :
                            item.status === 'low_stock' ? 'warning' : 'error'
                          }
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body2" color="text.secondary">
                        No inventory items data available
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {loading && (
        <Box display="flex" justifyContent="center" p={3}>
          <CircularProgress />
        </Box>
      )}
    </Box>
  );
};