import { User, CreateUserRequest, UpdateUserRequest } from '../models/User';
import { UserRole } from '../models/enums';
import knex from '../config/database';

export interface CreateUserData {
  username: string;
  passwordHash: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
}

export interface DbCreateUserData {
  username: string;
  password_hash: string;
  role: UserRole;
  first_name: string;
  last_name: string;
  email: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface DbUpdateUserData {
  username?: string;
  password_hash?: string;
  role?: UserRole;
  first_name?: string;
  last_name?: string;
  email?: string;
  is_active?: boolean;
  updated_at: Date;
}

export class UserRepository {
  private readonly tableName = 'users';

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    const user = await knex(this.tableName).where({ id }).first();
    return user ? this.mapDbUserToModel(user) : null;
  }

  /**
   * Find user by username
   */
  async findByUsername(username: string): Promise<User | null> {
    const user = await knex(this.tableName).where({ username }).first();
    return user ? this.mapDbUserToModel(user) : null;
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    const user = await knex(this.tableName).where({ email }).first();
    return user ? this.mapDbUserToModel(user) : null;
  }

  /**
   * Create a new user
   */
  async create(userData: CreateUserData): Promise<User> {
    const dbData = this.mapModelUserToDb(userData);
    const result = await knex(this.tableName)
      .insert(dbData)
      .returning('*');

    // Handle both array and single object returns
    const user = Array.isArray(result) ? result[0] : result;
    
    if (!user) {
      throw new Error('Failed to create user');
    }

    return this.mapDbUserToModel(user);
  }

  /**
   * Update user information
   */
  async update(id: string, updateData: UpdateUserRequest): Promise<User | null> {
    const dbData = this.mapModelUpdateUserToDb(updateData);
    const result = await knex(this.tableName)
      .where({ id })
      .update(dbData)
      .returning('*');

    // Handle both array and single object returns
    const user = Array.isArray(result) ? result[0] : result;
    return user ? this.mapDbUserToModel(user) : null;
  }

  /**
   * Update user password
   */
  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await knex(this.tableName)
      .where({ id })
      .update({
        password_hash: passwordHash,
        updated_at: new Date()
      });
  }

  /**
   * Update user active status
   */
  async updateActiveStatus(id: string, isActive: boolean): Promise<void> {
    await knex(this.tableName)
      .where({ id })
      .update({
        is_active: isActive,
        updated_at: new Date()
      });
  }

  /**
   * Get all users (for admin functionality)
   */
  async findAll(): Promise<User[]> {
    const users = await knex(this.tableName)
      .select('*')
      .orderBy('created_at', 'desc');

    return users.map(this.mapDbUserToModel);
  }

  /**
   * Get users by role
   */
  async findByRole(role: UserRole): Promise<User[]> {
    const users = await knex(this.tableName)
      .where({ role })
      .select('*')
      .orderBy('created_at', 'desc');

    return users.map(this.mapDbUserToModel);
  }

  /**
   * Delete user (soft delete by setting isActive to false)
   */
  async delete(id: string): Promise<void> {
    await this.updateActiveStatus(id, false);
  }

  /**
   * Hard delete user (permanent deletion)
   */
  async hardDelete(id: string): Promise<void> {
    await knex(this.tableName)
      .where({ id })
      .del();
  }

  /**
   * Check if username exists
   */
  async usernameExists(username: string): Promise<boolean> {
    const user = await knex(this.tableName)
      .where({ username })
      .first();

    return !!user;
  }

  /**
   * Check if email exists
   */
  async emailExists(email: string): Promise<boolean> {
    const user = await knex(this.tableName)
      .where({ email })
      .first();

    return !!user;
  }

  /**
   * Map database user object to model
   */
  private mapDbUserToModel(dbUser: any): User {
    return {
      id: dbUser.id,
      username: dbUser.username,
      passwordHash: dbUser.password_hash,
      role: dbUser.role as UserRole,
      firstName: dbUser.first_name,
      lastName: dbUser.last_name,
      email: dbUser.email,
      isActive: dbUser.is_active,
      createdAt: new Date(dbUser.created_at),
      updatedAt: new Date(dbUser.updated_at)
    };
  }

  /**
   * Map model user object to database format
   */
  private mapModelUserToDb(user: CreateUserData): DbCreateUserData {
    return {
      username: user.username,
      password_hash: user.passwordHash,
      role: user.role,
      first_name: user.firstName,
      last_name: user.lastName,
      email: user.email,
      is_active: user.isActive,
      created_at: new Date(),
      updated_at: new Date()
    };
  }

  /**
   * Map model update user object to database format
   */
  private mapModelUpdateUserToDb(updateData: UpdateUserRequest): DbUpdateUserData {
    const dbData: DbUpdateUserData = {
      updated_at: new Date()
    };

    if (updateData.username !== undefined) dbData.username = updateData.username;
    if (updateData.role !== undefined) dbData.role = updateData.role;
    if (updateData.firstName !== undefined) dbData.first_name = updateData.firstName;
    if (updateData.lastName !== undefined) dbData.last_name = updateData.lastName;
    if (updateData.email !== undefined) dbData.email = updateData.email;
    if (updateData.isActive !== undefined) dbData.is_active = updateData.isActive;

    return dbData;
  }
}

// Export singleton instance
export const userRepository = new UserRepository();