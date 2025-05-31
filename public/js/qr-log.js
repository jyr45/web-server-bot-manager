// REEMPLAZAR: Todo el contenido de qr-log.js con este código mejorado
//--========================  MONITOR Y QR FUNCION  ============================

// Variables globales para el monitor
let selectedBotId = null;
let botLogsHistory = [];
let currentQRCode = null;

// Función principal de inicialización - Se ejecuta cuando se carga el script
(function () {
    console.log('[QR Monitor] Script cargado');

    // Registrar para inicialización cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeQrMonitor);
    } else {
        // Si el DOM ya está cargado, inicializar inmediatamente
        initializeQrMonitor();
    }

    // También escuchar el evento de "carga de sección" personalizado
    document.addEventListener('sectionChanged', function (e) {
        if (e.detail && e.detail.section === 'bot-monitor') {
            console.log('[QR Monitor] Sección de monitor activada');
            loadMonitorTab();
        }
    });
})();

// Función de inicialización que comprueba si estamos en la sección correcta
function initializeQrMonitor() {
    console.log('[QR Monitor] DOM cargado, verificando sección...');

    // Verificar si la sección del monitor existe y está activa
    const monitorSection = document.getElementById('bot-monitor');

    if (monitorSection) {
        console.log('[QR Monitor] Sección de monitor encontrada');

        // Si la sección está activa, inicializar completamente
        if (monitorSection.classList.contains('active')) {
            console.log('[QR Monitor] Sección activa, inicializando monitor...');
            initBotMonitor();
        }

        // Modificar la función global showSection para manejar la activación
        overrideShowSectionFunction();
    } else {
        console.log('[QR Monitor] Sección de monitor no encontrada');
    }
}

// Sobrescribir función showSection para detectar cuando se activa el monitor
function overrideShowSectionFunction() {
    if (typeof window.showSection === 'function') {
        console.log('[QR Monitor] Sobreescribiendo función showSection');

        // Guardar referencia a la función original
        const originalShowSection = window.showSection;

        // Reemplazar con nuestra versión que detecta cambios al monitor
        window.showSection = function (sectionId) {
            console.log(`[QR Monitor] Cambiando a sección: ${sectionId}`);

            // Llamar a la función original
            originalShowSection(sectionId);

            // Si cambiamos al monitor, inicializar
            if (sectionId === 'bot-monitor') {
                console.log('[QR Monitor] Activando sección de monitor...');
                setTimeout(loadMonitorTab, 100); // Pequeño delay para asegurar que el DOM se actualice
            }
        };
    } else {
        console.warn('[QR Monitor] No se encontró la función showSection');
    }
}

// Función para cargar la pestaña del monitor
function loadMonitorTab() {
    console.log('[QR Monitor] Cargando pestaña de monitor...');

    // Verificar si el monitor ya está inicializado
    if (!document.getElementById('botMonitorInitialized')) {
        console.log('[QR Monitor] Inicializando por primera vez');

        // Marcar como inicializado para evitar múltiples inicializaciones
        const marker = document.createElement('div');
        marker.id = 'botMonitorInitialized';
        marker.style.display = 'none';
        document.body.appendChild(marker);

        // Inicializar completamente
        initBotMonitor();
    } else {
        console.log('[QR Monitor] Ya inicializado, refrescando datos');

        // Solo refrescar datos
        refreshBotMonitor();
    }
}

