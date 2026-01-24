// User role enumeration
export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  WAITER = 'waiter',
  KITCHEN_STAFF = 'kitchen_staff',
  CASHIER = 'cashier'
}

// Order status enumeration
export enum OrderStatus {
  PLACED = 'placed',
  PREPARING = 'preparing',
  READY = 'ready',
  SERVED = 'served'
}

// Table status enumeration
export enum TableStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  RESERVED = 'reserved',
  OUT_OF_SERVICE = 'out_of_service'
}

// Payment method enumeration
export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  DIGITAL = 'digital'
}

// Payment status enumeration
export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  CANCELLED = 'cancelled'
}