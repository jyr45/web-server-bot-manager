// Implementación del Router para URLs de Bots
// Este archivo debe guardarse como bot-router.js e importarse en server.js

const express = require('express');
const path = require('path');
const db = require('./db/mysql');

// Crear un router de Express
const botRouter = express.Router();

// Middleware para verificar token de bot
async function validateBotToken(req, res, next) {
    try {
        const token = req.params.token;
        
        if (!token) {
            return res.status(400).json({ error: 'Token no proporcionado' });
        }
        
        const bot = await db.getBotByToken(token);
        
        if (!bot) {
            return res.status(404).json({ error: 'Bot no encontrado' });
        }
        
        // Adjuntar el bot a la petición
        req.bot = bot;
        next();
    } catch (error) {
        console.error('Error validando token de bot:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}

// Ruta pública para acceso por token
botRouter.get('/:token', validateBotToken, async (req, res) => {
    try {
        const bot = req.bot;
        
        // Verificar si hay un proceso corriendo para este bot
        const activeBots = req.app.get('activeBots') || new Map();
        const botProcess = activeBots.get(bot.id);
        
        // Determinar estado operacional
        const isOperational = botProcess && bot.status === 'running';
        
        // Parsear stats
        const stats = typeof bot.stats === 'string' ? JSON.parse(bot.stats) : (bot.stats || {});
        
        // Devolver información pública del bot
        res.json({
            botName: bot.name,
            company: bot.company,
            plan: bot.plan,
            status: isOperational ? 'active' : 'inactive',
            message: `Bot de ${bot.company} funcionando ${isOperational ? 'correctamente' : 'en pausa'}`,
            instructions: 'Escanea el código QR con WhatsApp para conectar',
            stats: {
                messages: stats.messages || 0,
                uptime: botProcess ? (Date.now() - botProcess.startTime) : 0
            }
        });
        
        // Registrar acceso
        await db.addLog('INFO', `Acceso por token al bot ${bot.name} (${bot.id})`, bot.id);
    } catch (error) {
        console.error('Error obteniendo información del bot:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Ruta para enviar mensaje
botRouter.post('/:token/send', validateBotToken, async (req, res) => {
    try {
        const bot = req.bot;
        const { number, message } = req.body;
        
        if (!number || !message) {
            return res.status(400).json({ error: 'Faltan parámetros: number y message son requeridos' });
        }
        
        // Verificar si hay un proceso corriendo para este bot
        const activeBots = req.app.get('activeBots') || new Map();
        const botProcess = activeBots.get(bot.id);
        
        if (!botProcess || bot.status !== 'running') {
            return res.status(400).json({ error: 'El bot no está activo' });
        }
        
        // Derivar la petición al puerto del bot
        const botPort = 3000 + parseInt(bot.id.split('_')[1]) % 1000;
        
        // Hacer petición al servicio del bot
        const axios = require('axios');
        const response = await axios.post(`http://localhost:${botPort}/api/send-message`, {
            number,
            message
        });
        
        // Devolver respuesta del bot
        res.json(response.data);
        
        // Registrar envío
        await db.addLog('INFO', `Mensaje enviado a ${number} a través del bot ${bot.name} (${bot.id})`, bot.id);
    } catch (error) {
        console.error('Error enviando mensaje:', error);
        res.status(500).json({ error: 'Error enviando mensaje: ' + error.message });
    }
});

// Ruta para obtener estado del bot
botRouter.get('/:token/status', validateBotToken, async (req, res) => {
    try {
        const bot = req.bot;
        
        // Verificar si hay un proceso corriendo para este bot
        const activeBots = req.app.get('activeBots') || new Map();
        const botProcess = activeBots.get(bot.id);
        
        // Determinar estado operacional
        const isOperational = botProcess && bot.status === 'running';
        
        // Parsear stats
        const stats = typeof bot.stats === 'string' ? JSON.parse(bot.stats) : (bot.stats || {});
        
        // Devolver estado detallado del bot
        res.json({
            id: bot.id,
            name: bot.name,
            company: bot.company,
            plan: bot.plan,
            status: isOperational ? 'active' : 'inactive',
            uptime: botProcess ? (Date.now() - botProcess.startTime) : 0,
            messages: stats.messages || 0,
            users: stats.users || 0
        });
    } catch (error) {
        console.error('Error obteniendo estado del bot:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Ruta para mostrar interfaz web del bot
botRouter.get('/:token/web', validateBotToken, async (req, res) => {
    try {
        const bot = req.bot;
        
        // Renderizar una página HTML básica con información del bot
        const html = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${bot.name} - WhatsApp Bot</title>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background: linear-gradient(135deg, #25D366, #128C7E);
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                }
                
                .container {
                    max-width: 600px;
                    width: 100%;
                    background: white;
                    border-radius: 20px;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
                    overflow: hidden;
                }
                
                .header {
                    background: linear-gradient(135deg, #25D366, #128C7E);
                    color: white;
                    padding: 30px;
                    text-align: center;
                }
                
                .header h1 {
                    font-size: 1.8rem;
                    margin-bottom: 10px;
                }
                
                .header p {
                    opacity: 0.9;
                }
                
                .content {
                    padding: 30px;
                }
                
                .bot-info {
                    margin-bottom: 30px;
                }
                
                .qr-section {
                    text-align: center;
                    margin-bottom: 30px;
                }
                
                .qr-placeholder {
                    width: 200px;
                    height: 200px;
                    margin: 0 auto 20px;
                    background: #f8f9fa;
                    border: 2px dashed #25D366;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 48px;
                    color: #25D366;
                }
                
                .instructions {
                    background: #f8f9fa;
                    border-radius: 10px;
                    padding: 20px;
                }
                
                .instructions h3 {
                    margin-bottom: 15px;
                    color: #128C7E;
                }
                
                .instructions ol {
                    padding-left: 20px;
                }
                
                .instructions li {
                    margin-bottom: 10px;
                }
                
                .status {
                    text-align: center;
                    margin: 20px 0;
                    padding: 10px;
                    border-radius: 10px;
                    font-weight: bold;
                }
                
                .status.active {
                    background: rgba(40, 167, 69, 0.1);
                    color: #28a745;
                }
                
                .status.inactive {
                    background: rgba(220, 53, 69, 0.1);
                    color: #dc3545;
                }
                
                .footer {
                    text-align: center;
                    padding: 20px;
                    border-top: 1px solid #eee;
                    color: #6c757d;
                    font-size: 0.9rem;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1><i class="fab fa-whatsapp"></i> ${bot.name}</h1>
                    <p>Bot de WhatsApp para ${bot.company}</p>
                </div>
                
                <div class="content">
                    <div class="bot-info">
                        <div class="status ${bot.status === 'running' ? 'active' : 'inactive'}">
                            <i class="fas fa-${bot.status === 'running' ? 'check-circle' : 'times-circle'}"></i>
                            Estado: ${bot.status === 'running' ? 'Activo' : 'Inactivo'}
                        </div>
                    </div>
                    
                    <div class="qr-section">
                        <h3>Conecta con WhatsApp</h3>
                        <div class="qr-placeholder">
                            <i class="fas fa-qrcode"></i>
                        </div>
                        <p>El código QR se mostrará aquí cuando el bot esté en espera de conexión</p>
                    </div>
                    
                    <div class="instructions">
                        <h3><i class="fas fa-info-circle"></i> Instrucciones</h3>
                        <ol>
                            <li>Abre WhatsApp en tu teléfono</li>
                            <li>Toca en los tres puntos de la esquina superior derecha</li>
                            <li>Selecciona "Dispositivos vinculados"</li>
                            <li>Toca en "Vincular un dispositivo"</li>
                            <li>Escanea el código QR que aparecerá arriba</li>
                        </ol>
                    </div>
                </div>
                
                <div class="footer">
                    Powered by WhatsApp Bot Manager &copy; 2025
                </div>
            </div>
        </body>
        </html>
        `;
        
        res.send(html);
    } catch (error) {
        console.error('Error mostrando interfaz web del bot:', error);
        res.status(500).send('Error interno del servidor');
    }
});

// Instalar rutas
function installBotRouter(app) {
    // Configurar el router
    app.use('/bot', botRouter);
    
    // Ruta alternativa compatible con dominio personalizado
    app.use('/', botRouter);
    
    console.log('📱 Router de bots instalado en /bot/:token');
}

module.exports = {
    botRouter,
    installBotRouter
};