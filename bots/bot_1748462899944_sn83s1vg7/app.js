// Bot WhatsApp - asas para asas
// Generado automáticamente el 28/5/2025, 2:08:19 p.m.
// ID: bot_1748462899944_sn83s1vg7

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

// ================= CONFIGURACIÓN DEL BOT =================
// Variables cargadas del config.json o variables de entorno
const BOT_ID = process.env.BOT_ID || 'bot_1748462899944_sn83s1vg7';
const BOT_TOKEN = process.env.BOT_TOKEN || 'R2lDjn1gNKNSOG0o7LwolNL61UvrE3oe';
const ADMIN_PERSONAL_NUMBER = process.env.ADMIN_PERSONAL_NUMBER || '5219621873930';
const COMMAND_PREFIX = process.env.COMMAND_PREFIX || '!';
const SESSION_TIMEOUT = 15 * 60 * 1000;
const DEFAULT_PAUSE_DURATION = 30;
const ENABLE_AI = 0;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || '';

// URLs de API
const API_BASE_URL = process.env.API_BASE_URL || '';
const API_PASSWORD = process.env.API_PASSWORD || '';
const MANAGEMENT_SERVER_URL = 'http://localhost:8080';

// Configuración cargada de variables de entorno con fallbacks seguros
const BOT_NAME = process.env.BOT_NAME || 'asas';
const COMPANY_NAME = process.env.COMPANY_NAME || 'asas';
const BOT_PLAN = process.env.PLAN || 'emprendedor';

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

// Configuración de Express para API local
const appExpress = express();
const PORT = process.env.BOT_PORT || 3000;

appExpress.use(cors());
appExpress.use(express.json());
appExpress.use(express.urlencoded({ extended: true }));

// ================= CARGA DE FLUJOS Y CONFIGURACIÓN =================
// Cargar flujos, mensajes y APIs desde la configuración generada
const botFlows = [
    {
        "name": "MENU_PRINCIPAL",
        "description": "Menú principal del bot",
        "steps": [
            "INITIAL",
            "AWAITING_CHOICE"
        ],
        "options": [
            {
                "number": 1,
                "text": "Información y Servicios",
                "action": "info"
            },
            {
                "number": 2,
                "text": "Consultar Estado",
                "action": "status"
            },
            {
                "number": 3,
                "text": "Hablar con Asesor",
                "action": "human"
            },
            {
                "number": 4,
                "text": "Acerca de Nosotros",
                "action": "about"
            },
            {
                "number": 5,
                "text": "Salir",
                "action": "exit"
            }
        ]
    }
];

const botMessages = {
    "greetings": {
        "morning": "¡Buenos días! 🌅 ¿Cómo puedo ayudarte hoy?",
        "afternoon": "¡Buenas tardes! 🌞 ¿En qué puedo asistirte?",
        "evening": "¡Buenas noches! 🌙 ¿Cómo puedo ayudarte?",
        "newUser": "¡Hola! Veo que es tu primera vez aquí. Te explico brevemente cómo funciono..."
    },
    "errors": {
        "invalidOption": "❌ Opción no válida. Por favor, selecciona una opción del menú.",
        "apiError": "😔 Ups, algo salió mal. Por favor, intenta de nuevo en unos momentos.",
        "outsideHours": "🕐 Estamos fuera de horario de atención.",
        "userPaused": "⏸️ El asistente está pausado. Escribe \"reactivar\" para continuar."
    },
    "confirmations": {
        "dataSaved": "✅ Información guardada correctamente.",
        "processComplete": "🎉 ¡Proceso completado exitosamente!",
        "waitingResponse": "⏳ Procesando tu solicitud, por favor espera...",
        "goodbye": "👋 ¡Gracias por contactarnos! Que tengas un excelente día."
    }
};

const botAPIs = {};

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
            console.log(`[SessionManager] Limpiadas ${cleanedCount} sesiones inactivas.`);
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
            data: {},
            lastInteraction: Date.now(),
            retryCount: 0,
        };
        this.sessions.set(userId, session);
        console.log(`[SessionManager] Nueva sesión creada para: ${userId}`);
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
        console.log(`[SessionManager] Sesión eliminada para: ${userId}`);
    }
}

const sessionManager = new SessionManager();

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
                console.log(`[CONFIG] ${config.flows.length} flujos cargados`);
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

