
// Variables globales
let currentStep = 1;
let selectedPlan = 'emprendedor';
let currentBot = null;
let ws = null;

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    connectWebSocket();
    loadDashboard();
});

function initializeApp() {
    generateBotToken();
    updateBotSummary();
    showNotification('Sistema cargado correctamente', 'success');
}

function setupEventListeners() {
    // Navegación
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = item.getAttribute('data-section');
            showSection(sectionId);
        });
    });

    // Formularios - actualizar resumen en tiempo real
    const inputs = document.querySelectorAll('#create-bot input, #create-bot select, #create-bot textarea');
    inputs.forEach(input => {
        input.addEventListener('input', updateBotSummary);
        input.addEventListener('change', updateBotSummary);
    });
}

// ==================== NAVEGACIÓN ====================
function showSection(sectionId) {
    // Actualizar navegación
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    document.querySelectorAll('.section').forEach(section => section.classList.remove('active'));

    document.querySelector(`[data-section="${sectionId}"]`).classList.add('active');
    document.getElementById(sectionId).classList.add('active');

    // Cargar datos de la sección
    loadSectionData(sectionId);
}

function loadSectionData(sectionId) {
    switch (sectionId) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'bots':
            loadBots();
            break;
        case 'analytics':
            loadAnalytics();
            break;
        default:
            break;
    }
}

// ==================== WIZARD DE CREACIÓN ====================
function nextStep(step) {
    if (validateCurrentStep()) {
        currentStep = step;
        showWizardStep(step);
        updateProgress();
        updateBotSummary();
    }
}

function prevStep(step) {
    currentStep = step;
    showWizardStep(step);
    updateProgress();
}

function showWizardStep(step) {
    document.querySelectorAll('.wizard-step').forEach(s => s.classList.remove('active'));
    document.getElementById(`step${step}`).classList.add('active');
}

function updateProgress() {
    const progress = (currentStep / 4) * 100;
    document.getElementById('wizardProgress').style.width = `${progress}%`;
}

function validateCurrentStep() {
    switch (currentStep) {
        case 1:
            const botName = document.getElementById('botName').value.trim();
            const companyName = document.getElementById('companyName').value.trim();
            if (!botName || !companyName) {
                showNotification('Por favor completa todos los campos requeridos', 'error');
                return false;
            }
            return true;
        case 2:
            const adminNumber = document.getElementById('adminNumber').value.trim();
            if (!adminNumber || !/^521\d{10}$/.test(adminNumber)) {
                showNotification('El número de administrador debe tener el formato 521XXXXXXXXXX', 'error');
                return false;
            }
            return true;
        default:
            return true;
    }
}

// ==================== GESTIÓN DE TOKENS ====================
function generateBotToken() {
    const token = generateRandomToken(32);
    document.getElementById('botToken').value = token;
    document.getElementById('tokenPreview').textContent = token.substring(0, 8) + '...';
    updateBotSummary();
}

