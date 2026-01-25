import { Request, Response } from 'express';
import { billingService } from '../services/billingService';
import { BillSearchFilters } from '../repositories/billRepository';
import { PaymentStatus, PaymentMethod } from '../models/enums';
import { PaginationParams, ApiResponse } from '../models';

export class BillingController {
  /**
   * Generate bill for an order
   * POST /api/bills/generate
   */
  async generateBill(req: Request, res: Response): Promise<void> {
    try {
      const { orderId, taxRate } = req.body;

      if (!orderId) {
        res.status(400).json({
          success: false,
          error: 'Order ID is required'
        } as ApiResponse<null>);
        return;
      }

      const bill = await billingService.generateBill(orderId, taxRate);

      res.status(201).json({
        success: true,
        data: bill
      } as ApiResponse<typeof bill>);
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate bill'
      } as ApiResponse<null>);
    }
  }

  /**
   * Get bill by ID
   * GET /api/bills/:id
   */
  async getBillById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Bill ID is required'
        } as ApiResponse<null>);
        return;
      }

      const bill = await billingService.getBillById(id);

      if (!bill) {
        res.status(404).json({
          success: false,
          error: 'Bill not found'
        } as ApiResponse<null>);
        return;
      }

      res.json({
        success: true,
        data: bill
      } as ApiResponse<typeof bill>);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get bill'
      } as ApiResponse<null>);
    }
  }

  /**
   * Get bill by order ID
   * GET /api/bills/order/:orderId
   */
  async getBillByOrderId(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;
      
      if (!orderId) {
        res.status(400).json({
          success: false,
          error: 'Order ID is required'
        } as ApiResponse<null>);
        return;
      }

      const bill = await billingService.getBillByOrderId(orderId);

      if (!bill) {
        res.status(404).json({
          success: false,
          error: 'Bill not found for this order'
        } as ApiResponse<null>);
        return;
      }

      res.json({
        success: true,
        data: bill
      } as ApiResponse<typeof bill>);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get bill'
      } as ApiResponse<null>);
    }
  }

  /**
   * Search bills with filters and pagination
   * GET /api/bills
   */
  async searchBills(req: Request, res: Response): Promise<void> {
    try {
      const {
        orderId,
        paymentStatus,
        paymentMethod,
        dateFrom,
        dateTo,
        minAmount,
        maxAmount,
        page,
        limit,
        sortBy,
        sortOrder
      } = req.query;

      const filters: BillSearchFilters = {};
      
      if (orderId) filters.orderId = orderId as string;
      if (paymentStatus) filters.paymentStatus = paymentStatus as PaymentStatus;
      if (paymentMethod) filters.paymentMethod = paymentMethod as PaymentMethod;
      if (dateFrom) filters.dateFrom = new Date(dateFrom as string);
      if (dateTo) filters.dateTo = new Date(dateTo as string);
      if (minAmount) filters.minAmount = parseFloat(minAmount as string);
      if (maxAmount) filters.maxAmount = parseFloat(maxAmount as string);

      const pagination: PaginationParams = {};
      if (page) pagination.page = parseInt(page as string);
      if (limit) pagination.limit = parseInt(limit as string);
      if (sortBy) pagination.sortBy = sortBy as string;
      if (sortOrder) pagination.sortOrder = sortOrder as 'asc' | 'desc';

      // Use the new method that includes order and table details
      const result = await billingService.searchBillsWithDetails(filters, pagination);

      res.json({
        success: true,
        data: result
      } as ApiResponse<typeof result>);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search bills'
      } as ApiResponse<null>);
    }
  }

  /**
   * Update bill details
   * PUT /api/bills/:id
   */
  async updateBill(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Bill ID is required'
        } as ApiResponse<null>);
        return;
      }

      const updateData = req.body;
      const bill = await billingService.updateBill(id, updateData);

      res.json({
        success: true,
        data: bill
      } as ApiResponse<typeof bill>);
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update bill'
      } as ApiResponse<null>);
    }
  }

  /**
   * Process payment for a bill
   * POST /api/bills/:id/payment
   */
  async processPayment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Bill ID is required'
        } as ApiResponse<null>);
        return;
      }

      const { paymentMethod } = req.body;

      if (!paymentMethod) {
        res.status(400).json({
          success: false,
          error: 'Payment method is required'
        } as ApiResponse<null>);
        return;
      }

      const bill = await billingService.processPayment(id, { paymentMethod });

      res.json({
        success: true,
        data: bill
      } as ApiResponse<typeof bill>);
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process payment'
      } as ApiResponse<null>);
    }
  }

  /**
   * Cancel a bill
   * POST /api/bills/:id/cancel
   */
  async cancelBill(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Bill ID is required'
        } as ApiResponse<null>);
        return;
      }

      const bill = await billingService.cancelBill(id);

      res.json({
        success: true,
        data: bill
      } as ApiResponse<typeof bill>);
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cancel bill'
      } as ApiResponse<null>);
    }
  }

  /**
   * Reopen a cancelled bill
   * POST /api/bills/:id/reopen
   */
  async reopenBill(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Bill ID is required'
        } as ApiResponse<null>);
        return;
      }

      const bill = await billingService.reopenBill(id);

      res.json({
        success: true,
        data: bill
      } as ApiResponse<typeof bill>);
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reopen bill'
      } as ApiResponse<null>);
    }
  }

  /**
   * Calculate bill totals
   * POST /api/bills/calculate
   */
  async calculateBillTotals(req: Request, res: Response): Promise<void> {
    try {
      const { subtotal, taxRate } = req.body;

      if (subtotal === undefined || taxRate === undefined) {
        res.status(400).json({
          success: false,
          error: 'Subtotal and tax rate are required'
        } as ApiResponse<null>);
        return;
      }

      const calculation = billingService.calculateBillTotals(subtotal, taxRate);

      res.json({
        success: true,
        data: calculation
      } as ApiResponse<typeof calculation>);
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to calculate bill totals'
      } as ApiResponse<null>);
    }
  }

  /**
   * Get revenue summary for date range
   * GET /api/bills/revenue/summary
   */
  async getRevenueSummary(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        res.status(400).json({
          success: false,
          error: 'Start date and end date are required'
        } as ApiResponse<null>);
        return;
      }

      const summary = await billingService.getRevenueSummary(
        new Date(startDate as string),
        new Date(endDate as string)
      );

      res.json({
        success: true,
        data: summary
      } as ApiResponse<typeof summary>);
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get revenue summary'
      } as ApiResponse<null>);
    }
  }

  /**
   * Get pending bills
   * GET /api/bills/pending
   */
  async getPendingBills(req: Request, res: Response): Promise<void> {
    try {
      const bills = await billingService.getPendingBills();

      res.json({
        success: true,
        data: bills
      } as ApiResponse<typeof bills>);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get pending bills'
      } as ApiResponse<null>);
    }
  }

  /**
   * Get today's paid bills
   * GET /api/bills/today
   */
  async getTodaysPaidBills(req: Request, res: Response): Promise<void> {
    try {
      const bills = await billingService.getTodaysPaidBills();

      res.json({
        success: true,
        data: bills
      } as ApiResponse<typeof bills>);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get today\'s bills'
      } as ApiResponse<null>);
    }
  }

  /**
   * Check if bill exists for order
   * GET /api/bills/exists/:orderId
   */
  async checkBillExists(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;
      
      if (!orderId) {
        res.status(400).json({
          success: false,
          error: 'Order ID is required'
        } as ApiResponse<null>);
        return;
      }

      const exists = await billingService.billExistsForOrder(orderId);

      res.json({
        success: true,
        data: { exists }
      } as ApiResponse<{ exists: boolean }>);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to check bill existence'
      } as ApiResponse<null>);
    }
  }

  /**
   * Get billing configuration
   * GET /api/bills/config
   */
  async getBillingConfig(req: Request, res: Response): Promise<void> {
    try {
      const config = billingService.getConfig();

      res.json({
        success: true,
        data: config
      } as ApiResponse<typeof config>);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get billing config'
      } as ApiResponse<null>);
    }
  }

  /**
   * Update billing configuration
   * PUT /api/bills/config
   */
  async updateBillingConfig(req: Request, res: Response): Promise<void> {
    try {
      const configUpdate = req.body;
      billingService.setConfig(configUpdate);
      const updatedConfig = billingService.getConfig();

      res.json({
        success: true,
        data: updatedConfig
      } as ApiResponse<typeof updatedConfig>);
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update billing config'
      } as ApiResponse<null>);
    }
  }

  /**
   * Generate PDF invoice for a bill
   * GET /api/bills/:id/pdf
   */
  async generatePDFInvoice(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Bill ID is required'
        } as ApiResponse<null>);
        return;
      }

      const { customerInfo, options } = req.query;
      
      let parsedCustomerInfo;
      let parsedOptions;

      try {
        if (customerInfo) {
          parsedCustomerInfo = JSON.parse(customerInfo as string);
        }
        if (options) {
          parsedOptions = JSON.parse(options as string);
        }
      } catch (parseError) {
        res.status(400).json({
          success: false,
          error: 'Invalid JSON in customerInfo or options parameters'
        } as ApiResponse<null>);
        return;
      }

      const pdfBuffer = await billingService.generatePDFInvoice(id, parsedCustomerInfo, parsedOptions);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="invoice-${id.substring(0, 8)}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate PDF invoice'
      } as ApiResponse<null>);
    }
  }

  /**
   * Generate PDF invoice by order ID
   * GET /api/bills/order/:orderId/pdf
   */
  async generatePDFInvoiceByOrderId(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;
      
      if (!orderId) {
        res.status(400).json({
          success: false,
          error: 'Order ID is required'
        } as ApiResponse<null>);
        return;
      }

      const { customerInfo, options } = req.query;
      
      let parsedCustomerInfo;
      let parsedOptions;

      try {
        if (customerInfo) {
          parsedCustomerInfo = JSON.parse(customerInfo as string);
        }
        if (options) {
          parsedOptions = JSON.parse(options as string);
        }
      } catch (parseError) {
        res.status(400).json({
          success: false,
          error: 'Invalid JSON in customerInfo or options parameters'
        } as ApiResponse<null>);
        return;
      }

      const pdfBuffer = await billingService.generatePDFInvoiceByOrderId(orderId, parsedCustomerInfo, parsedOptions);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="invoice-order-${orderId.substring(0, 8)}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate PDF invoice'
      } as ApiResponse<null>);
    }
  }

  /**
   * Get restaurant information
   * GET /api/bills/restaurant-info
   */
  async getRestaurantInfo(req: Request, res: Response): Promise<void> {
    try {
      const restaurantInfo = billingService.getRestaurantInfo();

      res.json({
        success: true,
        data: restaurantInfo
      } as ApiResponse<typeof restaurantInfo>);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get restaurant info'
      } as ApiResponse<null>);
    }
  }

  /**
   * Update restaurant information
   * PUT /api/bills/restaurant-info
   */
  async updateRestaurantInfo(req: Request, res: Response): Promise<void> {
    try {
      const restaurantInfoUpdate = req.body;
      billingService.setRestaurantInfo(restaurantInfoUpdate);
      const updatedInfo = billingService.getRestaurantInfo();

      res.json({
        success: true,
        data: updatedInfo
      } as ApiResponse<typeof updatedInfo>);
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update restaurant info'
      } as ApiResponse<null>);
    }
  }

  /**
   * Get PDF generation options
   * GET /api/bills/pdf-options
   */
  async getPDFOptions(req: Request, res: Response): Promise<void> {
    try {
      const options = billingService.getPDFOptions();

      res.json({
        success: true,
        data: options
      } as ApiResponse<typeof options>);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get PDF options'
      } as ApiResponse<null>);
    }
  }

  /**
   * Update PDF generation options
   * PUT /api/bills/pdf-options
   */
  async updatePDFOptions(req: Request, res: Response): Promise<void> {
    try {
      const optionsUpdate = req.body;
      billingService.setPDFOptions(optionsUpdate);
      const updatedOptions = billingService.getPDFOptions();

      res.json({
        success: true,
        data: updatedOptions
      } as ApiResponse<typeof updatedOptions>);
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update PDF options'
      } as ApiResponse<null>);
    }
  }
}

// Export singleton instance
export const billingController = new BillingController();