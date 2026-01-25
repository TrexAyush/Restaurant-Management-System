import { PaymentMethod, PaymentStatus } from './enums';

export interface Bill {
  id: string;
  orderId: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod?: PaymentMethod | undefined;
  paymentStatus: PaymentStatus;
  generatedAt: Date;
  paidAt?: Date | undefined;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBillRequest {
  orderId: string;
  subtotal: number;
  taxRate: number;
}

export interface UpdateBillRequest {
  subtotal?: number;
  taxAmount?: number;
  totalAmount?: number;
}

export interface ProcessPaymentRequest {
  paymentMethod: PaymentMethod;
}

export interface BillCalculation {
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
}

// Validation functions
export const validateBill = {
  orderId: (orderId: string): boolean => {
    return typeof orderId === 'string' && orderId.length > 0;
  },

  subtotal: (subtotal: number): boolean => {
    return typeof subtotal === 'number' && 
           subtotal >= 0 && 
           subtotal <= 999999.99 &&
           Number.isFinite(subtotal);
  },

  taxAmount: (taxAmount: number): boolean => {
    return typeof taxAmount === 'number' && 
           taxAmount >= 0 && 
           taxAmount <= 999999.99 &&
           Number.isFinite(taxAmount);
  },

  totalAmount: (totalAmount: number): boolean => {
    return typeof totalAmount === 'number' && 
           totalAmount >= 0 && 
           totalAmount <= 999999.99 &&
           Number.isFinite(totalAmount);
  },

  taxRate: (taxRate: number): boolean => {
    return typeof taxRate === 'number' && 
           taxRate >= 0 && 
           taxRate <= 1 &&
           Number.isFinite(taxRate);
  },

  paymentMethod: (method: string): method is PaymentMethod => {
    return Object.values(PaymentMethod).includes(method as PaymentMethod);
  },

  paymentStatus: (status: string): status is PaymentStatus => {
    return Object.values(PaymentStatus).includes(status as PaymentStatus);
  }
};

export const validateCreateBillRequest = (request: CreateBillRequest): string[] => {
  const errors: string[] = [];

  if (!validateBill.orderId(request.orderId)) {
    errors.push('Order ID is required');
  }

  if (!validateBill.subtotal(request.subtotal)) {
    errors.push('Subtotal must be a valid number between 0 and 999999.99');
  }

  if (!validateBill.taxRate(request.taxRate)) {
    errors.push('Tax rate must be a number between 0 and 1');
  }

  return errors;
};

export const validateUpdateBillRequest = (request: UpdateBillRequest): string[] => {
  const errors: string[] = [];

  if (request.subtotal !== undefined && !validateBill.subtotal(request.subtotal)) {
    errors.push('Subtotal must be a valid number between 0 and 999999.99');
  }

  if (request.taxAmount !== undefined && !validateBill.taxAmount(request.taxAmount)) {
    errors.push('Tax amount must be a valid number between 0 and 999999.99');
  }

  if (request.totalAmount !== undefined && !validateBill.totalAmount(request.totalAmount)) {
    errors.push('Total amount must be a valid number between 0 and 999999.99');
  }

  return errors;
};

export const validateProcessPaymentRequest = (request: ProcessPaymentRequest): string[] => {
  const errors: string[] = [];

  if (!validateBill.paymentMethod(request.paymentMethod)) {
    errors.push('Payment method must be one of: cash, card, digital');
  }

  return errors;
};

// Bill calculation functions
export const calculateBill = (subtotal: number, taxRate: number): BillCalculation => {
  const taxAmount = Math.round(subtotal * taxRate * 100) / 100; // Round to 2 decimal places
  const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100; // Round to 2 decimal places

  return {
    subtotal,
    taxRate,
    taxAmount,
    totalAmount
  };
};

export const canModifyBill = (bill: Bill): boolean => {
  return bill.paymentStatus === PaymentStatus.PENDING;
};

export const canProcessPayment = (bill: Bill): boolean => {
  return bill.paymentStatus === PaymentStatus.PENDING && bill.totalAmount > 0;
};

// Payment status transition validation
export const isValidPaymentStatusTransition = (
  currentStatus: PaymentStatus, 
  newStatus: PaymentStatus
): boolean => {
  const validTransitions: Record<PaymentStatus, PaymentStatus[]> = {
    [PaymentStatus.PENDING]: [PaymentStatus.PAID, PaymentStatus.CANCELLED],
    [PaymentStatus.PAID]: [], // No transitions from paid
    [PaymentStatus.CANCELLED]: [PaymentStatus.PENDING] // Can reopen cancelled bills
  };

  return validTransitions[currentStatus].includes(newStatus);
};