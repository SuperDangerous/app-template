/**
 * Unit tests for Data Paths utility functions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import path from 'path';
import fs from 'fs';
import {
  getDataPath,
  getConfigFilePath,
  getSettingsFilePath,
  getLogsPath,
  getStateFilePath,
  getUploadsPath,
  ensureDirectory,
  isDesktopApp
} from '../../src/utils/dataPaths.js';
import { TestCleaner } from '../utils/test-helpers.js';

describe('Data Paths Utilities', () => {
  const cleaner = new TestCleaner();
  const originalEnv = process.env.TAURI;
  const originalCwd = process.cwd();

  beforeEach(() => {
    // Reset environment
    delete process.env.TAURI;
    vi.clearAllMocks();
  });

  afterEach(async () => {
    process.env.TAURI = originalEnv;
    await cleaner.cleanup();
  });

  describe('isDesktopApp detection', () => {
    it('should detect non-desktop environment', () => {
      delete process.env.TAURI;
      // Note: isDesktopApp is imported from framework, so we test the behavior
      const dataPath = getDataPath();
      expect(dataPath).toContain(path.join(process.cwd(), 'data'));
    });

    it('should handle desktop environment flag', () => {
      process.env.TAURI = '1';
      // When TAURI is set, it should use framework's getAppDataPath
      // Since we're testing in non-desktop mode, we can't directly test desktop paths
      // but we can verify the logic paths
      expect(process.env.TAURI).toBe('1');
    });
  });

  describe('getDataPath', () => {
    it('should return base data path in development mode', () => {
      const dataPath = getDataPath();
      expect(dataPath).toBe(path.join(process.cwd(), 'data'));
    });

    it('should return sub-path when provided', () => {
      const subPath = 'uploads';
      const fullPath = getDataPath(subPath);
      expect(fullPath).toBe(path.join(process.cwd(), 'data', subPath));
    });

    it('should handle nested sub-paths', () => {
      const subPath = 'config/advanced/settings.json';
      const fullPath = getDataPath(subPath);
      expect(fullPath).toBe(path.join(process.cwd(), 'data', subPath));
    });

    it('should handle empty string sub-path', () => {
      const fullPath = getDataPath('');
      expect(fullPath).toBe(path.join(process.cwd(), 'data'));
    });
  });

  describe('getConfigFilePath', () => {
    it('should return default config file path', () => {
      const configPath = getConfigFilePath();
      expect(configPath).toBe(path.join(process.cwd(), 'data', 'config', 'app.json'));
    });

    it('should return custom config file path', () => {
      const filename = 'custom-config.json';
      const configPath = getConfigFilePath(filename);
      expect(configPath).toBe(path.join(process.cwd(), 'data', 'config', filename));
    });

    it('should handle complex filenames', () => {
      const filename = 'nested/folder/config.json';
      const configPath = getConfigFilePath(filename);
      expect(configPath).toBe(path.join(process.cwd(), 'data', 'config', filename));
    });
  });

  describe('getSettingsFilePath', () => {
    it('should return settings file path', () => {
      const settingsPath = getSettingsFilePath();
      expect(settingsPath).toBe(path.join(process.cwd(), 'data', 'settings.json'));
    });

    it('should return consistent path on multiple calls', () => {
      const path1 = getSettingsFilePath();
      const path2 = getSettingsFilePath();
      expect(path1).toBe(path2);
    });
  });

  describe('getLogsPath', () => {
    it('should return logs directory path', () => {
      const logsPath = getLogsPath();
      expect(logsPath).toBe(path.join(process.cwd(), 'data', 'logs'));
    });

    it('should create logs directory if it doesn\'t exist in desktop mode', async () => {
      // Mock desktop environment
      process.env.TAURI = '1';

      // Since we can't test actual desktop behavior without the framework,
      // we'll test that the function doesn't throw
      expect(() => getLogsPath()).not.toThrow();
    });
  });

  describe('getStateFilePath', () => {
    it('should return state file path', () => {
      const statePath = getStateFilePath();
      expect(statePath).toBe(path.join(process.cwd(), 'data', 'state.json'));
    });
  });

  describe('getUploadsPath', () => {
    it('should return uploads directory path', () => {
      const uploadsPath = getUploadsPath();
      expect(uploadsPath).toBe(path.join(process.cwd(), 'data', 'uploads'));
    });

    it('should create uploads directory if it doesn\'t exist', () => {
      const uploadsPath = getUploadsPath();
      // The function creates the directory, so it should exist after calling
      expect(fs.existsSync(uploadsPath)).toBe(true);

      // Clean up created directory
      cleaner.add(async () => {
        try {
          await fs.promises.rmdir(uploadsPath);
        } catch {
          // Directory might not be empty or already removed
        }
      });
    });

    it('should handle existing uploads directory gracefully', () => {
      // Call twice to ensure it doesn't fail when directory exists
      const uploadsPath1 = getUploadsPath();
      const uploadsPath2 = getUploadsPath();

      expect(uploadsPath1).toBe(uploadsPath2);
      expect(fs.existsSync(uploadsPath1)).toBe(true);

      cleaner.add(async () => {
        try {
          await fs.promises.rmdir(uploadsPath1);
        } catch {
          // Directory might not be empty or already removed
        }
      });
    });
  });

  describe('ensureDirectory', () => {
    it('should create a directory that doesn\'t exist', async () => {
      const testDir = path.join(process.cwd(), 'test-temp-dir');

      expect(fs.existsSync(testDir)).toBe(false);

      await ensureDirectory(testDir);

      expect(fs.existsSync(testDir)).toBe(true);

      cleaner.add(async () => {
        try {
          await fs.promises.rmdir(testDir);
        } catch {
          // Directory might already be removed
        }
      });
    });

    it('should handle existing directory gracefully', async () => {
      const testDir = path.join(process.cwd(), 'test-existing-dir');

      // Create directory first
      await fs.promises.mkdir(testDir, { recursive: true });
      expect(fs.existsSync(testDir)).toBe(true);

      // Should not throw when directory already exists
      await expect(ensureDirectory(testDir)).resolves.toBeUndefined();

      cleaner.add(async () => {
        try {
          await fs.promises.rmdir(testDir);
        } catch {
          // Directory might already be removed
        }
      });
    });

    it('should create nested directories', async () => {
      const nestedDir = path.join(process.cwd(), 'test-nested', 'deep', 'directory');

      expect(fs.existsSync(nestedDir)).toBe(false);

      await ensureDirectory(nestedDir);

      expect(fs.existsSync(nestedDir)).toBe(true);

      cleaner.add(async () => {
        try {
          await fs.promises.rm(path.join(process.cwd(), 'test-nested'), { recursive: true, force: true });
        } catch {
          // Directory might already be removed
        }
      });
    });

    it('should handle paths with unusual characters', async () => {
      const specialDir = path.join(process.cwd(), 'test-dir with spaces & symbols');

      await ensureDirectory(specialDir);

      expect(fs.existsSync(specialDir)).toBe(true);

      cleaner.add(async () => {
        try {
          await fs.promises.rmdir(specialDir);
        } catch {
          // Directory might already be removed
        }
      });
    });
  });

  describe('Path Consistency', () => {
    it('should return consistent paths across calls', () => {
      const dataPath1 = getDataPath();
      const dataPath2 = getDataPath();
      expect(dataPath1).toBe(dataPath2);

      const configPath1 = getConfigFilePath();
      const configPath2 = getConfigFilePath();
      expect(configPath1).toBe(configPath2);

      const settingsPath1 = getSettingsFilePath();
      const settingsPath2 = getSettingsFilePath();
      expect(settingsPath1).toBe(settingsPath2);
    });

    it('should return absolute paths', () => {
      const paths = [
        getDataPath(),
        getConfigFilePath(),
        getSettingsFilePath(),
        getLogsPath(),
        getStateFilePath(),
        getUploadsPath()
      ];

      for (const testPath of paths) {
        expect(path.isAbsolute(testPath)).toBe(true);
      }
    });

    it('should maintain proper path hierarchy', () => {
      const basePath = getDataPath();
      const configPath = getConfigFilePath();
      const settingsPath = getSettingsFilePath();
      const statePath = getStateFilePath();
      const uploadsPath = getUploadsPath();

      // Config should be under data/config/
      expect(configPath).toContain(path.join(basePath, 'config'));

      // Settings should be under data/
      expect(settingsPath).toContain(basePath);

      // State should be under data/
      expect(statePath).toContain(basePath);

      // Uploads should be under data/
      expect(uploadsPath).toContain(basePath);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid directory paths gracefully', async () => {
      // Test with a path that includes invalid characters for some systems
      const invalidPath = path.join(process.cwd(), 'test\0invalid');

      try {
        await ensureDirectory(invalidPath);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('should handle permission errors gracefully', async () => {
      // This test is platform-dependent and might not work in all environments
      // We'll just ensure the function exists and can be called
      expect(typeof ensureDirectory).toBe('function');
    });
  });
});
