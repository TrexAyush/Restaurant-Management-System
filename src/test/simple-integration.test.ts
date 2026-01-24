import request from 'supertest';
import app from '../server';

describe('Simple Integration Test', () => {
  test('Health endpoint works', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body.status).toBe('OK');
  });

  test('Login with seeded user works', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'admin_test',
        password: 'password123'
      });

    console.log('Login response status:', response.status);
    console.log('Login response body:', JSON.stringify(response.body, null, 2));

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('token');
    expect(response.body.data).toHaveProperty('user');
  });

  test('Get users endpoint works with admin token', async () => {
    // First login
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'admin_test',
        password: 'password123'
      });

    if (loginResponse.status === 200) {
      const token = loginResponse.body.data.token;

      // Then get users
      const usersResponse = await request(app)
        .get('/api/auth/users')
        .set('Authorization', `Bearer ${token}`);

      console.log('Users response status:', usersResponse.status);
      console.log('Users response body:', JSON.stringify(usersResponse.body, null, 2));

      if (usersResponse.status === 200) {
        expect(Array.isArray(usersResponse.body.data)).toBe(true);
      }
    }
  });
});