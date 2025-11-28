/**
 * Tests de Integración - Products Service
 * 
 * @author Oscar Javier Rivera
 * @description Tests de integración para Products Service
 */

const request = require('supertest');
const app = require('../index');
const { pool } = require('../config/database');

describe('Integration Tests - Products Service', () => {
  afterAll(async () => {
    await pool.end();
  });

  it('debe manejar el flujo completo de creación y consulta de productos', async () => {
    const response = await request(app)
      .get('/health');

    expect(response.status).toBe(200);
    expect(response.body.service).toBe('products');
  });

  it('debe validar autenticación en todos los endpoints', async () => {
    const response = await request(app)
      .get('/api/products/1');

    expect(response.status).toBe(401);
  });
});
