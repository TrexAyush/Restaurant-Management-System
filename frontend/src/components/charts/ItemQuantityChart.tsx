import React from 'react';
import { Card, CardContent, CardHeader, Box, CircularProgress, Alert } from '@mui/material';
import Chart from 'react-apexcharts';

interface ItemQuantityChartProps {
  data?: Array<{
    menuItemName: string;
    totalQuantitySold: number;
  }>;
  loading?: boolean;
  error?: string;
  height?: number;
  limit?: number;
}

export const ItemQuantityChart: React.FC<ItemQuantityChartProps> = ({
  data = [],
  loading = false,
  error = '',
  height = 350,
  limit = 8
}) => {
  const topData = data?.slice(0, limit) || [];

  const chartOptions: ApexCharts.ApexOptions = {
    chart: {
      type: 'bar',
      height: height,
      toolbar: {
        show: true
      },
      foreColor: '#9ca3af'
    },
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 4,
        dataLabels: {
          position: 'right'
        }
      }
    },
    dataLabels: {
      enabled: true,
      formatter: (value) => value.toString(),
      offsetX: 0,
      style: {
        fontSize: '12px',
        fontWeight: 500
      }
    },
    grid: {
      borderColor: '#e5e7eb',
      show: true
    },
    xaxis: {
      title: {
        text: 'Quantity Sold'
      }
    },
    tooltip: {
      theme: 'light',
      x: {
        show: true
      }
    },
    colors: ['#9C27B0']
  };

  const chartSeries = [
    {
      name: 'Quantity Sold',
      data: topData?.map(d => d.totalQuantitySold) || []
    }
  ];

  const categories = topData?.map(d => d.menuItemName.substring(0, 20)) || [];

  return (
    <Card>
      <CardHeader
        title="Most Ordered Items"
        subheader={`Top ${limit} items by quantity sold`}
      />
      <CardContent>
        {error ? (
          <Alert severity="error">{error}</Alert>
        ) : loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: height }}>
            <CircularProgress />
          </Box>
        ) : chartSeries[0]?.data.length === 0 ? (
          <Alert severity="info">No data available</Alert>
        ) : (
          <Chart
            options={{
              ...chartOptions,
              xaxis: {
                ...chartOptions.xaxis,
                categories: categories
              }
            } as ApexCharts.ApexOptions}
            series={chartSeries}
            type="bar"
            height={height}
          />
        )}
      </CardContent>
    </Card>
  );
};
