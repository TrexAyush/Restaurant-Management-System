import request from 'supertest';
import app from './server';

describe('Server Health Check', () => {
  it('should respond to health check endpoint', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body).toHaveProperty('status', 'OK');
    expect(response.body).toHaveProperty('service', 'Restaurant Management System');
    expect(response.body).toHaveProperty('timestamp');
  });

  it('should return 404 for unknown routes', async () => {
    const response = await request(app)
      .get('/unknown-route')
      .expect(404);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toHaveProperty('code', 'ROUTE_NOT_FOUND');
  });
});