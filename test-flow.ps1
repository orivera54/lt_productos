# Script de Prueba - Flujo Completo de Microservicios
#
# Autor: Oscar Javier Rivera
# Descripción: Script PowerShell para probar el flujo completo de compra
# Uso: .\test-flow.ps1
#
# Script PowerShell para probar el flujo completo de los microservicios
# Asegúrate de que los servicios estén corriendo: docker-compose up

$API_KEY = "secret-key-123"
$PRODUCTS_URL = "http://localhost:3001"
$INVENTORY_URL = "http://localhost:3002"

Write-Host "=== Testing Microservices Flow ===" -ForegroundColor Green
Write-Host ""

# 1. Crear un producto
Write-Host "1. Creando producto..." -ForegroundColor Yellow
$productBody = @{
    data = @{
        type = "products"
        attributes = @{
            nombre = "Laptop Dell XPS 15"
            precio = 1299.99
            descripcion = "Laptop de alto rendimiento"
        }
    }
} | ConvertTo-Json -Depth 10

$productResponse = Invoke-RestMethod -Uri "$PRODUCTS_URL/api/products" `
    -Method Post `
    -Headers @{"Content-Type"="application/vnd.api+json"; "X-API-Key"=$API_KEY} `
    -Body $productBody

$PRODUCT_ID = $productResponse.data.id
Write-Host "Producto creado con ID: $PRODUCT_ID" -ForegroundColor Green
Write-Host ""

# 2. Obtener el producto
Write-Host "2. Obteniendo producto..." -ForegroundColor Yellow
$product = Invoke-RestMethod -Uri "$PRODUCTS_URL/api/products/$PRODUCT_ID" `
    -Headers @{"X-API-Key"=$API_KEY}
$product | ConvertTo-Json -Depth 10
Write-Host ""

# 3. Actualizar inventario
Write-Host "3. Actualizando inventario..." -ForegroundColor Yellow
$inventoryBody = @{
    data = @{
        type = "inventory"
        id = $PRODUCT_ID
        attributes = @{
            cantidad = 100
        }
    }
} | ConvertTo-Json -Depth 10

$inventory = Invoke-RestMethod -Uri "$INVENTORY_URL/api/inventory/$PRODUCT_ID" `
    -Method Patch `
    -Headers @{"Content-Type"="application/vnd.api+json"; "X-API-Key"=$API_KEY} `
    -Body $inventoryBody
$inventory | ConvertTo-Json -Depth 10
Write-Host ""

# 4. Consultar inventario
Write-Host "4. Consultando inventario..." -ForegroundColor Yellow
$inventory = Invoke-RestMethod -Uri "$INVENTORY_URL/api/inventory/$PRODUCT_ID" `
    -Headers @{"X-API-Key"=$API_KEY}
$inventory | ConvertTo-Json -Depth 10
Write-Host ""

# 5. Realizar compra
Write-Host "5. Realizando compra de 5 unidades..." -ForegroundColor Yellow
$purchaseBody = @{
    data = @{
        type = "purchases"
        attributes = @{
            producto_id = [int]$PRODUCT_ID
            cantidad = 5
        }
    }
} | ConvertTo-Json -Depth 10

$purchase = Invoke-RestMethod -Uri "$INVENTORY_URL/api/purchases" `
    -Method Post `
    -Headers @{"Content-Type"="application/vnd.api+json"; "X-API-Key"=$API_KEY} `
    -Body $purchaseBody
$purchase | ConvertTo-Json -Depth 10
Write-Host ""

# 6. Verificar inventario actualizado
Write-Host "6. Verificando inventario después de la compra..." -ForegroundColor Yellow
$inventory = Invoke-RestMethod -Uri "$INVENTORY_URL/api/inventory/$PRODUCT_ID" `
    -Headers @{"X-API-Key"=$API_KEY}
$inventory | ConvertTo-Json -Depth 10
Write-Host ""

# 7. Intentar compra con inventario insuficiente
Write-Host "7. Intentando compra con inventario insuficiente (200 unidades)..." -ForegroundColor Yellow
$purchaseBody = @{
    data = @{
        type = "purchases"
        attributes = @{
            producto_id = [int]$PRODUCT_ID
            cantidad = 200
        }
    }
} | ConvertTo-Json -Depth 10

try {
    $purchase = Invoke-RestMethod -Uri "$INVENTORY_URL/api/purchases" `
        -Method Post `
        -Headers @{"Content-Type"="application/vnd.api+json"; "X-API-Key"=$API_KEY} `
        -Body $purchaseBody
    $purchase | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error esperado: Inventario insuficiente" -ForegroundColor Red
    $_.Exception.Response
}
Write-Host ""

Write-Host "=== Test Flow Completed ===" -ForegroundColor Green