// Función segura para enviar eventos al servidor de gestión
async function safeServerNotification(endpoint, data) {
    try {
        console.log(`[NOTIFICATION] Enviando a ${endpoint}:`, data);
        
        const response = await axios.post(`${MANAGEMENT_SERVER_URL}/${endpoint}`, data, {
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log(`[NOTIFICATION] Respuesta de ${endpoint}:`, response.data);
        return true;
    } catch (error) {
        if (error.response) {
            console.error(`[NOTIFICATION] Error HTTP ${error.response.status} en ${endpoint}:`, error.response.data);
        } else if (error.request) {
            console.error(`[NOTIFICATION] Sin respuesta de ${endpoint}:`, error.message);
        } else {
            console.error(`[NOTIFICATION] Error configurando petición a ${endpoint}:`, error.message);
        }
        return false;
    }
}

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
        const qrImagePath = path.join(__dirname, `qr_${BOT_ID}.png`);
        await QRCodeImage.toFile(qrImagePath, qr, {
            errorCorrectionLevel: 'H',
            margin: 1,
            scale: 8,
            color: {
                dark: '#25D366',
                light: '#FFFFFF'
            }
        });
        console.log(`[QR] Imagen de QR guardada en: ${qrImagePath}`);
        
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
    console.log(`[READY] Bot: ${BOT_NAME} | Empresa: ${COMPANY_NAME}`);
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
                : `${ADMIN_PERSONAL_NUMBER}@c.us`;
                
            console.log(`[READY] Enviando notificación a admin: ${adminId}`);
            
            const adminMessage = `✅ *Bot iniciado correctamente*\n\n` +
                `🤖 *Nombre:* ${BOT_NAME}\n` +
                `🏢 *Empresa:* ${COMPANY_NAME}\n` +
                `📊 *ID:* ${BOT_ID}\n` +
                `📋 *Plan:* ${BOT_PLAN}\n` +
                `⏱️ *Hora:* ${new Date().toLocaleString()}\n\n` +
                `El bot está listo para recibir mensajes.`;
                
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

// Evento de desconexión
client.on('disconnected', async (reason) => {
    console.log(`[DISCONNECTED] Cliente desconectado: ${reason}`);
    isBotOperational = false;
    
    // Notificar al servidor de gestión
    safeServerNotification('api/bots/events/disconnected', {
        botId: BOT_ID,
        status: 'disconnected',
        reason
    });
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
                   userId === `${ADMIN_PERSONAL_NUMBER}@c.us`;
                   
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
            await client.sendMessage(message.from, `⚠️ Comando desconocido: ${command}\n\nComandos disponibles:\n- ${COMMAND_PREFIX}status\n- ${COMMAND_PREFIX}reload\n- ${COMMAND_PREFIX}pause`);
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
        await client.sendMessage(adminId, `❌ Error: ${error.message}`);
    }
}

// Enviar reporte de estado
async function sendStatusReport(userId) {
    const uptime = Math.floor((Date.now() - botStartTime) / 1000 / 60); // en minutos
    
    const statusMessage = `📊 *Estado del Bot*\n\n` +
        `✅ Bot: *${isBotOperational ? 'Activo' : 'Inactivo'}*\n` +
        `🤖 Nombre: ${BOT_NAME}\n` +
        `🏢 Empresa: ${COMPANY_NAME}\n` +
        `⏱️ Tiempo activo: ${uptime} minutos\n` +
        `📝 Mensajes procesados: ${messagesProcessed}\n` +
        `👥 Sesiones activas: ${sessionManager.sessions.size}\n` +
        `🔄 Última actualización: ${new Date().toLocaleString()}`;
    
    await client.sendMessage(userId, statusMessage);
}

// Procesar mensaje según flujo actual
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
            return; // Ignorar mensajes si está pausado
        }
    }
    
    // Buscar el flujo actual
    const currentFlow = currentBotFlows.find(flow => flow.name === session.currentFlow);
    
    if (!currentFlow) {
        // Si no hay flujo válido, usar el primer flujo disponible o uno por defecto
        if (currentBotFlows.length > 0) {
            session.currentFlow = currentBotFlows[0].name;
            session.step = 'INITIAL';
            await handleFlowStep(currentBotFlows[0], session, message);
        } else {
            // No hay flujos configurados
            await client.sendMessage(userId, 'Lo siento, no hay flujos configurados en este momento.');
        }
        return;
    }
    
    // Procesar según el paso actual
    await handleFlowStep(currentFlow, session, message);
}

