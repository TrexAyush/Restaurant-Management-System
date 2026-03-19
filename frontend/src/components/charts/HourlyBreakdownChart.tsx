import React from 'react';
import { Card, CardContent, CardHeader, Box, CircularProgress, Alert } from '@mui/material';
import Chart from 'react-apexcharts';

interface HourlyBreakdownChartProps {
  data?: Array<{
    hour: number;
    count: number;
    revenue: number;
  }>;
  loading?: boolean;
  error?: string;
  height?: number;
}

export const HourlyBreakdownChart: React.FC<HourlyBreakdownChartProps> = ({
  data = [],
  loading = false,
  error = '',
  height = 350
}) => {
  const chartOptions: ApexCharts.ApexOptions = {
    chart: {
      type: 'area',
      height: height,
      stacked: false,
      toolbar: {
        show: false
      },
      foreColor: '#9ca3af'
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      width: 2,
      curve: 'smooth'
    },
    colors: ['#f59e0b', '#3b82f6'],
    grid: {
      borderColor: '#e5e7eb',
      strokeDashArray: 4,
      show: true
    },
    xaxis: {
      categories: data?.map(d => `${String(d.hour).padStart(2, '0')}:00`) || [],
      axisBorder: {
        show: true,
        color: '#e5e7eb'
      },
      labels: {
        rotate: -45,
        style: {
          fontSize: '10px'
        }
      }
    },
    yaxis: [
      {
        title: {
          text: 'Number of Orders',
          style: {
            color: '#f59e0b'
          }
        },
        labels: {
          style: {
            colors: '#f59e0b'
          }
        }
      },
      {
        opposite: true,
        title: {
          text: 'Revenue ($)',
          style: {
            color: '#3b82f6'
          }
        },
        labels: {
          style: {
            colors: '#3b82f6'
          },
          formatter: (value) => `₹${value.toFixed(0)}`
        }
      }
    ],
    tooltip: {
      theme: 'light',
      shared: true,
      intersect: false
    }
  };

  const chartSeries = [
    {
      name: 'Orders',
      type: 'column',
      data: data?.map(d => d.count) || []
    },
    {
      name: 'Revenue',
      type: 'area',
      data: data?.map(d => d.revenue) || []
    }
  ] as ApexAxisChartSeries;

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        title="Hourly Breakdown"
        subheader="Orders and revenue by hour of day"
        titleTypographyProps={{ variant: 'subtitle1', fontWeight: 700 }}
        subheaderTypographyProps={{ variant: 'caption' }}
        sx={{ pb: 0 }}
      />
      <CardContent sx={{ flex: 1, pt: 1 }}>
        {error ? (
          <Alert severity="error">{error}</Alert>
        ) : loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: height }}>
            <CircularProgress />
          </Box>
        ) : (
          <Chart
            options={chartOptions}
            series={chartSeries}
            type="area"
            height={height}
          />
        )}
      </CardContent>
    </Card>
  );
};
