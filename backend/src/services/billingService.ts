import { 
  Bill, 
  CreateBillRequest, 
  UpdateBillRequest,
  ProcessPaymentRequest,
  BillCalculation,
  calculateBill,
  canModifyBill,
  canProcessPayment,
  isValidPaymentStatusTransition,
  validateCreateBillRequest,
  validateUpdateBillRequest,
  validateProcessPaymentRequest
} from '../models/Bill';
import { Order } from '../models/Order';
import { PaymentStatus, PaymentMethod, OrderStatus } from '../models/enums';
import { billRepository, BillSearchFilters } from '../repositories/billRepository';
import { orderRepository } from '../repositories/orderRepository';
import { PaginationParams, PaginatedResponse } from '../models';
import { pdfService, InvoiceData, RestaurantInfo, CustomerInfo, PDFGenerationOptions } from './pdfService';

export interface BillingConfig {
  defaultTaxRate: number;
  allowBillModification: boolean;
  requireOrderCompletion: boolean;
}

export class BillingService {
  private config: BillingConfig = {
    defaultTaxRate: 0.05, // 5% GST for restaurant services
    allowBillModification: true,
    requireOrderCompletion: true
  };

  /**
   * Set billing configuration
   */
  setConfig(config: Partial<BillingConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get billing configuration
   */
  getConfig(): BillingConfig {
    return { ...this.config };
  }

  /**
   * Generate bill for an order
   */
  async generateBill(orderId: string, taxRate?: number): Promise<Bill> {
    // Check if bill already exists for this order
    const existingBill = await billRepository.findBillByOrderId(orderId);
    if (existingBill) {
      throw new Error('Bill already exists for this order');
    }

    // Get the order
    const order = await orderRepository.findOrderById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    // Check if order is in correct status for billing
    if (this.config.requireOrderCompletion && order.status !== OrderStatus.SERVED) {
      throw new Error('Order must be served before generating bill');
    }

    // Use provided tax rate or default
    const effectiveTaxRate = taxRate !== undefined ? taxRate : this.config.defaultTaxRate;

    // Validate tax rate
    if (effectiveTaxRate < 0 || effectiveTaxRate > 1) {
      throw new Error('Tax rate must be between 0 and 1');
    }

    // Create bill request
    const billRequest: CreateBillRequest = {
      orderId: order.id,
      subtotal: order.totalAmount,
      taxRate: effectiveTaxRate
    };

    // Validate request
    const validationErrors = validateCreateBillRequest(billRequest);
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }

    // Create the bill
    return await billRepository.createBill(billRequest);
  }

  /**
   * Calculate bill totals
   */
  calculateBillTotals(subtotal: number, taxRate: number): BillCalculation {
    if (subtotal < 0) {
      throw new Error('Subtotal cannot be negative');
    }

    if (taxRate < 0 || taxRate > 1) {
      throw new Error('Tax rate must be between 0 and 1');
    }

    return calculateBill(subtotal, taxRate);
  }

  /**
   * Get bill by ID
   */
  async getBillById(id: string): Promise<Bill | null> {
    return await billRepository.findBillById(id);
  }

  /**
   * Get bill by order ID
   */
  async getBillByOrderId(orderId: string): Promise<Bill | null> {
    return await billRepository.findBillByOrderId(orderId);
  }

  /**
   * Search bills with details (including order and table info) with filters and pagination
   */
  async searchBillsWithDetails(
    filters: BillSearchFilters = {},
    pagination: PaginationParams = {}
  ): Promise<PaginatedResponse<any>> {
    return await billRepository.findBillsWithDetails(filters, pagination);
  }

  /**
   * Get bills by payment status
   */
  async getBillsByPaymentStatus(status: PaymentStatus): Promise<Bill[]> {
    return await billRepository.findBillsByPaymentStatus(status);
  }

  /**
   * Update bill details (only allowed for pending bills)
   */
  async updateBill(id: string, updateData: UpdateBillRequest): Promise<Bill> {
    // Get existing bill
    const existingBill = await billRepository.findBillById(id);
    if (!existingBill) {
      throw new Error('Bill not found');
    }

    // Check if bill can be modified
    if (!this.config.allowBillModification || !canModifyBill(existingBill)) {
      throw new Error('Bill cannot be modified - payment has been processed or bill is cancelled');
    }

    // Validate update request
    const validationErrors = validateUpdateBillRequest(updateData);
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }

    // If updating subtotal or tax amount, recalculate total
    let finalUpdateData = { ...updateData };
    
    if (updateData.subtotal !== undefined || updateData.taxAmount !== undefined) {
      const newSubtotal = updateData.subtotal !== undefined ? updateData.subtotal : existingBill.subtotal;
      const newTaxAmount = updateData.taxAmount !== undefined ? updateData.taxAmount : existingBill.taxAmount;
      
      finalUpdateData.totalAmount = Math.round((newSubtotal + newTaxAmount) * 100) / 100;
    }

    const updatedBill = await billRepository.updateBill(id, finalUpdateData);
    if (!updatedBill) {
      throw new Error('Failed to update bill');
    }

