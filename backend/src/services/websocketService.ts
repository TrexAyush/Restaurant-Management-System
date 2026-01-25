import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { Table } from '../models/Table';
import { Order } from '../models/Order';
import { UserRole, OrderStatus } from '../models/enums';

export interface AuthenticatedSocket {
  id: string;
  userId: string;
  userRole: UserRole;
  username: string;
}

export interface TableStatusUpdate {
  tableId: string;
  table: Table;
  timestamp: Date;
  updatedBy?: string | undefined;
}

export interface TableOccupancyUpdate {
  tableId: string;
  table: Table;
  partySize?: number;
  orderId?: string | undefined;
  timestamp: Date;
  updatedBy?: string | undefined;
}

export interface OrderStatusUpdate {
  orderId: string;
  order: Order;
  previousStatus: OrderStatus;
  newStatus: OrderStatus;
  timestamp: Date;
  updatedBy?: string | undefined;
}

export class WebSocketService {
  private io: SocketIOServer;
  private authenticatedSockets: Map<string, AuthenticatedSocket> = new Map();

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  /**
   * Set up authentication middleware for WebSocket connections
   */
  private setupMiddleware(): void {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
        
        if (!decoded || !decoded.userId) {
          return next(new Error('Invalid authentication token'));
        }

        // Store authenticated user info
        const authenticatedSocket: AuthenticatedSocket = {
          id: socket.id,
          userId: decoded.userId,
          userRole: decoded.role,
          username: decoded.username
        };

        this.authenticatedSockets.set(socket.id, authenticatedSocket);
        
        // Attach user info to socket for easy access
        (socket as any).user = authenticatedSocket;
        
        next();
      } catch (error) {
        next(new Error('Authentication failed'));
      }
    });
  }

  /**
   * Set up WebSocket event handlers
   */
  private setupEventHandlers(): void {
    this.io.on('connection', (socket) => {
      const user = (socket as any).user as AuthenticatedSocket;
      console.log(`User ${user.username} (${user.userRole}) connected via WebSocket`);

      // Join role-based rooms for targeted broadcasting
      socket.join(`role:${user.userRole}`);
      socket.join(`user:${user.userId}`);

      // Handle table status subscription
      socket.on('subscribe:table-status', () => {
        socket.join('table-status-updates');
        console.log(`User ${user.username} subscribed to table status updates`);
      });

      // Handle order status subscription
      socket.on('subscribe:order-status', () => {
        socket.join('order-status-updates');
        console.log(`User ${user.username} subscribed to order status updates`);
      });

      // Handle kitchen orders subscription (for kitchen staff)
      socket.on('subscribe:kitchen-orders', () => {
        if (user.userRole === UserRole.KITCHEN_STAFF || user.userRole === UserRole.MANAGER || user.userRole === UserRole.ADMIN) {
          socket.join('kitchen-orders');
          console.log(`User ${user.username} subscribed to kitchen orders`);
        }
      });

      // Handle table status unsubscription
      socket.on('unsubscribe:table-status', () => {
        socket.leave('table-status-updates');
        console.log(`User ${user.username} unsubscribed from table status updates`);
      });

      // Handle order status unsubscription
      socket.on('unsubscribe:order-status', () => {
        socket.leave('order-status-updates');
        console.log(`User ${user.username} unsubscribed from order status updates`);
      });

      // Handle kitchen orders unsubscription
      socket.on('unsubscribe:kitchen-orders', () => {
        socket.leave('kitchen-orders');
        console.log(`User ${user.username} unsubscribed from kitchen orders`);
      });

      // Handle specific table subscription
      socket.on('subscribe:table', (tableId: string) => {
        if (typeof tableId === 'string' && tableId.trim()) {
          socket.join(`table:${tableId}`);
          console.log(`User ${user.username} subscribed to table ${tableId} updates`);
        }
      });

      // Handle specific order subscription
      socket.on('subscribe:order', (orderId: string) => {
        if (typeof orderId === 'string' && orderId.trim()) {
          socket.join(`order:${orderId}`);
          console.log(`User ${user.username} subscribed to order ${orderId} updates`);
        }
      });

      // Handle specific table unsubscription
      socket.on('unsubscribe:table', (tableId: string) => {
        if (typeof tableId === 'string' && tableId.trim()) {
          socket.leave(`table:${tableId}`);
          console.log(`User ${user.username} unsubscribed from table ${tableId} updates`);
        }
      });

      // Handle specific order unsubscription
      socket.on('unsubscribe:order', (orderId: string) => {
        if (typeof orderId === 'string' && orderId.trim()) {
          socket.leave(`order:${orderId}`);
          console.log(`User ${user.username} unsubscribed from order ${orderId} updates`);
        }
      });

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        console.log(`User ${user.username} disconnected: ${reason}`);
        this.authenticatedSockets.delete(socket.id);
      });

      // Send initial connection confirmation
      socket.emit('connection:confirmed', {
        message: 'Connected to real-time updates',
        user: {
          userId: user.userId,
          username: user.username,
          role: user.userRole
        },
        timestamp: new Date()
      });
    });
  }

  /**
   * Broadcast table status update to all subscribed clients
   */
  public broadcastTableStatusUpdate(update: TableStatusUpdate): void {
    const payload = {
      type: 'table-status-update',
      data: update,
      timestamp: new Date()
    };

    // Broadcast to all users subscribed to table status updates
    this.io.to('table-status-updates').emit('table:status-updated', payload);
    
    // Also broadcast to users subscribed to this specific table
    this.io.to(`table:${update.tableId}`).emit('table:status-updated', payload);

    console.log(`Broadcasted table status update for table ${update.table.number} (${update.table.status})`);
  }

  /**
   * Broadcast table occupancy update to all subscribed clients
   */
  public broadcastTableOccupancyUpdate(update: TableOccupancyUpdate): void {
    const payload = {
      type: 'table-occupancy-update',
      data: update,
      timestamp: new Date()
    };

    // Broadcast to all users subscribed to table status updates
    this.io.to('table-status-updates').emit('table:occupancy-updated', payload);
    
    // Also broadcast to users subscribed to this specific table
    this.io.to(`table:${update.tableId}`).emit('table:occupancy-updated', payload);

    console.log(`Broadcasted table occupancy update for table ${update.table.number}`);
  }

  /**
   * Broadcast table creation to managers
   */
  public broadcastTableCreated(table: Table, createdBy?: string): void {
    const payload = {
      type: 'table-created',
      data: {
        table,
        createdBy,
        timestamp: new Date()
      }
    };

    // Only broadcast to managers and admins
    this.io.to('role:manager').emit('table:created', payload);
    this.io.to('role:admin').emit('table:created', payload);

    console.log(`Broadcasted table creation for table ${table.number}`);
  }

  /**
   * Broadcast table deletion to managers
   */
  public broadcastTableDeleted(tableId: string, tableNumber: number, deletedBy?: string): void {
    const payload = {
      type: 'table-deleted',
      data: {
        tableId,
        tableNumber,
        deletedBy,
        timestamp: new Date()
      }
    };

    // Only broadcast to managers and admins
    this.io.to('role:manager').emit('table:deleted', payload);
    this.io.to('role:admin').emit('table:deleted', payload);

    console.log(`Broadcasted table deletion for table ${tableNumber}`);
  }

  /**
   * Broadcast table capacity modification
   */
  public broadcastTableCapacityModified(table: Table, oldCapacity: number, modifiedBy?: string): void {
    const payload = {
      type: 'table-capacity-modified',
      data: {
        table,
        oldCapacity,
        newCapacity: table.capacity,
        modifiedBy,
        timestamp: new Date()
      }
    };

    // Broadcast to all users subscribed to table status updates
    this.io.to('table-status-updates').emit('table:capacity-modified', payload);
    
    // Also broadcast to users subscribed to this specific table
    this.io.to(`table:${table.id}`).emit('table:capacity-modified', payload);

    console.log(`Broadcasted table capacity modification for table ${table.number}: ${oldCapacity} -> ${table.capacity}`);
  }

  /**
   * Send notification to specific user
   */
  public sendNotificationToUser(userId: string, notification: {
    type: string;
    title: string;
    message: string;
    data?: any;
  }): void {
    const payload = {
      ...notification,
      timestamp: new Date()
    };

    this.io.to(`user:${userId}`).emit('notification', payload);
    console.log(`Sent notification to user ${userId}: ${notification.title}`);
  }

  /**
   * Send notification to users with specific role
   */
  public sendNotificationToRole(role: UserRole, notification: {
    type: string;
    title: string;
    message: string;
    data?: any;
  }): void {
    const payload = {
      ...notification,
      timestamp: new Date()
    };

    this.io.to(`role:${role}`).emit('notification', payload);
    console.log(`Sent notification to role ${role}: ${notification.title}`);
  }

  /**
   * Broadcast order creation to relevant users
   */
  public broadcastOrderCreated(order: Order, createdBy?: string): void {
    const payload = {
      type: 'order-created',
      data: {
        order,
        createdBy,
        timestamp: new Date()
      }
    };

    // Broadcast to all users subscribed to order status updates
    this.io.to('order-status-updates').emit('order:created', payload);
    
    // Broadcast to kitchen staff for new orders
    this.io.to('kitchen-orders').emit('order:created', payload);
    
    // Broadcast to users subscribed to the specific table
    this.io.to(`table:${order.tableId}`).emit('order:created', payload);

    console.log(`Broadcasted order creation for order ${order.id} at table ${order.tableId}`);
  }

  /**
   * Broadcast order update to relevant users
   */
  public broadcastOrderUpdated(order: Order, updatedBy?: string): void {
    const payload = {
      type: 'order-updated',
      data: {
        order,
        updatedBy,
        timestamp: new Date()
      }
    };

    // Broadcast to all users subscribed to order status updates
    this.io.to('order-status-updates').emit('order:updated', payload);
    
    // Broadcast to users subscribed to this specific order
    this.io.to(`order:${order.id}`).emit('order:updated', payload);
    
    // Broadcast to users subscribed to the specific table
    this.io.to(`table:${order.tableId}`).emit('order:updated', payload);

    console.log(`Broadcasted order update for order ${order.id}`);
  }

  /**
   * Broadcast order status update to all relevant users
   * Requirement 4.5: Status update propagation to all users
   */
  public broadcastOrderStatusUpdate(update: OrderStatusUpdate): void {
    const payload = {
      type: 'order-status-update',
      data: update,
      timestamp: new Date()
    };

    // Broadcast to all users subscribed to order status updates
    this.io.to('order-status-updates').emit('order:status-updated', payload);
    
    // Broadcast to users subscribed to this specific order
    this.io.to(`order:${update.orderId}`).emit('order:status-updated', payload);
    
    // Broadcast to users subscribed to the specific table
    this.io.to(`table:${update.order.tableId}`).emit('order:status-updated', payload);

    // Special handling for kitchen staff
    if (update.newStatus === OrderStatus.PLACED) {
      // New order for kitchen
      this.io.to('kitchen-orders').emit('order:new-for-kitchen', payload);
    } else if (update.newStatus === OrderStatus.READY) {
      // Order ready for waiters
      this.io.to('role:waiter').emit('order:ready-for-service', payload);
      this.io.to('role:manager').emit('order:ready-for-service', payload);
    }

    console.log(`Broadcasted order status update for order ${update.orderId}: ${update.previousStatus} -> ${update.newStatus}`);
  }

  /**
   * Get connected users count
   */
  public getConnectedUsersCount(): number {
    return this.authenticatedSockets.size;
  }

  /**
   * Get connected users by role
   */
  public getConnectedUsersByRole(): Record<UserRole, number> {
    const counts: Record<UserRole, number> = {
      [UserRole.ADMIN]: 0,
      [UserRole.MANAGER]: 0,
      [UserRole.WAITER]: 0,
      [UserRole.KITCHEN_STAFF]: 0,
      [UserRole.CASHIER]: 0
    };

    for (const socket of this.authenticatedSockets.values()) {
      counts[socket.userRole]++;
    }

    return counts;
  }

  /**
   * Get Socket.IO server instance
   */
  public getIO(): SocketIOServer {
    return this.io;
  }

  /**
   * Close WebSocket server
   */
  public close(): void {
    this.io.close();
    this.authenticatedSockets.clear();
  }
}

// Export singleton instance (will be initialized in server.ts)
let websocketService: WebSocketService | null = null;

export const initializeWebSocketService = (httpServer: HTTPServer): WebSocketService => {
  if (!websocketService) {
    websocketService = new WebSocketService(httpServer);
  }
  return websocketService;
};

export const getWebSocketService = (): WebSocketService => {
  if (!websocketService) {
    throw new Error('WebSocket service not initialized. Call initializeWebSocketService first.');
  }
  return websocketService;
};