function generateRandomToken(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

// ==================== CONFIGURACIÓN DE IA ====================
function toggleAIConfig() {
    const enableAI = document.getElementById('enableAI').checked;
    const aiConfig = document.getElementById('aiConfig');
    aiConfig.style.display = enableAI ? 'block' : 'none';
}

// ==================== SELECCIÓN DE PLANES ====================
function selectPlan(planType) {
    selectedPlan = planType;
    document.querySelectorAll('.plan-card').forEach(card => card.classList.remove('selected'));
    document.querySelector(`[data-plan="${planType}"]`).classList.add('selected');

    const selectElement = document.getElementById('selectedPlan');
    if (selectElement) {
        selectElement.value = planType;
    }

    const planNames = {
        emprendedor: 'Emprendedor Local',
        profesional: 'Profesional Eficiente',
        empresarial: 'Empresarial Avanzado'
    };

    showNotification(`Plan ${planNames[planType]} seleccionado`, 'success');
    updateBotSummary();
}

// ==================== RESUMEN DEL BOT ====================
function updateBotSummary() {
    const summary = document.getElementById('botSummary');
    if (!summary) return;

    const botName = document.getElementById('botName').value || 'Sin nombre';
    const companyName = document.getElementById('companyName').value || 'Sin empresa';
    const plan = document.getElementById('selectedPlan').value;
    const token = document.getElementById('botToken').value;
    const enableAI = document.getElementById('enableAI').checked;
    const adminNumber = document.getElementById('adminNumber').value || 'No configurado';

    summary.innerHTML = `
                <div class="grid-2">
                    <div>
                        <p><strong>Nombre del Bot:</strong> ${botName}</p>
                        <p><strong>Empresa:</strong> ${companyName}</p>
                        <p><strong>Plan:</strong> ${plan}</p>
                        <p><strong>Número Admin:</strong> ${adminNumber}</p>
                    </div>
                    <div>
                        <p><strong>URL del Bot:</strong> <small>localhost/${token.substring(0, 8)}...</small></p>
                        <p><strong>IA Habilitada:</strong> ${enableAI ? '✅ Sí' : '❌ No'}</p>
                        <p><strong>Estado:</strong> <span class="status-indicator status-loading"><span class="status-dot"></span>Pendiente</span></p>
                        <p><strong>Token:</strong> <small>${token.substring(0, 16)}...</small></p>
                    </div>
                </div>
            `;
}

// ==================== CREAR BOT ====================
async function createBot() {
    if (!validateCurrentStep()) return;

    const createBtn = document.getElementById('createBotBtn');
    const originalText = createBtn.innerHTML;

    // Deshabilitar botón y mostrar loading
    createBtn.disabled = true;
    createBtn.innerHTML = '<div class="loading"></div> Creando...';

    const botConfig = {
        name: document.getElementById('botName').value.trim(),
        company: document.getElementById('companyName').value.trim(),
        plan: document.getElementById('selectedPlan').value,
        token: document.getElementById('botToken').value,
        description: document.getElementById('businessDescription').value.trim(),
        adminNumber: document.getElementById('adminNumber').value.trim(),
        commandPrefix: document.getElementById('commandPrefix').value,
        apiBaseUrl: document.getElementById('apiBaseUrl').value.trim(),
        apiPassword: document.getElementById('apiPassword').value.trim(),
        enableAI: document.getElementById('enableAI').checked,
        geminiApiKey: document.getElementById('geminiApiKey').value.trim(),
        sessionTimeout: parseInt(document.getElementById('sessionTimeout').value),
        defaultPause: parseInt(document.getElementById('defaultPause').value)
    };

    try {
        showNotification('Creando bot...', 'info');

        const response = await fetch('/api/bots/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(botConfig)
        });

        const result = await response.json();

        if (result.success) {
            showNotification('¡Bot creado exitosamente!', 'success');

            // Mostrar información del bot creado
            setTimeout(() => {
                showNotification(`Bot disponible en: localhost/${botConfig.token.substring(0, 8)}...`, 'info');
            }, 2000);

            // Resetear formulario y volver al dashboard
            setTimeout(() => {
                resetWizard();
                showSection('dashboard');
                loadDashboard();
            }, 3000);
        } else {
            throw new Error(result.error || 'Error creando el bot');
        }
    } catch (error) {
        console.error('Error creating bot:', error);
        showNotification('Error al crear el bot: ' + error.message, 'error');
    } finally {
        // Restaurar botón
        createBtn.disabled = false;
        createBtn.innerHTML = originalText;
    }
}

function resetWizard() {
    currentStep = 1;
    showWizardStep(1);
    updateProgress();

    // Limpiar formularios
    document.querySelectorAll('#create-bot input, #create-bot textarea, #create-bot select').forEach(input => {
        if (input.type === 'checkbox') {
            input.checked = false;
        } else if (input.id !== 'selectedPlan' && input.id !== 'commandPrefix' &&
            input.id !== 'sessionTimeout' && input.id !== 'defaultPause') {
            input.value = '';
        }
    });

    // Valores por defecto
    document.getElementById('selectedPlan').value = 'emprendedor';
    document.getElementById('commandPrefix').value = '!';
    document.getElementById('sessionTimeout').value = '15';
    document.getElementById('defaultPause').value = '30';

    generateBotToken();
    toggleAIConfig();
    updateBotSummary();
}

