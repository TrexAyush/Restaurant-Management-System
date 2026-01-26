import { apiClient } from '../config/api';
import { 
  InventoryItem, 
  CreateInventoryItemRequest, 
  UpdateInventoryItemRequest,
  InventoryUpdateRecord,
  CreateInventoryUpdateRequest,
  InventoryAlert
} from '../types/inventory';
import { ApiResponse, PaginationParams, PaginatedResponse } from '../types/menu';

export class InventoryService {
  static async getAllItems(pagination?: PaginationParams): Promise<PaginatedResponse<InventoryItem>> {
    const params = new URLSearchParams();
    
    if (pagination?.page) params.append('page', pagination.page.toString());
    if (pagination?.limit) params.append('limit', pagination.limit.toString());
    if (pagination?.sortBy) params.append('sortBy', pagination.sortBy);
    if (pagination?.sortOrder) params.append('sortOrder', pagination.sortOrder);

    const response = await apiClient.get<ApiResponse<InventoryItem[]> & { pagination: any }>(
      `/inventory?${params.toString()}`
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

  static async getItemById(id: string): Promise<InventoryItem> {
    const response = await apiClient.get<ApiResponse<InventoryItem>>(`/inventory/${id}`);
    if (!response.data.data) {
      throw new Error('Inventory item not found');
    }
    return response.data.data;
  }

  static async createItem(itemData: CreateInventoryItemRequest): Promise<InventoryItem> {
    const response = await apiClient.post<ApiResponse<InventoryItem>>('/inventory', itemData);
    if (!response.data.data) {
      throw new Error('Failed to create inventory item');
    }
    return response.data.data;
  }

  static async updateItem(id: string, updateData: UpdateInventoryItemRequest): Promise<InventoryItem> {
    const response = await apiClient.put<ApiResponse<InventoryItem>>(`/inventory/${id}`, updateData);
    if (!response.data.data) {
      throw new Error('Failed to update inventory item');
    }
    return response.data.data;
  }

  static async deleteItem(id: string): Promise<void> {
    await apiClient.delete(`/inventory/${id}`);
  }

  static async updateStock(updateData: CreateInventoryUpdateRequest): Promise<InventoryUpdateRecord> {
    const response = await apiClient.post<ApiResponse<InventoryUpdateRecord>>('/inventory/update', updateData);
    if (!response.data.data) {
      throw new Error('Failed to update stock');
    }
    return response.data.data;
  }

  static async getUpdateHistory(itemId: string): Promise<InventoryUpdateRecord[]> {
    const response = await apiClient.get<ApiResponse<InventoryUpdateRecord[]>>(`/inventory/${itemId}/history`);
    return response.data.data || [];
  }

  static async getLowStockItems(): Promise<InventoryItem[]> {
    const response = await apiClient.get<ApiResponse<InventoryItem[]>>('/inventory/low-stock');
    return response.data.data || [];
  }

  static async getAlerts(): Promise<InventoryAlert[]> {
    const response = await apiClient.get<ApiResponse<InventoryAlert[]>>('/inventory/alerts');
    return response.data.data || [];
  }

  static async resolveAlert(alertId: string): Promise<void> {
    await apiClient.put(`/inventory/alerts/${alertId}/resolve`);
  }
}