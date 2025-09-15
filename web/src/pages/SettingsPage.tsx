/**
 * Settings Page using the new framework approach
 */

import React, { useEffect, useState } from 'react';
import { SettingsFramework } from '@episensor/app-framework/ui';
import { api } from '../utils/api';

export function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [definitions, setDefinitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    loadSettings();
  }, []);
  
  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load both settings and definitions
      const [settingsRes, definitionsRes] = await Promise.all([
        api.get('/api/settings'),
        api.get('/api/settings/definitions')
      ]);
      
      setSettings(settingsRes.data || {});
      setDefinitions(definitionsRes.data || []);
    } catch (err) {
      setError('Failed to load settings');
      console.error('Settings load error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSettingChange = async (key: string, value: any) => {
    // Update local state immediately
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    
    // Save to server
    try {
      setSaving(true);
      await api.put(`/api/settings/${key}`, { value });
    } catch (err) {
      setError('Failed to save setting');
      console.error('Settings save error:', err);
      // Revert on error
      await loadSettings();
    } finally {
      setSaving(false);
    }
  };
  
  const handleSaveAll = async () => {
    try {
      setSaving(true);
      setError(null);
      await api.put('/api/settings', settings);
    } catch (err) {
      setError('Failed to save settings');
      console.error('Settings save error:', err);
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Application Settings
          </h1>
          <p className="text-gray-600">
            Configure your application settings. Changes are saved automatically.
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setError(null)}
                  className="text-red-400 hover:text-red-500"
                >
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
        
        <SettingsFramework
          settings={settings}
          definitions={definitions}
          onSettingChange={handleSettingChange}
          onSave={handleSaveAll}
          loading={saving}
        />
        
        <div className="mt-6 flex justify-end space-x-4">
          <button
            onClick={loadSettings}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
          >
            Reset
          </button>
          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : 'Save All'}
          </button>
        </div>
      </div>
    </div>
  );
}