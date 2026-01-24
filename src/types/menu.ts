export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IngredientUsage {
  inventoryItemId: string;
  quantity: number;
  unit: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  categoryId: string;
  isAvailable: boolean;
  ingredients: IngredientUsage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MenuItemWithCategory extends MenuItem {
  category: MenuCategory;
}

export interface CreateMenuCategoryRequest {
  name: string;
  description?: string;
  sortOrder?: number;
}

export interface UpdateMenuCategoryRequest {
  name?: string;
  description?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface CreateMenuItemRequest {
  name: string;
  description?: string;
  price: number;
  categoryId: string;
  ingredients?: IngredientUsage[];
}

export interface UpdateMenuItemRequest {
  name?: string;
  description?: string;
  price?: number;
  categoryId?: string;
  isAvailable?: boolean;
  ingredients?: IngredientUsage[];
}

export interface MenuItemSearchFilters {
  categoryId?: string;
  isAvailable?: boolean;
  priceMin?: number;
  priceMax?: number;
  searchTerm?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: string[];
  message?: string;
  timestamp: string;
}