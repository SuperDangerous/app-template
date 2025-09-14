import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { Toaster } from 'sonner';
import { Home, Settings, FileText } from 'lucide-react';
import { HomePage } from './pages/HomePage';
import { SettingsPage } from './pages/SettingsPage';
import { LogsPage } from './pages/LogsPage';
import { SocketProvider } from './contexts/SocketContext';
import { ConnectionLostOverlay } from './components/ConnectionLostOverlay';
import { apiRequest } from './lib/api';

const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [appInfo, setAppInfo] = useState({ name: 'App Template', version: '1.0.0' });

  useEffect(() => {
    // Fetch app info from backend and set page title
    apiRequest('/api/config')
      .then(info => {
        setAppInfo(info);
        document.title = info.name || 'App Template';
      })
      .catch(err => {
        console.error('Failed to fetch app info:', err);
        // Fallback to default
        document.title = 'App Template';
      });
  }, []);

  const navigation = [
    { name: 'Home', href: '/', icon: <Home className="h-4 w-4" /> },
    { name: 'Logs', href: '/logs', icon: <FileText className="h-4 w-4" /> },
    { name: 'Settings', href: '/settings', icon: <Settings className="h-4 w-4" /> },
  ];

  return (
    <AppShell
      appName={appInfo.name}
      appVersion={appInfo.version}
      logoSrc="/assets/episensor-dark.svg"
      navigation={navigation}
      currentPath={location.pathname}
      onNavigate={navigate}
      showConnectionStatus={true}
      connectionStatusUrl={import.meta.env.VITE_API_URL || 'http://localhost:7500'}
      primaryColor="#E21350"
      showLogout={false}
    >
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/logs" element={<LogsPage />} />
      </Routes>
    </AppShell>
  );
};

export function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <SocketProvider>
        <AppContent />
        <ConnectionLostOverlay />
        <Toaster position="top-right" richColors />
      </SocketProvider>
    </BrowserRouter>
  );
}