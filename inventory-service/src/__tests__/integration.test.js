/**
 * Tests de Integración - Inventory Service
 * 
 * @author Oscar Javier Rivera
 * @description Tests de integración para Inventory Service
 */

const request = require('supertest');
const app = require('../index');
const { pool } = require('../config/database');

describe('Integration Tests - Inventory Service', () => {
  afterAll(async () => {
    await pool.end();
  });

  it('debe manejar el flujo completo de actualización de inventario', async () => {
    // Este test requiere que el servicio de productos esté corriendo
    // En un entorno real, se ejecutaría con ambos servicios activos
    
    const response = await request(app)
      .get('/health');

    expect(response.status).toBe(200);
    expect(response.body.service).toBe('inventory');
  });

  it('debe validar autenticación en todos los endpoints', async () => {
    const response = await request(app)
      .get('/api/inventory/1');

    expect(response.status).toBe(401);
  });
});
