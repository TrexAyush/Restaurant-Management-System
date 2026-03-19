import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Skeleton,
  Alert
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  ShoppingCart as ShoppingCartIcon,
  AttachMoney as AttachMoneyIcon,
  LocalFireDepartment as LocalFireDepartmentIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';
import { ReportingService } from '../../services/reportingService';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types/auth';

interface KPICardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: React.ReactElement;
  color: string;
  trend?: number; // percentage change
  loading?: boolean;
}

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  unit,
  icon,
  color,
  trend,
  loading
}) => {
  return (
    <Card
      sx={{
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        background:
          'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.98) 100%)',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          right: -8,
          top: -8,
          fontSize: 72,
          opacity: 0.08,
          color: color
        }}
      >
        {icon}
      </Box>
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.75 }}>
          <Typography color="text.secondary" gutterBottom variant="subtitle2">
            {title}
          </Typography>
          <Box
            sx={{
              color: color,
              display: 'grid',
              placeItems: 'center',
              width: 40,
              height: 40,
              borderRadius: '10px',
              backgroundColor: `${color}14`,
              border: `1px solid ${color}20`,
            }}
          >
            {icon}
          </Box>
        </Box>

        {loading ? (
          <Skeleton width="80%" height={40} />
        ) : (
          <>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: 'text.primary',
                lineHeight: 1.15,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '100%',
              }}
              title={String(value)}
            >
              {value}
              {unit && (
                <Typography variant="body2" component="span" sx={{ ml: 1, color: 'text.secondary', fontWeight: 500 }}>
                  {unit}
                </Typography>
              )}
            </Typography>
            {trend !== undefined && (
              <Box sx={{ mt: 1.25, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <TrendingUpIcon
                  sx={{
                    fontSize: 16,
                    color: trend >= 0 ? 'success.main' : 'error.main',
                    transform: trend < 0 ? 'rotate(180deg)' : 'none'
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    color: trend >= 0 ? 'success.main' : 'error.main',
                    fontWeight: 'bold'
                  }}
                >
                  {Math.abs(trend)}% vs yesterday
                </Typography>
              </Box>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export const DashboardKPIs: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const { user } = useAuth();

  const canViewMetrics = user && [UserRole.ADMIN, UserRole.MANAGER].includes(user.role);

  useEffect(() => {
    if (canViewMetrics) {
      loadMetrics();
      const interval = setInterval(loadMetrics, 60000);
      return () => clearInterval(interval);
    }
  }, [canViewMetrics]);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await ReportingService.getDashboardSummary();
      setMetrics(data);
    } catch (err) {
      console.error('Error loading KPI metrics:', err);
      setError('Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  if (!canViewMetrics) {
    return null;
  }

  const calculateTrend = (today: number, yesterday: number) => {
    if (yesterday === 0) return 0;
    return Math.round(((today - yesterday) / yesterday) * 100);
  };

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
        Key Performance Indicators
      </Typography>

      <Grid container spacing={2.5}>
        {/* Today's Revenue */}
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
          <KPICard
            title="Today's Revenue"
            value={`₹${(metrics?.today?.revenue || 0).toFixed(2)}`}
            icon={<AttachMoneyIcon />}
            color="#3b82f6"
            trend={metrics && calculateTrend(metrics.today.revenue, metrics.yesterday.revenue)}
            loading={loading}
          />
        </Grid>

        {/* Today's Orders */}
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
          <KPICard
            title="Today's Orders"
            value={metrics?.today?.orders || 0}
            unit="orders"
            icon={<ShoppingCartIcon />}
            color="#10b981"
            trend={metrics && calculateTrend(metrics.today.orders, metrics.yesterday.orders)}
            loading={loading}
          />
        </Grid>

        {/* Average Order Value */}
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
          <KPICard
            title="Avg Order Value"
            value={`₹${(metrics?.today?.averageOrderValue || 0).toFixed(2)}`}
            icon={<ReceiptIcon />}
            color="#f59e0b"
            trend={
              metrics &&
              calculateTrend(metrics.today.averageOrderValue, metrics.yesterday.averageOrderValue)
            }
            loading={loading}
          />
        </Grid>

        {/* Weekly Revenue */}
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
          <KPICard
            title="Weekly Revenue"
            value={`₹${(metrics?.weeklyTrends?.totalRevenue || 0).toFixed(2)}`}
            icon={<TrendingUpIcon />}
            color="#8b5cf6"
            trend={metrics?.weeklyTrends?.revenueGrowth}
            loading={loading}
          />
        </Grid>

        {/* Top Item */}
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
          <KPICard
            title="Top Item"
            value={metrics?.topItems?.[0]?.menuItemName || 'N/A'}
            unit={`${metrics?.topItems?.[0]?.totalQuantitySold || 0} sold`}
            icon={<LocalFireDepartmentIcon />}
            color="#ef4444"
            loading={loading}
          />
        </Grid>
      </Grid>
    </Box>
  );
};
