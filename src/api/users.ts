/**
 * User Management API Router
 * Demonstrates user CRUD operations with authentication and authorization
 */

import { Router, Request, Response } from 'express';
import { createLogger } from '@episensor/app-framework';
import { z } from 'zod';
import bcrypt from 'bcrypt';

const logger = createLogger('UsersAPI');

// User validation schemas
const CreateUserSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  roles: z.array(z.enum(['admin', 'user', 'viewer'])).default(['user']),
  isActive: z.boolean().default(true)
});

const UpdateUserSchema = CreateUserSchema.partial().omit({ password: true });

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(100),
  confirmPassword: z.string().min(8).max(100)
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
});

const LoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
  rememberMe: z.boolean().default(false)
});

// User interface
interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  firstName?: string;
  lastName?: string;
  roles: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  loginCount: number;
}

interface SafeUser {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  roles: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  loginCount: number;
}

// In-memory user storage for demonstration
const users = new Map<string, User>();
const sessions = new Map<string, { userId: string; createdAt: string; expiresAt: string }>();

// Helper functions
function toSafeUser(user: User): SafeUser {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

function generateSessionToken(): string {
  return Math.random().toString(36).substr(2) + Date.now().toString(36);
}

// Middleware
function requireAuth(req: any, res: Response, next: any) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  const session = sessions.get(token);
  if (!session || new Date() > new Date(session.expiresAt)) {
    if (session) sessions.delete(token);
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired session'
    });
  }

  const user = users.get(session.userId);
  if (!user || !user.isActive) {
    return res.status(401).json({
      success: false,
      error: 'User not found or inactive'
    });
  }

  req.user = toSafeUser(user);
  next();
}

function requireRole(roles: string[]) {
  return (req: any, res: Response, next: any) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const hasRole = roles.some(role => req.user.roles.includes(role));
    if (!hasRole) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }

    next();
  };
}