// Manejar un paso específico del flujo
async function handleFlowStep(flow, session, message) {
    const userId = message.from;
    const messageBody = message.body.trim();
    
    // Si es paso inicial, mostrar mensaje de bienvenida
    if (session.step === 'INITIAL') {
        // Enviar mensaje de bienvenida del flujo
        let welcomeMessage = '';
        
        // Prioridad: 1) Mensaje del flujo, 2) Mensaje global de saludo, 3) Mensaje por defecto
        if (flow.messages && flow.messages.welcome) {
            welcomeMessage = flow.messages.welcome;
        } else if (currentBotMessages.greetings) {
            // Seleccionar saludo según la hora
            const hour = new Date().getHours();
            if (hour >= 6 && hour < 12) {
                welcomeMessage = currentBotMessages.greetings.morning;
            } else if (hour >= 12 && hour < 18) {
                welcomeMessage = currentBotMessages.greetings.afternoon;
            } else {
                welcomeMessage = currentBotMessages.greetings.evening;
            }
        } else {
            welcomeMessage = `Bienvenido al flujo ${flow.name}`;
        }
                           
        // Reemplazar variables si hay
        welcomeMessage = replaceVariables(welcomeMessage, session);
        
        await client.sendMessage(userId, welcomeMessage);
        
        // Si hay opciones, construir y enviar menú
        if (flow.options && flow.options.length > 0) {
            const menuOptions = flow.options.map(opt => 
                `${opt.emoji || ''} ${opt.text}`
            ).join('\n');
            
            await client.sendMessage(userId, `\n${menuOptions}`);
        }
        
        // Actualizar al siguiente paso
        session.step = 'AWAITING_CHOICE';
        return;
    }
    
    // Si está esperando selección
    if (session.step === 'AWAITING_CHOICE') {
        // Buscar la opción seleccionada
        const selectedOption = flow.options?.find(opt => {
            const userInput = messageBody.toLowerCase().trim();
            
            // Verificar por número
            if (opt.number && opt.number.toString() === messageBody) return true;
            
            // Verificar por emoji
            if (opt.emoji === messageBody) return true;
            
            // Verificar por texto exacto
            if (opt.text && opt.text.toLowerCase() === userInput) return true;
            
            // Verificar por texto parcial (contiene)
            if (opt.text && opt.text.toLowerCase().includes(userInput)) return true;
            
            return false;
        });
        
        if (!selectedOption) {
            // Opción no válida
            const errorMsg = currentBotMessages?.errors?.invalidOption || 
                          '❌ Opción no válida. Por favor, selecciona una opción del menú.';
            await client.sendMessage(userId, errorMsg);
            return;
        }
        
        console.log(`[FLOW] Usuario seleccionó opción: ${selectedOption.text} (acción: ${selectedOption.action})`);
        
        // Procesar la acción de la opción
        await processOptionAction(selectedOption, session, message);
        return;
    }
    
    // Para otros pasos personalizados
    const customStep = flow.steps?.find(step => step === session.step);
    
    if (customStep) {
        // Buscar mensaje asociado a este paso
        const stepMessage = flow.messages?.[customStep];
        
        if (stepMessage) {
            // Enviar mensaje del paso
            await client.sendMessage(userId, replaceVariables(stepMessage, session));
        }
        
        // Actualizar variables con la entrada del usuario
        session.data[customStep] = messageBody;
        
        // Buscar el siguiente paso definido o volver al inicio
        // Esto dependerá de la estructura específica de tu flujo
        session.step = 'INITIAL'; // Por defecto vuelve al inicio
        
        return;
    }
    
    // Si llegamos aquí, el paso no está definido, volver al inicio
    session.step = 'INITIAL';
    await handleFlowStep(flow, session, message);
}

