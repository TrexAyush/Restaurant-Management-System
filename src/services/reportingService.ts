import { 
  DateRange,
  PaginationParams,
  PaginatedResponse
} from '../models';
import { PaymentMethod, PaymentStatus, OrderStatus } from '../models/enums';
import { billRepository } from '../repositories/billRepository';
import { orderRepository } from '../repositories/orderRepository';
import { menuService } from './menuService';
import knex from '../config/database';

// Report interfaces
export interface DailySalesReport {
  date: Date;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  popularItems: PopularItem[];
  revenueByPaymentMethod: Record<PaymentMethod, number>;
  ordersByHour: Array<{ hour: number; count: number; revenue: number }>;
}

export interface WeeklySalesReport {
  weekStart: Date;
  weekEnd: Date;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  dailyBreakdown: Array<{
    date: Date;
    revenue: number;
    orders: number;
  }>;
  trendAnalysis: {
    revenueGrowth: number; // Percentage change from previous week
    orderGrowth: number;   // Percentage change from previous week
    averageOrderValueGrowth: number;
  };
  popularItems: PopularItem[];
}

export interface PopularItem {
  menuItemId: string;
  menuItemName: string;
  categoryName: string;
  totalQuantitySold: number;
  totalRevenue: number;
  orderFrequency: number; // Number of orders containing this item
  averageQuantityPerOrder: number;
}

export interface RevenueSummary {
  dateRange: DateRange;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  revenueByPaymentMethod: Record<PaymentMethod, number>;
  revenueByCategory: Array<{
    categoryId: string;
    categoryName: string;
    revenue: number;
    percentage: number;
  }>;
  revenueByTimePeriod: Array<{
    period: string; // Date string for daily, week string for weekly
    revenue: number;
    orders: number;
  }>;
}

export interface PerformanceMetrics {
  timestamp: Date;
  averageOrderPreparationTime: number; // in minutes
  averageResponseTime: number; // API response time in ms
  activeUsers: number;
  systemLoad: {
    cpu: number;
    memory: number;
    database: {
      activeConnections: number;
      averageQueryTime: number;
    };
  };
  orderThroughput: {
    ordersPerHour: number;
    peakHourOrders: number;
    averageOrdersPerDay: number;
  };
}

export interface ReportExportOptions {
  format: 'json' | 'csv' | 'pdf';
  includeCharts?: boolean;
  dateRange?: DateRange;
}

export class ReportingService {

  /**
   * Generate daily sales report
   * Requirement 7.1: Daily sales report generation
   */
  async generateDailySalesReport(date: Date): Promise<DailySalesReport> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get bills for the day
    const bills = await billRepository.getBillsForDateRange(startOfDay, endOfDay);
    
    // Calculate basic metrics
    const totalRevenue = bills.reduce((sum, bill) => sum + bill.totalAmount, 0);
    const totalOrders = bills.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Revenue by payment method
    const revenueByPaymentMethod: Record<PaymentMethod, number> = {
      [PaymentMethod.CASH]: 0,
      [PaymentMethod.CARD]: 0,
      [PaymentMethod.DIGITAL]: 0
    };

    bills.forEach(bill => {
      if (bill.paymentMethod) {
        revenueByPaymentMethod[bill.paymentMethod] += bill.totalAmount;
      }
    });

    // Get popular items for the day
    const popularItems = await this.getPopularItemsForDateRange(startOfDay, endOfDay);

    // Orders by hour
    const ordersByHour = await this.getOrdersByHour(startOfDay, endOfDay);