// Inicializar monitor de bots
function initBotMonitor() {
    console.log('[QR Monitor] Inicializando monitor de bots...');

    // Limpiar todos los contenedores
    clearBotMonitor();

    // Añadir log inicial al contenedor de logs
    const logsContainer = document.getElementById('botLogsContainer');
    if (logsContainer) {
        logsContainer.innerHTML = `<div class="log-entry log-info">[${new Date().toLocaleTimeString()}] Monitor de bots inicializado</div>`;
    }

    // Mostrar mensaje de espera en el contenedor de QR
    const qrContainer = document.getElementById('qrCodeContainer');
    if (qrContainer) {
        qrContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-qrcode" style="font-size: 64px; color: #ccc;"></i>
                <h4>Esperando código QR....</h4>
                <p>Inicia un bot para ver su código QR aquí</p>
            </div>
        `;
    }

    // Cargar bots para el selector
    loadBotsForMonitor().then(bots => {
        console.log(`[QR Monitor] ${bots.length} bots cargados`);

        // Seleccionar el primer bot automáticamente si hay alguno
        if (bots.length > 0 && !selectedBotId) {
            selectedBotId = bots[0].id;

            // Actualizar selector en la UI
            const select = document.getElementById('selectedBotForMonitor');
            if (select) {
                select.value = selectedBotId;
                console.log(`[QR Monitor] Bot seleccionado automáticamente: ${selectedBotId}`);

                // Cargar información del bot
                loadBotInfo(selectedBotId);
            }
        }
    }).catch(error => {
        console.error('[QR Monitor] Error cargando bots:', error);
    });

    // Configurar event listener para cambio de bot
    const select = document.getElementById('selectedBotForMonitor');
    if (select) {
        // Eliminar listeners anteriores para evitar duplicados
        select.removeEventListener('change', handleBotSelection);
        select.addEventListener('change', handleBotSelection);
    }

    // Configurar listener para auto-scroll
    const autoScrollCheckbox = document.getElementById('autoScrollLogs');
    if (autoScrollCheckbox) {
        autoScrollCheckbox.addEventListener('change', function () {
            if (this.checked) {
                const logsContainer = document.getElementById('botLogsContainer');
                if (logsContainer) {
                    logsContainer.scrollTop = logsContainer.scrollHeight;
                }
            }
        });
    }

    // Configurar conexión WebSocket
    setupWebSocketConnection();
}

// Manejar cambio de selección de bot
function handleBotSelection() {
    const select = document.getElementById('selectedBotForMonitor');
    if (!select) return;

    const newBotId = select.value;
    console.log(`[QR Monitor] Bot seleccionado cambiado a: ${newBotId}`);

    // Actualizar bot seleccionado
    selectedBotId = newBotId;

    // Limpiar datos previos
    clearBotMonitor();

    // Cargar información del nuevo bot seleccionado
    if (selectedBotId) {
        loadBotInfo(selectedBotId);
    }
}

// Configurar conexión WebSocket
function setupWebSocketConnection() {
    try {
        // Obtener protocolo (ws o wss) basado en HTTP o HTTPS
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}`;

        console.log(`[QR Monitor] Conectando a WebSocket: ${wsUrl}`);

        // Crear conexión WebSocket
        const socket = new WebSocket(wsUrl);

        socket.addEventListener('open', () => {
            console.log('[QR Monitor] WebSocket conectado');
            addBotLog('INFO', 'Conexión WebSocket establecida', new Date());

            // Enviar ping periódico para mantener conexión activa
            const pingInterval = setInterval(() => {
                if (socket.readyState === WebSocket.OPEN) {
                    try {
                        socket.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
                    } catch (error) {
                        console.error('[QR Monitor] Error enviando ping:', error);
                        clearInterval(pingInterval);
                    }
                } else {
                    clearInterval(pingInterval);
                }
            }, 30000); // cada 30 segundos

            // Limpiar intervalo al cerrar
            socket.addEventListener('close', () => {
                clearInterval(pingInterval);
            });
        });

        socket.addEventListener('message', (event) => {
            try {
                const data = JSON.parse(event.data);
                handleWebSocketMessage(data);
            } catch (error) {
                console.error('[QR Monitor] Error procesando mensaje WebSocket:', error);
            }
        });

        socket.addEventListener('close', (event) => {
            console.warn(`[QR Monitor] WebSocket desconectado (código: ${event.code}, razón: ${event.reason || 'Sin razón'})`);
            addBotLog('WARN', 'Conexión WebSocket cerrada. Reconectando...', new Date());

            // Reconectar después de un tiempo con retraso exponencial
            let reconnectDelay = 1000; // Comenzar con 1 segundo

            if (window.wsReconnectAttempts === undefined) {
                window.wsReconnectAttempts = 0;
            }

            window.wsReconnectAttempts++;

            // Calcular retraso exponencial con límite de 30 segundos
            reconnectDelay = Math.min(30000, Math.pow(1.5, Math.min(window.wsReconnectAttempts, 10)) * 1000);

            console.log(`[QR Monitor] Reintentando conexión en ${reconnectDelay / 1000} segundos (intento ${window.wsReconnectAttempts})`);

            setTimeout(() => {
                if (document.getElementById('botMonitorInitialized')) {
                    setupWebSocketConnection();
                } else {
                    console.log('[QR Monitor] No se reconecta porque la sección no está activa');
                    window.wsReconnectAttempts = 0;
                }
            }, reconnectDelay);
        });

        socket.addEventListener('error', (error) => {
            console.error('[QR Monitor] Error en WebSocket:', error);
            addBotLog('ERROR', 'Error en la conexión WebSocket', new Date());
        });

        // Guardar referencia global al socket
        window.qrMonitorSocket = socket;
    } catch (error) {
        console.error('[QR Monitor] Error configurando WebSocket:', error);
        addBotLog('ERROR', `Error configurando WebSocket: ${error.message}`, new Date());

        // Intentar reconectar después de un tiempo
        setTimeout(() => {
            if (document.getElementById('botMonitorInitialized')) {
                setupWebSocketConnection();
            }
        }, 5000);
    }
}

