// Bot WhatsApp - HitzelBot para ht
// Generado automáticamente el 29/5/2025, 11:47:26 p.m.
// ID: bot_1748492436390_ep8ljpem0

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
const BOT_ID = process.env.BOT_ID || 'bot_1748492436390_ep8ljpem0';
const BOT_TOKEN = process.env.BOT_TOKEN || 'K9s03t9lKkCfBH39gXEmrtCXxrpGTEKo';
const ADMIN_PERSONAL_NUMBER = process.env.ADMIN_PERSONAL_NUMBER || '5219621873930';
const COMMAND_PREFIX = process.env.COMMAND_PREFIX || '!';
const SESSION_TIMEOUT = 15 * 60 * 1000;
const DEFAULT_PAUSE_DURATION = 30;
const ENABLE_AI = 1;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || '';

// URLs de API
const API_BASE_URL = process.env.API_BASE_URL || '';
const API_PASSWORD = process.env.API_PASSWORD || '';
const MANAGEMENT_SERVER_URL = 'http://localhost:8080';

// Configuración cargada de variables de entorno con fallbacks seguros
const BOT_NAME = process.env.BOT_NAME || 'HitzelBot';
const COMPANY_NAME = process.env.COMPANY_NAME || 'ht';
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
            previousStep: null,
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
// Manejo ordenado de cierre para finalizar procesos
process.on('SIGTERM', async () => {
    console.log('[SHUTDOWN] Recibida señal SIGTERM, cerrando bot...');
    
    try {
        // Cambiar estado e informar
        isBotOperational = false;
        
        // Notificar al servidor de gestión
        await safeServerNotification('api/bots/events/disconnected', {
            botId: BOT_ID,
            status: 'disconnected',
            reason: 'SIGTERM recibido'
        }).catch(() => console.log('[SHUTDOWN] No se pudo notificar al servidor de gestión'));
        
        // Intentar cerrar cliente de WhatsApp
        if (client) {
            console.log('[SHUTDOWN] Cerrando cliente de WhatsApp...');
            try {
                // Intentar cerrar cliente de WhatsApp limpiamente
                await client.destroy();
                console.log('[SHUTDOWN] Cliente de WhatsApp cerrado correctamente');
            } catch (error) {
                console.error('[SHUTDOWN] Error cerrando cliente de WhatsApp:', error.message);
            }
        }
        
        // Cerrar servidor Express
        console.log('[SHUTDOWN] Cerrando servidor API...');
        server.close(() => {
            console.log('[SHUTDOWN] Servidor API cerrado correctamente');
        });
        
        // Cerrar otras conexiones si existen
        
        // Finalizar proceso después de un tiempo
        setTimeout(() => {
            console.log('[SHUTDOWN] Finalizando proceso...');
            process.exit(0);
        }, 3000);
    } catch (error) {
        console.error('[SHUTDOWN] Error durante cierre:', error);
        process.exit(1);
    }
});

// Añadir también un listener para SIGINT
process.on('SIGINT', () => {
    console.log('[SHUTDOWN] Recibida señal SIGINT, redirigiendo a handler SIGTERM');
    // Redirigir a handler SIGTERM
    process.emit('SIGTERM');
});
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
});


process.on('unhandledRejection', (reason, promise) => {
    console.error('[WARNING] Promesa rechazada no manejada:', reason);
    // No hacemos nada más, solo registramos el error
});

