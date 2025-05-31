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


// ==================== MIDDLEWARE DE AUTENTICACIÓN ====================
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.status(401).json({ error: 'Se requiere autenticación' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.error('Error validando token:', err.message);
            return res.status(403).json({ error: 'Token inválido o expirado' });
        }

        // Verificar que el objeto user contenga el id
        if (!user || !user.id) {
            console.error('Token válido pero sin ID de usuario:', user);
            return res.status(403).json({ error: 'Información de usuario incompleta en el token' });
        }

        req.user = user;
        next();
    });
}

// Middleware para verificar si es administrador
function isAdmin(req, res, next) {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Acceso denegado: Se requiere rol de administrador' });
    }
}

// ==================== RUTAS DE AUTENTICACIÓN ====================
app.post('/api/auth/login', async (req, res) => {
    try {
        console.log('=== DEBUG LOGIN ===');
        console.log('Headers:', req.headers);
        console.log('Body:', req.body);
        console.log('Content-Type:', req.get('Content-Type'));
        console.log('Raw body type:', typeof req.body);
        console.log('===================');

        const { email, password, rememberMe } = req.body;

        if (!email || !password) {
            console.log('Missing email or password:', { email: !!email, password: !!password });
            return res.status(400).json({ error: 'Email y contraseña son requeridos' });
        }

        // Buscar usuario por email
        const users = await db.query('SELECT * FROM users WHERE email = ? AND active = 1', [email]);

        if (users.length === 0) {
            return res.status(401).json({ error: 'Credenciales inválidas USUARIO' });
        }

        const user = users[0];

        // Verificar contraseña
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({ error: 'Credenciales inválidas CONTRASEÑA' });
        }

        // Actualizar último login
        await db.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

        // Generar token JWT
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            },
            JWT_SECRET,
            { expiresIn: rememberMe ? '7d' : '24h' }
        );

        // Devolver información de usuario y token
        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

app.get('/api/auth/verify', authenticateToken, (req, res) => {
    res.json({
        success: true,
        user: {
            id: req.user.id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role
        }
    });
});

app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password, role = 'user' } = req.body;

        // Verificar que el email no exista
        const existingUsers = await db.query('SELECT * FROM users WHERE email = ?', [email]);

        if (existingUsers.length > 0) {
            return res.status(400).json({ error: 'El email ya está registrado' });
        }

        // Encriptar contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Crear usuario
        const result = await db.query(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [name, email, hashedPassword, role]
        );

        // Generar token JWT
        const token = jwt.sign(
            {
                id: result.insertId,
                email,
                name,
                role
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            token,
            user: {
                id: result.insertId,
                name,
                email,
                role
            }
        });

    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

app.get('/api/auth/verify', authenticateToken, (req, res) => {
    res.json({
        success: true,
        user: {
            id: req.user.id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role
        }
    });
});

