// server.js - Servidor de Gestión del Bot WhatsApp Multi-Cliente con MySQL
// Versión completa con todas las funcionalidades
const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');
const { spawn, exec } = require('child_process');
const WebSocket = require('ws');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const multer = require('multer');
const archiver = require('archiver');
require('dotenv').config();

//const generateBotFiles = require('./setup').generateBotFiles;
//const db = require('./db');
//const broadcastToClients = require('./ws').broadcastToClients;

// Importar módulo de base de datos
const db = require('./db/mysql');

const app = express();
const PORT = process.env.MANAGEMENT_PORT || 8080;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this';

// ==================== MIDDLEWARE ====================
app.use(cors({
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:8080', 'https://localhost:8080', 'http://127.0.0.1:8080'],
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/bots', express.static(path.join(__dirname, 'bots')));

// Servir archivos estáticos desde la carpeta public
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de almacenamiento para archivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, 'uploads');
        fs.ensureDirSync(uploadPath);
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage });

// ==================== VARIABLES GLOBALES ====================
let activeBots = new Map(); // Procesos de bots activos
let wss = null;
const serverStartTime = Date.now();

// ==================== FUNCIONES DE UTILIDAD ====================
function generateToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
}

function generateBotId() {
    return 'bot_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function broadcastToClients(data) {
    if (wss) {
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                try {
                    client.send(JSON.stringify(data));
                } catch (error) {
                    console.error('Error enviando mensaje WebSocket:', error);
                }
            }
        });
    }
}

function ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

// ==================== MIDDLEWARE DE VALIDACIÓN ====================
function validateBotConfig(req, res, next) {
    const { name, company, adminNumber } = req.body;

    if (!name || !company || !adminNumber) {
        return res.status(400).json({
            error: 'Campos requeridos: name, company, adminNumber'
        });
    }

    if (!/^521\d{10}$/.test(adminNumber)) {
        return res.status(400).json({
            error: 'Número de administrador debe tener formato 521XXXXXXXXXX'
        });
    }

    next();
}

// ==================== RUTAS PRINCIPALES ====================

// Ruta principal - servir index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        uptime: Date.now() - serverStartTime,
        timestamp: new Date().toISOString(),
        activeBots: activeBots.size,
        database: 'MySQL connected'
    });
});

// ==================== RUTAS DE GESTIÓN DE BOTS ====================

