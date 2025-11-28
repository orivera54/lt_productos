/**
 * Configuración de Swagger/OpenAPI
 * 
 * @author Oscar Javier Rivera
 * @description Documentación automática de la API con OpenAPI 3.0
 */

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Products Service API',
      version: '1.0.0',
      description: 'Microservicio de gestión de productos con JSON API',
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
        },
      },
    },
    security: [{
      ApiKeyAuth: [],
    }],
  },
  apis: ['./src/routes/*.js'],
};

module.exports = swaggerJsdoc(options);
