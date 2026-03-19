import { Request, Response, NextFunction } from 'express';
import { authService, JWTPayload } from '../services/authService';
import { UserRole } from '../models/enums';

// Extend Express Request interface to include user data
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

/**
 * Authentication middleware - verifies JWT token
 */
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      res.status(401).json({
        error: {
          code: 'MISSING_TOKEN',
          message: 'Authorization header is required',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
      return;
    }

    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : authHeader;

    if (!token) {
      res.status(401).json({
        error: {
          code: 'INVALID_TOKEN_FORMAT',
          message: 'Token must be provided in Authorization header',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
      return;
    }

    // Verify token
    const payload = authService.verifyToken(token);
    req.user = payload;
    
    next();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Token verification failed';
    
    res.status(401).json({
      error: {
        code: 'TOKEN_VERIFICATION_FAILED',
        message: errorMessage,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown'
      }
    });
  }
};

/**
 * Authorization middleware factory - checks if user has required role(s)
 */
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication is required for this endpoint',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
      return;
    }

    const userRole = req.user.role;
    
    if (!allowedRoles.includes(userRole)) {
      res.status(403).json({
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: `Access denied. Required roles: ${allowedRoles.join(', ')}. Your role: ${userRole}`,
          details: {
            userRole,
            requiredRoles: allowedRoles
          },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
      return;
    }

    next();
  };
};

/**
 * Role-based access control middleware combinations
 */
export const requireAdmin = authorize(UserRole.ADMIN);
export const requireManager = authorize(UserRole.ADMIN, UserRole.MANAGER);
export const requireWaiter = authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.WAITER);
export const requireKitchenStaff = authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.KITCHEN_STAFF);
export const requireCashier = authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER);
export const requireManagerOrWaiter = authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.WAITER);
export const requireManagerOrKitchenStaff = authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.KITCHEN_STAFF);

/**
 * Flexible role checking - allows multiple role combinations
 */
export const requireAnyRole = (...roles: UserRole[]) => authorize(...roles);

/**
 * Self-access middleware - allows users to access their own resources
 */
export const requireSelfOrAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      error: {
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication is required for this endpoint',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown'
      }
    });
    return;
  }

  const userId = req.params.userId || req.params.id;
  const isAdmin = req.user.role === UserRole.ADMIN;
  const isSelf = req.user.userId === userId;

  if (!isAdmin && !isSelf) {
    res.status(403).json({
      error: {
        code: 'ACCESS_DENIED',
        message: 'You can only access your own resources or must be an admin',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown'
      }
    });
    return;
  }

  next();
};

/**
 * Session management middleware - tracks active sessions
 */
export interface SessionInfo {
  userId: string;
  username: string;
  role: UserRole;
  loginTime: Date;
  lastActivity: Date;
  ipAddress: string;
  userAgent: string;
}

class SessionManager {
  private activeSessions: Map<string, SessionInfo> = new Map();
  private readonly SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  /**
   * Create a new session
   */
  createSession(token: string, user: JWTPayload, req: Request): void {
    const sessionInfo: SessionInfo = {
      userId: user.userId,
      username: user.username,
      role: user.role,
      loginTime: new Date(),
      lastActivity: new Date(),
      ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown'
    };

    this.activeSessions.set(token, sessionInfo);
  }

  /**
   * Update session activity
   */
  updateActivity(token: string): void {
    const session = this.activeSessions.get(token);
    if (session) {
      session.lastActivity = new Date();
    }
  }

  /**
   * Remove session
   */
  removeSession(token: string): void {
    this.activeSessions.delete(token);
  }

  /**
   * Get session info
   */
  getSession(token: string): SessionInfo | undefined {
    return this.activeSessions.get(token);
  }

  /**
   * Check if session is expired
   */
  isSessionExpired(token: string): boolean {
    const session = this.activeSessions.get(token);
    if (!session) return true;

    const now = new Date().getTime();
    const lastActivity = session.lastActivity.getTime();
    
    return (now - lastActivity) > this.SESSION_TIMEOUT;
  }

  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions(): void {
    const now = new Date().getTime();
    
    for (const [token, session] of this.activeSessions.entries()) {
      const lastActivity = session.lastActivity.getTime();
      if ((now - lastActivity) > this.SESSION_TIMEOUT) {
        this.activeSessions.delete(token);
      }
    }
  }

  /**
   * Get all active sessions for a user
   */
  getUserSessions(userId: string): SessionInfo[] {
    const sessions: SessionInfo[] = [];
    
    for (const session of this.activeSessions.values()) {
      if (session.userId === userId) {
        sessions.push(session);
      }
    }
    
    return sessions;
  }

  /**
   * Terminate all sessions for a user
   */
  terminateUserSessions(userId: string): void {
    const tokensToRemove: string[] = [];
    
    for (const [token, session] of this.activeSessions.entries()) {
      if (session.userId === userId) {
        tokensToRemove.push(token);
      }
    }
    
    tokensToRemove.forEach(token => this.activeSessions.delete(token));
  }
}

// Export singleton session manager
export const sessionManager = new SessionManager();

// Periodically clean up expired sessions (every 15 minutes)
const SESSION_CLEANUP_INTERVAL = 15 * 60 * 1000;
setInterval(() => {
  sessionManager.cleanupExpiredSessions();
}, SESSION_CLEANUP_INTERVAL);

/**
 * Session tracking middleware
 */
export const trackSession = (req: Request, res: Response, next: NextFunction): void => {
  if (req.user) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : authHeader;

    if (token) {
      // Check if session exists and is not expired
      if (sessionManager.isSessionExpired(token)) {
        sessionManager.removeSession(token);
        res.status(401).json({
          error: {
            code: 'SESSION_EXPIRED',
            message: 'Your session has expired. Please log in again.',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
        return;
      }

      // Update session activity
      sessionManager.updateActivity(token);
    }
  }

  next();
};

/**
 * Permission checking utilities
 */
export const hasPermission = {
  /**
   * Check if user can manage users
   */
  manageUsers: (role: UserRole): boolean => {
    return role === UserRole.ADMIN;
  },

  /**
   * Check if user can manage menu
   */
  manageMenu: (role: UserRole): boolean => {
    return [UserRole.ADMIN, UserRole.MANAGER].includes(role);
  },

  /**
   * Check if user can manage tables
   */
  manageTables: (role: UserRole): boolean => {
    return [UserRole.ADMIN, UserRole.MANAGER].includes(role);
  },

  /**
   * Check if user can create orders
   */
  createOrders: (role: UserRole): boolean => {
    return [UserRole.ADMIN, UserRole.MANAGER, UserRole.WAITER].includes(role);
  },

  /**
   * Check if user can update order status
   */
  updateOrderStatus: (role: UserRole): boolean => {
    return [UserRole.ADMIN, UserRole.MANAGER, UserRole.KITCHEN_STAFF].includes(role);
  },

  /**
   * Check if user can process payments
   */
  processPayments: (role: UserRole): boolean => {
    return [UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER].includes(role);
  },

  /**
   * Check if user can manage inventory
   */
  manageInventory: (role: UserRole): boolean => {
    return [UserRole.ADMIN, UserRole.MANAGER].includes(role);
  },

  /**
   * Check if user can view reports
   */
  viewReports: (role: UserRole): boolean => {
    return [UserRole.ADMIN, UserRole.MANAGER].includes(role);
  }
};

// Cleanup expired sessions every hour
setInterval(() => {
  sessionManager.cleanupExpiredSessions();
}, 60 * 60 * 1000);