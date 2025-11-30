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

describe('Inventory Service - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.API_KEY = 'secret-key-123';
  });

  describe('GET /api/inventory/:producto_id - Consultar Inventario', () => {
    it('debe consultar inventario con información del producto exitosamente', async () => {
      const mockProduct = {
        type: 'products',
        id: '1',
        attributes: { 
          nombre: 'Laptop Dell XPS 15', 
          precio: 1299.99,
          descripcion: 'Laptop de alto rendimiento'
        }
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
      expect(response.body.data.type).toBe('inventory');
      expect(response.body.data.id).toBe('1');
      expect(response.body.data.attributes.cantidad).toBe(50);
      expect(response.body.data.attributes.producto.nombre).toBe('Laptop Dell XPS 15');
      expect(productsClient.getProduct).toHaveBeenCalledWith('1');
      expect(Inventory.findByProductId).toHaveBeenCalledWith('1');
    });

    it('debe retornar 404 si el producto no existe', async () => {
      productsClient.getProduct.mockRejectedValue(new Error('Producto no encontrado'));

      const response = await request(app)
        .get('/api/inventory/999')
        .set('X-API-Key', 'secret-key-123');

      expect(response.status).toBe(404);
      expect(response.body.errors[0].title).toBe('Not Found');
      expect(response.body.errors[0].detail).toBe('Producto no encontrado');
    });

    it('debe retornar 404 si el inventario no existe', async () => {
      const mockProduct = {
        type: 'products',
        id: '1',
        attributes: { nombre: 'Laptop', precio: 1299.99 }
      };

      productsClient.getProduct.mockResolvedValue(mockProduct);
      Inventory.findByProductId.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/inventory/1')
        .set('X-API-Key', 'secret-key-123');

      expect(response.status).toBe(404);
      expect(response.body.errors[0].detail).toContain('Inventario no encontrado');
    });

    it('debe retornar 503 si el servicio de productos no está disponible', async () => {
      productsClient.getProduct.mockRejectedValue(
        new Error('Servicio de productos no disponible después de 3 intentos')
      );

      const response = await request(app)
        .get('/api/inventory/1')
        .set('X-API-Key', 'secret-key-123');

      expect(response.status).toBe(503);
      expect(response.body.errors[0].title).toBe('Service Unavailable');
    });

    it('debe incluir toda la información del producto en la respuesta', async () => {
      const mockProduct = {
        type: 'products',
        id: '1',
        attributes: { 
          nombre: 'Laptop', 
          precio: 1299.99,
          descripcion: 'Test description'
        }
      };

      const mockInventory = {
        producto_id: 1,
        cantidad: 25
      };

      productsClient.getProduct.mockResolvedValue(mockProduct);
      Inventory.findByProductId.mockResolvedValue(mockInventory);

      const response = await request(app)
        .get('/api/inventory/1')
        .set('X-API-Key', 'secret-key-123');

      expect(response.body.data.attributes.producto).toEqual({
        nombre: 'Laptop',
        precio: 1299.99,
        descripcion: 'Test description'
      });
    });
  });

  describe('PATCH /api/inventory/:producto_id - Actualizar Inventario', () => {
    it('debe actualizar la cantidad de inventario exitosamente', async () => {
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
      expect(Inventory.upsert).toHaveBeenCalledWith('1', 100);
    });

    it('debe crear inventario si no existe (upsert)', async () => {
      const mockProduct = {
        type: 'products',
        id: '5',
        attributes: { nombre: 'Nuevo Producto', precio: 99.99 }
      };

      const mockInventory = {
        producto_id: 5,
        cantidad: 50
      };

      productsClient.getProduct.mockResolvedValue(mockProduct);
      Inventory.upsert.mockResolvedValue(mockInventory);

      const response = await request(app)
        .patch('/api/inventory/5')
        .set('Content-Type', 'application/vnd.api+json')
        .set('X-API-Key', 'secret-key-123')
        .send({
          data: {
            type: 'inventory',
            id: '5',
            attributes: { cantidad: 50 }
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.data.attributes.cantidad).toBe(50);
    });

    it('debe retornar error 400 si la cantidad es negativa', async () => {
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
      expect(response.body.errors[0].title).toBe('Bad Request');
      expect(response.body.errors[0].detail).toContain('no negativo');
    });

    it('debe retornar error 400 si falta la cantidad', async () => {
      const response = await request(app)
        .patch('/api/inventory/1')
        .set('Content-Type', 'application/vnd.api+json')
        .set('X-API-Key', 'secret-key-123')
        .send({
          data: {
            type: 'inventory',
            id: '1',
            attributes: {}
          }
        });

      expect(response.status).toBe(400);
      expect(response.body.errors[0].detail).toContain('Cantidad');
    });

    it('debe retornar error 400 si el formato JSON API es inválido', async () => {
      const response = await request(app)
        .patch('/api/inventory/1')
        .set('Content-Type', 'application/vnd.api+json')
        .set('X-API-Key', 'secret-key-123')
        .send({
          data: {
            type: 'wrong-type',
            id: '1',
            attributes: { cantidad: 100 }
          }
        });

      expect(response.status).toBe(400);
      expect(response.body.errors[0].detail).toContain('JSON API');
    });

    it('debe retornar error 404 si el producto no existe', async () => {
      productsClient.getProduct.mockRejectedValue(new Error('Producto no encontrado'));

      const response = await request(app)
        .patch('/api/inventory/999')
        .set('Content-Type', 'application/vnd.api+json')
        .set('X-API-Key', 'secret-key-123')
        .send({
          data: {
            type: 'inventory',
            id: '999',
            attributes: { cantidad: 100 }
          }
        });

      expect(response.status).toBe(404);
      expect(response.body.errors[0].detail).toBe('Producto no encontrado');
    });

    it('debe aceptar cantidad cero', async () => {
      const mockProduct = {
        type: 'products',
        id: '1',
        attributes: { nombre: 'Laptop', precio: 1299.99 }
      };

      const mockInventory = {
        producto_id: 1,
        cantidad: 0
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
            attributes: { cantidad: 0 }
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.data.attributes.cantidad).toBe(0);
    });

    it('debe retornar error 500 si hay un error en la base de datos', async () => {
      const mockProduct = {
        type: 'products',
        id: '1',
        attributes: { nombre: 'Laptop', precio: 1299.99 }
      };

      productsClient.getProduct.mockResolvedValue(mockProduct);
      Inventory.upsert.mockRejectedValue(new Error('Database error'));

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

      expect(response.status).toBe(500);
      expect(response.body.errors[0].title).toBe('Internal Server Error');
    });
  });

  describe('Validación de JSON API', () => {
    it('debe validar el formato JSON API en respuestas exitosas', async () => {
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

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('type');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('attributes');
    });

    it('debe validar el formato JSON API en respuestas de error', async () => {
      productsClient.getProduct.mockRejectedValue(new Error('Producto no encontrado'));

      const response = await request(app)
        .get('/api/inventory/999')
        .set('X-API-Key', 'secret-key-123');

      expect(response.body).toHaveProperty('errors');
      expect(Array.isArray(response.body.errors)).toBe(true);
      expect(response.body.errors[0]).toHaveProperty('status');
      expect(response.body.errors[0]).toHaveProperty('title');
      expect(response.body.errors[0]).toHaveProperty('detail');
    });
  });
});
