import React, { useState, useEffect } from 'react';
import { X, Info } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  path: string;
  additionalGitignoreRules: string[];
}

interface EditRulesDialogProps {
  project: Project;
  onClose: () => void;
  onSave: (rules: string[]) => void;
}

export function EditRulesDialog({ project, onClose, onSave }: EditRulesDialogProps) {
  const [rules, setRules] = useState(project.additionalGitignoreRules.join('\n'));
  const [gitignoreContent, setGitignoreContent] = useState<string>('');
  const [gitignoreExists, setGitignoreExists] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Fetch .gitignore content when component mounts
  useEffect(() => {
    const fetchGitignoreContent = async () => {
      try {
        const response = await fetch(`/api/projects/${project.id}/gitignore`);
        if (response.ok) {
          const data = await response.json();
          setGitignoreContent(data.content);
          setGitignoreExists(data.exists);
        }
      } catch (error) {
        console.error('Failed to fetch .gitignore content:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGitignoreContent();
  }, [project.id]);

  // Validate gitignore rules
  const validateRules = (rulesText: string): string[] => {
    const errors: string[] = [];
    const lines = rulesText.split('\n');
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (trimmed === '') return;
      
      // Basic validation for common issues
      if (trimmed.includes('\\') && !trimmed.match(/^[^\\]*\\[^\\]*$/)) {
        errors.push(`Line ${index + 1}: Multiple backslashes may cause issues`);
      }
      if (trimmed.includes('//')) {
        errors.push(`Line ${index + 1}: Double slashes (//) are not valid in gitignore`);
      }
      if (trimmed.startsWith('./')) {
        errors.push(`Line ${index + 1}: Remove './' prefix, paths are relative by default`);
      }
    });
    
    return errors;
  };

  const handleRulesChange = (value: string) => {
    setRules(value);
    const errors = validateRules(value);
    setValidationErrors(errors);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rulesList = rules
      .split('\n')
      .map(rule => rule.trim())
      .filter(rule => rule.length > 0);
    onSave(rulesList);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Edit Gitignore Rules - {project.name}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto mb-4">
          {/* Existing .gitignore rules section */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Existing .gitignore Rules</h4>
            <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700"></div>
                  <span className="ml-2 text-sm text-gray-500">Loading .gitignore...</span>
                </div>
              ) : gitignoreExists ? (
                <pre className="text-xs text-gray-700 whitespace-pre-wrap max-h-32 overflow-y-auto">
                  {gitignoreContent || 'Empty .gitignore file'}
                </pre>
              ) : (
                <p className="text-sm text-gray-500 italic">No .gitignore file found in project</p>
              )}
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            <div className="flex items-start">
              <Info className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800">
                <p className="font-medium mb-2">How Rules Combine:</p>
                <p className="mb-2">Files are excluded if they match ANY rule from:</p>
                <ol className="list-decimal list-inside space-y-1 mb-3">
                  <li>Project's .gitignore file (shown above)</li>
                  <li>Additional custom rules (entered below)</li>
                </ol>
                <p className="font-medium mb-1">Pattern Syntax Examples:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li><code className="bg-red-100 px-1">*.log</code> - Exclude all .log files</li>
                  <li><code className="bg-red-100 px-1">build/</code> - Exclude build directory</li>
                  <li><code className="bg-red-100 px-1">!important.txt</code> - Include file even if excluded</li>
                  <li><code className="bg-red-100 px-1">**/*.tmp</code> - Exclude .tmp files in all directories</li>
                  <li><code className="bg-red-100 px-1">&gt;1MB</code> - Exclude files larger than 1MB</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Validation errors */}
          {validationErrors.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
              <div className="flex items-start">
                <Info className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Validation Warnings:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Custom Rules (one per line)
            </label>
            <textarea
              value={rules}
              onChange={(e) => handleRulesChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 font-mono text-sm"
              placeholder="node_modules/&#10;*.log&#10;build/&#10;.env&#10;&gt;5MB"
              rows={8}
              style={{ minHeight: '200px' }}
            />
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
              className="px-4 py-2 text-white rounded-md transition-colors"
              style={{ 
                backgroundColor: '#E21350',
                '&:hover': { backgroundColor: '#C10E42' }
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#C10E42'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#E21350'}
            >
              Save Rules
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}