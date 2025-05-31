// Bot WhatsApp - bot para bot
// Generado automáticamente el 30/5/2025, 3:03:57 p.m.
// ID: bot_1748333311392_2rx2d7bxx

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
const BOT_ID = process.env.BOT_ID || 'bot_1748333311392_2rx2d7bxx';
const BOT_TOKEN = process.env.BOT_TOKEN || 'g1RaZU9TC9StCe5a2BDpWqahbIbvrdFc';
const ADMIN_PERSONAL_NUMBER = process.env.ADMIN_PERSONAL_NUMBER || '5219621873930';
const COMMAND_PREFIX = process.env.COMMAND_PREFIX || '!';
const SESSION_TIMEOUT = 15 * 60 * 1000;
const DEFAULT_PAUSE_DURATION = 30;
const ENABLE_AI = 1;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || 'ABCDEFG123456';

// URLs de API
const API_BASE_URL = process.env.API_BASE_URL || '';
const API_PASSWORD = process.env.API_PASSWORD || '';
const MANAGEMENT_SERVER_URL = 'http://localhost:8080';

// Configuración cargada de variables de entorno con fallbacks seguros
const BOT_NAME = process.env.BOT_NAME || 'bot';
const COMPANY_NAME = process.env.COMPANY_NAME || 'bot';
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
const botFlows = [
    {
        "name": "MENU_PRINCIPAL",
        "description": "Menú principal para el bot",
        "steps": [
            "INITIAL",
            "AWAITING_CHOICE"
        ],
        "options": [
            {
                "number": 1,
                "emoji": "1️⃣",
                "text": "Servicios",
                "action": "goToFlow",
                "actionValue": "MENU_SERVICIOS",
                "step": "INITIAL"
            },
            {
                "number": 2,
                "emoji": "2️⃣",
                "text": "Consultar Estado",
                "action": "goToFlow",
                "actionValue": "CONSULTA_ESTADO",
                "step": "INITIAL"
            },
            {
                "number": 3,
                "emoji": "3️⃣",
                "text": "Hablar con Asesor",
                "action": "sendMessage",
                "actionValue": "CONTACTAR_ASESOR",
                "step": "INITIAL"
            },
            {
                "number": 4,
                "emoji": "4️⃣",
                "text": "Acerca de Nosotros",
                "action": "sendMessage",
                "actionValue": "ACERCA_DE",
                "step": "INITIAL"
            },
            {
                "number": 5,
                "emoji": "5️⃣",
                "text": "Programa de lealtad",
                "action": "goToFlow",
                "actionValue": "PROGRAMA_LEALTAD",
                "step": "INITIAL"
            },
            {
                "number": 6,
                "emoji": "6️⃣",
                "text": "EDUCATIVO",
                "action": "goToFlow",
                "actionValue": "CHATBOT_EDUCATIVO",
                "step": "INITIAL"
            },
            {
                "number": 7,
                "emoji": "7️⃣",
                "text": "FOTO",
                "action": "sendMedia",
                "actionValue": "https://servjogm.com/assets/js/bot_whatsapp/folleto/folleto_6.jpg",
                "step": "INITIAL"
            },
            {
                "number": 8,
                "emoji": "8️⃣",
                "text": "CITAS",
                "action": "goToFlow",
                "actionValue": "PROCESO_RESERVACION",
                "step": "INITIAL"
            },
            {
                "number": 9,
                "emoji": "9️⃣",
                "text": "TUTORIAL ONBOARDING",
                "action": "goToFlow",
                "actionValue": "TUTORIAL_ONBOARDING",
                "step": "INITIAL"
            },
            {
                "number": 10,
                "emoji": "1️⃣",
                "text": "VIDEO",
                "action": "sendMedia",
                "actionValue": "https://file-examples.com/storage/fe32c8d6966839f839df247/2017/04/file_example_MP4_480_1_5MG.mp4",
                "step": "INITIAL"
            }
        ],
        "messages": {
            "welcome": "¡Hola! 👋 Bienvenido al asistente virtual. ¿En qué puedo ayudarte hoy?",
            "CONTACTAR_ASESOR": "En breve un asesor se comunicará contigo. Por favor, describe tu consulta.",
            "ACERCA_DE": "Somos una empresa dedicada a brindar soluciones eficientes para tu negocio.",
            "foto": "Nuevo mensaje"
        },
        "active": true,
        "conditions": [],
        "variables": {},
        "validations": {},
        "loops": [],
        "timers": [],
        "schedules": {
            "enabled": false,
            "workingHours": {
                "monday": {
                    "start": "09:00",
                    "end": "18:00",
                    "active": true
                },
                "tuesday": {
                    "start": "09:00",
                    "end": "18:00",
                    "active": true
                }
            },
            "timezone": "America/Mexico_City",
            "outsideHoursMessage": "Estamos fuera de horario"
        }
    },
    {
        "name": "CONSULTA_ESTADO",
        "description": "Consulta de estado de servicios o pedidos",
        "steps": [
            "INITIAL",
            "ENTER_ID",
            "SHOW_STATUS"
        ],
        "options": [
            {
                "number": 1,
                "emoji": "🔍",
                "text": "Consultar estado",
                "action": "goToStep",
                "actionValue": "ENTER_ID",
                "step": "INITIAL"
            },
            {
                "number": 2,
                "emoji": "📦",
                "text": "Mis pedidos recientes",
                "action": "sendMessage",
                "actionValue": "PEDIDOS_RECIENTES",
                "step": "INITIAL"
            },
            {
                "number": 3,
                "emoji": "⬅️",
                "text": "Regresar al Menú",
                "action": "goToFlow",
                "actionValue": "MENU_PRINCIPAL",
                "step": "INITIAL"
            },
            {
                "number": 1,
                "emoji": "🔄",
                "text": "Nueva Consulta",
                "action": "goToStep",
                "actionValue": "ENTER_ID",
                "step": "INITIAL"
            },
            {
                "number": 2,
                "emoji": "📞",
                "text": "Contactar Soporte",
                "action": "sendMessage",
                "actionValue": "CONTACTAR_SOPORTE",
                "step": "INITIAL"
            },
            {
                "number": 3,
                "emoji": "⬅️",
                "text": "Regresar al Menú",
                "action": "goToFlow",
                "actionValue": "MENU_PRINCIPAL",
                "step": "INITIAL"
            }
        ],
        "messages": {
            "welcome": "🔍 *Consulta de Estado*\n\n¿Qué deseas hacer?",
            "ENTER_ID": "Por favor, envía el número de folio o ID de tu servicio:",
            "searching": "⏳ Buscando información del folio ${id}...",
            "SHOW_STATUS": "📋 *Resultado de la consulta:*\n\nFolio: ${id}\nEstatus: ${status}\nÚltima actualización: ${date}",
            "notFound": "❌ No se encontró información para el folio ${id}. Verifica que el número sea correcto.",
            "CONTACTAR_SOPORTE": "Un agente de soporte se comunicará contigo en breve para ayudarte con tu consulta.",
            "PEDIDOS_RECIENTES": "No se encontraron pedidos recientes asociados a tu cuenta."
        },
        "active": true,
        "conditions": [],
        "variables": {},
        "validations": {},
        "loops": [],
        "timers": [],
        "schedules": {
            "enabled": false,
            "workingHours": {
                "monday": {
                    "start": "09:00",
                    "end": "18:00",
                    "active": true
                },
                "tuesday": {
                    "start": "09:00",
                    "end": "18:00",
                    "active": true
                }
            },
            "timezone": "America/Mexico_City",
            "outsideHoursMessage": "Estamos fuera de horario"
        }
    },
    {
        "name": "PROGRAMA_LEALTAD",
        "description": "Gestión del programa de lealtad o puntos",
        "steps": [
            "INITIAL",
            "CONSULTAR_PUNTOS",
            "CANJEAR_PUNTOS",
            "BENEFICIOS",
            "HISTORIAL"
        ],
        "options": [
            {
                "number": 1,
                "emoji": "🔍",
                "text": "Consultar Puntos",
                "action": "goToStep",
                "actionValue": "CONSULTAR_PUNTOS",
                "step": "INITIAL"
            },
            {
                "number": 2,
                "emoji": "🎁",
                "text": "Canjear Puntos",
                "action": "goToStep",
                "actionValue": "CANJEAR_PUNTOS",
                "step": "INITIAL"
            },
            {
                "number": 3,
                "emoji": "⭐",
                "text": "Beneficios",
                "action": "goToStep",
                "actionValue": "BENEFICIOS",
                "step": "INITIAL"
            },
            {
                "number": 4,
                "emoji": "📜",
                "text": "Historial",
                "action": "goToStep",
                "actionValue": "HISTORIAL",
                "step": "INITIAL"
            },
            {
                "number": 5,
                "emoji": "❓",
                "text": "Preguntas Frecuentes",
                "action": "sendMessage",
                "actionValue": "FAQ_LEALTAD",
                "step": "INITIAL"
            },
            {
                "number": 6,
                "emoji": "⬅️",
                "text": "Regresar",
                "action": "goToFlow",
                "actionValue": "MENU_PRINCIPAL",
                "step": "INITIAL"
            },
            {
                "number": 1,
                "emoji": "🎁",
                "text": "Canjear Puntos",
                "action": "goToStep",
                "actionValue": "CANJEAR_PUNTOS",
                "step": "CONSULTAR_PUNTOS"
            },
            {
                "number": 2,
                "emoji": "⭐",
                "text": "Ver Beneficios",
                "action": "goToStep",
                "actionValue": "BENEFICIOS",
                "step": "CONSULTAR_PUNTOS"
            },
            {
                "number": 3,
                "emoji": "⬅️",
                "text": "Regresar",
                "action": "goToFlow",
                "actionValue": "MENU_PRINCIPAL",
                "step": "CONSULTAR_PUNTOS"
            },
            {
                "number": 1,
                "emoji": "🎁",
                "text": "Recompensa 1",
                "action": "sendMessage",
                "actionValue": "CANJEAR_RECOMPENSA_1",
                "step": "CANJEAR_PUNTOS"
            },
            {
                "number": 2,
                "emoji": "🎁",
                "text": "Recompensa 2",
                "action": "sendMessage",
                "actionValue": "CANJEAR_RECOMPENSA_2",
                "step": "CANJEAR_PUNTOS"
            },
            {
                "number": 3,
                "emoji": "🎁",
                "text": "Recompensa 3",
                "action": "sendMessage",
                "actionValue": "CANJEAR_RECOMPENSA_3",
                "step": "CANJEAR_PUNTOS"
            },
            {
                "number": 4,
                "emoji": "⬅️",
                "text": "Regresar",
                "action": "goToStep",
                "actionValue": "INITIAL",
                "step": "CANJEAR_PUNTOS"
            },
            {
                "number": 1,
                "emoji": "🔍",
                "text": "Consultar mis puntos",
                "action": "goToStep",
                "actionValue": "CONSULTAR_PUNTOS",
                "step": "BENEFICIOS"
            },
            {
                "number": 2,
                "emoji": "🎁",
                "text": "Canjear puntos",
                "action": "goToStep",
                "actionValue": "CANJEAR_PUNTOS",
                "step": "BENEFICIOS"
            },
            {
                "number": 3,
                "emoji": "⬅️",
                "text": "Regresar",
                "action": "goToStep",
                "actionValue": "INITIAL",
                "step": "BENEFICIOS"
            },
            {
                "number": 1,
                "emoji": "🔍",
                "text": "Filtrar por fecha",
                "action": "sendMessage",
                "actionValue": "FILTRAR_HISTORIAL",
                "step": "HISTORIAL"
            },
            {
                "number": 2,
                "emoji": "📊",
                "text": "Estadísticas",
                "action": "sendMessage",
                "actionValue": "ESTADISTICAS_PUNTOS",
                "step": "HISTORIAL"
            },
            {
                "number": 3,
                "emoji": "⬅️",
                "text": "Regresar",
                "action": "goToStep",
                "actionValue": "INITIAL",
                "step": "HISTORIAL"
            },
            {
                "number": 7,
                "emoji": "1️⃣",
                "text": "Menu",
                "action": "goToFlow",
                "actionValue": "MENU_PRINCIPAL",
                "step": "CONSULTAR_PUNTOS"
            }
        ],
        "messages": {
            "welcome": "🏆 *Programa de Lealtad*\n\n¡Bienvenido a tu portal de fidelización! ¿Qué deseas hacer hoy?",
            "CONSULTAR_PUNTOS": "💯 *Tus Puntos Actuales*\n\nTienes ${puntos} puntos disponibles.\nNivel: ${nivel}\nPuntos para siguiente nivel: ${puntosProximoNivel}",
            "CANJEAR_PUNTOS": "🎁 *Catálogo de Recompensas*\n\nPuntos disponibles: ${puntos}\n\n${recompensas}\n\nSelecciona una recompensa para canjear:",
            "confirmacionCanje": "⚠️ ¿Estás seguro de canjear ${puntosRecompensa} puntos por \"${nombreRecompensa}\"?",
            "canjeExitoso": "✅ *¡Canje Exitoso!*\n\nHas canjeado ${puntosRecompensa} puntos por \"${nombreRecompensa}\".\n\nPuntos restantes: ${puntosRestantes}\n\nHemos enviado los detalles a tu correo electrónico.",
            "BENEFICIOS": "⭐ *Beneficios por Nivel*\n\n${beneficios}",
            "HISTORIAL": "📜 *Historial de Puntos*\n\n${historial}",
            "FAQ_LEALTAD": "❓ *Preguntas Frecuentes - Programa de Lealtad*\n\n1️⃣ ¿Cómo acumulo puntos?\nPor cada compra que realices acumulas 1 punto por cada $10 gastados.\n\n2️⃣ ¿Cuándo vencen mis puntos?\nLos puntos tienen una vigencia de 12 meses a partir de su obtención.\n\n3️⃣ ¿Cómo subo de nivel?\nAl acumular cierta cantidad de puntos en un periodo de 6 meses.",
            "CANJEAR_RECOMPENSA_1": "⚠️ ¿Estás seguro de canjear 500 puntos por \"Descuento de $100\"?",
            "CANJEAR_RECOMPENSA_2": "⚠️ ¿Estás seguro de canjear 1000 puntos por \"Producto gratis\"?",
            "CANJEAR_RECOMPENSA_3": "⚠️ ¿Estás seguro de canjear 2000 puntos por \"Servicio premium\"?",
            "FILTRAR_HISTORIAL": "Por favor, indica el rango de fechas que deseas consultar (DD/MM/AAAA - DD/MM/AAAA):",
            "ESTADISTICAS_PUNTOS": "📊 *Estadísticas de tus Puntos*\n\nPuntos acumulados este año: ${puntosAnual}\nPromedio mensual: ${promedioMensual}\nMes con más puntos: ${mejorMes}\nPuntos canjeados: ${puntosCanjeados}"
        },
        "active": true,
        "conditions": [],
        "variables": {},
        "validations": {},
        "loops": [],
        "timers": [],
        "schedules": {
            "enabled": false,
            "workingHours": {
                "monday": {
                    "start": "09:00",
                    "end": "18:00",
                    "active": true
                },
                "tuesday": {
                    "start": "09:00",
                    "end": "18:00",
                    "active": true
                }
            },
            "timezone": "America/Mexico_City",
            "outsideHoursMessage": "Estamos fuera de horario"
        }
    },
    {
        "name": "CHATBOT_EDUCATIVO",
        "description": "Sistema de cursos y aprendizaje interactivo",
        "steps": [
            "INITIAL",
            "CATEGORIAS_CURSOS",
            "LISTAR_CURSOS",
            "DETALLE_CURSO",
            "LECCION",
            "QUIZ"
        ],
        "options": [
            {
                "number": 1,
                "emoji": "📚",
                "text": "Explorar Cursos",
                "action": "goToStep",
                "actionValue": "CATEGORIAS_CURSOS",
                "step": "INITIAL"
            },
            {
                "number": 2,
                "emoji": "🎓",
                "text": "Mis Cursos",
                "action": "sendMessage",
                "actionValue": "MIS_CURSOS",
                "step": "INITIAL"
            },
            {
                "number": 3,
                "emoji": "🔍",
                "text": "Buscar Curso",
                "action": "sendMessage",
                "actionValue": "BUSCAR_CURSO",
                "step": "INITIAL"
            },
            {
                "number": 4,
                "emoji": "📊",
                "text": "Mi Progreso",
                "action": "sendMessage",
                "actionValue": "MI_PROGRESO",
                "step": "INITIAL"
            },
            {
                "number": 5,
                "emoji": "📝",
                "text": "Certificaciones",
                "action": "sendMessage",
                "actionValue": "CERTIFICACIONES",
                "step": "INITIAL"
            },
            {
                "number": 6,
                "emoji": "⬅️",
                "text": "Regresar",
                "action": "goToFlow",
                "actionValue": "MENU_PRINCIPAL",
                "step": "INITIAL"
            },
            {
                "number": 1,
                "emoji": "💻",
                "text": "Tecnología",
                "action": "goToStep",
                "actionValue": "LISTAR_CURSOS",
                "step": "CATEGORIAS_CURSOS"
            },
            {
                "number": 2,
                "emoji": "💼",
                "text": "Negocios",
                "action": "goToStep",
                "actionValue": "LISTAR_CURSOS",
                "step": "CATEGORIAS_CURSOS"
            },
            {
                "number": 3,
                "emoji": "🎨",
                "text": "Diseño",
                "action": "goToStep",
                "actionValue": "LISTAR_CURSOS",
                "step": "CATEGORIAS_CURSOS"
            },
            {
                "number": 4,
                "emoji": "🗣️",
                "text": "Idiomas",
                "action": "goToStep",
                "actionValue": "LISTAR_CURSOS",
                "step": "CATEGORIAS_CURSOS"
            },
            {
                "number": 5,
                "emoji": "⬅️",
                "text": "Volver al inicio",
                "action": "goToStep",
                "actionValue": "INITIAL",
                "step": "CATEGORIAS_CURSOS"
            },
            {
                "number": 1,
                "emoji": "📘",
                "text": "Curso 1",
                "action": "goToStep",
                "actionValue": "DETALLE_CURSO",
                "step": "LISTAR_CURSOS"
            },
            {
                "number": 2,
                "emoji": "📘",
                "text": "Curso 2",
                "action": "goToStep",
                "actionValue": "DETALLE_CURSO",
                "step": "LISTAR_CURSOS"
            },
            {
                "number": 3,
                "emoji": "📘",
                "text": "Curso 3",
                "action": "goToStep",
                "actionValue": "DETALLE_CURSO",
                "step": "LISTAR_CURSOS"
            },
            {
                "number": 4,
                "emoji": "🔍",
                "text": "Buscar",
                "action": "sendMessage",
                "actionValue": "BUSCAR_CURSO",
                "step": "LISTAR_CURSOS"
            },
            {
                "number": 5,
                "emoji": "⬅️",
                "text": "Volver a categorías",
                "action": "goToStep",
                "actionValue": "CATEGORIAS_CURSOS",
                "step": "LISTAR_CURSOS"
            },
            {
                "number": 1,
                "emoji": "✅",
                "text": "Inscribirme",
                "action": "sendMessage",
                "actionValue": "INSCRIPCION_CURSO",
                "step": "DETALLE_CURSO"
            },
            {
                "number": 2,
                "emoji": "📝",
                "text": "Ver temario",
                "action": "sendMessage",
                "actionValue": "VER_TEMARIO",
                "step": "DETALLE_CURSO"
            },
            {
                "number": 3,
                "emoji": "👨‍🏫",
                "text": "Información del instructor",
                "action": "sendMessage",
                "actionValue": "INFO_INSTRUCTOR",
                "step": "DETALLE_CURSO"
            },
            {
                "number": 4,
                "emoji": "📖",
                "text": "Iniciar primera lección",
                "action": "goToStep",
                "actionValue": "LECCION",
                "step": "DETALLE_CURSO"
            },
            {
                "number": 5,
                "emoji": "⬅️",
                "text": "Volver a cursos",
                "action": "goToStep",
                "actionValue": "LISTAR_CURSOS",
                "step": "DETALLE_CURSO"
            },
            {
                "number": 1,
                "emoji": "➡️",
                "text": "Siguiente lección",
                "action": "sendMessage",
                "actionValue": "SIGUIENTE_LECCION",
                "step": "LECCION"
            },
            {
                "number": 2,
                "emoji": "⬅️",
                "text": "Lección anterior",
                "action": "sendMessage",
                "actionValue": "LECCION_ANTERIOR",
                "step": "LECCION"
            },
            {
                "number": 3,
                "emoji": "❓",
                "text": "Realizar quiz",
                "action": "goToStep",
                "actionValue": "QUIZ",
                "step": "LECCION"
            },
            {
                "number": 4,
                "emoji": "📋",
                "text": "Índice del curso",
                "action": "goToStep",
                "actionValue": "DETALLE_CURSO",
                "step": "LECCION"
            },
            {
                "number": 1,
                "emoji": "A",
                "text": "Opción A",
                "action": "sendMessage",
                "actionValue": "RESPUESTA_A",
                "step": "QUIZ"
            },
            {
                "number": 2,
                "emoji": "B",
                "text": "Opción B",
                "action": "sendMessage",
                "actionValue": "RESPUESTA_B",
                "step": "QUIZ"
            },
            {
                "number": 3,
                "emoji": "C",
                "text": "Opción C",
                "action": "sendMessage",
                "actionValue": "RESPUESTA_C",
                "step": "QUIZ"
            },
            {
                "number": 4,
                "emoji": "D",
                "text": "Opción D",
                "action": "sendMessage",
                "actionValue": "RESPUESTA_D",
                "step": "QUIZ"
            },
            {
                "number": 5,
                "emoji": "⬅️",
                "text": "Volver a la lección",
                "action": "goToStep",
                "actionValue": "LECCION",
                "step": "QUIZ"
            }
        ],
        "messages": {
            "welcome": "🎓 *Plataforma Educativa*\n\n¡Bienvenido a tu portal de aprendizaje! ¿Qué deseas hacer hoy?",
            "CATEGORIAS_CURSOS": "📚 *Categorías de Cursos*\n\nSelecciona una categoría para explorar:",
            "LISTAR_CURSOS": "📖 *Cursos de ${categoria}*\n\n${cursos}\n\nSelecciona un curso para ver detalles:",
            "DETALLE_CURSO": "📋 *${nombreCurso}*\n\nDuración: ${duracion}\nNivel: ${nivel}\nInstructor: ${instructor}\n\nDescripción: ${descripcion}\n\nContenido: ${contenido}\n\n¿Deseas inscribirte en este curso?",
            "INSCRIPCION_CURSO": "✅ *¡Inscripción Exitosa!*\n\nTe has inscrito correctamente al curso \"${nombreCurso}\".\n\n¿Deseas comenzar ahora tu primera lección?",
            "LECCION": "📝 *Lección ${numeroLeccion}: ${tituloLeccion}*\n\n${contenidoLeccion}\n\n¿Deseas continuar con la siguiente lección o realizar un quiz para evaluar tu aprendizaje?",
            "QUIZ": "❓ *Quiz - ${tituloLeccion}*\n\n${pregunta}\n\nSelecciona la respuesta correcta:",
            "resultadoQuiz": "📊 *Resultado del Quiz*\n\nRespuestas correctas: ${correctas}/${total}\n\n¡${mensaje}!",
            "MIS_CURSOS": "📚 *Mis Cursos*\n\n${cursos}\n\nSelecciona un curso para continuar:",
            "BUSCAR_CURSO": "🔍 Por favor, escribe el nombre o palabra clave del curso que deseas buscar:",
            "MI_PROGRESO": "📊 *Mi Progreso*\n\n${progreso}",
            "CERTIFICACIONES": "🎓 *Mis Certificaciones*\n\n${certificaciones}",
            "VER_TEMARIO": "📑 *Temario del curso ${nombreCurso}*\n\n${temario}",
            "INFO_INSTRUCTOR": "👨‍🏫 *Información del Instructor*\n\nNombre: ${nombreInstructor}\nEspecialidad: ${especialidad}\nExperiencia: ${experiencia}\n\n${bioInstructor}",
            "SIGUIENTE_LECCION": "⏭️ Avanzando a la siguiente lección...",
            "LECCION_ANTERIOR": "⏮️ Volviendo a la lección anterior...",
            "RESPUESTA_A": "✅ ¡Respuesta correcta! / ❌ Respuesta incorrecta. La respuesta correcta es: ${respuestaCorrecta}",
            "RESPUESTA_B": "✅ ¡Respuesta correcta! / ❌ Respuesta incorrecta. La respuesta correcta es: ${respuestaCorrecta}",
            "RESPUESTA_C": "✅ ¡Respuesta correcta! / ❌ Respuesta incorrecta. La respuesta correcta es: ${respuestaCorrecta}",
            "RESPUESTA_D": "✅ ¡Respuesta correcta! / ❌ Respuesta incorrecta. La respuesta correcta es: ${respuestaCorrecta}"
        },
        "active": true,
        "conditions": [],
        "variables": {},
        "validations": {},
        "loops": [],
        "timers": [],
        "schedules": {
            "enabled": false,
            "workingHours": {
                "monday": {
                    "start": "09:00",
                    "end": "18:00",
                    "active": true
                },
                "tuesday": {
                    "start": "09:00",
                    "end": "18:00",
                    "active": true
                }
            },
            "timezone": "America/Mexico_City",
            "outsideHoursMessage": "Estamos fuera de horario"
        }
    },
    {
        "name": "PROCESO_RESERVACION",
        "description": "Sistema completo para reservaciones",
        "steps": [
            "INITIAL",
            "SELECCIONAR_SERVICIO",
            "SELECCIONAR_FECHA",
            "SELECCIONAR_HORA",
            "DATOS_CLIENTE",
            "CONFIRMAR_RESERVA"
        ],
        "options": [
            {
                "number": 1,
                "emoji": "📅",
                "text": "Nueva reservación",
                "action": "goToStep",
                "actionValue": "SELECCIONAR_SERVICIO",
                "step": "INITIAL"
            },
            {
                "number": 2,
                "emoji": "🔍",
                "text": "Mis reservaciones",
                "action": "sendMessage",
                "actionValue": "MIS_RESERVACIONES",
                "step": "INITIAL"
            },
            {
                "number": 3,
                "emoji": "❓",
                "text": "Preguntas frecuentes",
                "action": "sendMessage",
                "actionValue": "FAQ_RESERVACIONES",
                "step": "INITIAL"
            },
            {
                "number": 4,
                "emoji": "⬅️",
                "text": "Regresar al menú",
                "action": "goToFlow",
                "actionValue": "MENU_PRINCIPAL",
                "step": "INITIAL"
            },
            {
                "number": 1,
                "emoji": "💇",
                "text": "Servicio 1",
                "action": "goToStep",
                "actionValue": "SELECCIONAR_FECHA",
                "step": "SELECCIONAR_SERVICIO"
            },
            {
                "number": 2,
                "emoji": "💆",
                "text": "Servicio 2",
                "action": "goToStep",
                "actionValue": "SELECCIONAR_FECHA",
                "step": "SELECCIONAR_SERVICIO"
            },
            {
                "number": 3,
                "emoji": "💅",
                "text": "Servicio 3",
                "action": "goToStep",
                "actionValue": "SELECCIONAR_FECHA",
                "step": "SELECCIONAR_SERVICIO"
            },
            {
                "number": 4,
                "emoji": "⬅️",
                "text": "Regresar",
                "action": "goToStep",
                "actionValue": "INITIAL",
                "step": "SELECCIONAR_SERVICIO"
            },
            {
                "number": 1,
                "emoji": "📆",
                "text": "Hoy",
                "action": "goToStep",
                "actionValue": "SELECCIONAR_HORA",
                "step": "SELECCIONAR_FECHA"
            },
            {
                "number": 2,
                "emoji": "📆",
                "text": "Mañana",
                "action": "goToStep",
                "actionValue": "SELECCIONAR_HORA",
                "step": "SELECCIONAR_FECHA"
            },
            {
                "number": 3,
                "emoji": "📆",
                "text": "Esta semana",
                "action": "goToStep",
                "actionValue": "SELECCIONAR_HORA",
                "step": "SELECCIONAR_FECHA"
            },
            {
                "number": 4,
                "emoji": "⬅️",
                "text": "Cambiar servicio",
                "action": "goToStep",
                "actionValue": "SELECCIONAR_SERVICIO",
                "step": "SELECCIONAR_FECHA"
            },
            {
                "number": 1,
                "emoji": "⏰",
                "text": "Mañana (9-12)",
                "action": "goToStep",
                "actionValue": "DATOS_CLIENTE",
                "step": "SELECCIONAR_HORA"
            },
            {
                "number": 2,
                "emoji": "⏰",
                "text": "Tarde (2-5)",
                "action": "goToStep",
                "actionValue": "DATOS_CLIENTE",
                "step": "SELECCIONAR_HORA"
            },
            {
                "number": 3,
                "emoji": "⏰",
                "text": "Noche (6-8)",
                "action": "goToStep",
                "actionValue": "DATOS_CLIENTE",
                "step": "SELECCIONAR_HORA"
            },
            {
                "number": 4,
                "emoji": "⬅️",
                "text": "Cambiar fecha",
                "action": "goToStep",
                "actionValue": "SELECCIONAR_FECHA",
                "step": "SELECCIONAR_HORA"
            },
            {
                "number": 1,
                "emoji": "✅",
                "text": "Confirmar Datos",
                "action": "sendMessage",
                "actionValue": "RESERVA_EXITOSA",
                "step": "CONFIRMAR_RESERVA"
            },
            {
                "number": 2,
                "emoji": "📅",
                "text": "Cambiar Fecha/Hora",
                "action": "goToStep",
                "actionValue": "SELECCIONAR_FECHA",
                "step": "CONFIRMAR_RESERVA"
            },
            {
                "number": 3,
                "emoji": "🔄",
                "text": "Cambiar Servicio",
                "action": "goToStep",
                "actionValue": "SELECCIONAR_SERVICIO",
                "step": "CONFIRMAR_RESERVA"
            },
            {
                "number": 4,
                "emoji": "❌",
                "text": "Cancelar Reserva",
                "action": "goToStep",
                "actionValue": "INITIAL",
                "step": "CONFIRMAR_RESERVA"
            },
            {
                "number": 5,
                "emoji": "1️⃣",
                "text": "Por favor, envía tu nombre completo:",
                "action": "goToStep",
                "actionValue": "CONFIRMAR_RESERVA",
                "step": "CONFIRMAR_RESERVA"
            }
        ],
        "messages": {
            "welcome": "📅 *Sistema de Reservaciones*\n\n¿Qué deseas hacer?",
            "SELECCIONAR_SERVICIO": "Por favor, selecciona el servicio que deseas reservar:",
            "servicioSeleccionado": "Has seleccionado: *${servicio}*\n\nAhora, elige una fecha disponible:",
            "SELECCIONAR_FECHA": "Por favor, selecciona una fecha para tu reserva:",
            "fechaSeleccionada": "Fecha seleccionada: *${fecha}*\n\nPor favor, elige un horario disponible:",
            "SELECCIONAR_HORA": "Selecciona un horario disponible para el ${fecha}:",
            "horaSeleccionada": "Has seleccionado: ${fecha} a las ${hora}.\n\nPor favor, proporciona tus datos de contacto:",
            "DATOS_CLIENTE": "Por favor, envía tu nombre completo:",
            "telefonoCliente": "Gracias, ${nombre}. Ahora, envía tu número telefónico:",
            "emailCliente": "Excelente. Por último, envía tu correo electrónico:",
            "CONFIRMAR_RESERVA": "📋 *Resumen de tu Reserva*\n\nServicio: ${servicio}\nFecha: ${fecha}\nHora: ${hora}\nNombre: ${nombre}\nTeléfono: ${telefono}\nEmail: ${email}\n\n¿Los datos son correctos?",
            "RESERVA_EXITOSA": "✅ *¡Reserva Confirmada!*\n\nTu código de reserva es: ${codigo}\n\nTe hemos enviado un correo con todos los detalles.\n\nRecuerda llegar 15 minutos antes de tu cita.",
            "MIS_RESERVACIONES": "Actualmente no tienes reservaciones activas.",
            "FAQ_RESERVACIONES": "❓ *Preguntas Frecuentes - Reservaciones*\n\n1. ¿Puedo cancelar mi reserva?\nSí, puedes cancelar hasta 24 horas antes sin costo.\n\n2. ¿Qué sucede si llego tarde?\nTenemos una tolerancia de 15 minutos, después de ese tiempo la reserva podría ser cancelada.\n\n3. ¿Cómo puedo reprogramar?\nPuedes reprogramar tu cita hasta 24 horas antes a través de este mismo chat."
        },
        "active": true,
        "conditions": [],
        "variables": {},
        "validations": {},
        "loops": [],
        "timers": [],
        "schedules": {
            "enabled": false,
            "workingHours": {
                "monday": {
                    "start": "09:00",
                    "end": "18:00",
                    "active": true
                },
                "tuesday": {
                    "start": "09:00",
                    "end": "18:00",
                    "active": true
                }
            },
            "timezone": "America/Mexico_City",
            "outsideHoursMessage": "Estamos fuera de horario"
        }
    },
    {
        "name": "TUTORIAL_ONBOARDING",
        "description": "Sistema de tutorial y onboarding para nuevos usuarios",
        "steps": [
            "INITIAL",
            "BIENVENIDA",
            "PASO_1",
            "PASO_2",
            "PASO_3",
            "PASO_4",
            "FINALIZAR"
        ],
        "options": [
            {
                "number": 1,
                "emoji": "▶️",
                "text": "Iniciar tutorial",
                "action": "goToStep",
                "actionValue": "BIENVENIDA",
                "step": "INITIAL"
            },
            {
                "number": 2,
                "emoji": "❓",
                "text": "Preguntas Frecuentes",
                "action": "sendMessage",
                "actionValue": "FAQ_TUTORIAL",
                "step": "INITIAL"
            },
            {
                "number": 3,
                "emoji": "⬅️",
                "text": "Regresar",
                "action": "goToFlow",
                "actionValue": "MENU_PRINCIPAL",
                "step": "INITIAL"
            },
            {
                "number": 1,
                "emoji": "▶️",
                "text": "Continuar",
                "action": "goToStep",
                "actionValue": "PASO_1",
                "step": "BIENVENIDA"
            },
            {
                "number": 2,
                "emoji": "⏩",
                "text": "Saltar Tutorial",
                "action": "goToStep",
                "actionValue": "FINALIZAR",
                "step": "BIENVENIDA"
            },
            {
                "number": 1,
                "emoji": "▶️",
                "text": "Continuar",
                "action": "goToStep",
                "actionValue": "PASO_2",
                "step": "PASO_1"
            },
            {
                "number": 2,
                "emoji": "⏪",
                "text": "Anterior",
                "action": "goToStep",
                "actionValue": "BIENVENIDA",
                "step": "PASO_1"
            },
            {
                "number": 3,
                "emoji": "⏩",
                "text": "Saltar Tutorial",
                "action": "goToStep",
                "actionValue": "FINALIZAR",
                "step": "PASO_1"
            },
            {
                "number": 1,
                "emoji": "▶️",
                "text": "Continuar",
                "action": "goToStep",
                "actionValue": "PASO_3",
                "step": "PASO_2"
            },
            {
                "number": 2,
                "emoji": "⏪",
                "text": "Anterior",
                "action": "goToStep",
                "actionValue": "PASO_1",
                "step": "PASO_2"
            },
            {
                "number": 3,
                "emoji": "⏩",
                "text": "Saltar Tutorial",
                "action": "goToStep",
                "actionValue": "FINALIZAR",
                "step": "PASO_2"
            },
            {
                "number": 1,
                "emoji": "▶️",
                "text": "Continuar",
                "action": "goToStep",
                "actionValue": "PASO_4",
                "step": "PASO_3"
            },
            {
                "number": 2,
                "emoji": "⏪",
                "text": "Anterior",
                "action": "goToStep",
                "actionValue": "PASO_2",
                "step": "PASO_3"
            },
            {
                "number": 3,
                "emoji": "⏩",
                "text": "Saltar Tutorial",
                "action": "goToStep",
                "actionValue": "FINALIZAR",
                "step": "PASO_3"
            },
            {
                "number": 1,
                "emoji": "▶️",
                "text": "Continuar",
                "action": "goToStep",
                "actionValue": "FINALIZAR",
                "step": "PASO_4"
            },
            {
                "number": 2,
                "emoji": "⏪",
                "text": "Anterior",
                "action": "goToStep",
                "actionValue": "PASO_3",
                "step": "PASO_4"
            },
            {
                "number": 1,
                "emoji": "🏠",
                "text": "Ir al menú principal",
                "action": "goToFlow",
                "actionValue": "MENU_PRINCIPAL",
                "step": "FINALIZAR"
            },
            {
                "number": 2,
                "emoji": "📖",
                "text": "Ver pasos de nuevo",
                "action": "sendMessage",
                "actionValue": "VER_PASOS",
                "step": "FINALIZAR"
            },
            {
                "number": 3,
                "emoji": "❓",
                "text": "Preguntas frecuentes",
                "action": "sendMessage",
                "actionValue": "FAQ_TUTORIAL",
                "step": "FINALIZAR"
            }
        ],
        "messages": {
            "welcome": "👋 *Tutorial y Onboarding*\n\n¡Bienvenido al tutorial para nuevos usuarios! Te guiaremos paso a paso para que conozcas todas las funcionalidades de nuestra plataforma.",
            "BIENVENIDA": "🚀 *¡Comencemos!*\n\n${nombreProducto} es una plataforma que te permite ${descripcionBreve}.\n\nEn este tutorial, aprenderás a utilizar todas sus funcionalidades principales.\n\nPulsa \"Continuar\" para empezar.",
            "PASO_1": "1️⃣ *${tituloPaso1}*\n\n${descripcionPaso1}\n\n${imagen1}\n\nPulsa \"Continuar\" para ir al siguiente paso.",
            "PASO_2": "2️⃣ *${tituloPaso2}*\n\n${descripcionPaso2}\n\n${imagen2}\n\nPulsa \"Continuar\" para ir al siguiente paso.",
            "PASO_3": "3️⃣ *${tituloPaso3}*\n\n${descripcionPaso3}\n\n${imagen3}\n\nPulsa \"Continuar\" para ir al siguiente paso.",
            "PASO_4": "4️⃣ *${tituloPaso4}*\n\n${descripcionPaso4}\n\n${imagen4}\n\nPulsa \"Continuar\" para finalizar el tutorial.",
            "FINALIZAR": "🎉 *¡Felicidades!*\n\nHas completado el tutorial de ${nombreProducto}.\n\nAhora estás listo para aprovechar al máximo todas las funcionalidades de nuestra plataforma.\n\n¿Qué deseas hacer ahora?",
            "VER_PASOS": "📑 *Índice del Tutorial*\n\n1️⃣ ${tituloPaso1}\n2️⃣ ${tituloPaso2}\n3️⃣ ${tituloPaso3}\n4️⃣ ${tituloPaso4}\n\nSelecciona el paso al que deseas ir:",
            "FAQ_TUTORIAL": "❓ *Preguntas Frecuentes*\n\n1️⃣ ¿Puedo volver a ver este tutorial más adelante?\nSí, puedes acceder al tutorial en cualquier momento desde el menú de ayuda.\n\n2️⃣ ¿Hay versiones avanzadas del tutorial?\nSí, contamos con tutoriales avanzados para cada funcionalidad específica.\n\n3️⃣ ¿Cómo puedo obtener más ayuda?\nPuedes contactar a nuestro equipo de soporte a través del chat o correo electrónico."
        },
        "active": true,
        "conditions": [],
        "variables": {},
        "validations": {},
        "loops": [],
        "timers": [],
        "schedules": {
            "enabled": false,
            "workingHours": {
                "monday": {
                    "start": "09:00",
                    "end": "18:00",
                    "active": true
                },
                "tuesday": {
                    "start": "09:00",
                    "end": "18:00",
                    "active": true
                }
            },
            "timezone": "America/Mexico_City",
            "outsideHoursMessage": "Estamos fuera de horario"
        }
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

const botAPIs = {
    "folioApi": "",
    "serviciosApi": "",
    "garantiasApi": "",
    "timeout": 30,
    "retries": 3
};

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

// ============================================================================
// POSICIÓN 3: AGREGAR DESPUÉS DE LA CLASE SessionManager
// ============================================================================

// Sistema de validación universal
class UniversalValidator {
    static validateEmail(email) {
        return validator.isEmail(email);
    }

    static validatePhone(phone) {
        const phoneRegex = /^[+]?[\d\s\-\(\)]{10,15}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
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
        return validator.isCreditCard(cardNumber.replace(/\s/g, ''));
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
            const regex = new RegExp('\$\{${key}\}', 'g');
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
        console.log("[NOTIFICATION] Enviando a ${endpoint}:", data);
        
        const response = await axios.post("${MANAGEMENT_SERVER_URL}/${endpoint}", data, {
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log("[NOTIFICATION] Respuesta de ${endpoint}:", response.data);
        return true;
    } catch (error) {
        /*if (error.response) {
            console.error("[NOTIFICATION] Error HTTP ${error.response.status} en ${endpoint}:", error.response.data);
        } else if (error.request) {
            console.error("[NOTIFICATION] Sin respuesta de ${endpoint}:", error.message);
        } else {
            console.error("[NOTIFICATION] Error configurando petición a ${endpoint}:", error.message);
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

client.on('disconnected', async (reason) => {
    console.log(`[DISCONNECTED] Cliente desconectado: ${reason}`);
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
            console.log('[RECONNECT] Intento de reconexión #${reconnectAttempt}/${maxAttempts}...');
            await client.initialize();
            console.log('[RECONNECT] Intento de reconexión iniciado exitosamente');
            
        } catch (error) {
            console.error('[RECONNECT] Error en intento #${reconnectAttempt}:', error.message);
            
            if (reconnectAttempt < maxAttempts) {
                reconnectAttempt++;
                // Backoff exponencial: 10s, 20s, 40s, etc.
                const delay = Math.min(10000 * Math.pow(2, reconnectAttempt - 1), 300000); // máximo 5 minutos
                
                console.log('[RECONNECT] Programando siguiente intento en ${delay / 1000} segundos...');
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
    
    console.log('[UNIVERSAL] Procesando flujo: ${flow.name}, paso: ${session.step}, usuario: ${userId}');
    
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
                `${opt.emoji || ''} ${opt.text}`
            ).join('\n');
            
            await client.sendMessage(userId, `\n${menuOptions}`);
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
    const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
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
    const timeList = times.map((time, index) => `${index + 1}. ${time}`).join('\n');
    
    await client.sendMessage(session.userId, `Horarios disponibles:\n\n${timeList}\n\nSelecciona un horario:`);
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
    const summary = `📋 *Resumen de tu Cita*\n
📅 Fecha: ${session.data.displayDate}
⏰ Hora: ${session.data.selectedTime}
👤 Nombre: ${session.data.clientName}
📞 Teléfono: ${session.data.clientPhone}
📧 Email: ${session.data.clientEmail}\n
¿Los datos son correctos?\n
1. ✅ Confirmar Cita
2. ✏️ Editar Datos
3. ❌ Cancelar`;

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
    
    const confirmationMessage = `✅ *¡Cita Confirmada!*\n
Tu código de cita es: *#${appointmentId}*\n
📅 Fecha: ${session.data.displayDate}
⏰ Hora: ${session.data.selectedTime}\n
Te hemos enviado un recordatorio por email.
Recuerda llegar 15 minutos antes.`;

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
        session.data['respuesta_${questionNumber}'] = messageBody;
        
        // Ir a siguiente pregunta o finalizar
        const nextQuestion = parseInt(questionNumber) + 1;
        if (nextQuestion <= 5) {
            session.step = 'PREGUNTA_${nextQuestion}';
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
    await client.sendMessage(session.userId, '${questionNumber}/5 - ${question}');
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
        welcomeMessage = 'Bienvenido al flujo ${flow.name}';
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
    
    console.log('[UNIVERSAL] Opción seleccionada: ${selectedOption.text} (acción: ${selectedOption.action})');
    
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
    
    console.log('[UNIVERSAL ACTION] Procesando: ${option.action} con valor: ${option.actionValue}');
    
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
            console.log('[MEDIA] Descargando archivo desde: ${option.actionValue}');
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
                filename = 'archivo ${Date.now()}.${extension}';
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
            
            console.log('[MEDIA] Archivo enviado exitosamente a: ${userId}');
            
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
            await client.sendMessage(userId, 'Has seleccionado: ${option.text}');
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
            await axios.post('${MANAGEMENT_SERVER_URL}/api/bots/events/heartbeat', {
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
                console.error('[HEARTBEAT] Error (${heartbeatFailures}/${MAX_HEARTBEAT_FAILURES}):', error.message);
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
        const phoneNumber = phone.includes('@c.us') ? phone : `${phone}@c.us`;
        
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