// Manejar mensajes del WebSocket
function handleWebSocketMessage(data) {
    // Filtrar tipos de mensajes que nos interesan
    if (data.type === 'qr_code') {
        //console.log(`[QR Monitor] Recibido QR para bot: ${data.botId}`);

        // Verificar si coincide con nuestro bot seleccionado
        if (data.botId === selectedBotId) {
            //console.log('[QR Monitor] QR coincide con bot seleccionado, mostrando...');

            // Mostrar código QR
            if (data.qrImagePath) {
                displayQRCode(data.qr, data.botId, data.qrImagePath);
                addBotLog('INFO', 'Código QR recibido y mostrado', new Date());
            } else {
                //console.error('[QR Monitor] Error: QR sin ruta de imagen');
                addBotLog('ERROR', 'QR recibido pero sin ruta de imagen', new Date());
            }
        } else {
            //console.log(`[QR Monitor] QR ignorado (bot seleccionado: ${selectedBotId}, QR para: ${data.botId})`);
        }
    }
    else if (data.type === 'bot_status' && data.botId === selectedBotId) {
        //console.log(`[QR Monitor] Actualización de estado para bot ${data.botId}: ${data.status}`);
        updateBotStatusUI(data.status);
        addBotLog('INFO', `Estado actualizado: ${data.status}`, new Date());
    }
    else if (data.type === 'log' && data.botId === selectedBotId) {
        //console.log(`[QR Monitor] Log para bot ${data.botId}: ${data.message}`);
        addBotLog(data.level || 'INFO', data.message, new Date());
    }
    else if (data.type === 'bot_authenticated' && data.botId === selectedBotId) {
        //console.log(`[QR Monitor] Bot ${data.botId} autenticado`);
        addBotLog('SUCCESS', '¡WhatsApp autenticado exitosamente!', new Date());
        clearQRCode();
    }
    else if (data.type === 'bot_ready' && data.botId === selectedBotId) {
        //console.log(`[QR Monitor] Bot ${data.botId} listo`);
        addBotLog('SUCCESS', '¡Bot listo y operativo!', new Date());
        loadBotInfo(selectedBotId);
    }
    else if (data.type === 'bot_disconnected' && data.botId === selectedBotId) {
        //console.log(`[QR Monitor] Bot ${data.botId} desconectado`);
        addBotLog('WARN', 'Bot desconectado de WhatsApp', new Date());
        clearQRCode();
    }
}

