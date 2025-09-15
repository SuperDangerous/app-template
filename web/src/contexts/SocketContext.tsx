import React, { createContext, useContext } from 'react';
import { useSocketIO, useConnectionStatus } from '@episensor/app-framework/ui';
import { Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
}

export const SocketContext = createContext<SocketContextType>({
  socket: null,
  connected: false,
});

export function SocketProvider({ children }: { children: React.ReactNode }) {
  // Use the framework's useSocketIO hook - it will automatically connect through the Vite proxy
  const [socketState, socketActions] = useSocketIO();
  const { connected } = useConnectionStatus();

  return (
    <SocketContext.Provider value={{ socket: socketActions.socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}