# Restaurant Management System - Documentation

## Project Synopsis

**Restaurant Management System** is a full-stack web application designed to streamline restaurant operations. It provides a comprehensive suite of tools for managing menus, tables, orders, inventory, billing, and analytics through an intuitive user interface with role-based access control.

### Key Capabilities

- **User Management**: Authentication and authorization with 5 user roles (Admin, Manager, Waiter, Kitchen, Cashier)
- **Menu & Inventory**: Complete CRUD operations, availability control, stock tracking with low-stock alerts
- **Table & Order Management**: Real-time table tracking, full order lifecycle, status management
- **Billing & Payment**: Automated bill generation with tax calculations, multiple payment methods, PDF invoices
- **Analytics & Reporting**: Sales reports, item popularity, revenue summaries, daily/monthly trends
- **Real-time Updates**: WebSocket integration for live order status and table updates

### Tech Stack

**Backend**: Node.js + TypeScript + Express.js + PostgreSQL + Knex.js
**Frontend**: React + TypeScript + Material-UI + React Router
**Testing**: Jest + Property-based Testing
**Authentication**: JWT-based with role-based access control

### Project Structure

```
Restaurant-Management-System/
├── backend/                 # Node.js/Express API server
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── services/        # Business logic
│   │   ├── repositories/    # Data access layer
│   │   ├── models/          # Data models & enums
│   │   ├── routes/          # API endpoints
│   │   ├── middleware/      # Authentication, error handling
│   │   └── config/          # Database configuration
│   └── tests/               # Integration & unit tests
├── frontend/                # React application
│   └── src/
│       ├── components/      # UI components
│       ├── services/        # API client services
│       ├── contexts/        # React context providers
│       ├── types/           # TypeScript interfaces
│       └── hooks/           # Custom React hooks
└── docs/                    # Project documentation
```

---

## Latest Updates - Billing System Integration & Application Settings

### Billing Management System Enhancement

The billing system has been comprehensively enhanced with 20+ API endpoints and a unified management interface focused on simplicity and maintainability.

#### What Was Added

1. **BillingManagement Component** (enhanced)
   - Bill listing with pagination and status filtering
   - Payment processing with multiple payment methods (Cash, Card, Digital)
   - Bill generation from ready orders
   - PDF download functionality
   - Success/error messaging with alerts

2. **ApplicationSettings Component** (new)
   - Tabbed admin interface for centralized configuration management
   - Three configuration sections:
     - **Billing Settings**: Tax rate, default payment method, invoice prefix
     - **Restaurant Information**: Name, address, phone, email, tax ID
     - **Invoice Customization**: Header/footer text, paper size, logo/QR code/item details options

3. **BillingService** (enhanced)
   - 13 new static methods for API integration
   - Full wrapper for all 20+ billing endpoints
   - Error handling and response mapping
   - Type-safe API interactions

4. **OrderService** (enhanced)
   - Added `getReadyOrders()` method for bill generation workflow
   - Returns orders with READY status and complete details

#### Architecture

The billing system follows a clean, pragmatic architecture:

```
BillingManagement.tsx (Main Interface)
├── List Bills with filtering
├── Process Payments
├── Generate Bill from Order
├── Download PDF
└── Uses BillingService for all API calls

ApplicationSettings.tsx (Admin Configuration)
├── Billing Config Tab
├── Restaurant Info Tab
├── Invoice Customization Tab
└── Uses BillingService for config persistence

BillingService (API Wrapper)
├── Bill Management Methods
├── Payment Processing Methods
├── Reporting Methods
├── Configuration Methods
└── Uses apiClient for HTTP requests
```

#### Key Components & Methods

**BillingManagement.tsx**
- State: bills, selectedBill, paymentDialogOpen, generateBillDialogOpen, readyOrders, etc.
- Methods: 
  - `handleGenerateBill()` - Creates bill from selected order
  - `handleProcessPayment()` - Processes payment with payment method
  - `handleDownloadPDF()` - Generates and downloads invoice PDF

**ApplicationSettings.tsx**
- 3 tabbed sections for configuration
- Admin-only access (role: ADMIN)
- Save handlers for each configuration section
- Success/error notifications

