# Guía de Configuración para Windows

## Requisitos Previos

### 1. Instalar Docker Desktop para Windows
1. Descargar desde: https://www.docker.com/products/docker-desktop/
2. Ejecutar el instalador
3. Reiniciar el sistema si es necesario
4. Verificar instalación:
```powershell
docker --version
docker-compose --version
```

### 2. Instalar Node.js (Opcional - solo para desarrollo local)
1. Descargar desde: https://nodejs.org/ (versión LTS)
2. Ejecutar el instalador
3. Verificar instalación:
```powershell
node --version
npm --version
```

## Inicio Rápido con Docker

### 1. Abrir PowerShell como Administrador
```powershell
# Navegar al directorio del proyecto
cd C:\ruta\al\proyecto\microservices-shop
```

### 2. Iniciar los servicios
```powershell
docker-compose up --build
```

**Nota**: La primera vez tomará varios minutos descargando imágenes.

### 3. Verificar que los servicios están corriendo
Abrir otra ventana de PowerShell:
```powershell
# Health check - Products Service
Invoke-RestMethod -Uri http://localhost:3001/health

# Health check - Inventory Service
Invoke-RestMethod -Uri http://localhost:3002/health
```

## Probar los Servicios

### Opción 1: Usar el Script PowerShell
```powershell
.\test-flow.ps1
```

### Opción 2: Usar Postman
1. Descargar Postman: https://www.postman.com/downloads/
2. Importar la colección: `postman_collection.json`
3. Ejecutar las peticiones

### Opción 3: Usar PowerShell manualmente

#### Crear un producto
```powershell
$headers = @{
    "Content-Type" = "application/vnd.api+json"
    "X-API-Key" = "secret-key-123"
}

$body = @{
    data = @{
        type = "products"
        attributes = @{
            nombre = "Laptop Dell XPS 15"
            precio = 1299.99
            descripcion = "Laptop de alto rendimiento"
        }
    }
} | ConvertTo-Json -Depth 10

$response = Invoke-RestMethod -Uri "http://localhost:3001/api/products" `
    -Method Post `
    -Headers $headers `
    -Body $body

$response | ConvertTo-Json -Depth 10
```

#### Obtener el producto
```powershell
$productId = $response.data.id

Invoke-RestMethod -Uri "http://localhost:3001/api/products/$productId" `
    -Headers @{"X-API-Key"="secret-key-123"} | ConvertTo-Json -Depth 10
```

#### Agregar inventario
```powershell
$body = @{
    data = @{
        type = "inventory"
        id = $productId
        attributes = @{
            cantidad = 100
        }
    }
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri "http://localhost:3002/api/inventory/$productId" `
    -Method Patch `
    -Headers $headers `
    -Body $body | ConvertTo-Json -Depth 10
