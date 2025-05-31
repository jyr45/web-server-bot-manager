// fix-duplicates.js - Script para corregir duplicados en templates
require('dotenv').config();
const mysql = require('mysql2/promise');

async function fixDuplicates() {
    console.log('🔧 Corrigiendo duplicados en la base de datos...\n');
    
    let connection;
    
    try {
        // Conectar a MySQL
        connection = await mysql.createConnection({
            host: process.env.MYSQL_HOST || 'localhost',
            user: process.env.MYSQL_USER || 'root',
            password: process.env.MYSQL_PASSWORD || '',
            database: process.env.MYSQL_DATABASE || 'whatsapp_bot_manager'
        });
        
        console.log('✅ Conectado a MySQL');
        
        // 1. Verificar si existe tabla templates
        console.log('📋 Verificando tabla templates...');
        const [tables] = await connection.query("SHOW TABLES LIKE 'templates'");
        
        if (tables.length === 0) {
            console.log('⚠️ Tabla templates no existe, creándola...');
            
            // Crear tabla templates
            await connection.query(`
                CREATE TABLE templates (
                    id VARCHAR(50) PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    description TEXT,
                    category VARCHAR(50),
                    flows JSON,
                    messages JSON,
                    created_at DATETIME NOT NULL,
                    updated_at DATETIME
                )
            `);
            console.log('✅ Tabla templates creada');
        } else {
            console.log('✅ Tabla templates existe');
            
            // Limpiar templates duplicados
            console.log('🧹 Limpiando templates existentes...');
            await connection.query('DELETE FROM templates');
            console.log('✅ Templates limpiados');
        }
        
        // 2. Insertar templates por defecto
        console.log('📝 Insertando templates por defecto...');
        
        const templates = [
            {
                id: 'servicios',
                name: 'Servicios Técnicos',
                description: 'Bot para talleres y servicios de reparación',
                category: 'business',
                flows: JSON.stringify([{
                    name: "MENU_PRINCIPAL",
                    description: "Menú principal del bot",
                    steps: ["INITIAL", "AWAITING_CHOICE"],
                    options: [
                        { number: 1, text: "Información y Servicios", action: "info" },
                        { number: 2, text: "Consultar Estado", action: "status" },
                        { number: 3, text: "Hablar con Asesor", action: "human" },
                        { number: 4, text: "Acerca de Nosotros", action: "about" },
                        { number: 5, text: "Salir", action: "exit" }
                    ]
                }]),
                messages: JSON.stringify({
                    greetings: {
                        morning: "¡Buenos días! 🌅 ¿Cómo puedo ayudarte hoy?",
                        afternoon: "¡Buenas tardes! 🌞 ¿En qué puedo asistirte?",
                        evening: "¡Buenas noches! 🌙 ¿Cómo puedo ayudarte?",
                        newUser: "¡Hola! Veo que es tu primera vez aquí. Te explico brevemente cómo funciono..."
                    },
                    errors: {
                        invalidOption: "❌ Opción no válida. Por favor, selecciona una opción del menú.",
                        apiError: "😔 Ups, algo salió mal. Por favor, intenta de nuevo en unos momentos.",
                        outsideHours: "🕐 Estamos fuera de horario de atención.",
                        userPaused: "⏸️ El asistente está pausado. Escribe \"reactivar\" para continuar."
                    },
                    confirmations: {
                        dataSaved: "✅ Información guardada correctamente.",
                        processComplete: "🎉 ¡Proceso completado exitosamente!",
                        waitingResponse: "⏳ Procesando tu solicitud, por favor espera...",
                        goodbye: "👋 ¡Gracias por contactarnos! Que tengas un excelente día."
                    }
                })
            },
            {
                id: 'restaurante',
                name: 'Restaurante/Comida',
                description: 'Bot para restaurantes con menú digital y pedidos a domicilio',
                category: 'food',
                flows: JSON.stringify([{
                    name: "MENU_PRINCIPAL",
                    description: "Menú principal del bot",
                    steps: ["INITIAL", "AWAITING_CHOICE"],
                    options: [
                        { number: 1, text: "Ver Menú Digital", action: "menu" },
                        { number: 2, text: "Hacer Pedido", action: "order" },
                        { number: 3, text: "Reservar Mesa", action: "reservation" },
                        { number: 4, text: "Promociones", action: "promos" },
                        { number: 5, text: "Hablar con Atención", action: "human" }
                    ]
                }]),
                messages: JSON.stringify({
                    greetings: {
                        morning: "¡Buenos días! 🌅 Bienvenido a nuestro restaurante",
                        afternoon: "¡Buenas tardes! 🌞 Bienvenido a nuestro restaurante",
                        evening: "¡Buenas noches! 🌙 Bienvenido a nuestro restaurante",
                        newUser: "¡Hola! Bienvenido por primera vez a nuestro restaurante"
                    },
                    errors: {
                        invalidOption: "❌ Opción no válida. Por favor, selecciona una opción de nuestro menú.",
                        apiError: "😔 Ups, algo salió mal. Por favor, intenta de nuevo.",
                        outsideHours: "🕐 En este momento estamos cerrados.",
                        userPaused: "⏸️ Tu sesión está pausada. Escribe \"reactivar\" para continuar."
                    },
                    confirmations: {
                        dataSaved: "✅ Pedido registrado correctamente.",
                        processComplete: "🎉 ¡Tu pedido ha sido confirmado!",
                        waitingResponse: "⏳ Procesando tu pedido, espera un momento...",
                        goodbye: "👋 ¡Gracias por tu visita! Esperamos verte pronto."
                    }
                })
            },
            {
                id: 'personalizado',
                name: 'Personalizado',
                description: 'Bot personalizado desde cero',
                category: 'custom',
                flows: JSON.stringify([{
                    name: "MENU_PRINCIPAL",
                    description: "Menú principal del bot",
                    steps: ["INITIAL", "AWAITING_CHOICE"],
                    options: [
                        { number: 1, text: "Opción 1", action: "option1" },
                        { number: 2, text: "Opción 2", action: "option2" },
                        { number: 3, text: "Opción 3", action: "option3" },
                        { number: 4, text: "Opción 4", action: "option4" },
                        { number: 5, text: "Opción 5", action: "option5" }
                    ]
                }]),
                messages: JSON.stringify({
                    greetings: {
                        morning: "Buenos días",
                        afternoon: "Buenas tardes",
                        evening: "Buenas noches",
                        newUser: "Bienvenido"
                    },
                    errors: {
                        invalidOption: "Opción no válida",
                        apiError: "Error de sistema",
                        outsideHours: "Fuera de horario",
                        userPaused: "Sesión pausada"
                    },
                    confirmations: {
                        dataSaved: "Información guardada",
                        processComplete: "Proceso completado",
                        waitingResponse: "Procesando...",
                        goodbye: "Hasta pronto"
                    }
                })
            }
        ];
        
        for (const template of templates) {
            await connection.query(
                'INSERT INTO templates (id, name, description, category, flows, messages, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
                [template.id, template.name, template.description, template.category, template.flows, template.messages]
            );
            console.log(`   ✅ Template "${template.name}" insertado`);
        }
        
        // 3. Verificar bots existentes
        console.log('\n📊 Verificando bots existentes...');
        const [bots] = await connection.query('SELECT id, name, token FROM bots');
        console.log(`   Encontrados ${bots.length} bots en la base de datos`);
        
        if (bots.length > 0) {
            console.log('   📋 Lista de bots:');
            bots.forEach((bot, index) => {
                console.log(`      ${index + 1}. ${bot.name} - Token: ${bot.token ? bot.token.substring(0, 8) + '...' : 'Sin token'}`);
            });
        }
        
        console.log('\n🎉 ¡Duplicados corregidos exitosamente!');
        console.log('✅ Ahora puedes iniciar el servidor con: npm run dev');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Conexión cerrada');
        }
    }
}

fixDuplicates();