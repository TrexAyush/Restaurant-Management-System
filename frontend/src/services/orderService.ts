import { apiClient } from '../config/api';
import { 
  Order, 
  OrderWithDetails, 
  CreateOrderRequest, 
  UpdateOrderRequest, 
  UpdateOrderStatusRequest 
} from '../types/order';
import { PaginationParams, PaginatedResponse } from '../types/menu';

export class OrderService {
  static async getAllOrders(pagination?: PaginationParams): Promise<PaginatedResponse<OrderWithDetails>> {
    const params = new URLSearchParams();
    
    if (pagination?.page) params.append('page', pagination.page.toString());
    if (pagination?.limit) params.append('limit', pagination.limit.toString());
    if (pagination?.sortBy) params.append('sortBy', pagination.sortBy);
    if (pagination?.sortOrder) params.append('sortOrder', pagination.sortOrder);

    const response = await apiClient.get<{ success: boolean; data: OrderWithDetails[]; pagination: any }>(
      `/orders?${params.toString()}`
    );

    return {
      data: response.data.data || [],
      pagination: response.data.pagination || {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
      }
    };
  }

  static async getOrderById(id: string): Promise<OrderWithDetails> {
    const response = await apiClient.get<{ success: boolean; data: OrderWithDetails }>(`/orders/${id}`);
    if (!response.data.data) {
      throw new Error('Order not found');
    }
    return response.data.data;
  }

  static async getOrdersByTable(tableId: string): Promise<OrderWithDetails[]> {
    const response = await apiClient.get<{ success: boolean; data: OrderWithDetails[] }>(`/orders/table/${tableId}`);
    return response.data.data || [];
  }

  static async getOrdersByStatus(status: string): Promise<OrderWithDetails[]> {
    const response = await apiClient.get<{ success: boolean; data: OrderWithDetails[] }>(`/orders/status/${status}`);
    return response.data.data || [];
  }

  static async createOrder(orderData: CreateOrderRequest): Promise<Order> {
    const response = await apiClient.post<{ success: boolean; data: Order }>('/orders', orderData);
    if (!response.data.data) {
      throw new Error('Failed to create order');
    }
    return response.data.data;
  }

  static async updateOrder(id: string, updateData: UpdateOrderRequest): Promise<Order> {
    const response = await apiClient.put<{ success: boolean; data: Order }>(`/orders/${id}`, updateData);
    if (!response.data.data) {
      throw new Error('Failed to update order');
    }
    return response.data.data;
  }

  static async updateOrderStatus(id: string, statusData: UpdateOrderStatusRequest): Promise<Order> {
    const response = await apiClient.put<{ success: boolean; data: Order }>(`/orders/${id}/status`, statusData);
    if (!response.data.data) {
      throw new Error('Failed to update order status');
    }
    return response.data.data;
  }

  static async deleteOrder(id: string): Promise<void> {
    await apiClient.delete(`/orders/${id}`);
  }

  static async getActiveOrders(): Promise<OrderWithDetails[]> {
    const response = await apiClient.get<{ success: boolean; data: OrderWithDetails[] }>('/orders/active');
    return response.data.data || [];
  }

  static async getKitchenOrders(): Promise<OrderWithDetails[]> {
    const response = await apiClient.get<{ success: boolean; data: OrderWithDetails[] }>('/orders/kitchen');
    return response.data.data || [];
  }

  static async getReadyOrders(): Promise<OrderWithDetails[]> {
    const response = await apiClient.get<{ success: boolean; data: OrderWithDetails[] }>('/orders/ready');
    return response.data.data || [];
  }
}