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

Configurado el 26/5/2025, 9:00:14 p.m.
