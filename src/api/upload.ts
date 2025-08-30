/**
 * File Upload API Router
 * Demonstrates file upload handling with validation and processing
 */

import { Router, Request, Response } from 'express';
import { createLogger } from '@episensor/app-framework';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';

const logger = createLogger('UploadAPI');

// File validation schema
const FileMetadataSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  tags: z.array(z.string()).optional(),
  category: z.enum(['image', 'document', 'data', 'other']).default('other'),
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'data', 'uploads');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error as Error, uploadDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.UPLOAD_MAX_SIZE || '10485760'), // 10MB default
    files: 5
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = process.env.UPLOAD_ALLOWED_TYPES?.split(',') || [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'text/plain',
      'application/json'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`));
    }
  }
});

// In-memory file registry for demonstration
interface FileRecord {
  id: string;
  originalName: string;
  filename: string;
  mimetype: string;
  size: number;
  path: string;
  metadata: any;
  uploadedAt: string;
  uploadedBy?: string;
}

const fileRegistry = new Map<string, FileRecord>();

export function createUploadRouter(): Router {
  const router = Router();

  // Upload single file
  router.post('/single', upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: 'No file provided'
        });
        return;
      }

      const metadata = req.body.metadata ? JSON.parse(req.body.metadata) : {};
      const validatedMetadata = FileMetadataSchema.parse(metadata);

      const fileId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const fileRecord: FileRecord = {
        id: fileId,
        originalName: req.file.originalname,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        metadata: validatedMetadata,
        uploadedAt: new Date().toISOString(),
        uploadedBy: req.session?.user?.id || 'anonymous'
      };

      fileRegistry.set(fileId, fileRecord);

      logger.info('File uploaded successfully', {
        fileId,
        originalName: req.file.originalname,
        size: req.file.size
      });

      res.status(201).json({
        success: true,
        data: {
          id: fileId,
          originalName: fileRecord.originalName,
          size: fileRecord.size,
          mimetype: fileRecord.mimetype,
          metadata: fileRecord.metadata,
          uploadedAt: fileRecord.uploadedAt,
          downloadUrl: `/api/upload/download/${fileId}`
        },
        message: 'File uploaded successfully'
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Invalid metadata',
          details: error.errors
        });
      } else {
        logger.error('File upload failed', error);
        res.status(500).json({
          success: false,
          error: 'File upload failed',
          message: error.message
        });
      }
    }
  });

  // Upload multiple files
  router.post('/multiple', upload.array('files', 5), async (req: Request, res: Response) => {
    try {
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        res.status(400).json({
          success: false,
          error: 'No files provided'
        });
        return;
      }

      const uploadedFiles = [];
      
      for (const file of files) {
        const fileId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const fileRecord: FileRecord = {
          id: fileId,
          originalName: file.originalname,
          filename: file.filename,
          mimetype: file.mimetype,
          size: file.size,
          path: file.path,
          metadata: {},
          uploadedAt: new Date().toISOString()
        };

        fileRegistry.set(fileId, fileRecord);
        uploadedFiles.push({
          id: fileId,
          originalName: fileRecord.originalName,
          size: fileRecord.size,
          mimetype: fileRecord.mimetype
        });
      }

      logger.info('Multiple files uploaded', { count: files.length });

      res.status(201).json({
        success: true,
        data: {
          files: uploadedFiles,
          count: uploadedFiles.length
        },
        message: `${uploadedFiles.length} files uploaded successfully`
      });
    } catch (error: any) {
      logger.error('Multiple file upload failed', error);
      res.status(500).json({
        success: false,
        error: 'File upload failed',
        message: error.message
      });
    }
  });

  // Get all uploaded files
  router.get('/files', (req: Request, res: Response) => {
    try {
      const { category, limit = '10', offset = '0' } = req.query;
      let files = Array.from(fileRegistry.values());

      // Filter by category if specified
      if (category) {
        files = files.filter(file => file.metadata.category === category);
      }

      // Apply pagination
      const limitNum = parseInt(limit as string);
      const offsetNum = parseInt(offset as string);
      const paginatedFiles = files.slice(offsetNum, offsetNum + limitNum);

      // Return safe file info (no file paths)
      const safeFiles = paginatedFiles.map(file => ({
        id: file.id,
        originalName: file.originalName,
        mimetype: file.mimetype,
        size: file.size,
        metadata: file.metadata,
        uploadedAt: file.uploadedAt,
        downloadUrl: `/api/upload/download/${file.id}`
      }));

      res.json({
        success: true,
        data: safeFiles,
        pagination: {
          total: files.length,
          limit: limitNum,
          offset: offsetNum,
          hasMore: offsetNum + limitNum < files.length
        }
      });
    } catch (error: any) {
      logger.error('Failed to get files', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve files',
        message: error.message
      });
    }
  });

  // Get file metadata
  router.get('/files/:fileId', (req: Request, res: Response) => {
    try {
      const { fileId } = req.params;
      const fileRecord = fileRegistry.get(fileId);

      if (!fileRecord) {
        res.status(404).json({
          success: false,
          error: 'File not found'
        });
        return;
      }

      res.json({
        success: true,
        data: {
          id: fileRecord.id,
          originalName: fileRecord.originalName,
          mimetype: fileRecord.mimetype,
          size: fileRecord.size,
          metadata: fileRecord.metadata,
          uploadedAt: fileRecord.uploadedAt,
          downloadUrl: `/api/upload/download/${fileId}`
        }
      });
    } catch (error: any) {
      logger.error('Failed to get file metadata', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve file metadata',
        message: error.message
      });
    }
  });

  // Download file
  router.get('/download/:fileId', async (req: Request, res: Response) => {
    try {
      const { fileId } = req.params;
      const fileRecord = fileRegistry.get(fileId);

      if (!fileRecord) {
        res.status(404).json({
          success: false,
          error: 'File not found'
        });
        return;
      }

      // Check if file exists on disk
      try {
        await fs.access(fileRecord.path);
      } catch {
        res.status(404).json({
          success: false,
          error: 'File not found on disk'
        });
        return;
      }

      // Set appropriate headers
      res.setHeader('Content-Type', fileRecord.mimetype);
      res.setHeader('Content-Disposition', `attachment; filename="${fileRecord.originalName}"`);

      // Send file
      res.sendFile(path.resolve(fileRecord.path));
      
      logger.info('File downloaded', { fileId, originalName: fileRecord.originalName });
    } catch (error: any) {
      logger.error('File download failed', error);
      res.status(500).json({
        success: false,
        error: 'File download failed',
        message: error.message
      });
    }
  });

  // Update file metadata
  router.put('/files/:fileId/metadata', async (req: Request, res: Response) => {
    try {
      const { fileId } = req.params;
      const fileRecord = fileRegistry.get(fileId);

      if (!fileRecord) {
        res.status(404).json({
          success: false,
          error: 'File not found'
        });
        return;
      }

      const validatedMetadata = FileMetadataSchema.parse(req.body);
      fileRecord.metadata = { ...fileRecord.metadata, ...validatedMetadata };
      fileRegistry.set(fileId, fileRecord);

      logger.info('File metadata updated', { fileId });

      res.json({
        success: true,
        data: {
          id: fileRecord.id,
          metadata: fileRecord.metadata
        },
        message: 'Metadata updated successfully'
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Invalid metadata',
          details: error.errors
        });
      } else {
        logger.error('Failed to update metadata', error);
        res.status(500).json({
          success: false,
          error: 'Failed to update metadata',
          message: error.message
        });
      }
    }
  });

  // Delete file
  router.delete('/files/:fileId', async (req: Request, res: Response) => {
    try {
      const { fileId } = req.params;
      const fileRecord = fileRegistry.get(fileId);

      if (!fileRecord) {
        res.status(404).json({
          success: false,
          error: 'File not found'
        });
        return;
      }

      // Delete file from disk
      try {
        await fs.unlink(fileRecord.path);
      } catch (unlinkError) {
        logger.warn('Failed to delete file from disk', { path: fileRecord.path, unlinkError });
      }

      // Remove from registry
      fileRegistry.delete(fileId);

      logger.info('File deleted', { fileId, originalName: fileRecord.originalName });

      res.json({
        success: true,
        message: 'File deleted successfully'
      });
    } catch (error: any) {
      logger.error('File deletion failed', error);
      res.status(500).json({
        success: false,
        error: 'File deletion failed',
        message: error.message
      });
    }
  });

  // Get upload statistics
  router.get('/stats', (req: Request, res: Response) => {
    try {
      const files = Array.from(fileRegistry.values());
      const stats = {
        totalFiles: files.length,
        totalSize: files.reduce((sum, file) => sum + file.size, 0),
        byMimetype: files.reduce((acc, file) => {
          acc[file.mimetype] = (acc[file.mimetype] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        byCategory: files.reduce((acc, file) => {
          const category = file.metadata.category || 'other';
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        recentUploads: files
          .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
          .slice(0, 5)
          .map(file => ({
            id: file.id,
            originalName: file.originalName,
            size: file.size,
            uploadedAt: file.uploadedAt
          }))
      };

      res.json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      logger.error('Failed to get upload statistics', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve statistics',
        message: error.message
      });
    }
  });

  return router;
}