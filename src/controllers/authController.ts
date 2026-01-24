import { Request, Response } from 'express';
import { authService } from '../services/authService';
import { validateCreateUserRequest, LoginRequest, CreateUserRequest } from '../models/User';
import { sessionManager } from '../middleware/authMiddleware';

export class AuthController {
  /**
   * User login endpoint
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const loginRequest: LoginRequest = req.body;

      // Validate request body
      if (!loginRequest.username || !loginRequest.password) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Username and password are required',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
        return;
      }

      // Authenticate user
      const authResponse = await authService.login(loginRequest);

      // Create session
      sessionManager.createSession(authResponse.token, {
        userId: authResponse.user.id,
        username: authResponse.user.username,
        role: authResponse.user.role
      }, req);

      res.status(200).json({
        success: true,
        data: authResponse,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      
      res.status(401).json({
        error: {
          code: 'LOGIN_FAILED',
          message: errorMessage,
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }
  }

  /**
   * User logout endpoint
   */
  async logout(req: Request, res: Response): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith('Bearer ') 
        ? authHeader.substring(7) 
        : authHeader;

      if (token) {
        sessionManager.removeSession(token);
      }

      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      res.status(500).json({
        error: {
          code: 'LOGOUT_ERROR',
          message: 'An error occurred during logout',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }
  }

  /**
   * Get current user profile
   */
  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication is required',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
        return;
      }

      const userProfile = await authService.getUserProfile(req.user.userId);
      
      if (!userProfile) {
        res.status(404).json({
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User profile not found',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: userProfile,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get profile';
      
      res.status(500).json({
        error: {
          code: 'PROFILE_ERROR',
          message: errorMessage,
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }
  }

  /**
   * Change password endpoint
   */
  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication is required',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
        return;
      }

      const { currentPassword, newPassword } = req.body;

      // Validate request body
      if (!currentPassword || !newPassword) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Current password and new password are required',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
        return;
      }

      // Validate new password
      if (newPassword.length < 8 || newPassword.length > 128) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'New password must be 8-128 characters long',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
        return;
      }

      await authService.changePassword(req.user.userId, currentPassword, newPassword);

      res.status(200).json({
        success: true,
        message: 'Password changed successfully',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to change password';
      
      res.status(400).json({
        error: {
          code: 'PASSWORD_CHANGE_FAILED',
          message: errorMessage,
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }
  }

  /**
   * Get all users (Admin only)
   */
  async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await authService.getAllUsers();

      res.status(200).json({
        success: true,
        data: users,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get users';
      
      res.status(500).json({
        error: {
          code: 'GET_USERS_FAILED',
          message: errorMessage,
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }
  }

  /**
   * Create user endpoint (Admin only)
   */
  async createUser(req: Request, res: Response): Promise<void> {
    try {
      const createUserRequest: CreateUserRequest = req.body;

      // Validate request body
      const validationErrors = validateCreateUserRequest(createUserRequest);
      if (validationErrors.length > 0) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: validationErrors,
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
        return;
      }

      const newUser = await authService.createUser(createUserRequest);

      // Remove password hash from response
      const { passwordHash, ...userWithoutPassword } = newUser;

      res.status(201).json({
        success: true,
        data: userWithoutPassword,
        message: 'User created successfully',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create user';
      
      res.status(400).json({
        error: {
          code: 'USER_CREATION_FAILED',
          message: errorMessage,
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }
  }

  /**
   * Get active sessions for current user
   */
  async getSessions(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication is required',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
        return;
      }

      const sessions = sessionManager.getUserSessions(req.user.userId);

      res.status(200).json({
        success: true,
        data: sessions,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      res.status(500).json({
        error: {
          code: 'SESSIONS_ERROR',
          message: 'Failed to get sessions',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }
  }

  /**
   * Terminate all sessions for current user
   */
  async terminateAllSessions(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication is required',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
        return;
      }

      sessionManager.terminateUserSessions(req.user.userId);

      res.status(200).json({
        success: true,
        message: 'All sessions terminated successfully',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      res.status(500).json({
        error: {
          code: 'SESSION_TERMINATION_ERROR',
          message: 'Failed to terminate sessions',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }
  }
}

// Export singleton instance
export const authController = new AuthController();