// Detectar desconexiones del servidor de gestión y reconectar
let managementServerReconnectAttempts = 0;
function setupManagementServerReconnection() {
    setInterval(async () => {
        try {
            // Intentar enviar una señal de heartbeat al servidor de gestión
            const response = await axios.get(`${MANAGEMENT_SERVER_URL}/api/health`, { timeout: 5000 });
            if (response.status === 200) {
                managementServerReconnectAttempts = 0;
                // Estamos conectados, nada que hacer
            }
        } catch (error) {
            managementServerReconnectAttempts++;
            console.log(`[CONNECTION] Error conectando con servidor de gestión (intento #${managementServerReconnectAttempts})`);
            
            // Si tenemos demasiados intentos, probablemente el servidor está caído
            // pero seguimos operando independientemente
            if (managementServerReconnectAttempts > 10) {
                console.log('[CONNECTION] Servidor de gestión posiblemente caído, continuando operación independiente');
            }
        }
    }, 30000); // Cada 30 segundos
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
    }).catch(() => console.log('[DISCONNECTED] No se pudo notificar al servidor de gestión'));
    
    // Programar reinicio automático del cliente
    console.log('[DISCONNECTED] Programando reconexión automática...');
    setTimeout(async () => {
        try {
            console.log('[RECONNECT] Intentando reconectar cliente WhatsApp...');
            await client.initialize();
            console.log('[RECONNECT] Intento de reconexión iniciado');
        } catch (error) {
            console.error('[RECONNECT] Error reconectando cliente:', error.message);
            // Programar otro intento más tarde
            setTimeout(() => {
                try {
                    client.initialize();
                } catch (e) {
                    console.error('[RECONNECT] Error en segundo intento de reconexión:', e.message);
                }
            }, 60000); // Esperar 1 minuto antes del siguiente intento
        }
    }, 10000); // Esperar 10 segundos antes de intentar reconectar
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
        
        // Si hay opciones, filtrar por el paso actual (INITIAL) y construir y enviar menú
        if (flow.options && flow.options.length > 0) {
            // Filtrar opciones que pertenecen al paso INITIAL o que no tienen paso definido
            const filteredOptions = flow.options.filter(opt => 
                !opt.step || opt.step === 'INITIAL'
            );
            
            if (filteredOptions.length > 0) {
                const menuOptions = filteredOptions.map(opt => 
                    `${opt.emoji || ''} ${opt.text}`
                ).join('\n');
                
                await client.sendMessage(userId, `\n${menuOptions}`);
            }
        }
        
        // Guardar paso actual para referencia posterior
        session.previousStep = session.step;
        
        // Actualizar al siguiente paso
        session.step = 'AWAITING_CHOICE';
        return;
    }
    
    // Si está esperando selección
    if (session.step === 'AWAITING_CHOICE') {
        // Obtener el paso anterior para filtrar opciones correctamente
        const previousStep = session.previousStep || 'INITIAL';
        
        // Buscar la opción seleccionada entre las opciones filtradas por paso
        const filteredOptions = flow.options?.filter(opt => 
            !opt.step || opt.step === previousStep
        );
        
        const selectedOption = filteredOptions?.find(opt => {
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
    
    // Para otros pasos personalizados (diferentes a INITIAL y AWAITING_CHOICE)
    // Buscar mensaje asociado a este paso si existe
    const currentStepName = session.step;
    const stepMessage = flow.messages?.[currentStepName];
    
    if (stepMessage) {
        // Enviar mensaje del paso
        await client.sendMessage(userId, replaceVariables(stepMessage, session));
    }
    
    // Mostrar opciones correspondientes a este paso específico
    if (flow.options && flow.options.length > 0) {
        // Filtrar opciones que pertenecen al paso actual
        const stepOptions = flow.options.filter(opt => 
            opt.step === currentStepName
        );
        
        if (stepOptions.length > 0) {
            const menuOptions = stepOptions.map(opt => 
                `${opt.emoji || ''} ${opt.text}`
            ).join('\n');
            
            await client.sendMessage(userId, `\n${menuOptions}`);
        }
    }
    
    // Guardar paso actual como paso anterior para referencia
    session.previousStep = session.step;
    
    // Actualizar al paso de espera para procesar la elección del usuario
    session.step = 'AWAITING_CHOICE';
    
    // Si no hay opciones para este paso, guardar la entrada del usuario y 
    // continuar al siguiente paso según la lógica del flujo
    if (!flow.options || !flow.options.some(opt => opt.step === currentStepName)) {
        // Actualizar variables con la entrada del usuario
        session.data[currentStepName] = messageBody;
        
        // Por ahora volvemos al inicio, esto se podría mejorar con una
        // estructura de pasos secuenciales en el flujo
        session.step = 'INITIAL';
        await handleFlowStep(flow, session, message);
    }
}

// Procesar acción de una opción seleccionada
async function processOptionAction(option, session, message) {
    const userId = message.from;
    
    console.log(`[ACTION] Procesando acción: ${option.action} con valor: ${option.actionValue}`);
    
    // Guardar paso actual como paso anterior para referencia
    session.previousStep = session.step;
    
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
                
                // Volver al paso inicial después de enviar el mensaje
                session.step = 'INITIAL';
                await handleFlowStep(currentFlow, session, message);
            } else {
                await client.sendMessage(userId, `Has seleccionado: ${option.text}`);
                // Mantener en el mismo paso
                session.step = 'AWAITING_CHOICE';
            }
            break;
            
        // Acciones por defecto para opciones simples
        case 'info':
        case 'about':
        case 'human':
        case 'exit':
            await client.sendMessage(userId, `Has seleccionado: ${option.text}\n\nEsta funcionalidad estará disponible pronto.`);
            // Volver al paso inicial después de estas acciones simples
            session.step = 'INITIAL';
            
            // Buscar el flujo actual
            const currentFlow = currentBotFlows.find(f => f.name === session.currentFlow);
            if (currentFlow) {
                await handleFlowStep(currentFlow, session, message);
            }
            break;
            
        default:
            // Acción desconocida o no implementada
            await client.sendMessage(userId, `Seleccionaste: ${option.text}`);
            console.log(`[ACTION] Acción no implementada: ${option.action}`);
            
            // Volver al paso inicial como comportamiento por defecto
            session.step = 'INITIAL';
            
            // Buscar el flujo actual
            const defaultFlow = currentBotFlows.find(f => f.name === session.currentFlow);
            if (defaultFlow) {
                await handleFlowStep(defaultFlow, session, message);
            }
    }
}

// ================= INTEGRACIÓN CON IA =================

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
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GOOGLE_API_KEY}`,
            {
                contents: [
                    {
                        parts: [
                            { text: `${prompt}\n\nConsulta del usuario: ${messageBody}` }
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
}

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

// Endpoint de health para heartbeat
appExpress.get('/health', (req, res) => {
    res.json({
        botId: BOT_ID,
        status: isBotOperational ? 'running' : 'stopped',
        timestamp: Date.now(),
        uptime: Date.now() - botStartTime
    });
});

// Iniciar heartbeat al servidor de gestión
setInterval(async () => {
    if (isBotOperational) {
        try {
            // Enviar heartbeat al servidor de gestión
            await axios.post('${MANAGEMENT_SERVER_URL}/api/bots/events/heartbeat', {
                botId: BOT_ID,
                status: 'running',
                timestamp: Date.now()
            }, {
                timeout: 5000
            });
        } catch (error) {
            // Si falla el heartbeat, no hacer nada especial
            // Solo registrar el error si es diferente a un timeout
            if (!error.code === 'ECONNABORTED') {
                console.error('[HEARTBEAT] Error:', error.message);
            }
        }
    }
}, 60000); // cada minuto

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
        const server = appExpress.listen(PORT, () => {
            console.log(`[EXPRESS] API local del bot escuchando en puerto ${PORT}`);
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
