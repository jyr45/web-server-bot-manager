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

## LINUX
Libreria requerida para chromuin
```bash
sudo apt-get update
```
```bash
sudo apt-get install -y gconf-service libasound2 libatk1.0-0 libatk-bridge2.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget
```
o
```bash
sudo apt-get install -y \
    libasound2-dev \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcairo2 \
    libcups2 \
    libdrm2 \
    libexpat1 \
    libgbm1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxrandr2 \
    libxshmfence1 \
    fonts-liberation \
    xdg-utils \
    wget
```

## Instalacion de chromuin
```bash
sudo apt-get install chromium-browser
```

## GENERACION DEL BOT EN CLIENTE PARA LINUX USANDO Chromium-browser
```bash
const client = new Client({
    authStrategy: new LocalAuth({ clientId: BOT_ID }),
    puppeteer: {
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
        ],
        executablePath: '/usr/bin/chromium-browser', // Ruta a Chromium en sistemas Debian/Ubuntu
        headless: true
    }
});
```
```bash
snap install chromium
```

## GENERACION DEL BOT EN CLIENTE PARA OTROS SISTEMAS (USADO EN WINDOWS) USANDO puppeteer
```bash
// Configuración del cliente de WhatsApp
const client = new Client({
    authStrategy: new LocalAuth({ clientId: BOT_ID }),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});
```


Configurado el 26/5/2025, 9:00:14 p.m.