// Cargar bots para el monitor
async function loadBotsForMonitor() {
    try {
        console.log('[QR Monitor] Cargando lista de bots...');

        // Mostrar indicador de carga
        const selectElement = document.getElementById('selectedBotForMonitor');
        if (selectElement) {
            selectElement.innerHTML = '<option value="">Cargando bots...</option>';
        }

        // Cargar lista de bots
        const response = await fetch('/api/bots');
        const data = await response.json();

        // Verificar respuesta
        if (!data.success) {
            throw new Error('Error en respuesta del servidor');
        }

        // Verificar selector
        if (!selectElement) {
            throw new Error('Selector no encontrado en el DOM');
        }

        // Resetear selector
        selectElement.innerHTML = '<option value="">Selecciona un bot para monitorear</option>';

        // Variable para almacenar los bots
        let bots = [];

        // Verificar si hay bots
        if (data.bots && data.bots.length > 0) {
            bots = data.bots;

            // Añadir opciones al selector
            bots.forEach(bot => {
                const option = document.createElement('option');
                option.value = bot.id;

                // Añadir indicador visual de estado
                const statusIndicator = bot.status === 'running' ? '🟢' :
                    (bot.status === 'error' ? '🔴' : '⚪');

                option.textContent = `${statusIndicator} ${bot.name} (${bot.company})`;
                selectElement.appendChild(option);
            });

            console.log(`[QR Monitor] ${bots.length} bots cargados`);

            // Si hay un bot seleccionado previamente, restaurarlo
            if (selectedBotId && selectElement.querySelector(`option[value="${selectedBotId}"]`)) {
                selectElement.value = selectedBotId;
            }
            // Si no hay bot seleccionado pero hay bots disponibles, seleccionar el primero
            else if (bots.length > 0 && !selectedBotId) {
                selectedBotId = bots[0].id;
                selectElement.value = selectedBotId;
            }
        } else {
            console.log('[QR Monitor] No se encontraron bots');
            selectElement.innerHTML = '<option value="">No hay bots disponibles</option>';
        }

        return bots;
    } catch (error) {
        console.error('[QR Monitor] Error cargando bots:', error);

        // Mostrar error en el selector
        const selectElement = document.getElementById('selectedBotForMonitor');
        if (selectElement) {
            selectElement.innerHTML = '<option value="">Error cargando bots</option>';
        }

        return [];
    }
}

