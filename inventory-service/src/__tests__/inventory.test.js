/**
 * Tests Unitarios - Inventory Service
 * 
 * @author Oscar Javier Rivera
 * @description Tests para endpoints de inventario con Jest y Supertest
 */

const request = require('supertest');
const express = require('express');
const inventoryRouter = require('../routes/inventory');
const Inventory = require('../models/Inventory');
const productsClient = require('../services/productsClient');
const authMiddleware = require('../middleware/auth');
const validateJsonApi = require('../middleware/jsonapi');

jest.mock('../models/Inventory');
jest.mock('../services/productsClient');

const app = express();
app.use(express.json({ type: ['application/json', 'application/vnd.api+json'] }));
app.use((req, res, next) => {
  req.headers['x-api-key'] = 'secret-key-123';
  next();
});
app.use('/api/inventory', authMiddleware, validateJsonApi, inventoryRouter);

describe('Inventory Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.API_KEY = 'secret-key-123';
  });

  describe('GET /api/inventory/:producto_id', () => {
    it('debe consultar inventario con información del producto', async () => {
      const mockProduct = {
        type: 'products',
        id: '1',
        attributes: { nombre: 'Laptop', precio: 1299.99 }
      };

      const mockInventory = {
        producto_id: 1,
        cantidad: 50
      };

      productsClient.getProduct.mockResolvedValue(mockProduct);
      Inventory.findByProductId.mockResolvedValue(mockInventory);

      const response = await request(app)
        .get('/api/inventory/1')
        .set('X-API-Key', 'secret-key-123');

      expect(response.status).toBe(200);
      expect(response.body.data.attributes.cantidad).toBe(50);
      expect(response.body.data.attributes.producto.nombre).toBe('Laptop');
    });

    it('debe retornar 404 si el producto no existe', async () => {
      productsClient.getProduct.mockRejectedValue(new Error('Producto no encontrado'));

      const response = await request(app)
        .get('/api/inventory/999')
        .set('X-API-Key', 'secret-key-123');

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/inventory/:producto_id', () => {
    it('debe actualizar la cantidad de inventario', async () => {
      const mockProduct = {
        type: 'products',
        id: '1',
        attributes: { nombre: 'Laptop', precio: 1299.99 }
      };

      const mockInventory = {
        producto_id: 1,
        cantidad: 100
      };

      productsClient.getProduct.mockResolvedValue(mockProduct);
      Inventory.upsert.mockResolvedValue(mockInventory);

      const response = await request(app)
        .patch('/api/inventory/1')
        .set('Content-Type', 'application/vnd.api+json')
        .set('X-API-Key', 'secret-key-123')
        .send({
          data: {
            type: 'inventory',
            id: '1',
            attributes: { cantidad: 100 }
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.data.attributes.cantidad).toBe(100);
    });

    it('debe retornar error si la cantidad es negativa', async () => {
      const response = await request(app)
        .patch('/api/inventory/1')
        .set('Content-Type', 'application/vnd.api+json')
        .set('X-API-Key', 'secret-key-123')
        .send({
          data: {
            type: 'inventory',
            id: '1',
            attributes: { cantidad: -5 }
          }
        });

      expect(response.status).toBe(400);
    });
  });
});
