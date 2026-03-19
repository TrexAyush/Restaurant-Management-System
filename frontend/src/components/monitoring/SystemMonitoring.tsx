import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Tabs,
  Tab,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack
} from '@mui/material';
import {
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  Refresh,
  Timeline,
  Memory,
  Speed
} from '@mui/icons-material';
import { apiClient } from '../../config/api';

interface SystemHealth {
  status: 'healthy' | 'warning' | 'error';
  components: Record<string, 'healthy' | 'warning' | 'error'>;
  lastChecked: string;
}

interface PerformanceMetric {
  average: number;
  min: number;
  max: number;
  count: number;
  p95: number;
  p99: number;
}

interface SystemStats {
  timeRange: number;
  performance: {
    apiResponseTime: PerformanceMetric;
    databaseQueryTime: PerformanceMetric;
    memoryUsage: PerformanceMetric;
  };
  errors: {
    error: number;
    warning: number;
    info: number;
  };
  systemHealth: SystemHealth;
  timestamp: string;
}

interface ErrorLog {
  id: string;
  level: 'error' | 'warning' | 'info';
  message: string;
  timestamp: string;
  endpoint?: string;
  metadata?: Record<string, any>;
}

export const SystemMonitoring: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [timeRange, setTimeRange] = useState(3600000); // 1 hour
  const [errorLevel, setErrorLevel] = useState<'error' | 'warning' | 'info' | ''>('');

  const fetchSystemStats = useCallback(async () => {
    try {
      const response = await apiClient.get(`/monitoring/stats?timeRange=${timeRange}`);
      setSystemStats(response.data.data);
    } catch (error) {
      console.error('Failed to fetch system stats:', error);
    }
  }, [timeRange]);

  const fetchErrorLogs = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (errorLevel) params.append('level', errorLevel);
      params.append('limit', '20');
      
      const response = await apiClient.get(`/monitoring/errors?${params}`);
      setErrorLogs(response.data.data.logs);
    } catch (error) {
      console.error('Failed to fetch error logs:', error);
    }
  }, [errorLevel]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchSystemStats(),
        fetchErrorLogs()
      ]);
      setLoading(false);
    };
    
    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [fetchSystemStats, fetchErrorLogs]);

  const getStatusIcon = (status: 'healthy' | 'warning' | 'error') => {
    switch (status) {
      case 'healthy':
        return <CheckCircle color="success" />;
      case 'warning':
        return <Warning color="warning" />;
      case 'error':
        return <ErrorIcon color="error" />;
    }
  };

  const getStatusColor = (status: 'healthy' | 'warning' | 'error') => {
    switch (status) {
      case 'healthy':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
    }
  };

  const formatMetric = (value: number, unit: string) => {
    if (unit === 'ms') {
      return `${value.toFixed(2)}ms`;
    } else if (unit === 'MB') {
      return `${value.toFixed(1)}MB`;
    }
    return `${value.toFixed(0)}`;
  };

  const formatTimeRange = (ms: number) => {
    const hours = ms / (1000 * 60 * 60);
    if (hours < 1) {
      return `${ms / (1000 * 60)}m`;
    }
    return `${hours}h`;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
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
          background: 'linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(14,165,233,0.08) 100%)',
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }}>
          <Box>
            <Typography variant="h4" component="h1" sx={{ mb: 0.75 }}>
              System Monitoring
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Track system health, API performance, and error logs in real time.
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => {
              setLoading(true);
              Promise.all([
                fetchSystemStats(),
                fetchErrorLogs()
              ]).then(() => setLoading(false));
            }}
          >
            Refresh
          </Button>
        </Stack>
      </Paper>

      <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
        <Tab label="Overview" />
        <Tab label="Performance" />
        <Tab label="Error Logs" />
      </Tabs>

      {activeTab === 0 && systemStats && (
        <Grid container spacing={3}>
          {/* System Health */}
          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  System Health
                </Typography>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  {getStatusIcon(systemStats.systemHealth.status)}
                  <Chip
                    label={systemStats.systemHealth.status.toUpperCase()}
                    color={getStatusColor(systemStats.systemHealth.status)}
                  />
                  <Typography variant="body2" color="text.secondary">
                    Last checked: {new Date(systemStats.systemHealth.lastChecked).toLocaleString()}
                  </Typography>
                </Box>
                <Grid container spacing={2}>
                  {Object.entries(systemStats.systemHealth.components).map(([component, status]) => (
                    <Grid size={{ xs: 6, sm: 4, md: 3 }} key={component}>
                      <Box display="flex" alignItems="center" gap={1}>
                        {getStatusIcon(status)}
                        <Typography variant="body2">
                          {component.replace('_', ' ').toUpperCase()}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Error Summary */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Error Summary ({formatTimeRange(systemStats.timeRange)})
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 4 }}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="error">
                        {systemStats.errors.error}
                      </Typography>
                      <Typography variant="body2">Errors</Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 4 }}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="warning.main">
                        {systemStats.errors.warning}
                      </Typography>
                      <Typography variant="body2">Warnings</Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 4 }}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="info.main">
                        {systemStats.errors.info}
                      </Typography>
                      <Typography variant="body2">Info</Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

        </Grid>
      )}

      {activeTab === 1 && systemStats && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12 }} sx={{ mb: 2 }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Time Range</InputLabel>
              <Select
                value={timeRange}
                label="Time Range"
                onChange={(e) => setTimeRange(Number(e.target.value))}
              >
                <MenuItem value={900000}>15 minutes</MenuItem>
                <MenuItem value={3600000}>1 hour</MenuItem>
                <MenuItem value={21600000}>6 hours</MenuItem>
                <MenuItem value={86400000}>24 hours</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* API Response Time */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <Speed color="primary" />
                  <Typography variant="h6">API Response Time</Typography>
                </Box>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="body2" color="text.secondary">Average</Typography>
                    <Typography variant="h6">
                      {formatMetric(systemStats.performance.apiResponseTime.average, 'ms')}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="body2" color="text.secondary">P95</Typography>
                    <Typography variant="h6">
                      {formatMetric(systemStats.performance.apiResponseTime.p95, 'ms')}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="body2" color="text.secondary">Min</Typography>
                    <Typography variant="body1">
                      {formatMetric(systemStats.performance.apiResponseTime.min, 'ms')}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="body2" color="text.secondary">Max</Typography>
                    <Typography variant="body1">
                      {formatMetric(systemStats.performance.apiResponseTime.max, 'ms')}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Database Query Time */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <Timeline color="primary" />
                  <Typography variant="h6">Database Query Time</Typography>
                </Box>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="body2" color="text.secondary">Average</Typography>
                    <Typography variant="h6">
                      {formatMetric(systemStats.performance.databaseQueryTime.average, 'ms')}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="body2" color="text.secondary">P95</Typography>
                    <Typography variant="h6">
                      {formatMetric(systemStats.performance.databaseQueryTime.p95, 'ms')}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="body2" color="text.secondary">Min</Typography>
                    <Typography variant="body1">
                      {formatMetric(systemStats.performance.databaseQueryTime.min, 'ms')}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="body2" color="text.secondary">Max</Typography>
                    <Typography variant="body1">
                      {formatMetric(systemStats.performance.databaseQueryTime.max, 'ms')}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Memory Usage */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <Memory color="primary" />
                  <Typography variant="h6">Memory Usage</Typography>
                </Box>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="body2" color="text.secondary">Average</Typography>
                    <Typography variant="h6">
                      {formatMetric(systemStats.performance.memoryUsage.average, 'MB')}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="body2" color="text.secondary">Peak</Typography>
                    <Typography variant="h6">
                      {formatMetric(systemStats.performance.memoryUsage.max, 'MB')}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 2 && (
        <Box>
          <Box mb={2}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Error Level</InputLabel>
              <Select
                value={errorLevel}
                label="Error Level"
                onChange={(e) => setErrorLevel(e.target.value as any)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="error">Error</MenuItem>
                <MenuItem value="warning">Warning</MenuItem>
                <MenuItem value="info">Info</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Level</TableCell>
                  <TableCell>Message</TableCell>
                  <TableCell>Endpoint</TableCell>
                  <TableCell>Timestamp</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {errorLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <Chip
                        label={log.level.toUpperCase()}
                        color={log.level === 'error' ? 'error' : log.level === 'warning' ? 'warning' : 'info'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{log.message}</TableCell>
                    <TableCell>{log.endpoint || '-'}</TableCell>
                    <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Box>
  );
};