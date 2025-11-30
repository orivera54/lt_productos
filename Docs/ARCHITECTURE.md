# Arquitectura Detallada

## Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────┐
│                         Cliente                              │
│                    (Postman, Browser, etc.)                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTP/JSON API
                         │
        ┌────────────────┴────────────────┐
        │                                  │
        ▼                                  ▼
┌──────────────────┐              ┌──────────────────┐
│  Products Service│              │ Inventory Service│
│   (Port 3001)    │◄─────────────│   (Port 3002)    │
└────────┬─────────┘   HTTP GET   └────────┬─────────┘
         │         /api/products/:id        │
         │                                  │
         ▼                                  ▼
┌──────────────────┐              ┌──────────────────┐
│   PostgreSQL     │              │   PostgreSQL     │
│  products_db     │              │  inventory_db    │
│   (Port 5432)    │              │   (Port 5433)    │
└──────────────────┘              └──────────────────┘
```

## Flujo de Compra Detallado

```
Cliente                 Inventory Service           Products Service         Database
  │                            │                           │                    │
  │ POST /api/purchases        │                           │                    │
  ├───────────────────────────►│                           │                    │
  │                            │                           │                    │
  │                            │ GET /api/products/:id     │                    │
  │                            ├──────────────────────────►│                    │
  │                            │                           │                    │
  │                            │                           │ SELECT producto    │
  │                            │                           ├───────────────────►│
  │                            │                           │                    │
  │                            │                           │ Producto data      │
  │                            │                           │◄───────────────────┤
  │                            │                           │                    │
  │                            │ Producto data             │                    │
  │                            │◄──────────────────────────┤                    │
  │                            │                           │                    │
  │                            │ BEGIN TRANSACTION         │                    │
  │                            ├──────────────────────────────────────────────►│
  │                            │                           │                    │
  │                            │ SELECT ... FOR UPDATE     │                    │
  │                            ├──────────────────────────────────────────────►│
  │                            │                           │                    │
  │                            │ Verificar stock           │                    │
  │                            │◄──────────────────────────────────────────────┤
  │                            │                           │                    │
  │                            │ UPDATE inventario         │                    │
  │                            ├──────────────────────────────────────────────►│
  │                            │                           │                    │
  │                            │ INSERT historial_compras  │                    │
  │                            ├──────────────────────────────────────────────►│
  │                            │                           │                    │
  │                            │ COMMIT                    │                    │
  │                            ├──────────────────────────────────────────────►│
  │                            │                           │                    │
  │                            │ [EVENT] Compra realizada  │                    │
  │                            │                           │                    │
  │ Respuesta con compra       │                           │                    │
  │◄───────────────────────────┤                           │                    │
  │                            │                           │                    │
```

## Modelo de Datos

### Products Service - Base de Datos: products_db

#### Tabla: productos
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

### Inventory Service - Base de Datos: inventory_db

#### Tabla: inventario
```sql
CREATE TABLE inventario (
  id SERIAL PRIMARY KEY,
  producto_id INTEGER NOT NULL UNIQUE,
  cantidad INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Tabla: historial_compras
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

## Patrones de Diseño Implementados

### 1. Microservicios
- Servicios independientes con bases de datos separadas
- Comunicación mediante HTTP/REST
- Despliegue independiente con Docker

### 2. API Gateway Pattern (Simplificado)
- Cada servicio expone su propia API
- Autenticación mediante API Keys
- Formato estandarizado JSON API

### 3. Database per Service
- Cada microservicio tiene su propia base de datos
- Evita acoplamiento a nivel de datos
- Permite escalado independiente

### 4. Saga Pattern (Orquestación)
- Inventory Service orquesta el flujo de compra
- Coordina llamadas entre servicios
- Maneja rollback en caso de error

### 5. Circuit Breaker (Básico)
- Reintentos automáticos (3 intentos)
- Timeout de 5 segundos
- Manejo de errores de servicios no disponibles

### 6. Repository Pattern
- Modelos encapsulan acceso a datos
- Separación de lógica de negocio y persistencia
- Facilita testing con mocks

## Seguridad

### Autenticación entre Servicios
- API Keys en header `X-API-Key`
- Validación en middleware
- Configuración mediante variables de entorno

### Validación de Datos
- Validación de Content-Type (JSON API)
- Validación de estructura de datos
- Sanitización de inputs

### Transacciones
- Uso de transacciones ACID en PostgreSQL
- Locks optimistas con `FOR UPDATE`
- Rollback automático en caso de error

## Manejo de Errores

### Códigos de Estado HTTP
- `200 OK`: Operación exitosa
- `201 Created`: Recurso creado
- `400 Bad Request`: Datos inválidos
- `401 Unauthorized`: API Key inválida
- `404 Not Found`: Recurso no encontrado
- `409 Conflict`: Inventario insuficiente
- `415 Unsupported Media Type`: Content-Type incorrecto
- `500 Internal Server Error`: Error del servidor
- `503 Service Unavailable`: Servicio no disponible

### Formato de Errores (JSON API)
```json
{
  "errors": [{
    "status": "404",
    "title": "Not Found",
    "detail": "Producto no encontrado"
  }]
}
```

## Escalabilidad

### Horizontal Scaling
- Servicios stateless
- Múltiples instancias con load balancer
- Base de datos con replicación

### Vertical Scaling
- Optimización de queries
- Índices en base de datos
- Connection pooling

### Caching (Futuro)
- Redis para productos frecuentes
- Cache de inventario con TTL corto
- Invalidación de cache en actualizaciones

## Monitoreo y Observabilidad

### Logs
- Eventos de compra registrados
- Errores con stack traces
- Logs estructurados

### Health Checks
- Endpoint `/health` en cada servicio
- Verificación de conexión a base de datos
- Usado por Docker para healthchecks

### Métricas (Futuro)
- Prometheus para métricas
- Grafana para visualización
- Alertas en caso de errores

## Testing

### Niveles de Testing
1. **Unit Tests**: Lógica de negocio aislada
2. **Integration Tests**: Interacción con base de datos
3. **E2E Tests**: Flujo completo entre servicios

### Cobertura
- Creación de productos
- Gestión de inventario
- Proceso de compra
- Manejo de errores
- Comunicación entre servicios
