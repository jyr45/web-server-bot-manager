# 🛠️ WhatsApp Bot Manager - Guía de Instalación Completa

## 📋 Requisitos Previos

### Sistema Operativo
- ✅ **Linux** (Ubuntu 20.04+ recomendado)
- ✅ **macOS** (10.14+)
- ✅ **Windows** (10/11 con WSL2 recomendado)

### Software Requerido
- 🟢 **Node.js 16+** (recomendado 18 LTS)
- 🟢 **npm 8+** o **yarn 1.22+**
- 🟢 **Git** (para clonar repositorio)
- 🔵 **PM2** (para producción)
- 🔵 **Nginx** (para proxy reverso)

### Hardware Mínimo
- **RAM:** 2GB (4GB recomendado)
- **CPU:** 2 cores (4 cores recomendado)
- **Disco:** 10GB libres (SSD recomendado)
- **Ancho de banda:** 10 Mbps

## 🚀 Instalación Rápida (Desarrollo)

### 1. Clonar el Repositorio
```bash
git clone https://github.com/tu-usuario/whatsapp-bot-manager.git
cd whatsapp-bot-manager
```

### 2. Ejecutar Setup Automático
```bash
# Hacer ejecutable el script de setup
chmod +x setup.js

# Ejecutar configuración automática
node setup.js
```

El script te guiará paso a paso por la configuración inicial.

### 3. Iniciar en Modo Desarrollo
```bash
npm run dev
```

### 4. Acceder al Panel
Abre tu navegador en: `http://localhost:8080`

## 🏗️ Instalación Manual (Paso a Paso)

### 1. Preparar el Entorno
```bash
# Actualizar sistema (Ubuntu/Debian)
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 18 LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar instalación
node --version  # debe ser 16+
npm --version   # debe ser 8+

# Instalar PM2 globalmente (opcional)
sudo npm install -g pm2
```

### 2. Clonar y Configurar
```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/whatsapp-bot-manager.git
cd whatsapp-bot-manager

# Instalar dependencias
npm install

# Crear estructura de directorios
mkdir -p bots uploads backups logs public
```

### 3. Configurar Variables de Entorno
```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar configuración
nano .env
```

**Configuración mínima en `.env`:**
```bash
MANAGEMENT_PORT=8080
JWT_SECRET=tu-clave-super-secreta-cambiar-esto
NODE_ENV=development
BOT_DOMAIN=localhost
BOT_PROTOCOL=http
```

### 4. Verificar Estructura del Proyecto
```
whatsapp-bot-manager/
├── server.js              # Servidor principal ✅
├── public/
│   └── index.html         # Frontend ✅
├── bots/                  # Bots generados ✅
├── uploads/               # Archivos subidos ✅
├── backups/               # Respaldos ✅
├── logs/                  # Logs del sistema ✅
├── package.json           # Dependencias ✅
├── .env                   # Variables de entorno ✅
└── README.md             # Documentación ✅
```

### 5. Iniciar el Servidor
```bash
# Desarrollo
npm run dev

# Producción
npm start
```

## 🌐 Instalación en Producción

### 1. Configurar Servidor (Ubuntu 20.04)
```bash
# Crear usuario para la aplicación
sudo adduser botmanager
sudo usermod -aG sudo botmanager
su - botmanager

# Instalar dependencias del sistema
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
```

### 2. Configurar Node.js y PM2
```bash
# Instalar Node.js 18 LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PM2
sudo npm install -g pm2

# Configurar PM2 para auto-inicio
pm2 startup
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u botmanager --hp /home/botmanager
```

### 3. Desplegar la Aplicación
```bash
# Clonar en directorio de producción
cd /home/botmanager
git clone https://github.com/tu-usuario/whatsapp-bot-manager.git app
cd app

# Instalar dependencias de producción
npm ci --only=production

# Configurar variables de entorno para producción
cp .env.example .env
nano .env
```

