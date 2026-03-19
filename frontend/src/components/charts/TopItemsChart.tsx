import React from 'react';
import { Card, CardContent, CardHeader, Box, CircularProgress, Alert } from '@mui/material';
import Chart from 'react-apexcharts';

interface TopItemsChartProps {
  data?: Array<{
    menuItemName: string;
    totalRevenue: number;
  }>;
  loading?: boolean;
  error?: string;
  height?: number;
}

export const TopItemsChart: React.FC<TopItemsChartProps> = ({
  data = [],
  loading = false,
  error = '',
  height = 350
}) => {
  const chartOptions: ApexCharts.ApexOptions = {
    chart: {
      type: 'donut',
      height: height,
      toolbar: {
        show: false
      },
      foreColor: '#9ca3af'
    },
    dataLabels: {
      enabled: true,
      formatter: (value) => `${Number(value).toFixed(1)}%`
    },
    plotOptions: {
      pie: {
        donut: {
          size: '65%',
          labels: {
            show: true,
            name: {
              offsetY: -10,
              fontSize: '14px',
              fontWeight: 600
            },
            value: {
              offsetY: 10,
              fontSize: '14px',
              fontWeight: 600
            }
          }
        }
      }
    },
    labels: data?.map(d => d.menuItemName) || [],
    legend: {
      position: 'bottom',
      fontSize: '11px',
      itemMargin: { horizontal: 6, vertical: 2 }
    },
    tooltip: {
      theme: 'light',
      y: {
        formatter: (value) => `₹${Number(value).toFixed(2)}`
      }
    },
    colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2']
  };

  const chartSeries = data?.map(d => d.totalRevenue) || [];

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        title="Top Selling Items"
        subheader="Revenue distribution by top items"
        titleTypographyProps={{ variant: 'subtitle1', fontWeight: 700 }}
        subheaderTypographyProps={{ variant: 'caption' }}
        sx={{ pb: 0 }}
      />
      <CardContent sx={{ flex: 1, pt: 1, overflow: 'hidden' }}>
        {error ? (
          <Alert severity="error">{error}</Alert>
        ) : loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: height }}>
            <CircularProgress />
          </Box>
        ) : chartSeries.length === 0 ? (
          <Alert severity="info">No data available</Alert>
        ) : (
          <Chart
            options={chartOptions}
            series={chartSeries}
            type="donut"
            height={height}
          />
        )}
      </CardContent>
    </Card>
  );
};
