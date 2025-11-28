#!/bin/bash

# Script de Prueba - Flujo Completo de Microservicios
#
# Autor: Oscar Javier Rivera
# Descripción: Script bash para probar el flujo completo de compra
# Uso: ./test-flow.sh

# Script para probar el flujo completo de los microservicios
# Asegúrate de que los servicios estén corriendo: docker-compose up

API_KEY="secret-key-123"
PRODUCTS_URL="http://localhost:3001"
INVENTORY_URL="http://localhost:3002"

echo "=== Testing Microservices Flow ==="
echo ""

# 1. Crear un producto
echo "1. Creando producto..."
PRODUCT_RESPONSE=$(curl -s -X POST "$PRODUCTS_URL/api/products" \
  -H "Content-Type: application/vnd.api+json" \
  -H "X-API-Key: $API_KEY" \
  -d '{
    "data": {
      "type": "products",
      "attributes": {
        "nombre": "Laptop Dell XPS 15",
        "precio": 1299.99,
        "descripcion": "Laptop de alto rendimiento"
      }
    }
  }')

PRODUCT_ID=$(echo $PRODUCT_RESPONSE | grep -o '"id":"[0-9]*"' | grep -o '[0-9]*')
echo "Producto creado con ID: $PRODUCT_ID"
echo ""

# 2. Obtener el producto
echo "2. Obteniendo producto..."
curl -s -X GET "$PRODUCTS_URL/api/products/$PRODUCT_ID" \
  -H "X-API-Key: $API_KEY" | json_pp
echo ""

# 3. Actualizar inventario
echo "3. Actualizando inventario..."
curl -s -X PATCH "$INVENTORY_URL/api/inventory/$PRODUCT_ID" \
  -H "Content-Type: application/vnd.api+json" \
  -H "X-API-Key: $API_KEY" \
  -d "{
    \"data\": {
      \"type\": \"inventory\",
      \"id\": \"$PRODUCT_ID\",
      \"attributes\": {
        \"cantidad\": 100
      }
    }
  }" | json_pp
echo ""

# 4. Consultar inventario
echo "4. Consultando inventario..."
curl -s -X GET "$INVENTORY_URL/api/inventory/$PRODUCT_ID" \
  -H "X-API-Key: $API_KEY" | json_pp
echo ""

# 5. Realizar compra
echo "5. Realizando compra de 5 unidades..."
curl -s -X POST "$INVENTORY_URL/api/purchases" \
  -H "Content-Type: application/vnd.api+json" \
  -H "X-API-Key: $API_KEY" \
  -d "{
    \"data\": {
      \"type\": \"purchases\",
      \"attributes\": {
        \"producto_id\": $PRODUCT_ID,
        \"cantidad\": 5
      }
    }
  }" | json_pp
echo ""

# 6. Verificar inventario actualizado
echo "6. Verificando inventario después de la compra..."
curl -s -X GET "$INVENTORY_URL/api/inventory/$PRODUCT_ID" \
  -H "X-API-Key: $API_KEY" | json_pp
echo ""

# 7. Intentar compra con inventario insuficiente
echo "7. Intentando compra con inventario insuficiente (200 unidades)..."
curl -s -X POST "$INVENTORY_URL/api/purchases" \
  -H "Content-Type: application/vnd.api+json" \
  -H "X-API-Key: $API_KEY" \
  -d "{
    \"data\": {
      \"type\": \"purchases\",
      \"attributes\": {
        \"producto_id\": $PRODUCT_ID,
        \"cantidad\": 200
      }
    }
  }" | json_pp
echo ""

echo "=== Test Flow Completed ==="
