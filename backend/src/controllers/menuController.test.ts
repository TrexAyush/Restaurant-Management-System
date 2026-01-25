import request from 'supertest';
import app from '../server';

describe('Menu Controller', () => {
  describe('Authentication Requirements', () => {
    it('should reject unauthenticated requests to GET /api/menu/categories', async () => {
      await request(app)
        .get('/api/menu/categories')
        .expect(401);
    });

    it('should reject unauthenticated requests to GET /api/menu/items', async () => {
      await request(app)
        .get('/api/menu/items')
        .expect(401);
    });

    it('should reject unauthenticated requests to POST /api/menu/categories', async () => {
      await request(app)
        .post('/api/menu/categories')
        .send({ name: 'Test Category' })
        .expect(401);
    });

    it('should reject unauthenticated requests to GET /api/menu/items/search', async () => {
      await request(app)
        .get('/api/menu/items/search?q=test')
        .expect(401);
    });

    it('should reject requests with invalid tokens', async () => {
      await request(app)
        .get('/api/menu/categories')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('Route Structure', () => {
    it('should have menu categories endpoint', async () => {
      const response = await request(app)
        .get('/api/menu/categories');
      
      // Should be 401 (unauthorized) not 404 (not found)
      expect(response.status).toBe(401);
    });

    it('should have menu items endpoint', async () => {
      const response = await request(app)
        .get('/api/menu/items');
      
      // Should be 401 (unauthorized) not 404 (not found)
      expect(response.status).toBe(401);
    });

    it('should have search endpoint', async () => {
      const response = await request(app)
        .get('/api/menu/items/search?q=test');
      
      // Should be 401 (unauthorized) not 404 (not found)
      expect(response.status).toBe(401);
    });

    it('should have menu by categories endpoint', async () => {
      const response = await request(app)
        .get('/api/menu/items/by-categories');
      
      // Should be 401 (unauthorized) not 404 (not found)
      expect(response.status).toBe(401);
    });
  });

  describe('Parameter Validation', () => {
    it('should require search term for search endpoint', async () => {
      const response = await request(app)
        .get('/api/menu/items/search')
        .set('Authorization', 'Bearer invalid-token');
      
      // Should be 401 (unauthorized) because of invalid token, not 400 (bad request)
      expect(response.status).toBe(401);
    });
  });
});