    return {
      date,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalOrders,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      popularItems: popularItems.slice(0, 10), // Top 10 items
      revenueByPaymentMethod,
      ordersByHour
    };
  }

  /**
   * Generate weekly sales report with trend analysis
   * Requirement 7.2: Weekly sales analysis with trend data
   */
  async generateWeeklySalesReport(weekStart: Date): Promise<WeeklySalesReport> {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // Get bills for the week
    const bills = await billRepository.getBillsForDateRange(weekStart, weekEnd);
    
    // Calculate basic metrics
    const totalRevenue = bills.reduce((sum, bill) => sum + bill.totalAmount, 0);
    const totalOrders = bills.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Daily breakdown
    const dailyBreakdown = [];
    for (let i = 0; i < 7; i++) {
      const currentDay = new Date(weekStart);
      currentDay.setDate(weekStart.getDate() + i);
      
      const dayStart = new Date(currentDay);
      dayStart.setHours(0, 0, 0, 0);
      
      const dayEnd = new Date(currentDay);
      dayEnd.setHours(23, 59, 59, 999);

      const dayBills = bills.filter(bill => 
        bill.generatedAt >= dayStart && bill.generatedAt <= dayEnd
      );

      const dayRevenue = dayBills.reduce((sum, bill) => sum + bill.totalAmount, 0);
      
      dailyBreakdown.push({
        date: currentDay,
        revenue: Math.round(dayRevenue * 100) / 100,
        orders: dayBills.length
      });
    }

    // Calculate trend analysis (compare with previous week)
    const previousWeekStart = new Date(weekStart);
    previousWeekStart.setDate(weekStart.getDate() - 7);
    
    const previousWeekEnd = new Date(weekEnd);
    previousWeekEnd.setDate(weekEnd.getDate() - 7);

    const previousWeekBills = await billRepository.getBillsForDateRange(previousWeekStart, previousWeekEnd);
    const previousWeekRevenue = previousWeekBills.reduce((sum, bill) => sum + bill.totalAmount, 0);
    const previousWeekOrders = previousWeekBills.length;
    const previousWeekAOV = previousWeekOrders > 0 ? previousWeekRevenue / previousWeekOrders : 0;

    const revenueGrowth = previousWeekRevenue > 0 
      ? ((totalRevenue - previousWeekRevenue) / previousWeekRevenue) * 100 
      : 0;
    
    const orderGrowth = previousWeekOrders > 0 
      ? ((totalOrders - previousWeekOrders) / previousWeekOrders) * 100 
      : 0;
    
    const averageOrderValueGrowth = previousWeekAOV > 0 
      ? ((averageOrderValue - previousWeekAOV) / previousWeekAOV) * 100 
      : 0;

    // Get popular items for the week
    const popularItems = await this.getPopularItemsForDateRange(weekStart, weekEnd);

    return {
      weekStart,
      weekEnd,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalOrders,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      dailyBreakdown,
      trendAnalysis: {
        revenueGrowth: Math.round(revenueGrowth * 100) / 100,
        orderGrowth: Math.round(orderGrowth * 100) / 100,
        averageOrderValueGrowth: Math.round(averageOrderValueGrowth * 100) / 100
      },
      popularItems: popularItems.slice(0, 15) // Top 15 items for weekly report
    };
  }

  /**
   * Get item popularity ranking
   * Requirement 7.3: Item popularity ranking system
   */
  async getItemPopularityRanking(
    dateRange?: DateRange,
    limit: number = 50
  ): Promise<PopularItem[]> {
    const startDate = dateRange?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default: last 30 days
    const endDate = dateRange?.endDate || new Date();

    return this.getPopularItemsForDateRange(startDate, endDate, limit);
  }

  /**
   * Generate revenue summary
   * Requirement 7.4: Revenue summary calculation system
   */
  async generateRevenueSummary(
    dateRange: DateRange,
    groupBy: 'day' | 'week' | 'month' = 'day'
  ): Promise<RevenueSummary> {
    const bills = await billRepository.getBillsForDateRange(dateRange.startDate, dateRange.endDate);
    
    // Calculate basic metrics
    const totalRevenue = bills.reduce((sum, bill) => sum + bill.totalAmount, 0);
    const totalOrders = bills.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Revenue by payment method
    const revenueByPaymentMethod: Record<PaymentMethod, number> = {
      [PaymentMethod.CASH]: 0,
      [PaymentMethod.CARD]: 0,
      [PaymentMethod.DIGITAL]: 0
    };

    bills.forEach(bill => {
      if (bill.paymentMethod) {
        revenueByPaymentMethod[bill.paymentMethod] += bill.totalAmount;
      }
    });

    // Revenue by category
    const revenueByCategory = await this.getRevenueByCategoryForDateRange(
      dateRange.startDate, 
      dateRange.endDate
    );

    // Revenue by time period
    const revenueByTimePeriod = await this.getRevenueByTimePeriod(
      dateRange.startDate,
      dateRange.endDate,
      groupBy
    );

    return {
      dateRange,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalOrders,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      revenueByPaymentMethod,
      revenueByCategory,
      revenueByTimePeriod
    };
  }

  /**
   * Export report data in various formats
   * Requirement 7.5: Report export functionality in standard formats
   */
  async exportReport(
    reportType: 'daily' | 'weekly' | 'revenue' | 'popularity',
    data: any,
    options: ReportExportOptions
  ): Promise<string | Buffer> {
    switch (options.format) {
      case 'json':
        return JSON.stringify(data, null, 2);
      
      case 'csv':
        return this.convertToCSV(reportType, data);
      
      case 'pdf':
        // This would require a PDF generation library
        // For now, return a placeholder
        throw new Error('PDF export not yet implemented');
      
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  /**
   * Collect performance metrics
   * Requirement 8.5: Performance metrics collection
   */
  async collectPerformanceMetrics(): Promise<PerformanceMetrics> {
    const now = new Date();
    
    // Calculate average order preparation time (last 24 hours)
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const recentOrders = await orderRepository.findOrders({
      dateFrom: yesterday,
      status: OrderStatus.SERVED
    }, { limit: 1000 });

    let totalPreparationTime = 0;
    let preparationTimeCount = 0;

    recentOrders.data.forEach(order => {
      // Estimate preparation time as time from creation to served
      const preparationTime = order.updatedAt.getTime() - order.createdAt.getTime();
      totalPreparationTime += preparationTime;
      preparationTimeCount++;
    });

    const averageOrderPreparationTime = preparationTimeCount > 0 
      ? totalPreparationTime / preparationTimeCount / (1000 * 60) // Convert to minutes
      : 0;

    // Get database metrics
    const dbMetrics = await this.getDatabaseMetrics();
    
    // Calculate order throughput
    const orderThroughput = await this.calculateOrderThroughput();

    return {
      timestamp: now,
      averageOrderPreparationTime: Math.round(averageOrderPreparationTime * 100) / 100,
      averageResponseTime: 0, // This would be collected from middleware
      activeUsers: 0, // This would be tracked by session management
      systemLoad: {
        cpu: 0, // This would require system monitoring
        memory: 0, // This would require system monitoring
        database: dbMetrics
      },
      orderThroughput
    };
  }

  // Private helper methods

  /**
   * Get popular items for a date range
   */
  private async getPopularItemsForDateRange(
    startDate: Date, 
    endDate: Date, 
    limit: number = 50
  ): Promise<PopularItem[]> {
    const query = `
      SELECT 
        oi.menu_item_id,
        mi.name as menu_item_name,
        mc.name as category_name,
        SUM(oi.quantity) as total_quantity_sold,
        SUM(oi.quantity * oi.unit_price) as total_revenue,
        COUNT(DISTINCT oi.order_id) as order_frequency,
        AVG(oi.quantity) as average_quantity_per_order
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN bills b ON b.order_id = o.id
      JOIN menu_items mi ON oi.menu_item_id = mi.id
      JOIN menu_categories mc ON mi.category_id = mc.id
      WHERE b.generated_at >= ? 
        AND b.generated_at <= ?
        AND b.payment_status = ?
      GROUP BY oi.menu_item_id, mi.name, mc.name
      ORDER BY total_quantity_sold DESC, total_revenue DESC
      LIMIT ?
    `;

    const results = await knex.raw(query, [
      startDate,
      endDate,
      PaymentStatus.PAID,
      limit
    ]);

    return results.rows.map((row: any) => ({
      menuItemId: row.menu_item_id,
      menuItemName: row.menu_item_name,
      categoryName: row.category_name,
      totalQuantitySold: parseInt(row.total_quantity_sold),
      totalRevenue: Math.round(parseFloat(row.total_revenue) * 100) / 100,
      orderFrequency: parseInt(row.order_frequency),
      averageQuantityPerOrder: Math.round(parseFloat(row.average_quantity_per_order) * 100) / 100
    }));
  }

  /**
   * Get orders by hour for a specific day
   */
  private async getOrdersByHour(startDate: Date, endDate: Date): Promise<Array<{ hour: number; count: number; revenue: number }>> {
    const query = `
      SELECT 
        EXTRACT(HOUR FROM b.generated_at) as hour,
        COUNT(*) as count,
        SUM(b.total_amount) as revenue
      FROM bills b
      WHERE b.generated_at >= ? 
        AND b.generated_at <= ?
        AND b.payment_status = ?
      GROUP BY EXTRACT(HOUR FROM b.generated_at)
      ORDER BY hour
    `;

    const results = await knex.raw(query, [
      startDate,
      endDate,
      PaymentStatus.PAID
    ]);

    // Fill in missing hours with zero values
    const hourlyData: Array<{ hour: number; count: number; revenue: number }> = [];
    for (let hour = 0; hour < 24; hour++) {
      const existingData = results.rows.find((row: any) => parseInt(row.hour) === hour);
      hourlyData.push({
        hour,
        count: existingData ? parseInt(existingData.count) : 0,
        revenue: existingData ? Math.round(parseFloat(existingData.revenue) * 100) / 100 : 0
      });
    }

    return hourlyData;
  }

  /**
   * Get revenue by category for date range
   */
  private async getRevenueByCategoryForDateRange(
    startDate: Date, 
    endDate: Date
  ): Promise<Array<{ categoryId: string; categoryName: string; revenue: number; percentage: number }>> {
    const query = `
      SELECT 
        mc.id as category_id,
        mc.name as category_name,
        SUM(oi.quantity * oi.unit_price) as revenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN bills b ON b.order_id = o.id
      JOIN menu_items mi ON oi.menu_item_id = mi.id
      JOIN menu_categories mc ON mi.category_id = mc.id
      WHERE b.generated_at >= ? 
        AND b.generated_at <= ?
        AND b.payment_status = ?
      GROUP BY mc.id, mc.name
      ORDER BY revenue DESC
    `;

    const results = await knex.raw(query, [
      startDate,
      endDate,
      PaymentStatus.PAID
    ]);

    const totalRevenue = results.rows.reduce((sum: number, row: any) => 
      sum + parseFloat(row.revenue), 0
    );

    return results.rows.map((row: any) => {
      const revenue = Math.round(parseFloat(row.revenue) * 100) / 100;
      const percentage = totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0;
      
      return {
        categoryId: row.category_id,
        categoryName: row.category_name,
        revenue,
        percentage: Math.round(percentage * 100) / 100
      };
    });
  }

  /**
   * Get revenue by time period
   */
  private async getRevenueByTimePeriod(
    startDate: Date,
    endDate: Date,
    groupBy: 'day' | 'week' | 'month'
  ): Promise<Array<{ period: string; revenue: number; orders: number }>> {
    let dateFormat: string;
    let groupByClause: string;

    switch (groupBy) {
      case 'day':
        dateFormat = 'YYYY-MM-DD';
        groupByClause = 'DATE(b.generated_at)';
        break;
      case 'week':
        dateFormat = 'YYYY-"W"WW';
        groupByClause = 'DATE_TRUNC(\'week\', b.generated_at)';
        break;
      case 'month':
        dateFormat = 'YYYY-MM';
        groupByClause = 'DATE_TRUNC(\'month\', b.generated_at)';
        break;
      default:
        throw new Error(`Unsupported groupBy value: ${groupBy}`);
    }

    const query = `
      SELECT 
        TO_CHAR(${groupByClause}, '${dateFormat}') as period,
        SUM(b.total_amount) as revenue,
        COUNT(*) as orders
      FROM bills b
      WHERE b.generated_at >= ? 
        AND b.generated_at <= ?
        AND b.payment_status = ?
      GROUP BY ${groupByClause}
      ORDER BY ${groupByClause}
    `;

    const results = await knex.raw(query, [
      startDate,
      endDate,
      PaymentStatus.PAID
    ]);

    return results.rows.map((row: any) => ({
      period: row.period,
      revenue: Math.round(parseFloat(row.revenue) * 100) / 100,
      orders: parseInt(row.orders)
    }));
  }

  /**
   * Convert report data to CSV format
   */
  private convertToCSV(reportType: string, data: any): string {
    switch (reportType) {
      case 'daily':
        return this.convertDailyReportToCSV(data as DailySalesReport);
      case 'weekly':
        return this.convertWeeklyReportToCSV(data as WeeklySalesReport);
      case 'popularity':
        return this.convertPopularityReportToCSV(data as PopularItem[]);
      case 'revenue':
        return this.convertRevenueSummaryToCSV(data as RevenueSummary);
      default:
        throw new Error(`Unsupported report type for CSV conversion: ${reportType}`);
    }
  }

  /**
   * Convert daily report to CSV
   */
  private convertDailyReportToCSV(report: DailySalesReport): string {
    const lines = [
      'Daily Sales Report',
      `Date,${report.date.toISOString().split('T')[0]}`,
      `Total Revenue,${report.totalRevenue}`,
      `Total Orders,${report.totalOrders}`,
      `Average Order Value,${report.averageOrderValue}`,
      '',
      'Popular Items',
      'Item Name,Category,Quantity Sold,Revenue,Order Frequency',
      ...report.popularItems.map(item => 
        `"${item.menuItemName}","${item.categoryName}",${item.totalQuantitySold},${item.totalRevenue},${item.orderFrequency}`
      ),
      '',
      'Revenue by Payment Method',
      'Payment Method,Revenue',
      ...Object.entries(report.revenueByPaymentMethod).map(([method, revenue]) => 
        `${method},${revenue}`
      )
    ];

    return lines.join('\n');
  }

  /**
   * Convert weekly report to CSV
   */
  private convertWeeklyReportToCSV(report: WeeklySalesReport): string {
    const lines = [
      'Weekly Sales Report',
      `Week Start,${report.weekStart.toISOString().split('T')[0]}`,
      `Week End,${report.weekEnd.toISOString().split('T')[0]}`,
      `Total Revenue,${report.totalRevenue}`,
      `Total Orders,${report.totalOrders}`,
      `Average Order Value,${report.averageOrderValue}`,
      '',
      'Trend Analysis',
      `Revenue Growth,${report.trendAnalysis.revenueGrowth}%`,
      `Order Growth,${report.trendAnalysis.orderGrowth}%`,
      `AOV Growth,${report.trendAnalysis.averageOrderValueGrowth}%`,
      '',
      'Daily Breakdown',
      'Date,Revenue,Orders',
      ...report.dailyBreakdown.map(day => 
        `${day.date.toISOString().split('T')[0]},${day.revenue},${day.orders}`
      )
    ];

    return lines.join('\n');
  }

  /**
   * Convert popularity report to CSV
   */
  private convertPopularityReportToCSV(items: PopularItem[]): string {
    const lines = [
      'Item Popularity Report',
      'Rank,Item Name,Category,Quantity Sold,Revenue,Order Frequency,Avg Qty per Order',
      ...items.map((item, index) => 
        `${index + 1},"${item.menuItemName}","${item.categoryName}",${item.totalQuantitySold},${item.totalRevenue},${item.orderFrequency},${item.averageQuantityPerOrder}`
      )
    ];

    return lines.join('\n');
  }

  /**
   * Convert revenue summary to CSV
   */
  private convertRevenueSummaryToCSV(summary: RevenueSummary): string {
    const lines = [
      'Revenue Summary Report',
      `Date Range,${summary.dateRange.startDate.toISOString().split('T')[0]} to ${summary.dateRange.endDate.toISOString().split('T')[0]}`,
      `Total Revenue,${summary.totalRevenue}`,
      `Total Orders,${summary.totalOrders}`,
      `Average Order Value,${summary.averageOrderValue}`,
      '',
      'Revenue by Category',
      'Category,Revenue,Percentage',
      ...summary.revenueByCategory.map(cat => 
        `"${cat.categoryName}",${cat.revenue},${cat.percentage}%`
      ),
      '',
      'Revenue by Payment Method',
      'Payment Method,Revenue',
      ...Object.entries(summary.revenueByPaymentMethod).map(([method, revenue]) => 
        `${method},${revenue}`
      )
    ];

    return lines.join('\n');
  }

  /**
   * Get database performance metrics
   */
  private async getDatabaseMetrics(): Promise<{ activeConnections: number; averageQueryTime: number }> {
    try {
      // This is a simplified version - in production you'd want more sophisticated monitoring
      const connectionInfo = await knex.raw('SELECT count(*) as active_connections FROM pg_stat_activity WHERE state = \'active\'');
      const activeConnections = parseInt(connectionInfo.rows[0]?.active_connections || '0');

      return {
        activeConnections,
        averageQueryTime: 0 // This would require query performance monitoring
      };
    } catch (error) {
      console.warn('Failed to get database metrics:', error);
      return {
        activeConnections: 0,
        averageQueryTime: 0
      };
    }
  }

  /**
   * Calculate order throughput metrics
   */
  private async calculateOrderThroughput(): Promise<{
    ordersPerHour: number;
    peakHourOrders: number;
    averageOrdersPerDay: number;
  }> {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Orders in last 24 hours
    const recentOrders = await orderRepository.findOrders({
      dateFrom: last24Hours
    }, { limit: 10000 });

    const ordersPerHour = recentOrders.data.length / 24;

    // Peak hour calculation (busiest hour in last 24 hours)
    const hourlyOrders = await this.getOrdersByHour(last24Hours, now);
    const peakHourOrders = Math.max(...hourlyOrders.map(h => h.count));

    // Average orders per day (last 7 days)
    const weekOrders = await orderRepository.findOrders({
      dateFrom: last7Days
    }, { limit: 10000 });

    const averageOrdersPerDay = weekOrders.data.length / 7;

    return {
      ordersPerHour: Math.round(ordersPerHour * 100) / 100,
      peakHourOrders,
      averageOrdersPerDay: Math.round(averageOrdersPerDay * 100) / 100
    };
  }
}

// Export singleton instance
export const reportingService = new ReportingService();