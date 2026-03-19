import React from 'react';
import { Card, CardContent, CardHeader, Box, CircularProgress, Alert } from '@mui/material';
import Chart from 'react-apexcharts';

interface OrdersChartProps {
  data?: Array<{
    date: string;
    orders: number;
  }>;
  loading?: boolean;
  error?: string;
  height?: number;
}

export const OrdersChart: React.FC<OrdersChartProps> = ({
  data = [],
  loading = false,
  error = '',
  height = 350
}) => {
  const chartOptions: ApexCharts.ApexOptions = {
    chart: {
      type: 'bar',
      height: height,
      toolbar: {
        show: false
      },
      foreColor: '#9ca3af'
    },
    dataLabels: {
      enabled: true,
      formatter: (value) => value.toString()
    },
    plotOptions: {
      bar: {
        columnWidth: '55%',
        borderRadius: 4,
        dataLabels: {
          position: 'top'
        }
      }
    },
    grid: {
      borderColor: '#e5e7eb',
      strokeDashArray: 4,
      show: true
    },
    xaxis: {
      categories: data?.map(d => new Date(d.date).toLocaleDateString([], { month: 'short', day: 'numeric' })) || [],
      axisBorder: {
        show: true,
        color: '#e5e7eb'
      }
    },
    yaxis: {
      title: {
        text: 'Number of Orders'
      }
    },
    tooltip: {
      theme: 'light',
      y: {
        formatter: (value) => `${value} orders`
      }
    },
    colors: ['#10b981']
  };

  const chartSeries = [
    {
      name: 'Orders',
      data: data?.map(d => d.orders) || []
    }
  ];

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        title="Daily Orders Trend"
        subheader="7-day order count progression"
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
            type="bar"
            height={height}
          />
        )}
      </CardContent>
    </Card>
  );
};
