# 📡 WhatsApp Bot Manager - Documentación de API

## 🏗️ Arquitectura General

El sistema utiliza una arquitectura de microservicios donde:
- **Servidor Principal** (`server.js`) gestiona la interfaz y API de administración
- **Bots Individuales** se ejecutan como procesos independientes
- **WebSocket** para comunicación en tiempo real
- **URLs Únicas** para cada bot: `https://jogm.bot.com/{token}`

## 🔐 Autenticación

### Estructura de Request
```javascript
// Headers requeridos
{
  "Content-Type": "application/json",
  "Authorization": "Bearer {jwt_token}" // Para rutas protegidas
}
```

### Obtener Token (Futuro)
```http
POST /api/auth/login
{
  "username": "admin",
  "password": "password"
}
```

## 🤖 Gestión de Bots

### 1. Crear Bot Nuevo
```http
POST /api/bots/create
Content-Type: application/json

{
  "name": "Bot JOGM Servicios",
  "company": "JOGM Servicios",
  "plan": "profesional",
  "adminNumber": "521962187XXXX",
  "commandPrefix": "!",
  "description": "Bot para servicios técnicos",
  "apiBaseUrl": "https://miempresa.com/api/",
  "apiPassword": "mi_token_secreto",
  "enableAI": true,
  "geminiApiKey": "tu_gemini_key",
  "sessionTimeout": 15,
  "defaultPause": 30
}
```

**Respuesta:**
```json
{
  "success": true,
  "bot": {
    "id": "bot_1704067200000_abc123",
    "token": "f47ac10b58cc4372a5670e02b2c3d479",
    "name": "Bot JOGM Servicios",
    "company": "JOGM Servicios",
    "plan": "profesional",
    "status": "created",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "stats": {
      "messages": 0,
      "users": 0,
      "uptime": 0
    }
  },
  "message": "Bot creado exitosamente"
}
```

### 2. Listar Todos los Bots
```http
GET /api/bots
```

**Respuesta:**
```json
{
  "success": true,
  "bots": [
    {
      "id": "bot_1704067200000_abc123",
      "name": "Bot JOGM Servicios",
      "company": "JOGM Servicios",
      "plan": "profesional",
      "status": "running",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "lastActivity": "2024-01-01T12:30:00.000Z",
      "stats": {
        "messages": 247,
        "users": 15
      },
      "token": "f47ac10b58cc4372a5670e02b2c3d479"
    }
  ]
}
```

### 3. Obtener Bot Específico
```http
GET /api/bots/{botId}
```

### 4. Actualizar Bot
```http
PUT /api/bots/{botId}
Content-Type: application/json

{
  "name": "Nuevo Nombre del Bot",
  "description": "Nueva descripción"
}
```

### 5. Eliminar Bot
```http
DELETE /api/bots/{botId}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Bot eliminado exitosamente"
}
```

## ⚡ Control de Bots

### Iniciar Bot
```http
POST /api/bots/{botId}/start
```

### Detener Bot
```http
POST /api/bots/{botId}/stop
```

### Reiniciar Bot
```http
POST /api/bots/{botId}/restart
```

**Respuesta estándar:**
```json
{
  "success": true,
  "message": "Bot iniciado exitosamente"
}
```

## 📊 Analíticas y Estadísticas

### Dashboard Principal
```http
GET /api/analytics/dashboard
```

**Respuesta:**
```json
{
  "success": true,
  "stats": {
    "totalBots": 5,
    "activeBots": 3,
    "totalMessages": 1247,
    "totalRevenue": 15997,
    "uptime": 86400000
  }
}
```

### Métricas de Bot Específico
```http
GET /api/bots/{botId}/analytics
```

## 📋 Logs del Sistema

### Obtener Logs
```http
GET /api/logs?limit=100&level=INFO&botId=bot_123
```

**Parámetros de consulta:**
- `limit`: Número máximo de logs (default: 100)
- `level`: Nivel de log (ERROR, WARN, INFO, DEBUG)
- `botId`: ID del bot específico

**Respuesta:**
```json
{
  "success": true,
  "logs": [
    {
      "timestamp": "2024-01-01T12:30:00.000Z",
      "level": "INFO",
      "message": "Bot iniciado correctamente",
      "botId": "bot_1704067200000_abc123"
    }
  ]
}
```

### Limpiar Logs
```http
DELETE /api/logs
```

## 📥 Descarga de Bots

### Descargar Bot como ZIP
```http
GET /api/bots/{botId}/download
```

**Respuesta:** Archivo ZIP con todos los archivos del bot

## 🌐 Acceso Directo a Bots

### Por Token (Público)
```http
GET /bot/{token}
```

**Respuesta:**
```json
{
  "botName": "Bot JOGM Servicios",
  "company": "JOGM Servicios",
  "plan": "profesional",
  "status": "active",
  "message": "Bot de JOGM Servicios funcionando correctamente",
  "instructions": "Escanea el código QR con WhatsApp para conectar"
}
```

## 🔍 Health Check

### Estado del Servidor
```http
GET /health
```

**Respuesta:**
```json
{
  "status": "OK",
  "uptime": 86400000,
  "timestamp": "2024-01-01T12:30:00.000Z",
  "activeBots": 3,
  "totalBots": 5
}
```

