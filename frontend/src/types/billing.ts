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
  taxRate?: number;
}

export interface ProcessPaymentRequest {
  paymentMethod: PaymentMethod;
}

export interface BillingConfig {
  id: string;
  taxRate: number;
  defaultPaymentMethod: PaymentMethod;
  enableAutoGeneration: boolean;
  invoicePrefix: string;
  updatedAt: string;
}

export interface RestaurantInfo {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  taxId?: string;
  logo?: string;
  updatedAt: string;
}

export interface PDFOptions {
  id: string;
  headerText: string;
  footerText: string;
  showLogo: boolean;
  showQRCode: boolean;
  paperSize: 'A4' | 'LETTER' | 'RECEIPT';
  includeItemDetails: boolean;
  updatedAt: string;
}

export interface RevenueData {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  paymentMethodBreakdown: {
    [key in PaymentMethod]?: number;
  };
}

export interface BillCalculation {
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  taxRate: number;
}