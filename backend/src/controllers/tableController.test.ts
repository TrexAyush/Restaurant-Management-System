import request from 'supertest';
import app from '../server';

describe('Table Controller', () => {
  describe('Authentication Requirements', () => {
    it('should reject unauthenticated requests to GET /api/tables', async () => {
      await request(app)
        .get('/api/tables')
        .expect(401);
    });

    it('should reject unauthenticated requests to POST /api/tables', async () => {
      await request(app)
        .post('/api/tables')
        .send({ number: 1, capacity: 4 })
        .expect(401);
    });

    it('should reject unauthenticated requests to GET /api/tables/statistics', async () => {
      await request(app)
        .get('/api/tables/statistics')
        .expect(401);
    });

    it('should reject unauthenticated requests to GET /api/tables/occupancy-summary', async () => {
      await request(app)
        .get('/api/tables/occupancy-summary')
        .expect(401);
    });

    it('should reject requests with invalid tokens', async () => {
      await request(app)
        .get('/api/tables')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('Route Structure', () => {
    it('should have tables endpoint', async () => {
      const response = await request(app)
        .get('/api/tables');
      
      // Should be 401 (unauthorized) not 404 (not found)
      expect(response.status).toBe(401);
    });

    it('should have table statistics endpoint', async () => {
      const response = await request(app)
        .get('/api/tables/statistics');
      
      // Should be 401 (unauthorized) not 404 (not found)
      expect(response.status).toBe(401);
    });

    it('should have table by status endpoint', async () => {
      const response = await request(app)
        .get('/api/tables/status/available');
      
      // Should be 401 (unauthorized) not 404 (not found)
      expect(response.status).toBe(401);
    });

    it('should have available tables with capacity endpoint', async () => {
      const response = await request(app)
        .get('/api/tables/available/4');
      
      // Should be 401 (unauthorized) not 404 (not found)
      expect(response.status).toBe(401);
    });

    it('should have best table for party endpoint', async () => {
      const response = await request(app)
        .get('/api/tables/best-for-party/4');
      
      // Should be 401 (unauthorized) not 404 (not found)
      expect(response.status).toBe(401);
    });

    it('should have table by number endpoint', async () => {
      const response = await request(app)
        .get('/api/tables/number/1');
      
      // Should be 401 (unauthorized) not 404 (not found)
      expect(response.status).toBe(401);
    });

    it('should have table by ID endpoint', async () => {
      const response = await request(app)
        .get('/api/tables/123e4567-e89b-12d3-a456-426614174000');
      
      // Should be 401 (unauthorized) not 404 (not found)
      expect(response.status).toBe(401);
    });

    it('should have occupancy summary endpoint', async () => {
      const response = await request(app)
        .get('/api/tables/occupancy-summary');
      
      // Should be 401 (unauthorized) not 404 (not found)
      expect(response.status).toBe(401);
    });
  });

  describe('Parameter Validation', () => {
    it('should handle invalid table status in status endpoint', async () => {
      const response = await request(app)
        .get('/api/tables/status/invalid-status')
        .set('Authorization', 'Bearer invalid-token');
      
      // Should be 401 (unauthorized) because of invalid token, not 400 (bad request)
      expect(response.status).toBe(401);
    });

    it('should handle invalid capacity parameter', async () => {
      const response = await request(app)
        .get('/api/tables/available/invalid-capacity')
        .set('Authorization', 'Bearer invalid-token');
      
      // Should be 401 (unauthorized) because of invalid token, not 400 (bad request)
      expect(response.status).toBe(401);
    });

    it('should handle invalid party size parameter', async () => {
      const response = await request(app)
        .get('/api/tables/best-for-party/invalid-size')
        .set('Authorization', 'Bearer invalid-token');
      
      // Should be 401 (unauthorized) because of invalid token, not 400 (bad request)
      expect(response.status).toBe(401);
    });

    it('should handle invalid table number parameter', async () => {
      const response = await request(app)
        .get('/api/tables/number/invalid-number')
        .set('Authorization', 'Bearer invalid-token');
      
      // Should be 401 (unauthorized) because of invalid token, not 400 (bad request)
      expect(response.status).toBe(401);
    });
  });

  describe('HTTP Methods', () => {
    it('should support PUT requests for table status updates', async () => {
      const response = await request(app)
        .put('/api/tables/123e4567-e89b-12d3-a456-426614174000/status')
        .send({ status: 'occupied' });
      
      // Should be 401 (unauthorized) not 405 (method not allowed)
      expect(response.status).toBe(401);
    });

    it('should support PUT requests for seating customers', async () => {
      const response = await request(app)
        .put('/api/tables/123e4567-e89b-12d3-a456-426614174000/seat')
        .send({ partySize: 4 });
      
      // Should be 401 (unauthorized) not 405 (method not allowed)
      expect(response.status).toBe(401);
    });

    it('should support PUT requests for clearing tables', async () => {
      const response = await request(app)
        .put('/api/tables/123e4567-e89b-12d3-a456-426614174000/clear');
      
      // Should be 401 (unauthorized) not 405 (method not allowed)
      expect(response.status).toBe(401);
    });

    it('should support PUT requests for reserving tables', async () => {
      const response = await request(app)
        .put('/api/tables/123e4567-e89b-12d3-a456-426614174000/reserve');
      
      // Should be 401 (unauthorized) not 405 (method not allowed)
      expect(response.status).toBe(401);
    });

    it('should support DELETE requests for table deletion', async () => {
      const response = await request(app)
        .delete('/api/tables/123e4567-e89b-12d3-a456-426614174000');
      
      // Should be 401 (unauthorized) not 405 (method not allowed)
      expect(response.status).toBe(401);
    });
  });
});