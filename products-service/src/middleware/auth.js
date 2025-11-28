/**
 * Middleware de Autenticación
 * 
 * @author Oscar Javier Rivera
 * @description Valida API Key en headers para autenticación entre servicios
 */

const authMiddleware = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({
      errors: [{
        status: '401',
        title: 'Unauthorized',
        detail: 'API Key inválida o no proporcionada'
      }]
    });
  }
  
  next();
};

module.exports = authMiddleware;