// Procesar acción de una opción seleccionada
async function processOptionAction(option, session, message) {
    const userId = message.from;
    
    console.log(`[ACTION] Procesando acción: ${option.action} con valor: ${option.actionValue}`);
    
    switch (option.action) {
        case 'goToStep':
            // Ir a otro paso en el mismo flujo
            if (option.actionValue) {
                session.step = option.actionValue;
                console.log(`[ACTION] Cambiando a paso: ${option.actionValue}`);
                
                // Buscar el flujo actual
                const currentFlow = currentBotFlows.find(f => f.name === session.currentFlow);
                if (currentFlow) {
                    await handleFlowStep(currentFlow, session, message);
                }
            } else {
                await client.sendMessage(userId, `Has seleccionado: ${option.text}`);
                console.log(`[ACTION] goToStep sin actionValue para: ${option.text}`);
            }
            break;
            
        case 'goToFlow':
            // Ir a otro flujo
            if (option.actionValue) {
                const targetFlow = currentBotFlows.find(f => f.name === option.actionValue);
                
                if (targetFlow) {
                    console.log(`[ACTION] Cambiando a flujo: ${option.actionValue}`);
                    session.currentFlow = option.actionValue;
                    session.step = 'INITIAL';
                    await handleFlowStep(targetFlow, session, message);
                } else {
                    await client.sendMessage(userId, `❌ Error: Flujo ${option.actionValue} no encontrado`);
                    session.step = 'INITIAL';
                }
            } else {
                await client.sendMessage(userId, `Has seleccionado: ${option.text}`);
                console.log(`[ACTION] goToFlow sin actionValue para: ${option.text}`);
            }
            break;
            
        case 'sendMessage':
            // Enviar un mensaje predefinido
            if (option.actionValue) {
                // Buscar mensaje en el flujo actual o en mensajes globales
                let messageToSend = '';
                
                const currentFlow = currentBotFlows.find(f => f.name === session.currentFlow);
                if (currentFlow && currentFlow.messages && currentFlow.messages[option.actionValue]) {
                    messageToSend = currentFlow.messages[option.actionValue];
                } else if (currentBotMessages[option.actionValue]) {
                    messageToSend = currentBotMessages[option.actionValue];
                } else {
                    messageToSend = option.actionValue; // Usar el valor directamente como mensaje
                }
                
                await client.sendMessage(userId, replaceVariables(messageToSend, session));
            } else {
                await client.sendMessage(userId, `Has seleccionado: ${option.text}`);
            }
            break;
            
        // Acciones por defecto para opciones simples
        case 'info':
        case 'about':
        case 'human':
        case 'exit':
            await client.sendMessage(userId, `Has seleccionado: ${option.text}\n\nEsta funcionalidad estará disponible pronto.`);
            break;
            
        default:
            // Acción desconocida o no implementada
            await client.sendMessage(userId, `Seleccionaste: ${option.text}`);
            console.log(`[ACTION] Acción no implementada: ${option.action}`);
    }
}

// ================= INTEGRACIÓN CON IA =================
// IA no habilitada para este bot

// ================= FUNCIONES AUXILIARES =================
// Reemplazar variables en texto
function replaceVariables(text, session) {
    if (!text) return '';
    
    // Reemplazar variables de sistema
    let processed = text
        .replace(/{{fecha}}/g, new Date().toLocaleDateString())
        .replace(/{{hora}}/g, new Date().toLocaleTimeString())
        .replace(/{{bot}}/g, BOT_NAME || 'Bot')
        .replace(/{{empresa}}/g, COMPANY_NAME || 'Empresa')
        .replace(/{{botName}}/g, BOT_NAME || 'Bot')
        .replace(/{{company}}/g, COMPANY_NAME || 'Empresa');
    
    // Reemplazar variables de sesión
    for (const varName in session.data) {
        processed = processed.replace(new RegExp(`\{\{${varName}\}\}`, 'g'), session.data[varName]);
    }
    
    return processed;
}

// ================= API LOCAL DEL BOT =================
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
        const phoneNumber = phone.includes('@c.us') ? phone : `${phone}@c.us`;
        
        // Enviar mensaje
        await client.sendMessage(phoneNumber, message);
        
        res.json({ success: true, message: 'Mensaje enviado exitosamente' });
    } catch (error) {
        console.error('[ERROR] Error API enviar mensaje:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// ================= INICIALIZACIÓN =================
// Iniciar cliente de WhatsApp
(async () => {
    try {
        console.log('[INIT] Iniciando bot de WhatsApp...');
        
        // Inicializar cliente
        await client.initialize();
        
        // Iniciar servidor Express
        appExpress.listen(PORT, () => {
            console.log(`[EXPRESS] API local del bot escuchando en puerto ${PORT}`);
        });
        
        // Reportar inicio al servidor de gestión
        safeServerNotification('api/bots/events/startup', {
            botId: BOT_ID,
            status: 'starting',
            port: PORT
        });
        
    } catch (error) {
        console.error('[CRITICAL] Error iniciando bot:', error.message);
        process.exit(1);
    }
})();
