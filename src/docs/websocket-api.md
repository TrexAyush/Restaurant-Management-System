# WebSocket API Documentation

## Overview

The Restaurant Management System provides real-time updates for table status changes through WebSocket connections. This allows all connected clients to receive immediate notifications when tables are created, updated, occupied, or cleared.

## Connection

### Endpoint
```
ws://localhost:3001
```

### Authentication
WebSocket connections require authentication using JWT tokens. Include the token in the connection handshake:

```javascript
// Using socket.io-client
import io from 'socket.io-client';

const socket = io('http://localhost:3001', {
  auth: {
    token: 'your-jwt-token-here'
  }
});
```

## Events

### Client to Server Events

#### Subscribe to Table Status Updates
```javascript
socket.emit('subscribe:table-status');
```

#### Unsubscribe from Table Status Updates
```javascript
socket.emit('unsubscribe:table-status');
```

#### Subscribe to Specific Table Updates
```javascript
socket.emit('subscribe:table', 'table-id-here');
```

#### Unsubscribe from Specific Table Updates
```javascript
socket.emit('unsubscribe:table', 'table-id-here');
```

#### Subscribe to Order Status Updates
```javascript
socket.emit('subscribe:order-status');
```

#### Unsubscribe from Order Status Updates
```javascript
socket.emit('unsubscribe:order-status');
```

#### Subscribe to Kitchen Orders (Kitchen Staff Only)
```javascript
socket.emit('subscribe:kitchen-orders');
```

#### Unsubscribe from Kitchen Orders
```javascript
socket.emit('unsubscribe:kitchen-orders');
```

#### Subscribe to Specific Order Updates
```javascript
socket.emit('subscribe:order', 'order-id-here');
```

#### Unsubscribe from Specific Order Updates
```javascript
socket.emit('unsubscribe:order', 'order-id-here');
```

### Server to Client Events

#### Connection Confirmed
Sent when a client successfully connects and authenticates.

```javascript
socket.on('connection:confirmed', (data) => {
  console.log('Connected:', data);
  // {
  //   message: 'Connected to real-time updates',
  //   user: {
  //     userId: 'user-id',
  //     username: 'username',
  //     role: 'manager'
  //   },
  //   timestamp: '2024-01-24T10:00:00.000Z'
  // }
});
```

#### Table Status Updated
Sent when a table's status changes (available, occupied, reserved, out_of_service).

```javascript
socket.on('table:status-updated', (payload) => {
  console.log('Table status updated:', payload);
  // {
  //   type: 'table-status-update',
  //   data: {
  //     tableId: 'table-id',
  //     table: {
  //       id: 'table-id',
  //       number: 5,
  //       capacity: 4,
  //       status: 'occupied',
  //       currentOrderId: 'order-id',
  //       occupiedAt: '2024-01-24T10:00:00.000Z',
  //       createdAt: '2024-01-24T09:00:00.000Z',
  //       updatedAt: '2024-01-24T10:00:00.000Z'
  //     },
  //     timestamp: '2024-01-24T10:00:00.000Z',
  //     updatedBy: 'waiter-username'
  //   },
  //   timestamp: '2024-01-24T10:00:00.000Z'
  // }
});
```

#### Table Occupancy Updated
Sent when customers are seated at a table.

```javascript
socket.on('table:occupancy-updated', (payload) => {
  console.log('Table occupancy updated:', payload);
  // {
  //   type: 'table-occupancy-update',
  //   data: {
  //     tableId: 'table-id',
  //     table: { /* table object */ },
  //     partySize: 4,
  //     orderId: 'order-id',
  //     timestamp: '2024-01-24T10:00:00.000Z',
  //     updatedBy: 'waiter-username'
  //   },
  //   timestamp: '2024-01-24T10:00:00.000Z'
  // }
});
```

#### Table Created
Sent to managers and admins when a new table is created.

```javascript
socket.on('table:created', (payload) => {
  console.log('Table created:', payload);
  // {
  //   type: 'table-created',
  //   data: {
  //     table: { /* table object */ },
  //     createdBy: 'manager-username',
  //     timestamp: '2024-01-24T10:00:00.000Z'
  //   }
  // }
});
```

#### Table Deleted
Sent to managers and admins when a table is deleted.

```javascript
socket.on('table:deleted', (payload) => {
  console.log('Table deleted:', payload);
  // {
  //   type: 'table-deleted',
  //   data: {
  //     tableId: 'table-id',
  //     tableNumber: 5,
  //     deletedBy: 'manager-username',
  //     timestamp: '2024-01-24T10:00:00.000Z'
  //   }
  // }
});
```

#### Table Capacity Modified
Sent when a table's capacity is changed.

```javascript
socket.on('table:capacity-modified', (payload) => {
  console.log('Table capacity modified:', payload);
  // {
  //   type: 'table-capacity-modified',
  //   data: {
  //     table: { /* table object */ },
  //     oldCapacity: 4,
  //     newCapacity: 6,
  //     modifiedBy: 'manager-username',
  //     timestamp: '2024-01-24T10:00:00.000Z'
  //   }
  // }
});
```

#### Notifications
General notifications sent to specific users or roles.

```javascript
socket.on('notification', (notification) => {
  console.log('Notification:', notification);
  // {
  //   type: 'info',
  //   title: 'Table Status Update',
  //   message: 'Table 5 is now available',
  //   data: { /* additional data */ },
  //   timestamp: '2024-01-24T10:00:00.000Z'
  // }
});
```

