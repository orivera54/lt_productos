# Inventory Service

Microservicio de gestión de inventario y compras.

## Descripción

Este servicio es responsable de:
- Gestionar el inventario de productos
- Procesar compras
- Mantener historial de compras
- Comunicarse con Products Service para obtener información de productos

## Tecnologías

- Node.js 18+
- Express
- PostgreSQL
- Axios (cliente HTTP)
- Jest (testing)
- Swagger (documentación)

## Estructura

```
src/
├── config/
│   └── database.js          # Configuración de PostgreSQL
├── middleware/
│   ├── auth.js              # Autenticación con API Key
│   └── jsonapi.js           # Validación JSON API
├── models/
│   └── Inventory.js         # Modelo de Inventario
├── routes/
│   ├── inventory.js         # Endpoints de inventario
│   └── purchases.js         # Endpoints de compras
├── services/
│   └── productsClient.js    # Cliente HTTP para Products Service
├── __tests__/
│   ├── inventory.test.js    # Tests unitarios de inventario
│   ├── purchases.test.js    # Tests unitarios de compras
│   └── integration.test.js  # Tests de integración
├── index.js                 # Punto de entrada
└── swagger.js               # Configuración Swagger
```

## Instalación

```bash
npm install
```

## Configuración

Copiar `.env.example` a `.env` y configurar:

```env
PORT=3002
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/inventory_db
API_KEY=secret-key-123
PRODUCTS_SERVICE_URL=http://localhost:3001
NODE_ENV=development
```

## Ejecución

### Desarrollo
```bash
npm run dev
```

### Producción
```bash
npm start
```

### Con Docker
```bash
docker build -t inventory-service .
docker run -p 3002:3002 --env-file .env inventory-service
```

## Testing

```bash
# Ejecutar tests
npm test

# Tests con cobertura
npm test -- --coverage

# Tests en modo watch
npm run test:watch
```

## API Endpoints

### Consultar Inventario
```http
GET /api/inventory/:producto_id
X-API-Key: secret-key-123
```

### Actualizar Inventario
```http
PATCH /api/inventory/:producto_id
Content-Type: application/vnd.api+json
X-API-Key: secret-key-123

{
  "data": {
    "type": "inventory",
    "id": "1",
    "attributes": {
      "cantidad": 100
    }
  }
}
```

### Realizar Compra
```http
POST /api/purchases
Content-Type: application/vnd.api+json
X-API-Key: secret-key-123

{
  "data": {
    "type": "purchases",
    "attributes": {
      "producto_id": 1,
      "cantidad": 5
    }
  }
}
```

### Historial de Compras
```http
GET /api/purchases/history/:producto_id
X-API-Key: secret-key-123
```

## Documentación

- Swagger: http://localhost:3002/api-docs
- Health check: http://localhost:3002/health

## Base de Datos

### Tabla: inventario