**BillingService.ts** (Key Methods)
- `generateBill(orderId, taxRate?)` - Create bill from order
- `processPayment(billId, paymentData)` - Handle payment
- `calculateBillTotals(orderId)` - Pre-bill calculation
- `getBillingConfig()` / `updateBillingConfig()` - Tax and payment settings
- `getRestaurantInfo()` / `updateRestaurantInfo()` - Restaurant metadata
- `getPDFOptions()` / `updatePDFOptions()` - Invoice customization
- `getTodaysPaidBills()` / `getRevenueSummary()` - Reporting methods

#### Backend API Endpoints (20+)

**Bill Management** (6 endpoints)
- POST /api/billing/bills - Create bill
- GET /api/billing/bills - List bills with filters
- GET /api/billing/bills/:id - Get bill details
- PATCH /api/billing/bills/:id - Update bill
- POST /api/billing/bills/:id/cancel - Cancel bill
- POST /api/billing/bills/:id/reopen - Reopen bill

**Payment Processing** (4 endpoints)
- POST /api/billing/payments - Process payment
- GET /api/billing/payments/:id - Get payment details
- POST /api/billing/payments/:id/refund - Refund payment
- GET /api/billing/payments/bills/:billId - Get bill payments

**Reporting** (4 endpoints)
- GET /api/reports/revenue-summary - Revenue metrics
- GET /api/reports/bills/today - Today's paid bills
- GET /api/billing/revenue - Detailed revenue report
- GET /api/billing/payment-methods - Payment method breakdown

**Configuration** (3 endpoints)
- GET/PUT /api/billing/config - Billing settings
- GET/PUT /api/billing/restaurant-info - Restaurant metadata
- GET/PUT /api/billing/pdf-options - Invoice customization

**Restaurant Info** (2 endpoints)
- GET /api/billing/restaurant-info - Get restaurant details
- PUT /api/billing/restaurant-info - Update restaurant details

**PDF Generation** (2 endpoints)
- POST /api/billing/bills/:id/pdf - Generate PDF
- GET /api/billing/invoices/:id - Download invoice

#### Types & Interfaces (billing.ts)

```typescript
BillingConfig {
  taxRate: number;
  defaultPaymentMethod: PaymentMethod;
  invoicePrefix: string;
  enableAutoGeneration?: boolean;
}

RestaurantInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  taxId: string;
  logo?: string;
  updatedAt: string;
}

PDFOptions {
  headerText?: string;
  footerText?: string;
  paperSize: 'A4' | 'Letter' | 'Receipt';
  showLogo: boolean;
  showQRCode: boolean;
  includeItemDetails: boolean;
}

BillCalculation {
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  taxRate: number;
}
```

#### User Roles & Access

- **Admin**: Full access to ApplicationSettings and all billing functions
- **Manager**: BillingManagement access, view configurations (read-only)
- **Cashier**: BillingManagement with payment processing
- **Other roles**: No billing access

#### Routing

- `/billing` - BillingManagement component (Admin, Manager, Cashier)
- `/settings` - ApplicationSettings component (Admin only)

Both routes integrated into main navigation menu.

#### Design Decisions

1. **Consolidated Approach**: Single BillingManagement component handles all billing workflows instead of separate CashierWorkflow, BillingReports, and BillingConfiguration components
2. **Centralized Settings**: ApplicationSettings provides single source of truth for all app-level configurations
3. **Clean API Wrapper**: BillingService encapsulates all 20+ API methods with consistent error handling
4. **Type Safety**: Comprehensive TypeScript interfaces for all billing data structures
5. **Pragmatic Architecture**: Focused on maintainability and developer experience

---

## Latest Updates - Kitchen Display System

### Kitchen Display Data Fixes

The Kitchen Display system now properly displays table numbers and menu item names instead of "Unknown" values.

#### What Was Fixed
- Backend API endpoint `/orders/kitchen` now returns complete order details
- Table numbers are properly displayed (e.g., "Table 5")
- Menu item names and descriptions are included
- All order items show quantities with accurate menu data

#### Technical Changes
1. **orderRepository.ts**: Added `findOrdersByStatusWithDetails()` method with SQL JOINs
   - Joins orders with tables table for table numbers
   - Joins with menu_items for complete item details
   
2. **orderService.ts**: Updated `getKitchenOrders()` to use enhanced data-fetching method

