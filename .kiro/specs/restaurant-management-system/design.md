# Restaurant Management System Design Document

## Overview

The Restaurant Management System (RMS) is designed as a multi-tier, role-based web application that centralizes restaurant operations through a clean separation of concerns. The system employs a client-server architecture with RESTful APIs, implementing the MVC pattern for maintainability and scalability. The design prioritizes real-time updates for order status, concurrent user support, and data consistency across all operations.

The system serves five distinct user roles (Admin, Manager, Waiter, Kitchen Staff, Cashier) through a unified interface with role-specific views and permissions. Core business logic is encapsulated in service layers, with data persistence handled through a repository pattern interfacing with a relational database.

## Architecture

The RMS follows a layered architecture pattern:

```
┌─────────────────────────────────────────┐
│           Presentation Layer            │
│     (React Frontend / Web Interface)    │
├─────────────────────────────────────────┤
│            API Gateway Layer            │
│        (Express.js REST APIs)           │
├─────────────────────────────────────────┤
│           Business Logic Layer          │
│    (Services, Validators, Processors)   │
├─────────────────────────────────────────┤
│           Data Access Layer             │
│      (Repositories, ORM, Mappers)       │
├─────────────────────────────────────────┤
│            Database Layer               │
│         (PostgreSQL Database)           │
└─────────────────────────────────────────┘
```

**Technology Stack:**
- **Frontend**: React with TypeScript for type safety and component reusability
- **Backend**: Node.js with Express.js for RESTful API development
- **Database**: PostgreSQL for ACID compliance and complex queries
- **Authentication**: JWT-based stateless authentication
- **Real-time Updates**: WebSocket connections for order status updates
- **PDF Generation**: PDFKit for invoice generation

## Components and Interfaces

### Core Components

**Authentication Service**
- Handles user login/logout and JWT token management
- Implements role-based access control (RBAC)
- Manages session lifecycle and security policies

**Menu Management Service**
- CRUD operations for menu items and categories
- Availability toggle and pricing management
- Integration with inventory for stock-based availability

**Table Management Service**
- Table configuration and capacity management
- Real-time occupancy status tracking
- Table assignment and reservation handling

**Order Management Service**
- Order lifecycle management (Placed → Preparing → Ready → Served)
- Order modification and cancellation logic
- Integration with inventory for automatic stock deduction

**Billing Service**
- Bill calculation with configurable tax rates
- PDF invoice generation and export
- Payment processing and transaction recording

**Inventory Management Service**
- Stock level tracking and automatic deduction
- Low-stock alert generation and threshold management
- Ingredient-to-menu-item relationship management

**Reporting Service**
- Sales analytics and trend analysis
- Popular item tracking and revenue summaries
- Configurable report generation (daily, weekly, custom periods)

### API Interfaces

**Authentication Endpoints**
```
POST /api/auth/login
POST /api/auth/logout
GET /api/auth/profile
PUT /api/auth/change-password
```

**Menu Management Endpoints**
```
GET /api/menu/items
POST /api/menu/items
PUT /api/menu/items/:id
DELETE /api/menu/items/:id
PUT /api/menu/items/:id/availability
```

**Order Management Endpoints**
```
GET /api/orders
POST /api/orders
PUT /api/orders/:id
PUT /api/orders/:id/status
GET /api/orders/table/:tableId
```

**Billing Endpoints**
```
POST /api/bills/generate
GET /api/bills/:id/pdf
PUT /api/bills/:id/payment
```

## Data Models

### User Model
```typescript
interface User {
  id: string;
  username: string;
  passwordHash: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager', 
  WAITER = 'waiter',
  KITCHEN_STAFF = 'kitchen_staff',
  CASHIER = 'cashier'
}
```

### Menu Item Model
```typescript
interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: MenuCategory;
  isAvailable: boolean;
  ingredients: IngredientUsage[];
  createdAt: Date;
  updatedAt: Date;
}

interface IngredientUsage {
  ingredientId: string;
  quantity: number;
  unit: string;
}
```

### Order Model
```typescript
interface Order {
  id: string;
  tableId: string;
  waiterId: string;
  status: OrderStatus;
  items: OrderItem[];
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

enum OrderStatus {
  PLACED = 'placed',
  PREPARING = 'preparing',
  READY = 'ready',
  SERVED = 'served'
}

interface OrderItem {
  menuItemId: string;
  quantity: number;
  unitPrice: number;
  specialInstructions?: string;
}
```

### Table Model
```typescript
interface Table {
  id: string;
  number: number;
  capacity: number;
  status: TableStatus;
  currentOrderId?: string;
  occupiedAt?: Date;
}

enum TableStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  RESERVED = 'reserved',
  OUT_OF_SERVICE = 'out_of_service'
}
```

