import React from 'react';
import { Link } from 'react-router-dom';

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
}

interface AppShellProps {
  appName: string;
  appVersion: string;
  logoSrc?: string;
  navigation: NavItem[];
  currentPath: string;
  onNavigate: (path: string) => void;
  showConnectionStatus?: boolean;
  connectionStatusUrl?: string;
  primaryColor?: string;
  showLogout?: boolean;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  appName,
  appVersion,
  navigation,
  currentPath,
  onNavigate,
  children
}) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-semibold">{appName}</h1>
                <span className="ml-2 text-sm text-gray-500">v{appVersion}</span>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navigation.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => onNavigate(item.href)}
                    className={`${
                      currentPath === item.href
                        ? 'border-blue-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                  >
                    {item.icon}
                    <span className="ml-2">{item.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};