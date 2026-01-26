export interface SalesReport {
  period: string;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  topSellingItems: Array<{
    menuItemId: string;
    menuItemName: string;
    quantitySold: number;
    revenue: number;
  }>;
  revenueByPaymentMethod: Array<{
    paymentMethod: string;
    amount: number;
    percentage: number;
  }>;
  hourlyBreakdown?: Array<{
    hour: number;
    orders: number;
    revenue: number;
  }>;
}

export interface InventoryReport {
  totalItems: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalValue: number;
  items: Array<{
    id: string;
    name: string;
    currentStock: number;
    unit: string;
    lowStockThreshold: number;
    value: number;
    status: 'in_stock' | 'low_stock' | 'out_of_stock';
  }>;
}

export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  period?: 'daily' | 'weekly' | 'monthly' | 'custom';
}