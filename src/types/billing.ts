export interface Bill {
  id: string;
  orderId: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod?: PaymentMethod;
  paymentStatus: PaymentStatus;
  generatedAt: string;
  paidAt?: string;
}

export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  DIGITAL = 'digital'
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  CANCELLED = 'cancelled'
}

export interface BillWithDetails extends Bill {
  order: {
    id: string;
    tableId: string;
    table: {
      number: number;
    };
    items: Array<{
      id: string;
      quantity: number;
      unitPrice: number;
      menuItem: {
        name: string;
      };
    }>;
  };
}

export interface CreateBillRequest {
  orderId: string;
}

export interface ProcessPaymentRequest {
  paymentMethod: PaymentMethod;
}