// ==================== CARGAR DATOS ====================
async function loadDashboard() {
    try {
        // Verificar si el usuario es admin
        const isAdmin = auth.isAdmin();

        // Añadir o quitar clase al body según el rol
        if (isAdmin) {
            document.body.classList.add('is-admin');
        } else {
            document.body.classList.remove('is-admin');
        }

        const response = await fetch('/api/analytics/dashboard');
        const data = await response.json();

        if (data.success) {
            document.getElementById('totalBots').textContent = data.stats.totalBots || 0;
            document.getElementById('totalMessages').textContent = (data.stats.totalMessages || 0).toLocaleString();

            // Estos datos solo se mostrarán visualmente a administradores debido al CSS
            // pero aún así actualizamos el contenido por seguridad
            if (isAdmin) {
                document.getElementById('totalClients').textContent = data.stats.activeBots || 0;
                document.getElementById('monthlyRevenue').textContent = `$${(data.stats.totalRevenue || 0).toLocaleString()}`;
            } else {
                // Para no-admins, limpiar estos valores aunque estén ocultos
                document.getElementById('totalClients').textContent = "***";
                document.getElementById('monthlyRevenue').textContent = "$***";
            }
        }

        await loadRecentBots();
    } catch (error) {
        console.error('Error loading dashboard:', error);
        // Valores por defecto si hay error
        document.getElementById('totalBots').textContent = '0';
        document.getElementById('totalMessages').textContent = '0';

        if (auth.isAdmin()) {
            document.getElementById('totalClients').textContent = '0';
            document.getElementById('monthlyRevenue').textContent = '$0';
        }
    }
}

