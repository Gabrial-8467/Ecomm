import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';

describe('CORS Configuration', () => {
  it('allows request from localhost:5173 (Storefront)', async () => {
    const res = await request(app)
      .get('/health')
      .set('Origin', 'http://localhost:5173');
    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });

  it('allows request from localhost:5174 (Admin)', async () => {
    const res = await request(app)
      .get('/health')
      .set('Origin', 'http://localhost:5174');
    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5174');
  });

  it('allows request from 127.0.0.1:5173', async () => {
    const res = await request(app)
      .get('/health')
      .set('Origin', 'http://127.0.0.1:5173');
    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe('http://127.0.0.1:5173');
  });

  it('does not throw 500 on unauthorized origins', async () => {
    const res = await request(app)
      .get('/health')
      .set('Origin', 'http://malicious-site.example');
    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
});
