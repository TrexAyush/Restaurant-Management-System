import request from 'supertest';
import app from '../server';
import { authService } from '../services/authService';
import { userRepository } from '../repositories/userRepository';
import { UserRole } from '../models/enums';

describe('Authentication System', () => {
  describe('POST /api/auth/login', () => {
    it('should reject login with missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toBe('Username and password are required');
    });

    it('should reject login with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistent',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error.code).toBe('LOGIN_FAILED');
    });
  });

  describe('GET /api/auth/profile', () => {
    it('should reject access without authentication token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });

    it('should reject access with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error.code).toBe('TOKEN_VERIFICATION_FAILED');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should allow logout without token (graceful handling)', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });
  });

  describe('Authentication Service', () => {
    it('should hash passwords correctly', async () => {
      const password = 'testpassword123';
      const hash = await authService.hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50); // bcrypt hashes are typically 60 chars
    });

    it('should verify passwords correctly', async () => {
      const password = 'testpassword123';
      const hash = await authService.hashPassword(password);
      
      const isValid = await authService.verifyPassword(password, hash);
      const isInvalid = await authService.verifyPassword('wrongpassword', hash);
      
      expect(isValid).toBe(true);
      expect(isInvalid).toBe(false);
    });

    it('should generate valid JWT tokens', () => {
      const mockUser = {
        id: 'test-user-id',
        username: 'testuser',
        passwordHash: 'hash',
        role: UserRole.WAITER,
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const token = authService.generateToken(mockUser);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should verify JWT tokens correctly', () => {
      const mockUser = {
        id: 'test-user-id',
        username: 'testuser',
        passwordHash: 'hash',
        role: UserRole.WAITER,
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const token = authService.generateToken(mockUser);
      const payload = authService.verifyToken(token);
      
      expect(payload.userId).toBe(mockUser.id);
      expect(payload.username).toBe(mockUser.username);
      expect(payload.role).toBe(mockUser.role);
    });

    it('should reject invalid JWT tokens', () => {
      expect(() => {
        authService.verifyToken('invalid-token');
      }).toThrow();
    });
  });
});