// db/setup.js
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setupDatabase() {
  try {
    console.log('🔄 Iniciando configuración de la base de datos...');
    
    // Configuración de la conexión
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
    });
    
    // Crear la base de datos si no existe
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.MYSQL_DATABASE || 'whatsapp_bot_manager'} 
                           CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    
    console.log(`✅ Base de datos "${process.env.MYSQL_DATABASE || 'whatsapp_bot_manager'}" creada o verificada`);
    
    // Usar la base de datos
    await connection.query(`USE ${process.env.MYSQL_DATABASE || 'whatsapp_bot_manager'}`);
    
    // Leer el archivo SQL
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    // Dividir por sentencias SQL
    const statements = schemaSql
      .split(';')
      .filter(statement => statement.trim() !== '');
    
    // Ejecutar cada sentencia
    for (const statement of statements) {
      await connection.query(statement);
      process.stdout.write('.');
    }
    
    console.log('\n✅ Tablas creadas correctamente');
    
    // Verificar si hay bots existentes para migrar
    const botsDir = path.join(process.cwd(), 'bots');
    if (fs.existsSync(botsDir)) {
      const botFolders = fs.readdirSync(botsDir).filter(folder => 
        fs.statSync(path.join(botsDir, folder)).isDirectory() && 
        folder.startsWith('bot_')
      );
      
      if (botFolders.length > 0) {
        console.log(`🔄 Migrando ${botFolders.length} bots existentes...`);
        
        for (const botFolder of botFolders) {
          try {
            const configPath = path.join(botsDir, botFolder, 'config.json');
            if (fs.existsSync(configPath)) {
              const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
              
              // Verificar si el bot ya existe en la base de datos
              const [existingBots] = await connection.query(
                'SELECT id FROM bots WHERE id = ?', 
                [config.botId || botFolder]
              );
              
              if (existingBots.length === 0) {
                // Insertar el bot en la base de datos
                await connection.query(
                  `INSERT INTO bots (id, token, name, company, plan, admin_number, 
                   command_prefix, description, status, created_at, stats) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,
                  [
                    config.botId || botFolder,
                    config.token || '',
                    config.name || 'Bot sin nombre',
                    config.company || 'Empresa desconocida',
                    config.plan || 'emprendedor',
                    config.adminNumber || '',
                    config.commandPrefix || '!',
                    config.description || '',
                    'created',
                    JSON.stringify({ messages: 0, users: 0, uptime: 0 })
                  ]
                );
                console.log(`  ✅ Bot "${config.name}" migrado correctamente`);
              } else {
                console.log(`  ℹ️ Bot "${config.name}" ya existe en la base de datos`);
              }
            }
          } catch (error) {
            console.error(`  ❌ Error migrando bot ${botFolder}: ${error.message}`);
          }
        }
        
        console.log('✅ Migración completada');
      }
    }
    
    console.log('🎉 Base de datos configurada correctamente');
    await connection.end();
    
  } catch (error) {
    console.error('❌ Error configurando la base de datos:', error);
    process.exit(1);
  }
}

// Ejecutar configuración
setupDatabase();