import { UserRole } from './enums';

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  email: string;
}

export interface UpdateUserRequest {
  username?: string;
  role?: UserRole;
  firstName?: string;
  lastName?: string;
  email?: string;
  isActive?: boolean;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  user: Omit<User, 'passwordHash'>;
  token: string;
}

// Validation functions
export const validateUser = {
  username: (username: string): boolean => {
    return typeof username === 'string' && 
           username.length >= 3 && 
           username.length <= 50 &&
           /^[a-zA-Z0-9_]+$/.test(username);
  },

  password: (password: string): boolean => {
    return typeof password === 'string' && 
           password.length >= 8 && 
           password.length <= 128;
  },

  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return typeof email === 'string' && 
           email.length <= 255 && 
           emailRegex.test(email);
  },

  name: (name: string): boolean => {
    return typeof name === 'string' && 
           name.length >= 1 && 
           name.length <= 100 &&
           name.trim().length > 0;
  },

  role: (role: string): role is UserRole => {
    return Object.values(UserRole).includes(role as UserRole);
  }
};

export const validateCreateUserRequest = (request: CreateUserRequest): string[] => {
  const errors: string[] = [];

  if (!validateUser.username(request.username)) {
    errors.push('Username must be 3-50 characters and contain only letters, numbers, and underscores');
  }

  if (!validateUser.password(request.password)) {
    errors.push('Password must be 8-128 characters long');
  }

  if (!validateUser.email(request.email)) {
    errors.push('Email must be a valid email address');
  }

  if (!validateUser.name(request.firstName)) {
    errors.push('First name must be 1-100 characters and not empty');
  }

  if (!validateUser.name(request.lastName)) {
    errors.push('Last name must be 1-100 characters and not empty');
  }

  if (!validateUser.role(request.role)) {
    errors.push('Role must be one of: admin, manager, waiter, kitchen_staff, cashier');
  }

  return errors;
};