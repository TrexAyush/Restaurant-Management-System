import bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { User, LoginRequest, AuthResponse, CreateUserRequest } from '../models/User';
import { UserRole } from '../models/enums';
import { userRepository } from '../repositories/userRepository';

export interface JWTPayload {
  userId: string;
  username: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export class AuthService {
  private readonly JWT_SECRET: string;
  private readonly JWT_EXPIRES_IN: string | number;
  private readonly SALT_ROUNDS: number = 12;

  constructor() {
    this.JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    this.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
    
    if (process.env.NODE_ENV === 'production' && this.JWT_SECRET === 'your-secret-key-change-in-production') {
      throw new Error('JWT_SECRET must be set in production environment');
    }
  }

  /**
   * Hash a password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Verify a password against its hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate a JWT token for a user
   */
  generateToken(user: User): string {
    const payload: JWTPayload = {
      userId: user.id,
      username: user.username,
      role: user.role
    };

    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: '24h',
      issuer: 'restaurant-management-system',
      audience: 'rms-users'
    });
  }

  /**
   * Verify and decode a JWT token
   */
  verifyToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET, {
        issuer: 'restaurant-management-system',
        audience: 'rms-users'
      });
      
      return decoded as JWTPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token has expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid token');
      } else {
        throw new Error('Token verification failed');
      }
    }
  }

  /**
   * Authenticate user with username and password
   */
  async login(loginRequest: LoginRequest): Promise<AuthResponse> {
    const { username, password } = loginRequest;

    // Find user by username
    const user = await userRepository.findByUsername(username);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await this.verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Generate token
    const token = this.generateToken(user);

    // Return user data without password hash
    const { passwordHash, ...userWithoutPassword } = user;
    
    return {
      user: userWithoutPassword,
      token
    };
  }

  /**
   * Create a new user account
   */
  async createUser(createUserRequest: CreateUserRequest): Promise<User> {
    const { password, ...userData } = createUserRequest;

    // Check if username already exists
    const existingUser = await userRepository.findByUsername(userData.username);
    if (existingUser) {
      throw new Error('Username already exists');
    }

    // Check if email already exists
    const existingEmail = await userRepository.findByEmail(userData.email);
    if (existingEmail) {
      throw new Error('Email already exists');
    }

    // Hash password
    const passwordHash = await this.hashPassword(password);

    // Create user
    const newUser = await userRepository.create({
      ...userData,
      passwordHash,
      isActive: true
    });

    return newUser;
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await this.verifyPassword(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await this.hashPassword(newPassword);

    // Update password
    await userRepository.updatePassword(userId, newPasswordHash);
  }

  /**
   * Deactivate user account
   */
  async deactivateUser(userId: string): Promise<void> {
    await userRepository.updateActiveStatus(userId, false);
  }

  /**
   * Activate user account
   */
  async activateUser(userId: string): Promise<void> {
    await userRepository.updateActiveStatus(userId, true);
  }

  /**
   * Get all users (without password hashes)
   */
  async getAllUsers(): Promise<Omit<User, 'passwordHash'>[]> {
    const users = await userRepository.findAll();
    return users.map(user => {
      const { passwordHash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  }

  /**
   * Get user profile by ID (without password hash)
   */
  async getUserProfile(userId: string): Promise<Omit<User, 'passwordHash'> | null> {
    const user = await userRepository.findById(userId);
    if (!user) {
      return null;
    }

    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}

// Export singleton instance
export const authService = new AuthService();