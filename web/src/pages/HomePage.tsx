import { Card, Button } from '@episensor/app-framework/ui';
import { Activity, Server, Database, Cpu, HardDrive, Wifi, Settings, FileText } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '@/lib/api';

interface SystemStats {
  uptime: number;
  memory?: {
    used: number;
    total: number;
  };
  cpu?: {
    usage: number;
  };
}

export function HomePage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [appInfo, setAppInfo] = useState({ 
    name: 'EpiSensor App Template', 
    version: '1.1.0',
    description: 'Template application'
  });

  useEffect(() => {
    // Fetch app info
    apiRequest('/api/config')
      .then((response) => {
        const payload = (response && typeof response === 'object' && 'data' in response)
          ? (response as { data: Record<string, any> }).data
          : response;
        setAppInfo({
          name: payload?.appName || 'EpiSensor App Template',
          version: payload?.appVersion || '1.1.0',
          description: payload?.description || 'Template application',
        });
      })
      .catch((error) => {
        console.error('Failed to load config:', error);
      });

    // Fetch system stats
    const fetchStats = () => {
      apiRequest('/api/health')
        .then((response) => {
          const payload = (response && typeof response === 'object' && 'data' in response)
            ? (response as { data: Record<string, any> }).data
            : response;
          setStats({
            uptime: Number(payload?.uptime) || 0,
            memory: payload?.memory,
            cpu: payload?.cpu,
          });
        })
        .catch((error) => {
          console.error('Failed to fetch health stats:', error);
        });
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Welcome to {appInfo.name}
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {appInfo.description || 'A comprehensive template for building EpiSensor applications'}
            </p>
          </div>
          <Activity className="h-12 w-12 text-pink-500" />
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <Server className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className="text-lg font-semibold text-green-600">Online</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <Database className="h-8 w-8 text-purple-500" />
            <div>
              <p className="text-sm text-gray-500">Version</p>
              <p className="text-lg font-semibold">{appInfo.version}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <Wifi className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-sm text-gray-500">Connection</p>
              <p className="text-lg font-semibold">Active</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <Cpu className="h-8 w-8 text-orange-500" />
            <div>
              <p className="text-sm text-gray-500">Uptime</p>
              <p className="text-lg font-semibold">
                {stats ? `${Math.floor(stats.uptime / 60)}m` : '—'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Activity className="h-5 w-5 mr-2 text-pink-500" />
            Getting Started
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            This template provides everything you need to build your application:
          </p>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-start">
              <span className="text-pink-500 mr-2">•</span>
              Configure application settings with validation
            </li>
            <li className="flex items-start">
              <span className="text-pink-500 mr-2">•</span>
              Monitor application logs in real-time
            </li>
            <li className="flex items-start">
              <span className="text-pink-500 mr-2">•</span>
              Add custom API endpoints and business logic
            </li>
            <li className="flex items-start">
              <span className="text-pink-500 mr-2">•</span>
              WebSocket support for real-time features
            </li>
            <li className="flex items-start">
              <span className="text-pink-500 mr-2">•</span>
              Deploy as web app or desktop app with Tauri
            </li>
          </ul>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <HardDrive className="h-5 w-5 mr-2 text-blue-500" />
            Built-in Features
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Framework features ready to use:
          </p>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">✓</span>
              Enhanced logging with rotation and compression
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">✓</span>
              Dynamic settings with hot reload
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">✓</span>
              File upload and storage service
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">✓</span>
              Session and authentication middleware
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">✓</span>
              Health check and monitoring endpoints
            </li>
          </ul>
        </Card>
      </div>

      {/* Actions */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => navigate('/settings')}>
            <Settings className="h-4 w-4 mr-2" />
            Configure Settings
          </Button>
          <Button variant="outline" onClick={() => navigate('/logs')}>
            <FileText className="h-4 w-4 mr-2" />
            View Logs
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Refresh Application
          </Button>
        </div>
      </Card>

      {/* Footer */}
      <div className="text-center text-sm text-gray-500 dark:text-gray-400 pt-4">
        <p>Built with EpiSensor App Framework v4.3.0</p>
        <p className="mt-1">Ready for your business logic</p>
      </div>
    </div>
  );
}
