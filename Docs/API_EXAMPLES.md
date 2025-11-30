# Ejemplos de API - Respuestas Completas

## Products Service

### 1. Crear Producto

**Request:**
```http
POST /api/products HTTP/1.1
Host: localhost:3001
Content-Type: application/vnd.api+json
X-API-Key: secret-key-123

{
  "data": {
    "type": "products",
    "attributes": {
      "nombre": "Laptop Dell XPS 15",
      "precio": 1299.99,
      "descripcion": "Laptop de alto rendimiento con procesador Intel i7"
    }
  }
}
```

**Response (201 Created):**
```json
{
  "data": {
    "type": "products",
    "id": "1",
    "attributes": {
      "nombre": "Laptop Dell XPS 15",
      "precio": 1299.99,
      "descripcion": "Laptop de alto rendimiento con procesador Intel i7"
    }
  }
}
```

### 2. Obtener Producto por ID

**Request:**
```http
GET /api/products/1 HTTP/1.1
Host: localhost:3001
X-API-Key: secret-key-123
```

**Response (200 OK):**
```json
{
  "data": {
    "type": "products",
    "id": "1",
    "attributes": {
      "nombre": "Laptop Dell XPS 15",
      "precio": 1299.99,
      "descripcion": "Laptop de alto rendimiento con procesador Intel i7"
    }
  }
}
```

### 3. Listar Todos los Productos

**Request:**
```http
GET /api/products HTTP/1.1
Host: localhost:3001
X-API-Key: secret-key-123
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "type": "products",
      "id": "1",
      "attributes": {
        "nombre": "Laptop Dell XPS 15",
        "precio": 1299.99,
        "descripcion": "Laptop de alto rendimiento con procesador Intel i7"
      }
    },
    {
      "type": "products",
      "id": "2",
      "attributes": {
        "nombre": "Mouse Logitech MX Master 3",
        "precio": 99.99,
        "descripcion": "Mouse ergonómico inalámbrico"
      }
    },
    {
      "type": "products",
      "id": "3",
      "attributes": {
        "nombre": "Teclado Mecánico Keychron K2",
        "precio": 89.99,
        "descripcion": "Teclado mecánico compacto con switches Gateron"
      }
    }
  ]
}
```

### 4. Error: Producto No Encontrado

**Request:**
```http
GET /api/products/999 HTTP/1.1
Host: localhost:3001
X-API-Key: secret-key-123
```

**Response (404 Not Found):**
```json
{
  "errors": [
    {
      "status": "404",
      "title": "Not Found",
      "detail": "Producto no encontrado"
    }
  ]
}
```

### 5. Error: API Key Inválida

**Request:**
```http
GET /api/products/1 HTTP/1.1
Host: localhost:3001
X-API-Key: invalid-key
```

**Response (401 Unauthorized):**
```json
{
  "errors": [
    {
      "status": "401",
      "title": "Unauthorized",
      "detail": "API Key inválida o no proporcionada"
    }
  ]
}
```

### 6. Error: Datos Inválidos

**Request:**
```http
POST /api/products HTTP/1.1
Host: localhost:3001
Content-Type: application/vnd.api+json
X-API-Key: secret-key-123

{
  "data": {
    "type": "products",
    "attributes": {
      "nombre": "Laptop Dell XPS 15"
    }
  }
}
```

**Response (400 Bad Request):**
```json
{
  "errors": [
    {
      "status": "400",
      "title": "Bad Request",
      "detail": "Nombre y precio son requeridos"
    }
  ]
}
```

---

## Inventory Service

### 1. Actualizar Inventario

**Request:**
```http
PATCH /api/inventory/1 HTTP/1.1
Host: localhost:3002
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

**Response (200 OK):**
```json
{
  "data": {
    "type": "inventory",
    "id": "1",
    "attributes": {
      "producto_id": 1,
      "cantidad": 100
    }
  }
}
```

### 2. Consultar Inventario (con información del producto)

**Request:**
```http
GET /api/inventory/1 HTTP/1.1
Host: localhost:3002
X-API-Key: secret-key-123
```

**Response (200 OK):**
```json
{
  "data": {
    "type": "inventory",
    "id": "1",
    "attributes": {
      "producto_id": 1,
      "cantidad": 100,
      "producto": {
        "nombre": "Laptop Dell XPS 15",
        "precio": 1299.99,
        "descripcion": "Laptop de alto rendimiento con procesador Intel i7"
      }
    }
  }
}
```

### 3. Realizar Compra Exitosa

**Request:**
```http
POST /api/purchases HTTP/1.1
Host: localhost:3002
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