// Crear nuevo bot
app.post('/api/bots/create', validateBotConfig, async (req, res) => {
    try {
        const botConfig = {
            id: generateBotId(),
            token: req.body.token || generateToken(),
            name: req.body.name,
            company: req.body.company,
            plan: req.body.plan || 'emprendedor',
            adminNumber: req.body.adminNumber,
            commandPrefix: req.body.commandPrefix || '!',
            description: req.body.description || '',
            apiBaseUrl: req.body.apiBaseUrl || '',
            apiPassword: req.body.apiPassword || '',
            enableAI: req.body.enableAI || false,
            geminiApiKey: req.body.geminiApiKey || '',
            sessionTimeout: parseInt(req.body.sessionTimeout) || 15,
            defaultPause: parseInt(req.body.defaultPause) || 30,
            flows: req.body.flows || getDefaultFlows(),
            messages: req.body.messages || getDefaultMessages(),
            apis: req.body.apis || {},
            status: 'created',
            stats: {
                messages: 0,
                users: 0,
                uptime: 0
            }
        };

        // Verificar que el token sea único
        const existingBot = await db.getBotByToken(botConfig.token);
        if (existingBot) {
            botConfig.token = generateToken();
        }

        // Guardar en base de datos
        await db.createBot(botConfig);

        // Crear directorio del bot
        const botDir = path.join(__dirname, 'bots', botConfig.id);
        ensureDirectoryExists(botDir);

        // Generar archivos del bot
        await generateBotFiles(botConfig, botDir);

        await db.addLog('INFO', `Bot creado: ${botConfig.name} (${botConfig.id})`);

        // Broadcast actualización
        broadcastToClients({
            type: 'bot_created',
            botId: botConfig.id,
            bot: botConfig
        });

        res.json({
            success: true,
            bot: botConfig,
            message: 'Bot creado exitosamente'
        });
    } catch (error) {
        console.error('Error creando bot:', error);
        await db.addLog('ERROR', `Error creando bot: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
});

// Listar todos los bots
app.get('/api/bots', async (req, res) => {
    try {
        const bots = await db.getAllBots();

        // Procesar los datos para el frontend
        const botsFormatted = bots.map(bot => {
            // Parsear JSON fields
            let stats, flows, messages, apis;
            try {
                stats = typeof bot.stats === 'string' ? JSON.parse(bot.stats) : bot.stats;
                flows = typeof bot.flows === 'string' ? JSON.parse(bot.flows) : bot.flows;
                messages = typeof bot.messages === 'string' ? JSON.parse(bot.messages) : bot.messages;
                apis = typeof bot.apis === 'string' ? JSON.parse(bot.apis) : bot.apis;
            } catch (e) {
                stats = { messages: 0, users: 0, uptime: 0 };
                flows = [];
                messages = {};
                apis = {};
            }

            return {
                id: bot.id,
                name: bot.name,
                company: bot.company,
                plan: bot.plan,
                status: bot.status,
                createdAt: bot.created_at,
                lastActivity: bot.last_activity,
                stats: stats,
                token: bot.token,
                adminNumber: bot.admin_number,
                commandPrefix: bot.command_prefix,
                description: bot.description,
                apiBaseUrl: bot.api_base_url,
                apiPassword: bot.api_password,
                enableAI: bot.enable_ai,
                geminiApiKey: bot.gemini_api_key,
                sessionTimeout: bot.session_timeout,
                defaultPause: bot.default_pause,
                flows: flows,
                messages: messages,
                apis: apis
            };
        });

        res.json({ success: true, bots: botsFormatted });
    } catch (error) {
        console.error('Error obteniendo bots:', error);
        res.status(500).json({ error: error.message });
    }
});

// Obtener configuración de un bot específico
app.get('/api/bots/:botId', async (req, res) => {
    try {
        const bot = await db.getBotById(req.params.botId);
        if (!bot) {
            return res.status(404).json({ error: 'Bot no encontrado' });
        }

        // Procesar JSON fields
        let stats, flows, messages, apis;
        try {
            stats = typeof bot.stats === 'string' ? JSON.parse(bot.stats) : bot.stats;
            flows = typeof bot.flows === 'string' ? JSON.parse(bot.flows) : bot.flows;
            messages = typeof bot.messages === 'string' ? JSON.parse(bot.messages) : bot.messages;
            apis = typeof bot.apis === 'string' ? JSON.parse(bot.apis) : bot.apis;
        } catch (e) {
            stats = { messages: 0, users: 0, uptime: 0 };
            flows = [];
            messages = {};
            apis = {};
        }

        const botFormatted = {
            id: bot.id,
            name: bot.name,
            company: bot.company,
            plan: bot.plan,
            status: bot.status,
            createdAt: bot.created_at,
            lastActivity: bot.last_activity,
            stats: stats,
            token: bot.token,
            adminNumber: bot.admin_number,
            commandPrefix: bot.command_prefix,
            description: bot.description,
            apiBaseUrl: bot.api_base_url,
            apiPassword: bot.api_password,
            enableAI: bot.enable_ai,
            geminiApiKey: bot.gemini_api_key,
            sessionTimeout: bot.session_timeout,
            defaultPause: bot.default_pause,
            flows: flows,
            messages: messages,
            apis: apis
        };

        res.json({ success: true, bot: botFormatted });
    } catch (error) {
        console.error('Error obteniendo bot:', error);
        res.status(500).json({ error: error.message });
    }
});

// Actualizar configuración de bot
app.put('/api/bots/:botId', async (req, res) => {
    try {
        const botId = req.params.botId;
        const bot = await db.getBotById(botId);

        if (!bot) {
            return res.status(404).json({ error: 'Bot no encontrado' });
        }

        // Actualizar bot en base de datos
        const success = await db.updateBot(botId, req.body);

        if (success) {
            // Regenerar archivos si está desplegado
            if (bot.status === 'running') {
                const updatedBot = await db.getBotById(botId);
                const botDir = path.join(__dirname, 'bots', botId);
                await generateBotFiles(updatedBot, botDir);
            }

            await db.addLog('INFO', `Bot actualizado: ${bot.name} (${botId})`);

            // Obtener bot actualizado
            const updatedBot = await db.getBotById(botId);

            // Broadcast actualización
            broadcastToClients({
                type: 'bot_updated',
                botId: botId,
                bot: updatedBot
            });

            res.json({ success: true, bot: updatedBot });
        } else {
            res.status(500).json({ error: 'Error actualizando bot' });
        }
    } catch (error) {
        console.error('Error actualizando bot:', error);
        res.status(500).json({ error: error.message });
    }
});

// Eliminar bot
app.delete('/api/bots/:botId', async (req, res) => {
    try {
        const botId = req.params.botId;
        const bot = await db.getBotById(botId);

        if (!bot) {
            return res.status(404).json({ error: 'Bot no encontrado' });
        }

        // Detener bot si está corriendo
        if (activeBots.has(botId)) {
            stopBotProcess(botId);
        }

        // Eliminar archivos
        const botDir = path.join(__dirname, 'bots', botId);
        if (fs.existsSync(botDir)) {
            fs.removeSync(botDir);
        }

        // Eliminar de base de datos
        await db.deleteBot(botId);

        await db.addLog('INFO', `Bot eliminado: ${bot.name} (${botId})`);

        // Broadcast actualización
        broadcastToClients({
            type: 'bot_deleted',
            botId: botId
        });

        res.json({ success: true, message: 'Bot eliminado exitosamente' });
    } catch (error) {
        console.error('Error eliminando bot:', error);
        res.status(500).json({ error: error.message });
    }
});

// ==================== CONTROL DE BOTS ====================

// Agregar este endpoint a tu servidor Express
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: Date.now(),
        activeBots: activeBots.size
    });
});

// Endpoint mejorado para iniciar bot con mejor logging
app.post('/api/bots/:botId/start', async (req, res) => {
    try {
        const botId = req.params.botId;
        // ← usar el método correcto:
        const bot = await db.getBotById(botId);
        if (!bot) {
            return res.status(404).json({ error: 'Bot no encontrado' });
        }
        if (activeBots.has(botId)) {
            return res.status(400).json({ error: 'El bot ya está ejecutándose' });
        }
        await startBotProcess(botId, bot);
        res.json({ success: true, message: 'Bot iniciado exitosamente' });
    } catch (error) {
        console.error('Error iniciando bot:', error);
        res.status(500).json({ error: error.message });
    }
});


// Agregar middleware para capturar errores no manejados
app.use((error, req, res, next) => {
    console.error('Error no manejado en middleware:', error);
    console.error('Stack trace:', error.stack);

    if (!res.headersSent) {
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// Agregar endpoint para obtener logs del bot (útil para debugging)
app.get('/api/bots/:botId/logs', async (req, res) => {
    const { botId } = req.params;
    const { limit = 50 } = req.query;

    try {
        const logs = await db.getLogs(botId, parseInt(limit));
        res.json({ success: true, logs });
    } catch (error) {
        console.error(`Error obteniendo logs para ${botId}:`, error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Endpoint para obtener estado detallado del bot
app.get('/api/bots/:botId/status', async (req, res) => {
    const { botId } = req.params;

    try {
        const bot = await db.getBotById(botId);

        const isActive = activeBots.has(botId);
        const activeBot = activeBots.get(botId);

        res.json({
            success: true,
            bot: {
                ...bot,
                isActive,
                startTime: activeBot?.startTime,
                uptime: activeBot ? Date.now() - activeBot.startTime : 0
            }
        });
    } catch (error) {
        console.error(`Error obteniendo estado de ${botId}:`, error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Detener bot
app.post('/api/bots/:botId/stop', async (req, res) => {
    try {
        const botId = req.params.botId;

        if (!activeBots.has(botId)) {
            return res.status(400).json({ error: 'El bot no está ejecutándose' });
        }

        stopBotProcess(botId);

        res.json({ success: true, message: 'Bot detenido exitosamente' });
    } catch (error) {
        console.error('Error deteniendo bot:', error);
        res.status(500).json({ error: error.message });
    }
});

// Reiniciar bot
app.post('/api/bots/:botId/restart', async (req, res) => {
    try {
        const botId = req.params.botId;
        const bot = await db.getBotById(botId);

        if (!bot) {
            return res.status(404).json({ error: 'Bot no encontrado' });
        }

        if (activeBots.has(botId)) {
            stopBotProcess(botId);
            setTimeout(async () => {
                await startBotProcess(botId, bot);
            }, 2000);
        } else {
            await startBotProcess(botId, bot);
        }

        res.json({ success: true, message: 'Bot reiniciado exitosamente' });
    } catch (error) {
        console.error('Error reiniciando bot:', error);
        res.status(500).json({ error: error.message });
    }
});

// Agregar estos endpoints para debug
app.get('/api/debug/bot/:botId', async (req, res) => {
    const { botId } = req.params;

    try {
        const botDir = path.join(__dirname, 'bots', botId);
        const botFile = path.join(botDir, 'app.js');
        const nodeModulesPath = path.join(botDir, 'node_modules');

        const debug = {
            botId,
            botDir,
            botFile,
            nodeModulesPath,
            checks: {
                botDirExists: fs.existsSync(botDir),
                botFileExists: fs.existsSync(botFile),
                nodeModulesExists: fs.existsSync(nodeModulesPath),
                whatsappWebJsExists: fs.existsSync(path.join(nodeModulesPath, 'whatsapp-web.js')),
                canWriteBotDir: false,
                botFromDB: null,
                activeBotExists: activeBots.has(botId)
            }
        };

        // Verificar permisos de escritura
        try {
            fs.accessSync(botDir, fs.constants.W_OK);
            debug.checks.canWriteBotDir = true;
        } catch (err) {
            debug.checks.canWriteBotDir = `Error: ${err.message}`;
        }

        // Obtener bot de BD
        try {
            debug.checks.botFromDB = await db.getBotById(botId);

        } catch (err) {
            debug.checks.botFromDB = `Error: ${err.message}`;
        }

        // Lista de archivos en botDir
        if (debug.checks.botDirExists) {
            try {
                debug.botDirContents = fs.readdirSync(botDir);
            } catch (err) {
                debug.botDirContents = `Error: ${err.message}`;
            }
        }

        res.json({ success: true, debug });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            stack: error.stack
        });
    }
});

// Endpoint para verificar si generateBotFiles existe
app.get('/api/debug/functions', (req, res) => {
    try {
        const functionChecks = {
            generateBotFiles: typeof generateBotFiles,
            db: typeof db,
            dbMethods: db ? Object.keys(db) : 'db is undefined',
            activeBots: {
                type: typeof activeBots,
                size: activeBots ? activeBots.size : 'undefined',
                keys: activeBots ? Array.from(activeBots.keys()) : 'undefined'
            },
            __dirname,
            cwd: process.cwd()
        };

        res.json({ success: true, checks: functionChecks });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            stack: error.stack
        });
    }
});

// Endpoint para probar la conexión a BD
app.get('/api/debug/database', async (req, res) => {
    try {
        const dbTest = {
            dbExists: !!db,
            methods: db ? Object.keys(db) : null
        };

        if (db && typeof db.getBot === 'function') {
            // Intentar obtener algún bot para probar la conexión
            try {
                const testResult = await db.getAllBots();
                dbTest.getAllBotsResult = `Success: ${testResult ? testResult.length : 0} bots`;
            } catch (err) {
                dbTest.getAllBotsResult = `Error: ${err.message}`;
            }
        }

        res.json({ success: true, dbTest });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            stack: error.stack
        });
    }
});

// Wrapper de seguridad para las funciones críticas
function safeAsyncCall(fn, ...args) {
    return new Promise((resolve, reject) => {
        try {
            const result = fn(...args);
            if (result && typeof result.then === 'function') {
                result.then(resolve).catch(reject);
            } else {
                resolve(result);
            }
        } catch (error) {
            reject(error);
        }
    });
}

// Función para verificar dependencias antes de iniciar bot
async function verifyBotDependencies(botId, botConfig) {
    const errors = [];

    // Verificar configuración básica
    if (!botId) errors.push('botId es requerido');
    if (!botConfig) errors.push('botConfig es requerido');
    if (!botConfig.token) errors.push('token es requerido');

    // Verificar funciones necesarias
    if (typeof generateBotFiles !== 'function') {
        errors.push('generateBotFiles no está definida');
    }

    if (!db) {
        errors.push('db no está definido');
    } else {
        if (typeof db.addLog !== 'function') errors.push('db.addLog no existe');
        if (typeof db.updateBot !== 'function') errors.push('db.updateBot no existe');
        if (typeof db.getBot !== 'function') errors.push('db.getBot no existe');
    }

    if (!activeBots) {
        errors.push('activeBots no está definido');
    }

    if (typeof broadcastToClients !== 'function') {
        errors.push('broadcastToClients no está definida');
    }

    return errors;
}

// ==================== FUNCIONES DE CONTROL DE PROCESOS ====================

async function startBotProcess(botId, botConfig) {
    let botProcess = null;
    console.log(`[DEBUG] startBotProcess llamado con botId=${botId}, nombre=${botConfig.name}`);


    try {
        console.log(`[startBot] Iniciando bot ${botConfig.name || 'Sin nombre'} (${botId})`);

        // Validaciones iniciales
        if (!botId) {
            throw new Error('botId es requerido');
        }
        if (!botConfig) {
            throw new Error('botConfig es requerido');
        }
        if (!botConfig.name) {
            console.warn(`[startBot] Bot ${botId} no tiene nombre configurado`);
        }

        const botDir = path.join(__dirname, 'bots', botId);
        const botFile = path.join(botDir, 'app.js');
        const nodeModulesPath = path.join(botDir, 'node_modules', 'whatsapp-web.js');

        console.log(`[startBot] Directorio bot: ${botDir}`);
        console.log(`[startBot] Archivo bot: ${botFile}`);
        console.log(`[startBot] Node modules: ${nodeModulesPath}`);

        // 1. Verificar y crear directorio si no existe
        console.log(`[startBot] Verificando directorio...`);
        if (!fs.existsSync(botDir)) {
            console.log(`[startBot] Creando directorio para bot ${botId}`);
            try {
                fs.mkdirSync(botDir, { recursive: true });
            } catch (dirError) {
                throw new Error(`No se pudo crear directorio ${botDir}: ${dirError.message}`);
            }
        }

        // 2. Verificar permisos de escritura
        try {
            fs.accessSync(botDir, fs.constants.W_OK);
        } catch (permError) {
            throw new Error(`Sin permisos de escritura en ${botDir}: ${permError.message}`);
        }

        // 3. Regenerar archivos si faltan
        console.log(`[startBot] Verificando archivos...`);
        if (!fs.existsSync(botFile) || !fs.existsSync(nodeModulesPath)) {
            console.log(`[startBot] Regenerando archivos del bot ${botConfig.name || botId}`);
            try {
                await generateBotFiles(botConfig, botDir);
            } catch (genError) {
                throw new Error(`Error generando archivos: ${genError.message}`);
            }
        }

        // 4. Instalar dependencias de forma asíncrona con timeout
        if (!fs.existsSync(nodeModulesPath)) {
            try {
                console.log(`[startBot] Instalando dependencias para ${botConfig.name}`);
                await db.addLog('INFO', `Instalando dependencias para bot ${botId}`, botId);

                // Aquí llamas a la nueva función con un timeout de 2 minutos
                await installDependenciesWithTimeout(botDir, 120000);

                await db.addLog('INFO', `Dependencias instaladas para bot ${botId}`, botId);
                console.log(`[startBot] Dependencias instaladas correctamente`);
            } catch (installErr) {
                console.error(`[startBot] ❌ Error instalando dependencias: ${installErr.message}`);
                await db.addLog('ERROR', `Error instalando dependencias: ${installErr.message}`, botId);
                throw new Error(`Falló la instalación de dependencias: ${installErr.message}`);
            }
        }

        // 5. Verificar que app.js existe después de la generación
        if (!fs.existsSync(botFile)) {
            throw new Error(`Archivo app.js no encontrado en ${botFile} después de generación`);
        }

        // 6. Verificar que generateBotFiles existe y es una función
        if (typeof generateBotFiles !== 'function') {
            throw new Error('generateBotFiles no está definida o no es una función');
        }

        // 7. Loguear inicio
        console.log(`[startBot] Guardando log de inicio...`);
        try {
            await db.addLog('INFO', `Iniciando proceso del bot: ${botConfig.name || botId}`, botId);
        } catch (logError) {
            console.warn(`[startBot] No se pudo guardar log de inicio: ${logError.message}`);
        }

        // 8. Preparar variables de entorno
        console.log(`[startBot] Preparando variables de entorno...`);
        const env = {
            ...process.env,
            BOT_ID: botId,
            BOT_TOKEN: botConfig.token || '',
            ADMIN_PERSONAL_NUMBER: botConfig.admin_number || botConfig.adminNumber || '',
            COMMAND_PREFIX: botConfig.command_prefix || botConfig.commandPrefix || '!',
            API_PASSWORD: botConfig.api_password || botConfig.apiPassword || '',
            GOOGLE_API_KEY: botConfig.gemini_api_key || botConfig.geminiApiKey || '',
            API_BASE_URL: botConfig.api_base_url || botConfig.apiBaseUrl || '',
            BOT_PORT: 3000 + (parseInt(botId.split('_')[1], 10) % 1000),
        };

        console.log(`[startBot] Puerto asignado: ${env.BOT_PORT}`);

        // 9. Verificar que Node.js está disponible
        try {
            const { execSync } = require('child_process');
            execSync('node --version', { timeout: 5000 });
        } catch (nodeError) {
            throw new Error(`Node.js no está disponible: ${nodeError.message}`);
        }

        // 7. Lanzar el child process con timeout
        botProcess = spawn('node', ['app.js'], {
            cwd: botDir,
            stdio: ['pipe', 'pipe', 'pipe'],
            env,
            detached: false
        });

        // 8. Configurar timeout para el inicio del proceso
        const startupTimeout = setTimeout(() => {
            if (botProcess && !botProcess.killed) {
                console.error(`[setup] ❌ Timeout iniciando bot ${botId}`);
                botProcess.kill('SIGTERM');
            }
        }, 30000); // 30 segundos timeout

        // 9. Capturar errores en el spawn
        botProcess.on('error', async (err) => {
            clearTimeout(startupTimeout);
            console.error(`[setup] ❌ Error en proceso de bot ${botId}:`, err);
            try {
                await db.addLog('ERROR', `Error en proceso del bot: ${err.message}`, botId);
                await db.updateBot(botId, { status: 'error' });
            } catch (logErr) {
                console.error('Error guardando log:', logErr);
            }
        });

        // 10. Logs de salida del bot
        botProcess.stdout.on('data', data => {
            const msg = data.toString().trim();
            if (msg) {
                broadcastToClients({
                    type: 'log',
                    botId,
                    message: msg,
                    level: 'info'
                });
            }
        });

        botProcess.stderr.on('data', data => {
            const msg = data.toString().trim();
            if (msg) {
                broadcastToClients({
                    type: 'log',
                    botId,
                    message: msg,
                    level: 'error'
                });
            }
        });

        // 11. Logs de error del bot
        botProcess.stderr.on('data', async (data) => {
            const errMsg = data.toString().trim();
            if (errMsg) {
                console.error(`[STDERR:${botId}] ${errMsg}`);
                try {
                    await db.addLog('ERROR', `${errMsg}`, botId);
                } catch (err) {
                    console.error(`Error guardando stderr log:`, err);
                }
            }
        });

        // 12. Manejo de cierre del proceso
        botProcess.on('close', async (code, signal) => {
            clearTimeout(startupTimeout);
            console.log(`[setup] Proceso bot ${botId} cerrado. Código: ${code}, Señal: ${signal}`);

            try {
                await db.addLog('INFO', `Proceso finalizado con código ${code}${signal ? `, señal: ${signal}` : ''}`, botId);
                await db.updateBot(botId, { status: 'stopped' });
            } catch (err) {
                console.error(`Error actualizando estado de bot ${botId}:`, err);
            }

            activeBots.delete(botId);
            broadcastToClients({ type: 'bot_status', botId, status: 'stopped' });
        });

        // 13. Manejo de salida del proceso
        botProcess.on('exit', (code, signal) => {
            clearTimeout(startupTimeout);
            console.log(`[setup] Bot ${botId} salió. Código: ${code}, Señal: ${signal}`);
        });

        // 14. Guardar en el mapa de procesos activos
        activeBots.set(botId, {
            process: botProcess,
            startTime: Date.now(),
            config: botConfig
        });

        // 15. Actualizar estado en BD y notificar clientes
        await db.updateBot(botId, { status: 'starting' });
        broadcastToClients({ type: 'bot_status', botId, status: 'starting' });

        // 16. Esperar un poco para confirmar que el proceso inició correctamente
        await new Promise(resolve => setTimeout(resolve, 2000));

        if (botProcess && !botProcess.killed) {
            clearTimeout(startupTimeout);
            await db.updateBot(botId, { status: 'running' });
            broadcastToClients({ type: 'bot_status', botId, status: 'running' });
            console.log(`[setup] ✅ Bot ${botId} iniciado correctamente`);
        }

    } catch (error) {
        console.error(`❌ Error crítico al iniciar bot ${botId}:`, error);

        // Limpiar proceso si existe
        if (botProcess && !botProcess.killed) {
            try {
                botProcess.kill('SIGTERM');
            } catch (killErr) {
                console.error('Error matando proceso:', killErr);
            }
        }

        // Actualizar estado y logs
        try {
            await db.addLog('ERROR', `Error iniciando bot: ${error.message}`, botId);
            await db.updateBot(botId, { status: 'error' });
            broadcastToClients({ type: 'bot_status', botId, status: 'error' });
        } catch (logErr) {
            console.error('Error guardando log de error:', logErr);
        }

        // Limpiar del mapa
        activeBots.delete(botId);

        throw error;
    }
}

// Función auxiliar para instalar dependencias con timeout
function installDependenciesWithTimeout(botDir, timeoutMs) {
    return new Promise((resolve, reject) => {
        const child = spawn(
            'npm',
            ['install', 'whatsapp-web.js', 'qrcode-terminal', 'qrcode', 'axios', 'fs-extra', 'express', 'dotenv', 'puppeteer'],
            { cwd: botDir, shell: true, stdio: 'inherit' }
        );

        const timer = setTimeout(() => {
            child.kill();
            reject(new Error('Timeout instalando dependencias'));
        }, timeoutMs);

        child.on('error', err => {
            clearTimeout(timer);
            reject(err);
        });
        child.on('exit', code => {
            clearTimeout(timer);
            if (code === 0) resolve();
            else reject(new Error(`npm install salió con código ${code}`));
        });
    });
}



async function stopBotProcess(botId) {
    const botInfo = activeBots.get(botId);
    if (!botInfo) {
        throw new Error('Bot no está ejecutándose');
    }

    // 1. Log en BD protegido
    try {
        await db.addLog('INFO', `Deteniendo proceso del bot`, botId);
    } catch (logErr) {
        console.error(`No se pudo guardar log de detención para ${botId}:`, logErr);
    }

    // 2. Capturar errores al matar el proceso
    botInfo.process.on('error', err => {
        console.error(`[setup] ❌ Error al detener bot ${botId}:`, err);
        db.addLog('ERROR', `Error al detener proceso: ${err.message}`, botId)
            .catch(e => console.error('No se pudo guardar log de error de kill:', e));
    });

    // 3. Enviar señal de terminación
    botInfo.process.kill('SIGTERM');

    // 4. Forzar terminación tras 5s si aún sigue activo
    setTimeout(() => {
        if (activeBots.has(botId)) {
            botInfo.process.kill('SIGKILL');
        }
    }, 5000);
}



// ==================== RUTAS DE ANALÍTICAS ====================

app.get('/api/analytics/dashboard', async (req, res) => {
    try {
        const stats = await db.getDashboardStats();

        res.json({
            success: true,
            stats: {
                totalBots: stats.totalBots,
                activeBots: stats.activeBots,
                totalMessages: stats.totalMessages,
                totalRevenue: stats.totalRevenue,
                uptime: Date.now() - serverStartTime
            }
        });
    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        res.status(500).json({ error: error.message });
    }
});

// ==================== RUTAS DE LOGS ====================

app.get('/api/logs', async (req, res) => {
    try {
        const { botId, level, limit = 100 } = req.query;
        const logs = await db.getLogs({ botId, level }, parseInt(limit));

        res.json({ success: true, logs });
    } catch (error) {
        console.error('Error obteniendo logs:', error);
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/logs', async (req, res) => {
    try {
        await db.clearLogs();
        await db.addLog('INFO', 'Logs limpiados desde la interfaz');
        res.json({ success: true, message: 'Logs limpiados exitosamente' });
    } catch (error) {
        console.error('Error limpiando logs:', error);
        res.status(500).json({ error: error.message });
    }
});

// ==================== RUTAS DE DESCARGA ====================

app.get('/api/bots/:botId/download', async (req, res) => {
    try {
        const bot = await db.getBotById(req.params.botId);
        if (!bot) {
            return res.status(404).json({ error: 'Bot no encontrado' });
        }

        const botDir = path.join(__dirname, 'bots', req.params.botId);

        if (!fs.existsSync(botDir)) {
            return res.status(404).json({ error: 'Archivos del bot no encontrados' });
        }

        // Crear ZIP con archivos del bot
        const archive = archiver('zip', { zlib: { level: 9 } });

        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${bot.name.replace(/\s+/g, '_')}_bot.zip"`);

        archive.pipe(res);
        archive.directory(botDir, false);
        archive.finalize();

    } catch (error) {
        console.error('Error descargando bot:', error);
        res.status(500).json({ error: error.message });
    }
});

