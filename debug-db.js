// debug-db.js - Script para verificar la conexión y datos de la base de datos
require('dotenv').config();
const db = require('./db/mysql');

async function testDatabase() {
    console.log('🔍 Iniciando pruebas de base de datos...\n');
    
    try {
        // 1. Probar conexión
        console.log('1. Probando conexión a MySQL...');
        const connected = await db.initDatabase();
        if (connected) {
            console.log('   ✅ Conexión exitosa\n');
        } else {
            console.log('   ❌ Error de conexión\n');
            return;
        }
        
        // 2. Verificar configuración
        console.log('2. Configuración de conexión:');
        console.log(`   Host: ${process.env.MYSQL_HOST || 'localhost'}`);
        console.log(`   Usuario: ${process.env.MYSQL_USER || 'root'}`);
        console.log(`   Base de datos: ${process.env.MYSQL_DATABASE || 'whatsapp_bot_manager'}`);
        console.log(`   Puerto: ${process.env.MYSQL_PORT || 3306}\n`);
        
        // 3. Contar bots
        console.log('3. Verificando bots en la base de datos...');
        const bots = await db.getAllBots();
        console.log(`   📊 Total de bots encontrados: ${bots.length}`);
        
        if (bots.length > 0) {
            console.log('   📋 Lista de bots:');
            bots.forEach((bot, index) => {
                console.log(`      ${index + 1}. ${bot.name} (${bot.company}) - Estado: ${bot.status}`);
                console.log(`         ID: ${bot.id}`);
                console.log(`         Token: ${bot.token ? bot.token.substring(0, 8) + '...' : 'Sin token'}`);
                console.log(`         Creado: ${bot.created_at}`);
                console.log(`         Admin: ${bot.admin_number}`);
                
                // Verificar campos JSON
                try {
                    const stats = typeof bot.stats === 'string' ? JSON.parse(bot.stats) : bot.stats;
                    console.log(`         Mensajes: ${stats?.messages || 0}`);
                } catch (e) {
                    console.log(`         ⚠️ Error parseando stats: ${e.message}`);
                }
                console.log('');
            });
        } else {
            console.log('   ⚠️ No se encontraron bots en la base de datos');
            console.log('   💡 Tip: Puedes crear bots desde la interfaz web en http://localhost:8080');
        }
        
        // 4. Probar endpoint de API simulado
        console.log('4. Simulando llamada a API...');
        try {
            // Formatear bots como lo haría el endpoint
            const botsFormatted = bots.map(bot => {
                let stats, flows, messages, apis;
                try {
                    stats = typeof bot.stats === 'string' ? JSON.parse(bot.stats) : bot.stats;
                    flows = typeof bot.flows === 'string' ? JSON.parse(bot.flows) : bot.flows;
                    messages = typeof bot.messages === 'string' ? JSON.parse(bot.messages) : bot.messages;
                    apis = typeof bot.apis === 'string' ? JSON.parse(bot.apis) : bot.apis;
                } catch (e) {
                    console.log(`   ⚠️ Error parseando JSON para bot ${bot.id}: ${e.message}`);
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
                    token: bot.token
                };
            });
            
            console.log(`   ✅ Formateado exitoso para ${botsFormatted.length} bots`);
            if (botsFormatted.length > 0) {
                console.log('   📝 Ejemplo de bot formateado:');
                console.log(`      Nombre: ${botsFormatted[0].name}`);
                console.log(`      Empresa: ${botsFormatted[0].company}`);
                console.log(`      Plan: ${botsFormatted[0].plan}`);
                console.log(`      Estado: ${botsFormatted[0].status}`);
                console.log(`      Token: ${botsFormatted[0].token?.substring(0, 8)}...`);
            }
        } catch (error) {
            console.log(`   ❌ Error formateando bots: ${error.message}`);
        }
        
        // 5. Verificar logs recientes
        console.log('\n5. Verificando logs recientes...');
        try {
            const logs = await db.getLogs({}, 8);
            console.log(`   📊 Últimos ${logs.length} logs:`);
            if (logs.length > 0) {
                logs.forEach(log => {
                    console.log(`      [${log.level}] ${log.created_at}: ${log.message}`);
                });
            } else {
                console.log('      Sin logs encontrados');
            }
        } catch (error) {
            console.log(`   ❌ Error obteniendo logs: ${error.message}`);
        }
        
        // 6. Verificar estadísticas del dashboard
        console.log('\n6. Verificando estadísticas del dashboard...');
        try {
            const stats = await db.getDashboardStats();
            console.log('   📊 Estadísticas:');
            console.log(`      Total de bots: ${stats.totalBots}`);
            console.log(`      Bots activos: ${stats.activeBots}`);
            console.log(`      Total de mensajes: ${stats.totalMessages}`);
            console.log(`      Ingresos totales: $${stats.totalRevenue.toLocaleString()}`);
        } catch (error) {
            console.log(`   ❌ Error obteniendo estadísticas: ${error.message}`);
        }
        
        // 7. Verificar templates
        console.log('\n7. Verificando plantillas...');
        try {
            const templates = await db.getAllTemplates();
            console.log(`   📊 Templates encontrados: ${templates.length}`);
            if (templates.length > 0) {
                templates.forEach(template => {
                    console.log(`      - ${template.name} (${template.category})`);
                });
            } else {
                console.log('   ⚠️ No se encontraron templates');
            }
        } catch (error) {
            console.log(`   ❌ Error obteniendo templates: ${error.message}`);
        }
        
        console.log('\n' + '='.repeat(60));
        console.log('✅ DIAGNÓSTICO COMPLETADO');
        console.log('='.repeat(60));
        
        if (bots.length > 0) {
            console.log('🎉 ¡Todo parece estar funcionando correctamente!');
            console.log('📱 Puedes iniciar el servidor con: npm run dev');
            console.log('🌐 Y acceder a: http://localhost:8080');
        } else {
            console.log('⚠️  No hay bots en la base de datos');
            console.log('💡 Tip: Crea tu primer bot desde la interfaz web');
        }
        
    } catch (error) {
        console.error('\n❌ ERROR DURANTE LAS PRUEBAS:', error.message);
        console.error('📝 Stack trace completo:');
        console.error(error.stack);
        
        console.log('\n🔧 POSIBLES SOLUCIONES:');
        console.log('1. Verificar que MySQL esté ejecutándose');
        console.log('2. Verificar configuración en .env');
        console.log('3. Ejecutar: node fix-duplicates.js');
        console.log('4. Verificar que la base de datos existe');
    }
}

