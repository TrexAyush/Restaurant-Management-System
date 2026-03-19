import React from 'react';
import { Card, CardContent, CardHeader, Box, CircularProgress, Alert } from '@mui/material';
import Chart from 'react-apexcharts';

interface RevenueChartProps {
  data?: Array<{
    date: string;
    revenue: number;
  }>;
  loading?: boolean;
  error?: string;
  height?: number;
}

export const RevenueChart: React.FC<RevenueChartProps> = ({
  data = [],
  loading = false,
  error = '',
  height = 350
}) => {
  const chartOptions: ApexCharts.ApexOptions = {
    chart: {
      type: 'area',
      height: height,
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true
        }
      },
      foreColor: '#9ca3af'
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth',
      width: 2,
      colors: ['#2196F3']
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.45,
        opacityTo: 0.05,
        stops: [20, 100, 100, 100],
        colorStops: [
          {
            offset: 0,
            color: '#2196F3',
            opacity: 0.4
          },
          {
            offset: 100,
            color: '#2196F3',
            opacity: 0.05
          }
        ]
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
      labels: {
        formatter: (value) => `₹${value.toFixed(0)}`
      }
    },
    tooltip: {
      theme: 'light',
      y: {
        formatter: (value) => `₹${value.toFixed(2)}`
      }
    },
    colors: ['#2196F3']
  };

  const chartSeries = [
    {
      name: 'Revenue',
      data: data?.map(d => d.revenue) || []
    }
  ];

  return (
    <Card>
      <CardHeader
        title="Daily Revenue Trend"
        subheader="7-day revenue progression"
      />
      <CardContent>
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
