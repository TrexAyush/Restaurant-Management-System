import apiClient from '../config/api';
import {
  MenuCategory,
  MenuItem,
  MenuItemWithCategory,
  CreateMenuCategoryRequest,
  UpdateMenuCategoryRequest,
  CreateMenuItemRequest,
  UpdateMenuItemRequest,
  MenuItemSearchFilters,
  PaginationParams,
  PaginatedResponse,
  ApiResponse
} from '../types/menu';

export class MenuService {
  // Category Management

  async getCategories(activeOnly: boolean = true): Promise<MenuCategory[]> {
    const response = await apiClient.get<ApiResponse<MenuCategory[]>>(
      `/menu/categories?activeOnly=${activeOnly}`
    );
    return response.data.data || [];
  }

  async getCategoryById(id: string): Promise<MenuCategory> {
    const response = await apiClient.get<ApiResponse<MenuCategory>>(
      `/menu/categories/${id}`
    );
    if (!response.data.data) {
      throw new Error('Category not found');
    }
    return response.data.data;
  }

  async createCategory(categoryData: CreateMenuCategoryRequest): Promise<MenuCategory> {
    const response = await apiClient.post<ApiResponse<MenuCategory>>(
      '/menu/categories',
      categoryData
    );
    if (!response.data.data) {
      throw new Error('Failed to create category');
    }
    return response.data.data;
  }

  async updateCategory(id: string, updateData: UpdateMenuCategoryRequest): Promise<MenuCategory> {
    const response = await apiClient.put<ApiResponse<MenuCategory>>(
      `/menu/categories/${id}`,
      updateData
    );
    if (!response.data.data) {
      throw new Error('Failed to update category');
    }
    return response.data.data;
  }

  async deleteCategory(id: string): Promise<void> {
    await apiClient.delete(`/menu/categories/${id}`);
  }

  // Menu Item Management

  async getMenuItems(
    filters: MenuItemSearchFilters = {},
    pagination: PaginationParams = {}
  ): Promise<PaginatedResponse<MenuItemWithCategory>> {
    const params = new URLSearchParams();
    
    if (pagination.page) params.append('page', pagination.page.toString());
    if (pagination.limit) params.append('limit', pagination.limit.toString());
    if (pagination.sortBy) params.append('sortBy', pagination.sortBy);
    if (pagination.sortOrder) params.append('sortOrder', pagination.sortOrder);
    
    if (filters.categoryId) params.append('categoryId', filters.categoryId);
    if (filters.isAvailable !== undefined) params.append('isAvailable', filters.isAvailable.toString());
    if (filters.priceMin !== undefined) params.append('priceMin', filters.priceMin.toString());
    if (filters.priceMax !== undefined) params.append('priceMax', filters.priceMax.toString());
    if (filters.searchTerm) params.append('search', filters.searchTerm);

    const response = await apiClient.get<{ success: boolean; data: MenuItemWithCategory[]; pagination: any }>(
      `/menu/items?${params.toString()}`
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

  async getMenuItemById(id: string, includeCategory: boolean = true): Promise<MenuItemWithCategory | MenuItem> {
    const response = await apiClient.get<ApiResponse<MenuItemWithCategory | MenuItem>>(
      `/menu/items/${id}?includeCategory=${includeCategory}`
    );
    if (!response.data.data) {
      throw new Error('Menu item not found');
    }
    return response.data.data;
  }

  async getMenuItemsByCategory(categoryId: string, availableOnly: boolean = true): Promise<MenuItem[]> {
    const response = await apiClient.get<ApiResponse<MenuItem[]>>(
      `/menu/categories/${categoryId}/items?availableOnly=${availableOnly}`
    );
    return response.data.data || [];
  }

  async createMenuItem(itemData: CreateMenuItemRequest): Promise<MenuItem> {
    const response = await apiClient.post<ApiResponse<MenuItem>>(
      '/menu/items',
      itemData
    );
    if (!response.data.data) {
      throw new Error('Failed to create menu item');
    }
    return response.data.data;
  }

  async updateMenuItem(id: string, updateData: UpdateMenuItemRequest): Promise<MenuItem> {
    const response = await apiClient.put<ApiResponse<MenuItem>>(
      `/menu/items/${id}`,
      updateData
    );
    if (!response.data.data) {
      throw new Error('Failed to update menu item');
    }
    return response.data.data;
  }

  async toggleMenuItemAvailability(id: string, isAvailable: boolean): Promise<MenuItem> {
    const response = await apiClient.put<ApiResponse<MenuItem>>(
      `/menu/items/${id}/availability`,
      { isAvailable }
    );
    if (!response.data.data) {
      throw new Error('Failed to toggle menu item availability');
    }
    return response.data.data;
  }

  async deleteMenuItem(id: string): Promise<void> {
    await apiClient.delete(`/menu/items/${id}`);
  }

  async searchMenuItems(
    searchTerm: string,
    filters: Omit<MenuItemSearchFilters, 'searchTerm'> = {},
    pagination: PaginationParams = {}
  ): Promise<PaginatedResponse<MenuItemWithCategory>> {
    const params = new URLSearchParams();
    params.append('q', searchTerm);
    
    if (pagination.page) params.append('page', pagination.page.toString());
    if (pagination.limit) params.append('limit', pagination.limit.toString());
    if (pagination.sortBy) params.append('sortBy', pagination.sortBy);
    if (pagination.sortOrder) params.append('sortOrder', pagination.sortOrder);
    
    if (filters.categoryId) params.append('categoryId', filters.categoryId);
    if (filters.isAvailable !== undefined) params.append('isAvailable', filters.isAvailable.toString());
    if (filters.priceMin !== undefined) params.append('priceMin', filters.priceMin.toString());
    if (filters.priceMax !== undefined) params.append('priceMax', filters.priceMax.toString());

    const response = await apiClient.get<ApiResponse<MenuItemWithCategory[]> & { pagination: any; searchTerm: string }>(
      `/menu/items/search?${params.toString()}`
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

  async getMenuByCategories(availableOnly: boolean = true): Promise<Array<MenuCategory & { items: MenuItem[] }>> {
    const response = await apiClient.get<ApiResponse<Array<MenuCategory & { items: MenuItem[] }>>>(
      `/menu/items/by-categories?availableOnly=${availableOnly}`
    );
    return response.data.data || [];
  }

  async getMenuStatistics(): Promise<{
    totalCategories: number;
    activeCategories: number;
    totalMenuItems: number;
    availableMenuItems: number;
    unavailableMenuItems: number;
    averagePrice: number;
    priceRange: { min: number; max: number };
  }> {
    const response = await apiClient.get<ApiResponse<any>>('/menu/items/statistics');
    return response.data.data || {
      totalCategories: 0,
      activeCategories: 0,
      totalMenuItems: 0,
      availableMenuItems: 0,
      unavailableMenuItems: 0,
      averagePrice: 0,
      priceRange: { min: 0, max: 0 }
    };
  }
}

export const menuService = new MenuService();