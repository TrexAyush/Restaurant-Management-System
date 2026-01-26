import { apiClient } from '../config/api';
import { LoginCredentials, AuthResponse, User, CreateUserRequest, UpdateUserRequest } from '../types/auth';

export class AuthService {
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/login', credentials);
    const authData = response.data.data; // Extract from the nested data property
    
    // Store token in localStorage
    localStorage.setItem('authToken', authData.token);
    localStorage.setItem('currentUser', JSON.stringify(authData.user));
    
    return authData;
  }

  static async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      // Always clear local storage regardless of API response
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
    }
  }

  static getCurrentUser(): User | null {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
  }

  static getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  static isAuthenticated(): boolean {
    return !!this.getToken();
  }

  static async getProfile(): Promise<User> {
    const response = await apiClient.get('/auth/profile');
    return response.data.data; // Extract from the nested data property
  }

  static async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiClient.put('/auth/change-password', {
      currentPassword,
      newPassword
    });
  }

  // Admin-only user management functions
  static async getAllUsers(): Promise<User[]> {
    const response = await apiClient.get('/auth/users');
    return response.data.data; // Extract from the nested data property
  }

  static async createUser(userData: CreateUserRequest): Promise<User> {
    const response = await apiClient.post('/auth/users', userData);
    return response.data.data; // Extract from the nested data property
  }

  static async updateUser(userId: string, userData: UpdateUserRequest): Promise<User> {
    const response = await apiClient.put(`/auth/users/${userId}`, userData);
    return response.data.data; // Extract from the nested data property
  }

  static async deleteUser(userId: string): Promise<void> {
    await apiClient.delete(`/auth/users/${userId}`);
  }
}