3. **Frontend**: KitchenDisplay.tsx already had proper fallback handling

#### API Response Structure
Orders now include:
```json
{
  "table": {
    "id": "uuid",
    "number": 5
  },
  "items": [{
    "menuItem": {
      "id": "uuid",
      "name": "Grilled Chicken",
      "description": "Marinated chicken breast",
      "price": 12.99
    }
  }]
}
```

---

# Dashboard & Reporting Integration

## Overview

The dashboard has been enhanced with comprehensive reporting and analytics features. All reports and metrics that were previously only accessible through the `/reports` route are now integrated directly into the main dashboard for quick at-a-glance insights.

## New Components

### 1. DashboardKPIs.tsx
Displays five key performance indicators with real-time metrics:
- **Today's Revenue**: Current day revenue with trend comparison to yesterday
- **Today's Orders**: Number of orders placed today with trend analysis
- **Average Order Value**: Current average order value with trend comparison
- **Weekly Revenue**: Total revenue for the week with growth percentage
- **Top Item**: Best-selling menu item with quantity sold

Each KPI card shows:
- Current value with formatted currency/units
- Trend indicator (% change vs. previous period)
- Loading state with skeleton
- Color-coded visual hierarchy

### 2. RecentOrders.tsx
Displays the 10 most recent orders with quick access details:
- Order ID (shortened)
- Table number
- Total amount
- Order status (with color-coded chips)
- Time elapsed since order placement
- View button for full order details

Features:
- Modal dialog showing complete order details
- List of items in each order with menu item names
- Waiter information
- Special instructions display
- Item-level pricing calculation

### 3. SalesTrends.tsx
Displays sales trends and popular items:

**Weekly Trends Section:**
- Revenue growth percentage
- Order growth percentage
- Daily breakdown for the week
- Visual progress bars for growth metrics

**Top Selling Items Section:**
- Ranked list of top 5 best-performing items
- Quantity sold per item
- Number of orders containing the item
- Revenue contribution visualization

## Backend Enhancements

### New API Endpoint
**GET /api/reports/recent-orders**
- Query parameters: `limit` (1-100, default: 10)
- Returns recent orders with complete details including:
  - Order information (ID, status, amounts)
  - Table and waiter details
  - Menu items with names and descriptions
  - Special instructions
  - Pagination information

### Existing Endpoints Enhanced
- **GET /api/reports/dashboard**: Already provides comprehensive metrics
  - Today's vs yesterday comparison
  - Weekly trends with growth analysis
  - Top items ranking
  - Performance metrics

## Integration with Dashboard

The main Dashboard component now displays:
1. Greeting section with user information
2. **KPI Cards** section showing the 5 key metrics
3. **Sales Trends** section (two-column grid):
   - Weekly trends with daily breakdown
   - Top selling items ranking
4. **Recent Orders** section with detailed order list
5. **Quick Access** cards for navigating to other modules

## Data Flow

```
Dashboard Component
├── DashboardKPIs
│   └── Calls /api/reports/dashboard
├── SalesTrends
│   └── Calls /api/reports/dashboard
├── RecentOrders
│   └── Calls /api/reports/recent-orders
└── Quick Access Cards
    └── Navigate to other modules
```

## Technical Details

### Frontend Technologies
- React Hooks (useState, useEffect)
- Material-UI v5 (Grid v2, Cards, Charts)
- TypeScript for type safety
- API client for HTTP requests

### Backend Technologies
- Express.js controllers and routes
- Knex.js query builder
- Repository pattern for data access
- Service layer for business logic

### Performance Optimizations
- Parallel API calls using Promise.all()
- Pagination for recent orders (limit 10)
- Cached data with state management
- Loading indicators and skeleton screens

## User Roles & Permissions

- **Managers**: Full access to all KPIs, trends, and order history
- **Waiters**: Access to recent orders only
- **Other roles**: Limited or no access based on role permissions

## Future Enhancements

1. Add real-time updates using WebSockets
2. Interactive charts (using Chart.js or Recharts)
3. Custom date range selection for trends
4. Export functionality for reports
5. Drill-down capabilities to detailed metrics
6. Customizable dashboard widgets
7. Performance benchmarking and alerts
