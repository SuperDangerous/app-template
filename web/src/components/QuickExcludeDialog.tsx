import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, FileText, HardDrive, FileCode, FileJson, Image, Archive, FileType, File } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Button, Checkbox, Badge } from '../components/ui-stubs';
import { formatBytes, cn } from '@/lib/utils';
import { toast } from 'sonner';
import { apiRequest } from '@/lib/api';

interface FileInfo {
  path: string;
  size: number;
  relativePath: string;
}

interface QuickExcludeDialogProps {
  project: {
    id: string;
    name: string;
    additionalGitignoreRules: string[];
  };
  open: boolean;
  onClose: () => void;
  onSave: (rules: string[]) => void;
}

export function QuickExcludeDialog({ project, open, onClose, onSave }: QuickExcludeDialogProps) {
  const [loading, setLoading] = useState(false);
  const [largestFiles, setLargestFiles] = useState<FileInfo[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [totalSize, setTotalSize] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);

  useEffect(() => {
    if (open) {
      fetchLargestFiles();
    }
  }, [open, project.id]);

  const fetchLargestFiles = async () => {
    setLoading(true);
    try {
      const data = await apiRequest(`/api/analyze/largest-files/${project.id}?limit=20`);
      setLargestFiles(data.files);
      setTotalFiles(data.totalFiles);
      setTotalSize(data.totalSize);
      setSelectedFiles(new Set());
    } catch (error) {
      toast.error('Failed to analyze project files');
    } finally {
      setLoading(false);
    }
  };

  const toggleFile = (path: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(path)) {
      newSelected.delete(path);
    } else {
      newSelected.add(path);
    }
    setSelectedFiles(newSelected);
  };

  const handleExclude = () => {
    if (selectedFiles.size === 0) {
      toast.error('No files selected');
      return;
    }

    // Convert selected file paths to gitignore patterns
    const newRules = Array.from(selectedFiles).map(file => {
      // Use relative path for the rule
      const fileInfo = largestFiles.find(f => f.relativePath === file);
      return fileInfo ? fileInfo.relativePath : file;
    });

    // Combine with existing rules
    const combinedRules = [...project.additionalGitignoreRules, ...newRules];
    
    onSave(combinedRules);
    onClose();
  };

  const selectedSize = largestFiles
    .filter(f => selectedFiles.has(f.relativePath))
    .reduce((sum, f) => sum + f.size, 0);

  // Get file icon based on extension
  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js':
      case 'jsx':
      case 'ts':
      case 'tsx':
      case 'py':
      case 'java':
      case 'cpp':
      case 'c':
      case 'cs':
      case 'go':
      case 'rs':
      case 'swift':
        return FileCode;
      case 'json':
      case 'xml':
      case 'yaml':
      case 'yml':
        return FileJson;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg':
      case 'webp':
        return Image;
      case 'zip':
      case 'tar':
      case 'gz':
      case 'rar':
      case '7z':
        return Archive;
      case 'txt':
      case 'md':
      case 'markdown':
      case 'doc':
      case 'docx':
        return FileText;
      default:
        return File;
    }
  };

  // Get color for file type icon
  const getFileIconColor = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js':
      case 'jsx':
        return 'text-yellow-600'; // JavaScript - yellow
      case 'ts':
      case 'tsx':
        return 'text-blue-600'; // TypeScript - blue
      case 'py':
        return 'text-green-600'; // Python - green
      case 'java':
        return 'text-orange-600'; // Java - orange
      case 'cpp':
      case 'c':
        return 'text-purple-600'; // C/C++ - purple
      case 'cs':
        return 'text-violet-600'; // C# - violet
      case 'go':
        return 'text-cyan-600'; // Go - cyan
      case 'rs':
        return 'text-orange-700'; // Rust - orange/brown
      case 'swift':
        return 'text-orange-500'; // Swift - orange
      case 'json':
        return 'text-gray-600'; // JSON - gray
      case 'xml':
      case 'yaml':
      case 'yml':
        return 'text-red-600'; // Config files - red
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg':
      case 'webp':
        return 'text-emerald-600'; // Images - emerald
      case 'zip':
      case 'tar':
      case 'gz':
      case 'rar':
      case '7z':
        return 'text-amber-600'; // Archives - amber
      case 'txt':
      case 'md':
      case 'markdown':
        return 'text-gray-500'; // Text files - gray
      case 'doc':
      case 'docx':
        return 'text-blue-500'; // Word docs - blue
      default:
        return 'text-gray-400'; // Default - light gray
    }
  };

  // Get color based on file size
  const getSizeColor = (size: number) => {
    const mb = size / (1024 * 1024);
    if (mb > 10) return 'text-red-600 dark:text-red-400';
    if (mb > 5) return 'text-orange-600 dark:text-orange-400';
    if (mb > 2) return 'text-yellow-600 dark:text-yellow-400';
    if (mb > 1) return 'text-blue-600 dark:text-blue-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  // Get background color based on file size
  const getSizeBgColor = (size: number) => {
    const mb = size / (1024 * 1024);
    if (mb > 10) return 'bg-red-50 dark:bg-red-900/20';
    if (mb > 5) return 'bg-orange-50 dark:bg-orange-900/20';
    if (mb > 2) return 'bg-yellow-50 dark:bg-yellow-900/20';
    if (mb > 1) return 'bg-blue-50 dark:bg-blue-900/20';
    return '';
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col" aria-describedby="quick-exclude-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Quick Exclude - {project.name}
          </DialogTitle>
          <p id="quick-exclude-description" className="sr-only">
            Select large files to exclude from your project to reduce token usage
          </p>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Analyzing project files...</p>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-muted/50 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Quick Exclude Large Files</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Select files below to add them to your exclusion rules. This helps reduce token usage when copying the codebase.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center mb-4">
                <div className="text-sm text-muted-foreground">
                  Showing top {largestFiles.length} largest files out of {totalFiles} total files
                </div>
                <div className="flex gap-4 text-sm">
                  <span>Total size: <strong>{formatBytes(totalSize)}</strong></span>
                  <span>Selected: <strong>{formatBytes(selectedSize)}</strong></span>
                </div>
              </div>

              {/* Size Legend */}
              <div className="mb-4 p-3 bg-muted/30 rounded-lg">
                <div className="text-xs font-medium mb-2">File Size Legend:</div>
                <div className="flex flex-wrap gap-3 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded"></div>
                    <span>&gt; 10 MB</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 rounded"></div>
                    <span>5-10 MB</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 rounded"></div>
                    <span>2-5 MB</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 rounded"></div>
                    <span>1-2 MB</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-white border border-gray-200 rounded"></div>
                    <span>&lt; 1 MB</span>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg divide-y">
                {largestFiles.map((file) => {
                  const FileIcon = getFileIcon(file.relativePath);
                  return (
                    <div
                      key={file.relativePath}
                      className={cn(
                        "flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors",
                        getSizeBgColor(file.size)
                      )}
                    >
                      <Checkbox
                        checked={selectedFiles.has(file.relativePath)}
                        onCheckedChange={() => toggleFile(file.relativePath)}
                      />
                      <FileIcon className={cn("h-4 w-4 flex-shrink-0", getFileIconColor(file.relativePath))} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-mono truncate">{file.relativePath}</p>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={cn("ml-auto", getSizeColor(file.size))}
                      >
                        {formatBytes(file.size)}
                      </Badge>
                    </div>
                  );
                })}
              </div>

              {selectedFiles.size > 0 && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>{selectedFiles.size} file{selectedFiles.size !== 1 ? 's' : ''}</strong> selected 
                    ({formatBytes(selectedSize)} will be excluded)
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleExclude}
            disabled={selectedFiles.size === 0 || loading}
          >
            Add to Exclusions ({selectedFiles.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}