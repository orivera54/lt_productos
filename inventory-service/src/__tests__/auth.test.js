/**
 * Tests Unitarios - Middleware de Autenticación
 * 
 * @author Oscar Javier Rivera
 * @description Tests para el middleware de autenticación con API Key
 */

const authMiddleware = require('../middleware/auth');

describe('Auth Middleware - Unit Tests', () => {
  let req, res, next;

  beforeEach(() => {
    process.env.API_KEY = 'secret-key-123';
    
    req = {
      headers: {}
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    next = jest.fn();
  });

  describe('Autenticación Exitosa', () => {
    it('debe permitir el acceso con API Key válida', () => {
      req.headers['x-api-key'] = 'secret-key-123';

      authMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('Autenticación Fallida', () => {
    it('debe retornar 401 si no se proporciona API Key', () => {
      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        errors: [{
          status: '401',
          title: 'Unauthorized',
          detail: 'API Key inválida o no proporcionada'
        }]
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('debe retornar 401 si la API Key es inválida', () => {
      req.headers['x-api-key'] = 'invalid-key';

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Formato de Respuesta JSON API', () => {
    it('debe retornar errores en formato JSON API', () => {
      req.headers['x-api-key'] = 'wrong-key';

      authMiddleware(req, res, next);

      const response = res.json.mock.calls[0][0];
      
      expect(response).toHaveProperty('errors');
      expect(Array.isArray(response.errors)).toBe(true);
      expect(response.errors[0]).toHaveProperty('status');
      expect(response.errors[0]).toHaveProperty('title');
      expect(response.errors[0]).toHaveProperty('detail');
    });
  });
});
