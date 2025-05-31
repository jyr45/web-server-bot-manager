-- db/schema.sql
-- Esquema de base de datos para WhatsApp Bot Manager

-- Bots
CREATE TABLE IF NOT EXISTS bots (
  id VARCHAR(50) PRIMARY KEY,
  token VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  company VARCHAR(100) NOT NULL,
  plan ENUM('emprendedor', 'profesional', 'empresarial') NOT NULL DEFAULT 'emprendedor',
  admin_number VARCHAR(20) NOT NULL,
  command_prefix VARCHAR(5) NOT NULL DEFAULT '!',
  description TEXT,
  api_base_url VARCHAR(255),
  api_password VARCHAR(255),
  enable_ai BOOLEAN NOT NULL DEFAULT 0,
  gemini_api_key VARCHAR(255),
  session_timeout INT NOT NULL DEFAULT 15,
  default_pause INT NOT NULL DEFAULT 30,
  flows JSON,
  messages JSON,
  apis JSON,
  status ENUM('created', 'running', 'stopped', 'error') NOT NULL DEFAULT 'created',
  created_at DATETIME NOT NULL,
  updated_at DATETIME,
  last_activity DATETIME,
  stats JSON,
  INDEX idx_token (token),
  INDEX idx_status (status)
);

-- Usuarios (clientes que interactúan con los bots)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  phone VARCHAR(20) NOT NULL,
  name VARCHAR(100),
  bot_id VARCHAR(50) NOT NULL,
  first_contact DATETIME NOT NULL,
  last_contact DATETIME NOT NULL,
  session_data JSON,
  status ENUM('active', 'blocked', 'paused') NOT NULL DEFAULT 'active',
  messages_count INT NOT NULL DEFAULT 0,
  FOREIGN KEY (bot_id) REFERENCES bots(id) ON DELETE CASCADE,
  UNIQUE KEY unique_phone_bot (phone, bot_id),
  INDEX idx_last_contact (last_contact)
);

-- Logs del sistema
CREATE TABLE IF NOT EXISTS logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  level ENUM('INFO', 'WARN', 'ERROR', 'DEBUG', 'BOT') NOT NULL,
  message TEXT NOT NULL,
  bot_id VARCHAR(50),
  created_at DATETIME NOT NULL,
  INDEX idx_level (level),
  INDEX idx_bot_id (bot_id),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (bot_id) REFERENCES bots(id) ON DELETE SET NULL
);

-- Plantillas
CREATE TABLE IF NOT EXISTS templates (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  flows JSON,
  messages JSON,
  created_at DATETIME NOT NULL,
  updated_at DATETIME
);

-- Respaldos
CREATE TABLE IF NOT EXISTS backups (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  filename VARCHAR(255) NOT NULL,
  size INT NOT NULL,
  created_at DATETIME NOT NULL,
  contents JSON,
  INDEX idx_created_at (created_at)
);

-- Análisis de mensajes
CREATE TABLE IF NOT EXISTS message_analytics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bot_id VARCHAR(50) NOT NULL,
  date DATE NOT NULL,
  total_messages INT NOT NULL DEFAULT 0,
  unique_users INT NOT NULL DEFAULT 0,
  response_rate DECIMAL(5,2),
  avg_response_time INT,
  FOREIGN KEY (bot_id) REFERENCES bots(id) ON DELETE CASCADE,
  UNIQUE KEY unique_bot_date (bot_id, date),
  INDEX idx_date (date)
);

