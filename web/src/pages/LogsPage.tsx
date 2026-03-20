/**
 * Logs Page using the improved framework component
 */

import { LogsPage as FrameworkLogsPage } from '@superdangerous/app-framework/ui';

export function LogsPage() {
  return <FrameworkLogsPage apiUrl="/api/logs" />;
}
