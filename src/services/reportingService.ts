import { apiClient } from '../config/api';
import { SalesReport, InventoryReport, ReportFilters } from '../types/reports';
import { ApiResponse } from '../types/menu';

export class ReportingService {
  static async getSalesReport(filters: ReportFilters): Promise<SalesReport> {
    try {
      let reportData: any;
      
      // Choose the appropriate endpoint based on the period
      if (filters.period === 'weekly') {
        const weekStart = filters.startDate || new Date().toISOString().split('T')[0];
        reportData = await this.getWeeklyReport(weekStart);
      } else if (filters.period === 'custom' && filters.startDate && filters.endDate) {
        reportData = await this.getRevenueReport(filters.startDate, filters.endDate, 'day');
      } else {
        // Default to daily report
        const date = filters.startDate || new Date().toISOString().split('T')[0];
        reportData = await this.getDailyReport(date);
      }

      // Get popular items for the same period
      let popularItems: any[] = [];
      try {
        popularItems = await this.getPopularityReport(filters.startDate, filters.endDate, 10);
      } catch (error) {
        console.warn('Could not fetch popular items:', error);
        popularItems = [];
      }

      console.log('Raw report data:', reportData);
      console.log('Popular items:', popularItems);

      // Transform the data to match SalesReport interface
      const salesReport: SalesReport = {
        period: filters.period || 'daily',
        totalRevenue: reportData.totalRevenue || 0,
        totalOrders: reportData.totalOrders || 0,
        averageOrderValue: reportData.averageOrderValue || 0,
        topSellingItems: Array.isArray(popularItems) 
          ? popularItems.map((item: any) => ({
              menuItemId: item.menuItemId || item.id,
              menuItemName: item.menuItemName || item.name,
              quantitySold: item.totalQuantitySold || item.quantitySold || item.totalQuantity || 0,
              revenue: item.totalRevenue || item.revenue || 0
            }))
          : [],
        revenueByPaymentMethod: this.transformPaymentMethodData(reportData.revenueByPaymentMethod),
        hourlyBreakdown: Array.isArray(reportData.hourlyBreakdown) 
          ? reportData.hourlyBreakdown 
          : Array.isArray(reportData.dailyBreakdown) 
            ? reportData.dailyBreakdown.map((day: any, index: number) => ({
                hour: index,
                orders: day.orders || 0,
                revenue: day.revenue || 0
              }))
            : []
      };

      return salesReport;
    } catch (error) {
      console.error('Error fetching sales report:', error);
      throw error;
    }
  }

  static async getInventoryReport(): Promise<InventoryReport> {
    try {
      // Get inventory summary
      const summaryResponse = await apiClient.get<ApiResponse<any>>('/inventory/reports/summary');
      
      if (!summaryResponse.data.success || !summaryResponse.data.data) {
        throw new Error('Failed to generate inventory report summary');
      }

      const summary = summaryResponse.data.data;

      // Get all inventory items to build the detailed report
      const itemsResponse = await apiClient.get<ApiResponse<any[]>>('/inventory');
      
      if (!itemsResponse.data.success || !itemsResponse.data.data) {
        throw new Error('Failed to get inventory items');
      }

      const items = itemsResponse.data.data;

      // Transform items to match frontend interface
      const transformedItems = items.map((item: any) => {
        const value = item.currentStock * item.costPerUnit;
        let status: 'in_stock' | 'low_stock' | 'out_of_stock' = 'in_stock';
        
        if (item.currentStock === 0) {
          status = 'out_of_stock';
        } else if (item.currentStock <= item.lowStockThreshold) {
          status = 'low_stock';
        }

        return {
          id: item.id,
          name: item.name,
          currentStock: item.currentStock,
          unit: item.unit,
          lowStockThreshold: item.lowStockThreshold,
          value: value,
          status: status
        };
      });

      // Count out of stock items
      const outOfStockItems = transformedItems.filter(item => item.status === 'out_of_stock').length;

      const inventoryReport: InventoryReport = {
        totalItems: summary.totalItems,
        lowStockItems: summary.lowStockItems,
        outOfStockItems: outOfStockItems,
        totalValue: summary.totalValue,
        items: transformedItems
      };

      return inventoryReport;
    } catch (error) {
      console.error('Error fetching inventory report:', error);
      throw error;
    }
  }

