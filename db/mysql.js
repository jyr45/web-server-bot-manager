// db/mysql.js
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Crear el pool de conexiones a MySQL
let pool;

async function initDatabase() {
  try {
    // Configuración de la conexión desde variables de entorno
    pool = mysql.createPool({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'whatsapp_bot_manager',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    console.log('🔌 Conexión a MySQL establecida');
    
    // Verificar la conexión
    const connection = await pool.getConnection();
    console.log('✅ Base de datos conectada correctamente');
    
    // Verificar si las tablas existen
    //await createTablesIfNotExist();
    
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Error conectando a MySQL:', error.message);
    return false;
  }
}

async function createTablesIfNotExist() {
  try {
    // Leer el archivo SQL con la estructura de tablas
    const sqlFilePath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Dividir por sentencias SQL separadas por ;
    const statements = schemaSql
      .split(';')
      .filter(statement => statement.trim() !== '');
    
    // Ejecutar cada sentencia
    for (const statement of statements) {
      await pool.query(statement);
    }
    
    console.log('✅ Estructura de base de datos verificada');
  } catch (error) {
    console.error('❌ Error creando tablas:', error.message);
    throw error;
  }
}

// Funciones CRUD genéricas
async function query(sql, params) {
  try {
    const [rows] = await pool.query(sql, params);
    return rows;
  } catch (error) {
    console.error('Error en consulta SQL:', error.message);
    console.error('Consulta:', sql);
    console.error('Parámetros:', params);
    throw error;
  }
}

// Bots
async function getAllBots() {
  return query('SELECT * FROM bots ORDER BY created_at DESC');
}
async function getBotsByUserId(userId) {
  return query('SELECT * FROM bots WHERE user_id = ? ORDER BY created_at DESC', [userId]);
}
async function getBotById(id) {
  const bots = await query('SELECT * FROM bots WHERE id = ?', [id]);
  return bots.length ? bots[0] : null;
}

async function getBotByToken(token) {
  const bots = await query('SELECT * FROM bots WHERE token = ?', [token]);
  return bots.length ? bots[0] : null;
}

async function createBot(botData) {
  // Asegurar que el bot tenga stats como JSON
  const stats = JSON.stringify(botData.stats || { messages: 0, users: 0, uptime: 0 });
  
  const result = await query(
    `INSERT INTO bots (id, token, name, company, plan, admin_number, 
     command_prefix, description, api_base_url, api_password, 
     enable_ai, gemini_api_key, session_timeout, default_pause, 
     flows, messages, apis, status, created_at, stats, user_id) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?)`,
    [
      botData.id,
      botData.token,
      botData.name,
      botData.company,
      botData.plan,
      botData.adminNumber,
      botData.commandPrefix,
      botData.description,
      botData.apiBaseUrl,
      botData.apiPassword,
      botData.enableAI ? 1 : 0,
      botData.geminiApiKey,
      botData.sessionTimeout,
      botData.defaultPause,
      JSON.stringify(botData.flows),
      JSON.stringify(botData.messages),
      JSON.stringify(botData.apis || {}),
      botData.status,
      stats,
      botData.user_id // Añadir user_id a la consulta
    ]
  );
  
  return botData.id; // Devolver el ID del bot en lugar de insertId
}

async function updateBot(id, botData) {
  // Construir el objeto de actualización dinámicamente
  const updates = [];
  const params = [];
  
  // Mapeo de propiedades JavaScript a columnas SQL
  const fieldMap = {
    name: 'name',
    company: 'company',
    plan: 'plan',
    adminNumber: 'admin_number',
    commandPrefix: 'command_prefix',
    description: 'description',
    apiBaseUrl: 'api_base_url',
    apiPassword: 'api_password',
    enableAI: 'enable_ai',
    geminiApiKey: 'gemini_api_key',
    sessionTimeout: 'session_timeout',
    defaultPause: 'default_pause',
    flows: 'flows',
    messages: 'messages',
    apis: 'apis',
    status: 'status',
    stats: 'stats',
    lastActivity: 'last_activity'
  };
  
  // Agregar campos al UPDATE solo si están presentes en botData
  for (const [key, dbField] of Object.entries(fieldMap)) {
    if (botData[key] !== undefined) {
      let value = botData[key];
      
      // Convertir objetos/arrays a JSON
      if (typeof value === 'object' && value !== null) {
        value = JSON.stringify(value);
      }
      
      // Convertir booleanos para campos que lo requieran
      if (dbField === 'enable_ai') {
        value = value ? 1 : 0;
      }
      
      updates.push(`${dbField} = ?`);
      params.push(value);
    }
  }
  
  // Agregar always updated_at
  updates.push('updated_at = NOW()');
  
  // Agregar el ID al final de los parámetros
  params.push(id);
  
  const query = `UPDATE bots SET ${updates.join(', ')} WHERE id = ?`;
  const result = await pool.query(query, params);
  
  return result[0].affectedRows > 0;
}

async function deleteBot(id) {
  const result = await query('DELETE FROM bots WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

// Logs
async function addLog(level, message, botId = null) {
  return query(
    'INSERT INTO logs (level, message, bot_id, created_at) VALUES (?, ?, ?, NOW())',
    [level, message, botId]
  );
}

async function getLogs(filters = {}, limit = 100) {
  let sql = 'SELECT * FROM logs';
  const params = [];
  const conditions = [];
  
  if (filters.botId) {
    conditions.push('bot_id = ?');
    params.push(filters.botId);
  }
  
  if (filters.level) {
    conditions.push('level = ?');
    params.push(filters.level);
  }
  
  if (conditions.length) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }
  
  sql += ' ORDER BY created_at DESC LIMIT ?';
  params.push(parseInt(limit));
  
  return query(sql, params);
}

async function clearLogs() {
  return query('TRUNCATE TABLE logs');
}

// Analytics
async function updateBotStats(botId, stats) {
  return query(
    'UPDATE bots SET stats = ?, last_activity = NOW() WHERE id = ?',
    [JSON.stringify(stats), botId]
  );
}
async function updateBotAPIConfig(id, apiConfig) {
    try {
        // Limpiar la API key si se proporciona
        if (apiConfig.geminiApiKey) {
            // Eliminar caracteres potencialmente problemáticos
            apiConfig.geminiApiKey = apiConfig.geminiApiKey.trim();
        }
        
        // Verificar si el bot existe
        const botResult = await query('SELECT * FROM bots WHERE id = ?', [id]);
        if (botResult.length === 0) {
            throw new Error(`Bot con ID ${id} no encontrado`);
        }
        
        // Construir el objeto de actualización
        const updates = [];
        const params = [];
        
        // Agregar campos al UPDATE solo si están presentes en apiConfig
        if (apiConfig.geminiApiKey !== undefined) {
            updates.push('gemini_api_key = ?');
            params.push(apiConfig.geminiApiKey);
        }
        
        // Asegurar que enableAI sea un booleano y convertirlo a 0/1 para MySQL
        if (apiConfig.enableAI !== undefined) {
            updates.push('enable_ai = ?');
            params.push(apiConfig.enableAI ? 1 : 0);
        } else if (apiConfig.geminiApiKey) {
            // Si se está estableciendo una API key, automáticamente activar enableAI
            updates.push('enable_ai = ?');
            params.push(1);
        }
        
        if (apiConfig.aiConfig !== undefined) {
            updates.push('ai_config = ?');
            params.push(JSON.stringify(apiConfig.aiConfig));
        }
        
        // Si no hay actualizaciones, salir
        if (updates.length === 0) {
            return false;
        }
        
        // Agregar siempre updated_at
        updates.push('updated_at = NOW()');
        
        // Agregar el ID al final de los parámetros
        params.push(id);
        
        // Construir y ejecutar la consulta
        const updateQuery = `UPDATE bots SET ${updates.join(', ')} WHERE id = ?`;
        console.log('Consulta de actualización:', updateQuery);
        console.log('Parámetros:', params);
        
        const result = await pool.query(updateQuery, params);
        
        // Obtener y retornar el bot actualizado para verificar cambios
        const updatedBot = await query('SELECT * FROM bots WHERE id = ?', [id]);
        console.log('Bot después de actualización:', updatedBot[0]);
        
        return result[0].affectedRows > 0;
    } catch (error) {
        console.error('Error actualizando configuración de API del bot:', error);
        throw error;
    }
}
async function getDashboardStats(userId, isAdmin) {
  // Query base para filtrar según el usuario
  const userFilter = isAdmin ? '' : 'WHERE user_id = ?';
  const queryParams = isAdmin ? [] : [userId];
  
  // Total bots (filtrado por usuario si no es admin)
  const [totalBotsResult] = await pool.query(
    `SELECT COUNT(*) as count FROM bots ${userFilter}`, 
    queryParams
  );
  const totalBots = totalBotsResult[0].count;
  
  // Active bots (filtrado por usuario si no es admin)
  const [activeBotsResult] = await pool.query(
    `SELECT COUNT(*) as count FROM bots WHERE status = 'running' ${userFilter ? 'AND ' + userFilter.substring(6) : ''}`, 
    queryParams
  );
  const activeBots = activeBotsResult[0].count;
  
  // Sum of messages from all bots stats (filtrado por usuario si no es admin)
  const [botsWithStats] = await pool.query(
    `SELECT stats FROM bots ${userFilter}`,
    queryParams
  );
  let totalMessages = 0;
  
  botsWithStats.forEach(bot => {
    try {
      const stats = JSON.parse(bot.stats);
      totalMessages += stats.messages || 0;
    } catch (e) {
      // Ignorar errores de parsing
    }
  });
  
  // Estadísticas solo para administradores
  let totalRevenue = 0;
  let totalClients = 0;
  
  if (isAdmin) {
    // Calculate revenue based on plans
    const [botPlans] = await pool.query('SELECT plan FROM bots');
    const planPrices = {
      emprendedor: 1199,
      profesional: 2999,
      empresarial: 6999
    };
    
    botPlans.forEach(bot => {
      totalRevenue += planPrices[bot.plan] || 0;
    });
    
    // Count unique users with bots
    const [clientsResult] = await pool.query(
      'SELECT COUNT(DISTINCT user_id) as count FROM bots'
    );
    totalClients = clientsResult[0].count;
  }
  
  return {
    totalBots,
    activeBots,
    totalMessages,
    totalRevenue,
    totalClients
  };
}

// Usuarios
async function getAllUsers() {
  return query('SELECT * FROM users ORDER BY created_at DESC');
}

async function getUserById(id) {
  const users = await query('SELECT * FROM users WHERE id = ?', [id]);
  return users.length ? users[0] : null;
}

async function createUser(userData) {
  const result = await query(
    `INSERT INTO users (phone, name, bot_id, first_contact, last_contact, 
     session_data, status, messages_count) 
     VALUES (?, ?, ?, NOW(), NOW(), ?, ?, ?)`,
    [
      userData.phone,
      userData.name,
      userData.botId,
      JSON.stringify(userData.sessionData || {}),
      userData.status || 'active',
      userData.messagesCount || 0
    ]
  );
  
  return result.insertId;
}

async function updateUserActivity(id) {
  return query(
    'UPDATE users SET last_contact = NOW(), messages_count = messages_count + 1 WHERE id = ?',
    [id]
  );
}

// Templates
async function getAllTemplates() {
  return query('SELECT * FROM templates');
}

async function getTemplateById(id) {
  const templates = await query('SELECT * FROM templates WHERE id = ?', [id]);
  return templates.length ? templates[0] : null;
}


module.exports = {
  initDatabase,
  query,
  // Bots
  getAllBots,
  getBotById,
  getBotByToken,
  createBot,
  updateBot,
  deleteBot,
  // Logs
  addLog,
  getLogs,
  clearLogs,
  // Analytics
  updateBotStats,
  getDashboardStats,
  // Usuarios
  getAllUsers,
  getUserById,
  createUser,
  updateUserActivity,
  // Templates
  getAllTemplates,
  getTemplateById,
  getBotsByUserId,
  updateBotAPIConfig,

};