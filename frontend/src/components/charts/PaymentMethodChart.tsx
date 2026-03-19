import React from 'react';
import { Card, CardContent, CardHeader, Box, CircularProgress, Alert } from '@mui/material';
import Chart from 'react-apexcharts';

interface PaymentMethodChartProps {
  data?: Array<{
    paymentMethod: string;
    amount: number;
  }>;
  loading?: boolean;
  error?: string;
  height?: number;
}

export const PaymentMethodChart: React.FC<PaymentMethodChartProps> = ({
  data = [],
  loading = false,
  error = '',
  height = 350
}) => {
  const chartOptions: ApexCharts.ApexOptions = {
    chart: {
      type: 'pie',
      height: height,
      toolbar: {
        show: true
      },
      foreColor: '#9ca3af'
    },
    dataLabels: {
      enabled: true,
      formatter: (value) => `${Number(value).toFixed(1)}%`
    },
    plotOptions: {
      pie: {
        dataLabels: {
          offset: -5
        }
      }
    },
    labels: data?.map(d => {
      const method = d.paymentMethod;
      return method.charAt(0).toUpperCase() + method.slice(1);
    }) || [],
    tooltip: {
      theme: 'light',
      y: {
        formatter: (value) => `₹${Number(value).toFixed(2)}`
      }
    },
    colors: ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981']
  };

  const chartSeries = data?.map(d => d.amount) || [];

  return (
    <Card>
      <CardHeader
        title="Payment Methods Distribution"
        subheader="Revenue by payment method"
      />
      <CardContent>
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
            type="pie"
            height={height}
          />
        )}
      </CardContent>
    </Card>
  );
};
