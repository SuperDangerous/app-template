import React from 'react';
import { LogViewer } from '@episensor/app-framework/ui';

export function LogsPage() {
  return (
    <div className="p-6 h-full">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Application Logs</h1>
        <p className="text-muted-foreground mt-2">
          View and monitor application logs in real-time.
        </p>
      </div>
      
      <div className="h-[calc(100vh-200px)]">
        <LogViewer 
          apiUrl="/api/logs"
          autoRefresh={true}
          refreshInterval={5000}
        />
      </div>
    </div>
  );
}
