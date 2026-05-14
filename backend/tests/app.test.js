require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const request = require('supertest');
const app = require('../src/app');

describe('App', () => {
  test('GET /health should return 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  test('GET /nonexistent should return 404', async () => {
    const res = await request(app).get('/nonexistent');
    expect(res.status).toBe(404);
  });

  test('POST /api/v1/unknown should return 404', async () => {
    const res = await request(app).post('/api/v1/unknown');
    expect(res.status).toBe(404);
  });

  test('404 response body should have code and message', async () => {
    const res = await request(app).get('/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('code');
    expect(res.body).toHaveProperty('message');
  });
});
