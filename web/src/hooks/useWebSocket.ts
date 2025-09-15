// WebSocket hook using framework's useSocketIO
import { useSocketIO, useConnectionStatus } from '@episensor/app-framework/ui';
import { useCallback } from 'react';

export function useWebSocket() {
  // In dev mode, let it use window.location.origin to connect through Vite proxy
  // The proxy at /socket.io will forward to the backend
  const [socketState, socketActions] = useSocketIO();
  const { connected } = useConnectionStatus();

  // Provide a simpler API for components that just need on/off/emit
  const on = useCallback((event: string, handler: (data: any) => void) => {
    socketActions.on(event, handler);
  }, [socketActions]);

  const off = useCallback((event: string, handler: (data: any) => void) => {
    socketActions.off(event, handler);
  }, [socketActions]);

  const emit = useCallback((event: string, data?: any) => {
    socketActions.emit(event, data);
  }, [socketActions]);

  return {
    on,
    off,
    emit,
    connected,
    connecting: socketState.connecting,
    socket: socketActions.socket
  };
}