**Configuración de producción en `.env`:**
```bash
MANAGEMENT_PORT=8080
JWT_SECRET=clave-super-segura-generada-aleatoriamente
NODE_ENV=production
BOT_DOMAIN=jogm.bot.com
BOT_PROTOCOL=https
CORS_ORIGINS=https://manager.jogm.bot.com,https://jogm.bot.com
ENABLE_COMPRESSION=true
CLUSTER_WORKERS=2
```

### 4. Configurar PM2
```bash
# Iniciar aplicación con PM2
pm2 start ecosystem.config.js --env production

# Guardar configuración PM2
pm2 save

# Verificar estado
pm2 status
pm2 logs
```

### 5. Configurar Nginx
```bash
# Crear configuración de Nginx
sudo nano /etc/nginx/sites-available/botmanager
```

**Configuración de Nginx:**
```nginx
# Panel de gestión
server {
    listen 80;
    server_name manager.jogm.bot.com;
    
    # Redirigir HTTP a HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name manager.jogm.bot.com;
    
    # Certificados SSL (configurar con certbot)
    ssl_certificate /etc/letsencrypt/live/manager.jogm.bot.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/manager.jogm.bot.com/privkey.pem;
    
    # Configuración SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Headers de seguridad
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    
    # Proxy al servidor Node.js
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # WebSocket support
    location /ws {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# Acceso directo a bots
server {
    listen 80;
    server_name jogm.bot.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name jogm.bot.com;
    
    ssl_certificate /etc/letsencrypt/live/jogm.bot.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/jogm.bot.com/privkey.pem;
    
    # Redirigir token de bot a endpoint específico
    location ~ ^/([a-f0-9]{32,})$ {
        proxy_pass http://localhost:8080/bot/$1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Página de inicio para dominio principal
    location / {
        return 200 'WhatsApp Bot Service - Powered by JOGM';
        add_header Content-Type text/plain;
    }
}
```

### 6. Activar Nginx y SSL
```bash
# Habilitar sitio
sudo ln -s /etc/nginx/sites-available/botmanager /etc/nginx/sites-enabled/

# Verificar configuración
sudo nginx -t

# Obtener certificados SSL
sudo certbot --nginx -d manager.jogm.bot.com -d jogm.bot.com

# Reiniciar servicios
sudo systemctl reload nginx
```

## 🔧 Configuración de Base de Datos (Opcional)

### MongoDB (Recomendado para escalabilidad)
```bash
# Instalar MongoDB
sudo apt install -y mongodb

# Configurar usuario
mongo
> use botmanager
> db.createUser({user: "botuser", pwd: "password", roles: ["readWrite"]})

# Actualizar .env
echo "MONGODB_URI=mongodb://botuser:password@localhost:27017/botmanager" >> .env
```

### PostgreSQL (Alternativa)
```bash
# Instalar PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Crear base de datos
sudo -u postgres psql
> CREATE DATABASE botmanager;
> CREATE USER botuser WITH PASSWORD 'password';
> GRANT ALL PRIVILEGES ON DATABASE botmanager TO botuser;

# Actualizar .env
echo "POSTGRES_HOST=localhost" >> .env
echo "POSTGRES_DB=botmanager" >> .env
echo "POSTGRES_USER=botuser" >> .env
echo "POSTGRES_PASSWORD=password" >> .env
```

## 📊 Monitoreo y Logs

### Configurar Logs
```bash
# Crear directorio de logs
sudo mkdir -p /var/log/botmanager
sudo chown botmanager:botmanager /var/log/botmanager

# Configurar logrotate
sudo nano /etc/logrotate.d/botmanager
```

**Configuración de logrotate:**
```
/var/log/botmanager/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 botmanager botmanager
    postrotate
        pm2 reloadLogs
    endscript
}
```

### Configurar Monitoreo
```bash
# Instalar htop para monitoreo básico
sudo apt install -y htop

# Monitoreo avanzado con PM2
pm2 install pm2-server-monit

# Ver estadísticas
pm2 monit
```

