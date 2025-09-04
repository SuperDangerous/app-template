import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { useSocket } from '../contexts/SocketContext';

export function ConnectionLostOverlay() {
  const { connected } = useSocket();
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    // Delay showing the overlay to avoid flashing on quick reconnects
    let timeout: NodeJS.Timeout;
    
    if (!connected) {
      timeout = setTimeout(() => {
        setShowOverlay(true);
      }, 2000);
    } else {
      setShowOverlay(false);
    }

    return () => clearTimeout(timeout);
  }, [connected]);

  if (!showOverlay) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
            <WifiOff className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            Connection Lost
          </h2>
          
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Unable to connect to the server. Please check your connection and try again.
          </p>
          
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-primary"></div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Reconnecting...
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
