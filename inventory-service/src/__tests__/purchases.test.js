/**
 * Tests Unitarios - Flujo de Compras
 * 
 * @author Oscar Javier Rivera
 * @description Tests para el proceso de compra con validación de inventario
 */

const request = require('supertest');
const express = require('express');
const purchasesRouter = require('../routes/purchases');
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
app.use('/api/purchases', authMiddleware, validateJsonApi, purchasesRouter);

describe('Purchase Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.API_KEY = 'secret-key-123';
  });

  describe('POST /api/purchases', () => {
    it('debe procesar una compra exitosamente', async () => {
      const mockProduct = {
        type: 'products',
        id: '1',
        attributes: { nombre: 'Laptop', precio: 1299.99 }
      };

      const mockInventory = {
        producto_id: 1,
        cantidad: 50
      };

      const mockUpdatedInventory = {
        producto_id: 1,
        cantidad: 48
      };

      const mockPurchase = {
        id: 1,
        producto_id: 1,
        cantidad: 2,
        precio_unitario: '1299.99',
        total: '2599.98',
        created_at: new Date()
      };

      productsClient.getProduct.mockResolvedValue(mockProduct);
      Inventory.findByProductId.mockResolvedValue(mockInventory);
      Inventory.decrementStock.mockResolvedValue(mockUpdatedInventory);
      Inventory.createPurchaseRecord.mockResolvedValue(mockPurchase);

      const response = await request(app)
        .post('/api/purchases')
        .set('Content-Type', 'application/vnd.api+json')
        .set('X-API-Key', 'secret-key-123')
        .send({
          data: {
            type: 'purchases',
            attributes: {
              producto_id: 1,
              cantidad: 2
            }
          }
        });

      expect(response.status).toBe(201);
      expect(response.body.data.type).toBe('purchases');
      expect(response.body.data.attributes.cantidad).toBe(2);
      expect(response.body.data.attributes.inventario_restante).toBe(48);
    });

    it('debe retornar 404 si el producto no existe', async () => {
      productsClient.getProduct.mockRejectedValue(new Error('Producto no encontrado'));

      const response = await request(app)
        .post('/api/purchases')
        .set('Content-Type', 'application/vnd.api+json')
        .set('X-API-Key', 'secret-key-123')
        .send({
          data: {
            type: 'purchases',
            attributes: {
              producto_id: 999,
              cantidad: 2
            }
          }
        });

      expect(response.status).toBe(404);
      expect(response.body.errors[0].detail).toBe('Producto no encontrado');
    });

    it('debe retornar 409 si el inventario es insuficiente', async () => {
      const mockProduct = {
        type: 'products',
        id: '1',
        attributes: { nombre: 'Laptop', precio: 1299.99 }
      };

      const mockInventory = {
        producto_id: 1,
        cantidad: 1
      };

      productsClient.getProduct.mockResolvedValue(mockProduct);
      Inventory.findByProductId.mockResolvedValue(mockInventory);

      const response = await request(app)
        .post('/api/purchases')
        .set('Content-Type', 'application/vnd.api+json')
        .set('X-API-Key', 'secret-key-123')
        .send({
          data: {
            type: 'purchases',
            attributes: {
              producto_id: 1,
              cantidad: 5
            }
          }
        });

      expect(response.status).toBe(409);
      expect(response.body.errors[0].title).toBe('Conflict');
    });

    it('debe retornar 404 si no existe inventario para el producto', async () => {
      const mockProduct = {
        type: 'products',
        id: '1',
        attributes: { nombre: 'Laptop', precio: 1299.99 }
      };

      productsClient.getProduct.mockResolvedValue(mockProduct);
      Inventory.findByProductId.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/purchases')
        .set('Content-Type', 'application/vnd.api+json')
        .set('X-API-Key', 'secret-key-123')
        .send({
          data: {
            type: 'purchases',
            attributes: {
              producto_id: 1,
              cantidad: 2
            }
          }
        });

      expect(response.status).toBe(404);
      expect(response.body.errors[0].detail).toContain('Inventario no encontrado');
    });
  });
});
