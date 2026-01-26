import { apiClient } from '../config/api';
import { 
  Bill, 
  BillWithDetails, 
  CreateBillRequest, 
  ProcessPaymentRequest 
} from '../types/billing';
import { ApiResponse, PaginationParams, PaginatedResponse } from '../types/menu';

export class BillingService {
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

  static async createBill(billData: CreateBillRequest): Promise<Bill> {
    const response = await apiClient.post<{ success: boolean; data: Bill }>('/bills', billData);
    if (!response.data.data) {
      throw new Error('Failed to create bill');
    }
    return response.data.data;
  }

  static async processPayment(billId: string, paymentData: ProcessPaymentRequest): Promise<Bill> {
    const response = await apiClient.put<{ success: boolean; data: Bill }>(`/bills/${billId}/payment`, paymentData);
    if (!response.data.data) {
      throw new Error('Failed to process payment');
    }
    return response.data.data;
  }

  static async generatePDF(billId: string): Promise<Blob> {
    const response = await apiClient.get(`/bills/${billId}/pdf`, {
      responseType: 'blob'
    });
    return response.data;
  }

  static async getPendingBills(): Promise<BillWithDetails[]> {
    const response = await apiClient.get<{ success: boolean; data: BillWithDetails[] }>('/bills/pending');
    return response.data.data || [];
  }
}