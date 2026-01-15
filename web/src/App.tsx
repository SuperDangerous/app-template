import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import {
  AppLayout,
  ConnectionOverlay,
  useSocketIO,
  useConnectionStatus,
} from '@superdangerous/app-framework/ui';
import { Toaster } from 'sonner';
import { Home, Settings, FileText, Table2 } from 'lucide-react';
import { HomePage } from './pages/HomePage';
import { SettingsPage } from './pages/SettingsPage';
import { LogsPage } from './pages/LogsPage';
import { DataTableExamplePage } from './pages/DataTableExamplePage';
import { apiRequest } from './lib/api';

const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [appInfo, setAppInfo] = useState({ name: 'App Template', version: '1.0.0' });
  const [apiReady, setApiReady] = useState(false);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const { connected } = useConnectionStatus();
  const [, socketActions] = useSocketIO();
  const overlayTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (connected) {
      setOverlayVisible(false);
      if (overlayTimerRef.current) {
        clearTimeout(overlayTimerRef.current);
        overlayTimerRef.current = null;
      }
    } else if (!overlayVisible) {
      if (overlayTimerRef.current) {
        clearTimeout(overlayTimerRef.current);
      }
      overlayTimerRef.current = setTimeout(() => {
        setOverlayVisible(true);
        overlayTimerRef.current = null;
      }, 2000);
    }

    return () => {
      if (overlayTimerRef.current) {
        clearTimeout(overlayTimerRef.current);
        overlayTimerRef.current = null;
      }
    };
  }, [connected, overlayVisible]);

  useEffect(() => {
    // Fetch app info from backend and set page title
    apiRequest('/api/config')
      .then((response) => {
        const payload = (response && typeof response === 'object' && 'data' in response)
          ? (response as { data: Record<string, any> }).data
          : response;
        const appData = {
          name: payload?.appName || 'App Template',
          version: payload?.appVersion || '1.0.0',
        };
        setAppInfo(appData);
        document.title = appData.name;
        setApiReady(true);
      })
      .catch((err) => {
        console.error('Failed to fetch app info:', err);
        document.title = 'App Template';
        setApiReady(true);
      });
  }, []);

  const navigation = [
    { name: 'Home', href: '/', icon: <Home className="h-4 w-4" /> },
    { name: 'DataTable', href: '/datatable', icon: <Table2 className="h-4 w-4" /> },
    { name: 'Logs', href: '/logs', icon: <FileText className="h-4 w-4" /> },
    { name: 'Settings', href: '/settings', icon: <Settings className="h-4 w-4" /> },
  ];

  const handleRetry = () => {
    // Force reconnect by emitting a connect event
    socketActions.emit('connect');
  };

  return (
    <AppLayout
      appName={appInfo.name}
      appVersion={appInfo.version}
      logoSrc="/assets/superdangerous-dark.svg"
      navigation={navigation}
      currentPath={location.pathname}
      onNavigate={navigate}
      showConnectionStatus={true}
      primaryColor="#E21350"
      connectionStatusUrl={import.meta.env.VITE_API_URL || 'http://localhost:7500'}
      showLogout={false}
    >
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/datatable" element={<DataTableExamplePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/logs" element={<LogsPage />} />
      </Routes>

      <ConnectionOverlay
        isConnected={!overlayVisible}
        onRetry={handleRetry}
      />
    </AppLayout>
  );
};

export function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppContent />
      <Toaster position="top-right" richColors />
    </BrowserRouter>
  );
}
