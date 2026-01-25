import { TableStatus } from './enums';

export interface Table {
  id: string;
  number: number;
  capacity: number;
  status: TableStatus;
  currentOrderId?: string;
  occupiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTableRequest {
  number: number;
  capacity: number;
}

export interface UpdateTableRequest {
  number?: number;
  capacity?: number;
  status?: TableStatus;
}

export interface UpdateTableStatusRequest {
  status: TableStatus;
  currentOrderId?: string;
}

// Validation functions
export const validateTable = {
  number: (number: number): boolean => {
    return typeof number === 'number' && 
           Number.isInteger(number) && 
           number > 0 && 
           number <= 9999;
  },

  capacity: (capacity: number): boolean => {
    return typeof capacity === 'number' && 
           Number.isInteger(capacity) && 
           capacity > 0 && 
           capacity <= 50;
  },

  status: (status: string): status is TableStatus => {
    return Object.values(TableStatus).includes(status as TableStatus);
  },

  currentOrderId: (orderId?: string): boolean => {
    return orderId === undefined || 
           (typeof orderId === 'string' && orderId.length > 0);
  }
};

export const validateCreateTableRequest = (request: CreateTableRequest): string[] => {
  const errors: string[] = [];

  if (!validateTable.number(request.number)) {
    errors.push('Table number must be a positive integer between 1 and 9999');
  }

  if (!validateTable.capacity(request.capacity)) {
    errors.push('Table capacity must be a positive integer between 1 and 50');
  }

  return errors;
};

export const validateUpdateTableRequest = (request: UpdateTableRequest): string[] => {
  const errors: string[] = [];

  if (request.number !== undefined && !validateTable.number(request.number)) {
    errors.push('Table number must be a positive integer between 1 and 9999');
  }

  if (request.capacity !== undefined && !validateTable.capacity(request.capacity)) {
    errors.push('Table capacity must be a positive integer between 1 and 50');
  }

  if (request.status !== undefined && !validateTable.status(request.status)) {
    errors.push('Status must be one of: available, occupied, reserved, out_of_service');
  }

  return errors;
};

export const validateUpdateTableStatusRequest = (request: UpdateTableStatusRequest): string[] => {
  const errors: string[] = [];

  if (!validateTable.status(request.status)) {
    errors.push('Status must be one of: available, occupied, reserved, out_of_service');
  }

  if (!validateTable.currentOrderId(request.currentOrderId)) {
    errors.push('Current order ID must be a valid string if provided');
  }

  return errors;
};

// Table status transition validation
export const isValidTableStatusTransition = (
  currentStatus: TableStatus, 
  newStatus: TableStatus,
  hasCurrentOrder: boolean
): boolean => {
  // Available can go to any status
  if (currentStatus === TableStatus.AVAILABLE) {
    return true;
  }

  // Occupied can only go to available if no current order
  if (currentStatus === TableStatus.OCCUPIED) {
    if (newStatus === TableStatus.AVAILABLE) {
      return !hasCurrentOrder;
    }
    return newStatus === TableStatus.RESERVED || newStatus === TableStatus.OUT_OF_SERVICE;
  }

  // Reserved can go to occupied or available
  if (currentStatus === TableStatus.RESERVED) {
    return newStatus === TableStatus.OCCUPIED || 
           newStatus === TableStatus.AVAILABLE || 
           newStatus === TableStatus.OUT_OF_SERVICE;
  }

  // Out of service can go to available
  if (currentStatus === TableStatus.OUT_OF_SERVICE) {
    return newStatus === TableStatus.AVAILABLE;
  }

  return false;
};

// Capacity validation for occupancy
export const validateCapacityForOccupancy = (
  table: Table, 
  partySize: number
): boolean => {
  return partySize > 0 && partySize <= table.capacity;
};