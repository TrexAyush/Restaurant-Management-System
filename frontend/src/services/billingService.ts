import { apiClient } from '../config/api';
import { 
  Bill, 
  BillWithDetails, 
  CreateBillRequest, 
  ProcessPaymentRequest,
  BillingConfig,
  RestaurantInfo,
  PDFOptions,
  RevenueData,
  BillCalculation
} from '../types/billing';
import { PaginationParams, PaginatedResponse } from '../types/menu';

export class BillingService {
  // ==================== Bill Retrieval ====================
  
  static async getAllBills(pagination?: PaginationParams): Promise<PaginatedResponse<BillWithDetails>> {
    const params = new URLSearchParams();
    
    if (pagination?.page) params.append('page', pagination.page.toString());
    if (pagination?.limit) params.append('limit', pagination.limit.toString());
    if (pagination?.sortBy) params.append('sortBy', pagination.sortBy);
    if (pagination?.sortOrder) params.append('sortOrder', pagination.sortOrder);

    const response = await apiClient.get<{ success: boolean; data: { data: BillWithDetails[]; pagination: any } }>(
      `/bills?${params.toString()}`
    );

    return {
      data: response.data.data?.data || [],
      pagination: response.data.data?.pagination || {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
      }
    };
  }

  static async getBillById(id: string): Promise<BillWithDetails> {
    const response = await apiClient.get<{ success: boolean; data: BillWithDetails }>(`/bills/${id}`);
    if (!response.data.data) {
      throw new Error('Bill not found');
    }
    return response.data.data;
  }

  static async getBillByOrderId(orderId: string): Promise<BillWithDetails> {
    const response = await apiClient.get<{ success: boolean; data: BillWithDetails }>(
      `/bills/order/${orderId}`
    );
    if (!response.data.data) {
      throw new Error('Bill not found for this order');
    }
    return response.data.data;
  }

  static async checkBillExists(orderId: string): Promise<boolean> {
    try {
      const response = await apiClient.get<{ success: boolean; data: { exists: boolean } }>(
        `/bills/exists/${orderId}`
      );
      return response.data.data?.exists || false;
    } catch (error) {
      return false;
    }
  }

  static async getPendingBills(): Promise<BillWithDetails[]> {
    const response = await apiClient.get<{ success: boolean; data: BillWithDetails[] }>(
      '/bills/'
    );
    return response.data.data || [];
  }

  static async getTodaysPaidBills(): Promise<BillWithDetails[]> {
    const response = await apiClient.get<{ success: boolean; data: BillWithDetails[] }>(
      '/bills/today'
    );
    return response.data.data || [];
  }

  // ==================== Bill Operations ====================

  static async generateBill(orderId: string, taxRate?: number): Promise<Bill> {
    const response = await apiClient.post<{ success: boolean; data: Bill }>(
      '/bills/generate',
      { orderId, taxRate }
    );
    if (!response.data.data) {
      throw new Error('Failed to generate bill');
    }
    return response.data.data;
  }

  static async calculateBillTotals(orderId: string, taxRate?: number): Promise<BillCalculation> {
    const response = await apiClient.post<{ success: boolean; data: BillCalculation }>(
      '/bills/calculate',
      { orderId, taxRate }
    );
    if (!response.data.data) {
      throw new Error('Failed to calculate bill totals');
    }
    return response.data.data;
  }

  static async updateBill(billId: string, updates: Partial<Bill>): Promise<Bill> {
    const response = await apiClient.put<{ success: boolean; data: Bill }>(
      `/bills/${billId}`,
      updates
    );
    if (!response.data.data) {
      throw new Error('Failed to update bill');
    }
    return response.data.data;
  }

  // ==================== Payment Processing ====================

  static async processPayment(billId: string, paymentData: ProcessPaymentRequest): Promise<Bill> {
    const response = await apiClient.post<{ success: boolean; data: Bill }>(
      `/bills/${billId}/payment`,
      paymentData
    );
    if (!response.data.data) {
      throw new Error('Failed to process payment');
    }
    return response.data.data;
  }

  static async cancelBill(billId: string, reason?: string): Promise<Bill> {
    const response = await apiClient.post<{ success: boolean; data: Bill }>(
      `/bills/${billId}/cancel`,
      { reason }
    );
    if (!response.data.data) {
      throw new Error('Failed to cancel bill');
    }
    return response.data.data;
  }

  static async reopenBill(billId: string): Promise<Bill> {
    const response = await apiClient.post<{ success: boolean; data: Bill }>(
      `/bills/${billId}/reopen`,
      {}
    );
    if (!response.data.data) {
      throw new Error('Failed to reopen bill');
    }
    return response.data.data;
  }

  // ==================== PDF Generation ====================

  static async generatePDF(billId: string): Promise<Blob> {
    const response = await apiClient.get(
      `/bills/${billId}/pdf`,
      { responseType: 'blob' }
    );
    return response.data;
  }

  static async generatePDFByOrderId(orderId: string): Promise<Blob> {
    const response = await apiClient.get(
      `/bills/order/${orderId}/pdf`,
      { responseType: 'blob' }
    );
    return response.data;
  }

  // ==================== Reporting ====================

  static async getRevenueSummary(): Promise<RevenueData> {
    const response = await apiClient.get<{ success: boolean; data: RevenueData }>(
      '/bills/revenue/summary'
    );
    if (!response.data.data) {
      throw new Error('Failed to get revenue summary');
    }
    return response.data.data;
  }

  // ==================== Configuration ====================

  static async getBillingConfig(): Promise<BillingConfig> {
    const response = await apiClient.get<{ success: boolean; data: BillingConfig }>(
      '/bills/config'
    );
    if (!response.data.data) {
      throw new Error('Failed to get billing configuration');
    }
    return response.data.data;
  }

  static async updateBillingConfig(config: Partial<BillingConfig>): Promise<BillingConfig> {
    const response = await apiClient.put<{ success: boolean; data: BillingConfig }>(
      '/bills/config',
      config
    );
    if (!response.data.data) {
      throw new Error('Failed to update billing configuration');
    }
    return response.data.data;
  }

  // ==================== Restaurant Information ====================

  static async getRestaurantInfo(): Promise<RestaurantInfo> {
    const response = await apiClient.get<{ success: boolean; data: RestaurantInfo }>(
      '/bills/restaurant-info'
    );
    if (!response.data.data) {
      throw new Error('Failed to get restaurant information');
    }
    return response.data.data;
  }

  static async updateRestaurantInfo(info: Partial<RestaurantInfo>): Promise<RestaurantInfo> {
    const response = await apiClient.put<{ success: boolean; data: RestaurantInfo }>(
      '/bills/restaurant-info',
      info
    );
    if (!response.data.data) {
      throw new Error('Failed to update restaurant information');
    }
    return response.data.data;
  }

  // ==================== PDF Customization ====================

  static async getPDFOptions(): Promise<PDFOptions> {
    const response = await apiClient.get<{ success: boolean; data: PDFOptions }>(
      '/bills/pdf-options'
    );
    if (!response.data.data) {
      throw new Error('Failed to get PDF options');
    }
    return response.data.data;
  }

  static async updatePDFOptions(options: Partial<PDFOptions>): Promise<PDFOptions> {
    const response = await apiClient.put<{ success: boolean; data: PDFOptions }>(
      '/bills/pdf-options',
      options
    );
    if (!response.data.data) {
      throw new Error('Failed to update PDF options');
    }
    return response.data.data;
  }
}