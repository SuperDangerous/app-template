// Use framework's generic useWebSocket with our SocketContext
import { useWebSocket as useWebSocketBase } from '@episensor/app-framework/ui';
import { SocketContext } from '../contexts/SocketContext';

export function useWebSocket() {
  return useWebSocketBase(SocketContext);
}