**Response (201 Created):**
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

### 4. Error: Inventario Insuficiente

**Request:**
```http
POST /api/purchases HTTP/1.1
Host: localhost:3002
Content-Type: application/vnd.api+json
X-API-Key: secret-key-123

{
  "data": {
    "type": "purchases",
    "attributes": {
      "producto_id": 1,
      "cantidad": 200
    }
  }
}
```

**Response (409 Conflict):**
```json
{
  "errors": [
    {
      "status": "409",
      "title": "Conflict",
      "detail": "Inventario insuficiente. Disponible: 95, Solicitado: 200"
    }
  ]
}
```

### 5. Error: Producto No Encontrado (en compra)

**Request:**
```http
POST /api/purchases HTTP/1.1
Host: localhost:3002
Content-Type: application/vnd.api+json
X-API-Key: secret-key-123

{
  "data": {
    "type": "purchases",
    "attributes": {
      "producto_id": 999,
      "cantidad": 5
    }
  }
}
```

**Response (404 Not Found):**
```json
{
  "errors": [
    {
      "status": "404",
      "title": "Not Found",
      "detail": "Producto no encontrado"
    }
  ]
}
```

### 6. Error: Inventario No Encontrado

**Request:**
```http
GET /api/inventory/999 HTTP/1.1
Host: localhost:3002
X-API-Key: secret-key-123
```

**Response (404 Not Found):**
```json
{
  "errors": [
    {
      "status": "404",
      "title": "Not Found",
      "detail": "Inventario no encontrado para este producto"
    }
  ]
}
```

### 7. Historial de Compras

**Request:**
```http
GET /api/purchases/history/1 HTTP/1.1
Host: localhost:3002
X-API-Key: secret-key-123
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "type": "purchase-history",
      "id": "3",
      "attributes": {
        "producto_id": 1,
        "cantidad": 2,
        "precio_unitario": 1299.99,
        "total": 2599.98,
        "fecha": "2024-01-15T14:20:00.000Z"
      }
    },
    {
      "type": "purchase-history",
      "id": "2",
      "attributes": {
        "producto_id": 1,
        "cantidad": 3,
        "precio_unitario": 1299.99,
        "total": 3899.97,
        "fecha": "2024-01-15T12:15:00.000Z"
      }
    },
    {
      "type": "purchase-history",
      "id": "1",
      "attributes": {
        "producto_id": 1,
        "cantidad": 5,
        "precio_unitario": 1299.99,
        "total": 6499.95,
        "fecha": "2024-01-15T10:30:00.000Z"
      }
    }
  ]
}
```

---

## Flujo Completo de Ejemplo

### Escenario: Comprar 3 Laptops

#### Paso 1: Crear el producto
```bash
curl -X POST http://localhost:3001/api/products \
  -H "Content-Type: application/vnd.api+json" \
  -H "X-API-Key: secret-key-123" \
  -d '{
    "data": {
      "type": "products",
      "attributes": {
        "nombre": "Laptop Dell XPS 15",
        "precio": 1299.99,
        "descripcion": "Laptop de alto rendimiento"
      }
    }
  }'
```

**Respuesta:** Producto creado con ID: 1

#### Paso 2: Agregar inventario inicial
```bash
curl -X PATCH http://localhost:3002/api/inventory/1 \
  -H "Content-Type: application/vnd.api+json" \
  -H "X-API-Key: secret-key-123" \
  -d '{
    "data": {
      "type": "inventory",
      "id": "1",
      "attributes": {
        "cantidad": 50
      }
    }
  }'
```

**Respuesta:** Inventario actualizado a 50 unidades

#### Paso 3: Consultar inventario disponible
```bash
curl -X GET http://localhost:3002/api/inventory/1 \
  -H "X-API-Key: secret-key-123"
```