export function createUsersRouter(): Router {
  const router = Router();

  // Register new user
  router.post('/register', async (req: Request, res: Response) => {
    try {
      const userData = CreateUserSchema.parse(req.body);
      
      // Check if username or email already exists
      const existingUser = Array.from(users.values()).find(
        user => user.username === userData.username || user.email === userData.email
      );
      
      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: 'Username or email already exists'
        });
      }

      const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const passwordHash = await hashPassword(userData.password);
      
      const newUser: User = {
        id: userId,
        username: userData.username,
        email: userData.email,
        passwordHash,
        firstName: userData.firstName,
        lastName: userData.lastName,
        roles: userData.roles,
        isActive: userData.isActive,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        loginCount: 0
      };

      users.set(userId, newUser);
      
      logger.info('User registered successfully', { userId, username: userData.username });

      res.status(201).json({
        success: true,
        data: toSafeUser(newUser),
        message: 'User registered successfully'
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors
        });
      } else {
        logger.error('User registration failed', error);
        res.status(500).json({
          success: false,
          error: 'Registration failed',
          message: error.message
        });
      }
    }
  });

  // Login user
  router.post('/login', async (req: Request, res: Response) => {
    try {
      const loginData = LoginSchema.parse(req.body);
      
      const user = Array.from(users.values()).find(
        u => u.username === loginData.username || u.email === loginData.username
      );

      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }

      const passwordValid = await verifyPassword(loginData.password, user.passwordHash);
      if (!passwordValid) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }

      // Update user login info
      user.lastLoginAt = new Date().toISOString();
      user.loginCount += 1;
      user.updatedAt = new Date().toISOString();
      users.set(user.id, user);

      // Create session
      const token = generateSessionToken();
      const expiresIn = loginData.rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000; // 30 days or 1 day
      const expiresAt = new Date(Date.now() + expiresIn).toISOString();

      sessions.set(token, {
        userId: user.id,
        createdAt: new Date().toISOString(),
        expiresAt
      });

      logger.info('User logged in successfully', { userId: user.id, username: user.username });

      res.json({
        success: true,
        data: {
          user: toSafeUser(user),
          token,
          expiresAt
        },
        message: 'Login successful'
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors
        });
      } else {
        logger.error('Login failed', error);
        res.status(500).json({
          success: false,
          error: 'Login failed',
          message: error.message
        });
      }
    }
  });

  // Logout user
  router.post('/logout', requireAuth, (req: any, res: Response) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (token) {
        sessions.delete(token);
      }

      logger.info('User logged out', { userId: req.user.id });

      res.json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error: any) {
      logger.error('Logout failed', error);
      res.status(500).json({
        success: false,
        error: 'Logout failed',
        message: error.message
      });
    }
  });

  // Get current user profile
  router.get('/profile', requireAuth, (req: any, res: Response) => {
    res.json({
      success: true,
      data: req.user
    });
  });

  // Update user profile
  router.put('/profile', requireAuth, async (req: any, res: Response) => {
    try {
      const updateData = UpdateUserSchema.parse(req.body);
      const user = users.get(req.user.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Check for email/username conflicts (excluding current user)
      if (updateData.email || updateData.username) {
        const conflictUser = Array.from(users.values()).find(u => 
          u.id !== user.id && (
            (updateData.email && u.email === updateData.email) ||
            (updateData.username && u.username === updateData.username)
          )
        );

        if (conflictUser) {
          return res.status(409).json({
            success: false,
            error: 'Username or email already exists'
          });
        }
      }

      const updatedUser = {
        ...user,
        ...updateData,
        updatedAt: new Date().toISOString()
      };

      users.set(user.id, updatedUser);

      logger.info('User profile updated', { userId: user.id });

      res.json({
        success: true,
        data: toSafeUser(updatedUser),
        message: 'Profile updated successfully'
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors
        });
      } else {
        logger.error('Profile update failed', error);
        res.status(500).json({
          success: false,
          error: 'Profile update failed',
          message: error.message
        });
      }
    }
  });

  // Change password
  router.put('/change-password', requireAuth, async (req: any, res: Response) => {
    try {
      const passwordData = ChangePasswordSchema.parse(req.body);
      const user = users.get(req.user.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      const currentPasswordValid = await verifyPassword(passwordData.currentPassword, user.passwordHash);
      if (!currentPasswordValid) {
        return res.status(400).json({
          success: false,
          error: 'Current password is incorrect'
        });
      }

      const newPasswordHash = await hashPassword(passwordData.newPassword);
      user.passwordHash = newPasswordHash;
      user.updatedAt = new Date().toISOString();
      users.set(user.id, user);

      logger.info('Password changed successfully', { userId: user.id });

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors
        });
      } else {
        logger.error('Password change failed', error);
        res.status(500).json({
          success: false,
          error: 'Password change failed',
          message: error.message
        });
      }
    }
  });

  // Get all users (admin only)
  router.get('/', requireAuth, requireRole(['admin']), (req: Request, res: Response) => {
    try {
      const { role, active, limit = '10', offset = '0' } = req.query;
      let userList = Array.from(users.values());

      // Apply filters
      if (role) {
        userList = userList.filter(user => user.roles.includes(role as string));
      }

      if (active !== undefined) {
        const isActive = active === 'true';
        userList = userList.filter(user => user.isActive === isActive);
      }

      // Apply pagination
      const limitNum = parseInt(limit as string);
      const offsetNum = parseInt(offset as string);
      const paginatedUsers = userList.slice(offsetNum, offsetNum + limitNum);

      res.json({
        success: true,
        data: paginatedUsers.map(toSafeUser),
        pagination: {
          total: userList.length,
          limit: limitNum,
          offset: offsetNum,
          hasMore: offsetNum + limitNum < userList.length
        }
      });
    } catch (error: any) {
      logger.error('Failed to get users', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve users',
        message: error.message
      });
    }
  });

  // Get user by ID (admin only)
  router.get('/:userId', requireAuth, requireRole(['admin']), (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const user = users.get(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      res.json({
        success: true,
        data: toSafeUser(user)
      });
    } catch (error: any) {
      logger.error('Failed to get user', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve user',
        message: error.message
      });
    }
  });

  // Update user (admin only)
  router.put('/:userId', requireAuth, requireRole(['admin']), async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const updateData = UpdateUserSchema.parse(req.body);
      const user = users.get(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      const updatedUser = {
        ...user,
        ...updateData,
        updatedAt: new Date().toISOString()
      };

      users.set(userId, updatedUser);

      logger.info('User updated by admin', { userId, adminId: (req as any).user.id });

      res.json({
        success: true,
        data: toSafeUser(updatedUser),
        message: 'User updated successfully'
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors
        });
      } else {
        logger.error('User update failed', error);
        res.status(500).json({
          success: false,
          error: 'User update failed',
          message: error.message
        });
      }
    }
  });

  // Delete user (admin only)
  router.delete('/:userId', requireAuth, requireRole(['admin']), (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      
      if (!users.has(userId)) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Remove user sessions
      for (const [token, session] of sessions.entries()) {
        if (session.userId === userId) {
          sessions.delete(token);
        }
      }

      users.delete(userId);

      logger.info('User deleted by admin', { userId, adminId: (req as any).user.id });

      res.json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error: any) {
      logger.error('User deletion failed', error);
      res.status(500).json({
        success: false,
        error: 'User deletion failed',
        message: error.message
      });
    }
  });

  // Get user statistics (admin only)
  router.get('/admin/stats', requireAuth, requireRole(['admin']), (req: Request, res: Response) => {
    try {
      const userList = Array.from(users.values());
      const stats = {
        total: userList.length,
        active: userList.filter(u => u.isActive).length,
        inactive: userList.filter(u => !u.isActive).length,
        byRole: userList.reduce((acc, user) => {
          user.roles.forEach(role => {
            acc[role] = (acc[role] || 0) + 1;
          });
          return acc;
        }, {} as Record<string, number>),
        recentRegistrations: userList
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5)
          .map(u => ({
            id: u.id,
            username: u.username,
            createdAt: u.createdAt
          })),
        activeSessions: sessions.size
      };

      res.json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      logger.error('Failed to get user statistics', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve statistics',
        message: error.message
      });
    }
  });

  return router;
}