-- Insertar plantillas por defecto
INSERT INTO templates (id, name, description, category, flows, messages, created_at)
VALUES 
('servicios', 'Servicios Técnicos', 'Bot para talleres y servicios de reparación', 'business', 
 '[{"name":"MENU_PRINCIPAL","description":"Menú principal del bot","steps":["INITIAL","AWAITING_CHOICE"],"options":[{"number":1,"text":"Información y Servicios","action":"info"},{"number":2,"text":"Consultar Estado","action":"status"},{"number":3,"text":"Hablar con Asesor","action":"human"},{"number":4,"text":"Acerca de Nosotros","action":"about"},{"number":5,"text":"Salir","action":"exit"}]}]',
 '{"greetings":{"morning":"¡Buenos días! 🌅 ¿Cómo puedo ayudarte hoy?","afternoon":"¡Buenas tardes! 🌞 ¿En qué puedo asistirte?","evening":"¡Buenas noches! 🌙 ¿Cómo puedo ayudarte?","newUser":"¡Hola! Veo que es tu primera vez aquí. Te explico brevemente cómo funciono..."},"errors":{"invalidOption":"❌ Opción no válida. Por favor, selecciona una opción del menú.","apiError":"😔 Ups, algo salió mal. Por favor, intenta de nuevo en unos momentos.","outsideHours":"🕐 Estamos fuera de horario de atención.","userPaused":"⏸️ El asistente está pausado. Escribe \\"reactivar\\" para continuar."},"confirmations":{"dataSaved":"✅ Información guardada correctamente.","processComplete":"🎉 ¡Proceso completado exitosamente!","waitingResponse":"⏳ Procesando tu solicitud, por favor espera...","goodbye":"👋 ¡Gracias por contactarnos! Que tengas un excelente día."}}',
 NOW()),
 
('restaurante', 'Restaurante/Comida', 'Bot para restaurantes con menú digital y pedidos a domicilio', 'food',
 '[{"name":"MENU_PRINCIPAL","description":"Menú principal del bot","steps":["INITIAL","AWAITING_CHOICE"],"options":[{"number":1,"text":"Ver Menú Digital","action":"menu"},{"number":2,"text":"Hacer Pedido","action":"order"},{"number":3,"text":"Reservar Mesa","action":"reservation"},{"number":4,"text":"Promociones","action":"promos"},{"number":5,"text":"Hablar con Atención","action":"human"}]}]',
 '{"greetings":{"morning":"¡Buenos días! 🌅 Bienvenido a nuestro restaurante","afternoon":"¡Buenas tardes! 🌞 Bienvenido a nuestro restaurante","evening":"¡Buenas noches! 🌙 Bienvenido a nuestro restaurante","newUser":"¡Hola! Bienvenido por primera vez a nuestro restaurante"},"errors":{"invalidOption":"❌ Opción no válida. Por favor, selecciona una opción de nuestro menú.","apiError":"😔 Ups, algo salió mal. Por favor, intenta de nuevo.","outsideHours":"🕐 En este momento estamos cerrados.","userPaused":"⏸️ Tu sesión está pausada. Escribe \\"reactivar\\" para continuar."},"confirmations":{"dataSaved":"✅ Pedido registrado correctamente.","processComplete":"🎉 ¡Tu pedido ha sido confirmado!","waitingResponse":"⏳ Procesando tu pedido, espera un momento...","goodbye":"👋 ¡Gracias por tu visita! Esperamos verte pronto."}}',
 NOW()),
 
('personalizado', 'Personalizado', 'Bot personalizado desde cero', 'custom',
 '[{"name":"MENU_PRINCIPAL","description":"Menú principal del bot","steps":["INITIAL","AWAITING_CHOICE"],"options":[{"number":1,"text":"Opción 1","action":"option1"},{"number":2,"text":"Opción 2","action":"option2"},{"number":3,"text":"Opción 3","action":"option3"},{"number":4,"text":"Opción 4","action":"option4"},{"number":5,"text":"Opción 5","action":"option5"}]}]',
 '{"greetings":{"morning":"Buenos días","afternoon":"Buenas tardes","evening":"Buenas noches","newUser":"Bienvenido"},"errors":{"invalidOption":"Opción no válida","apiError":"Error de sistema","outsideHours":"Fuera de horario","userPaused":"Sesión pausada"},"confirmations":{"dataSaved":"Información guardada","processComplete":"Proceso completado","waitingResponse":"Procesando...","goodbye":"Hasta pronto"}}',
 NOW());