```

#### Realizar una compra
```powershell
$body = @{
    data = @{
        type = "purchases"
        attributes = @{
            producto_id = [int]$productId
            cantidad = 5
        }
    }
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri "http://localhost:3002/api/purchases" `
    -Method Post `
    -Headers $headers `
    -Body $body | ConvertTo-Json -Depth 10
```

## Desarrollo Local (Sin Docker)

### 1. Instalar PostgreSQL
1. Descargar desde: https://www.postgresql.org/download/windows/
2. Ejecutar el instalador
3. Recordar la contraseña del usuario `postgres`
4. Verificar que el servicio está corriendo

### 2. Crear las bases de datos
```powershell
# Abrir psql
psql -U postgres

# En psql:
CREATE DATABASE products_db;
CREATE DATABASE inventory_db;
\q
```

### 3. Configurar Products Service
```powershell
cd products-service
npm install
Copy-Item .env.example .env
# Editar .env con tu configuración
npm run dev
```

### 4. Configurar Inventory Service
```powershell
cd inventory-service
npm install
Copy-Item .env.example .env
# Editar .env con tu configuración
npm run dev
```

## Ejecutar Tests

### Products Service
```powershell
cd products-service
npm install
npm test
```

### Inventory Service
```powershell
cd inventory-service
npm install
npm test
```

## Ver Logs de Docker

### Ver logs de todos los servicios
```powershell
docker-compose logs -f
```

### Ver logs de un servicio específico
```powershell
docker-compose logs -f products-service
docker-compose logs -f inventory-service
```

## Detener los Servicios

### Detener sin eliminar datos
```powershell
docker-compose down
```

### Detener y eliminar volúmenes (limpia las bases de datos)
```powershell
docker-compose down -v
```

## Acceder a Swagger

Abrir en el navegador:
- Products Service: http://localhost:3001/api-docs
- Inventory Service: http://localhost:3002/api-docs

## Troubleshooting

### Error: "Puerto ya en uso"
```powershell
# Ver qué proceso está usando el puerto
netstat -ano | findstr :3001
netstat -ano | findstr :3002

# Matar el proceso (reemplazar PID con el número del proceso)
taskkill /PID <PID> /F
```

### Error: "Docker no está corriendo"
1. Abrir Docker Desktop
2. Esperar a que inicie completamente
3. Verificar el ícono en la bandeja del sistema

### Error: "No se puede conectar a la base de datos"
```powershell
# Verificar que los contenedores están corriendo
docker-compose ps

# Reiniciar los servicios
docker-compose restart
```

### Error: "npm no es reconocido"
1. Cerrar y abrir PowerShell
2. Verificar que Node.js está en el PATH:
```powershell
$env:Path
```

### Limpiar todo y empezar de nuevo
```powershell
# Detener todos los contenedores
docker-compose down -v

# Eliminar imágenes
docker-compose rm -f

# Reconstruir
docker-compose up --build
```

## Herramientas Recomendadas para Windows

### Editores de Código
- **Visual Studio Code**: https://code.visualstudio.com/
  - Extensiones recomendadas:
    - Docker
    - REST Client
    - PostgreSQL
    - ESLint

### Clientes de Base de Datos
- **pgAdmin**: https://www.pgadmin.org/download/
- **DBeaver**: https://dbeaver.io/download/

### Clientes HTTP
- **Postman**: https://www.postman.com/downloads/
- **Insomnia**: https://insomnia.rest/download

### Terminal Mejorada
- **Windows Terminal**: https://aka.ms/terminal
  - Mejor experiencia que PowerShell tradicional
  - Soporte para múltiples pestañas
  - Personalizable

## Comandos Útiles de PowerShell

### Ver contenedores corriendo
```powershell
docker ps
```

### Ver todas las imágenes
```powershell
docker images
```

### Entrar a un contenedor
```powershell
docker exec -it <container_name> sh
```

### Ver uso de recursos
```powershell
docker stats
```

### Limpiar recursos no usados
```powershell
docker system prune -a
```

## Configuración de Variables de Entorno

### Crear archivo .env en PowerShell
```powershell
@"
PORT=3001
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/products_db
API_KEY=secret-key-123
NODE_ENV=development
"@ | Out-File -FilePath products-service\.env -Encoding utf8
```

## Permisos de Ejecución de Scripts

Si encuentras error al ejecutar scripts PowerShell:
```powershell
# Ver política actual
Get-ExecutionPolicy

# Cambiar política (como Administrador)
Set-ExecutionPolicy RemoteSigned

# O ejecutar el script con bypass
PowerShell -ExecutionPolicy Bypass -File .\test-flow.ps1
```

## Firewall de Windows

Si tienes problemas de conexión:
1. Abrir "Firewall de Windows Defender"
2. Permitir Docker Desktop
3. Permitir Node.js (si usas desarrollo local)

## Soporte

Para más información:
- [README.md](README.md) - Documentación principal
- [QUICKSTART.md](QUICKSTART.md) - Guía de inicio rápido
- [DEVELOPMENT.md](DEVELOPMENT.md) - Guía de desarrollo

## Recursos Adicionales

- Docker Desktop Docs: https://docs.docker.com/desktop/windows/
- Node.js Windows: https://nodejs.org/en/download/
- PostgreSQL Windows: https://www.postgresql.org/download/windows/
- PowerShell Docs: https://docs.microsoft.com/powershell/