```sql
CREATE TABLE inventario (
  id SERIAL PRIMARY KEY,
  producto_id INTEGER NOT NULL UNIQUE,
  cantidad INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tabla: historial_compras

```sql
CREATE TABLE historial_compras (
  id SERIAL PRIMARY KEY,
  producto_id INTEGER NOT NULL,
  cantidad INTEGER NOT NULL,
  precio_unitario DECIMAL(10, 2),
  total DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Comunicación con Products Service

El servicio se comunica con Products Service mediante HTTP:

```javascript
// Obtener información del producto
GET http://products-service:3001/api/products/:id
Headers: X-API-Key: secret-key-123
```

### Características:
- **Timeout**: 5 segundos
- **Reintentos**: 3 intentos con backoff exponencial
- **Manejo de errores**: 404, 503, timeout

## Flujo de Compra

1. Cliente envía solicitud de compra
2. Inventory Service obtiene información del producto desde Products Service
3. Verifica disponibilidad en inventario
4. Inicia transacción en base de datos
5. Actualiza cantidad con lock (`SELECT ... FOR UPDATE`)
6. Registra compra en historial
7. Commit de transacción
8. Retorna confirmación de compra

## Dependencias

### Producción
- express: Framework web
- pg: Cliente PostgreSQL
- axios: Cliente HTTP
- dotenv: Variables de entorno
- swagger-ui-express: Documentación Swagger
- swagger-jsdoc: Generación de OpenAPI

### Desarrollo
- jest: Framework de testing
- supertest: Testing de APIs
- nodemon: Hot reload

## Variables de Entorno

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| PORT | Puerto del servicio | 3002 |
| DATABASE_URL | URL de PostgreSQL | postgresql://user:pass@host:port/db |
| API_KEY | Clave de autenticación | secret-key-123 |
| PRODUCTS_SERVICE_URL | URL de Products Service | http://localhost:3001 |
| NODE_ENV | Entorno de ejecución | development/production |

## Códigos de Estado HTTP

| Código | Descripción |
|--------|-------------|
| 200 | OK - Operación exitosa |
| 201 | Created - Compra realizada |
| 400 | Bad Request - Datos inválidos |
| 401 | Unauthorized - API Key inválida |
| 404 | Not Found - Producto/Inventario no encontrado |
| 409 | Conflict - Inventario insuficiente |
| 500 | Internal Server Error - Error del servidor |
| 503 | Service Unavailable - Products Service no disponible |

## Formato JSON API

Todas las respuestas siguen el estándar JSON API (https://jsonapi.org/)

### Respuesta de Compra Exitosa
```json
{
  "data": {
    "type": "purchases",
    "id": "1",
    "attributes": {
      "producto_id": 1,
      "producto_nombre": "Laptop Dell XPS 15",
      "cantidad": 5,
      "precio_unitario": 1299.99,
      "total": 6499.95,
      "inventario_restante": 95,
      "fecha": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### Respuesta de Error
```json
{
  "errors": [{
    "status": "409",
    "title": "Conflict",
    "detail": "Inventario insuficiente. Disponible: 10, Solicitado: 20"
  }]
}
```

## Manejo de Errores

### Producto No Encontrado
```json
{
  "errors": [{
    "status": "404",
    "title": "Not Found",
    "detail": "Producto no encontrado"
  }]
}
```

### Inventario Insuficiente
```json
{
  "errors": [{
    "status": "409",
    "title": "Conflict",
    "detail": "Inventario insuficiente. Disponible: 5, Solicitado: 10"
  }]
}
```

### Servicio No Disponible
```json
{
  "errors": [{
    "status": "503",
    "title": "Service Unavailable",
    "detail": "Servicio de productos no disponible después de 3 intentos"
  }]
}
```

## Transacciones

El servicio utiliza transacciones PostgreSQL para garantizar consistencia:

```javascript
BEGIN;
  SELECT cantidad FROM inventario WHERE producto_id = $1 FOR UPDATE;
  UPDATE inventario SET cantidad = cantidad - $2 WHERE producto_id = $1;
  INSERT INTO historial_compras (...) VALUES (...);
COMMIT;
```

### Características:
- **Atomicidad**: Todo o nada
- **Locks**: Previene race conditions
- **Rollback**: Automático en caso de error

## Eventos

El servicio emite eventos (logs) cuando:
- Se actualiza el inventario
- Se realiza una compra

```javascript
console.log(`[EVENT] Compra realizada - Producto: ${id}, Cantidad: ${qty}`);
```

## Seguridad

- Autenticación mediante API Key
- Validación de Content-Type
- Sanitización de inputs
- Transacciones para consistencia
- Variables de entorno para secretos

## Resiliencia

- Reintentos automáticos (3 intentos)
- Timeout de 5 segundos
- Backoff exponencial (1s, 2s)
- Manejo robusto de errores

## Documentación del Proyecto

Ver documentación completa en el directorio raíz:
- [README.md](../README.md) - Documentación principal
- [ARCHITECTURE.md](../ARCHITECTURE.md) - Arquitectura
- [TECHNICAL_DECISIONS.md](../TECHNICAL_DECISIONS.md) - Justificaciones
- [DEVELOPMENT.md](../DEVELOPMENT.md) - Guía de desarrollo
