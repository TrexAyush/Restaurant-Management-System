import PDFDocument from 'pdfkit';
import path from 'path';
import { Bill } from '../models/Bill';
import { Order } from '../models/Order';
import { PaymentMethod } from '../models/enums';

const FONTS_DIR = path.join(__dirname, '..', 'assets', 'fonts');
const FONT_REGULAR = path.join(FONTS_DIR, 'NotoSans-Regular.ttf');
const FONT_BOLD = path.join(FONTS_DIR, 'NotoSans-Bold.ttf');

export interface InvoiceData {
  bill: Bill;
  order: Order;
  restaurantInfo: RestaurantInfo;
  customerInfo?: CustomerInfo | undefined;
}

export interface RestaurantInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  taxId?: string;
  logo?: Buffer;
}

export interface CustomerInfo {
  name?: string;
  phone?: string;
  email?: string;
}

export interface PDFGenerationOptions {
  includeHeader: boolean;
  includeFooter: boolean;
  includeItemDetails: boolean;
  includeTaxBreakdown: boolean;
  format: 'A4' | 'Letter';
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

export class PDFService {
  private defaultOptions: PDFGenerationOptions = {
    includeHeader: true,
    includeFooter: true,
    includeItemDetails: true,
    includeTaxBreakdown: true,
    format: 'A4',
    margins: {
      top: 50,
      bottom: 50,
      left: 50,
      right: 50
    }
  };

  private defaultRestaurantInfo: RestaurantInfo = {
    name: 'Spice Garden Restaurant',
    address: '42 MG Road, Connaught Place, New Delhi 110001',
    phone: '+91 11 2345 6789',
    email: 'info@spicegarden.in',
    taxId: 'GSTIN 07AABCU9603R1ZM'
  };

  /**
   * Generate PDF invoice for a bill
   */
  async generateInvoice(
    invoiceData: InvoiceData,
    options: Partial<PDFGenerationOptions> = {}
  ): Promise<Buffer> {
    const finalOptions = { ...this.defaultOptions, ...options };
    
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: finalOptions.format,
          margins: finalOptions.margins
        });

        // Register Unicode fonts that support the Rupee symbol (₹)
        doc.registerFont('NotoSans', FONT_REGULAR);
        doc.registerFont('NotoSans-Bold', FONT_BOLD);

        const buffers: Buffer[] = [];
        
