import { Router } from 'express';
import { authController } from '../controllers/authController';
import { 
  authenticate, 
  requireAdmin, 
  trackSession,
  requireSelfOrAdmin 
} from '../middleware/authMiddleware';

const router = Router();

/**
 * @route POST /api/auth/login
 * @desc User login
 * @access Public
 */
router.post('/login', authController.login.bind(authController));

/**
 * @route POST /api/auth/logout
 * @desc User logout
 * @access Private
 */
router.post('/logout', authenticate, trackSession, authController.logout.bind(authController));

/**
 * @route GET /api/auth/profile
 * @desc Get current user profile
 * @access Private
 */
router.get('/profile', authenticate, trackSession, authController.getProfile.bind(authController));

/**
 * @route PUT /api/auth/change-password
 * @desc Change user password
 * @access Private
 */
router.put('/change-password', authenticate, trackSession, authController.changePassword.bind(authController));

/**
 * @route GET /api/auth/users
 * @desc Get all users (Admin only)
 * @access Private (Admin)
 */
router.get('/users', authenticate, trackSession, requireAdmin, authController.getUsers.bind(authController));

/**
 * @route POST /api/auth/users
 * @desc Create new user (Admin only)
 * @access Private (Admin)
 */
router.post('/users', authenticate, trackSession, requireAdmin, authController.createUser.bind(authController));

/**
 * @route GET /api/auth/sessions
 * @desc Get active sessions for current user
 * @access Private
 */
router.get('/sessions', authenticate, trackSession, authController.getSessions.bind(authController));

/**
 * @route DELETE /api/auth/sessions
 * @desc Terminate all sessions for current user
 * @access Private
 */
router.delete('/sessions', authenticate, trackSession, authController.terminateAllSessions.bind(authController));

export default router;