// ==================== RUTAS PARA BOTS INDIVIDUALES ====================

// Ruta para acceso directo a bots por token
app.get('/bot/:token', async (req, res) => {
    const token = req.params.token;
    const bot = await db.getBotByToken(token);

    if (!bot) {
        return res.status(404).json({ error: 'Bot no encontrado' });
    }

    res.json({
        botName: bot.name,
        company: bot.company,
        plan: bot.plan,
        status: bot.status,
        message: `Bot de ${bot.company} funcionando correctamente`,
        instructions: 'Escanea el código QR con WhatsApp para conectar'
    });
});

// ==================== WEBSOCKET ====================

const server = require('http').createServer(app);
wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    console.log('Nueva conexión WebSocket establecida');

    // Enviar estado inicial
    ws.send(JSON.stringify({
        type: 'connected',
        timestamp: new Date().toISOString(),
        activeBots: activeBots.size
    }));

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            console.log('Mensaje WebSocket recibido:', data);
        } catch (error) {
            console.error('Error procesando mensaje WebSocket:', error);
        }
    });

    ws.on('close', () => {
        console.log('Conexión WebSocket cerrada');
    });
});

// ==================== FUNCIONES DE UTILIDAD ====================

function getDefaultFlows() {
    return [
        {
            name: 'MENU_PRINCIPAL',
            description: 'Menú principal del bot',
            steps: ['INITIAL', 'AWAITING_CHOICE'],
            options: [
                { number: 1, text: 'Información y Servicios', action: 'info' },
                { number: 2, text: 'Consultar Estado', action: 'status' },
                { number: 3, text: 'Hablar con Asesor', action: 'human' },
                { number: 4, text: 'Acerca de Nosotros', action: 'about' },
                { number: 5, text: 'Salir', action: 'exit' }
            ]
        }
    ];
}

