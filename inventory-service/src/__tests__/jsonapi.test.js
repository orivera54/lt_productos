/**
 * Tests Unitarios - Middleware de Validación JSON API
 * 
 * @author Oscar Javier Rivera
 * @description Tests para el middleware de validación de Content-Type JSON API
 */

const validateJsonApi = require('../middleware/jsonapi');

describe('JSON API Middleware - Unit Tests', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      method: 'POST',
      headers: {}
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    next = jest.fn();
  });

  describe('Validación Exitosa', () => {
    it('debe permitir POST con Content-Type correcto', () => {
      req.method = 'POST';
      req.headers['content-type'] = 'application/vnd.api+json';

      validateJsonApi(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('debe permitir PATCH con Content-Type correcto', () => {
      req.method = 'PATCH';
      req.headers['content-type'] = 'application/vnd.api+json';

      validateJsonApi(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('debe permitir GET sin validar Content-Type', () => {
      req.method = 'GET';

      validateJsonApi(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('Validación Fallida', () => {
    it('debe retornar 415 si POST no tiene Content-Type correcto', () => {
      req.method = 'POST';
      req.headers['content-type'] = 'application/json';

      validateJsonApi(req, res, next);

      expect(res.status).toHaveBeenCalledWith(415);
      expect(res.json).toHaveBeenCalledWith({
        errors: [{
          status: '415',
          title: 'Unsupported Media Type',
          detail: 'Content-Type debe ser application/vnd.api+json'
        }]
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('debe retornar 415 si PATCH no tiene Content-Type correcto', () => {
      req.method = 'PATCH';
      req.headers['content-type'] = 'text/plain';

      validateJsonApi(req, res, next);

      expect(res.status).toHaveBeenCalledWith(415);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
