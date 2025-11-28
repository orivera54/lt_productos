/**
 * Products Service - Microservicio de Gestión de Productos
 * 
 * @author Oscar Javier Rivera
 * @description Servicio REST para gestionar productos con JSON API
 * @version 1.0.0
 */

require('dotenv').config();
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const { initDatabase } = require('./config/database');
const authMiddleware = require('./middleware/auth');
const validateJsonApi = require('./middleware/jsonapi');
const productsRouter = require('./routes/products');
const swaggerSpec = require('./swagger');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json({ type: ['application/json', 'application/vnd.api+json'] }));

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'products' });
});

// API routes
app.use('/api/products', authMiddleware, validateJsonApi, productsRouter);

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    errors: [{
      status: '500',
      title: 'Internal Server Error',
      detail: err.message
    }]
  });
});

// Initialize database and start server
const startServer = async () => {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`Products service running on port ${PORT}`);
      console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = app;
