#!/usr/bin/env node

// setup.js - Script de configuración inicial del sistema
const fs = require('fs-extra');
const path = require('path');
const readline = require('readline');
const crypto = require('crypto');
const { execSync } = require('child_process');

console.log('🤖 WhatsApp Bot Manager - Configuración Inicial');
console.log('='.repeat(50));

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function ask(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer.trim());
        });
    });
}

async function main() {
    try {
        console.log('\n📋 Configurando el sistema...\n');

        // 1. Verificar Node.js version
        const nodeVersion = process.version;
        console.log(`✅ Node.js version: ${nodeVersion}`);
        
        if (parseInt(nodeVersion.slice(1)) < 16) {
            console.error('❌ Se requiere Node.js 16 o superior');
            process.exit(1);
        }

        // 2. Crear directorios necesarios
        console.log('\n📁 Creando directorios...');
        const directories = [
            'bots',
            'uploads',
            'backups',
            'logs',
            'public',
            'scripts'
        ];

        for (const dir of directories) {
            await fs.ensureDir(dir);
            console.log(`   ✅ ${dir}/`);
        }

        // 3. Configurar variables de entorno
        console.log('\n🔧 Configurando variables de entorno...');
        
        const port = await ask('Puerto del servidor (8080): ') || '8080';
        const domain = await ask('Dominio para bots (jogm.bot.com): ') || 'jogm.bot.com';
        const protocol = await ask('Protocolo (https): ') || 'https';
        
        // Generar JWT secret aleatorio
        const jwtSecret = crypto.randomBytes(64).toString('hex');
        
        const envContent = `# Configuración generada automáticamente el ${new Date().toISOString()}
MANAGEMENT_PORT=${port}
JWT_SECRET=${jwtSecret}
NODE_ENV=development
BOT_DOMAIN=${domain}
BOT_PROTOCOL=${protocol}
MANAGEMENT_URL=http://localhost:${port}
RATE_LIMIT_REQUESTS=100
CORS_ORIGINS=http://localhost:${port},https://${domain},http://127.0.0.1:${port}
MAX_FILE_SIZE=50
LOG_LEVEL=info
DEFAULT_BOT_TIMEOUT=15
BOT_PORT_START=3000
BOT_PORT_END=3999
DEBUG_MODE=true
AUTO_BACKUP_ENABLED=true
BACKUP_FREQUENCY=24
BACKUP_RETENTION=30
TIMEZONE=America/Mexico_City
LOCAL_CURRENCY=MXN
LOCALE=es-MX
`;

        await fs.writeFile('.env', envContent);
        console.log('   ✅ Archivo .env creado');

        // 4. Instalar dependencias si no existen
        console.log('\n📦 Verificando dependencias...');
        if (!fs.existsSync('node_modules')) {
            console.log('   📥 Instalando dependencias...');
            execSync('npm install', { stdio: 'inherit' });
            console.log('   ✅ Dependencias instaladas');
        } else {
            console.log('   ✅ Dependencias ya instaladas');
        }

        // 5. Crear archivo de configuración inicial
        const configFile = {
            setupDate: new Date().toISOString(),
            version: '1.0.0',
            port: parseInt(port),
            domain: domain,
            protocol: protocol,
            initialized: true
        };
        
        await fs.writeJSON('config.json', configFile, { spaces: 2 });
        console.log('   ✅ Archivo de configuración creado');

        // 6. Crear scripts de utilidad
        console.log('\n⚙️ Creando scripts de utilidad...');
        
        // Script de inicio rápido
        const startScript = `#!/bin/bash
echo "🚀 Iniciando WhatsApp Bot Manager..."
export NODE_ENV=development
node server.js
`;
        await fs.writeFile('start.sh', startScript);
        await fs.chmod('start.sh', '755');
        console.log('   ✅ start.sh creado');

        // Script de producción
        const prodScript = `#!/bin/bash
echo "🚀 Iniciando en modo producción..."
export NODE_ENV=production
pm2 start server.js --name "bot-manager"
pm2 startup
pm2 save
echo "✅ Servidor iniciado con PM2"
`;
        await fs.writeFile('production.sh', prodScript);
        await fs.chmod('production.sh', '755');
        console.log('   ✅ production.sh creado');

        // 7. Crear archivo PM2
        const pm2Config = {
            apps: [{
                name: 'whatsapp-bot-manager',
                script: 'server.js',
                instances: 1,
                autorestart: true,
                watch: false,
                max_memory_restart: '1G',
                env: {
                    NODE_ENV: 'development',
                    PORT: port
                },
                env_production: {
                    NODE_ENV: 'production',
                    PORT: port
                }
            }]
        };
        
        await fs.writeJSON('ecosystem.config.js', `module.exports = ${JSON.stringify(pm2Config, null, 2)}`);
        console.log('   ✅ ecosystem.config.js creado');

        // 8. Verificar puerto disponible
        console.log('\n🔍 Verificando disponibilidad del puerto...');
        try {
            const net = require('net');
            const server = net.createServer();
            
            await new Promise((resolve, reject) => {
                server.listen(port, () => {
                    server.close();
                    resolve();
                });
                server.on('error', reject);
            });
            
            console.log(`   ✅ Puerto ${port} disponible`);
        } catch (error) {
            console.log(`   ⚠️  Puerto ${port} ocupado, pero el sistema puede funcionar`);
        }

        // 9. Crear README local
        const readme = `# WhatsApp Bot Manager - Instalación Local

## 🚀 Inicio Rápido

### Desarrollo
\`\`\`bash
npm run dev
\`\`\`

### Producción
\`\`\`bash
npm run deploy
\`\`\`

## 📱 Acceso
- **Panel de Control:** http://localhost:${port}
- **API:** http://localhost:${port}/api
- **Health Check:** http://localhost:${port}/health

## 🔧 Comandos Útiles
- \`npm start\` - Iniciar servidor
- \`npm run dev\` - Modo desarrollo con auto-reload
- \`npm run logs\` - Ver logs de PM2
- \`npm run backup\` - Crear respaldo manual
- \`npm run clean\` - Limpiar archivos temporales

## 📊 Monitoreo
- PM2 Dashboard: \`pm2 monit\`
- Logs en tiempo real: \`pm2 logs\`

## 🔒 Seguridad
- Cambia JWT_SECRET en .env
- Configura CORS_ORIGINS apropiadamente
- Usa HTTPS en producción

## 📞 Soporte
- Logs del sistema: ./logs/app.log
- Configuración: ./config.json
- Variables de entorno: ./.env

Configurado el ${new Date().toLocaleString()}
`;
        
        await fs.writeFile('README_LOCAL.md', readme);
        console.log('   ✅ README_LOCAL.md creado');

        // 10. Verificación final
        console.log('\n🔍 Verificación final...');
        
        const requiredFiles = [
            'server.js',
            'public/index.html',
            '.env',
            'package.json',
            'bots',
            'uploads',
            'backups'
        ];
        
        let allGood = true;
        for (const file of requiredFiles) {
            if (await fs.pathExists(file)) {
                console.log(`   ✅ ${file}`);
            } else {
                console.log(`   ❌ ${file} - FALTANTE`);
                allGood = false;
            }
        }

        console.log('\n' + '='.repeat(50));
        
        if (allGood) {
            console.log('🎉 ¡Configuración completada exitosamente!');
            console.log('');
            console.log('📋 Siguientes pasos:');
            console.log('   1. Revisa la configuración en .env');
            console.log('   2. Ejecuta: npm run dev');
            console.log(`   3. Abre: http://localhost:${port}`);
            console.log('   4. ¡Crea tu primer bot!');
            console.log('');
            console.log('📖 Documentación completa en README_LOCAL.md');
            
            const startNow = await ask('\n¿Quieres iniciar el servidor ahora? (y/n): ');
            if (startNow.toLowerCase() === 'y' || startNow.toLowerCase() === 'yes') {
                console.log('\n🚀 Iniciando servidor...');
                const { spawn } = require('child_process');
                const server = spawn('npm', ['run', 'dev'], { 
                    stdio: 'inherit',
                    detached: false 
                });
            } else {
                console.log('\n✅ Para iniciar más tarde, ejecuta: npm run dev');
            }
        } else {
            console.log('❌ Configuración incompleta. Revisa los archivos faltantes.');
            process.exit(1);
        }

    } catch (error) {
        console.error('\n❌ Error durante la configuración:', error.message);
        process.exit(1);
    } finally {
        rl.close();
    }
}

// Ejecutar solo si es llamado directamente
if (require.main === module) {
    main();
}

module.exports = { main };