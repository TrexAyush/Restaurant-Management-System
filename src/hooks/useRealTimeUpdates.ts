import { useEffect, useCallback } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';

interface UseRealTimeUpdatesOptions {
  onTableStatusUpdate?: (data: any) => void;
  onTableOccupancyUpdate?: (data: any) => void;
  onTableCreated?: (data: any) => void;
  onTableDeleted?: (data: any) => void;
  onTableCapacityModified?: (data: any) => void;
  onOrderCreated?: (data: any) => void;
  onOrderUpdated?: (data: any) => void;
  onOrderStatusUpdate?: (data: any) => void;
  onNewOrderForKitchen?: (data: any) => void;
  onOrderReadyForService?: (data: any) => void;
  onNotification?: (data: any) => void;
}

export const useRealTimeUpdates = (options: UseRealTimeUpdatesOptions = {}) => {
  const { isConnected } = useWebSocket();

  const {
    onTableStatusUpdate,
    onTableOccupancyUpdate,
    onTableCreated,
    onTableDeleted,
    onTableCapacityModified,
    onOrderCreated,
    onOrderUpdated,
    onOrderStatusUpdate,
    onNewOrderForKitchen,
    onOrderReadyForService,
    onNotification
  } = options;

  // Event handlers
  const handleTableStatusUpdate = useCallback((event: CustomEvent) => {
    if (onTableStatusUpdate) {
      onTableStatusUpdate(event.detail);
    }
  }, [onTableStatusUpdate]);

  const handleTableOccupancyUpdate = useCallback((event: CustomEvent) => {
    if (onTableOccupancyUpdate) {
      onTableOccupancyUpdate(event.detail);
    }
  }, [onTableOccupancyUpdate]);

  const handleTableCreated = useCallback((event: CustomEvent) => {
    if (onTableCreated) {
      onTableCreated(event.detail);
    }
  }, [onTableCreated]);

  const handleTableDeleted = useCallback((event: CustomEvent) => {
    if (onTableDeleted) {
      onTableDeleted(event.detail);
    }
  }, [onTableDeleted]);

  const handleTableCapacityModified = useCallback((event: CustomEvent) => {
    if (onTableCapacityModified) {
      onTableCapacityModified(event.detail);
    }
  }, [onTableCapacityModified]);

  const handleOrderCreated = useCallback((event: CustomEvent) => {
    if (onOrderCreated) {
      onOrderCreated(event.detail);
    }
  }, [onOrderCreated]);

  const handleOrderUpdated = useCallback((event: CustomEvent) => {
    if (onOrderUpdated) {
      onOrderUpdated(event.detail);
    }
  }, [onOrderUpdated]);

  const handleOrderStatusUpdate = useCallback((event: CustomEvent) => {
    if (onOrderStatusUpdate) {
      onOrderStatusUpdate(event.detail);
    }
  }, [onOrderStatusUpdate]);

  const handleNewOrderForKitchen = useCallback((event: CustomEvent) => {
    if (onNewOrderForKitchen) {
      onNewOrderForKitchen(event.detail);
    }
  }, [onNewOrderForKitchen]);

  const handleOrderReadyForService = useCallback((event: CustomEvent) => {
    if (onOrderReadyForService) {
      onOrderReadyForService(event.detail);
    }
  }, [onOrderReadyForService]);

  const handleNotification = useCallback((event: CustomEvent) => {
    if (onNotification) {
      onNotification(event.detail);
    }
  }, [onNotification]);

  // Set up event listeners
  useEffect(() => {
    if (!isConnected) return;

    // Add event listeners
    if (onTableStatusUpdate) {
      window.addEventListener('tableStatusUpdate', handleTableStatusUpdate as EventListener);
    }
    if (onTableOccupancyUpdate) {
      window.addEventListener('tableOccupancyUpdate', handleTableOccupancyUpdate as EventListener);
    }
    if (onTableCreated) {
      window.addEventListener('tableCreated', handleTableCreated as EventListener);
    }
    if (onTableDeleted) {
      window.addEventListener('tableDeleted', handleTableDeleted as EventListener);
    }
    if (onTableCapacityModified) {
      window.addEventListener('tableCapacityModified', handleTableCapacityModified as EventListener);
    }
    if (onOrderCreated) {
      window.addEventListener('orderCreated', handleOrderCreated as EventListener);
    }
    if (onOrderUpdated) {
      window.addEventListener('orderUpdated', handleOrderUpdated as EventListener);
    }
    if (onOrderStatusUpdate) {
      window.addEventListener('orderStatusUpdate', handleOrderStatusUpdate as EventListener);
    }
    if (onNewOrderForKitchen) {
      window.addEventListener('newOrderForKitchen', handleNewOrderForKitchen as EventListener);
    }
    if (onOrderReadyForService) {
      window.addEventListener('orderReadyForService', handleOrderReadyForService as EventListener);
    }
    if (onNotification) {
      window.addEventListener('notification', handleNotification as EventListener);
    }

    // Cleanup function
    return () => {
      if (onTableStatusUpdate) {
        window.removeEventListener('tableStatusUpdate', handleTableStatusUpdate as EventListener);
      }
      if (onTableOccupancyUpdate) {
        window.removeEventListener('tableOccupancyUpdate', handleTableOccupancyUpdate as EventListener);
      }
      if (onTableCreated) {
        window.removeEventListener('tableCreated', handleTableCreated as EventListener);
      }
      if (onTableDeleted) {
        window.removeEventListener('tableDeleted', handleTableDeleted as EventListener);
      }
      if (onTableCapacityModified) {
        window.removeEventListener('tableCapacityModified', handleTableCapacityModified as EventListener);
      }
      if (onOrderCreated) {
        window.removeEventListener('orderCreated', handleOrderCreated as EventListener);
      }
      if (onOrderUpdated) {
        window.removeEventListener('orderUpdated', handleOrderUpdated as EventListener);
      }
      if (onOrderStatusUpdate) {
        window.removeEventListener('orderStatusUpdate', handleOrderStatusUpdate as EventListener);
      }
      if (onNewOrderForKitchen) {
        window.removeEventListener('newOrderForKitchen', handleNewOrderForKitchen as EventListener);
      }
      if (onOrderReadyForService) {
        window.removeEventListener('orderReadyForService', handleOrderReadyForService as EventListener);
      }
      if (onNotification) {
        window.removeEventListener('notification', handleNotification as EventListener);
      }
    };
  }, [
    isConnected,
    handleTableStatusUpdate,
    handleTableOccupancyUpdate,
    handleTableCreated,
    handleTableDeleted,
    handleTableCapacityModified,
    handleOrderCreated,
    handleOrderUpdated,
    handleOrderStatusUpdate,
    handleNewOrderForKitchen,
    handleOrderReadyForService,
    handleNotification,
    onTableStatusUpdate,
    onTableOccupancyUpdate,
    onTableCreated,
    onTableDeleted,
    onTableCapacityModified,
    onOrderCreated,
    onOrderUpdated,
    onOrderStatusUpdate,
    onNewOrderForKitchen,
    onOrderReadyForService,
    onNotification
  ]);

  return {
    isConnected
  };
};