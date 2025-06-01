# 🤖 WhatsApp Bot Manager

Un sistema completo de gestión de bots de WhatsApp con panel de control web, API REST y monitoreo en tiempo real.

## ✨ Características

- 🎛️ **Panel de Control Web**: Interfaz intuitiva para gestionar tus bots
- 🔌 **API REST**: Endpoints completos para integración externa
- 📊 **Monitoreo en Tiempo Real**: Seguimiento de estado y logs
- 🔄 **Auto-reload**: Desarrollo con recarga automática
- 💾 **Sistema de Respaldos**: Backup automático y manual
- 🔒 **Seguridad Integrada**: JWT, CORS y configuración segura
- 🐧 **Soporte Multiplataforma**: Linux y Windows

## 🚀 Instalación

### Prerrequisitos

- Node.js 16+ 
- npm o yarn
- PM2 (para producción)

### Clonar el repositorio

```bash
git clone https://github.com/jyr45/web-server-bot-manager.git
cd whatsapp-bot-manager
npm install
```

### Configuración

1. **Variables de entorno**: Copia y configura el archivo `.env`
```bash
cp .env.example .env
```

2. **Configuración**: Ajusta el archivo `config.json` según tus necesidades

3. **JWT Secret**: Cambia la variable `JWT_SECRET` en `.env` por una clave segura

## 🐧 Configuración para Linux

### Dependencias del sistema

Instala las librerías necesarias para Chromium:

```bash
sudo apt-get update
```

**Opción 1 (Recomendada):**
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

**Opción 2 (Alternativa):**
```bash
sudo apt-get install -y gconf-service libasound2 libatk1.0-0 libatk-bridge2.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget
```

### Instalar Chromium

```bash
sudo apt-get install chromium-browser
```

### Configurar Puppeteer

Instala Chromium para Puppeteer (si es necesario):

```bash
cd node_modules
node puppeteer/install.js
```

**Ejemplo de salida:**
```
Chromium is already in /home/user/web-server-bot-manager/node_modules/puppeteer-core/.local-chromium/linux-1045629; skipping download.
```

## ⚙️ Configuración de Chrome/Chromium

En el archivo `server.js`, configura la ruta correcta de Chrome:

```javascript
// VARIABLES DE CHROME
// LINUX
const chromiumPath = path.join(__dirname, '/home/user/web-server-bot-manager/node_modules/puppeteer-core/.local-chromium/linux-1045629/chrome-linux/chrome');

// WINDOWS (comentado)
// const chromiumPath = 'C:\\\\Users\\\\User\\\\Desktop\\\\serv-bot\\\\node_modules\\\\puppeteer-core\\\\.local-chromium\\\\win64-1045629\\\\chrome-win\\\\chrome.exe';
```

## 🚀 Uso

### Desarrollo

```bash
npm run dev
```

### Producción

```bash
npm run deploy
```

### Comandos disponibles

- `npm start` - Iniciar servidor
- `npm run dev` - Modo desarrollo con auto-reload
- `npm run logs` - Ver logs de PM2
- `npm run backup` - Crear respaldo manual
- `npm run clean` - Limpiar archivos temporales

## 📱 Acceso

- **Panel de Control:** http://localhost:8080
- **API:** http://localhost:8080/api
- **Health Check:** http://localhost:8080/health

## 📊 Monitoreo

### PM2 Dashboard
```bash
pm2 monit
```

### Logs en tiempo real
```bash
pm2 logs
```

### Archivos de logs
- Sistema: `./logs/app.log`
- Configuración: `./config.json`
- Variables: `./.env`

## 🔒 Seguridad

### Configuración recomendada

1. **JWT Secret**: Cambia `JWT_SECRET` en `.env` por una clave única y segura
2. **CORS**: Configura `CORS_ORIGINS` apropiadamente para tu dominio
3. **HTTPS**: Usa HTTPS en producción
4. **Firewall**: Configura tu firewall para exponer solo los puertos necesarios

### Variables de entorno importantes

```env
JWT_SECRET=tu-clave-super-secreta-aqui
CORS_ORIGINS=https://tu-dominio.com
NODE_ENV=production
```

## 🐛 Solución de problemas

### Chrome/Chromium no encontrado

Si obtienes errores relacionados con Chrome:

1. Verifica la instalación: `which chromium-browser`
2. Ajusta la ruta en `server.js`
3. Instala las dependencias del sistema

### Permisos en Linux

```bash
sudo chmod +x node_modules/puppeteer-core/.local-chromium/*/chrome-linux/chrome
```

### Logs de depuración

```bash
# Ver logs de la aplicación
npm run logs

# Ver logs específicos de PM2
pm2 logs whatsapp-bot-manager
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 📞 Soporte

Si tienes problemas o preguntas:

1. Revisa los [Issues](../../issues) existentes
2. Consulta los logs del sistema
3. Crea un nuevo issue con detalles del problema

---

