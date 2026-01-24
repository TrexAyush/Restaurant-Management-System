import { userRepository } from '../repositories/userRepository';

describe('Database Debug Test', () => {
  test('Check if users exist in database', async () => {
    try {
      const users = await userRepository.findAll();
      console.log('All users in database:', users.length);
      expect(users.length).toBeGreaterThan(0);
      
      for (const user of users) {
        console.log(`User: ${user.username}, Role: ${user.role}, Active: ${user.isActive}`);
      }

      const adminUser = await userRepository.findByUsername('admin_test');
      console.log('Admin user found:', adminUser ? 'YES' : 'NO');
      expect(adminUser).toBeTruthy();
      
      if (adminUser) {
        console.log('Admin user details:', {
          id: adminUser.id,
          username: adminUser.username,
          role: adminUser.role,
          isActive: adminUser.isActive,
          hasPasswordHash: !!adminUser.passwordHash
        });
        expect(adminUser.isActive).toBe(true);
        expect(adminUser.passwordHash).toBeTruthy();
      }
    } catch (error) {
      console.error('Database error:', error);
      throw error;
    }
  });
});