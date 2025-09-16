/**
 * Logs Page using the improved framework component
 */

import React from 'react';
import { LogsPage as FrameworkLogsPage } from '@episensor/app-framework/ui';

export function LogsPage() {
  return (
    <FrameworkLogsPage 
      apiUrl="/api/logs"
      title="Application Logs"
      description="View system logs and diagnostic information"
    />
  );
}