app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password, role = 'user' } = req.body;

        // Verificar que el email no exista
        const existingUsers = await db.query('SELECT * FROM users WHERE email = ?', [email]);

        if (existingUsers.length > 0) {
            return res.status(400).json({ error: 'El email ya está registrado' });
        }

        // Encriptar contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Crear usuario
        const result = await db.query(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [name, email, hashedPassword, role]
        );

        // Generar token JWT
        const token = jwt.sign(
            {
                id: result.insertId,
                email,
                name,
                role
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            token,
            user: {
                id: result.insertId,
                name,
                email,
                role
            }
        });

    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});


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
                    console.error('Error enviando mensaje WebSocket:', error.message);
                    // No hacer nada más, simplemente registrar el error
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
// Middleware para verificar acceso a un bot específico
async function verifyBotAccess(req, res, next) {
    try {
        const botId = req.params.botId;
        const bot = await db.getBotById(botId);

        if (!bot) {
            return res.status(404).json({ error: 'Bot no encontrado' });
        }

        // Si el usuario es admin o es el dueño del bot, permitir acceso
        if (req.user.role === 'admin' || bot.user_id === req.user.id) {
            req.bot = bot; // Guardar el bot en el request para uso posterior
            next();
        } else {
            res.status(403).json({ error: 'No tienes permiso para acceder a este bot' });
        }
    } catch (error) {
        console.error('Error verificando acceso a bot:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}


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
app.post('/api/generate-ai-message', async (req, res) => {
    try {
        const { apiKey, model, prompt, botName } = req.body;

        if (!apiKey) {
            return res.status(400).json({ success: false, error: 'Se requiere una API Key' });
        }

        // Configurar cliente de Gemini
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(apiKey);

        // Seleccionar modelo
        const modelToUse = genAI.getGenerativeModel({ model: model || 'gemini-1.5-flash' });

        // Crear generación con temperatura moderada
        const result = await modelToUse.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 500,
            },
            safetySettings: [
                {
                    category: 'HARM_CATEGORY_HARASSMENT',
                    threshold: 'BLOCK_MEDIUM_AND_ABOVE'
                },
                {
                    category: 'HARM_CATEGORY_HATE_SPEECH',
                    threshold: 'BLOCK_MEDIUM_AND_ABOVE'
                },
                {
                    category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                    threshold: 'BLOCK_MEDIUM_AND_ABOVE'
                },
                {
                    category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                    threshold: 'BLOCK_MEDIUM_AND_ABOVE'
                }
            ]
        });

        const response = result.response.text();

        res.json({ success: true, response });
    } catch (error) {
        console.error('Error generando mensaje con IA:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/generate-ai-message', (req, res) => {
    try {
        const { apiKey, model, prompt, botName } = req.body;
        
        // Limpiar la API key (eliminar caracteres no válidos que podrían venir de la base de datos)
        const cleanApiKey = apiKey ? apiKey.trim().replace(/\*+/g, '') : '';
        
        // Validar que la API key parece válida (generalmente son cadenas alfanuméricas largas)
        if (!cleanApiKey || cleanApiKey.length < 10) {
            return res.status(400).json({ 
                success: false, 
                error: 'La API Key proporcionada no es válida. Las API Keys de Google suelen ser cadenas alfanuméricas de al menos 10 caracteres.' 
            });
        }
        
        // Verificar que al menos se ha proporcionado un prompt
        if (!prompt) {
            return res.status(400).json({ 
                success: false, 
                error: 'Se requiere un prompt para generar contenido' 
            });
        }
        
        // Para pruebas iniciales o si estamos en modo offline
        const offlineMode = process.env.OFFLINE_AI_MODE === 'true';
        
        // Registrar la petición para depuración
        console.log('Solicitud de generación con IA recibida:');
        console.log('- Modelo:', model || 'gemini-1.5-flash');
        console.log('- API Key (primeros 5 caracteres):', cleanApiKey.substring(0, 5) + '...');
        console.log('- Prompt (primeros 100 caracteres):', prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''));
        console.log('- Modo offline:', offlineMode ? 'Activado' : 'Desactivado');
        
        // Si estamos en modo offline o para pruebas rápidas, generamos una respuesta local
        if (offlineMode) {
            generateOfflineResponse();
        } else {
            // Intentar llamar a la API real de Google
            callGeminiAPI();
        }
        
        // Función para generar respuesta offline
        function generateOfflineResponse() {
            // Generar una respuesta basada en palabras clave en el prompt
            let respuesta = '';
            
            if (prompt.toLowerCase().includes('saludo') || prompt.toLowerCase().includes('bienvenida')) {
                respuesta = `¡Hola! Soy ${botName || 'un asistente virtual'} y estoy aquí para ayudarte. ¿En qué puedo asistirte hoy?`;
            } 
            else if (prompt.toLowerCase().includes('gracias') || prompt.toLowerCase().includes('agradecimiento')) {
                respuesta = '¡Ha sido un placer ayudarte! Si necesitas cualquier otra cosa, no dudes en preguntar.';
            }
            else if (prompt.toLowerCase().includes('menu') || prompt.toLowerCase().includes('opciones')) {
                respuesta = 'Aquí tienes nuestro menú de opciones:\n\n1️⃣ Información general\n2️⃣ Productos y servicios\n3️⃣ Soporte técnico\n4️⃣ Hablar con un agente';
            }
            else if (prompt.toLowerCase().includes('producto') || prompt.toLowerCase().includes('servicio')) {
                respuesta = 'Ofrecemos una amplia gama de productos y servicios diseñados para satisfacer tus necesidades. Nuestros productos más populares incluyen:\n\n- Solución A: Ideal para pequeñas empresas\n- Solución B: Para necesidades personales\n- Solución Premium: Con todas las características avanzadas';
            }
            else {
                respuesta = `Gracias por tu mensaje. Como ${botName || 'asistente virtual'}, estoy aquí para ayudarte con cualquier pregunta o solicitud que tengas. ¿Hay algo específico en lo que pueda asistirte hoy?`;
            }
            
            // Agregar un pequeño retraso para simular el procesamiento
            setTimeout(() => {
                res.json({ success: true, response: respuesta });
            }, 1000);
        }
        
        // Función para llamar a la API de Google Gemini
        async function callGeminiAPI() {
            try {
                // Usar fetch nativo o importar node-fetch según la versión de Node.js
                const fetch = require('node-fetch');
                
                // URL de la API de Google Gemini
                const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model || 'gemini-1.5-flash'}:generateContent?key=${cleanApiKey}`;
                
                // Payload de la solicitud
                const payload = {
                    contents: [{
                        role: 'user',
                        parts: [{ text: prompt }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 500,
                    },
                    safetySettings: [
                        {
                            category: 'HARM_CATEGORY_HARASSMENT',
                            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
                        },
                        {
                            category: 'HARM_CATEGORY_HATE_SPEECH',
                            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
                        },
                        {
                            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
                        },
                        {
                            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
                        }
                    ]
                };
                
                // Realizar la solicitud
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });
                
                // Verificar si la respuesta es exitosa
                if (!response.ok) {
                    const errorData = await response.json();
                    console.error('Error de la API de Google:', errorData);
                    
                    // Verificar si es un error de API key
                    if (response.status === 400 || response.status === 401) {
                        return res.status(400).json({ 
                            success: false, 
                            error: 'La API Key proporcionada no es válida o ha expirado. Verifica tu API Key de Google.'
                        });
                    }
                    
                    // Caer en modo fallback offline si la API falla
                    console.log('Fallando a modo offline debido a error de API');
                    return generateOfflineResponse();
                }
                
                // Obtener respuesta
                const data = await response.json();
                
                // Extraer el texto de la respuesta según la estructura de la API
                let generatedText = '';
                if (data.candidates && data.candidates.length > 0 && 
                    data.candidates[0].content && 
                    data.candidates[0].content.parts && 
                    data.candidates[0].content.parts.length > 0) {
                    generatedText = data.candidates[0].content.parts[0].text || '';
                    
                    res.json({ success: true, response: generatedText });
                } else {
                    console.warn('Formato de respuesta inesperado de la API de Google:', data);
                    // Caer en modo fallback offline si el formato es inesperado
                    generateOfflineResponse();
                }
            } catch (error) {
                console.error('Error al llamar a la API de Google:', error);
                // Si hay error, generar respuesta offline como fallback
                generateOfflineResponse();
            }
        }
    } catch (error) {
        console.error('Error en el endpoint de IA:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error interno del servidor: ' + error.message 
        });
    }
});

app.get('/api/debug/bot/:id', async (req, res) => {
  try {
    // Verificar si está en modo desarrollo
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({
        success: false,
        error: 'Endpoint solo disponible en modo desarrollo'
      });
    }

    const botId = req.params.id;
    
    // Obtener el bot directamente de la base de datos
    const db = require('../db/mysql'); // Ajusta la ruta según tu estructura
    const [rawBot] = await db.query('SELECT * FROM bots WHERE id = ?', [botId]);
    
    if (!rawBot || rawBot.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Bot no encontrado'
      });
    }
    
    // Obtener los datos crudos incluyendo el tipo de cada campo
    const botData = rawBot[0];
    const fieldTypes = {};
    
    // Analizar los tipos de cada campo
    for (const [key, value] of Object.entries(botData)) {
      fieldTypes[key] = {
        value: value,
        type: typeof value,
        isBoolean: (value === 0 || value === 1) && key === 'enable_ai',
        raw: String(value)
      };
    }
    
    res.json({
      success: true,
      botRaw: botData,
      fieldTypes,
      enableAIStatus: {
        value: botData.enable_ai,
        asBoolean: Boolean(botData.enable_ai),
        type: typeof botData.enable_ai
      }
    });
  } catch (error) {
    console.error('Error en endpoint de depuración:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
// Crear nuevo bot
app.post('/api/bots/create', authenticateToken, validateBotConfig, async (req, res) => {
    try {
        // Verificar que req.user tenga id
        if (!req.user || !req.user.id) {
            throw new Error('No se pudo identificar al usuario. Vuelve a iniciar sesión.');
        }

        const botConfig = {
            id: generateBotId(),
            token: req.body.token || generateToken(),
            user_id: req.user.id, // Asegurar que el ID del usuario esté presente
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

        console.log('Creando bot con user_id:', botConfig.user_id); // Log para depuración

        // Verificar que el token sea único
        const existingBot = await db.getBotByToken(botConfig.token);
        if (existingBot) {
            botConfig.token = generateToken();
        }

        // Guardar en base de datos
        await db.createBot(botConfig);
        console.log('Bot creado:', botConfig);

        // Crear directorio del bot
        const botDir = path.join(__dirname, 'bots', botConfig.id);
        ensureDirectoryExists(botDir);

        // Generar archivos del bot
        await generateBotFiles(botConfig, botDir);

        // Registrar en el log
        await db.addLog('INFO', `Bot creado: ${botConfig.name} (${botConfig.id})`);

        // Notificar a los clientes conectados sobre la creación exitosa del bot
        broadcastToClients({
            type: 'bot_created',
            botId: botConfig.id,
            status: 'created'
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
app.post('/api/bots/events/heartbeat', async (req, res) => {
    try {
        const { botId, status, timestamp } = req.body;

        if (!botId) {
            return res.status(400).json({ success: false, error: 'botId es requerido' });
        }

        // Verificar si el bot existe en la base de datos
        const bot = await db.getBotById(botId);
        if (!bot) {
            return res.status(404).json({ success: false, error: 'Bot no encontrado' });
        }

        // Actualizar último heartbeat
        if (activeBots.has(botId)) {
            activeBots.get(botId).lastHeartbeat = Date.now();
        }

        // Actualizar última actividad en la base de datos (pero no sobrescribir estado)
        await db.query('UPDATE bots SET last_activity = NOW() WHERE id = ?', [botId]);

        // Si el bot aparece como detenido pero está enviando heartbeats, corregir estado
        if (bot.status !== 'running' && bot.status !== 'authenticated' && status === 'running') {
            await db.updateBot(botId, { status: 'running' });

            // Broadcast actualización
            broadcastToClients({
                type: 'bot_status',
                botId: botId,
                status: 'running'
            });
        }

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error procesando heartbeat:', error);
        res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
});
app.post('/api/bots/verify-status', async (req, res) => {
    try {
        const allBots = await db.getAllBots();
        const updatedBots = [];

        // Verificar cada bot
        for (const bot of allBots) {
            // Verificar si está en activeBots
            const isActiveInMap = activeBots.has(bot.id);
            const botInfo = activeBots.get(bot.id);
            const isProcessRunning = botInfo && botInfo.process &&
                !botInfo.process.killed &&
                botInfo.process.exitCode === null;

            // Verificar si el proceso está realmente ejecutándose
            if (isProcessRunning && (bot.status !== 'running' && bot.status !== 'authenticated')) {
                // Bot está activo pero no se refleja en la BD
                await db.updateBot(bot.id, { status: 'running' });
                updatedBots.push({ id: bot.id, oldStatus: bot.status, newStatus: 'running' });

                // Notificar a los clientes
                broadcastToClients({
                    type: 'bot_status',
                    botId: bot.id,
                    status: 'running'
                });
            }
            else if (!isProcessRunning && !isActiveInMap &&
                (bot.status === 'running' || bot.status === 'starting' ||
                    bot.status === 'authenticated')) {
                // Bot aparece como activo en BD pero no está ejecutándose
                await db.updateBot(bot.id, { status: 'stopped' });
                updatedBots.push({ id: bot.id, oldStatus: bot.status, newStatus: 'stopped' });

                // Notificar a los clientes
                broadcastToClients({
                    type: 'bot_status',
                    botId: bot.id,
                    status: 'stopped'
                });
            }
        }

        // También verificar procesos huérfanos
        for (const [botId, botInfo] of activeBots.entries()) {
            // Buscar en lista de bots
            const foundBot = allBots.find(b => b.id === botId);

            if (!foundBot) {
                // Proceso huérfano, eliminarlo
                console.log(`[verify-status] Eliminando proceso huérfano para bot ${botId}`);

                try {
                    if (botInfo.process && !botInfo.process.killed) {
                        botInfo.process.kill('SIGTERM');
                    }
                } catch (err) {
                    console.error(`[verify-status] Error al matar proceso huérfano: ${err.message}`);
                }

                activeBots.delete(botId);
            }
        }

        res.json({
            success: true,
            message: 'Estado de bots verificado',
            updatedBots: updatedBots,
            activeBots: Array.from(activeBots.keys())
        });
    } catch (error) {
        console.error('[verify-status] Error verificando estado de bots:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Listar todos los bots (filtrado por usuario si no es admin)
app.get('/api/bots', authenticateToken, async (req, res) => {
    try {
        let bots;

        if (req.user.role === 'admin') {
            // Administrador ve todos los bots
            bots = await db.getAllBots();
        } else {
            // Usuario normal solo ve sus propios bots
            bots = await db.getBotsByUserId(req.user.id);
        }

        // Procesar los datos para el frontend
        const botsFormatted = bots.map(bot => {
            // El procesamiento es igual que el original...
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
                apis: apis,
                userId: bot.user_id
            };
        });

        res.json({ success: true, bots: botsFormatted });
    } catch (error) {
        console.error('Error obteniendo bots:', error);
        res.status(500).json({ error: error.message });
    }
});

// Obtener configuración de un bot específico
app.get('/api/bots/:botId', authenticateToken, verifyBotAccess, async (req, res) => {

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

        res.json({ success: true, bot: req.bot });
    } catch (error) {
        console.error('Error obteniendo bot:', error);
        res.status(500).json({ error: error.message });
    }
});

// Actualizar configuración de bot
app.put('/api/bots/:botId', authenticateToken, verifyBotAccess, async (req, res) => {
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
            const existingBot = activeBots.get(botId);
            if (existingBot && existingBot.process && !existingBot.process.killed) {
                console.log(`[startBot] Bot ${botId} ya está en ejecución, deteniéndolo primero`);
                try {
                    existingBot.process.kill('SIGTERM');
                    // Esperar a que termine el proceso anterior
                    await new Promise(resolve => setTimeout(resolve, 2000));
                } catch (error) {
                    console.error(`[startBot] Error deteniendo proceso existente: ${error.message}`);
                }
            }
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
// En tu server.js, dentro de la ruta app.post('/api/bots/events/qr', ...)
// En tu server.js, dentro de la ruta app.post('/api/bots/events/qr', ...)
// REEMPLAZAR: La función completa del endpoint QR (en server.js)
app.post('/api/bots/events/qr', async (req, res) => {
    try {
        const { botId, qrCodeData, qrImagePath: localQrFilePath } = req.body; // Renombramos 'qrImagePath' a 'localQrFilePath' para claridad

        console.log(`[Server] QR recibido para bot ${botId}. Ruta de imagen LOCAL: ${localQrFilePath || 'N/A'}`);

        // Construir la URL HTTP accesible para el navegador
        // Usamos la ruta local que el bot te envió y la convertimos a una URL HTTP.
        // Asumimos que la ruta local siempre contiene 'bots' y el botId para construir la URL.
        const fileName = path.basename(localQrFilePath); // Obtiene solo el nombre del archivo (ej: qr_bot_123.png)
        const httpQrUrl = `/bots/${botId}/${fileName}`; // Construimos la URL HTTP

        console.log(`[Server] Enviando URL HTTP del QR: ${httpQrUrl}`); // ¡Añade este log para verificar!

        // Usar la ruta relativa fija que funciona
        const relativeImagePath = `/bots/${botId}/qr_${botId}.png`; // O la forma exacta en que guardas el nombre del archivo

        // Ahora, envía esta URL HTTP al frontend a través del WebSocket
        broadcastToClients({
            type: 'qr_code',
            botId: botId,
            qr: qrCodeData,
            qrImagePath: relativeImagePath // <-- ¡Envía esta URL relativa!
        });

        res.status(200).json({ success: true, message: 'QR event received successfully' });
    } catch (error) {
        console.error('Error al recibir evento QR:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
// Endpoint para evento de inicio de bot
app.post('/api/bots/events/startup', async (req, res) => {
    try {
        const { botId, status, port } = req.body;
        console.log(`[Server] Bot ${botId} iniciando en puerto ${port}`);

        // Actualizar estado en BD
        await db.updateBot(botId, { status: 'starting' });

        // Broadcast a clientes
        broadcastToClients({
            type: 'bot_startup',
            botId: botId,
            status: status,
            port: port
        });

        res.status(200).json({ success: true, message: 'Startup event received' });
    } catch (error) {
        console.error('Error al recibir evento startup:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Endpoint para evento de autenticación
app.post('/api/bots/events/authenticated', async (req, res) => {
    try {
        const { botId, status } = req.body;
        console.log(`[Server] Bot ${botId} autenticado exitosamente`);

        // Actualizar estado en BD
        await db.updateBot(botId, { status: 'authenticated' });

        // Broadcast a clientes
        broadcastToClients({
            type: 'bot_authenticated',
            botId: botId,
            status: status
        });

        res.status(200).json({ success: true, message: 'Authentication event received' });
    } catch (error) {
        console.error('Error al recibir evento authenticated:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Endpoint para evento de bot listo
app.post('/api/bots/events/ready', async (req, res) => {
    try {
        const { botId, status } = req.body;
        console.log(`[Server] Bot ${botId} está listo y operativo`);

        // Actualizar estado en BD
        await db.updateBot(botId, { status: 'running' });

        // Broadcast a clientes
        broadcastToClients({
            type: 'bot_ready',
            botId: botId,
            status: status
        });

        res.status(200).json({ success: true, message: 'Ready event received' });
    } catch (error) {
        console.error('Error al recibir evento ready:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Endpoint para evento de desconexión
app.post('/api/bots/events/disconnected', async (req, res) => {
    try {
        const { botId, status, reason } = req.body;
        console.log(`[Server] Bot ${botId} desconectado: ${reason}`);

        // Actualizar estado en BD
        await db.updateBot(botId, { status: 'disconnected' });

        // Broadcast a clientes
        broadcastToClients({
            type: 'bot_disconnected',
            botId: botId,
            status: status,
            reason: reason
        });

        res.status(200).json({ success: true, message: 'Disconnected event received' });
    } catch (error) {
        console.error('Error al recibir evento disconnected:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
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
        const configChanged = await hasConfigChanged(botId, botConfig);
        if (!fs.existsSync(botFile) || !fs.existsSync(nodeModulesPath) || configChanged) {
            const reason = !fs.existsSync(botFile)
                ? "app.js no existe"
                : !fs.existsSync(nodeModulesPath)
                    ? "módulos no instalados"
                    : "configuración actualizada";

            console.log(`[startBot] Regenerando archivos del bot ${botConfig.name || botId} (Razón: ${reason})`);
            try {
                await generateBotFiles(botConfig, botDir);
                console.log(`[startBot] Archivos regenerados exitosamente`);
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

                // Verificar si el bot sigue en el mapa de bots activos
                if (activeBots.has(botId)) {
                    const botInfo = activeBots.get(botId);

                    // Incrementar contador de reinicios
                    botInfo.restartCount = (botInfo.restartCount || 0) + 1;

                    // Establecer un retraso exponencial para evitar ciclos de reinicio rápidos
                    const restartDelay = Math.min(30000, Math.pow(2, Math.min(botInfo.restartCount, 10)) * 1000);

                    console.log(`[setup] Reiniciando bot ${botId} en ${restartDelay / 1000} segundos (intento #${botInfo.restartCount})`);
                    await db.addLog('INFO', `Programando reinicio en ${restartDelay / 1000} segundos (intento #${botInfo.restartCount})`, botId);

                    // Actualizar estado a "restarting"
                    await db.updateBot(botId, { status: 'restarting' });
                    broadcastToClients({ type: 'bot_status', botId, status: 'restarting' });

                    // Programar reinicio
                    setTimeout(async () => {
                        try {
                            console.log(`[setup] Ejecutando reinicio automático para bot ${botId}`);
                            // Obtener configuración actualizada
                            const updatedConfig = await db.getBotById(botId);
                            if (updatedConfig) {
                                await startBotProcess(botId, updatedConfig);
                            } else {
                                console.error(`[setup] No se pudo reiniciar bot ${botId}: configuración no encontrada`);
                                activeBots.delete(botId);
                            }
                        } catch (restartError) {
                            console.error(`[setup] Error en reinicio automático de ${botId}:`, restartError);
                            await db.addLog('ERROR', `Error en reinicio automático: ${restartError.message}`, botId);

                            // Si falla demasiadas veces, detener los intentos
                            if (botInfo.restartCount > 20) {
                                console.error(`[setup] Demasiados intentos de reinicio fallidos para ${botId}, deteniendo reintentos`);
                                await db.addLog('ERROR', `Demasiados intentos de reinicio fallidos, deteniendo reintentos`, botId);
                                await db.updateBot(botId, { status: 'error' });
                                broadcastToClients({ type: 'bot_status', botId, status: 'error' });
                                activeBots.delete(botId);
                            }
                        }
                    }, restartDelay);
                } else {
                    await db.updateBot(botId, { status: 'stopped' });
                    broadcastToClients({ type: 'bot_status', botId, status: 'stopped' });
                }
            } catch (err) {
                console.error(`Error actualizando estado de bot ${botId}:`, err);
            }
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
            config: botConfig,
            restartCount: 0 // Inicializar contador de reinicios
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



// Reemplazar la función stopBotProcess en server.js
async function stopBotProcess(botId) {
    console.log(`[server] Deteniendo bot ${botId}...`);

    try {
        const botInfo = activeBots.get(botId);
        if (!botInfo) {
            throw new Error('Bot no está ejecutándose');
        }

        // Actualizar estado en BD antes de detener
        await db.updateBot(botId, { status: 'stopping' });

        // Notificar a clientes que el bot está deteniéndose
        broadcastToClients({
            type: 'bot_status',
            botId: botId,
            status: 'stopping'
        });

        // Log en BD 
        await db.addLog('INFO', `Deteniendo proceso del bot`, botId);

        // Manejar errores al matar el proceso
        if (botInfo.process) {
            // Escuchar para errores de terminación
            botInfo.process.on('error', err => {
                console.error(`[server] Error al detener bot ${botId}:`, err);
                db.addLog('ERROR', `Error al detener proceso: ${err.message}`, botId)
                    .catch(e => console.error('No se pudo guardar log de error de kill:', e));
            });

            // Enviar señal SIGTERM para cierre ordenado
            console.log(`[server] Enviando señal SIGTERM a bot ${botId}`);
            botInfo.process.kill('SIGTERM');

            // Crear una promesa para esperar a que el proceso termine
            const waitForExit = new Promise((resolve) => {
                botInfo.process.once('exit', (code, signal) => {
                    console.log(`[server] Proceso del bot ${botId} terminado con código ${code}, señal ${signal}`);
                    resolve();
                });
            });

            // Esperar a que el proceso termine con timeout
            const forceKillTimeout = setTimeout(() => {
                if (activeBots.has(botId) && botInfo.process && !botInfo.process.killed) {
                    console.log(`[server] Forzando terminación del bot ${botId} con SIGKILL`);
                    botInfo.process.kill('SIGKILL');
                }
            }, 8000);

            // Esperar a que el proceso termine (máximo 8 segundos)
            try {
                await Promise.race([
                    waitForExit,
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout esperando terminación')), 10000))
                ]);
                clearTimeout(forceKillTimeout);
            } catch (error) {
                console.error(`[server] Error esperando a que el bot ${botId} termine:`, error.message);
                // El timeout de fuerza ya se habrá ejecutado
            }
        }

        // Eliminar del mapa de bots activos
        activeBots.delete(botId);

        // Actualizar estado en BD después de detener
        await db.updateBot(botId, { status: 'stopped' });

        // Notificar a clientes que el bot está detenido
        broadcastToClients({
            type: 'bot_status',
            botId: botId,
            status: 'stopped'
        });

        console.log(`[server] Bot ${botId} detenido exitosamente`);
        return true;
    } catch (error) {
        console.error(`[server] Error crítico deteniendo bot ${botId}:`, error);

        // Intentar actualizar estado a error
        try {
            await db.updateBot(botId, { status: 'error' });
            await db.addLog('ERROR', `Error deteniendo bot: ${error.message}`, botId);

            // Notificar a clientes
            broadcastToClients({
                type: 'bot_status',
                botId: botId,
                status: 'error',
                error: error.message
            });
        } catch (dbError) {
            console.error(`[server] Error adicional actualizando estado en BD:`, dbError);
        }

        // Eliminar del mapa de bots activos en caso de error
        activeBots.delete(botId);

        throw error;
    }
}



// ==================== RUTAS DE ANALÍTICAS ====================

app.get('/api/analytics/dashboard', authenticateToken, async (req, res) => {
    try {
        // Pasar el ID del usuario para filtrar estadísticas (si no es admin)
        const stats = await db.getDashboardStats(req.user.id, req.user.role === 'admin');

        // Filtrar datos según el rol del usuario
        let responseData = {
            totalBots: stats.totalBots,
            activeBots: stats.activeBots,
            totalMessages: stats.totalMessages,
            uptime: Date.now() - serverStartTime
        };

        // Datos financieros solo para administradores
        if (req.user && req.user.role === 'admin') {
            responseData.totalRevenue = stats.totalRevenue;
            responseData.totalClients = stats.totalClients;
        }

        res.json({
            success: true,
            stats: responseData
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
wss = new WebSocket.Server({ server, clientTracking: true });

// Manejo de errores del servidor WebSocket
wss.on('error', (error) => {
    console.error('[WEBSOCKET] Error en servidor WebSocket:', error.message);
    // NO terminar el bot por errores de WebSocket
});

wss.on('connection', (ws) => {
    console.log('[WEBSOCKET] Nueva conexión WebSocket establecida');

    // Manejo robusto de errores de conexión
    ws.on('error', (error) => {
        console.error('[WEBSOCKET] Error en conexión:', error.message);
        // No cerrar la conexión automáticamente
    });

    ws.on('close', () => {
        console.log('[WEBSOCKET] Conexión WebSocket cerrada');
        // El bot continúa funcionando independientemente
    });

    // Enviar estado inicial de forma segura
    try {
        ws.send(JSON.stringify({
            type: 'connected',
            timestamp: new Date().toISOString(),
            activeBots: activeBots.size
        }));
    } catch (err) {
        console.error('[WEBSOCKET] Error enviando mensaje inicial:', err.message);
    }


    // Manejo de errores de la conexión
    ws.on('error', (error) => {
        console.error('Error en conexión WebSocket:', error.message);
        // No cerrar la conexión, intentar mantenerla activa
    });

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            console.log('Mensaje WebSocket recibido:', data);

            // Responder al ping del cliente si existe
            if (data.type === 'ping') {
                ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
            }
        } catch (error) {
            console.error('Error procesando mensaje WebSocket:', error);
            // Enviar error al cliente pero mantener conexión
            try {
                ws.send(JSON.stringify({ type: 'error', message: 'Error procesando mensaje' }));
            } catch (e) {
                console.error('Error enviando mensaje de error:', e.message);
            }
        }
    });

    ws.on('close', () => {
        console.log('Conexión WebSocket cerrada');
        //clearInterval(pingInterval);
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

        // Asegurar que botConfig sea un objeto
        if (!botConfig || typeof botConfig !== 'object') {
            throw new Error('Configuración de bot inválida');
        }

        // Parseo de estructuras con manejo mejorado de errores
        let flows, messages, apis, aiConfig;
        try {
            // Normalizar estructura de datos - evitamos usar 'key' como variable
            flows = typeof botConfig.flows === 'string' ? JSON.parse(botConfig.flows) : botConfig.flows || [];
            messages = typeof botConfig.messages === 'string' ? JSON.parse(botConfig.messages) : botConfig.messages || {};
            apis = typeof botConfig.apis === 'string' ? JSON.parse(botConfig.apis) : botConfig.apis || {};
            aiConfig = typeof botConfig.aiConfig === 'string' ? JSON.parse(botConfig.aiConfig) : botConfig.aiConfig || {};

            // Log de verificación
            console.log(`[generateBotFiles] Generando archivos para bot ${botConfig.id} con ${flows.length} flujos`);
        } catch (e) {
            console.error(`[generateBotFiles] Error parseando JSON:`, e);
            flows = [];
            messages = {};
            apis = {};
            aiConfig = {};
        }

        // app.js
        const appCode = generateAppJS({
            id: botConfig.id || '',
            token: botConfig.token || '',
            name: botConfig.name || 'Bot WhatsApp',
            company: botConfig.company || 'Empresa',
            adminNumber: botConfig.adminNumber || botConfig.admin_number || '',
            commandPrefix: botConfig.commandPrefix || botConfig.command_prefix || '!',
            apiBaseUrl: botConfig.apiBaseUrl || botConfig.api_base_url || '',
            apiPassword: botConfig.apiPassword || botConfig.api_password || '',
            enableAI: botConfig.enableAI || botConfig.enable_ai || false,
            geminiApiKey: botConfig.geminiApiKey || botConfig.gemini_api_key || '',
            sessionTimeout: botConfig.sessionTimeout || botConfig.session_timeout || 15,
            defaultPause: botConfig.defaultPause || botConfig.default_pause || 30,
            flows: flows,
            messages: messages,
            apis: apis,
            aiConfig: aiConfig
        });
        await fs.writeFile(path.join(botDir, 'app.js'), appCode);
        console.log(`[generateBotFiles] app.js generado`);

        // package.json
        const packageJson = generatePackageJSON(botConfig);
        await fs.writeFile(path.join(botDir, 'package.json'), JSON.stringify(packageJson, null, 2));
        console.log(`[generateBotFiles] package.json generado`);

        // .env
        const envContent = generateEnvFile(botConfig);
        await fs.writeFile(path.join(botDir, '.env'), envContent);
        console.log(`[generateBotFiles] .env generado`);

        // config.json - Archivo crucial para la recarga de configuración
        const configJson = {
            botId: botConfig.id,
            name: botConfig.name,
            company: botConfig.company,
            plan: botConfig.plan,
            flows: flows,          // Guardar arrays y objetos directamente (no como string)
            messages: messages,    // para facilitar su lectura posterior
            apis: apis,
            aiConfig: aiConfig,
            lastUpdated: new Date().toISOString()
        };
        await fs.writeFile(path.join(botDir, 'config.json'), JSON.stringify(configJson, null, 2));
        console.log(`[generateBotFiles] config.json generado con ${flows.length} flujos`);

        await db.addLog('INFO', `Archivos generados para bot: ${botConfig.name}`, botConfig.id);
        return true;
    } catch (error) {
        console.error(`[generateBotFiles] ❌ Error generando archivos: ${error.message}`);
        console.error(error.stack);
        await db.addLog('ERROR', `Error generando archivos del bot: ${error.message}`, botConfig?.id || 'desconocido');
        throw error;
    }
}
// Función para verificar si la configuración ha cambiado
async function hasConfigChanged(botId, botConfig) {
    try {
        const botDir = path.join(__dirname, 'bots', botId);
        const configPath = path.join(botDir, 'config.json');

        if (!fs.existsSync(configPath)) {
            return true; // No existe configuración, debe generarse
        }

        // Leer configuración existente
        const existingConfigText = await fs.readFile(configPath, 'utf8');
        let existingConfig;
        try {
            existingConfig = JSON.parse(existingConfigText);
        } catch (parseError) {
            console.error(`[hasConfigChanged] Error parseando config.json: ${parseError.message}`);
            return true; // Si hay error de parseo, regenerar
        }

        // Obtener flows y messages de ambas configuraciones
        let newFlows, newMessages;
        try {
            newFlows = typeof botConfig.flows === 'string' ? JSON.parse(botConfig.flows) : botConfig.flows || [];
            newMessages = typeof botConfig.messages === 'string' ? JSON.parse(botConfig.messages) : botConfig.messages || {};
        } catch (e) {
            console.error(`[hasConfigChanged] Error parseando configuración nueva: ${e.message}`);
            newFlows = [];
            newMessages = {};
        }

        // Verificar si hay cambios en partes críticas
        const flowsChanged = JSON.stringify(existingConfig.flows || []) !== JSON.stringify(newFlows);
        const messagesChanged = JSON.stringify(existingConfig.messages || {}) !== JSON.stringify(newMessages);

        if (flowsChanged || messagesChanged) {
            console.log(`[hasConfigChanged] Se detectaron cambios en la configuración: flows=${flowsChanged}, messages=${messagesChanged}`);
            return true;
        }

        return false;
    } catch (error) {
        console.error(`[hasConfigChanged] Error verificando cambios: ${error.message}`);
        return true; // Si hay error, regenerar por seguridad
    }
}

function generateAppJS(config) {
    // Extraer datos esenciales de la configuración con valores por defecto para evitar undefined
    const {
        id: botId = '',
        token = '',
        name: botName = 'Bot WhatsApp',
        company = 'Empresa',
        adminNumber = '',
        commandPrefix = '!',
        apiBaseUrl = '',
        apiPassword = '',
        enableAI = false,
        geminiApiKey = '',
        sessionTimeout = 15,
        defaultPause = 30,
        flows = [],
        messages = {},
        apis = {}
    } = config;

    // Verificar que flows sea un array
    const safeFlows = Array.isArray(flows) ? flows : [];

    // Convertir flujos a formato JavaScript como objetos literales
    const flowsCode = `const botFlows = ${JSON.stringify(safeFlows, null, 4)};`;

    // Convertir mensajes a formato JavaScript
    const messagesCode = `const botMessages = ${JSON.stringify(messages || {}, null, 4)};`;

    // Convertir APIs a formato JavaScript
    const apisCode = `const botAPIs = ${JSON.stringify(apis || {}, null, 4)};`;

    // Código del app.js completo con todas las dependencias y funcionalidades
    return `// Bot WhatsApp - ${botName} para ${company}
// Generado automáticamente el ${new Date().toLocaleString()}
// ID: ${botId}

// ================= MÓDULOS REQUERIDOS =================
const path = require('path');
const modulesDir = path.join(__dirname, 'node_modules');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const QRCodeImage = require('qrcode');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const fs = require('fs-extra');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
// 🔥 POSICIÓN 1: AGREGAR AQUÍ LAS NUEVAS IMPORTACIONES
const crypto = require('crypto');
const validator = require('validator'); // npm install validator
// ================= CONFIGURACIÓN DEL BOT =================
// Variables cargadas del config.json o variables de entorno
const BOT_ID = process.env.BOT_ID || '${botId}';
const BOT_TOKEN = process.env.BOT_TOKEN || '${token}';
const ADMIN_PERSONAL_NUMBER = process.env.ADMIN_PERSONAL_NUMBER || '${adminNumber}';
const COMMAND_PREFIX = process.env.COMMAND_PREFIX || '${commandPrefix || "!"}';
const SESSION_TIMEOUT = ${sessionTimeout} * 60 * 1000;
const DEFAULT_PAUSE_DURATION = ${defaultPause};
const ENABLE_AI = ${enableAI ? 1 : 0};
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || '${geminiApiKey || ""}';

// URLs de API
const API_BASE_URL = process.env.API_BASE_URL || '${apiBaseUrl || ""}';
const API_PASSWORD = process.env.API_PASSWORD || '${apiPassword || ""}';
const MANAGEMENT_SERVER_URL = 'http://localhost:8080';

// Configuración cargada de variables de entorno con fallbacks seguros
const BOT_NAME = process.env.BOT_NAME || '${config.name}';
const COMPANY_NAME = process.env.COMPANY_NAME || '${config.company}';
const BOT_PLAN = process.env.PLAN || '${config.plan || 'emprendedor'}';

// Debug de variables críticas
console.log('[CONFIG] Variables cargadas:');
console.log('- BOT_ID:', BOT_ID);
console.log('- BOT_NAME:', BOT_NAME);
console.log('- COMPANY_NAME:', COMPANY_NAME);
console.log('- ADMIN_PERSONAL_NUMBER:', ADMIN_PERSONAL_NUMBER);
console.log('- ENABLE_AI:', ENABLE_AI);

// Variables de estado
let isBotOperational = false;
let botStartTime = Date.now();
let messagesProcessed = 0;
let qrReported = false;
let userSessions = {};
// ============================================================================
// POSICIÓN 2: AGREGAR DESPUÉS DE LA LÍNEA "let userSessions = {};"
// ============================================================================

// Sistema de base de datos JSON universal
class UniversalDataBase {
    constructor(botId) {
        this.botId = botId;
        this.dbPath = path.join(__dirname, 'db.json');
        this.initDatabase();
    }

    async initDatabase() {
        try {
            if (!fs.existsSync(this.dbPath)) {
                const initialData = {
                    users: {},
                    appointments: {},
                    reservations: {},
                    orders: {},
                    carts: {},
                    surveys: {},
                    loyaltyPoints: {},
                    complaints: {},
                    courses: {},
                    events: {},
                    payments: {},
                    promotions: {},
                    branches: {},
                    serviceOrders: {},
                    feedback: {},
                    templates: {},
                    lastIds: {
                        appointment: 1000,
                        reservation: 2000,
                        order: 3000,
                        survey: 4000,
                        complaint: 5000,
                        event: 6000,
                        serviceOrder: 7000
                    },
                    metadata: {
                        created: new Date().toISOString(),
                        botId: this.botId,
                        version: '1.0.0'
                    }
                };
                await fs.writeFile(this.dbPath, JSON.stringify(initialData, null, 2));
                console.log('[DB] Base de datos inicializada');
            }
        } catch (error) {
            console.error('[DB] Error inicializando base de datos:', error);
        }
    }

    async readData() {
        try {
            const data = await fs.readFile(this.dbPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('[DB] Error leyendo datos:', error);
            return null;
        }
    }

    async writeData(data) {
        try {
            await fs.writeFile(this.dbPath, JSON.stringify(data, null, 2));
            return true;
        } catch (error) {
            console.error('[DB] Error escribiendo datos:', error);
            return false;
        }
    }

    async getUser(userId) {
        const data = await this.readData();
        return data?.users?.[userId] || null;
    }

    async saveUser(userId, userData) {
        const data = await this.readData();
        if (!data.users) data.users = {};
        
        data.users[userId] = {
            ...data.users[userId],
            ...userData,
            lastUpdate: new Date().toISOString()
        };
        
        return await this.writeData(data);
    }

    async generateId(type) {
        const data = await this.readData();
        const currentId = data.lastIds[type] || 1000;
        data.lastIds[type] = currentId + 1;
        await this.writeData(data);
        return currentId + 1;
    }

    async saveRecord(collection, recordData) {
        const data = await this.readData();
        if (!data[collection]) data[collection] = {};
        
        const id = recordData.id || await this.generateId(collection.slice(0, -1)); // Remove 's' from collection
        data[collection][id] = {
            id,
            ...recordData,
            created: new Date().toISOString(),
            updated: new Date().toISOString()
        };
        
        await this.writeData(data);
        return id;
    }

    async getRecord(collection, id) {
        const data = await this.readData();
        return data?.[collection]?.[id] || null;
    }

    async getRecordsByUser(collection, userId) {
        const data = await this.readData();
        const records = data?.[collection] || {};
        return Object.values(records).filter(record => record.userId === userId);
    }

    async updateRecord(collection, id, updates) {
        const data = await this.readData();
        if (data[collection] && data[collection][id]) {
            data[collection][id] = {
                ...data[collection][id],
                ...updates,
                updated: new Date().toISOString()
            };
            await this.writeData(data);
            return true;
        }
        return false;
    }

    async deleteRecord(collection, id) {
        const data = await this.readData();
        if (data[collection] && data[collection][id]) {
            delete data[collection][id];
            await this.writeData(data);
            return true;
        }
        return false;
    }
}

// Instancia global de la base de datos
const universalDB = new UniversalDataBase(BOT_ID);
// Configuración de Express para API local
const appExpress = express();
const PORT = process.env.BOT_PORT || 3000;

appExpress.use(cors());
appExpress.use(express.json());
appExpress.use(express.urlencoded({ extended: true }));

// ================= CARGA DE FLUJOS Y CONFIGURACIÓN =================
// Cargar flujos, mensajes y APIs desde la configuración generada
${flowsCode}

${messagesCode}

${apisCode}

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
            previousStep: null,
            context: {},
            data: {},
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

// ============================================================================
// POSICIÓN 3: AGREGAR DESPUÉS DE LA CLASE SessionManager
// ============================================================================

// Sistema de validación universal
class UniversalValidator {
    static validateEmail(email) {
        return validator.isEmail(email);
    }

    static validatePhone(phone) {
        const phoneRegex = /^[+]?[\\d\\s\\-\\(\\)]{10,15}$/;
        return phoneRegex.test(phone.replace(/\\s/g, ''));
    }

    static validateDate(dateString) {
        const date = new Date(dateString);
        return !isNaN(date.getTime()) && date > new Date();
    }

    static validateTime(timeString) {
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        return timeRegex.test(timeString);
    }

    static validateCreditCard(cardNumber) {
        return validator.isCreditCard(cardNumber.replace(/\\s/g, ''));
    }

    static sanitizeInput(input) {
        return validator.escape(input.trim());
    }
}

// Sistema de manejo de variables universal
class UniversalVariableManager {
    static async replaceVariables(text, session, additionalVars = {}) {
        if (!text) return '';
        
        const userId = session.userId;
        const user = await universalDB.getUser(userId);
        const now = new Date();
        
        // Variables del sistema
        const systemVars = {
            fecha: now.toLocaleDateString('es-ES'),
            hora: now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
            fechaCompleta: now.toLocaleDateString('es-ES', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            }),
            bot: BOT_NAME,
            empresa: COMPANY_NAME,
            año: now.getFullYear(),
            mes: now.getMonth() + 1,
            dia: now.getDate(),
            diaSemana: now.toLocaleDateString('es-ES', { weekday: 'long' })
        };

        // Variables del usuario
        const userVars = {
            nombre: user?.name || 'Usuario',
            email: user?.email || '',
            telefono: user?.phone || '',
            nombreUsuario: user?.name || 'Usuario'
        };

        // Variables de sesión
        const sessionVars = {
            paso: session.step,
            flujo: session.currentFlow,
            ...session.data
        };

        // Combinar todas las variables
        const allVars = { 
            ...systemVars, 
            ...userVars, 
            ...sessionVars, 
            ...additionalVars 
        };

        // Reemplazar variables
        let processedText = text;
        for (const [key, value] of Object.entries(allVars)) {
            const regex = new RegExp('\\$\\{\${key}\\}', 'g');
            processedText = processedText.replace(regex, value || '');
        }

        return processedText;
    }
}

// Variables mutables para configuración que puede cambiar
// Variables mutables para configuración que puede cambiar
let currentBotFlows = [...botFlows];
let currentBotMessages = {...botMessages};
let currentBotAPIs = {...botAPIs};

// Función para recargar configuración desde archivo
async function reloadConfig() {
    try {
        console.log('[CONFIG] Recargando configuración...');
        const configPath = path.join(__dirname, 'config.json');
        
        if (fs.existsSync(configPath)) {
            const configData = await fs.readFile(configPath, 'utf8');
            const config = JSON.parse(configData);
            
            console.log('[CONFIG] Configuración leída:', {
                flows: config.flows?.length || 0,
                hasMessages: !!config.messages,
                hasApis: !!config.apis
            });
            
            // Actualizar variables mutables con la estructura correcta del config.json
            if (config.flows && Array.isArray(config.flows)) {
                currentBotFlows = config.flows;
                console.log(\`[CONFIG] \${config.flows.length} flujos cargados\`);
            }
            
            if (config.messages) {
                currentBotMessages = config.messages;
                console.log('[CONFIG] Mensajes globales cargados');
            }
            
            if (config.apis) {
                currentBotAPIs = config.apis;
                console.log('[CONFIG] APIs cargadas');
            }
            
            console.log('[CONFIG] Configuración recargada exitosamente');
            return true;
        } else {
            console.warn('[CONFIG] No se encontró archivo de configuración en:', configPath);
            return false;
        }
    } catch (error) {
        console.error('[CONFIG] Error recargando configuración:', error.message);
        console.error('[CONFIG] Stack:', error.stack);
        return false;
    }
}
// ================= MANEJO DE CIERRE CONTROLADO =================
process.on('SIGTERM', async () => {
    console.log('[SHUTDOWN] Recibida señal SIGTERM, realizando cierre controlado...');
    
    try {
        // Cambiar estado pero NO cerrar el cliente automáticamente
        isBotOperational = false;
        
        // Notificar al servidor de gestión
        await safeServerNotification('api/bots/events/disconnected', {
            botId: BOT_ID,
            status: 'disconnected',
            reason: 'SIGTERM recibido'
        }).catch(() => console.log('[SHUTDOWN] No se pudo notificar al servidor de gestión'));
        
        // NO cerrar el cliente de WhatsApp automáticamente
        // Dejar que funcione independientemente
        console.log('[SHUTDOWN] Bot configurado para funcionar independientemente');
        
        // Cerrar servidor Express solo si es necesario
        if (server) {
            server.close(() => {
                console.log('[SHUTDOWN] Servidor API cerrado correctamente');
            });
        }
        
        // NO usar process.exit() - mantener el proceso activo
        console.log('[SHUTDOWN] Proceso mantenido activo para funcionamiento independiente');
        
    } catch (error) {
        console.error('[SHUTDOWN] Error durante cierre controlado:', error);
        // Incluso con errores, no terminar el proceso
    }
});

// Añadir también un listener para SIGINT
process.on('SIGINT', () => {
    console.log('[SHUTDOWN] Recibida señal SIGINT, redirigiendo a handler controlado');
    process.emit('SIGTERM');
});
// Función segura para enviar eventos al servidor de gestión
async function safeServerNotification(endpoint, data) {
    try {
        console.log("[NOTIFICATION] Enviando a \${endpoint}:", data);
        
        const response = await axios.post("\${MANAGEMENT_SERVER_URL}/\${endpoint}", data, {
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log("[NOTIFICATION] Respuesta de \${endpoint}:", response.data);
        return true;
    } catch (error) {
        /*if (error.response) {
            console.error("[NOTIFICATION] Error HTTP \${error.response.status} en \${endpoint}:", error.response.data);
        } else if (error.request) {
            console.error("[NOTIFICATION] Sin respuesta de \${endpoint}:", error.message);
        } else {
            console.error("[NOTIFICATION] Error configurando petición a \${endpoint}:", error.message);
        }*/
        
        // NO lanzar el error, solo retornar false para mantener el bot funcionando
        return false;
    }
}
process.on('uncaughtException', (error) => {
    console.error('[CRITICAL] Error no capturado:', error);
    
    // Si el cliente está inicializado, intentar mantenerlo funcionando
    if (client) {
        console.log('[RECOVERY] Intentando mantener el cliente activo después del error');
        
        // Verificar estado del cliente e intentar reconectar si es necesario
        setTimeout(async () => {
            try {
                if (!isBotOperational && client) {
                    console.log('[RECOVERY] Intentando reiniciar cliente...');
                    // Solo intentar reiniciar si no está en estado ready
                    if (client.info && !client.info.me) {
                        await client.initialize();
                    }
                }
            } catch (recoveryError) {
                console.error('[RECOVERY] Error intentando recuperar cliente:', recoveryError);
            }
        }, 5000);
    }
    
    // NO TERMINAR EL PROCESO - mantener el bot funcionando
});


process.on('unhandledRejection', (reason, promise) => {
    console.error('[WARNING] Promesa rechazada no manejada:', reason);
    // Solo registrar el error, no terminar el proceso
});

// Detectar desconexiones del servidor de gestión y reconectar
let managementServerReconnectAttempts = 0;
function setupManagementServerReconnection() {
    setInterval(async () => {
        try {
            // Intentar enviar una señal de heartbeat al servidor de gestión
            const response = await axios.get(\`\${MANAGEMENT_SERVER_URL}/api/health\`, { timeout: 5000 });
            if (response.status === 200) {
                managementServerReconnectAttempts = 0;
                // Estamos conectados, nada que hacer
            }
        } catch (error) {
            managementServerReconnectAttempts++;
            console.log(\`[CONNECTION] Error conectando con servidor de gestión (intento #\${managementServerReconnectAttempts})\`);
            
            // Si tenemos demasiados intentos, probablemente el servidor está caído
            // pero seguimos operando independientemente
            if (managementServerReconnectAttempts > 10) {
                console.log('[CONNECTION] Servidor de gestión posiblemente caído, continuando operación independiente');
            }
        }
    }, 30000); // Cada 30 segundos
}
appExpress.get('/health', (req, res) => {
    res.json({
        botId: BOT_ID,
        status: isBotOperational ? 'running' : 'stopped',
        timestamp: Date.now(),
        uptime: Date.now() - botStartTime,
        clientReady: client && client.info ? true : false,
        websocketIndependent: true // Indica que funciona sin WebSocket
    });
});
// ================= INICIALIZACIÓN DEL CLIENTE =================
// Configuración del cliente de WhatsApp
const client = new Client({
    authStrategy: new LocalAuth({ clientId: BOT_ID }),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

// ================= MANEJO DE EVENTOS DEL CLIENTE =================
// Evento cuando el QR está listo para escanear
client.on('qr', async (qr) => {
    // Muestra el QR en terminal (útil para desarrollo)
    qrcode.generate(qr, { small: true });
    
    // Evitar reportar múltiples veces el mismo QR
    if (qrReported) return;
    qrReported = true;
    
    console.log('[QR] Código QR generado. Guarda el QR como imagen...');
    
    try {
        // Guardar QR como imagen
        const qrImagePath = path.join(__dirname, \`qr_\${BOT_ID}.png\`);
        await QRCodeImage.toFile(qrImagePath, qr, {
            errorCorrectionLevel: 'H',
            margin: 1,
            scale: 8,
            color: {
                dark: '#25D366',
                light: '#FFFFFF'
            }
        });
        console.log(\`[QR] Imagen de QR guardada en: \${qrImagePath}\`);
        
        // Notificar al servidor de gestión
        safeServerNotification('api/bots/events/qr', {
            botId: BOT_ID,
            qrCodeData: qr,
            qrImagePath: qrImagePath
        });
        
        console.log('[QR] QR reportado al servidor de gestión');
    } catch (error) {
        console.error('[ERROR] Error generando/guardando QR:', error.message);
    }
});

// Evento cuando la autenticación es exitosa
client.on('authenticated', async () => {
    console.log('[AUTH] Autenticación exitosa con WhatsApp');
    qrReported = false; // Resetear para próximas sesiones
    
    // Notificar al servidor de gestión
    safeServerNotification('api/bots/events/authenticated', {
        botId: BOT_ID,
        status: 'authenticated'
    });
});

// Evento cuando el cliente está listo
client.on('ready', async () => {
    console.log('[READY] Cliente WhatsApp listo y conectado');
    console.log(\`[READY] Bot: \${BOT_NAME} | Empresa: \${COMPANY_NAME}\`);
    isBotOperational = true;
    botStartTime = Date.now();
    
    // Notificar al servidor de gestión
    try {
        await safeServerNotification('api/bots/events/ready', {
            botId: BOT_ID,
            status: 'ready'
        });
        console.log('[READY] Estado reportado al servidor de gestión');
    } catch (error) {
        console.error('[ERROR] Error reportando estado ready:', error.message);
    }
    
    // Notificar al administrador
    try {
        if (ADMIN_PERSONAL_NUMBER) {
            const adminId = ADMIN_PERSONAL_NUMBER.includes('@c.us') 
                ? ADMIN_PERSONAL_NUMBER 
                : \`\${ADMIN_PERSONAL_NUMBER}@c.us\`;
                
            console.log(\`[READY] Enviando notificación a admin: \${adminId}\`);
            
            const adminMessage = \`✅ *Bot iniciado correctamente*\\n\\n\` +
                \`🤖 *Nombre:* \${BOT_NAME}\\n\` +
                \`🏢 *Empresa:* \${COMPANY_NAME}\\n\` +
                \`📊 *ID:* \${BOT_ID}\\n\` +
                \`📋 *Plan:* \${BOT_PLAN}\\n\` +
                \`⏱️ *Hora:* \${new Date().toLocaleString()}\\n\\n\` +
                \`El bot está listo para recibir mensajes.\`;
                
            await client.sendMessage(adminId, adminMessage);
            console.log('[READY] Mensaje enviado al administrador exitosamente');
        } else {
            console.warn('[READY] No se configuró número de administrador');
        }
    } catch (error) {
        console.error('[ERROR] Error enviando mensaje al admin:', error.message);
        console.error('[ERROR] Admin number:', ADMIN_PERSONAL_NUMBER);
        console.error('[ERROR] Company name:', COMPANY_NAME);
    }
});

// Evento cuando se recibe un mensaje
client.on('message', async (message) => {
    try {
        messagesProcessed++;
        
        if (!isBotOperational) {
            console.log('[INFO] Mensaje recibido pero el bot no está operativo');
            return;
        }
        
        // Procesar el mensaje según los flujos configurados
        await processMessage(message);
        
    } catch (error) {
        console.error('[ERROR] Error procesando mensaje:', error.message);
    }
});

client.on('disconnected', async (reason) => {
    console.log(\`[DISCONNECTED] Cliente desconectado: \${reason}\`);
    isBotOperational = false;
    
    // Notificar al servidor de gestión (sin bloquear)
    safeServerNotification('api/bots/events/disconnected', {
        botId: BOT_ID,
        status: 'disconnected',
        reason,
        autoReconnect: true
    }).catch(() => console.log('[DISCONNECTED] No se pudo notificar al servidor de gestión'));
    
    // Programar múltiples intentos de reconexión con backoff exponencial
    let reconnectAttempt = 1;
    const maxAttempts = 10;
    
    const attemptReconnect = async () => {
        try {
            console.log('[RECONNECT] Intento de reconexión #\${reconnectAttempt}/\${maxAttempts}...');
            await client.initialize();
            console.log('[RECONNECT] Intento de reconexión iniciado exitosamente');
            
        } catch (error) {
            console.error('[RECONNECT] Error en intento #\${reconnectAttempt}:', error.message);
            
            if (reconnectAttempt < maxAttempts) {
                reconnectAttempt++;
                // Backoff exponencial: 10s, 20s, 40s, etc.
                const delay = Math.min(10000 * Math.pow(2, reconnectAttempt - 1), 300000); // máximo 5 minutos
                
                console.log('[RECONNECT] Programando siguiente intento en \${delay / 1000} segundos...');
                setTimeout(attemptReconnect, delay);
            } else {
                console.log('[RECONNECT] Máximo de intentos alcanzado, esperando reconexión manual o automática');
                
                // Después de fallar todos los intentos, programar un reinicio completo en 10 minutos
                setTimeout(() => {
                    reconnectAttempt = 1; // Resetear contador
                    attemptReconnect(); // Intentar de nuevo
                }, 600000); // 10 minutos
            }
        }
    };
    
    // Iniciar primer intento después de 10 segundos
    setTimeout(attemptReconnect, 10000);
});

// ================= PROCESAMIENTO DE MENSAJES =================
// Procesar mensaje según flujos configurados
async function processMessage(message) {
    const userId = message.from;
    const messageBody = message.body;
    
    // Ignorar mensajes propios o de grupos si es necesario
    if (message.fromMe) return;
    if (userId.includes('@g.us') && !botFlows.some(f => f.allowGroups)) return;
    
    // Verificar si es mensaje de administrador
    const isAdmin = userId === ADMIN_PERSONAL_NUMBER || 
                   userId === \`\${ADMIN_PERSONAL_NUMBER}@c.us\`;
                   
    // Procesar comandos de administrador
    if (isAdmin && messageBody.startsWith(COMMAND_PREFIX)) {
        await processAdminCommand(message);
        return;
    }
    
    // Obtener o crear sesión para este usuario
    const session = sessionManager.getSession(userId);
    
    // Procesar el mensaje según el flujo actual
    await processFlowMessage(message, session);
}

// Procesar comandos de administrador
async function processAdminCommand(message) {
    const command = message.body.substring(COMMAND_PREFIX.length).trim().split(' ')[0].toLowerCase();
    const params = message.body.substring(COMMAND_PREFIX.length + command.length).trim();
    
    switch (command) {
        case 'status':
            await sendStatusReport(message.from);
            break;
        case 'pause':
            // Implementar pausa del bot
            break;
        case 'reload':
            await reloadBotConfig(message.from);
            break;
        case 'broadcast':
            // Implementar envío masivo
            break;
        default:
            await client.sendMessage(message.from, \`⚠️ Comando desconocido: \${command}\\n\\nComandos disponibles:\\n- \${COMMAND_PREFIX}status\\n- \${COMMAND_PREFIX}reload\\n- \${COMMAND_PREFIX}pause\`);
    }
}

// Recargar configuración del bot
async function reloadBotConfig(adminId) {
    try {
        await client.sendMessage(adminId, '⏳ Recargando configuración del bot...');
        
        const success = await reloadConfig();
        
        if (success) {
            await client.sendMessage(adminId, '✅ Configuración recargada exitosamente');
        } else {
            await client.sendMessage(adminId, '❌ Error recargando configuración');
        }
    } catch (error) {
        console.error('[ERROR] Error recargando configuración:', error.message);
        await client.sendMessage(adminId, \`❌ Error: \${error.message}\`);
    }
}

// Enviar reporte de estado
async function sendStatusReport(userId) {
    const uptime = Math.floor((Date.now() - botStartTime) / 1000 / 60); // en minutos
    
    const statusMessage = \`📊 *Estado del Bot*\\n\\n\` +
        \`✅ Bot: *\${isBotOperational ? 'Activo' : 'Inactivo'}*\\n\` +
        \`🤖 Nombre: \${BOT_NAME}\\n\` +
        \`🏢 Empresa: \${COMPANY_NAME}\\n\` +
        \`⏱️ Tiempo activo: \${uptime} minutos\\n\` +
        \`📝 Mensajes procesados: \${messagesProcessed}\\n\` +
        \`👥 Sesiones activas: \${sessionManager.sessions.size}\\n\` +
        \`🔄 Última actualización: \${new Date().toLocaleString()}\`;
    
    await client.sendMessage(userId, statusMessage);
}

// Procesar mensaje según flujo actual
// ============================================================================
// POSICIÓN 4: REEMPLAZAR LA FUNCIÓN processFlowMessage COMPLETA
// ============================================================================

// Procesar mensaje según flujo actual - VERSIÓN UNIVERSAL
async function processFlowMessage(message, session) {
    const userId = message.from;
    const messageBody = message.body.trim();
    
    // Si el usuario está pausado, verificar si quiere reactivar
    if (session.paused) {
        if (messageBody.toLowerCase() === 'reactivar') {
            session.paused = false;
            await client.sendMessage(userId, 'Bot reactivado. ¿En qué puedo ayudarte?');
            session.step = 'INITIAL';
        } else {
            return;
        }
    }
    
    // Buscar el flujo actual
    const currentFlow = currentBotFlows.find(flow => flow.name === session.currentFlow);
    
    if (!currentFlow) {
        if (currentBotFlows.length > 0) {
            session.currentFlow = currentBotFlows[0].name;
            session.step = 'INITIAL';
            await handleUniversalFlowStep(currentBotFlows[0], session, message);
        } else {
            await client.sendMessage(userId, 'Lo siento, no hay flujos configurados en este momento.');
        }
        return;
    }
    
    // Procesar según el paso actual con el sistema universal
    await handleUniversalFlowStep(currentFlow, session, message);
}

// ============================================================================
// POSICIÓN 5: REEMPLAZAR LA FUNCIÓN handleFlowStep POR ESTA VERSIÓN UNIVERSAL
// ============================================================================

// Manejar paso específico del flujo - VERSIÓN UNIVERSAL
async function handleUniversalFlowStep(flow, session, message) {
    const userId = message.from;
    const messageBody = message.body.trim();
    
    console.log('[UNIVERSAL] Procesando flujo: \${flow.name}, paso: \${session.step}, usuario: \${userId}');
    
    // Paso inicial
    if (session.step === 'INITIAL') {
        await handleInitialStep(flow, session, message);
        return;
    }
    
    // Paso de espera de selección
    if (session.step === 'AWAITING_CHOICE') {
        await handleChoiceStep(flow, session, message);
        return;
    }
    
    // Pasos específicos por tipo de flujo
    await handleSpecificFlowStep(flow, session, message);
}
// ============================================================================
// POSICIÓN 6: AGREGAR ESTAS FUNCIONES ESPECIALIZADAS DESPUÉS DE handleUniversalFlowStep
// ============================================================================

// Función auxiliar para mostrar opciones de un paso
async function showStepOptions(flow, session, stepName) {
    const userId = session.userId;
    
    if (flow.options && flow.options.length > 0) {
        const stepOptions = flow.options.filter(opt => 
            !opt.step || opt.step === stepName
        );
        
        if (stepOptions.length > 0) {
            const menuOptions = stepOptions.map(opt => 
                \`\${opt.emoji || ''} \${opt.text}\`
            ).join('\\n');
            
            await client.sendMessage(userId, \`\\n\${menuOptions}\`);
        }
    }
}

// Función auxiliar para encontrar opción seleccionada
function findSelectedOption(options, userInput) {
    if (!options) return null;
    
    return options.find(opt => {
        const input = userInput.toLowerCase().trim();
        
        // Verificar por número
        if (opt.number && opt.number.toString() === userInput) return true;
        
        // Verificar por emoji
        if (opt.emoji === userInput) return true;
        
        // Verificar por texto exacto
        if (opt.text && opt.text.toLowerCase() === input) return true;
        
        // Verificar por texto parcial
        if (opt.text && opt.text.toLowerCase().includes(input)) return true;
        
        return false;
    });
}

// MANEJO DE CITAS Y RESERVACIONES
async function handleAppointmentStep(flow, session, message) {
    const userId = message.from;
    const messageBody = message.body.trim();
    const step = session.step;
    
    switch (step) {
        case 'SELECCIONAR_FECHA':
            if (await validateAndSaveDate(session, messageBody)) {
                session.step = 'SELECCIONAR_HORA';
                await showAvailableTimes(session);
            } else {
                await client.sendMessage(userId, '❌ Fecha inválida. Por favor, ingresa una fecha válida (DD/MM/AAAA):');
            }
            break;
            
        case 'SELECCIONAR_HORA':
            if (await validateAndSaveTime(session, messageBody)) {
                session.step = 'DATOS_CLIENTE';
                await client.sendMessage(userId, 'Por favor, proporciona tu nombre completo:');
            } else {
                await client.sendMessage(userId, '❌ Hora inválida. Por favor, selecciona una hora disponible:');
                await showAvailableTimes(session);
            }
            break;
            
        case 'DATOS_CLIENTE':
            await handleClientDataInput(session, message);
            break;
            
        case 'CONFIRMAR_CITA':
            if (messageBody === '1' || messageBody.toLowerCase().includes('confirmar')) {
                await saveAppointment(session);
                session.step = 'INITIAL';
            }
            break;
            
        default:
            await handleGenericStep(flow, session, message);
    }
}

async function validateAndSaveDate(session, dateInput) {
    // Validar formato de fecha
    const dateRegex = /^(\\d{1,2})\\/(\\d{1,2})\\/(\\d{4})$/;
    const match = dateInput.match(dateRegex);
    
    if (!match) return false;
    
    const [, day, month, year] = match;
    const date = new Date(year, month - 1, day);
    
    // Verificar que la fecha sea válida y futura
    if (date < new Date() || date.getFullYear() != year) return false;
    
    session.data.selectedDate = date.toISOString();
    session.data.displayDate = dateInput;
    return true;
}

async function validateAndSaveTime(session, timeInput) {
    // Aquí puedes agregar lógica para verificar disponibilidad
    if (UniversalValidator.validateTime(timeInput)) {
        session.data.selectedTime = timeInput;
        return true;
    }
    return false;
}

async function showAvailableTimes(session) {
    const times = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];
    const timeList = times.map((time, index) => \`\${index + 1}. \${time}\`).join('\\n');
    
    await client.sendMessage(session.userId, \`Horarios disponibles:\\n\\n\${timeList}\\n\\nSelecciona un horario:\`);
}

async function handleClientDataInput(session, message) {
    const messageBody = message.body.trim();
    
    if (!session.data.clientName) {
        session.data.clientName = UniversalValidator.sanitizeInput(messageBody);
        await client.sendMessage(message.from, 'Gracias. Ahora proporciona tu número telefónico:');
    } else if (!session.data.clientPhone) {
        if (UniversalValidator.validatePhone(messageBody)) {
            session.data.clientPhone = messageBody;
            await client.sendMessage(message.from, 'Perfecto. Por último, tu correo electrónico:');
        } else {
            await client.sendMessage(message.from, '❌ Número inválido. Por favor, ingresa un número telefónico válido:');
        }
    } else if (!session.data.clientEmail) {
        if (UniversalValidator.validateEmail(messageBody)) {
            session.data.clientEmail = messageBody.toLowerCase();
            session.step = 'CONFIRMAR_CITA';
            await showAppointmentSummary(session);
        } else {
            await client.sendMessage(message.from, '❌ Email inválido. Por favor, ingresa un correo electrónico válido:');
        }
    }
}

async function showAppointmentSummary(session) {
    const summary = \`📋 *Resumen de tu Cita*\\n
📅 Fecha: \${session.data.displayDate}
⏰ Hora: \${session.data.selectedTime}
👤 Nombre: \${session.data.clientName}
📞 Teléfono: \${session.data.clientPhone}
📧 Email: \${session.data.clientEmail}\\n
¿Los datos son correctos?\\n
1. ✅ Confirmar Cita
2. ✏️ Editar Datos
3. ❌ Cancelar\`;

    await client.sendMessage(session.userId, summary);
}

async function saveAppointment(session) {
    const appointmentId = await universalDB.generateId('appointment');
    
    const appointment = {
        id: appointmentId,
        userId: session.userId,
        date: session.data.selectedDate,
        time: session.data.selectedTime,
        clientName: session.data.clientName,
        clientPhone: session.data.clientPhone,
        clientEmail: session.data.clientEmail,
        status: 'confirmed',
        type: session.data.appointmentType || 'general'
    };
    
    await universalDB.saveRecord('appointments', appointment);
    
    // Guardar datos del usuario
    await universalDB.saveUser(session.userId, {
        name: session.data.clientName,
        phone: session.data.clientPhone,
        email: session.data.clientEmail
    });
    
    const confirmationMessage = \`✅ *¡Cita Confirmada!*\\n
Tu código de cita es: *#\${appointmentId}*\\n
📅 Fecha: \${session.data.displayDate}
⏰ Hora: \${session.data.selectedTime}\\n
Te hemos enviado un recordatorio por email.
Recuerda llegar 15 minutos antes.\`;

    await client.sendMessage(session.userId, confirmationMessage);
    
    // Limpiar datos de sesión
    session.data = {};
}

// MANEJO DE COMPRAS Y CARRITO
async function handleShoppingStep(flow, session, message) {
    const userId = message.from;
    const messageBody = message.body.trim();
    
    switch (session.step) {
        case 'AGREGAR_CARRITO':
            await addToCart(session, messageBody);
            break;
            
        case 'VER_CARRITO':
            await showCart(session);
            break;
            
        case 'CONFIRMAR_COMPRA':
            await processOrder(session, messageBody);
            break;
            
        default:
            await handleGenericStep(flow, session, message);
    }
}

async function addToCart(session, productInfo) {
    const cart = await getOrCreateCart(session.userId);
    
    // Lógica para agregar producto al carrito
    const product = {
        id: Date.now(),
        name: productInfo,
        quantity: 1,
        price: 100 // Esto debería venir de una base de productos
    };
    
    cart.items.push(product);
    await universalDB.updateRecord('carts', session.userId, cart);
    
    await client.sendMessage(session.userId, '✅ Producto agregado al carrito');
}

async function getOrCreateCart(userId) {
    let cart = await universalDB.getRecord('carts', userId);
    
    if (!cart) {
        cart = {
            userId,
            items: [],
            total: 0
        };
        await universalDB.saveRecord('carts', cart);
    }
    
    return cart;
}

// MANEJO DE ENCUESTAS
async function handleSurveyStep(flow, session, message) {
    const messageBody = message.body.trim();
    
    if (session.step.startsWith('PREGUNTA_')) {
        const questionNumber = session.step.replace('PREGUNTA_', '');
        session.data['respuesta_\${questionNumber}'] = messageBody;
        
        // Ir a siguiente pregunta o finalizar
        const nextQuestion = parseInt(questionNumber) + 1;
        if (nextQuestion <= 5) {
            session.step = 'PREGUNTA_\${nextQuestion}';
            await showQuestion(session, nextQuestion);
        } else {
            await finalizeSurvey(session);
        }
    }
}

async function showQuestion(session, questionNumber) {
    const questions = {
        1: '¿Qué tan satisfecho estás con nuestro servicio?',
        2: '¿Recomendarías nuestros productos?',
        3: '¿Cómo calificarías la atención recibida?',
        4: '¿Qué tan probable es que vuelvas a comprar?',
        5: '¿Tienes algún comentario adicional?'
    };
    
    const question = questions[questionNumber];
    await client.sendMessage(session.userId, '\${questionNumber}/5 - \${question}');
}

async function finalizeSurvey(session) {
    const surveyId = await universalDB.generateId('survey');
    
    const survey = {
        id: surveyId,
        userId: session.userId,
        responses: session.data,
        completed: true
    };
    
    await universalDB.saveRecord('surveys', survey);
    
    await client.sendMessage(session.userId, '🎉 ¡Gracias por completar la encuesta! Tus respuestas son muy valiosas para nosotros.');
    
    session.step = 'INITIAL';
    session.data = {};
}

// MANEJO GENÉRICO PARA OTROS FLUJOS
async function handleGenericStep(flow, session, message) {
    const userId = message.from;
    const messageBody = message.body.trim();
    const currentStepName = session.step;
    
    // Buscar mensaje asociado a este paso
    const stepMessage = flow.messages?.[currentStepName];
    
    if (stepMessage) {
        const processedMessage = await UniversalVariableManager.replaceVariables(stepMessage, session);
        await client.sendMessage(userId, processedMessage);
    }
    
    // Mostrar opciones correspondientes al paso
    await showStepOptions(flow, session, currentStepName);
    
    session.previousStep = session.step;
    session.step = 'AWAITING_CHOICE';
    
    // Si no hay opciones para este paso, guardar entrada y continuar
    if (!flow.options || !flow.options.some(opt => opt.step === currentStepName)) {
        session.data[currentStepName] = messageBody;
        session.step = 'INITIAL';
        await handleUniversalFlowStep(flow, session, message);
    }
}

async function handleInitialStep(flow, session, message) {
    const userId = message.from;
    
    // Mensaje de bienvenida
    let welcomeMessage = '';
    if (flow.messages && flow.messages.welcome) {
        welcomeMessage = flow.messages.welcome;
    } else if (currentBotMessages.greetings) {
        const hour = new Date().getHours();
        if (hour >= 6 && hour < 12) {
            welcomeMessage = currentBotMessages.greetings.morning;
        } else if (hour >= 12 && hour < 18) {
            welcomeMessage = currentBotMessages.greetings.afternoon;
        } else {
            welcomeMessage = currentBotMessages.greetings.evening;
        }
    } else {
        welcomeMessage = 'Bienvenido al flujo \${flow.name}';
    }
    
    // Reemplazar variables
    welcomeMessage = await UniversalVariableManager.replaceVariables(welcomeMessage, session);
    await client.sendMessage(userId, welcomeMessage);
    
    // Mostrar opciones del paso INITIAL
    await showStepOptions(flow, session, 'INITIAL');
    
    session.previousStep = session.step;
    session.step = 'AWAITING_CHOICE';
}

async function handleChoiceStep(flow, session, message) {
    const userId = message.from;
    const messageBody = message.body.trim();
    const previousStep = session.previousStep || 'INITIAL';
    
    // Buscar la opción seleccionada
    const filteredOptions = flow.options?.filter(opt => 
        !opt.step || opt.step === previousStep
    );
    
    const selectedOption = findSelectedOption(filteredOptions, messageBody);
    
    if (!selectedOption) {
        const errorMsg = currentBotMessages?.errors?.invalidOption || 
                      '❌ Opción no válida. Por favor, selecciona una opción del menú.';
        await client.sendMessage(userId, errorMsg);
        return;
    }
    
    console.log('[UNIVERSAL] Opción seleccionada: \${selectedOption.text} (acción: \${selectedOption.action})');
    
    // Procesar la acción de manera universal
    await processUniversalOptionAction(selectedOption, session, message);
}

async function handleSpecificFlowStep(flow, session, message) {
    const userId = message.from;
    const messageBody = message.body.trim();
    const currentStepName = session.step;
    
    // Manejar pasos específicos según el tipo de flujo
    switch (flow.name) {
        case 'AGENDA_CITAS':
        case 'GESTION_CITAS':
        case 'PROCESO_RESERVACION':
            await handleAppointmentStep(flow, session, message);
            break;
            
        case 'CATALOGO_PRODUCTOS':
        case 'CARRITO_COMPRAS':
            await handleShoppingStep(flow, session, message);
            break;
            
        case 'ENCUESTA_SATISFACCION':
        case 'ENCUESTAS_OPINION':
            await handleSurveyStep(flow, session, message);
            break;
            
        case 'GESTION_PAGOS':
            await handlePaymentStep(flow, session, message);
            break;
            
        case 'GESTION_RECLAMACIONES':
            await handleComplaintStep(flow, session, message);
            break;
            
        case 'ORDENES_SERVICIO':
            await handleServiceOrderStep(flow, session, message);
            break;
            
        case 'PLANIFICADOR_EVENTOS':
            await handleEventStep(flow, session, message);
            break;
            
        default:
            await handleGenericStep(flow, session, message);
    }
}

// ============================================================================
// POSICIÓN 7: REEMPLAZAR LA FUNCIÓN processOptionAction POR ESTA VERSIÓN
// ============================================================================

// Procesar acción de opción - VERSIÓN UNIVERSAL
async function processUniversalOptionAction(option, session, message) {
    const userId = message.from;
    
    console.log('[UNIVERSAL ACTION] Procesando: \${option.action} con valor: \${option.actionValue}');
    
    session.previousStep = session.step;
    
    switch (option.action) {
        case 'goToStep':
            if (option.actionValue) {
                session.step = option.actionValue;
                const currentFlow = currentBotFlows.find(f => f.name === session.currentFlow);
                if (currentFlow) {
                    await handleUniversalFlowStep(currentFlow, session, message);
                }
            }
            break;
            
        case 'goToFlow':
            if (option.actionValue) {
                const targetFlow = currentBotFlows.find(f => f.name === option.actionValue);
                if (targetFlow) {
                    session.currentFlow = option.actionValue;
                    session.step = 'INITIAL';
                    await handleUniversalFlowStep(targetFlow, session, message);
                }
            }
            break;
            
        case 'sendMessage':
            if (option.actionValue) {
                let messageToSend = '';
                const currentFlow = currentBotFlows.find(f => f.name === session.currentFlow);
                
                if (currentFlow?.messages?.[option.actionValue]) {
                    messageToSend = currentFlow.messages[option.actionValue];
                } else if (currentBotMessages[option.actionValue]) {
                    messageToSend = currentBotMessages[option.actionValue];
                } else {
                    messageToSend = option.actionValue;
                }
                
                const processedMessage = await UniversalVariableManager.replaceVariables(messageToSend, session);
                await client.sendMessage(userId, processedMessage);
                
                session.step = 'INITIAL';
                await handleUniversalFlowStep(currentFlow, session, message);
            }
            break;
            case 'sendMedia':
    if (option.actionValue) {
        try {
            // Notificar al usuario que estamos procesando
            await client.sendMessage(userId, '⏳ Enviando archivo...');
            
            // Descargar el archivo desde la URL
            console.log('[MEDIA] Descargando archivo desde: \${option.actionValue}');
            const response = await axios.get(option.actionValue, { 
                responseType: 'arraybuffer',
                // Aumentar timeout para archivos grandes
                timeout: 30000
            });
            
            // Convertir a base64 para MessageMedia
            const mediaData = Buffer.from(response.data).toString('base64');
            
            // Determinar el tipo MIME basado en los encabezados de respuesta
            const mimeType = response.headers['content-type'] || 'application/octet-stream';
            
            // Extraer el nombre del archivo de la URL
            const urlParts = option.actionValue.split('/');
            let filename = urlParts[urlParts.length - 1];
            
            // Limpiar parámetros de consulta si existen
            if (filename.includes('?')) {
                filename = filename.split('?')[0];
            }
            
            // Si no hay nombre de archivo o está vacío, generar uno basado en el tipo MIME
            if (!filename || filename === '') {
                const extension = getFileExtensionFromMimeType(mimeType);
                filename = 'archivo \${Date.now()}.\${extension}';
            }
            
            // Crear objeto MessageMedia
            const media = new MessageMedia(mimeType, mediaData, filename);
            
            // Enviar el archivo con o sin caption
            await client.sendMessage(userId, media, { 
                caption: option.caption || '',
                // Ajustar parámetros según el tipo de archivo
                sendMediaAsDocument: mimeType.startsWith('application/') || 
                                    mimeType.startsWith('text/') ||
                                    option.sendAsDocument === true
            });
            
            console.log('[MEDIA] Archivo enviado exitosamente a: \${userId}');
            
        } catch (error) {
            console.error('[ERROR] Error enviando archivo:', error.message);
            await client.sendMessage(userId, '❌ Lo siento, hubo un problema enviando el archivo.');
        }
        
        // Continuar con el flujo independientemente del resultado
        session.step = 'INITIAL';
        const currentFlow = currentBotFlows.find(f => f.name === session.currentFlow);
        if (currentFlow) {
            await handleUniversalFlowStep(currentFlow, session, message);
        }
    }
    break;
            
        default:
            await client.sendMessage(userId, 'Has seleccionado: \${option.text}');
            session.step = 'INITIAL';
            const defaultFlow = currentBotFlows.find(f => f.name === session.currentFlow);
            if (defaultFlow) {
                await handleUniversalFlowStep(defaultFlow, session, message);
            }
    }
}

// Función auxiliar para determinar la extensión de archivo basada en el tipo MIME
function getFileExtensionFromMimeType(mimeType) {
    const mimeToExt = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
        'image/webp': 'webp',
        'image/svg+xml': 'svg',
        'video/mp4': 'mp4',
        'video/mpeg': 'mpeg',
        'video/webm': 'webm',
        'video/quicktime': 'mov',
        'audio/mpeg': 'mp3',
        'audio/wav': 'wav',
        'audio/ogg': 'ogg',
        'application/pdf': 'pdf',
        'application/msword': 'doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
        'application/vnd.ms-excel': 'xls',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
        'application/vnd.ms-powerpoint': 'ppt',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
        'application/zip': 'zip',
        'application/x-rar-compressed': 'rar',
        'text/plain': 'txt',
        'text/html': 'html',
        'text/css': 'css',
        'text/javascript': 'js'
    };
    
    return mimeToExt[mimeType] || 'bin';
}

// ================= INTEGRACIÓN CON IA =================
${enableAI ? `
// Procesar respuesta de IA
async function processAIResponse(option, session, message) {
    try {
        const userId = message.from;
        const messageBody = message.body.trim();
        
        // Notificar al usuario que estamos procesando con IA
        await client.sendMessage(userId, botMessages?.confirmations?.waitingResponse || '⏳ Procesando tu consulta con IA...');
        
        // Construir el mensaje para enviar a Gemini
        const prompt = option.aiPrompt || 'Responde de manera concisa y profesional a la siguiente consulta';
        
        // Crear la solicitud a la API de Gemini
        const response = await axios.post(
            \`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=\${GOOGLE_API_KEY}\`,
            {
                contents: [
                    {
                        parts: [
                            { text: \`\${prompt}\\n\\nConsulta del usuario: \${messageBody}\` }
                        ]
                    }
                ],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 500,
                }
            }
        );
        
        // Extraer la respuesta de Gemini
        const aiResponse = response.data.candidates[0]?.content?.parts[0]?.text || 
                         'Lo siento, no pude generar una respuesta';
        
        // Enviar la respuesta al usuario
        await client.sendMessage(userId, aiResponse);
        
    } catch (error) {
        console.error('[ERROR] Error procesando respuesta de IA:', error.message);
        await client.sendMessage(message.from, 'Lo siento, hubo un error procesando tu consulta con IA');
    }
}` : '// IA no habilitada para este bot'}

// ================= FUNCIONES AUXILIARES =================
// Reemplazar variables en texto
function replaceVariables(text, session) {
    if (!text) return '';
    
    // Reemplazar variables de sistema
    let processed = text
        .replace(/\{\{fecha\}\}/g, new Date().toLocaleDateString())
        .replace(/\{\{hora\}\}/g, new Date().toLocaleTimeString())
        .replace(/\{\{bot\}\}/g, BOT_NAME || 'Bot')
        .replace(/\{\{empresa\}\}/g, COMPANY_NAME || 'Empresa')
        .replace(/\{\{botName\}\}/g, BOT_NAME || 'Bot')
        .replace(/\{\{company\}\}/g, COMPANY_NAME || 'Empresa');
    
    // Reemplazar variables de sesión
    for (const varName in session.data) {
        processed = processed.replace(new RegExp(\`\\\{\\\{\${varName}\\\}\\\}\`, 'g'), session.data[varName]);
    }
    
    return processed;
}

// ================= API LOCAL DEL BOT =================
// ============================================================================
// POSICIÓN 9: AGREGAR ESTOS ENDPOINTS A LA SECCIÓN DE API LOCAL DEL BOT
// ============================================================================

// Endpoint para consultar citas
appExpress.get('/appointments/:userId', async (req, res) => {
    try {
        const appointments = await universalDB.getRecordsByUser('appointments', req.params.userId);
        res.json({ success: true, appointments });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Endpoint para consultar datos de usuario
appExpress.get('/user/:userId', async (req, res) => {
    try {
        const user = await universalDB.getUser(req.params.userId);
        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Endpoint para estadísticas
appExpress.get('/stats', async (req, res) => {
    try {
        const data = await universalDB.readData();
        const stats = {
            totalUsers: Object.keys(data.users || {}).length,
            totalAppointments: Object.keys(data.appointments || {}).length,
            totalOrders: Object.keys(data.orders || {}).length,
            totalSurveys: Object.keys(data.surveys || {}).length
        };
        res.json({ success: true, stats });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Endpoint para verificar estado
appExpress.get('/status', (req, res) => {
    res.json({
        botId: BOT_ID,
        name: BOT_NAME,
        company: COMPANY_NAME,
        status: isBotOperational ? 'active' : 'inactive',
        uptime: Date.now() - botStartTime,
        messagesProcessed,
        activeSessions: sessionManager.sessions.size
    });
});

// Endpoint de health para heartbeat
appExpress.get('/health', (req, res) => {
    res.json({
        botId: BOT_ID,
        status: isBotOperational ? 'running' : 'stopped',
        timestamp: Date.now(),
        uptime: Date.now() - botStartTime,
        clientReady: client && client.info ? true : false,
        websocketIndependent: true // Indica que funciona sin WebSocket
    });
});

// Heartbeat independiente y robusto al servidor de gestión
let heartbeatFailures = 0;
const MAX_HEARTBEAT_FAILURES = 10;

setInterval(async () => {
    if (isBotOperational) {
        try {
            await axios.post('\${MANAGEMENT_SERVER_URL}/api/bots/events/heartbeat', {
                botId: BOT_ID,
                status: 'running',
                timestamp: Date.now(),
                independentMode: true
            }, {
                timeout: 5000
            });
            
            // Resetear contador de fallos si fue exitoso
            heartbeatFailures = 0;
            
        } catch (error) {
            heartbeatFailures++;
            
            // Solo registrar error cada 5 fallos para evitar spam
            if (heartbeatFailures % 5 === 0) {
                console.error('[HEARTBEAT] Error (\${heartbeatFailures}/\${MAX_HEARTBEAT_FAILURES}):', error.message);
            }
            
            // Si hay muchos fallos, el servidor puede estar caído pero seguimos operando
            if (heartbeatFailures >= MAX_HEARTBEAT_FAILURES) {
                console.log('[HEARTBEAT] Servidor de gestión no disponible, continuando operación independiente');
                // Reiniciar contador para evitar overflow
                heartbeatFailures = 0;
            }
        }
    }
}, 60000); // cada minuto

// ================= RECUPERACIÓN AUTOMÁTICA DEL CLIENTE =================
// Monitoreo continuo del estado del cliente WhatsApp
setInterval(async () => {
    if (!isBotOperational && client) {
        try {
            console.log('[MONITOR] Verificando estado del cliente WhatsApp...');
            
            // Intentar reconectar si no está operativo
            if (!client.info || !client.info.me) {
                console.log('[MONITOR] Cliente desconectado, intentando reconectar...');
                await client.initialize();
            }
            
        } catch (error) {
            console.error('[MONITOR] Error en verificación del cliente:', error.message);
            
            // Intentar crear nuevo cliente si el actual está muy dañado
            setTimeout(async () => {
                try {
                    console.log('[MONITOR] Intentando reinicializar cliente completamente...');
                    await client.initialize();
                } catch (retryError) {
                    console.error('[MONITOR] Error en reinicialización:', retryError.message);
                }
            }, 30000);
        }
    }
}, 120000); // cada 2 minutos

// Endpoint para enviar mensaje a un usuario
appExpress.post('/send-message', async (req, res) => {
    try {
        const { phone, message, token } = req.body;
        
        // Validar token
        if (token !== BOT_TOKEN) {
            return res.status(401).json({ error: 'Token inválido' });
        }
        
        if (!phone || !message) {
            return res.status(400).json({ error: 'Se requiere número y mensaje' });
        }
        
        // Normalizar número de teléfono
        const phoneNumber = phone.includes('@c.us') ? phone : \`\${phone}@c.us\`;
        
        // Enviar mensaje
        await client.sendMessage(phoneNumber, message);
        
        res.json({ success: true, message: 'Mensaje enviado exitosamente' });
    } catch (error) {
        console.error('[ERROR] Error API enviar mensaje:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// POSICIÓN 8: AGREGAR ESTAS FUNCIONES DE UTILIDAD AL FINAL ANTES DE LA INICIALIZACIÓN
// ============================================================================

// Manejo de reclamaciones
async function handleComplaintStep(flow, session, message) {
    // Implementación específica para reclamaciones
    await handleGenericStep(flow, session, message);
}

// Manejo de órdenes de servicio
async function handleServiceOrderStep(flow, session, message) {
    // Implementación específica para órdenes de servicio
    await handleGenericStep(flow, session, message);
}

// Manejo de eventos
async function handleEventStep(flow, session, message) {
    // Implementación específica para eventos
    await handleGenericStep(flow, session, message);
}

// Manejo de pagos
async function handlePaymentStep(flow, session, message) {
    // Implementación específica para pagos
    await handleGenericStep(flow, session, message);
}


// ================= INICIALIZACIÓN =================
// Iniciar cliente de WhatsApp
(async () => {
    try {
        console.log('[INIT] Iniciando bot de WhatsApp...');
        
        // Inicializar cliente
        await client.initialize();
        
        // Iniciar servidor Express
        const server = appExpress.listen(PORT, () => {
            console.log(\`[EXPRESS] API local del bot escuchando en puerto \${PORT}\`);
        });
        
        // Reportar inicio al servidor de gestión
        safeServerNotification('api/bots/events/startup', {
            botId: BOT_ID,
            status: 'starting',
            port: PORT
        });
        
        // Configurar reconexión con servidor de gestión
        setupManagementServerReconnection();
        
    } catch (error) {
        console.error('[CRITICAL] Error iniciando bot:', error.message);
        
        // En lugar de terminar el proceso, intentar reiniciar
        console.log('[RECOVERY] Intentando recuperarse del error de inicio...');
        setTimeout(async () => {
            try {
                console.log('[RECOVERY] Reiniciando cliente WhatsApp...');
                await client.initialize();
            } catch (recoveryError) {
                console.error('[RECOVERY] Error en recuperación:', recoveryError.message);
                // Incluso si falla, no cerramos el proceso
            }
        }, 30000); // Esperar 30 segundos antes de reintentar
    }
})();
`;
}

function generatePackageJSON(config) {
    return {
        "name": `whatsapp-bot-${config.id}`,
        "version": "1.0.0",
        "description": `Bot de WhatsApp para ${config.company} - ${config.name}`,
        "main": "app.js",
        "scripts": {
            "start": "node app.js",
            "dev": "nodemon app.js",
            "test": "echo \"Error: no test specified\" && exit 1"
        },
        "keywords": ["whatsapp", "bot", "automation", "business"],
        "author": config.company || "Empresa",
        "license": "ISC",
        "dependencies": {
            "whatsapp-web.js": "^1.24.1",
            "qrcode": "^1.5.3",
            "qrcode-terminal": "^0.12.0",
            "axios": "^1.6.2",
            "express": "^4.18.2",
            "cors": "^2.8.5",
            "fs-extra": "^11.2.0",
            "body-parser": "^1.20.2",
            "dotenv": "^16.3.1",
            "validator": "^13.11.0",
            "moment": "^2.29.4",
            "uuid": "^9.0.1",
            "crypto": "^1.0.1"
        },
        "devDependencies": {
            "nodemon": "^3.0.2"
        },
        "engines": {
            "node": ">=18.0.0"
        }
    };
}

function generateEnvFile(config) {
    return `# Configuración del Bot - ${config.company || 'Bot'}
# Generado automáticamente el ${new Date().toLocaleString()}

# Configuración básica
BOT_ID=${config.id}
BOT_TOKEN=${config.token}
ADMIN_PERSONAL_NUMBER=${config.adminNumber || config.admin_number || ''}
COMMAND_PREFIX=${config.commandPrefix || config.command_prefix || '!'}
API_PASSWORD=${config.apiPassword || config.api_password || ''}

# Google Gemini AI
GOOGLE_API_KEY=${config.geminiApiKey || config.gemini_api_key || ''}

# URLs de API
API_BASE_URL=${config.apiBaseUrl || config.api_base_url || ''}

# Configuraciones de tiempo
SESSION_TIMEOUT=${config.sessionTimeout || config.session_timeout || 15}
DEFAULT_PAUSE_DURATION=${config.defaultPause || config.default_pause || 30}

# Funciones habilitadas
ENABLE_AI=${config.enableAI || config.enable_ai ? 1 : 0}

# Información del bot
BOT_NAME="${config.name || 'Bot WhatsApp'}"
COMPANY_NAME="${config.company || 'Empresa'}"
PLAN="${config.plan || 'emprendedor'}"

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

        // Iniciar el monitor de procesos
        setupBotProcessMonitor();

        server.listen(PORT, () => {
            console.log('='.repeat(60));
            console.log(`🚀 Servidor de gestión iniciado en puerto ${PORT}`);
            console.log(`📁 Interfaz web: http://localhost:${PORT}`);
            console.log(`🔗 WebSocket: ws://localhost:${PORT}`);
            console.log(`📂 Directorio de bots: ${path.join(__dirname, 'bots')}`);
            console.log(`🗄️ Base de datos: MySQL conectada`);
            console.log('='.repeat(60));

            db.addLog('INFO', `Servidor de gestión iniciado en puerto ${PORT}`);

            // Verificar bots que podrían estar en estado inconsistente
            setTimeout(async () => {
                try {
                    // Buscar bots en estado "running" o "starting" y marcarlos como detenidos
                    // ya que todos los bots se detienen cuando el servidor se reinicia
                    const runningBots = await db.query(
                        "SELECT id FROM bots WHERE status IN ('running', 'starting', 'authenticated')"
                    );

                    if (runningBots && runningBots.length > 0) {
                        console.log(`[Startup] Encontrados ${runningBots.length} bots en estado activo que necesitan reinicio`);

                        for (const bot of runningBots) {
                            await db.updateBot(bot.id, { status: 'stopped' });
                            console.log(`[Startup] Estado de bot ${bot.id} actualizado a 'stopped'`);
                        }
                    }
                } catch (error) {
                    console.error('[Startup] Error al verificar bots activos:', error);
                }
            }, 5000);
        });
    } catch (error) {
        console.error('Error iniciando servidor:', error);
        process.exit(1);
    }
}


// Manejo de cierre adecuado
process.on('SIGINT', async () => {
    console.log('\n[Shutdown] Cierre de servidor solicitado...');
    console.log('[Shutdown] Los bots seguirán ejecutándose en segundo plano');

    // Registramos en la BD que el servidor se está cerrando, pero los bots continúan
    await db.addLog('INFO', 'Servidor de gestión cerrándose, los bots continúan ejecutándose');

    // Desconectar todos los clientes WebSocket correctamente
    if (wss) {
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                try {
                    client.close(1001, 'Servidor cerrándose');
                } catch (error) {
                    console.error('Error cerrando conexión WebSocket:', error);
                }
            }
        });
    }

    // Esperar un momento para que se completen las operaciones pendientes
    setTimeout(() => {
        console.log('[Shutdown] Servidor de gestión cerrado');
        process.exit(0);
    }, 2000);
});

process.on('uncaughtException', (error) => {
    console.error('Error no capturado:', error);
    db.addLog('ERROR', `Error no capturado: ${error.message}`);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Promesa rechazada no manejada:', reason);
    db.addLog('ERROR', `Promesa rechazada: ${reason}`);
});
async function setupBotProcessMonitor() {
    console.log('[Monitor] Iniciando monitor de procesos de bots');

    // Verificar procesos activos cada 30 segundos
    setInterval(async () => {
        try {
            // 1. Obtener todos los bots desde la base de datos
            const allBots = await db.getAllBots();
            if (!allBots || !Array.isArray(allBots)) {
                console.error('[Monitor] Error obteniendo bots desde BD');
                return;
            }

            // 2. Verificar cada bot en la lista de activeBots
            for (const [botId, botInfo] of activeBots.entries()) {
                const process = botInfo.process;

                // Verificar si el proceso está realmente activo
                const isRunning = process && !process.killed && process.exitCode === null;

                // Encontrar este bot en la lista de la BD
                const dbBot = allBots.find(b => b.id === botId);

                if (dbBot) {
                    // Si el bot está activo pero no se refleja en la BD
                    if (isRunning && dbBot.status !== 'running' &&
                        dbBot.status !== 'starting' && dbBot.status !== 'authenticated') {
                        console.log(`[Monitor] Bot ${botId} está activo pero su estado en BD es ${dbBot.status}. Actualizando...`);
                        await db.updateBot(botId, { status: 'running' });
                        broadcastToClients({ type: 'bot_status', botId, status: 'running' });
                    }
                    // Si el bot no está activo pero aparece como activo en la BD
                    else if (!isRunning && (dbBot.status === 'running' || dbBot.status === 'starting' ||
                        dbBot.status === 'authenticated')) {
                        console.log(`[Monitor] Bot ${botId} no está activo pero su estado en BD es ${dbBot.status}. Actualizando...`);
                        await db.updateBot(botId, { status: 'stopped' });
                        broadcastToClients({ type: 'bot_status', botId, status: 'stopped' });
                        // Eliminar de activeBots si el proceso no está activo
                        activeBots.delete(botId);
                    }
                }
            }

            // 3. Verificar bots que están en "running" en la BD pero no en activeBots
            for (const bot of allBots) {
                if ((bot.status === 'running' || bot.status === 'starting' ||
                    bot.status === 'authenticated') && !activeBots.has(bot.id)) {
                    console.log(`[Monitor] Bot ${bot.id} aparece como ${bot.status} en BD pero no está en activeBots`);
                    await db.updateBot(bot.id, { status: 'stopped' });
                    broadcastToClients({ type: 'bot_status', botId: bot.id, status: 'stopped' });
                }
            }

            // 4. Verificar salud de procesos activos
            for (const [botId, botInfo] of activeBots.entries()) {
                const process = botInfo.process;

                // Si el proceso existe pero no responde (zombi)
                if (process && !process.killed && process.exitCode === null) {
                    // Podríamos implementar una verificación de salud más sofisticada aquí
                    // Por ejemplo, intentar hacer una solicitud HTTP al puerto del bot

                    // Por ahora, solo verificamos el tiempo desde el último heartbeat
                    const now = Date.now();
                    if (!botInfo.lastHeartbeat || (now - botInfo.lastHeartbeat > 5 * 60 * 1000)) {
                        console.log(`[Monitor] Bot ${botId} sin heartbeat por más de 5 minutos`);
                        // No matamos el proceso aquí, solo registramos el problema
                    }
                }
            }
        } catch (error) {
            console.error('[Monitor] Error en monitor de procesos:', error);
        }
    }, 30000); // Verificar cada 30 segundos

    console.log('[Monitor] Monitor de procesos iniciado');
}
// Iniciar el servidor
startServer();

module.exports = app;