import { OrderStatus } from './enums';

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  quantity: number;
  unitPrice: number;
  specialInstructions?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Order {
  id: string;
  tableId: string;
  waiterId: string;
  status: OrderStatus;
  items: OrderItem[];
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
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
  unitPrice: number;
  specialInstructions?: string;
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
}

// Validation functions
export const validateOrder = {
  tableId: (tableId: string): boolean => {
    return typeof tableId === 'string' && tableId.length > 0;
  },

  waiterId: (waiterId: string): boolean => {
    return typeof waiterId === 'string' && waiterId.length > 0;
  },

  status: (status: string): status is OrderStatus => {
    return Object.values(OrderStatus).includes(status as OrderStatus);
  },

  totalAmount: (amount: number): boolean => {
    return typeof amount === 'number' && 
           amount >= 0 && 
           Number.isFinite(amount);
  }
};

export const validateOrderItem = {
  menuItemId: (menuItemId: string): boolean => {
    return typeof menuItemId === 'string' && menuItemId.length > 0;
  },

  quantity: (quantity: number): boolean => {
    return typeof quantity === 'number' && 
           Number.isInteger(quantity) && 
           quantity > 0 && 
           quantity <= 100;
  },

  unitPrice: (price: number): boolean => {
    return typeof price === 'number' && 
           price >= 0 && 
           price <= 999999.99 &&
           Number.isFinite(price);
  },

  specialInstructions: (instructions?: string): boolean => {
    return instructions === undefined || 
           (typeof instructions === 'string' && instructions.length <= 500);
  }
};

export const validateCreateOrderRequest = (request: CreateOrderRequest): string[] => {
  const errors: string[] = [];

  if (!validateOrder.tableId(request.tableId)) {
    errors.push('Table ID is required');
  }

  if (!validateOrder.waiterId(request.waiterId)) {
    errors.push('Waiter ID is required');
  }

  if (!Array.isArray(request.items) || request.items.length === 0) {
    errors.push('At least one order item is required');
  } else {
    request.items.forEach((item, index) => {
      if (!validateOrderItem.menuItemId(item.menuItemId)) {
        errors.push(`Item ${index + 1}: Menu item ID is required`);
      }

      if (!validateOrderItem.quantity(item.quantity)) {
        errors.push(`Item ${index + 1}: Quantity must be a positive integer between 1 and 100`);
      }

      if (!validateOrderItem.unitPrice(item.unitPrice)) {
        errors.push(`Item ${index + 1}: Unit price must be a valid number between 0 and 999999.99`);
      }

      if (!validateOrderItem.specialInstructions(item.specialInstructions)) {
        errors.push(`Item ${index + 1}: Special instructions must be less than 500 characters`);
      }
    });
  }

  return errors;
};

export const validateUpdateOrderStatusRequest = (request: UpdateOrderStatusRequest): string[] => {
  const errors: string[] = [];

  if (!validateOrder.status(request.status)) {
    errors.push('Status must be one of: placed, preparing, ready, served');
  }

  return errors;
};

// Order status transition validation
export const isValidStatusTransition = (currentStatus: OrderStatus, newStatus: OrderStatus): boolean => {
  const validTransitions: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.PLACED]: [OrderStatus.PREPARING],
    [OrderStatus.PREPARING]: [OrderStatus.READY],
    [OrderStatus.READY]: [OrderStatus.SERVED],
    [OrderStatus.SERVED]: [] // No transitions from served
  };

  return validTransitions[currentStatus].includes(newStatus);
};