function getDefaultMessages() {
    return {
        greetings: {
            morning: '¡Buenos días! 🌅 ¿Cómo puedo ayudarte hoy?',
            afternoon: '¡Buenas tardes! 🌞 ¿En qué puedo asistirte?',
            evening: '¡Buenas noches! 🌙 ¿Cómo puedo ayudarte?',
            newUser: '¡Hola! Veo que es tu primera vez aquí. Te explico brevemente cómo funciono...'
        },
        errors: {
            invalidOption: '❌ Opción no válida. Por favor, selecciona una opción del menú.',
            apiError: '😔 Ups, algo salió mal. Por favor, intenta de nuevo en unos momentos.',
            outsideHours: '🕐 Estamos fuera de horario de atención.',
            userPaused: '⏸️ El asistente está pausado. Escribe "reactivar" para continuar.'
        },
        confirmations: {
            dataSaved: '✅ Información guardada correctamente.',
            processComplete: '🎉 ¡Proceso completado exitosamente!',
            waitingResponse: '⏳ Procesando tu solicitud, por favor espera...',
            goodbye: '👋 ¡Gracias por contactarnos! Que tengas un excelente día.'
        }
    };
}

// ==================== GENERACIÓN DE CÓDIGO ====================

async function generateBotFiles(botConfig, botDir) {
    try {
        ensureDirectoryExists(botDir);

        // Parseo de estructuras
        let flows, messages, apis;
        try {
            flows = typeof botConfig.flows === 'string' ? JSON.parse(botConfig.flows) : botConfig.flows;
            messages = typeof botConfig.messages === 'string' ? JSON.parse(botConfig.messages) : botConfig.messages;
            apis = typeof botConfig.apis === 'string' ? JSON.parse(botConfig.apis) : botConfig.apis;
        } catch (e) {
            flows = getDefaultFlows();
            messages = getDefaultMessages();
            apis = {};
        }

        // app.js
        const appCode = generateAppJS({
            ...botConfig,
            flows,
            messages,
            apis
        });
        await fs.writeFile(path.join(botDir, 'app.js'), appCode);

        // package.json
        const packageJson = generatePackageJSON(botConfig);
        await fs.writeFile(path.join(botDir, 'package.json'), JSON.stringify(packageJson, null, 2));

        // .env
        const envContent = generateEnvFile(botConfig);
        await fs.writeFile(path.join(botDir, '.env'), envContent);

        // config.json
        const configJson = {
            botId: botConfig.id,
            name: botConfig.name,
            company: botConfig.company,
            plan: botConfig.plan,
            flows,
            messages,
            apis
        };
        await fs.writeFile(path.join(botDir, 'config.json'), JSON.stringify(configJson, null, 2));

        await db.addLog('INFO', `Archivos generados para bot: ${botConfig.name}`, botConfig.id);

    } catch (error) {
        console.error(`[generateBotFiles] ❌ Error generando archivos: ${error.message}`);
        await db.addLog('ERROR', `Error generando archivos del bot: ${error.message}`, botConfig?.id || 'desconocido');
        throw error;
    }
}