### Inventory Model
```typescript
interface InventoryItem {
  id: string;
  name: string;
  currentStock: number;
  unit: string;
  lowStockThreshold: number;
  costPerUnit: number;
  supplierId?: string;
  lastRestocked: Date;
}
```

### Bill Model
```typescript
interface Bill {
  id: string;
  orderId: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod?: PaymentMethod;
  paymentStatus: PaymentStatus;
  generatedAt: Date;
  paidAt?: Date;
}

enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  DIGITAL = 'digital'
}

enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  CANCELLED = 'cancelled'
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Authentication Properties

**Property 1: Valid credential authentication**
*For any* user with valid credentials and assigned role, authentication should succeed and grant access appropriate to their role
**Validates: Requirements 1.1**

**Property 2: Invalid credential rejection**
*For any* invalid credential combination, authentication should be rejected and system security maintained
**Validates: Requirements 1.2**

**Property 3: Session termination enforcement**
*For any* expired or logged-out session, subsequent requests should require re-authentication
**Validates: Requirements 1.3**

**Property 4: Role-based access control**
*For any* user and system function, access should be granted only if the user's role has appropriate permissions
**Validates: Requirements 1.4**

**Property 5: Role assignment consistency**
*For any* user account created or modified by an Admin, the assigned role should immediately determine the user's access permissions
**Validates: Requirements 1.5**

### Menu Management Properties

**Property 6: Menu item storage completeness**
*For any* menu item created by a Manager, the system should store all required attributes (category, price, availability status)
**Validates: Requirements 2.1**

**Property 7: Menu update propagation**
*For any* menu item modification, changes should be immediately reflected across all ordering interfaces
**Validates: Requirements 2.2**

**Property 8: Availability toggle enforcement**
*For any* menu item with availability toggled to false, ordering attempts should be prevented while preserving item data
**Validates: Requirements 2.3**

**Property 9: Category organization consistency**
*For any* set of menu items with assigned categories, the system should organize and display them grouped by category
**Validates: Requirements 2.4**

**Property 10: Deletion with historical preservation**
*For any* menu item deletion, the item should be removed from active menus while remaining accessible in historical order data
**Validates: Requirements 2.5**

### Table Management Properties

**Property 11: Table creation uniqueness**
*For any* table created by a Manager, the system should assign a unique identifier and store the specified capacity
**Validates: Requirements 3.1**

**Property 12: Occupancy status tracking**
*For any* table when customers are seated, the status should update to occupied and occupancy time should be tracked
**Validates: Requirements 3.2**

**Property 13: Availability status updates**
*For any* table that becomes available, the status should update to available for new customer seating
**Validates: Requirements 3.3**

**Property 14: Real-time status accuracy**
*For any* table status query, the displayed information should match the actual current occupancy state
**Validates: Requirements 3.4**

**Property 15: Capacity modification validation**
*For any* table capacity modification, the system should validate the new capacity against current occupancy before updating
**Validates: Requirements 3.5**

### Order Management Properties

**Property 16: Order creation association**
*For any* order created by a Waiter for a table, the order should be properly associated with the table and initialized with "Placed" status
**Validates: Requirements 4.1**

**Property 17: Order item validation and calculation**
*For any* items added to an order, the system should validate availability and maintain accurate running totals
**Validates: Requirements 4.2**

**Property 18: Order modification consistency**
*For any* order modification before kitchen preparation, the system should update details and recalculate totals correctly
**Validates: Requirements 4.3**

**Property 19: Order status flow compliance**
*For any* order status change, the transition should follow the required flow: Placed → Preparing → Ready → Served
**Validates: Requirements 4.4**

**Property 20: Status update propagation**
*For any* order status update by Kitchen Staff, the change should be reflected to all relevant users immediately
**Validates: Requirements 4.5**

### Billing Properties

**Property 21: Bill calculation accuracy**
*For any* completed order, bill generation should calculate correct totals including all items and applicable taxes
**Validates: Requirements 5.1**

**Property 22: Tax calculation correctness**
*For any* bill with configurable tax rates, taxes should be applied correctly to appropriate items
**Validates: Requirements 5.2**

**Property 23: PDF invoice completeness**
*For any* finalized bill, the generated PDF should contain all required transaction details
**Validates: Requirements 5.3**

**Property 24: Payment processing consistency**
*For any* payment processed, the system should record the payment method and update order status to completed
**Validates: Requirements 5.4**

**Property 25: Bill modification authorization**
*For any* bill modification request, the system should allow authorized adjustments only before payment processing
**Validates: Requirements 5.5**

### Inventory Properties

**Property 26: Automatic inventory deduction**
*For any* order preparation using ingredients, the system should automatically deduct correct quantities from inventory levels
**Validates: Requirements 6.1**

**Property 27: Low-stock alert generation**
*For any* inventory item falling below its defined threshold, the system should generate appropriate low-stock alerts
**Validates: Requirements 6.2**

**Property 28: Inventory update recording**
*For any* inventory quantity update by a Manager, the system should record changes and update available stock levels
**Validates: Requirements 6.3**

**Property 29: New ingredient initialization**
*For any* new ingredient added to inventory, the system should create complete records with initial quantities and thresholds
**Validates: Requirements 6.4**

**Property 30: Inventory reporting accuracy**
*For any* inventory report generation, the system should provide accurate current stock levels and complete usage history
**Validates: Requirements 6.5**

### Reporting Properties

**Property 31: Daily report completeness**
*For any* daily sales report request, the system should include total revenue, order count, and popular items data
**Validates: Requirements 7.1**

**Property 32: Weekly analysis accuracy**
*For any* weekly sales analysis, the system should provide accurate trend analysis and comparative data across time periods
**Validates: Requirements 7.2**

**Property 33: Popularity ranking correctness**
*For any* item popularity report, menu items should be correctly ranked by order frequency and revenue contribution
**Validates: Requirements 7.3**

**Property 34: Revenue summary calculation**
*For any* revenue summary request, totals should be accurately calculated by time period, payment method, and category
**Validates: Requirements 7.4**

**Property 35: Report export format compliance**
*For any* report data export, the system should provide reports in standard formats suitable for further analysis
**Validates: Requirements 7.5**

### System Properties

**Property 36: Concurrent modification consistency**
*For any* simultaneous data modifications by multiple users, the system should handle conflicts and maintain data consistency
**Validates: Requirements 8.2**

**Property 37: Performance metrics collection**
*For any* system operation, performance metrics should be properly collected and made available for capacity planning
**Validates: Requirements 8.5**

## Error Handling

The system implements comprehensive error handling across all layers:

**Authentication Errors**
- Invalid credentials return standardized error responses
- Session expiry triggers automatic logout with user notification
- Role permission violations log security events and deny access gracefully

**Business Logic Errors**
- Order modifications after kitchen preparation are prevented with clear messaging
- Inventory insufficient stock prevents order placement with alternative suggestions
- Table capacity violations during seating are caught with capacity information

**Data Validation Errors**
- Input validation occurs at API boundaries with detailed field-level feedback
- Database constraint violations are caught and translated to user-friendly messages
- Concurrent modification conflicts are resolved with optimistic locking

**System Errors**
- Database connection failures trigger retry mechanisms with exponential backoff
- PDF generation failures provide fallback text-based invoices
- WebSocket connection drops automatically reconnect with state synchronization

**Error Response Format**
```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    timestamp: Date;
    requestId: string;
  }
}
```

## Testing Strategy

The RMS employs a comprehensive dual testing approach combining unit tests and property-based tests to ensure both specific functionality and general correctness across all system operations.

### Unit Testing Approach

Unit tests verify specific examples, integration points, and edge cases:

- **Authentication flows**: Login success/failure scenarios, role assignment verification
- **Menu operations**: Item creation, category assignment, availability toggles
- **Order processing**: Status transitions, item additions, modification restrictions
- **Billing calculations**: Tax applications, discount handling, payment recording
- **Inventory management**: Stock deductions, threshold alerts, restock operations
- **Report generation**: Specific date ranges, format validation, data accuracy

Unit tests focus on concrete scenarios and integration between components, providing confidence in specific use cases and error conditions.

### Property-Based Testing Approach

Property-based tests verify universal properties that should hold across all valid inputs using **fast-check** library for JavaScript/TypeScript. Each property-based test runs a minimum of 100 iterations with randomly generated inputs.

**Configuration Requirements:**
- Minimum 100 iterations per property test
- Each property test tagged with format: `**Feature: restaurant-management-system, Property {number}: {property_text}**`
- Each correctness property implemented by exactly one property-based test
- Tests focus on invariants, round-trip properties, and universal business rules

**Property Test Categories:**
- **Authentication invariants**: Role-based access control across all user/function combinations
- **Data consistency**: Order totals, inventory levels, table status synchronization
- **Business rule enforcement**: Order status flows, availability constraints, capacity limits
- **Calculation accuracy**: Billing totals, tax applications, inventory deductions
- **State transitions**: Order lifecycle, table occupancy, payment processing

**Generator Strategy:**
Property tests use intelligent generators that constrain inputs to valid business domains:
- User generators create valid role combinations with appropriate permissions
- Order generators ensure realistic item combinations and quantities
- Table generators respect capacity constraints and status transitions
- Menu item generators maintain price/category/availability consistency

The dual testing approach ensures comprehensive coverage: unit tests catch specific bugs and integration issues, while property tests verify that business rules hold universally across the entire input space, providing confidence in system correctness under all conditions.