## 🔌 WebSocket

### Conexión
```javascript
const ws = new WebSocket('ws://localhost:8080');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Mensaje recibido:', data);
};
```

### Tipos de Mensajes WebSocket

#### 1. Conexión Establecida
```json
{
  "type": "connected",
  "timestamp": "2024-01-01T12:30:00.000Z",
  "activeBots": 3,
  "totalBots": 5
}
```

#### 2. Estado de Bot Cambiado
```json
{
  "type": "bot_status",
  "botId": "bot_1704067200000_abc123",
  "status": "running"
}
```

#### 3. Nuevo Log
```json
{
  "type": "log",
  "data": {
    "timestamp": "2024-01-01T12:30:00.000Z",
    "level": "INFO",
    "message": "Mensaje recibido de usuario",
    "botId": "bot_1704067200000_abc123"
  }
}
```

#### 4. Bot Creado
```json
{
  "type": "bot_created",
  "botId": "bot_1704067200000_abc123",
  "bot": { /* objeto completo del bot */ }
}
```

## 📱 API de Bots Individuales

Cada bot generado tiene su propia API en un puerto único:

### Estado del Bot
```http
GET http://localhost:3001/api/status
```

### Enviar Mensaje
```http
POST http://localhost:3001/api/send-message
Content-Type: application/json

{
  "number": "521962187XXXX",
  "message": "Hola desde la API"
}
```

## ❌ Códigos de Error

### Códigos HTTP Estándar
- `200` - OK
- `201` - Creado
- `400` - Bad Request (datos inválidos)
- `401` - No autorizado
- `403` - Prohibido
- `404` - No encontrado
- `429` - Demasiadas solicitudes
- `500` - Error interno del servidor

### Formato de Error
```json
{
  "error": "Descripción del error",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-01T12:30:00.000Z"
}
```

### Errores Comunes

#### Bot No Encontrado
```json
{
  "error": "Bot no encontrado",
  "code": "BOT_NOT_FOUND"
}
```

#### Configuración Inválida
```json
{
  "error": "Número de administrador debe tener formato 521XXXXXXXXXX",
  "code": "INVALID_ADMIN_NUMBER"
}
```

#### Bot Ya Ejecutándose
```json
{
  "error": "El bot ya está ejecutándose",
  "code": "BOT_ALREADY_RUNNING"
}
```

## 🔄 Rate Limiting

- **Límite por defecto:** 100 requests por minuto por IP
- **Headers de respuesta:**
  - `X-RateLimit-Limit`: Límite máximo
  - `X-RateLimit-Remaining`: Requests restantes
  - `X-RateLimit-Reset`: Timestamp de reset

## 📝 Ejemplos de Uso

### Crear y Iniciar Bot Completo
```javascript
// 1. Crear bot
const createResponse = await fetch('/api/bots/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Mi Bot',
    company: 'Mi Empresa',
    plan: 'profesional',
    adminNumber: '521962187XXXX'
  })
});

const { bot } = await createResponse.json();

// 2. Iniciar bot
await fetch(`/api/bots/${bot.id}/start`, {
  method: 'POST'
});

// 3. Monitorear vía WebSocket
const ws = new WebSocket('ws://localhost:8080');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'bot_status' && data.botId === bot.id) {
    console.log(`Bot ${bot.name} estado: ${data.status}`);
  }
};
```

## 🚀 URLs de Producción

En producción, las URLs serían:
- **Panel:** `https://manager.jogm.bot.com`
- **API:** `https://manager.jogm.bot.com/api`
- **Bots:** `https://jogm.bot.com/{token}`
- **WebSocket:** `wss://manager.jogm.bot.com`

## 🔧 Configuración Avanzada

### Variables de Entorno Importantes
```bash
# Servidor principal
MANAGEMENT_PORT=8080
BOT_DOMAIN=jogm.bot.com
BOT_PROTOCOL=https

# Rate limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=1

# CORS
CORS_ORIGINS=https://manager.jogm.bot.com,https://jogm.bot.com
```

### Configuración de Proxy (Nginx)
```nginx
# Para el panel de gestión
server {
    listen 80;
    server_name manager.jogm.bot.com;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /ws {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}

# Para bots individuales
server {
    listen 80;
    server_name jogm.bot.com;
    
    location ~ ^/([a-f0-9]{32,})$ {
        # Redirigir a bot específico basado en token
        proxy_pass http://localhost:3000;
    }
}
```

## 🐛 Debugging

### Logs Detallados
```bash
# Habilitar logs debug
export LOG_LEVEL=debug
export VERBOSE_LOGS=true
npm run dev
```

### Monitoreo en Tiempo Real
```bash
# Logs del sistema
tail -f logs/app.log

# Logs de PM2
pm2 logs

# Monitoreo completo
pm2 monit
```

## 📞 Soporte y Contacto

Para soporte técnico:
- 📧 Email: soporte@jogm.bot.com
- 📱 WhatsApp: +52 1 962 187 XXXX
- 🌐 Documentación: https://docs.jogm.bot.com
- 🐛 Issues: https://github.com/tu-usuario/bot-manager/issues