function generateAppJS(config) {
    return `// Bot de WhatsApp generado automáticamente
// Empresa: ${config.company}
// Plan: ${config.plan}
// Generado el: ${new Date().toLocaleString()}

const path = require('path');

// Directorio base de tus módulos instalados
const modulesDir = path.join(__dirname, 'modules', 'node_modules');

// Cargar cada paquete desde ese directorio
const { Client, LocalAuth, MessageMedia } = require(path.join(modulesDir, 'whatsapp-web.js'));
const qrcode = require(path.join(modulesDir, 'qrcode-terminal'));
const axios = require(path.join(modulesDir, 'axios'));
const fs = require(path.join(modulesDir, 'fs-extra'));
const express = require(path.join(modulesDir, 'express'));
const cors = require(path.join(modulesDir, 'cors'));
const express = require(path.join(modulesDir, 'express'); // <--- NUEVO: Para el servidor API
const bodyParser = require(path.join(modulesDir, 'body-parser')); // <--- NUEVO: Para parsear el cuerpo de las solicitudes POST

require('dotenv').config();  // puedes dejar dotenv en default, o si lo instalaste ahí también:
const appExpress = express();

// Configuración del bot
const BOT_ID = process.env.BOT_ID || '${config.id}';
const BOT_TOKEN = process.env.BOT_TOKEN || '${config.token}';
const ADMIN_PERSONAL_NUMBER = process.env.ADMIN_PERSONAL_NUMBER || '${config.admin_number || config.adminNumber}';
const COMMAND_PREFIX = process.env.COMMAND_PREFIX || '${config.command_prefix || config.commandPrefix}';
const SESSION_TIMEOUT = ${config.session_timeout || config.sessionTimeout || 15} * 60 * 1000;
const DEFAULT_PAUSE_DURATION = ${config.default_pause || config.defaultPause || 30};
const ENABLE_AI = ${config.enable_ai || config.enableAI || false};
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || '${config.gemini_api_key || config.geminiApiKey || ''}';

// URLs de API
const API_BASE_URL = process.env.API_BASE_URL || '${config.api_base_url || config.apiBaseUrl || ''}';
const API_PASSWORD = process.env.API_PASSWORD || '${config.api_password || config.apiPassword || ''}';

// Variables de estado
let isBotOperational = false;
let botStartTime = Date.now();
let messagesProcessed = 0;

// Mensajes personalizados
const MESSAGES = ${JSON.stringify(config.messages, null, 2)};

// Configuración de flujos
const FLOWS = ${JSON.stringify(config.flows, null, 2)};

// Clase de gestión de sesiones
class SessionManager {
    constructor() {
        this.sessions = new Map();
        this.sessionTimeout = SESSION_TIMEOUT;
        this.startCleanupInterval();
    }

    startCleanupInterval() {
        setInterval(() => this.cleanupExpiredSessions(), 5 * 60 * 1000);
    }

    cleanupExpiredSessions() {
        const now = Date.now();
        let cleanedCount = 0;
        for (const [userId, session] of this.sessions.entries()) {
            if (now - session.lastInteraction > this.sessionTimeout) {
                this.sessions.delete(userId);
                cleanedCount++;
            }
        }
        if (cleanedCount > 0) {
            console.log(\`[SessionManager] Limpiadas \${cleanedCount} sesiones inactivas.\`);
        }
    }

    getSession(userId) {
        if (!this.sessions.has(userId)) {
            return this.createSession(userId);
        }
        const session = this.sessions.get(userId);
        session.lastInteraction = Date.now();
        return session;
    }

    createSession(userId) {
        const session = {
            userId,
            currentFlow: 'MENU_PRINCIPAL',
            step: 'INITIAL',
            context: {},
            lastInteraction: Date.now(),
            retryCount: 0,
        };
        this.sessions.set(userId, session);
        console.log(\`[SessionManager] Nueva sesión creada para: \${userId}\`);
        return session;
    }

    updateSession(userId, updates) {
        if (!this.sessions.has(userId)) {
            this.createSession(userId);
        }
        const session = this.sessions.get(userId);
        Object.assign(session, updates);
        session.lastInteraction = Date.now();
        return session;
    }

    deleteSession(userId) {
        this.sessions.delete(userId);
        console.log(\`[SessionManager] Sesión eliminada para: \${userId}\`);
    }
}

const sessionManager = new SessionManager();

// Cliente de WhatsApp
const client = new Client({
authStrategy: new LocalAuth({ 
        dataPath: 'whatsapp_session'    }),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process', // Desaconsejado en Windows pero útil en servidores
            '--disable-gpu'
        ],
    },
    // Opciones adicionales para mejorar la estabilidad en servidores
    // clientVersion: '2.2412.54', // Puedes fijar una versión de WWeb si es necesario
    // userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36'
});

// 1) QR: en terminal y en archivo PNG + reporte al servidor
client.on('qr', async qr => {
  console.log('[QR] Código QR recibido para ${config.name}:');
  qrcode.generate(qr, { small: true });

  try {
    // Generar imagen PNG en el directorio del bot
    const imagePath = path.resolve(__dirname, 'qr.png');
    await QRCodeImage.toFile(imagePath, qr, {
      color: { dark: '#000000', light: '#FFFFFF' },
      width: 300,
      margin: 2
    });
    
    console.log(\`[QR] Imagen guardada en: \${imagePath}\`);
    
    // **REPORTAR AL SERVIDOR PRINCIPAL**
    await reportEventToServer('qr', { 
      qrString: qr, 
      imagePath: imagePath,
      timestamp: new Date().toISOString()
    });
    
  } catch (err) {
    console.error('[QR] ❌ Error generando imagen QR:', err);
  }
});

client.on('authenticated', () => {
    console.log('[Auth] ${config.name} autenticado exitosamente!');
});

client.on('ready', () => {
    console.log('[Ready] ${config.name} está listo y operativo!');
    isBotOperational = true;
    
    // Notificar al administrador
    client.sendMessage(ADMIN_PERSONAL_NUMBER + '@c.us', 
        \`✅ Bot *${config.name}* inicializado correctamente.\\n\\n🌐 *URL del Bot:* https://localhost/\${BOT_TOKEN}\\n\\nEnvía \${COMMAND_PREFIX}start para activar el procesamiento de mensajes.\`
    ).catch(err => console.error('Error enviando notificación al admin:', err));
});
appExpress.use(bodyParser.json()); // Para parsear JSON en el cuerpo de la solicitud
appExpress.use(bodyParser.urlencoded({ extended: true })); // Para parsear cuerpos URL-encoded
client.on('message', async msg => {
    if (!isBotOperational) return;
    
    const contactId = msg.from;
    const messageBody = msg.body.trim();
    const senderName = msg.notifyName || contactId.replace('@c.us', '');
    
    // Verificar si es mensaje del administrador
    const isAdminMessage = contactId === (ADMIN_PERSONAL_NUMBER + '@c.us');
    
    messagesProcessed++;
    console.log(\`[Message] De: \${senderName}, Mensaje: "\${messageBody}"\`);
    
    // Comandos de administrador
    if (isAdminMessage && messageBody.startsWith(COMMAND_PREFIX)) {
        await handleAdminCommands(msg, messageBody);
        return;
    }
    
    // Procesar mensaje de usuario
    const session = sessionManager.getSession(contactId);
    
    try {
        switch (session.currentFlow) {
            case 'MENU_PRINCIPAL':
                await handleMenuPrincipal(msg, session, senderName);
                break;
            default:
                console.warn(\`Flujo desconocido: \${session.currentFlow}\`);
                sessionManager.updateSession(contactId, { currentFlow: 'MENU_PRINCIPAL', step: 'INITIAL' });
                await handleMenuPrincipal(msg, session, senderName);
        }
    } catch (error) {
        console.error(\`Error procesando mensaje de \${contactId}:\`, error);
        await sendMessage(contactId, MESSAGES.errors?.apiError || "Error procesando tu mensaje.");
    }
});

// Función para enviar mensajes con typing
async function sendTypingAndMessage(chatId, originalMsg, content, typingDuration = 1500) {
    try {
        const chat = await originalMsg.getChat();
        await chat.sendStateTyping();
        
        if (typingDuration > 0) {
            await new Promise(resolve => setTimeout(resolve, typingDuration));
        }
        
        await client.sendMessage(chatId, content);
        await chat.clearState();
    } catch (error) {
        console.error(\`Error enviando mensaje a \${chatId}:\`, error);
    }
}

// Función simple para enviar mensajes
async function sendMessage(chatId, content) {
    try {
        await client.sendMessage(chatId, content);
    } catch (error) {
        console.error(\`Error enviando mensaje a \${chatId}:\`, error);
    }
}

// Obtener mensaje personalizado basado en hora
function getTimeBasedGreeting() {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) {
        return MESSAGES.greetings?.morning || '¡Buenos días!';
    } else if (hour >= 12 && hour < 18) {
        return MESSAGES.greetings?.afternoon || '¡Buenas tardes!';
    } else {
        return MESSAGES.greetings?.evening || '¡Buenas noches!';
    }
}

// Manejador del menú principal
async function handleMenuPrincipal(msg, session, senderName) {
    const contactId = msg.from;
    const messageBody = msg.body.trim();
    
    if (session.step === 'INITIAL') {
        const greeting = getTimeBasedGreeting();
        
        const welcomeMessage = \`\${greeting} \${senderName}! 

Soy el asistente virtual de *${config.company}*.

¿En qué puedo ayudarte hoy? 😊

1️⃣ Información y Servicios
2️⃣ Consultar Estado
3️⃣ Hablar con Asesor
4️⃣ Acerca de Nosotros
5️⃣ Salir

Escribe el número de tu elección:\`;

        await sendTypingAndMessage(contactId, msg, welcomeMessage, 1200);
        sessionManager.updateSession(contactId, { step: 'AWAITING_CHOICE' });
        
    } else if (session.step === 'AWAITING_CHOICE') {
        const choice = parseInt(messageBody, 10);
        
        switch (choice) {
            case 1:
                await sendMessage(contactId, "📋 *Nuestros Servicios:*\\n\\nContáctanos para más información sobre nuestros servicios especializados.\\n\\n¿Te gustaría conocer más detalles?");
                sessionManager.updateSession(contactId, { step: 'INITIAL' });
                break;
            case 2:
                await sendMessage(contactId, "🔍 Para consultar el estado de tu servicio, por favor proporciona tu número de folio o contacta directamente con nuestro equipo.\\n\\n¿En qué más puedo ayudarte?");
                sessionManager.updateSession(contactId, { step: 'INITIAL' });
                break;
            case 3:
                await sendMessage(contactId, "👨‍💼 Un asesor se pondrá en contacto contigo pronto. ¡Gracias por tu paciencia!\\n\\nMientras tanto, ¿hay algo más en lo que pueda ayudarte?");
                sessionManager.updateSession(contactId, { step: 'INITIAL' });
                break;
            case 4:
                await sendMessage(contactId, \`ℹ️ *Acerca de ${config.company}*\\n\\n\${config.description || 'Somos una empresa comprometida con brindar el mejor servicio a nuestros clientes.'}\\n\\n¿Tienes alguna pregunta específica?\`);
                sessionManager.updateSession(contactId, { step: 'INITIAL' });
                break;
            case 5:
                await sendMessage(contactId, MESSAGES.confirmations?.goodbye || "¡Gracias por contactarnos! Que tengas un excelente día. 👋");
                sessionManager.deleteSession(contactId);
                break;
            default:
                await sendMessage(contactId, MESSAGES.errors?.invalidOption || "❌ Opción no válida. Por favor, selecciona un número del menú.");
                break;
        }
    }
}

// Manejador de comandos de administrador
async function handleAdminCommands(msg, messageBody) {
    const command = messageBody.slice(COMMAND_PREFIX.length).trim().toLowerCase();
    const contactId = msg.from;
    
    switch (command) {
        case 'start':
            isBotOperational = true;
            await sendMessage(contactId, "✅ Bot *${config.name}* activado correctamente!\\n\\n🌐 URL: https://localhost/" + BOT_TOKEN);
            break;
        case 'stop':
            isBotOperational = false;
            await sendMessage(contactId, "⏹️ Bot *${config.name}* pausado correctamente!");
            break;
        case 'stats':
            const uptime = Date.now() - botStartTime;
            const uptimeFormatted = formatUptime(uptime);
            const stats = \`📊 *Estadísticas del Bot ${config.name}:*\\n\\n⏰ Uptime: \${uptimeFormatted}\\n📨 Mensajes procesados: \${messagesProcessed}\\n👥 Sesiones activas: \${sessionManager.sessions.size}\\n📱 Estado: \${isBotOperational ? 'Activo' : 'Pausado'}\\n📋 Plan: ${config.plan}\\n🌐 URL: https://localhost/\${BOT_TOKEN}\`;
            await sendMessage(contactId, stats);
            break;
        case 'url':
            await sendMessage(contactId, \`🌐 *URL del Bot:*\\nhttps://localhost/\${BOT_TOKEN}\\n\\nComparte esta URL con tus clientes para que puedan acceder al bot.\`);
            break;
        case 'help':
            await sendMessage(contactId, \`🤖 *Comandos disponibles para ${config.name}:*\\n\\n\${COMMAND_PREFIX}start - Activar bot\\n\${COMMAND_PREFIX}stop - Pausar bot\\n\${COMMAND_PREFIX}stats - Ver estadísticas\\n\${COMMAND_PREFIX}url - Obtener URL del bot\\n\${COMMAND_PREFIX}help - Esta ayuda\`);
            break;
        default:
            await sendMessage(contactId, \`❌ Comando no reconocido. Envía \${COMMAND_PREFIX}help para ver comandos disponibles.\`);
    }
}

// Función para formatear uptime
function formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    const sec = seconds % 60;
    const min = minutes % 60;
    const hr = hours % 24;
    
    if (days > 0) return \`\${days}d \${hr}h \${min}m \${sec}s\`;
    if (hr > 0) return \`\${hr}h \${min}m \${sec}s\`;
    if (min > 0) return \`\${min}m \${sec}s\`;
    return \`\${sec}s\`;
}

// Servidor Express para API del bot
const app = express();
app.use(cors());
app.use(express.json());

// Endpoint público del bot (acceso directo por token)
app.get('/', (req, res) => {
    res.json({
        botName: '${config.name}',
        company: '${config.company}',
        plan: '${config.plan}',
        status: isBotOperational ? 'active' : 'inactive',
        uptime: Date.now() - botStartTime,
        qrRequired: !client.info,
        message: 'Bot de WhatsApp funcionando correctamente'
    });
});

// Endpoint para enviar mensajes
app.post('/api/send-message', async (req, res) => {
    const { number, message } = req.body;
    
    if (!number || !message) {
        return res.status(400).json({ error: 'Faltan parámetros requeridos' });
    }
    
    try {
        const chatId = number.includes('@c.us') ? number : \`\${number}@c.us\`;
        await client.sendMessage(chatId, message);
        res.json({ success: true, message: 'Mensaje enviado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Endpoint para obtener estado del bot
app.get('/api/status', (req, res) => {
    res.json({
        botId: BOT_ID,
        name: '${config.name}',
        company: '${config.company}',
        operational: isBotOperational,
        uptime: Date.now() - botStartTime,
        messages: messagesProcessed,
        sessions: sessionManager.sessions.size,
        plan: '${config.plan}',
        url: \`https://localhost/\${BOT_TOKEN}\`
    });
});

// Inicializar bot
console.log('='.repeat(50));
console.log(\`Iniciando \${BOT_ID} - ${config.name}\`);
console.log(\`Empresa: ${config.company}\`);
console.log(\`Plan: ${config.plan}\`);
console.log(\`URL: https://localhost/\${BOT_TOKEN}\`);
console.log('='.repeat(50));

client.initialize();

// Inicializar servidor API del bot
const BOT_PORT = process.env.BOT_PORT || (3000 + parseInt(BOT_ID.split('_')[1]) % 1000);
app.listen(BOT_PORT, () => {
    console.log(\`[Server] API del bot corriendo en puerto \${BOT_PORT}\`);
    console.log(\`[Server] Acceso directo: http://localhost:\${BOT_PORT}\`);
});

// Manejo de cierre adecuado
process.on('SIGINT', async () => {
    console.log("\\n[Shutdown] Cerrando ${config.name}...");
    if (client) {
        await client.destroy().catch(e => console.error("Error al destruir cliente:", e));
    }
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log("\\n[Shutdown] Cerrando ${config.name}...");
    if (client) {
        await client.destroy().catch(e => console.error("Error al destruir cliente:", e));
    }
    process.exit(0);
});`;
}