  static async getDailyReport(date?: string): Promise<any> {
    try {
      const params = date ? `?date=${date}` : '';
      const response = await apiClient.get<ApiResponse<any>>(`/reports/daily${params}`);
      
      if (!response.data.success || !response.data.data) {
        throw new Error('Failed to generate daily report');
      }

      return response.data.data;
    } catch (error) {
      console.error('Error fetching daily report:', error);
      throw error;
    }
  }

  static async getWeeklyReport(weekStart?: string): Promise<any> {
    try {
      const params = weekStart ? `?weekStart=${weekStart}` : '';
      const response = await apiClient.get<ApiResponse<any>>(`/reports/weekly${params}`);
      
      if (!response.data.success || !response.data.data) {
        throw new Error('Failed to generate weekly report');
      }

      return response.data.data;
    } catch (error) {
      console.error('Error fetching weekly report:', error);
      throw error;
    }
  }

  static async getPopularityReport(startDate?: string, endDate?: string, limit?: number): Promise<any> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (limit) params.append('limit', limit.toString());

      const response = await apiClient.get<ApiResponse<any>>(`/reports/popularity?${params.toString()}`);
      
      if (!response.data.success || !response.data.data) {
        throw new Error('Failed to generate popularity report');
      }

      return response.data.data;
    } catch (error) {
      console.error('Error fetching popularity report:', error);
      throw error;
    }
  }

  static async getRevenueReport(startDate: string, endDate: string, groupBy?: string): Promise<any> {
    try {
      const params = new URLSearchParams();
      params.append('startDate', startDate);
      params.append('endDate', endDate);
      if (groupBy) params.append('groupBy', groupBy);

      const response = await apiClient.get<ApiResponse<any>>(`/reports/revenue?${params.toString()}`);
      
      if (!response.data.success || !response.data.data) {
        throw new Error('Failed to generate revenue report');
      }

      return response.data.data;
    } catch (error) {
      console.error('Error fetching revenue report:', error);
      throw error;
    }
  }

  static async exportSalesReport(filters: ReportFilters, format: 'pdf' | 'csv' | 'excel'): Promise<Blob> {
    try {
      // Get the report data first
      const reportData = await this.getSalesReport(filters);
      
      // Use the export endpoint
      const response = await apiClient.post('/reports/export', {
        reportType: 'daily',
        reportData: reportData,
        options: {
          format: format === 'excel' ? 'csv' : format, // Backend doesn't support excel, use csv instead
          includeCharts: false,
          dateRange: filters.startDate && filters.endDate ? {
            startDate: new Date(filters.startDate),
            endDate: new Date(filters.endDate)
          } : undefined
        }
      }, {
        responseType: 'blob'
      });
      
      return response.data;
    } catch (error) {
      console.error('Error exporting sales report:', error);
      throw error;
    }
  }

  static async exportInventoryReport(format: 'pdf' | 'csv' | 'excel'): Promise<Blob> {
    try {
      // Get the report data first
      const reportData = await this.getInventoryReport();
      
      // Use the export endpoint
      const response = await apiClient.post('/reports/export', {
        reportType: 'inventory',
        reportData: reportData,
        options: {
          format: format === 'excel' ? 'csv' : format, // Backend doesn't support excel, use csv instead
          includeCharts: false
        }
      }, {
        responseType: 'blob'
      });
      
      return response.data;
    } catch (error) {
      console.error('Error exporting inventory report:', error);
      throw error;
    }
  }

  // Helper method to transform payment method data from object to array
  private static transformPaymentMethodData(paymentMethodData: any): Array<{
    paymentMethod: string;
    amount: number;
    percentage: number;
  }> {
    if (!paymentMethodData || typeof paymentMethodData !== 'object') {
      return [];
    }

    const totalAmount = Object.values(paymentMethodData).reduce((sum: number, amount: any) => sum + (Number(amount) || 0), 0);
    
    if (totalAmount === 0) {
      return [];
    }

    return Object.entries(paymentMethodData).map(([method, amount]) => ({
      paymentMethod: method,
      amount: Number(amount) || 0,
      percentage: totalAmount > 0 ? ((Number(amount) || 0) / totalAmount) * 100 : 0
    }));
  }
}