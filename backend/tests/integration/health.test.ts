import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';

describe('API Health and Base Routes', () => {
  it('GET /health returns 200 and ok status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('service', 'furniture-electronics-api');
  });

  it('returns 404 for the retired shared /api/v1 namespace', async () => {
    const res = await request(app).get('/api/v1/invalid-route');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toHaveProperty('code', 'NOT_FOUND');
  });

  it('keeps admin and storefront namespaces isolated', async () => {
    const adminRes = await request(app).get('/api/admin/v1/invalid-route');
    const storefrontRes = await request(app).get('/api/storefront/v1/invalid-route');

    expect(adminRes.status).toBe(404);
    expect(storefrontRes.status).toBe(404);
  });
});