    return updatedBill;
  }

  /**
   * Process payment for a bill
   */
  async processPayment(id: string, paymentData: ProcessPaymentRequest): Promise<Bill> {
    // Get existing bill
    const existingBill = await billRepository.findBillById(id);
    if (!existingBill) {
      throw new Error('Bill not found');
    }

    // Check if payment can be processed
    if (!canProcessPayment(existingBill)) {
      throw new Error('Payment cannot be processed - bill is not in pending status or total amount is zero');
    }

    // Validate payment request
    const validationErrors = validateProcessPaymentRequest(paymentData);
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }

    // Validate status transition
    if (!isValidPaymentStatusTransition(existingBill.paymentStatus, PaymentStatus.PAID)) {
      throw new Error('Invalid payment status transition');
    }

    // Process the payment
    const paidBill = await billRepository.processPayment(id, paymentData);
    if (!paidBill) {
      throw new Error('Failed to process payment');
    }

    return paidBill;
  }

  /**
   * Cancel a bill
   */
  async cancelBill(id: string): Promise<Bill> {
    // Get existing bill
    const existingBill = await billRepository.findBillById(id);
    if (!existingBill) {
      throw new Error('Bill not found');
    }

    // Validate status transition
    if (!isValidPaymentStatusTransition(existingBill.paymentStatus, PaymentStatus.CANCELLED)) {
      throw new Error('Bill cannot be cancelled - payment has already been processed');
    }

    const cancelledBill = await billRepository.cancelBill(id);
    if (!cancelledBill) {
      throw new Error('Failed to cancel bill');
    }

    return cancelledBill;
  }

  /**
   * Reopen a cancelled bill
   */
  async reopenBill(id: string): Promise<Bill> {
    // Get existing bill
    const existingBill = await billRepository.findBillById(id);
    if (!existingBill) {
      throw new Error('Bill not found');
    }

    // Validate status transition
    if (!isValidPaymentStatusTransition(existingBill.paymentStatus, PaymentStatus.PENDING)) {
      throw new Error('Only cancelled bills can be reopened');
    }

    const reopenedBill = await billRepository.reopenBill(id);
    if (!reopenedBill) {
      throw new Error('Failed to reopen bill');
    }

    return reopenedBill;
  }

  /**
   * Get revenue summary for date range
   */
  async getRevenueSummary(startDate: Date, endDate: Date): Promise<{
    totalRevenue: number;
    totalBills: number;
    averageBillAmount: number;
    revenueByPaymentMethod: Record<PaymentMethod, number>;
  }> {
    if (startDate > endDate) {
      throw new Error('Start date cannot be after end date');
    }

    return await billRepository.getRevenueSummary(startDate, endDate);
  }

  /**
   * Get bills for date range
   */
  async getBillsForDateRange(startDate: Date, endDate: Date): Promise<Bill[]> {
    if (startDate > endDate) {
      throw new Error('Start date cannot be after end date');
    }

    return await billRepository.getBillsForDateRange(startDate, endDate);
  }

  /**
   * Check if bill exists for order
   */
  async billExistsForOrder(orderId: string): Promise<boolean> {
    return await billRepository.billExistsForOrder(orderId);
  }

  /**
   * Get pending bills (for management dashboard)
   */
  async getPendingBills(): Promise<Bill[]> {
    return await billRepository.findBillsByPaymentStatus(PaymentStatus.PENDING);
  }

  /**
   * Get paid bills for today
   */
  async getTodaysPaidBills(): Promise<Bill[]> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    return await billRepository.getBillsForDateRange(startOfDay, endOfDay);
  }

  /**
   * Validate bill modification permissions
   */
  canModifyBill(bill: Bill): boolean {
    return this.config.allowBillModification && canModifyBill(bill);
  }

  /**
   * Validate payment processing permissions
   */
  canProcessPayment(bill: Bill): boolean {
    return canProcessPayment(bill);
  }

  /**
   * Generate PDF invoice for a bill
   */
  async generatePDFInvoice(
    billId: string,
    customerInfo?: CustomerInfo,
    options?: Partial<PDFGenerationOptions>
  ): Promise<Buffer> {
    // Get the bill
    const bill = await billRepository.findBillById(billId);
    if (!bill) {
      throw new Error('Bill not found');
    }

    // Get the associated order
    const order = await orderRepository.findOrderById(bill.orderId);
    if (!order) {
      throw new Error('Order not found for this bill');
    }

    // Prepare invoice data
    const invoiceData: InvoiceData = {
      bill,
      order,
      restaurantInfo: pdfService.getDefaultRestaurantInfo(),
      customerInfo
    };

    // Generate PDF
    return await pdfService.generateInvoice(invoiceData, options);
  }

  /**
   * Generate PDF invoice by order ID
   */
  async generatePDFInvoiceByOrderId(
    orderId: string,
    customerInfo?: CustomerInfo,
    options?: Partial<PDFGenerationOptions>
  ): Promise<Buffer> {
    // Get the bill for this order
    const bill = await billRepository.findBillByOrderId(orderId);
    if (!bill) {
      throw new Error('No bill found for this order');
    }

    return await this.generatePDFInvoice(bill.id, customerInfo, options);
  }

  /**
   * Set restaurant information for PDF generation
   */
  setRestaurantInfo(restaurantInfo: Partial<RestaurantInfo>): void {
    pdfService.setDefaultRestaurantInfo(restaurantInfo);
  }

  /**
   * Get restaurant information
   */
  getRestaurantInfo(): RestaurantInfo {
    return pdfService.getDefaultRestaurantInfo();
  }

  /**
   * Set default PDF options
   */
  setPDFOptions(options: Partial<PDFGenerationOptions>): void {
    pdfService.setDefaultOptions(options);
  }

  /**
   * Get default PDF options
   */
  getPDFOptions(): PDFGenerationOptions {
    return pdfService.getDefaultOptions();
  }
}

// Export singleton instance
export const billingService = new BillingService();