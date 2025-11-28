/**
 * Middleware de Validación JSON API
 * 
 * @author Oscar Javier Rivera
 * @description Valida que el Content-Type sea application/vnd.api+json
 */

const validateJsonApi = (req, res, next) => {
  if (['POST', 'PATCH'].includes(req.method)) {
    const contentType = req.headers['content-type'];
    if (!contentType || !contentType.includes('application/vnd.api+json')) {
      return res.status(415).json({
        errors: [{
          status: '415',
          title: 'Unsupported Media Type',
          detail: 'Content-Type debe ser application/vnd.api+json'
        }]
      });
    }
  }
  next();
};

module.exports = validateJsonApi;