**Respuesta:**
```json
{
  "data": {
    "type": "inventory",
    "id": "1",
    "attributes": {
      "producto_id": 1,
      "cantidad": 50,
      "producto": {
        "nombre": "Laptop Dell XPS 15",
        "precio": 1299.99,
        "descripcion": "Laptop de alto rendimiento"
      }
    }
  }
}
```

#### Paso 4: Realizar la compra
```bash
curl -X POST http://localhost:3002/api/purchases \
  -H "Content-Type: application/vnd.api+json" \
  -H "X-API-Key: secret-key-123" \
  -d '{
    "data": {
      "type": "purchases",
      "attributes": {
        "producto_id": 1,
        "cantidad": 3
      }
    }
  }'
```

**Respuesta:**
```json
{
  "data": {
    "type": "purchases",
    "id": "1",
    "attributes": {
      "producto_id": 1,
      "producto_nombre": "Laptop Dell XPS 15",
      "cantidad": 3,
      "precio_unitario": 1299.99,
      "total": 3899.97,
      "inventario_restante": 47,
      "fecha": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

#### Paso 5: Verificar inventario actualizado
```bash
curl -X GET http://localhost:3002/api/inventory/1 \
  -H "X-API-Key: secret-key-123"
```

**Respuesta:**
```json
{
  "data": {
    "type": "inventory",
    "id": "1",
    "attributes": {
      "producto_id": 1,
      "cantidad": 47,
      "producto": {
        "nombre": "Laptop Dell XPS 15",
        "precio": 1299.99,
        "descripcion": "Laptop de alto rendimiento"
      }
    }
  }
}
```

---

## Casos de Error Comunes

### 1. Content-Type Incorrecto

**Request:**
```http
POST /api/products HTTP/1.1
Host: localhost:3001
Content-Type: application/json
X-API-Key: secret-key-123
```

**Response (415 Unsupported Media Type):**
```json
{
  "errors": [
    {
      "status": "415",
      "title": "Unsupported Media Type",
      "detail": "Content-Type debe ser application/vnd.api+json"
    }
  ]
}
```

### 2. Servicio de Productos No Disponible

**Request:**
```http
POST /api/purchases HTTP/1.1
Host: localhost:3002
Content-Type: application/vnd.api+json
X-API-Key: secret-key-123
```

**Response (503 Service Unavailable):**
```json
{
  "errors": [
    {
      "status": "503",
      "title": "Service Unavailable",
      "detail": "Servicio de productos no disponible después de 3 intentos"
    }
  ]
}
```

### 3. Cantidad Negativa

**Request:**
```http
PATCH /api/inventory/1 HTTP/1.1
Host: localhost:3002
Content-Type: application/vnd.api+json
X-API-Key: secret-key-123

{
  "data": {
    "type": "inventory",
    "id": "1",
    "attributes": {
      "cantidad": -5
    }
  }
}
```

**Response (400 Bad Request):**
```json
{
  "errors": [
    {
      "status": "400",
      "title": "Bad Request",
      "detail": "Cantidad debe ser un número no negativo"
    }
  ]
}
```

---

## Health Checks

### Products Service
**Request:**
```http
GET /health HTTP/1.1
Host: localhost:3001
```

**Response (200 OK):**
```json
{
  "status": "ok",
  "service": "products"
}
```

### Inventory Service
**Request:**
```http
GET /health HTTP/1.1
Host: localhost:3002
```

**Response (200 OK):**
```json
{
  "status": "ok",
  "service": "inventory"
}
```

---

## Notas sobre JSON API

### Estructura de Recursos
Todos los recursos siguen el formato JSON API:
```json
{
  "data": {
    "type": "resource-type",
    "id": "resource-id",
    "attributes": {
      // Atributos del recurso
    }
  }
}
```

### Estructura de Errores
Todos los errores siguen el formato JSON API:
```json
{
  "errors": [
    {
      "status": "HTTP-status-code",
      "title": "Error-title",
      "detail": "Detailed error message"
    }
  ]
}
```

### Content-Type
Siempre usar: `application/vnd.api+json`

### Headers Requeridos
- `Content-Type: application/vnd.api+json` (para POST/PATCH)
- `X-API-Key: secret-key-123` (para autenticación)
