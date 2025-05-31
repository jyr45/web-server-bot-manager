# WhatsApp Bot Manager - Instalación Local

## 🚀 Inicio Rápido

### Desarrollo
```bash
npm run dev
```

### Producción
```bash
npm run deploy
```

## 📱 Acceso
- **Panel de Control:** http://localhost:8080
- **API:** http://localhost:8080/api
- **Health Check:** http://localhost:8080/health

## 🔧 Comandos Útiles
- `npm start` - Iniciar servidor
- `npm run dev` - Modo desarrollo con auto-reload
- `npm run logs` - Ver logs de PM2
- `npm run backup` - Crear respaldo manual
- `npm run clean` - Limpiar archivos temporales

## 📊 Monitoreo
- PM2 Dashboard: `pm2 monit`
- Logs en tiempo real: `pm2 logs`

## 🔒 Seguridad
- Cambia JWT_SECRET en .env
- Configura CORS_ORIGINS apropiadamente
- Usa HTTPS en producción

## 📞 Soporte
- Logs del sistema: ./logs/app.log
- Configuración: ./config.json
- Variables de entorno: ./.env

Libreria requerida para chromuin
sudo apt update
sudo apt install -y \
    libnss3 \
    libatk-bridge2.0-0t64 \
    libatk1.0-0t64 \
    libcups2t64 \
    libdrm2 \
    libxkbcommon0 \
    libgbm1 \
    libasound2t64 \
    libpangocairo-1.0-0 \
    libpango-1.0-0 \
    libgtk-3-0t64 \
    libxss1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libx11-xcb1 \
    libxcb-dri3-0 \
    libdbus-1-3 \
    libxshmfence1 \
    libxinerama1 \
    libxcursor1


Configurado el 26/5/2025, 9:00:14 p.m.
