import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Alert,
  Skeleton,
  Paper
} from '@mui/material';
import { ReportingService } from '../../services/reportingService';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types/auth';
import {
  RevenueChart,
  OrdersChart,
  TopItemsChart,
  PaymentMethodChart,
  HourlyBreakdownChart,
  ItemQuantityChart
} from '../charts';

interface TopItem {
  menuItemId: string;
  menuItemName: string;
  categoryName?: string;
  totalQuantitySold: number;
  totalRevenue: number;
  orderFrequency: number;
}

interface SalesTrendData {
  today: {
    revenue: number;
    orders: number;
    averageOrderValue: number;
    revenueByPaymentMethod?: Record<string, number>;
    ordersByHour?: Array<{
      hour: number;
      count: number;
      revenue: number;
    }>;
  };
  yesterday: {
    revenue: number;
    orders: number;
    averageOrderValue: number;
  };
  weeklyTrends: {
    totalRevenue: number;
    totalOrders: number;
    revenueGrowth: number;
    orderGrowth: number;
    dailyBreakdown: Array<{
      date: string;
      revenue: number;
      orders: number;
    }>;
  };
  topItems: TopItem[];
}

export const SalesTrends: React.FC = () => {
  const [trendData, setTrendData] = useState<SalesTrendData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const { user } = useAuth();

  const canViewTrends = user && [UserRole.ADMIN, UserRole.MANAGER].includes(user.role);

  useEffect(() => {
    if (canViewTrends) {
      loadTrendData();
      const interval = setInterval(loadTrendData, 60000);
      return () => clearInterval(interval);
    }
  }, [canViewTrends]);

  const loadTrendData = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await ReportingService.getDashboardSummary();
      setTrendData(data);
    } catch (err) {
      console.error('Error loading trend data:', err);
      setError('Failed to load sales trends');
    } finally {
      setLoading(false);
    }
  };

  if (!canViewTrends) {
    return null;
  }

  // Prepare data for charts
  const revenueChartData = trendData?.weeklyTrends?.dailyBreakdown?.map(day => ({
    date: day.date,
    revenue: day.revenue
  })) || [];

  const ordersChartData = trendData?.weeklyTrends?.dailyBreakdown?.map(day => ({
    date: day.date,
    orders: day.orders
  })) || [];

  const paymentMethodData = trendData?.today?.revenueByPaymentMethod
    ? Object.entries(trendData.today.revenueByPaymentMethod).map(([method, amount]) => ({
        paymentMethod: method,
        amount: Number(amount) || 0
      }))
    : [];

  const hourlyData = trendData?.today?.ordersByHour || [];

  const topItemsData = trendData?.topItems?.slice(0, 5).map(item => ({
    menuItemName: item.menuItemName,
    totalRevenue: item.totalRevenue
  })) || [];

  const itemQuantityData = trendData?.topItems?.map(item => ({
    menuItemName: item.menuItemName,
    totalQuantitySold: item.totalQuantitySold
  })) || [];

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
        📊 Sales Analytics & Trends
      </Typography>

      <Grid container spacing={2}>
        {/* Revenue Trend Chart */}
        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          {loading ? (
            <Skeleton variant="rectangular" height={280} sx={{ borderRadius: 1 }} />
          ) : (
            <RevenueChart
              data={revenueChartData}
              loading={loading}
              error={error}
              height={280}
            />
          )}
        </Grid>

        {/* Orders Trend Chart */}
        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          {loading ? (
            <Skeleton variant="rectangular" height={280} sx={{ borderRadius: 1 }} />
          ) : (
            <OrdersChart
              data={ordersChartData}
              loading={loading}
              error={error}
              height={280}
            />
          )}
        </Grid>

        {/* Hourly Breakdown Chart */}
        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          {loading ? (
            <Skeleton variant="rectangular" height={280} sx={{ borderRadius: 1 }} />
          ) : (
            <HourlyBreakdownChart
              data={hourlyData}
              loading={loading}
              error={error}
              height={280}
            />
          )}
        </Grid>

        {/* Payment Method Distribution */}
        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          {loading ? (
            <Skeleton variant="rectangular" height={280} sx={{ borderRadius: 1 }} />
          ) : (
            <PaymentMethodChart
              data={paymentMethodData}
              loading={loading}
              error={error}
              height={280}
            />
          )}
        </Grid>

        {/* Top Items Revenue */}
        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          {loading ? (
            <Skeleton variant="rectangular" height={280} sx={{ borderRadius: 1 }} />
          ) : (
            <TopItemsChart
              data={topItemsData}
              loading={loading}
              error={error}
              height={280}
            />
          )}
        </Grid>

        {/* Item Quantity Chart */}
        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          {loading ? (
            <Skeleton variant="rectangular" height={280} sx={{ borderRadius: 1 }} />
          ) : (
            <ItemQuantityChart
              data={itemQuantityData}
              loading={loading}
              error={error}
              height={280}
              limit={8}
            />
          )}
        </Grid>

        {/* Summary Statistics */}
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 3, background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', color: 'white' }}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>Weekly Revenue</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', mt: 1 }}>
                    ₹{(trendData?.weeklyTrends?.totalRevenue || 0).toFixed(2)}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.7 }}>
                    Growth: {trendData?.weeklyTrends?.revenueGrowth?.toFixed(1)}%
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>Weekly Orders</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', mt: 1 }}>
                    {trendData?.weeklyTrends?.totalOrders || 0}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.7 }}>
                    Growth: {trendData?.weeklyTrends?.orderGrowth?.toFixed(1)}%
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>Avg Order Value</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', mt: 1 }}>
                    ₹{(trendData?.today?.averageOrderValue || 0).toFixed(2)}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.7 }}>
                    Today's average
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>Top Item</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {trendData?.topItems?.[0]?.menuItemName || 'N/A'}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.7 }}>
                    {trendData?.topItems?.[0]?.totalQuantitySold || 0} sold
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};
