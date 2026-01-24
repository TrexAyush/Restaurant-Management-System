import { apiClient } from '../config/api';
import { Table, CreateTableRequest, UpdateTableRequest } from '../types/table';
import { ApiResponse } from '../types/menu';

export class TableService {
  static async getAllTables(): Promise<Table[]> {
    const response = await apiClient.get<ApiResponse<{data: Table[], pagination: any}>>('/tables');
    return response.data.data?.data || [];
  }

  static async getTableById(id: string): Promise<Table> {
    const response = await apiClient.get<ApiResponse<Table>>(`/tables/${id}`);
    if (!response.data.data) {
      throw new Error('Table not found');
    }
    return response.data.data;
  }

  static async createTable(tableData: CreateTableRequest): Promise<Table> {
    const response = await apiClient.post<ApiResponse<Table>>('/tables', tableData);
    if (!response.data.data) {
      throw new Error('Failed to create table');
    }
    return response.data.data;
  }

  static async updateTable(id: string, updateData: UpdateTableRequest): Promise<Table> {
    const response = await apiClient.put<ApiResponse<Table>>(`/tables/${id}`, updateData);
    if (!response.data.data) {
      throw new Error('Failed to update table');
    }
    return response.data.data;
  }

  static async deleteTable(id: string): Promise<void> {
    await apiClient.delete(`/tables/${id}`);
  }

  static async getAvailableTables(): Promise<Table[]> {
    const response = await apiClient.get<{ success: boolean; data: Table[] }>('/tables/status/available');
    return response.data.data || [];
  }
}