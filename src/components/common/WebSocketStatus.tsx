import React from 'react';
import { Box, Chip, Tooltip } from '@mui/material';
import { WifiOff, Wifi } from '@mui/icons-material';
import { useWebSocket } from '../../contexts/WebSocketContext';

export const WebSocketStatus: React.FC = () => {
  const { isConnected, connectionError } = useWebSocket();

  if (isConnected) {
    return (
      <Tooltip title="Real-time updates connected">
        <Chip
          icon={<Wifi />}
          label="Live"
          color="success"
          size="small"
          variant="outlined"
        />
      </Tooltip>
    );
  }

  return (
    <Tooltip title={connectionError || "Real-time updates disconnected"}>
      <Chip
        icon={<WifiOff />}
        label="Offline"
        color="error"
        size="small"
        variant="outlined"
      />
    </Tooltip>
  );
};