// Cargar información del bot
async function loadBotInfo(botId) {
    if (!botId) {
        console.warn('[QR Monitor] No hay bot seleccionado');
        return;
    }

    try {
        console.log(`[QR Monitor] Cargando información del bot: ${botId}`);

        // Mostrar indicador de carga
        const statusInfo = document.getElementById('botStatusInfo');
        const statsInfo = document.getElementById('botStatsInfo');

        if (statusInfo) statusInfo.innerHTML = '<p>Cargando información...</p>';
        if (statsInfo) statsInfo.innerHTML = '<p>Cargando estadísticas...</p>';

        // Cargar información del bot
        const response = await fetch(`/api/bots/${botId}`);

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
            const bot = data.bot;

            // Actualizar información de estado
            if (statusInfo) {
                // Determinar estado visual (online/offline)
                const isOnline = ['running', 'authenticated', 'ready', 'starting'].includes(bot.status);

                statusInfo.innerHTML = `
                    <p><strong>Nombre:</strong> ${bot.name}</p>
                    <p><strong>Empresa:</strong> ${bot.company}</p>
                    <p><strong>Estado:</strong> <span class="status-indicator status-${isOnline ? 'online' : 'offline'}">
                        <span class="status-dot"></span>${getStatusText(bot.status)}</span></p>
                    <p><strong>Plan:</strong> ${bot.plan}</p>
                    <p><strong>URL:</strong> <small>localhost/${bot.token.substring(0, 8)}...</small></p>
                `;
            }

            // Actualizar estadísticas
            if (statsInfo) {
                // Formatear fechas correctamente
                let createdDate = 'N/A';
                let lastActivityDate = 'Nunca';

                try {
                    if (bot.createdAt) {
                        const date = new Date(bot.createdAt);
                        if (!isNaN(date.getTime())) {
                            createdDate = date.toLocaleDateString();
                        }
                    }

                    if (bot.lastActivity) {
                        const date = new Date(bot.lastActivity);
                        if (!isNaN(date.getTime())) {
                            lastActivityDate = date.toLocaleString();
                        }
                    }
                } catch (dateError) {
                    console.error('[QR Monitor] Error formateando fechas:', dateError);
                }

                statsInfo.innerHTML = `
                    <p><strong>Mensajes:</strong> ${bot.stats?.messages || 0}</p>
                    <p><strong>Usuarios:</strong> ${bot.stats?.users || 0}</p>
                    <p><strong>Creado:</strong> ${createdDate}</p>
                    <p><strong>Última actividad:</strong> ${lastActivityDate}</p>
                `;
            }

            // Añadir log
            addBotLog('INFO', `Información cargada para bot: ${bot.name}`, new Date());

            // Mensaje específico según estado
            if (['running', 'authenticated', 'ready'].includes(bot.status)) {
                addBotLog('INFO', 'Bot está ejecutándose. Los logs aparecerán aquí...', new Date());
            } else if (bot.status === 'starting') {
                addBotLog('INFO', 'Bot está iniciándose. Espere un momento...', new Date());
            } else {
                addBotLog('WARN', 'Bot no está ejecutándose. Inicia el bot para conectar.', new Date());
            }

            console.log(`[QR Monitor] Información cargada para bot: ${bot.name}`);
        } else {
            throw new Error(data.error || 'Error cargando información del bot');
        }
    } catch (error) {
        console.error(`[QR Monitor] Error cargando información del bot ${botId}:`, error);

        const statusInfo = document.getElementById('botStatusInfo');
        if (statusInfo) {
            statusInfo.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Error cargando información: ${error.message}</p>
                </div>
            `;
        }

        addBotLog('ERROR', `Error cargando información: ${error.message}`, new Date());
    }
}

// Obtener texto del estado
function getStatusText(status) {
    const statusTexts = {
        'created': 'Creado',
        'running': 'Ejecutándose',
        'stopped': 'Detenido',
        'error': 'Error',
        'starting': 'Iniciando',
        'authenticated': 'Autenticado'
    };
    return statusTexts[status] || status;
}

// Mostrar código QR
function displayQRCode(qrData, botId, imagePath) {
    if (botId !== selectedBotId) {
        console.log(`[QR Monitor] Ignorando QR para bot ${botId}, el bot seleccionado es ${selectedBotId}`);
        return;
    }

    console.log(`[QR Monitor] Mostrando QR para bot ${botId} con imagen: ${imagePath}`);

    // Guardar datos del QR
    currentQRCode = qrData;

    // Obtener contenedor
    const qrContainer = document.getElementById('qrCodeContainer');
    if (!qrContainer) {
        console.error('[QR Monitor] Contenedor de QR no encontrado');
        return;
    }

    // Limpiar contenedor
    qrContainer.innerHTML = '';

    // Crear estructura para mostrar el QR
    qrContainer.innerHTML = `
        <div class="qr-content">
            <div class="qr-display">
                <img id="qrImage" src="${imagePath}" alt="Código QR" 
                     style="max-width: 250px; height: auto; border: 1px solid #ddd; border-radius: 8px;">
            </div>
            <h4 style="color: #25D366; margin-top: 15px;">¡Código QR Generado!</h4>
            <p>Escanea con WhatsApp para conectar el bot</p>
            <div class="qr-countdown">
                <i class="fas fa-clock"></i> Este código expira en 45 segundos
            </div>
            <div class="qr-instructions" style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin-top: 15px;">
                <h6><i class="fas fa-mobile-alt"></i> Cómo escanear:</h6>
                <ol style="text-align: left; margin: 10px 0;">
                    <li>Abre WhatsApp en tu teléfono</li>
                    <li>Ve a Configuración > Dispositivos vinculados</li>
                    <li>Toca "Vincular un dispositivo"</li>
                    <li>Escanea el código QR de arriba</li>
                </ol>
            </div>
        </div>
    `;

    // Manejar errores de carga de imagen
    const qrImage = document.getElementById('qrImage');
    if (qrImage) {
        qrImage.onerror = function () {
            console.error('[QR Monitor] Error cargando imagen QR:', imagePath);

            // Mostrar error
            qrContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #dc3545;"></i>
                    <h4>Error cargando QR</h4>
                    <p>La imagen no pudo ser cargada. Intenta reiniciar el bot.</p>
                    <p><small>URL: ${imagePath}</small></p>
                    <button class="btn btn-primary" onclick="refreshBotMonitor()">
                        <i class="fas fa-sync"></i> Reintentar
                    </button>
                </div>
            `;
        };
    }
}

