export interface Order {
  id: string;
  tableId: string;
  waiterId: string;
  status: OrderStatus;
  items: OrderItem[];
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

export enum OrderStatus {
  PLACED = 'placed',
  PREPARING = 'preparing',
  READY = 'ready',
  SERVED = 'served'
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  quantity: number;
  unitPrice: number;
  specialInstructions?: string;
  menuItem?: {
    id: string;
    name: string;
    price: number;
  };
}

export interface OrderWithDetails extends Order {
  table: {
    id: string;
    number: number;
  };
  waiter: {
    id: string;
    firstName: string;
    lastName: string;
  };
  items: OrderItemWithDetails[];
}

export interface OrderItemWithDetails extends OrderItem {
  menuItem: {
    id: string;
    name: string;
    description?: string;
    price: number;
    categoryId: string;
  };
}

export interface CreateOrderRequest {
  tableId: string;
  waiterId: string;
  items: CreateOrderItemRequest[];
}

export interface CreateOrderItemRequest {
  menuItemId: string;
  quantity: number;
  unitPrice: number;
  specialInstructions?: string;
}

export interface UpdateOrderRequest {
  items?: UpdateOrderItemRequest[];
}

export interface UpdateOrderItemRequest {
  id?: string; // If provided, update existing item; if not, create new item
  menuItemId: string;
  quantity: number;
  specialInstructions?: string;
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
}