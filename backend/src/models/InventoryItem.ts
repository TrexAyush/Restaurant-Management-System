export interface InventoryItem {
  id: string;
  name: string;
  currentStock: number;
  unit: string;
  lowStockThreshold: number;
  costPerUnit: number;
  supplierId?: string;
  lastRestocked: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateInventoryItemRequest {
  name: string;
  currentStock: number;
  unit: string;
  lowStockThreshold: number;
  costPerUnit: number;
  supplierId?: string;
}

export interface UpdateInventoryItemRequest {
  name?: string;
  currentStock?: number;
  unit?: string;
  lowStockThreshold?: number;
  costPerUnit?: number;
  supplierId?: string;
}

export interface InventoryUpdateRecord {
  id: string;
  inventoryItemId: string;
  previousStock: number;
  newStock: number;
  changeAmount: number;
  changeReason: string;
  updatedBy: string;
  createdAt: Date;
}

export interface CreateInventoryUpdateRequest {
  inventoryItemId: string;
  newStock: number;
  changeReason: string;
  updatedBy: string;
}

// Validation functions
export const validateInventoryItem = {
  name: (name: string): boolean => {
    return typeof name === 'string' && 
           name.length >= 1 && 
           name.length <= 200 &&
           name.trim().length > 0;
  },

  currentStock: (stock: number): boolean => {
    return typeof stock === 'number' && 
           stock >= 0 && 
           Number.isFinite(stock);
  },

  unit: (unit: string): boolean => {
    return typeof unit === 'string' && 
           unit.length >= 1 && 
           unit.length <= 50 &&
           unit.trim().length > 0;
  },

  lowStockThreshold: (threshold: number): boolean => {
    return typeof threshold === 'number' && 
           threshold >= 0 && 
           Number.isFinite(threshold);
  },

  costPerUnit: (cost: number): boolean => {
    return typeof cost === 'number' && 
           cost >= 0 && 
           cost <= 999999.99 &&
           Number.isFinite(cost);
  },

  supplierId: (supplierId?: string): boolean => {
    return supplierId === undefined || 
           (typeof supplierId === 'string' && supplierId.length > 0);
  }
};

export const validateCreateInventoryItemRequest = (request: CreateInventoryItemRequest): string[] => {
  const errors: string[] = [];

  if (!validateInventoryItem.name(request.name)) {
    errors.push('Name must be 1-200 characters and not empty');
  }

  if (!validateInventoryItem.currentStock(request.currentStock)) {
    errors.push('Current stock must be a non-negative number');
  }

  if (!validateInventoryItem.unit(request.unit)) {
    errors.push('Unit must be 1-50 characters and not empty');
  }

  if (!validateInventoryItem.lowStockThreshold(request.lowStockThreshold)) {
    errors.push('Low stock threshold must be a non-negative number');
  }

  if (!validateInventoryItem.costPerUnit(request.costPerUnit)) {
    errors.push('Cost per unit must be a valid number between 0 and 999999.99');
  }

  if (!validateInventoryItem.supplierId(request.supplierId)) {
    errors.push('Supplier ID must be a valid string if provided');
  }

  return errors;
};

export const validateUpdateInventoryItemRequest = (request: UpdateInventoryItemRequest): string[] => {
  const errors: string[] = [];

  if (request.name !== undefined && !validateInventoryItem.name(request.name)) {
    errors.push('Name must be 1-200 characters and not empty');
  }

  if (request.currentStock !== undefined && !validateInventoryItem.currentStock(request.currentStock)) {
    errors.push('Current stock must be a non-negative number');
  }

  if (request.unit !== undefined && !validateInventoryItem.unit(request.unit)) {
    errors.push('Unit must be 1-50 characters and not empty');
  }

  if (request.lowStockThreshold !== undefined && !validateInventoryItem.lowStockThreshold(request.lowStockThreshold)) {
    errors.push('Low stock threshold must be a non-negative number');
  }

  if (request.costPerUnit !== undefined && !validateInventoryItem.costPerUnit(request.costPerUnit)) {
    errors.push('Cost per unit must be a valid number between 0 and 999999.99');
  }

  if (request.supplierId !== undefined && !validateInventoryItem.supplierId(request.supplierId)) {
    errors.push('Supplier ID must be a valid string if provided');
  }

  return errors;
};

// Inventory business logic functions
export const isLowStock = (item: InventoryItem): boolean => {
  return item.currentStock <= item.lowStockThreshold;
};

export const canDeductStock = (item: InventoryItem, quantity: number): boolean => {
  return item.currentStock >= quantity && quantity > 0;
};

export const calculateStockValue = (item: InventoryItem): number => {
  return item.currentStock * item.costPerUnit;
};