// Limpiar código QR
function clearQRCode() {
    currentQRCode = null;

    const qrContainer = document.getElementById('qrCodeContainer');
    if (qrContainer) {
        qrContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-check-circle" style="font-size: 64px; color: #4caf50;"></i>
                <h4>¡Conexión exitosa!</h4>
                <p>El bot se conectó correctamente.</p>
            </div>
        `;
    }
}

// Agregar log del bot
function addBotLog(level, message, timestamp = new Date()) {
    // Crear entrada de log
    const logEntry = {
        timestamp: timestamp,
        level: level,
        message: message
    };

    // Añadir a historial
    botLogsHistory.push(logEntry);

    // Limitar historial a 1000 entradas
    if (botLogsHistory.length > 1000) {
        botLogsHistory = botLogsHistory.slice(-1000);
    }

    // Obtener contenedor de logs
    const logsContainer = document.getElementById('botLogsContainer');
    if (!logsContainer) return;

    // Formatear timestamp
    const timeStr = timestamp.toLocaleTimeString();

    // Determinar clase de log según nivel
    let logClass = 'log-info';
    if (level.toUpperCase() === 'ERROR') logClass = 'log-error';
    else if (level.toUpperCase() === 'WARN') logClass = 'log-warning';
    else if (level.toUpperCase() === 'SUCCESS') logClass = 'log-success';

    // Crear elemento de log
    const logLine = document.createElement('div');
    logLine.className = `log-entry ${logClass}`;
    logLine.textContent = `[${timeStr}] [${level}] ${message}`;

    // Añadir al contenedor
    logsContainer.appendChild(logLine);

    // Auto-scroll si está habilitado
    const autoScroll = document.getElementById('autoScrollLogs');
    if (autoScroll && autoScroll.checked) {
        logsContainer.scrollTop = logsContainer.scrollHeight;
    }
}

// Appendear entrada de log (alias para compatibilidad)
function appendLogEntry(text, level = 'INFO') {
    addBotLog(level.toUpperCase(), text);
}

// Limpiar logs del bot
function clearBotLogs() {
    botLogsHistory = [];

    const logsContainer = document.getElementById('botLogsContainer');
    if (logsContainer) {
        logsContainer.innerHTML = `
            <div class="log-entry log-info">[${new Date().toLocaleTimeString()}] [INFO] Logs limpiados - Monitor listo...</div>
        `;
    }
}

// Descargar logs del bot
function downloadBotLogs() {
    if (botLogsHistory.length === 0) {
        alert('No hay logs para descargar');
        return;
    }

    // Formatear logs
    const logsText = botLogsHistory.map(log =>
        `[${log.timestamp.toISOString()}] [${log.level}] ${log.message}`
    ).join('\n');

    // Crear blob y enlace de descarga
    const blob = new Blob([logsText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `bot_logs_${selectedBotId || 'unknown'}_${new Date().toISOString().split('T')[0]}.txt`;

    // Añadir a DOM, click y limpiar
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    console.log('[QR Monitor] Logs descargados');
}

// Limpiar monitor de bot
function clearBotMonitor() {
    // Limpiar QR
    const qrContainer = document.getElementById('qrCodeContainer');
    if (qrContainer) {
        qrContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-qrcode" style="font-size: 64px; color: #ccc;"></i>
                <h4>Esperando código QR......</h4>
                <p>Inicia un bot para ver su código QR aquí</p>
            </div>
        `;
    }

    // Limpiar logs
    const logsContainer = document.getElementById('botLogsContainer');
    if (logsContainer) {
        logsContainer.innerHTML = '';
    }

    // Resetear historial
    botLogsHistory = [];
}

// Actualizar estado del bot en UI
function updateBotStatusUI(status) {
    const statusInfo = document.getElementById('botStatusInfo');
    if (!statusInfo) return;

    // Extraer HTML actual
    const currentHTML = statusInfo.innerHTML;

    // Actualizar solo la parte del estado
    const updatedHTML = currentHTML.replace(
        /<p><strong>Estado:<\/strong>.*?<\/p>/,
        `<p><strong>Estado:</strong> <span class="status-indicator status-${status === 'running' ? 'online' : 'offline'}">
            <span class="status-dot"></span>${getStatusText(status)}</span></p>`
    );

    // Actualizar DOM
    statusInfo.innerHTML = updatedHTML;
}

