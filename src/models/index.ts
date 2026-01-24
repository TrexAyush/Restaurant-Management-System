// Enums
export * from './enums';

// Models
export * from './User';
export * from './MenuItem';
export * from './Order';
export * from './Table';
export * from './InventoryItem';
export * from './Bill';

// Common types and interfaces
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: string[];
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

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

// Database row interfaces (matching database schema)
export interface UserRow {
  id: string;
  username: string;
  password_hash: string;
  role: string;
  first_name: string;
  last_name: string;
  email: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface MenuCategoryRow {
  id: string;
  name: string;
  description?: string;
  sort_order: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface MenuItemRow {
  id: string;
  name: string;
  description?: string;
  price: string; // Decimal stored as string
  category_id: string;
  is_available: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface MenuItemIngredientRow {
  id: string;
  menu_item_id: string;
  inventory_item_id: string;
  quantity: string; // Decimal stored as string
  unit: string;
  created_at: Date;
  updated_at: Date;
}

export interface TableRow {
  id: string;
  number: number;
  capacity: number;
  status: string;
  current_order_id?: string;
  occupied_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface OrderRow {
  id: string;
  table_id: string;
  waiter_id: string;
  status: string;
  total_amount: string; // Decimal stored as string
  created_at: Date;
  updated_at: Date;
}

export interface OrderItemRow {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  unit_price: string; // Decimal stored as string
  special_instructions?: string;
  created_at: Date;
  updated_at: Date;
}

export interface InventoryItemRow {
  id: string;
  name: string;
  current_stock: string; // Decimal stored as string
  unit: string;
  low_stock_threshold: string; // Decimal stored as string
  cost_per_unit: string; // Decimal stored as string
  supplier_id?: string;
  last_restocked: Date;
  created_at: Date;
  updated_at: Date;
}

export interface BillRow {
  id: string;
  order_id: string;
  subtotal: string; // Decimal stored as string
  tax_amount: string; // Decimal stored as string
  total_amount: string; // Decimal stored as string
  payment_method?: string;
  payment_status: string;
  generated_at: Date;
  paid_at?: Date;
  created_at: Date;
  updated_at: Date;
}