// db/fix-tokens.js
const fs = require('fs-extra');
const path = require('path');
const mysql = require('mysql2/promise');
const crypto = require('crypto');
require('dotenv').config();

async function fixTokens() {
  try {
    console.log('🔧 Iniciando corrección de tokens de bots...');
    
    // Configuración de la conexión
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'whatsapp_bot_manager'
    });
    
    // Obtener todos los bots de la base de datos
    const [existingBots] = await connection.query('SELECT id, token, name FROM bots');
    const existingTokens = new Set(existingBots.map(bot => bot.token));
    const existingBotIds = new Set(existingBots.map(bot => bot.id));
    
    console.log(`📊 Encontrados ${existingBots.length} bots en la base de datos`);
    
    // Verificar si hay bots existentes para corregir
    const botsDir = path.join(process.cwd(), 'bots');
    if (fs.existsSync(botsDir)) {
      const botFolders = fs.readdirSync(botsDir).filter(folder => 
        fs.statSync(path.join(botsDir, folder)).isDirectory() && 
        folder.startsWith('bot_')
      );
      
      if (botFolders.length > 0) {
        console.log(`🔍 Verificando ${botFolders.length} carpetas de bots...`);
        
        // Procesar cada carpeta de bot
        for (const botFolder of botFolders) {
          try {
            const configPath = path.join(botsDir, botFolder, 'config.json');
            if (fs.existsSync(configPath)) {
              // Leer la configuración actual
              const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
              
              // Verificar si el bot ya existe en la base de datos
              if (!existingBotIds.has(config.botId || botFolder)) {
                // Generar un token único
                let token = config.token || '';
                
                // Si el token está vacío o ya existe, generar uno nuevo
                if (!token || existingTokens.has(token)) {
                  token = generateToken(32);
                  while (existingTokens.has(token)) {
                    token = generateToken(32);
                  }
                  existingTokens.add(token);
                }
                
                // Actualizar el config.json con el nuevo token
                config.token = token;
                fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
                
                // Insertar el bot en la base de datos
                await connection.query(
                  `INSERT INTO bots (id, token, name, company, plan, admin_number, 
                   command_prefix, description, api_base_url, api_password, 
                   enable_ai, gemini_api_key, session_timeout, default_pause,
                   flows, messages, apis, status, created_at, stats) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,
                  [
                    config.botId || botFolder,
                    token,
                    config.name || 'Bot sin nombre',
                    config.company || 'Empresa desconocida',
                    config.plan || 'emprendedor',
                    config.adminNumber || '',
                    config.commandPrefix || '!',
                    config.description || '',
                    config.apiBaseUrl || '',
                    config.apiPassword || '',
                    config.enableAI ? 1 : 0,
                    config.geminiApiKey || '',
                    config.sessionTimeout || 15,
                    config.defaultPause || 30,
                    JSON.stringify(config.flows || []),
                    JSON.stringify(config.messages || {}),
                    JSON.stringify(config.apis || {}),
                    'created',
                    JSON.stringify({ messages: 0, users: 0, uptime: 0 })
                  ]
                );
                
                console.log(`  ✅ Bot "${config.name}" (${botFolder}) migrado con token: ${token}`);
              } else {
                // El bot ya existe en la base de datos
                const dbBot = existingBots.find(b => b.id === (config.botId || botFolder));
                
                // Verificar si necesita actualizar el token en config.json
                if (dbBot && (!config.token || config.token !== dbBot.token)) {
                  config.token = dbBot.token;
                  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
                  console.log(`  🔄 Actualizado token para bot "${config.name}" (${botFolder}): ${dbBot.token}`);
                } else {
                  console.log(`  ℹ️ Bot "${config.name}" (${botFolder}) ya existe en la base de datos`);
                }
              }
            } else {
              console.log(`  ⚠️ No se encontró config.json para el bot ${botFolder}`);
            }
          } catch (error) {
            console.error(`  ❌ Error procesando bot ${botFolder}: ${error.message}`);
          }
        }
      } else {
        console.log('⚠️ No se encontraron carpetas de bots para verificar');
      }
    } else {
      console.log('⚠️ El directorio de bots no existe');
    }
    
    // Verificar bots en la base de datos sin carpeta correspondiente
    for (const dbBot of existingBots) {
      const botFolderPath = path.join(botsDir, dbBot.id);
      if (!fs.existsSync(botFolderPath)) {
        console.log(`  ⚠️ Bot "${dbBot.name}" (${dbBot.id}) existe en la base de datos pero no tiene carpeta`);
      }
    }
    
    console.log('🎉 Corrección de tokens completada');
    await connection.end();
    
  } catch (error) {
    console.error('❌ Error corrigiendo tokens:', error);
  }
}

// Función para generar tokens aleatorios
function generateToken(length = 32) {
  return crypto.randomBytes(length).toString('hex').substring(0, length);
}

// Ejecutar corrección de tokens
fixTokens();