        doc.on('data', (chunk) => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', (error) => reject(error));

        // Generate the invoice content
        this.generateInvoiceContent(doc, invoiceData, finalOptions);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate the main invoice content
   */
  private generateInvoiceContent(
    doc: PDFKit.PDFDocument,
    invoiceData: InvoiceData,
    options: PDFGenerationOptions
  ): void {
    const { bill, order, restaurantInfo, customerInfo } = invoiceData;

    let currentY = options.margins.top;

    // Header
    if (options.includeHeader) {
      currentY = this.generateHeader(doc, restaurantInfo, currentY);
      currentY += 20;
    }

    // Invoice title and details
    currentY = this.generateInvoiceTitle(doc, bill, currentY);
    currentY += 20;

    // Customer information (if provided)
    if (customerInfo) {
      currentY = this.generateCustomerInfo(doc, customerInfo, order, currentY);
      currentY += 20;
    }

    // Order details
    if (options.includeItemDetails) {
      currentY = this.generateOrderDetails(doc, order, currentY);
      currentY += 20;
    }

    // Bill summary
    currentY = this.generateBillSummary(doc, bill, options.includeTaxBreakdown, currentY);
    currentY += 20;

    // Payment information
    currentY = this.generatePaymentInfo(doc, bill, currentY);
    currentY += 20;

    // Footer
    if (options.includeFooter) {
      this.generateFooter(doc, restaurantInfo);
    }
  }

  /**
   * Generate invoice header with restaurant information
   */
  private generateHeader(
    doc: PDFKit.PDFDocument,
    restaurantInfo: RestaurantInfo,
    startY: number
  ): number {
    const pageWidth = doc.page.width;
    const margins = doc.page.margins;

    // Restaurant name
    doc.fontSize(24)
       .font('NotoSans-Bold')
       .text(restaurantInfo.name, margins.left, startY, { align: 'center' });

    let currentY = startY + 30;

    // Restaurant details
    doc.fontSize(10)
       .font('NotoSans')
       .text(restaurantInfo.address, margins.left, currentY, { align: 'center' });

    currentY += 15;

    doc.text(`Phone: ${restaurantInfo.phone} | Email: ${restaurantInfo.email}`, 
             margins.left, currentY, { align: 'center' });

    if (restaurantInfo.taxId) {
      currentY += 15;
      doc.text(`Tax ID: ${restaurantInfo.taxId}`, margins.left, currentY, { align: 'center' });
    }

    // Horizontal line
    currentY += 20;
    doc.moveTo(margins.left, currentY)
       .lineTo(pageWidth - margins.right, currentY)
       .stroke();

    return currentY + 10;
  }

  /**
   * Generate invoice title and basic information
   */
  private generateInvoiceTitle(
    doc: PDFKit.PDFDocument,
    bill: Bill,
    startY: number
  ): number {
    const margins = doc.page.margins;

    // Invoice title
    doc.fontSize(18)
       .font('NotoSans-Bold')
       .text('INVOICE', margins.left, startY);

    // Invoice details
    const invoiceDate = bill.generatedAt.toLocaleDateString();
    const invoiceTime = bill.generatedAt.toLocaleTimeString();

    doc.fontSize(10)
       .font('NotoSans')
       .text(`Invoice #: ${bill.id.substring(0, 8).toUpperCase()}`, margins.left, startY + 25)
       .text(`Date: ${invoiceDate}`, margins.left, startY + 40)
       .text(`Time: ${invoiceTime}`, margins.left, startY + 55);

    // Payment status
    const statusColor = bill.paymentStatus === 'paid' ? 'green' : 
                       bill.paymentStatus === 'cancelled' ? 'red' : 'orange';
    
    doc.fontSize(12)
       .font('NotoSans-Bold')
       .fillColor(statusColor)
       .text(`Status: ${bill.paymentStatus.toUpperCase()}`, 
             doc.page.width - margins.right - 100, startY + 25)
       .fillColor('black');

    return startY + 70;
  }

  /**
   * Generate customer information section
   */
  private generateCustomerInfo(
    doc: PDFKit.PDFDocument,
    customerInfo: CustomerInfo,
    order: Order,
    startY: number
  ): number {
    const margins = doc.page.margins;

    doc.fontSize(12)
       .font('NotoSans-Bold')
       .text('Customer Information:', margins.left, startY);

    let currentY = startY + 20;

    doc.fontSize(10)
       .font('NotoSans')
       .text(`Table: ${order.tableId}`, margins.left, currentY);

    if (customerInfo.name) {
      currentY += 15;
      doc.text(`Name: ${customerInfo.name}`, margins.left, currentY);
    }

    if (customerInfo.phone) {
      currentY += 15;
      doc.text(`Phone: ${customerInfo.phone}`, margins.left, currentY);
    }

    if (customerInfo.email) {
      currentY += 15;
      doc.text(`Email: ${customerInfo.email}`, margins.left, currentY);
    }

    return currentY + 15;
  }

  /**
   * Generate order details table
   */
  private generateOrderDetails(
    doc: PDFKit.PDFDocument,
    order: Order,
    startY: number
  ): number {
    const margins = doc.page.margins;
    const pageWidth = doc.page.width;
    const tableWidth = pageWidth - margins.left - margins.right;

    // Table header
    doc.fontSize(12)
       .font('NotoSans-Bold')
       .text('Order Details:', margins.left, startY);

    let currentY = startY + 25;

    // Table headers
    const colWidths = {
      item: tableWidth * 0.4,
      quantity: tableWidth * 0.15,
      unitPrice: tableWidth * 0.2,
      total: tableWidth * 0.25
    };

    doc.fontSize(10)
       .font('NotoSans-Bold')
       .text('Item', margins.left, currentY)
       .text('Qty', margins.left + colWidths.item, currentY)
       .text('Unit Price', margins.left + colWidths.item + colWidths.quantity, currentY)
       .text('Total', margins.left + colWidths.item + colWidths.quantity + colWidths.unitPrice, currentY);

    currentY += 20;

    // Table line
    doc.moveTo(margins.left, currentY)
       .lineTo(pageWidth - margins.right, currentY)
       .stroke();

    currentY += 10;

    // Order items
    doc.font('NotoSans');
    
    for (const item of order.items) {
      const itemTotal = item.quantity * item.unitPrice;

      doc.text(item.menuItemName || `Item ${item.menuItemId.substring(0, 8)}`, margins.left, currentY, {
        width: colWidths.item - 10,
        ellipsis: true
      });

      doc.text(item.quantity.toString(), margins.left + colWidths.item, currentY);
      
      doc.text(`₹${item.unitPrice.toFixed(2)}`, 
               margins.left + colWidths.item + colWidths.quantity, currentY);
      
      doc.text(`₹${itemTotal.toFixed(2)}`, 
               margins.left + colWidths.item + colWidths.quantity + colWidths.unitPrice, currentY);

      currentY += 15;

      // Special instructions
      if (item.specialInstructions) {
        doc.fontSize(8)
           .fillColor('gray')
           .text(`Note: ${item.specialInstructions}`, margins.left + 10, currentY, {
             width: colWidths.item + colWidths.quantity - 20
           })
           .fillColor('black')
           .fontSize(10);
        currentY += 12;
      }
    }

    // Bottom line
    doc.moveTo(margins.left, currentY + 5)
       .lineTo(pageWidth - margins.right, currentY + 5)
       .stroke();

    return currentY + 15;
  }

  /**
   * Generate bill summary section
   */
  private generateBillSummary(
    doc: PDFKit.PDFDocument,
    bill: Bill,
    includeTaxBreakdown: boolean,
    startY: number
  ): number {
    const margins = doc.page.margins;
    const pageWidth = doc.page.width;
    const summaryX = pageWidth - margins.right - 200;

    let currentY = startY;

    // Summary box
    doc.rect(summaryX - 10, currentY - 10, 210, includeTaxBreakdown ? 80 : 60)
       .stroke();

    // Subtotal
    doc.fontSize(10)
       .font('NotoSans')
       .text('Subtotal:', summaryX, currentY)
       .text(`₹${bill.subtotal.toFixed(2)}`, summaryX + 100, currentY);

    currentY += 15;

    // Tax breakdown
    if (includeTaxBreakdown && bill.taxAmount > 0) {
      const taxRate = bill.subtotal > 0 ? (bill.taxAmount / bill.subtotal) * 100 : 0;
      
      doc.text(`Tax (${taxRate.toFixed(1)}%):`, summaryX, currentY)
         .text(`₹${bill.taxAmount.toFixed(2)}`, summaryX + 100, currentY);

      currentY += 15;
    }

    // Total line
    doc.moveTo(summaryX, currentY)
       .lineTo(summaryX + 150, currentY)
       .stroke();

    currentY += 10;

    // Total amount
    doc.fontSize(12)
       .font('NotoSans-Bold')
       .text('Total:', summaryX, currentY)
       .text(`₹${bill.totalAmount.toFixed(2)}`, summaryX + 100, currentY);

    return currentY + 30;
  }

  /**
   * Generate payment information section
   */
  private generatePaymentInfo(
    doc: PDFKit.PDFDocument,
    bill: Bill,
    startY: number
  ): number {
    const margins = doc.page.margins;

    doc.fontSize(12)
       .font('NotoSans-Bold')
       .text('Payment Information:', margins.left, startY);

    let currentY = startY + 20;

    doc.fontSize(10)
       .font('NotoSans')
       .text(`Payment Status: ${bill.paymentStatus.toUpperCase()}`, margins.left, currentY);

    if (bill.paymentMethod) {
      currentY += 15;
      const paymentMethodText = this.getPaymentMethodText(bill.paymentMethod);
      doc.text(`Payment Method: ${paymentMethodText}`, margins.left, currentY);
    }

    if (bill.paidAt) {
      currentY += 15;
      const paidDate = bill.paidAt.toLocaleDateString();
      const paidTime = bill.paidAt.toLocaleTimeString();
      doc.text(`Paid On: ${paidDate} at ${paidTime}`, margins.left, currentY);
    }

    return currentY + 15;
  }

  /**
   * Generate footer with additional information
   */
  private generateFooter(
    doc: PDFKit.PDFDocument,
    restaurantInfo: RestaurantInfo
  ): void {
    const margins = doc.page.margins;
    const pageHeight = doc.page.height;
    // Reserve enough space: rule (0) + line1 (12) + line2 (12) + font size buffer (10) = ~50
    const footerY = pageHeight - margins.bottom - 50;

    // Footer line
    doc.moveTo(margins.left, footerY)
       .lineTo(doc.page.width - margins.right, footerY)
       .stroke();

    // Footer text
    doc.fontSize(8)
       .font('NotoSans')
       .text('Thank you for dining with us!', margins.left, footerY + 12, { align: 'center' })
       .text(`Generated on ${new Date().toLocaleString()}`, margins.left, footerY + 28, { align: 'center' });
  }

  /**
   * Get human-readable payment method text
   */
  private getPaymentMethodText(paymentMethod: PaymentMethod): string {
    switch (paymentMethod) {
      case PaymentMethod.CASH:
        return 'Cash';
      case PaymentMethod.CARD:
        return 'Credit/Debit Card';
      case PaymentMethod.DIGITAL:
        return 'Digital Payment';
      default:
        return 'Unknown';
    }
  }

  /**
   * Set default restaurant information
   */
  setDefaultRestaurantInfo(restaurantInfo: Partial<RestaurantInfo>): void {
    this.defaultRestaurantInfo = { ...this.defaultRestaurantInfo, ...restaurantInfo };
  }

  /**
   * Get default restaurant information
   */
  getDefaultRestaurantInfo(): RestaurantInfo {
    return { ...this.defaultRestaurantInfo };
  }

  /**
   * Set default PDF generation options
   */
  setDefaultOptions(options: Partial<PDFGenerationOptions>): void {
    this.defaultOptions = { ...this.defaultOptions, ...options };
  }

  /**
   * Get default PDF generation options
   */
  getDefaultOptions(): PDFGenerationOptions {
    return { ...this.defaultOptions };
  }
}

// Export singleton instance
export const pdfService = new PDFService();