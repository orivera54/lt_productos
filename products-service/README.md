# Products Service

Microservicio de gestión de productos.

## Descripción

Este servicio es responsable de gestionar la información de los productos, incluyendo:
- Crear nuevos productos
- Consultar productos por ID
- Listar todos los productos

## Tecnologías

- Node.js 18+
- Express
- PostgreSQL
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
│   └── Product.js           # Modelo de Producto
├── routes/
│   └── products.js          # Endpoints REST
├── __tests__/
│   ├── products.test.js     # Tests unitarios
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
PORT=3001
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/products_db
API_KEY=secret-key-123
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
docker build -t products-service .
docker run -p 3001:3001 --env-file .env products-service
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

### Crear Producto
```http
POST /api/products
Content-Type: application/vnd.api+json
X-API-Key: secret-key-123

{
  "data": {
    "type": "products",
    "attributes": {
      "nombre": "Laptop Dell XPS 15",
      "precio": 1299.99,
      "descripcion": "Laptop de alto rendimiento"
    }
  }
}
```

### Obtener Producto
```http
GET /api/products/:id
X-API-Key: secret-key-123
```

### Listar Productos
```http
GET /api/products
X-API-Key: secret-key-123
```

## Documentación

- Swagger: http://localhost:3001/api-docs
- Health check: http://localhost:3001/health

## Base de Datos

### Tabla: productos

```sql
CREATE TABLE productos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  precio DECIMAL(10, 2) NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Dependencias

### Producción
- express: Framework web
- pg: Cliente PostgreSQL
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
| PORT | Puerto del servicio | 3001 |
| DATABASE_URL | URL de PostgreSQL | postgresql://user:pass@host:port/db |
| API_KEY | Clave de autenticación | secret-key-123 |
| NODE_ENV | Entorno de ejecución | development/production |

## Códigos de Estado HTTP

| Código | Descripción |
|--------|-------------|
| 200 | OK - Operación exitosa |
| 201 | Created - Recurso creado |
| 400 | Bad Request - Datos inválidos |
| 401 | Unauthorized - API Key inválida |
| 404 | Not Found - Producto no encontrado |
| 500 | Internal Server Error - Error del servidor |

## Formato JSON API

Todas las respuestas siguen el estándar JSON API (https://jsonapi.org/)

### Respuesta Exitosa
```json
{
  "data": {
    "type": "products",
    "id": "1",
    "attributes": {
      "nombre": "Laptop",
      "precio": 1299.99,
      "descripcion": "..."
    }
  }
}
```

### Respuesta de Error
```json
{
  "errors": [{
    "status": "404",
    "title": "Not Found",
    "detail": "Producto no encontrado"
  }]
}
```

## Seguridad

- Autenticación mediante API Key en header `X-API-Key`
- Validación de Content-Type
- Sanitización de inputs
- Variables de entorno para secretos

## Documentación del Proyecto

Ver documentación completa en el directorio raíz:
- [README.md](../README.md) - Documentación principal
- [ARCHITECTURE.md](../ARCHITECTURE.md) - Arquitectura
- [DEVELOPMENT.md](../DEVELOPMENT.md) - Guía de desarrollo
