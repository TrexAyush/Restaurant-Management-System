import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import io from 'socket.io-client';

interface WebSocketContextType {
  socket: ReturnType<typeof io> | null;
  isConnected: boolean;
  connectionError: string | null;
  subscribeToTableStatus: () => void;
  unsubscribeFromTableStatus: () => void;
  subscribeToOrderStatus: () => void;
  unsubscribeFromOrderStatus: () => void;
  subscribeToKitchenOrders: () => void;
  unsubscribeFromKitchenOrders: () => void;
  subscribeToTable: (tableId: string) => void;
  unsubscribeFromTable: (tableId: string) => void;
  subscribeToOrder: (orderId: string) => void;
  unsubscribeFromOrder: (orderId: string) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<ReturnType<typeof io> | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    // Get auth token from localStorage
    const token = localStorage.getItem('token');
    
    if (!token) {
      setConnectionError('No authentication token found');
      return;
    }

    // Initialize socket connection
    const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:3001', {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling']
    });

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      setConnectionError(null);
    });

    newSocket.on('disconnect', (reason: string) => {
      console.log('WebSocket disconnected:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error: any) => {
      console.error('WebSocket connection error:', error);
      setConnectionError(error.message);
      setIsConnected(false);
    });

    newSocket.on('connection:confirmed', (data: any) => {
      console.log('WebSocket connection confirmed:', data);
    });

    // Set up event listeners for real-time updates
    newSocket.on('table:status-updated', (payload: any) => {
      console.log('Table status updated:', payload);
      // Dispatch custom event for components to listen to
      window.dispatchEvent(new CustomEvent('tableStatusUpdate', { detail: payload }));
    });

    newSocket.on('table:occupancy-updated', (payload: any) => {
      console.log('Table occupancy updated:', payload);
      window.dispatchEvent(new CustomEvent('tableOccupancyUpdate', { detail: payload }));
    });

    newSocket.on('table:created', (payload: any) => {
      console.log('Table created:', payload);
      window.dispatchEvent(new CustomEvent('tableCreated', { detail: payload }));
    });

    newSocket.on('table:deleted', (payload: any) => {
      console.log('Table deleted:', payload);
      window.dispatchEvent(new CustomEvent('tableDeleted', { detail: payload }));
    });

    newSocket.on('table:capacity-modified', (payload: any) => {
      console.log('Table capacity modified:', payload);
      window.dispatchEvent(new CustomEvent('tableCapacityModified', { detail: payload }));
    });

    newSocket.on('order:created', (payload: any) => {
      console.log('Order created:', payload);
      window.dispatchEvent(new CustomEvent('orderCreated', { detail: payload }));
    });

    newSocket.on('order:updated', (payload: any) => {
      console.log('Order updated:', payload);
      window.dispatchEvent(new CustomEvent('orderUpdated', { detail: payload }));
    });

    newSocket.on('order:status-updated', (payload: any) => {
      console.log('Order status updated:', payload);
      window.dispatchEvent(new CustomEvent('orderStatusUpdate', { detail: payload }));
    });

    newSocket.on('order:new-for-kitchen', (payload: any) => {
      console.log('New order for kitchen:', payload);
      window.dispatchEvent(new CustomEvent('newOrderForKitchen', { detail: payload }));
    });

    newSocket.on('order:ready-for-service', (payload: any) => {
      console.log('Order ready for service:', payload);
      window.dispatchEvent(new CustomEvent('orderReadyForService', { detail: payload }));
    });

    newSocket.on('notification', (payload: any) => {
      console.log('Notification received:', payload);
      window.dispatchEvent(new CustomEvent('notification', { detail: payload }));
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.close();
    };
  }, []);

  // Subscription methods
  const subscribeToTableStatus = useCallback(() => {
    if (socket) {
      socket.emit('subscribe:table-status');
    }
  }, [socket]);

  const unsubscribeFromTableStatus = useCallback(() => {
    if (socket) {
      socket.emit('unsubscribe:table-status');
    }
  }, [socket]);

  const subscribeToOrderStatus = useCallback(() => {
    if (socket) {
      socket.emit('subscribe:order-status');
    }
  }, [socket]);

  const unsubscribeFromOrderStatus = useCallback(() => {
    if (socket) {
      socket.emit('unsubscribe:order-status');
    }
  }, [socket]);

  const subscribeToKitchenOrders = useCallback(() => {
    if (socket) {
      socket.emit('subscribe:kitchen-orders');
    }
  }, [socket]);

  const unsubscribeFromKitchenOrders = useCallback(() => {
    if (socket) {
      socket.emit('unsubscribe:kitchen-orders');
    }
  }, [socket]);

  const subscribeToTable = useCallback((tableId: string) => {
    if (socket && tableId) {
      socket.emit('subscribe:table', tableId);
    }
  }, [socket]);

  const unsubscribeFromTable = useCallback((tableId: string) => {
    if (socket && tableId) {
      socket.emit('unsubscribe:table', tableId);
    }
  }, [socket]);

  const subscribeToOrder = useCallback((orderId: string) => {
    if (socket && orderId) {
      socket.emit('subscribe:order', orderId);
    }
  }, [socket]);

  const unsubscribeFromOrder = useCallback((orderId: string) => {
    if (socket && orderId) {
      socket.emit('unsubscribe:order', orderId);
    }
  }, [socket]);

  const value: WebSocketContextType = {
    socket,
    isConnected,
    connectionError,
    subscribeToTableStatus,
    unsubscribeFromTableStatus,
    subscribeToOrderStatus,
    unsubscribeFromOrderStatus,
    subscribeToKitchenOrders,
    unsubscribeFromKitchenOrders,
    subscribeToTable,
    unsubscribeFromTable,
    subscribeToOrder,
    unsubscribeFromOrder
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};