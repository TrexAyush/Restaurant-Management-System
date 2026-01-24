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

export class UserRepository {
  private readonly tableName = 'users';

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    const user = await knex(this.tableName)
      .where({ id })
      .first();

    return user || null;
  }

  /**
   * Find user by username
   */
  async findByUsername(username: string): Promise<User | null> {
    const user = await knex(this.tableName)
      .where({ username })
      .first();
    return this.mapDbUserToModel(user);
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    const user = await knex(this.tableName)
      .where({ email })
      .first();

    return user || null;
  }

  /**
   * Create a new user
   */
  async create(userData: CreateUserData): Promise<User> {
    const [user] = await knex(this.tableName)
      .insert({
        ...userData,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning('*');

    return this.mapDbUserToModel(user);
  }

  /**
   * Update user information
   */
  async update(id: string, updateData: UpdateUserRequest): Promise<User | null> {
    const [user] = await knex(this.tableName)
      .where({ id })
      .update({
        ...updateData,
        updated_at: new Date()
      })
      .returning('*');

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
}

// Export singleton instance
export const userRepository = new UserRepository();