// Función para probar la consulta directa
async function testDirectQuery() {
    console.log('\n🔍 Probando consulta directa...\n');
    
    try {
        const result = await db.query('SELECT id, name, token, status FROM bots LIMIT 5');
        console.log('📊 Resultado de consulta directa:');
        console.table(result);
    } catch (error) {
        console.error('❌ Error en consulta directa:', error.message);
    }
}

// Función para verificar estructura de tabla
async function checkTableStructure() {
    console.log('\n🔍 Verificando estructura de tabla bots...\n');
    
    try {
        const result = await db.query('DESCRIBE bots');
        console.log('📊 Estructura de tabla bots:');
        console.table(result);
    } catch (error) {
        console.error('❌ Error verificando estructura:', error.message);
    }
}

// Función para mostrar ayuda
function showHelp() {
    console.log('\n🔧 WhatsApp Bot Manager - Debug Database\n');
    console.log('Uso: node debug-db.js [opciones]\n');
    console.log('Opciones:');
    console.log('  --direct     Ejecutar solo consulta directa');
    console.log('  --structure  Verificar solo estructura de tablas');
    console.log('  --help       Mostrar esta ayuda');
    console.log('  (sin opciones) Ejecutar diagnóstico completo\n');
    console.log('Ejemplos:');
    console.log('  node debug-db.js');
    console.log('  node debug-db.js --direct');
    console.log('  node debug-db.js --structure');
}

// Ejecutar todas las pruebas
async function runAllTests() {
    await testDatabase();
    process.exit(0);
}

// Verificar argumentos de línea de comandos
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
} else if (args.includes('--direct')) {
    testDirectQuery().then(() => process.exit(0));
} else if (args.includes('--structure')) {
    checkTableStructure().then(() => process.exit(0));
} else {
    runAllTests();
}