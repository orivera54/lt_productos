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

describe('Purchase Flow - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.API_KEY = 'secret-key-123';
  });

  describe('POST /api/purchases - Realizar Compra', () => {
    it('debe procesar una compra exitosamente con todos los datos correctos', async () => {
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
      expect(response.body.data.id).toBe('1');
      expect(response.body.data.attributes.producto_id).toBe(1);
      expect(response.body.data.attributes.producto_nombre).toBe('Laptop');
      expect(response.body.data.attributes.cantidad).toBe(2);
      expect(response.body.data.attributes.precio_unitario).toBe(1299.99);
      expect(response.body.data.attributes.total).toBe(2599.98);
      expect(response.body.data.attributes.inventario_restante).toBe(48);
      expect(response.body.data.attributes).toHaveProperty('fecha');
      
      // Verificar que se llamaron los métodos correctos
      expect(productsClient.getProduct).toHaveBeenCalledWith(1);
      expect(Inventory.findByProductId).toHaveBeenCalledWith(1);
      expect(Inventory.decrementStock).toHaveBeenCalledWith(1, 2);
      expect(Inventory.createPurchaseRecord).toHaveBeenCalledWith(1, 2, 1299.99);
    });

    it('debe procesar una compra de una sola unidad', async () => {
      const mockProduct = {
        type: 'products',
        id: '1',
        attributes: { nombre: 'Mouse', precio: 29.99 }
      };

      const mockInventory = {
        producto_id: 1,
        cantidad: 10
      };

      const mockUpdatedInventory = {
        producto_id: 1,
        cantidad: 9
      };

      const mockPurchase = {
        id: 2,
        producto_id: 1,
        cantidad: 1,
        precio_unitario: '29.99',
        total: '29.99',
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
              cantidad: 1
            }
          }
        });

      expect(response.status).toBe(201);
      expect(response.body.data.attributes.cantidad).toBe(1);
      expect(response.body.data.attributes.total).toBe(29.99);
      expect(response.body.data.attributes.inventario_restante).toBe(9);
    });

    it('debe procesar una compra que agota el inventario', async () => {
      const mockProduct = {
        type: 'products',
        id: '1',
        attributes: { nombre: 'Laptop', precio: 1299.99 }
      };

      const mockInventory = {
        producto_id: 1,
        cantidad: 5
      };

      const mockUpdatedInventory = {
        producto_id: 1,
        cantidad: 0
      };

      const mockPurchase = {
        id: 3,
        producto_id: 1,
        cantidad: 5,
        precio_unitario: '1299.99',
        total: '6499.95',
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
              cantidad: 5
            }
          }
        });

      expect(response.status).toBe(201);
      expect(response.body.data.attributes.inventario_restante).toBe(0);
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

    it('debe retornar error 400 si falta el producto_id', async () => {
      const response = await request(app)
        .post('/api/purchases')
        .set('Content-Type', 'application/vnd.api+json')
        .set('X-API-Key', 'secret-key-123')
        .send({
          data: {
            type: 'purchases',
            attributes: {
              cantidad: 2
            }
          }
        });

      expect(response.status).toBe(400);
      expect(response.body.errors[0].title).toBe('Bad Request');
      expect(response.body.errors[0].detail).toContain('producto_id');
    });

    it('debe retornar error 400 si falta la cantidad', async () => {
      const response = await request(app)
        .post('/api/purchases')
        .set('Content-Type', 'application/vnd.api+json')
        .set('X-API-Key', 'secret-key-123')
        .send({
          data: {
            type: 'purchases',
            attributes: {
              producto_id: 1
            }
          }
        });

      expect(response.status).toBe(400);
      expect(response.body.errors[0].detail).toContain('cantidad');
    });

    it('debe retornar error 400 si la cantidad es cero', async () => {
      const response = await request(app)
        .post('/api/purchases')
        .set('Content-Type', 'application/vnd.api+json')
        .set('X-API-Key', 'secret-key-123')
        .send({
          data: {
            type: 'purchases',
            attributes: {
              producto_id: 1,
              cantidad: 0
            }
          }
        });

      expect(response.status).toBe(400);
      expect(response.body.errors[0].detail).toContain('mayor a 0');
    });

    it('debe retornar error 400 si la cantidad es negativa', async () => {
      const response = await request(app)
        .post('/api/purchases')
        .set('Content-Type', 'application/vnd.api+json')
        .set('X-API-Key', 'secret-key-123')
        .send({
          data: {
            type: 'purchases',
            attributes: {
              producto_id: 1,
              cantidad: -5
            }
          }
        });

      expect(response.status).toBe(400);
      expect(response.body.errors[0].title).toBe('Bad Request');
    });

    it('debe retornar error 400 si el formato JSON API es inválido', async () => {
      const response = await request(app)
        .post('/api/purchases')
        .set('Content-Type', 'application/vnd.api+json')
        .set('X-API-Key', 'secret-key-123')
        .send({
          data: {
            type: 'wrong-type',
            attributes: {
              producto_id: 1,
              cantidad: 2
            }
          }
        });

      expect(response.status).toBe(400);
      expect(response.body.errors[0].detail).toContain('JSON API');
    });

    it('debe retornar 503 si el servicio de productos no está disponible', async () => {
      productsClient.getProduct.mockRejectedValue(
        new Error('Servicio de productos no disponible después de 3 intentos')
      );

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

      expect(response.status).toBe(503);
      expect(response.body.errors[0].title).toBe('Service Unavailable');
    });

    it('debe manejar errores de transacción en decrementStock', async () => {
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
      Inventory.decrementStock.mockRejectedValue(new Error('Inventario insuficiente'));

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

      expect(response.status).toBe(409);
      expect(response.body.errors[0].title).toBe('Conflict');
    });
  });

  describe('GET /api/purchases/history/:producto_id - Historial de Compras', () => {
    it('debe obtener el historial de compras de un producto', async () => {
      const mockHistory = [
        {
          id: 3,
          producto_id: 1,
          cantidad: 2,
          precio_unitario: '1299.99',
          total: '2599.98',
          created_at: new Date('2024-01-15T14:20:00.000Z')
        },
        {
          id: 2,
          producto_id: 1,
          cantidad: 3,
          precio_unitario: '1299.99',
          total: '3899.97',
          created_at: new Date('2024-01-15T12:15:00.000Z')
        },
        {
          id: 1,
          producto_id: 1,
          cantidad: 5,
          precio_unitario: '1299.99',
          total: '6499.95',
          created_at: new Date('2024-01-15T10:30:00.000Z')
        }
      ];

      Inventory.getPurchaseHistory.mockResolvedValue(mockHistory);

      const response = await request(app)
        .get('/api/purchases/history/1')
        .set('X-API-Key', 'secret-key-123');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.data[0].type).toBe('purchase-history');
      expect(response.body.data[0].attributes.cantidad).toBe(2);
      expect(response.body.data[0].attributes.total).toBe(2599.98);
      expect(Inventory.getPurchaseHistory).toHaveBeenCalledWith('1');
    });

    it('debe retornar un array vacío si no hay historial', async () => {
      Inventory.getPurchaseHistory.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/purchases/history/999')
        .set('X-API-Key', 'secret-key-123');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(0);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('debe retornar error 500 si hay un error en la base de datos', async () => {
      Inventory.getPurchaseHistory.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/purchases/history/1')
        .set('X-API-Key', 'secret-key-123');

      expect(response.status).toBe(500);
      expect(response.body.errors[0].title).toBe('Internal Server Error');
    });

    it('debe convertir los precios a números flotantes', async () => {
      const mockHistory = [
        {
          id: 1,
          producto_id: 1,
          cantidad: 2,
          precio_unitario: '1299.99',
          total: '2599.98',
          created_at: new Date()
        }
      ];

      Inventory.getPurchaseHistory.mockResolvedValue(mockHistory);

      const response = await request(app)
        .get('/api/purchases/history/1')
        .set('X-API-Key', 'secret-key-123');

      expect(typeof response.body.data[0].attributes.precio_unitario).toBe('number');
      expect(typeof response.body.data[0].attributes.total).toBe('number');
      expect(response.body.data[0].attributes.precio_unitario).toBe(1299.99);
      expect(response.body.data[0].attributes.total).toBe(2599.98);
    });
  });

  describe('Validación de JSON API', () => {
    it('debe validar el formato JSON API en respuestas exitosas de compra', async () => {
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

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('type');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('attributes');
      expect(response.body.data.type).toBe('purchases');
    });

    it('debe validar el formato JSON API en respuestas de error', async () => {
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

      expect(response.body).toHaveProperty('errors');
      expect(Array.isArray(response.body.errors)).toBe(true);
      expect(response.body.errors[0]).toHaveProperty('status');
      expect(response.body.errors[0]).toHaveProperty('title');
      expect(response.body.errors[0]).toHaveProperty('detail');
    });
  });

  describe('Cálculos de Compra', () => {
    it('debe calcular correctamente el total de la compra', async () => {
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
        cantidad: 45
      };

      const mockPurchase = {
        id: 1,
        producto_id: 1,
        cantidad: 5,
        precio_unitario: '1299.99',
        total: '6499.95',
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
              cantidad: 5
            }
          }
        });

      expect(response.body.data.attributes.total).toBe(6499.95);
      expect(response.body.data.attributes.precio_unitario * response.body.data.attributes.cantidad)
        .toBeCloseTo(response.body.data.attributes.total, 2);
    });

    it('debe calcular correctamente el inventario restante', async () => {
      const mockProduct = {
        type: 'products',
        id: '1',
        attributes: { nombre: 'Laptop', precio: 1299.99 }
      };

      const mockInventory = {
        producto_id: 1,
        cantidad: 100
      };

      const mockUpdatedInventory = {
        producto_id: 1,
        cantidad: 85
      };

      const mockPurchase = {
        id: 1,
        producto_id: 1,
        cantidad: 15,
        precio_unitario: '1299.99',
        total: '19499.85',
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
              cantidad: 15
            }
          }
        });

      expect(response.body.data.attributes.inventario_restante).toBe(85);
      expect(mockInventory.cantidad - response.body.data.attributes.cantidad)
        .toBe(response.body.data.attributes.inventario_restante);
    });
  });
});
