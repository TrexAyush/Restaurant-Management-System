export interface InventoryItem {
  id: string;
  name: string;
  currentStock: number;
  unit: string;
  lowStockThreshold: number;
  costPerUnit: number;
  supplierId?: string;
  lastRestocked: string;
  createdAt: string;
  updatedAt: string;
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
  changeAmount: number;
  changeType: InventoryChangeType;
  reason: string;
  userId: string;
  createdAt: string;
}

export enum InventoryChangeType {
  RESTOCK = 'restock',
  USAGE = 'usage',
  ADJUSTMENT = 'adjustment',
  WASTE = 'waste'
}

export interface CreateInventoryUpdateRequest {
  inventoryItemId: string;
  changeAmount: number;
  changeType: InventoryChangeType;
  reason: string;
}

export interface InventoryAlert {
  id: string;
  inventoryItemId: string;
  alertType: InventoryAlertType;
  message: string;
  isResolved: boolean;
  createdAt: string;
  resolvedAt?: string;
}

export enum InventoryAlertType {
  LOW_STOCK = 'low_stock',
  OUT_OF_STOCK = 'out_of_stock'
}