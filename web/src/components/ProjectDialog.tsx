import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, FolderOpen, Folder, ChevronRight } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';

interface Project {
  id: string;
  name: string;
  path: string;
  color?: string;
  additionalGitignoreRules: string[];
}

interface ProjectDialogProps {
  project?: Project;
  onClose: () => void;
  onSave: (project: Omit<Project, 'id'>) => void;
}

interface DirectorySuggestion {
  path: string;
  name: string;
  isMatch: boolean;
}

// Vibrant, saturated color palette
const projectColors = [
  { name: 'Ruby', value: '#E91E63' },
  { name: 'Amber', value: '#FF9800' },
  { name: 'Emerald', value: '#4CAF50' },
  { name: 'Azure', value: '#2196F3' },
  { name: 'Violet', value: '#9C27B0' },
  { name: 'Citrus', value: '#CDDC39' },
  { name: 'Indigo', value: '#3F51B5' },
  { name: 'Coral', value: '#FF5252' },
  { name: 'Teal', value: '#009688' },
  { name: 'Cyan', value: '#00BCD4' },
  { name: 'Rose', value: '#F50057' },
  { name: 'Lime', value: '#8BC34A' },
];

export function ProjectDialog({ project, onClose, onSave }: ProjectDialogProps) {
  const [name, setName] = useState(project?.name || '');
  const [path, setPath] = useState(project?.path || '');
  const [color, setColor] = useState(project?.color || projectColors[0].value);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<DirectorySuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [hasFocused, setHasFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isValidating, setIsValidating] = useState(false);
  const [expandedPath, setExpandedPath] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  const debouncedPath = useDebounce(path, 300);

  // Fetch directory suggestions
  const fetchSuggestions = useCallback(async (searchPath: string) => {
    if (!searchPath || searchPath.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await apiRequest(`/api/filesystem/directories?path=${encodeURIComponent(searchPath)}`);
      
      if (response.directories && response.directories.length > 0) {
        const suggestionList: DirectorySuggestion[] = response.directories.map((dir: string) => ({
          path: dir,
          name: dir.split('/').pop() || dir,
          isMatch: true
        }));
        
        setSuggestions(suggestionList);
        setExpandedPath(response.expandedPath);
        // Only show suggestions if user has interacted with the input
        if (hasFocused) {
          setShowSuggestions(true);
        }
      } else {
        setSuggestions([]);
        setExpandedPath(response.expandedPath);
      }
    } catch (error) {
      console.error('Failed to fetch directory suggestions:', error);
      setSuggestions([]);
    }
  }, []);

  // Fetch suggestions when path changes
  useEffect(() => {
    if (debouncedPath && debouncedPath.length >= 2) {
      fetchSuggestions(debouncedPath);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [debouncedPath, fetchSuggestions]);

  // Validate the path
  const validatePath = async (pathToValidate: string) => {
    setIsValidating(true);
    try {
      const response = await apiRequest('/api/filesystem/validate-path', {
        method: 'POST',
        body: JSON.stringify({ path: pathToValidate })
      });
      
      if (response.valid) {
        setError(null);
        setPath(response.expanded);
        return true;
      } else if (!response.exists) {
        setError('Directory does not exist');
        return false;
      } else if (!response.isDirectory) {
        setError('Path is not a directory');
        return false;
      }
    } catch (error) {
      setError('Failed to validate path');
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !path) return;

    // Allow ~ paths and environment variables
    if (!path.startsWith('/') && !path.startsWith('~') && !path.match(/^[A-Z]:\\/i) && !path.startsWith('$')) {
      setError('Please enter a valid path (e.g., /Users/name/project, ~/projects, or C:\\projects\\myproject)');
      return;
    }

    // Validate the path exists
    const isValid = await validatePath(path);
    if (!isValid) return;

    onSave({
      name,
      path: expandedPath || path,
      color,
      additionalGitignoreRules: project?.additionalGitignoreRules || [],
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          e.preventDefault();
          selectSuggestion(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
      case 'Tab':
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          e.preventDefault();
          selectSuggestion(suggestions[selectedIndex]);
        } else if (suggestions.length === 1) {
          e.preventDefault();
          selectSuggestion(suggestions[0]);
        }
        break;
    }
  };

  const selectSuggestion = (suggestion: DirectorySuggestion) => {
    const newPath = suggestion.path.endsWith('/') ? suggestion.path : suggestion.path + '/';
    setPath(newPath);
    setShowSuggestions(false);  // Close dropdown after selection
    setSelectedIndex(-1);
    setError(null);
    setSuggestions([]); // Clear suggestions to prevent reopening
    
    // Keep focus on input and move cursor to end
    if (inputRef.current) {
      inputRef.current.focus();
      setTimeout(() => {
        if (inputRef.current) {
          const len = inputRef.current.value.length;
          inputRef.current.setSelectionRange(len, len);
        }
      }, 0);
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]" role="dialog" aria-modal="true" aria-labelledby="project-dialog-title" aria-describedby="project-dialog-description">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 id="project-dialog-title" className="text-lg font-semibold text-gray-900">
            {project ? 'Edit Project' : 'Add Project'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p id="project-dialog-description" className="sr-only">
          {project ? 'Edit an existing project configuration' : 'Add a new project by specifying its name and local directory path'}
        </p>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E21350]"
              placeholder="My Project"
              required
            />
          </div>

          <div className="mb-4 relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Local Directory Path
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={path}
                onChange={(e) => {
                  setPath(e.target.value);
                  setError(null);
                  setShowSuggestions(true);
                }}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  setHasFocused(true);
                  // Only show suggestions if we have them and user starts typing
                  if (suggestions.length > 0 && path.length > 2) {
                    setShowSuggestions(true);
                  }
                }}
                className={cn(
                  "w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#E21350]",
                  error ? "border-red-500" : "border-gray-300"
                )}
                placeholder="~/Code/my-project or /Users/yourname/projects"
                required
                autoComplete="off"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <FolderOpen className="h-4 w-4 text-gray-400" />
              </div>
            </div>
            
            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div 
                ref={suggestionsRef}
                className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
              >
                {suggestions.map((suggestion, index) => (
                  <button
                    key={suggestion.path}
                    type="button"
                    onClick={() => selectSuggestion(suggestion)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={cn(
                      "w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-gray-100 transition-colors",
                      selectedIndex === index && "bg-gray-100"
                    )}
                  >
                    <Folder className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="flex-1 truncate text-sm">
                      {suggestion.path}
                    </span>
                    <ChevronRight className="h-3 w-3 text-gray-400 flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}
            
            <p className="text-xs text-gray-500 mt-1">
              Supports ~ for home directory and environment variables
            </p>
            {expandedPath && expandedPath !== path && (
              <p className="text-xs text-blue-600 mt-1">
                Will expand to: {expandedPath}
              </p>
            )}
            {error && (
              <p className="text-xs text-red-500 mt-1">{error}</p>
            )}
            {isValidating && (
              <p className="text-xs text-gray-500 mt-1">Validating path...</p>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project Color
            </label>
            <div className="grid grid-cols-6 gap-2">
              {projectColors.map((colorOption) => (
                <button
                  key={colorOption.value}
                  type="button"
                  onClick={() => setColor(colorOption.value)}
                  className={cn(
                    "aspect-square rounded-md border-2 transition-all",
                    color === colorOption.value
                      ? "border-gray-800 shadow-md scale-105"
                      : "border-gray-300 hover:border-gray-400"
                  )}
                  style={{ backgroundColor: colorOption.value }}
                  title={colorOption.name}
                />
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Choose a color to help identify this project
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isValidating}
              className="px-4 py-2 bg-[#E21350] text-white rounded-md hover:bg-[#C10E42] transition-colors disabled:opacity-50"
            >
              {project ? 'Update' : 'Add'} Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}