// Iniciar bot seleccionado
async function startSelectedBot() {
    if (!selectedBotId) {
        alert('Selecciona un bot primero');
        return;
    }

    try {
        console.log(`[QR Monitor] Iniciando bot: ${selectedBotId}`);
        addBotLog('INFO', 'Iniciando bot...', new Date());

        // Mostrar indicador de carga para QR
        const qrContainer = document.getElementById('qrCodeContainer');
        if (qrContainer) {
            qrContainer.innerHTML = `
                <div class="loading-indicator">
                    <div class="spinner"></div>
                    <p>Iniciando bot...</p>
                </div>
            `;
        }

        // Solicitar inicio del bot
        const response = await fetch(`/api/bots/${selectedBotId}/start`, {
            method: 'POST'
        });

        const data = await response.json();

        if (data.success) {
            console.log('[QR Monitor] Bot iniciado exitosamente');
            addBotLog('SUCCESS', 'Bot iniciado exitosamente', new Date());
            addBotLog('INFO', 'Esperando código QR de WhatsApp.......', new Date());

            // Actualizar contenedor de QR
            if (qrContainer) {
                qrContainer.innerHTML = `
                    <div class="loading-indicator">
                        <div class="spinner"></div>
                        <p>Esperando QR...</p>
                    </div>
                `;
            }

            // Actualizar información del bot
            loadBotInfo(selectedBotId);
        } else {
            throw new Error(data.error || 'Error desconocido');
        }
    } catch (error) {
        console.error('[QR Monitor] Error iniciando bot:', error);
        addBotLog('ERROR', `Error iniciando bot: ${error.message}`, new Date());

        // Mostrar error en QR
        const qrContainer = document.getElementById('qrCodeContainer');
        if (qrContainer) {
            qrContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #dc3545;"></i>
                    <h4>Error iniciando bot</h4>
                    <p>${error.message}</p>
                    <button class="btn btn-primary" onclick="refreshBotMonitor()">
                        <i class="fas fa-sync"></i> Reintentar
                    </button>
                </div>
            `;
        }
    }
}

// Detener bot seleccionado
// Reemplazar la función stopSelectedBot existente en qr-log.js
async function stopSelectedBot() {
    if (!selectedBotId) {
        alert('Selecciona un bot primero');
        return;
    }

    try {
        console.log(`[QR Monitor] Deteniendo bot: ${selectedBotId}`);
        addBotLog('INFO', 'Enviando solicitud para detener bot...', new Date());

        // Mostrar indicador de procesamiento
        const qrContainer = document.getElementById('qrCodeContainer');
        if (qrContainer) {
            qrContainer.innerHTML = `
                <div class="loading-indicator">
                    <div class="spinner"></div>
                    <p>Deteniendo bot...</p>
                </div>
            `;
        }

        // Solicitar detención del bot con timeout más largo
        const response = await fetch(`/api/bots/${selectedBotId}/stop`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            // No añadir timeout para evitar abortar la operación prematuramente
        });

        // Verificar respuesta HTTP
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();

        if (data.success) {
            console.log('[QR Monitor] Bot detenido exitosamente');
            addBotLog('SUCCESS', 'Bot detenido exitosamente. La sesión de WhatsApp ha sido cerrada.', new Date());

            // Limpiar QR y actualizar UI inmediatamente
            clearQRCode();

            // Actualizar información del bot tras una pausa para permitir que el servidor actualice el estado
            setTimeout(() => {
                loadBotInfo(selectedBotId);
            }, 2000);

            // Mostrar mensaje de éxito en el contenedor QR
            if (qrContainer) {
                qrContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-power-off" style="font-size: 48px; color: #dc3545;"></i>
                        <h4>Bot detenido</h4>
                        <p>El bot ha sido detenido exitosamente.</p>
                        <button class="btn btn-success" onclick="startSelectedBot()">
                            <i class="fas fa-play"></i> Iniciar bot
                        </button>
                    </div>
                `;
            }
        } else {
            throw new Error(data.error || 'Error desconocido');
        }
    } catch (error) {
        console.error('[QR Monitor] Error deteniendo bot:', error);
        addBotLog('ERROR', `Error deteniendo bot: ${error.message}`, new Date());

        // Mostrar error en el contenedor QR
        const qrContainer = document.getElementById('qrCodeContainer');
        if (qrContainer) {
            qrContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #dc3545;"></i>
                    <h4>Error deteniendo bot</h4>
                    <p>${error.message}</p>
                    <button class="btn btn-primary" onclick="refreshBotMonitor()">
                        <i class="fas fa-sync"></i> Reintentar
                    </button>
                </div>
            `;
        }

        // Intentar actualizar la información del bot para mostrar su estado real
        setTimeout(() => {
            loadBotInfo(selectedBotId);
        }, 2000);
    }
}

// Actualizar monitor
function refreshBotMonitor() {
    console.log('[QR Monitor] Actualizando monitor...');

    // Recargar lista de bots
    loadBotsForMonitor().then(() => {
        // Si hay un bot seleccionado, actualizar su información
        if (selectedBotId) {
            loadBotInfo(selectedBotId);
        }
    });
}