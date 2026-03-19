import { Request, Response } from 'express';
import { 
  reportingService,
  ReportExportOptions,
  DailySalesReport,
  WeeklySalesReport,
  RevenueSummary,
  PopularItem,
  PerformanceMetrics
} from '../services/reportingService';
import { ApiResponse, DateRange, Order, OrderItem } from '../models';
import { orderRepository } from '../repositories/orderRepository';

export class ReportingController {

  /**
   * Generate daily sales report
   * GET /api/reports/daily?date=YYYY-MM-DD
   */
  async getDailySalesReport(req: Request, res: Response): Promise<void> {
    try {
      const dateParam = req.query.date as string;
      const date = dateParam ? new Date(dateParam) : new Date();

      // Validate date
      if (isNaN(date.getTime())) {
        res.status(400).json({
          success: false,
          error: 'Invalid date format. Use YYYY-MM-DD format.'
        } as ApiResponse<null>);
        return;
      }

      const report = await reportingService.generateDailySalesReport(date);

      res.json({
        success: true,
        data: report
      } as ApiResponse<DailySalesReport>);

    } catch (error) {
      console.error('Error generating daily sales report:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate daily sales report'
      } as ApiResponse<null>);
    }
  }

  /**
   * Generate weekly sales report
   * GET /api/reports/weekly?weekStart=YYYY-MM-DD
   */
  async getWeeklySalesReport(req: Request, res: Response): Promise<void> {
    try {
      const weekStartParam = req.query.weekStart as string;
      let weekStart: Date;

      if (weekStartParam) {
        weekStart = new Date(weekStartParam);
        if (isNaN(weekStart.getTime())) {
          res.status(400).json({
            success: false,
            error: 'Invalid weekStart date format. Use YYYY-MM-DD format.'
          } as ApiResponse<null>);
          return;
        }
      } else {
        // Default to start of current week (Monday)
        const now = new Date();
        const dayOfWeek = now.getDay();
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 0, Monday = 1
        weekStart = new Date(now);
        weekStart.setDate(now.getDate() - daysToMonday);
        weekStart.setHours(0, 0, 0, 0);
      }

      const report = await reportingService.generateWeeklySalesReport(weekStart);

      res.json({
        success: true,
        data: report
      } as ApiResponse<WeeklySalesReport>);

    } catch (error) {
      console.error('Error generating weekly sales report:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate weekly sales report'
      } as ApiResponse<null>);
    }
  }

  /**
   * Get item popularity ranking
   * GET /api/reports/popularity?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&limit=50
   */
  async getItemPopularityRanking(req: Request, res: Response): Promise<void> {
    try {
      const { startDate: startDateParam, endDate: endDateParam, limit: limitParam } = req.query;
      
      let dateRange: DateRange | undefined;
      
      if (startDateParam && endDateParam) {
        const startDate = new Date(startDateParam as string);
        const endDate = new Date(endDateParam as string);
        
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          res.status(400).json({
            success: false,
            error: 'Invalid date format. Use YYYY-MM-DD format.'
          } as ApiResponse<null>);
          return;
        }

        if (startDate > endDate) {
          res.status(400).json({
            success: false,
            error: 'Start date must be before or equal to end date.'
          } as ApiResponse<null>);
          return;
        }

        dateRange = { startDate, endDate };
      }

      const limit = limitParam ? parseInt(limitParam as string) : 50;
      if (isNaN(limit) || limit < 1 || limit > 1000) {
        res.status(400).json({
          success: false,
          error: 'Limit must be a number between 1 and 1000.'
        } as ApiResponse<null>);
        return;
      }

      const popularItems = await reportingService.getItemPopularityRanking(dateRange, limit);

      res.json({
        success: true,
        data: popularItems
      } as ApiResponse<PopularItem[]>);

    } catch (error) {
      console.error('Error getting item popularity ranking:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get item popularity ranking'
      } as ApiResponse<null>);
    }
  }

  /**
   * Generate revenue summary
   * GET /api/reports/revenue?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&groupBy=day|week|month
   */
  async getRevenueSummary(req: Request, res: Response): Promise<void> {
    try {
      const { startDate: startDateParam, endDate: endDateParam, groupBy } = req.query;
      
      if (!startDateParam || !endDateParam) {
        res.status(400).json({
          success: false,
          error: 'Both startDate and endDate are required.'
        } as ApiResponse<null>);
        return;
      }

      const startDate = new Date(startDateParam as string);
      const endDate = new Date(endDateParam as string);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        res.status(400).json({
          success: false,
          error: 'Invalid date format. Use YYYY-MM-DD format.'
        } as ApiResponse<null>);
        return;
      }

      if (startDate > endDate) {
        res.status(400).json({
          success: false,
          error: 'Start date must be before or equal to end date.'
        } as ApiResponse<null>);
        return;
      }

      const groupByParam = (groupBy as string) || 'day';
      if (!['day', 'week', 'month'].includes(groupByParam)) {
        res.status(400).json({
          success: false,
          error: 'groupBy must be one of: day, week, month.'
        } as ApiResponse<null>);
        return;
      }

      const dateRange: DateRange = { startDate, endDate };
      const summary = await reportingService.generateRevenueSummary(
        dateRange, 
        groupByParam as 'day' | 'week' | 'month'
      );

      res.json({
        success: true,
        data: summary
      } as ApiResponse<RevenueSummary>);

    } catch (error) {
      console.error('Error generating revenue summary:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate revenue summary'
      } as ApiResponse<null>);
    }
  }

  /**
   * Export report data
   * POST /api/reports/export
   */
  async exportReport(req: Request, res: Response): Promise<void> {
    try {
      const { reportType, reportData, options } = req.body;

      if (!reportType || !reportData || !options) {
        res.status(400).json({
          success: false,
          error: 'reportType, reportData, and options are required.'
        } as ApiResponse<null>);
        return;
      }

      if (!['daily', 'weekly', 'revenue', 'popularity'].includes(reportType)) {
        res.status(400).json({
          success: false,
          error: 'reportType must be one of: daily, weekly, revenue, popularity.'
        } as ApiResponse<null>);
        return;
      }

      const exportOptions: ReportExportOptions = {
        format: options.format || 'json',
        includeCharts: options.includeCharts || false,
        dateRange: options.dateRange
      };

      if (!['json', 'csv', 'pdf'].includes(exportOptions.format)) {
        res.status(400).json({
          success: false,
          error: 'Export format must be one of: json, csv, pdf.'
        } as ApiResponse<null>);
        return;
      }

      const exportedData = await reportingService.exportReport(
        reportType,
        reportData,
        exportOptions
      );

      // Set appropriate content type and headers
      switch (exportOptions.format) {
        case 'json':
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Content-Disposition', `attachment; filename="${reportType}-report.json"`);
          break;
        case 'csv':
          res.setHeader('Content-Type', 'text/csv');
          res.setHeader('Content-Disposition', `attachment; filename="${reportType}-report.csv"`);
          break;
        case 'pdf':
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename="${reportType}-report.pdf"`);
          break;
      }

      res.send(exportedData);

    } catch (error) {
      console.error('Error exporting report:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to export report'
      } as ApiResponse<null>);
    }
  }

  /**
   * Get performance metrics
   * GET /api/reports/performance
   */
  async getPerformanceMetrics(req: Request, res: Response): Promise<void> {
    try {
      const metrics = await reportingService.collectPerformanceMetrics();

      res.json({
        success: true,
        data: metrics
      } as ApiResponse<PerformanceMetrics>);

    } catch (error) {
      console.error('Error collecting performance metrics:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to collect performance metrics'
      } as ApiResponse<null>);
    }
  }

  /**
   * Get dashboard summary (combines multiple reports for dashboard view)
   * GET /api/reports/dashboard
   */
  async getDashboardSummary(req: Request, res: Response): Promise<void> {
    try {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);

      const weekStart = new Date(today);
      const dayOfWeek = today.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      weekStart.setDate(today.getDate() - daysToMonday);
      weekStart.setHours(0, 0, 0, 0);

      const last30Days = new Date(today);
      last30Days.setDate(today.getDate() - 30);

      // Generate multiple reports concurrently
      const [
        todayReport,
        yesterdayReport,
        weeklyReport,
        popularItems,
        performanceMetrics
      ] = await Promise.all([
        reportingService.generateDailySalesReport(today),
        reportingService.generateDailySalesReport(yesterday),
        reportingService.generateWeeklySalesReport(weekStart),
        reportingService.getItemPopularityRanking({ 
          startDate: last30Days, 
          endDate: today 
        }, 10),
        reportingService.collectPerformanceMetrics()
      ]);

      const dashboardData = {
        today: {
          revenue: todayReport.totalRevenue,
          orders: todayReport.totalOrders,
          averageOrderValue: todayReport.averageOrderValue
        },
        yesterday: {
          revenue: yesterdayReport.totalRevenue,
          orders: yesterdayReport.totalOrders,
          averageOrderValue: yesterdayReport.averageOrderValue
        },
        weeklyTrends: {
          totalRevenue: weeklyReport.totalRevenue,
          totalOrders: weeklyReport.totalOrders,
          revenueGrowth: weeklyReport.trendAnalysis.revenueGrowth,
          orderGrowth: weeklyReport.trendAnalysis.orderGrowth,
          dailyBreakdown: weeklyReport.dailyBreakdown
        },
        topItems: popularItems.slice(0, 5),
        performance: {
          averagePreparationTime: performanceMetrics.averageOrderPreparationTime,
          orderThroughput: performanceMetrics.orderThroughput
        }
      };

      res.json({
        success: true,
        data: dashboardData
      } as ApiResponse<typeof dashboardData>);

    } catch (error) {
      console.error('Error generating dashboard summary:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate dashboard summary'
      } as ApiResponse<null>);
    }
  }

  /**
   * Get recent orders for dashboard display
   * GET /api/reports/recent-orders
   */
  async getRecentOrders(req: Request, res: Response): Promise<void> {
    try {
      const limitParam = req.query.limit as string;
      const limit = limitParam ? parseInt(limitParam) : 10;

      if (isNaN(limit) || limit < 1 || limit > 100) {
        res.status(400).json({
          success: false,
          error: 'Limit must be a number between 1 and 100.'
        } as ApiResponse<null>);
        return;
      }

      // Get recent orders with pagination
      const result = await orderRepository.findOrdersWithDetails({}, {
        limit,
        page: 1,
        sortBy: 'created_at',
        sortOrder: 'desc'
      });

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      } as any);

    } catch (error) {
      console.error('Error fetching recent orders:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch recent orders'
      } as ApiResponse<null>);
    }
  }
}

// Export singleton instance
export const reportingController = new ReportingController();