function generatePackageJSON(config) {
    return {
        "name": `whatsapp-bot-${config.id}`,
        "version": "1.0.0",
        "description": `Bot de WhatsApp para ${config.company}`,
        "main": "app.js",
        "scripts": {
            "start": "node app.js",
            "dev": "nodemon app.js"
        },
        "dependencies": {
            "whatsapp-web.js": "^1.23.0",
            "qrcode": "^1.5.4",
            "qrcode-terminal": "^0.12.0",
            "axios": "^1.6.0",
            "express": "^4.18.0",
            "cors": "^2.8.5",
            "fs-extra": "^11.0.0",
            "dotenv": "^16.0.0"
        },
        "keywords": ["whatsapp", "bot", "automation", config.company?.toLowerCase()],
        "author": "Bot Generator",
        "license": "MIT"
    };
}

function generateEnvFile(config) {
    return `# Configuración del Bot - ${config.company}
# Generado automáticamente el ${new Date().toLocaleString()}

# Configuración básica
BOT_ID=${config.id}
BOT_TOKEN=${config.token}
ADMIN_PERSONAL_NUMBER=${config.admin_number || config.adminNumber}
COMMAND_PREFIX=${config.command_prefix || config.commandPrefix}
API_PASSWORD=${config.api_password || config.apiPassword}

# Google Gemini AI
GOOGLE_API_KEY=${config.gemini_api_key || config.geminiApiKey}

# URLs de API
API_BASE_URL=${config.api_base_url || config.apiBaseUrl}

# Configuraciones de tiempo
SESSION_TIMEOUT=${config.session_timeout || config.sessionTimeout}
DEFAULT_PAUSE_DURATION=${config.default_pause || config.defaultPause}

# Funciones habilitadas
ENABLE_AI=${config.enable_ai || config.enableAI}

# Información del bot
BOT_NAME="${config.name}"
COMPANY_NAME="${config.company}"
PLAN="${config.plan}"

# Puerto del bot (se asigna automáticamente)
BOT_PORT=3000`;
}