async function loadRecentBots() {
    try {
        const response = await fetch('/api/bots');
        const data = await response.json();

        const container = document.getElementById('recentBots');

        if (data.success && data.bots.length > 0) {
            container.innerHTML = data.bots.slice(0, 3).map(bot => `
                        <div class="bot-card" onclick="viewBot('${bot.id}')">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                <strong>${bot.name}</strong>
                                <span class="status-indicator status-${bot.status === 'running' ? 'online' : 'offline'}">
                                    <span class="status-dot"></span>${bot.status === 'running' ? 'En línea' : 'Pausado'}
                                </span>
                            </div>
                            <p><strong>Empresa:</strong> ${bot.company}</p>
                            <p><strong>Plan:</strong> ${bot.plan}</p>
                            <p><strong>URL:</strong> <small>localhost/${bot.token.substring(0, 8)}...</small></p>
                            <p><strong>Mensajes:</strong> ${bot.stats?.messages || 0}</p>
                        </div>
                    `).join('');
        } else {
            container.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-robot"></i>
                            <h4>¡Bienvenido al Bot Manager!</h4>
                            <p>No tienes bots creados aún. ¡Comienza creando tu primer bot!</p>
                            <button class="btn btn-primary" onclick="showSection('create-bot')">
                                <i class="fas fa-plus"></i> Crear Mi Primer Bot
                            </button>
                        </div>
                    `;
        }
    } catch (error) {
        console.error('Error loading recent bots:', error);
    }
}

async function loadBots() {
    try {
        // Primero, forzar una verificación de estado de los bots
        await fetch('/api/bots/verify-status', {
            method: 'POST'
        }).catch(err => console.warn('Error verificando estado de bots:', err));

        // Luego cargar los bots
        const response = await fetch('/api/bots');
        const data = await response.json();

        if (data.success) {
            const container = document.getElementById('botsList');

            if (data.bots.length > 0) {
                const user = auth.getUser();

                container.innerHTML = data.bots.map(bot => `
                    <div class="bot-card" onclick="selectBot('${bot.id}', event)">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                            <h4>${bot.name}</h4>
                            <span class="status-indicator status-${bot.status === 'running' || bot.status === 'authenticated' ? 'online' : 'offline'}">
                                <span class="status-dot"></span>${getStatusText(bot.status)}
                            </span>
                        </div>
                        <div class="grid-2">
                            <div>
                                <p><strong>Empresa:</strong> ${bot.company}</p>
                                <p><strong>Plan:</strong> ${bot.plan}</p>
                                <p><strong>Mensajes:</strong> ${bot.stats?.messages || 0}</p>
                            </div>
                            <div>
                                <p><strong>URL:</strong> <small>localhost/${bot.token.substring(0, 8)}...</small></p>
                                <p><strong>Usuarios:</strong> ${bot.stats?.users || 0}</p>
                                <p><strong>Creado:</strong> ${new Date(bot.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <div style="margin-top: 15px;">
                            <button class="btn btn-${bot.status === 'running' || bot.status === 'authenticated' ? 'warning' : 'success'}" 
                                    onclick="toggleBot('${bot.id}', event)">
                                <i class="fas fa-${bot.status === 'running' || bot.status === 'authenticated' ? 'pause' : 'play'}"></i> 
                                ${bot.status === 'running' || bot.status === 'authenticated' ? 'Pausar' : 'Iniciar'}
                            </button>
                            <button class="btn btn-secondary" onclick="viewBotUrl('${bot.token}'); event.stopPropagation();">
                                <i class="fas fa-external-link-alt"></i> Ver URL
                            </button>
                            <button class="btn btn-primary" onclick="downloadBot('${bot.id}'); event.stopPropagation();">
                                <i class="fas fa-download"></i> Descargar
                            </button>
                            ${auth.isOwner(bot.userId) ? `
                            <button class="btn btn-danger" onclick="deleteBot('${bot.id}'); event.stopPropagation();">
                                <i class="fas fa-trash"></i> Eliminar
                            </button>` : ''}
                        </div>
                    </div>
                `).join('');
            } else {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-robot"></i>
                        <h4>No tienes bots creados</h4>
                        <p>¡Comienza creando tu primer bot para automatizar tu negocio!</p>
                        <button class="btn btn-primary" onclick="showSection('create-bot')">
                            <i class="fas fa-plus"></i> Crear Mi Primer Bot
                        </button>
                    </div>
                `;
            }
        } else {
            showNotification('Error al cargar los bots: ' + data.error, 'error');
        }
    } catch (error) {
        console.error('Error loading bots:', error);
        showNotification('Error al cargar los bots', 'error');
    }
}

// Función auxiliar para obtener texto del estado del bot
function getStatusText(status) {
    switch (status) {
        case 'running': return 'Activo';
        case 'starting': return 'Iniciando';
        case 'stopping': return 'Deteniendo';
        case 'stopped': return 'Pausado';
        case 'authenticated': return 'Autenticado';
        case 'error': return 'Error';
        case 'disconnected': return 'Desconectado';
        default: return status;
    }
}

// ==================== GESTIÓN DE BOTS ====================
function selectBot(botId, event) {
    currentBot = botId;
    document.querySelectorAll('.bot-card').forEach(card => card.classList.remove('active'));
    event.currentTarget.classList.add('active');
    console.log(`Bot seleccionado: ${botId}`);
}


async function toggleBot(botId) {
    try {
        // Mostrar indicador de carga
        const toggleBtn = event.target.closest('button');
        const originalText = toggleBtn.innerHTML;
        toggleBtn.disabled = true;
        toggleBtn.innerHTML = '<div class="loading"></div> Procesando...';

        // Obtener el estado actual del bot directamente del servidor
        const response = await fetch(`/api/bots/${botId}`);
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Bot no encontrado');
        }

        // Determinar acción basada en el estado actual
        const bot = data.bot;
        const isRunning = ['running', 'authenticated', 'ready', 'starting'].includes(bot.status);
        const action = isRunning ? 'stop' : 'start';

        // Notificar al usuario
        showNotification(`${action === 'start' ? 'Iniciando' : 'Deteniendo'} bot...`, 'info');

        // Ejecutar acción
        const actionResponse = await fetch(`/api/bots/${botId}/${action}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const result = await actionResponse.json();

        if (result.success) {
            showNotification(
                `Bot ${action === 'start' ? 'iniciado' : 'detenido'} correctamente`,
                'success'
            );

            // Actualizar interfaz directamente sin recargar
            const newStatus = action === 'start' ? 'starting' : 'stopped';
            updateBotStatusInUI(botId, newStatus);

            // Actualizar el botón
            toggleBtn.innerHTML = `<i class="fas fa-${action === 'start' ? 'pause' : 'play'}"></i> ${action === 'start' ? 'Pausar' : 'Iniciar'}`;
            toggleBtn.classList.remove(action === 'start' ? 'btn-success' : 'btn-warning');
            toggleBtn.classList.add(action === 'start' ? 'btn-warning' : 'btn-success');

            // Recargar datos completos después de un pequeño delay
            setTimeout(() => {
                loadBots();
                loadDashboard();
            }, 2000);
        } else {
            throw new Error(result.error || 'Error desconocido');
        }
    } catch (error) {
        console.error('Error toggling bot:', error);
        showNotification('Error: ' + error.message, 'error');

        // Restaurar botón
        if (event && event.target) {
            const toggleBtn = event.target.closest('button');
            if (toggleBtn) {
                toggleBtn.disabled = false;
                toggleBtn.innerHTML = originalText || 'Error';
            }
        }

        // Intentar recargar para obtener estado correcto
        setTimeout(() => {
            loadBots();
        }, 1000);
    } finally {
        // Asegurar que el botón esté habilitado
        if (event && event.target) {
            const toggleBtn = event.target.closest('button');
            if (toggleBtn) {
                toggleBtn.disabled = false;
            }
        }
    }
}


// Función auxiliar para fetch con timeout
function fetchWithTimeout(url, options = {}) {
    const { timeout = 8000, ...fetchOptions } = options;

    return Promise.race([
        fetch(url, fetchOptions),
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), timeout)
        )
    ]);
}

function viewBotUrl(token) {
    const url = `https://localhost/${token}`;
    navigator.clipboard.writeText(url).then(() => {
        showNotification('URL copiada al portapapeles', 'success');
    });
    window.open(url, '_blank');
}

async function downloadBot(botId) {
    try {
        const response = await fetch(`/api/bots/${botId}/download`);

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `bot_${botId}.zip`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            showNotification('Bot descargado correctamente', 'success');
        } else {
            throw new Error('Error al descargar el bot');
        }
    } catch (error) {
        console.error('Error downloading bot:', error);
        showNotification('Error al descargar el bot', 'error');
    }
}

async function deleteBot(botId) {
    if (!confirm('¿Estás seguro de que quieres eliminar este bot? Esta acción no se puede deshacer.')) {
        return;
    }

    try {
        const response = await fetch(`/api/bots/${botId}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
            showNotification('Bot eliminado correctamente', 'success');
            loadBots();
            loadDashboard();
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Error deleting bot:', error);
        showNotification('Error al eliminar el bot: ' + error.message, 'error');
    }
}

// ==================== PLANTILLAS ====================
function selectTemplate(templateType) {
    showNotification(`Plantilla ${templateType} seleccionada`, 'info');
}

function applyTemplate(templateType) {
    showSection('create-bot');

    const templates = {
        servicios: {
            description: 'Bot especializado para talleres, reparaciones y servicios técnicos. Incluye consulta de folios, garantías y sistema de citas.',
            plan: 'profesional'
        },
        restaurante: {
            description: 'Bot para restaurante con menú digital, pedidos a domicilio y sistema de reservas.',
            plan: 'profesional'
        },
        personalizado: {
            description: 'Bot personalizado según las necesidades específicas de tu negocio.',
            plan: 'emprendedor'
        }
    };

    const template = templates[templateType];
    if (template) {
        document.getElementById('businessDescription').value = template.description;
        document.getElementById('selectedPlan').value = template.plan;
        selectPlan(template.plan);
        showNotification(`Plantilla ${templateType} aplicada`, 'success');
    }
}

// ==================== UTILIDADES ====================
function refreshBots() {
    loadBots();
    showNotification('Lista de bots actualizada', 'success');
}

function exportBots() {
    showNotification('Función de exportación en desarrollo', 'info');
}

function viewBot(botId) {
    showSection('bots');
    setTimeout(() => selectBot(botId), 100);
}

// ==================== NOTIFICACIONES ====================
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.add('show');

    setTimeout(() => {
        notification.classList.remove('show');
    }, 4000);
}

// ==================== WEBSOCKET ====================
function connectWebSocket() {
    try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        ws = new WebSocket(`${protocol}//${window.location.host}`);

        ws.onopen = () => {
            console.log('WebSocket conectado');
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            handleWebSocketMessage(data);
        };

        ws.onclose = () => {
            console.log('WebSocket desconectado');
            setTimeout(connectWebSocket, 5000);
        };

        ws.onerror = (error) => {
            console.error('Error en WebSocket:', error);
        };
    } catch (error) {
        console.error('Error conectando WebSocket:', error);
    }
}

function handleWebSocketMessage(data) {
    switch (data.type) {
        case 'bot_status':
            updateBotStatusInUI(data.botId, data.status);
            break;
        case 'stats_update':
            updateStatsInUI(data.stats);
            break;
        default:
            break;
    }
}

function updateBotStatusInUI(botId, status) {
    // Actualizar todas las tarjetas de bot que coincidan con este ID
    const botCards = document.querySelectorAll(`[onclick*="${botId}"]`);

    botCards.forEach(card => {
        // Actualizar indicador de estado
        const statusIndicator = card.querySelector('.status-indicator');
        if (statusIndicator) {
            // Determinar estado visual (online/offline)
            const isOnline = ['running', 'authenticated', 'ready', 'starting'].includes(status);

            statusIndicator.className = `status-indicator status-${isOnline ? 'online' : 'offline'}`;

            // Texto descriptivo del estado
            let statusText = status;
            switch (status) {
                case 'running': statusText = 'Activo'; break;
                case 'authenticated': statusText = 'Autenticado'; break;
                case 'ready': statusText = 'Listo'; break;
                case 'starting': statusText = 'Iniciando...'; break;
                case 'stopping': statusText = 'Deteniendo...'; break;
                case 'stopped': statusText = 'Detenido'; break;
                case 'error': statusText = 'Error'; break;
                case 'disconnected': statusText = 'Desconectado'; break;
                default: statusText = status;
            }

            statusIndicator.innerHTML = `<span class="status-dot"></span>${statusText}`;
        }

        // Actualizar botón de toggle
        const toggleBtn = card.querySelector('button[onclick*="toggleBot"]');
        if (toggleBtn) {
            const isOnline = ['running', 'authenticated', 'ready', 'starting'].includes(status);

            // Actualizar clase y texto del botón
            toggleBtn.classList.remove(isOnline ? 'btn-success' : 'btn-warning');
            toggleBtn.classList.add(isOnline ? 'btn-warning' : 'btn-success');

            // Actualizar icono y texto
            toggleBtn.innerHTML = `<i class="fas fa-${isOnline ? 'pause' : 'play'}"></i> ${isOnline ? 'Pausar' : 'Iniciar'}`;
        }
    });

    // También actualizar en monitor de bots si está activo
    const botStatusInfo = document.getElementById('botStatusInfo');
    if (botStatusInfo && selectedBotId === botId) {
        // Extraer HTML actual
        const currentHTML = botStatusInfo.innerHTML;

        // Determinar estado visual (online/offline)
        const isOnline = ['running', 'authenticated', 'ready', 'starting'].includes(status);

        // Actualizar solo la parte del estado
        const updatedHTML = currentHTML.replace(
            /<p><strong>Estado:<\/strong>.*?<\/p>/,
            `<p><strong>Estado:</strong> <span class="status-indicator status-${isOnline ? 'online' : 'offline'}">
                <span class="status-dot"></span>${getStatusText(status)}</span></p>`
        );

        // Actualizar DOM
        botStatusInfo.innerHTML = updatedHTML;
    }
} function updateBotStatusInUI(botId, status) {
    // Actualizar todas las tarjetas de bot que coincidan con este ID
    const botCards = document.querySelectorAll(`[onclick*="${botId}"]`);

    botCards.forEach(card => {
        // Actualizar indicador de estado
        const statusIndicator = card.querySelector('.status-indicator');
        if (statusIndicator) {
            // Determinar estado visual (online/offline)
            const isOnline = ['running', 'authenticated', 'ready', 'starting'].includes(status);

            statusIndicator.className = `status-indicator status-${isOnline ? 'online' : 'offline'}`;

            // Texto descriptivo del estado
            let statusText = status;
            switch (status) {
                case 'running': statusText = 'Activo'; break;
                case 'authenticated': statusText = 'Autenticado'; break;
                case 'ready': statusText = 'Listo'; break;
                case 'starting': statusText = 'Iniciando...'; break;
                case 'stopping': statusText = 'Deteniendo...'; break;
                case 'stopped': statusText = 'Detenido'; break;
                case 'error': statusText = 'Error'; break;
                case 'disconnected': statusText = 'Desconectado'; break;
                default: statusText = status;
            }

            statusIndicator.innerHTML = `<span class="status-dot"></span>${statusText}`;
        }

        // Actualizar botón de toggle
        const toggleBtn = card.querySelector('button[onclick*="toggleBot"]');
        if (toggleBtn) {
            const isOnline = ['running', 'authenticated', 'ready', 'starting'].includes(status);

            // Actualizar clase y texto del botón
            toggleBtn.classList.remove(isOnline ? 'btn-success' : 'btn-warning');
            toggleBtn.classList.add(isOnline ? 'btn-warning' : 'btn-success');

            // Actualizar icono y texto
            toggleBtn.innerHTML = `<i class="fas fa-${isOnline ? 'pause' : 'play'}"></i> ${isOnline ? 'Pausar' : 'Iniciar'}`;
        }
    });

    // También actualizar en monitor de bots si está activo
    const botStatusInfo = document.getElementById('botStatusInfo');
    if (botStatusInfo && selectedBotId === botId) {
        // Extraer HTML actual
        const currentHTML = botStatusInfo.innerHTML;

        // Determinar estado visual (online/offline)
        const isOnline = ['running', 'authenticated', 'ready', 'starting'].includes(status);

        // Actualizar solo la parte del estado
        const updatedHTML = currentHTML.replace(
            /<p><strong>Estado:<\/strong>.*?<\/p>/,
            `<p><strong>Estado:</strong> <span class="status-indicator status-${isOnline ? 'online' : 'offline'}">
                <span class="status-dot"></span>${getStatusText(status)}</span></p>`
        );

        // Actualizar DOM
        botStatusInfo.innerHTML = updatedHTML;
    }
}

function updateStatsInUI(stats) {
    if (stats.totalBots !== undefined) {
        document.getElementById('totalBots').textContent = stats.totalBots;
    }
    if (stats.totalMessages !== undefined) {
        document.getElementById('totalMessages').textContent = stats.totalMessages.toLocaleString();
    }
}

// ==================== FUNCIONES PLACEHOLDER ====================
function loadAnalytics() {
    console.log('Loading analytics...');
}