#### Order Created
Sent when a new order is created.

```javascript
socket.on('order:created', (payload) => {
  console.log('Order created:', payload);
  // {
  //   type: 'order-created',
  //   data: {
  //     order: {
  //       id: 'order-id',
  //       tableId: 'table-id',
  //       waiterId: 'waiter-id',
  //       status: 'placed',
  //       items: [/* order items */],
  //       totalAmount: 45.75,
  //       createdAt: '2024-01-24T10:00:00.000Z',
  //       updatedAt: '2024-01-24T10:00:00.000Z'
  //     },
  //     createdBy: 'waiter-username',
  //     timestamp: '2024-01-24T10:00:00.000Z'
  //   }
  // }
});
```

#### Order Updated
Sent when an order is modified (items added/removed/changed).

```javascript
socket.on('order:updated', (payload) => {
  console.log('Order updated:', payload);
  // {
  //   type: 'order-updated',
  //   data: {
  //     order: { /* updated order object */ },
  //     updatedBy: 'waiter-username',
  //     timestamp: '2024-01-24T10:00:00.000Z'
  //   }
  // }
});
```

#### Order Status Updated
Sent when an order's status changes (placed → preparing → ready → served).

```javascript
socket.on('order:status-updated', (payload) => {
  console.log('Order status updated:', payload);
  // {
  //   type: 'order-status-update',
  //   data: {
  //     orderId: 'order-id',
  //     order: { /* order object */ },
  //     previousStatus: 'placed',
  //     newStatus: 'preparing',
  //     timestamp: '2024-01-24T10:00:00.000Z',
  //     updatedBy: 'kitchen-staff-username'
  //   }
  // }
});
```

#### New Order for Kitchen
Sent to kitchen staff when a new order is placed.

```javascript
socket.on('order:new-for-kitchen', (payload) => {
  console.log('New order for kitchen:', payload);
  // Same structure as order:status-updated
});
```

#### Order Ready for Service
Sent to waiters when an order is ready to be served.

```javascript
socket.on('order:ready-for-service', (payload) => {
  console.log('Order ready for service:', payload);
  // Same structure as order:status-updated
});
```

## Role-Based Broadcasting

The WebSocket service automatically joins users to role-based rooms:
- `role:admin` - Admin users
- `role:manager` - Manager users  
- `role:waiter` - Waiter users
- `role:kitchen_staff` - Kitchen staff users
- `role:cashier` - Cashier users

Some events are only sent to specific roles:
- Table creation/deletion events → Managers and Admins only
- Order creation/updates → All subscribed users, Kitchen staff for new orders
- Order ready notifications → Waiters and Managers
- Kitchen order notifications → Kitchen staff and Managers
- All other events → All subscribed users

## Error Handling

### Authentication Errors
If authentication fails, the connection will be rejected with an error message:

```javascript
socket.on('connect_error', (error) => {
  console.error('Connection failed:', error.message);
  // Possible errors:
  // - 'Authentication token required'
  // - 'Invalid authentication token'
  // - 'Authentication failed'
});
```

### Connection Issues
Handle disconnections and reconnections:

```javascript
socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
});

socket.on('reconnect', (attemptNumber) => {
  console.log('Reconnected after', attemptNumber, 'attempts');
});
```

## Example Implementation

```javascript
import io from 'socket.io-client';

class TableStatusManager {
  constructor(token) {
    this.socket = io('http://localhost:3001', {
      auth: { token }
    });
    
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    // Connection events
    this.socket.on('connection:confirmed', (data) => {
      console.log('Connected as:', data.user.username);
      this.subscribeToTableUpdates();
    });
    
    // Table events
    this.socket.on('table:status-updated', (payload) => {
      this.updateTableInUI(payload.data.table);
    });
    
    this.socket.on('table:occupancy-updated', (payload) => {
      this.updateTableOccupancy(payload.data);
    });
    
    this.socket.on('table:created', (payload) => {
      this.addTableToUI(payload.data.table);
    });
    
    this.socket.on('table:deleted', (payload) => {
      this.removeTableFromUI(payload.data.tableId);
    });
    
    // Error handling
    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection failed:', error.message);
    });
  }
  
  subscribeToTableUpdates() {
    this.socket.emit('subscribe:table-status');
  }
  
  subscribeToTable(tableId) {
    this.socket.emit('subscribe:table', tableId);
  }
  
  updateTableInUI(table) {
    // Update your UI with the new table data
    console.log(`Table ${table.number} is now ${table.status}`);
  }
  
  updateTableOccupancy(data) {
    // Update occupancy information in UI
    console.log(`Table ${data.table.number} seated ${data.partySize} customers`);
  }
  
  addTableToUI(table) {
    // Add new table to UI
    console.log(`New table ${table.number} created`);
  }
  
  removeTableFromUI(tableId) {
    // Remove table from UI
    console.log(`Table deleted: ${tableId}`);
  }
  
  disconnect() {
    this.socket.disconnect();
  }
}

// Usage
const tableManager = new TableStatusManager('your-jwt-token');
```

## WebSocket Status Endpoint

You can check the WebSocket service status via REST API:

```
GET /api/tables/websocket-status
Authorization: Bearer <jwt-token>
```

Response:
```json
{
  "success": true,
  "data": {
    "connectedUsers": 5,
    "usersByRole": {
      "admin": 1,
      "manager": 2,
      "waiter": 2,
      "kitchen_staff": 0,
      "cashier": 0
    },
    "status": "active"
  }
}
```