// Temporary UI component stubs until @episensor/app-framework/ui is published
import React from 'react';

export const Card: React.FC<{children: React.ReactNode, className?: string}> = ({children, className}) => (
  <div className={`bg-white shadow rounded-lg p-6 ${className || ''}`}>{children}</div>
);

export const Button: React.FC<{children: React.ReactNode, onClick?: () => void, className?: string, variant?: string}> = ({children, onClick, className}) => (
  <button onClick={onClick} className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 ${className || ''}`}>{children}</button>
);

export const Dialog = ({children}: {children: React.ReactNode}) => <div>{children}</div>;
export const DialogContent = ({children}: {children: React.ReactNode}) => <div>{children}</div>;
export const DialogHeader = ({children}: {children: React.ReactNode}) => <div>{children}</div>;
export const DialogTitle = ({children}: {children: React.ReactNode}) => <h2>{children}</h2>;
export const DialogFooter = ({children}: {children: React.ReactNode}) => <div>{children}</div>;

export const Checkbox: React.FC<{checked?: boolean, onCheckedChange?: (checked: boolean) => void}> = ({checked, onCheckedChange}) => (
  <input type="checkbox" checked={checked} onChange={e => onCheckedChange?.(e.target.checked)} />
);

export const Badge: React.FC<{children: React.ReactNode, variant?: string}> = ({children}) => (
  <span className="px-2 py-1 text-xs bg-gray-200 rounded">{children}</span>
);

export const LogViewer: React.FC<any> = () => <div>Log Viewer (UI component not available)</div>;
export const LogStats: React.FC<any> = () => <div>Log Stats (UI component not available)</div>;
export const SettingsFramework: React.FC<any> = () => <div>Settings Framework (UI component not available)</div>;

export const useDebounce = (value: any, delay: number) => {
  const [debouncedValue, setDebouncedValue] = React.useState(value);
  React.useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

export const useWebSocket = () => {
  return { connected: false, emit: () => {}, on: () => {}, off: () => {} };
};

export const cn = (...classes: string[]) => classes.filter(Boolean).join(' ');