## 🔐 Seguridad

### Firewall
```bash
# Configurar UFW
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw deny 8080/tcp  # Solo acceso interno
```

### Actualizaciones Automáticas
```bash
# Instalar actualizaciones automáticas
sudo apt install -y unattended-upgrades

# Configurar
sudo dpkg-reconfigure unattended-upgrades
```

### Backup Automático
```bash
# Crear script de backup
nano ~/backup.sh
```

**Script de backup:**
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/botmanager/backups"
APP_DIR="/home/botmanager/app"

# Crear backup
tar -czf "$BACKUP_DIR/backup_$DATE.tar.gz" \
    "$APP_DIR/bots" \
    "$APP_DIR/.env" \
    "$APP_DIR/config.json"

# Limpiar backups antiguos (más de 30 días)
find "$BACKUP_DIR" -name "backup_*.tar.gz" -mtime +30 -delete

echo "Backup completado: backup_$DATE.tar.gz"
```

```bash
# Hacer ejecutable y programar
chmod +x ~/backup.sh
crontab -e

# Agregar línea para backup diario a las 2 AM
0 2 * * * /home/botmanager/backup.sh
```

## 🧪 Verificación de Instalación

### Tests Básicos
```bash
# Test de conectividad
curl http://localhost:8080/health

# Test de API
curl -X GET http://localhost:8080/api/bots

# Test de WebSocket
node -e "
const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:8080');
ws.on('open', () => console.log('WebSocket OK'));
ws.on('error', (e) => console.log('WebSocket Error:', e));
"
```

### Checklist de Verificación
- [ ] ✅ Servidor responde en puerto 8080
- [ ] ✅ Panel web accesible
- [ ] ✅ API endpoints funcionan
- [ ] ✅ WebSocket conecta
- [ ] ✅ Nginx configurado (producción)
- [ ] ✅ SSL activo (producción)
- [ ] ✅ PM2 ejecutándose
- [ ] ✅ Logs generándose
- [ ] ✅ Backups programados

## 🚨 Solución de Problemas

### Error: Puerto en Uso
```bash
# Verificar qué usa el puerto
sudo lsof -i :8080

# Cambiar puerto en .env
echo "MANAGEMENT_PORT=8081" >> .env
```

### Error: Permisos
```bash
# Ajustar permisos
sudo chown -R botmanager:botmanager /home/botmanager/app
chmod +x /home/botmanager/app/server.js
```

### Error: Dependencias
```bash
# Limpiar y reinstalar
rm -rf node_modules package-lock.json
npm install
```

### Error: PM2 No Inicia
```bash
# Reiniciar PM2
pm2 kill
pm2 start ecosystem.config.js
```

## 📞 Soporte Post-Instalación

### Logs Importantes
```bash
# Logs de aplicación
pm2 logs

# Logs de Nginx
sudo tail -f /var/log/nginx/error.log

# Logs del sistema
sudo journalctl -u nginx
```

### Comandos Útiles
```bash
# Estado completo del sistema
pm2 status && sudo systemctl status nginx

# Reiniciar todo
pm2 restart all && sudo systemctl reload nginx

# Backup manual
node scripts/backup.js
```

### Contacto de Soporte
- 📧 **Email:** soporte@jogm.bot.com
- 📱 **WhatsApp:** +52 1 962 187 XXXX
- 🌐 **Documentación:** https://docs.jogm.bot.com
- 🚨 **Emergencias:** 24/7 disponible

---

## 🎉 ¡Instalación Completada!

Una vez terminada la instalación:

1. **Accede al panel:** `https://manager.jogm.bot.com` (o `http://localhost:8080` en desarrollo)
2. **Crea tu primer bot** usando el wizard paso a paso
3. **Personaliza** los flujos según tu negocio
4. **Comparte la URL única** del bot con tus clientes
5. **Monitorea** el rendimiento desde el dashboard

**¡Tu sistema de bots está listo para automatizar tu negocio! 🚀**