const request = require('supertest');
const app = require('../server');

describe('Bookstore API Suite', () => {
    it('GET /health should return UP', async () => {
        const res = await request(app).get('/health');
        expect(res.statusCode).toEqual(200);
        expect(res.body.status).toEqual('UP');
    });

    it('GET /api/books should return 200 array', async () => {
        const res = await request(app).get('/api/books');
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    it('POST /api/books should validate payload', async () => {
        const res = await request(app)
            .post('/api/books')
            .send({
                title: 'Clean Architecture',
                author: 'Robert C. Martin',
                price: 34.99
            });
        expect([201, 200]).toContain(res.statusCode);
    });
});
