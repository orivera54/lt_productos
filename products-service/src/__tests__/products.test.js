/**
 * Tests Unitarios - Products Service
 * 
 * @author Oscar Javier Rivera
 * @description Tests para endpoints de productos con Jest y Supertest
 */

const request = require('supertest');
const express = require('express');
const productsRouter = require('../routes/products');
const Product = require('../models/Product');
const authMiddleware = require('../middleware/auth');
const validateJsonApi = require('../middleware/jsonapi');

// Mock del modelo Product
jest.mock('../models/Product');

const app = express();
app.use(express.json({ type: ['application/json', 'application/vnd.api+json'] }));

// Mock del middleware de autenticación
app.use((req, res, next) => {
  req.headers['x-api-key'] = 'secret-key-123';
  next();
});

app.use('/api/products', authMiddleware, validateJsonApi, productsRouter);

describe('Products Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.API_KEY = 'secret-key-123';
  });

  describe('POST /api/products', () => {
    it('debe crear un producto exitosamente', async () => {
      const mockProduct = {
        id: 1,
        nombre: 'Laptop',
        precio: '1299.99',
        descripcion: 'Laptop de alto rendimiento'
      };

      Product.create.mockResolvedValue(mockProduct);

      const response = await request(app)
        .post('/api/products')
        .set('Content-Type', 'application/vnd.api+json')
        .set('X-API-Key', 'secret-key-123')
        .send({
          data: {
            type: 'products',
            attributes: {
              nombre: 'Laptop',
              precio: 1299.99,
              descripcion: 'Laptop de alto rendimiento'
            }
          }
        });

      expect(response.status).toBe(201);
      expect(response.body.data.type).toBe('products');
      expect(response.body.data.attributes.nombre).toBe('Laptop');
    });

    it('debe retornar error 400 si faltan campos requeridos', async () => {
      const response = await request(app)
        .post('/api/products')
        .set('Content-Type', 'application/vnd.api+json')
        .set('X-API-Key', 'secret-key-123')
        .send({
          data: {
            type: 'products',
            attributes: {
              nombre: 'Laptop'
            }
          }
        });

      expect(response.status).toBe(400);
      expect(response.body.errors[0].title).toBe('Bad Request');
    });
  });

  describe('GET /api/products/:id', () => {
    it('debe obtener un producto por ID', async () => {
      const mockProduct = {
        id: 1,
        nombre: 'Laptop',
        precio: '1299.99',
        descripcion: 'Test'
      };

      Product.findById.mockResolvedValue(mockProduct);

      const response = await request(app)
        .get('/api/products/1')
        .set('X-API-Key', 'secret-key-123');

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe('1');
      expect(response.body.data.attributes.nombre).toBe('Laptop');
    });

    it('debe retornar 404 si el producto no existe', async () => {
      Product.findById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/products/999')
        .set('X-API-Key', 'secret-key-123');

      expect(response.status).toBe(404);
      expect(response.body.errors[0].title).toBe('Not Found');
    });
  });

  describe('GET /api/products', () => {
    it('debe listar todos los productos', async () => {
      const mockProducts = [
        { id: 1, nombre: 'Laptop', precio: '1299.99', descripcion: 'Test 1' },
        { id: 2, nombre: 'Mouse', precio: '29.99', descripcion: 'Test 2' }
      ];

      Product.findAll.mockResolvedValue(mockProducts);

      const response = await request(app)
        .get('/api/products')
        .set('X-API-Key', 'secret-key-123');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].type).toBe('products');
    });
  });
});
