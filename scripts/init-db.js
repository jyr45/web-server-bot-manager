const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function initializeDatabase() {
    try {
        // Conectar a MySQL
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'bot_manager'
        });

        console.log('Conectado a MySQL');

        // Crear tabla de usuarios
        const createUsersTable = `
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role ENUM('admin', 'user', 'viewer') DEFAULT 'admin',
                active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                last_login TIMESTAMP NULL,
                INDEX idx_email (email),
                INDEX idx_active (active)
            )
        `;

        await connection.execute(createUsersTable);
        console.log('Tabla de usuarios creada');

        // Crear usuario administrador por defecto
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        const insertAdmin = `
            INSERT INTO users (name, email, password, role) 
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE name = VALUES(name)
        `;

        await connection.execute(insertAdmin, [
            'Administrador',
            'admin@botmanager.com',
            hashedPassword,
            'admin'
        ]);

        console.log('Usuario administrador creado');
        console.log('Email: admin@botmanager.com');
        console.log('Contraseña: admin123');

        await connection.end();
        console.log('Inicialización completada');

    } catch (error) {
        console.error('Error inicializando base de datos:', error);
        process.exit(1);
    }
}

initializeDatabase();