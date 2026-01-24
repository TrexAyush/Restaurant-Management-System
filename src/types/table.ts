export interface Table {
  id: string;
  number: number;
  capacity: number;
  status: TableStatus;
  currentOrderId?: string;
  occupiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export enum TableStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  RESERVED = 'reserved',
  OUT_OF_SERVICE = 'out_of_service'
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