// ==================== INICIALIZACIÓN ====================

// Crear directorios necesarios
ensureDirectoryExists(path.join(__dirname, 'bots'));
ensureDirectoryExists(path.join(__dirname, 'uploads'));
ensureDirectoryExists(path.join(__dirname, 'backups'));
ensureDirectoryExists(path.join(__dirname, 'public'));

// Inicializar servidor
async function startServer() {
    try {
        // Inicializar base de datos
        const dbConnected = await db.initDatabase();
        if (!dbConnected) {
            console.error('❌ No se pudo conectar a la base de datos');
            process.exit(1);
        }

        server.listen(PORT, () => {
            console.log('='.repeat(60));
            console.log(`🚀 Servidor de gestión iniciado en puerto ${PORT}`);
            console.log(`📁 Interfaz web: http://localhost:${PORT}`);
            console.log(`🔗 WebSocket: ws://localhost:${PORT}`);
            console.log(`📂 Directorio de bots: ${path.join(__dirname, 'bots')}`);
            console.log(`🗄️ Base de datos: MySQL conectada`);
            console.log('='.repeat(60));

            db.addLog('INFO', `Servidor de gestión iniciado en puerto ${PORT}`);
        });
    } catch (error) {
        console.error('Error iniciando servidor:', error);
        process.exit(1);
    }
}

// Manejo de cierre adecuado
process.on('SIGINT', async () => {
    console.log('\n[Shutdown] Cerrando servidor de gestión...');

    // Detener todos los bots activos
    for (const [botId, botInfo] of activeBots) {
        console.log(`Deteniendo bot: ${botId}`);
        botInfo.process.kill('SIGTERM');
    }

    process.exit(0);
});

process.on('uncaughtException', (error) => {
    console.error('Error no capturado:', error);
    db.addLog('ERROR', `Error no capturado: ${error.message}`);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Promesa rechazada no manejada:', reason);
    db.addLog('ERROR', `Promesa rechazada: ${reason}`);
});

// Iniciar el servidor
startServer();

module.exports = app;