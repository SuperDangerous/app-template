/**
 * Cross-platform data path management
 * Ensures consistent data storage across desktop and server deployments
 */

import path from 'path';
import fs from 'fs';
import { getAppDataPath, getDataFilePath, isDesktopApp } from '@superdangerous/app-framework';

// Standard identifiers used by the template. Applications generated from this
// template should customise these values in line with their own metadata.
const APP_ID = 'com.superdangerous.app-template';
const APP_NAME = 'app-template';

/**
 * Get the appropriate path for application data
 * In desktop mode, uses platform-specific app data paths
 * In development/server mode, uses local project directory
 */
export function getDataPath(subPath?: string): string {
  if (isDesktopApp()) {
    // Desktop app - use platform-specific app data directory
    const basePath = getAppDataPath(APP_ID, APP_NAME);
    return subPath ? path.join(basePath, subPath) : basePath;
  } else {
    // Development/server mode - use local data directory
    const basePath = path.join(process.cwd(), 'data');
    return subPath ? path.join(basePath, subPath) : basePath;
  }
}

/**
 * Get config file path
 */
export function getConfigFilePath(filename: string = 'app.json'): string {
  if (isDesktopApp()) {
    return getDataFilePath(`config/${filename}`, APP_ID, APP_NAME);
  }
  return path.join(process.cwd(), 'data', 'config', filename);
}

/**
 * Get settings file path
 */
export function getSettingsFilePath(): string {
  if (isDesktopApp()) {
    return getDataFilePath('settings.json', APP_ID, APP_NAME);
  }
  return path.join(process.cwd(), 'data', 'settings.json');
}

/**
 * Get logs directory path
 */
export function getLogsPath(): string {
  if (isDesktopApp()) {
    const logsPath = path.join(getAppDataPath(APP_ID, APP_NAME), 'logs');
    if (!fs.existsSync(logsPath)) {
      fs.mkdirSync(logsPath, { recursive: true });
    }
    return logsPath;
  }
  return path.join(process.cwd(), 'data', 'logs');
}

/**
 * Get state file path
 */
export function getStateFilePath(): string {
  if (isDesktopApp()) {
    return getDataFilePath('state.json', APP_ID, APP_NAME);
  }
  return path.join(process.cwd(), 'data', 'state.json');
}

/**
 * Get uploads directory path
 */
export function getUploadsPath(): string {
  const dataPath = getDataPath();
  const uploadsDir = path.join(dataPath, 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  return uploadsDir;
}

/**
 * Ensure a directory exists
 */
export async function ensureDirectory(dirPath: string): Promise<void> {
  await fs.promises.mkdir(dirPath, { recursive: true });
}

// Re-export isDesktopApp for convenience
export { isDesktopApp };
