import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@episensor/app-framework/ui';
import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { HomePage } from '@/pages/HomePage';
import { SettingsPage } from '@/pages/SettingsPage';
import { checkAuth, storeAuthState } from '@/lib/utils/auth';

// Custom ProtectedRoute that works better with Tauri
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [checkComplete, setCheckComplete] = useState(false);

  useEffect(() => {
    const performAuthCheck = async () => {
      try {
        // For template, we'll skip auth for now
        setIsAuthenticated(true);
        storeAuthState(true, 'template-user');
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
      } finally {
        setCheckComplete(true);
      }
    };

    performAuthCheck();
  }, []);

  // Loading State
  if (!checkComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600">Loading application...</p>
        </div>
      </div>
    );
  }

  // Not Authenticated (if auth is enabled)
  if (isAuthenticated === false) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>('light');
  
  // Load theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme-mode') as 'light' | 'dark' | 'system';
    if (savedTheme) {
      setThemeMode(savedTheme);
    }
  }, []);
  
  return (
    <ThemeProvider defaultMode={themeMode} customColors={{ primary: '#2563eb' }}>
      <Router>
        <Routes>
          <Route path="/" element={
            <ProtectedRoute>
              <Layout>
                <HomePage />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <Layout>
                <SettingsPage />
              </Layout>
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;