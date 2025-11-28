/**
 * Inventory Service - Microservicio de Gestión de Inventario y Compras
 * 
 * @author Oscar Javier Rivera
 * @description Servicio REST para gestionar inventario y procesar compras con JSON API
 * @version 1.0.0
 */

require('dotenv').config();
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const { initDatabase } = require('./config/database');
const authMiddleware = require('./middleware/auth');
const validateJsonApi = require('./middleware/jsonapi');
const inventoryRouter = require('./routes/inventory');
const purchasesRouter = require('./routes/purchases');
const swaggerSpec = require('./swagger');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(express.json({ type: ['application/json', 'application/vnd.api+json'] }));

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'inventory' });
});

// API routes
app.use('/api/inventory', authMiddleware, validateJsonApi, inventoryRouter);
app.use('/api/purchases', authMiddleware, validateJsonApi, purchasesRouter);

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
      console.log(`Inventory service running on port ${PORT}`);
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
