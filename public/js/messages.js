// Implementación del módulo de Mensajes Personalizados
// Este script debe incluirse en index.html o importarse como un módulo

// Estado global de los mensajes
let currentMessages = {
    greetings: {
        morning: '¡Buenos días! 🌅 ¿Cómo puedo ayudarte hoy?',
        afternoon: '¡Buenas tardes! 🌞 ¿En qué puedo asistirte?',
        evening: '¡Buenas noches! 🌙 ¿Cómo puedo ayudarte?',
        newUser: '¡Hola! Veo que es tu primera vez aquí. Te explico brevemente cómo funciono...'
    },
    errors: {
        invalidOption: '❌ Opción no válida. Por favor, selecciona una opción del menú.',
        apiError: '😔 Ups, algo salió mal. Por favor, intenta de nuevo en unos momentos.',
        outsideHours: '🕐 Estamos fuera de horario de atención.',
        userPaused: '⏸️ El asistente está pausado. Escribe "reactivar" para continuar.'
    },
    confirmations: {
        dataSaved: '✅ Información guardada correctamente.',
        processComplete: '🎉 ¡Proceso completado exitosamente!',
        waitingResponse: '⏳ Procesando tu solicitud, por favor espera...',
        goodbye: '👋 ¡Gracias por contactarnos! Que tengas un excelente día.'
    }
};

let selectedBotForMessages = null;
let activeMessageTab = 'greetings';

// Inicialización
function initMessagesModule() {
    // Cargar bots para selector
    loadBotsForMessagesSelector();
    
    // Event listeners para cambio de pestañas
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab') || this.textContent.toLowerCase();
            switchMessageTab(tabId);
        });
    });
    
    // Event listeners para los campos de texto
    setupMessageFieldListeners();
}

// Cargar bots para el selector
async function loadBotsForMessagesSelector() {
    try {
        const response = await fetchWithAuth('/api/bots');
        const data = await response.json();
        
        if (data.success && data.bots.length > 0) {
            const messagesSection = document.getElementById('messages');
            if (!messagesSection) return;
            
            // Añadir selector de bots si no existe
            if (!document.getElementById('selectedBotForMessages')) {
                const selectorHtml = `
                    <div class="form-group">
                        <label>Seleccionar Bot</label>
                        <select class="form-control" id="selectedBotForMessages">
                            <option value="">Selecciona un bot para editar mensajes</option>
                        </select>
                    </div>
                `;
                
                // Insertar el selector antes de las pestañas
                const tabButtons = messagesSection.querySelector('.tab-buttons');
                if (tabButtons) {
                    tabButtons.insertAdjacentHTML('beforebegin', selectorHtml);
                    
                    // Añadir event listener
                    document.getElementById('selectedBotForMessages').addEventListener('change', function() {
                        const botId = this.value;
                        if (botId) {
                            loadMessagesForBot(botId);
                        } else {
                            resetMessagesToDefault();
                        }
                    });
                }
            }
            
            // Llenar el selector con los bots
            const selectElement = document.getElementById('selectedBotForMessages');
            if (selectElement) {
                // Mantener la selección actual si existe
                const currentSelection = selectElement.value;
                
                selectElement.innerHTML = '<option value="">Selecciona un bot para editar mensajes</option>';
                
                data.bots.forEach(bot => {
                    const option = document.createElement('option');
                    option.value = bot.id;
                    option.textContent = `${bot.name} (${bot.company})`;
                    selectElement.appendChild(option);
                });
                
                // Restaurar la selección si el bot sigue existiendo
                if (currentSelection) {
                    selectElement.value = currentSelection;
                }
            }
        }
    } catch (error) {
        console.error('Error cargando bots para mensajes:', error);
        showNotification('Error cargando bots', 'error');
    }
}

// Configurar event listeners para campos de texto
function setupMessageFieldListeners() {
    // Saludos
    document.getElementById('msgMorningGreeting').addEventListener('input', updateMessages);
    document.getElementById('msgAfternoonGreeting').addEventListener('input', updateMessages);
    document.getElementById('msgEveningGreeting').addEventListener('input', updateMessages);
    document.getElementById('msgNewUser').addEventListener('input', updateMessages);
    
    // Errores
    document.getElementById('msgInvalidOption').addEventListener('input', updateMessages);
    document.getElementById('msgApiError').addEventListener('input', updateMessages);
    document.getElementById('msgOutsideHours').addEventListener('input', updateMessages);
    document.getElementById('msgUserPaused').addEventListener('input', updateMessages);
    
    // Confirmaciones
    document.getElementById('msgDataSaved').addEventListener('input', updateMessages);
    document.getElementById('msgProcessComplete').addEventListener('input', updateMessages);
    document.getElementById('msgWaitingResponse').addEventListener('input', updateMessages);
    document.getElementById('msgGoodbye').addEventListener('input', updateMessages);
}

// Cargar mensajes para un bot específico
async function loadMessagesForBot(botId) {
    try {
        const response = await fetch(`/api/bots/${botId}`);
        const data = await response.json();
        
        if (data.success) {
            selectedBotForMessages = data.bot;
            
            // Extraer mensajes del bot
            const messages = selectedBotForMessages.messages || {};
            
            // Mezclar con valores por defecto para asegurar estructura completa
            currentMessages = {
                greetings: {
                    morning: (messages.greetings && messages.greetings.morning) || '¡Buenos días! 🌅 ¿Cómo puedo ayudarte hoy?',
                    afternoon: (messages.greetings && messages.greetings.afternoon) || '¡Buenas tardes! 🌞 ¿En qué puedo asistirte?',
                    evening: (messages.greetings && messages.greetings.evening) || '¡Buenas noches! 🌙 ¿Cómo puedo ayudarte?',
                    newUser: (messages.greetings && messages.greetings.newUser) || '¡Hola! Veo que es tu primera vez aquí. Te explico brevemente cómo funciono...'
                },
                errors: {
                    invalidOption: (messages.errors && messages.errors.invalidOption) || '❌ Opción no válida. Por favor, selecciona una opción del menú.',
                    apiError: (messages.errors && messages.errors.apiError) || '😔 Ups, algo salió mal. Por favor, intenta de nuevo en unos momentos.',
                    outsideHours: (messages.errors && messages.errors.outsideHours) || '🕐 Estamos fuera de horario de atención.',
                    userPaused: (messages.errors && messages.errors.userPaused) || '⏸️ El asistente está pausado. Escribe "reactivar" para continuar.'
                },
                confirmations: {
                    dataSaved: (messages.confirmations && messages.confirmations.dataSaved) || '✅ Información guardada correctamente.',
                    processComplete: (messages.confirmations && messages.confirmations.processComplete) || '🎉 ¡Proceso completado exitosamente!',
                    waitingResponse: (messages.confirmations && messages.confirmations.waitingResponse) || '⏳ Procesando tu solicitud, por favor espera...',
                    goodbye: (messages.confirmations && messages.confirmations.goodbye) || '👋 ¡Gracias por contactarnos! Que tengas un excelente día.'
                }
            };
            
            // Actualizar el formulario
            updateMessagesForm();
            
            showNotification('Mensajes cargados exitosamente', 'success');
        } else {
            showNotification('Error cargando mensajes del bot', 'error');
        }
    } catch (error) {
        console.error('Error cargando mensajes:', error);
        showNotification('Error de comunicación con el servidor', 'error');
    }
}

// Restablecer mensajes a valores por defecto
function resetMessagesToDefault() {
    selectedBotForMessages = null;
    currentMessages = {
        greetings: {
            morning: '¡Buenos días! 🌅 ¿Cómo puedo ayudarte hoy?',
            afternoon: '¡Buenas tardes! 🌞 ¿En qué puedo asistirte?',
            evening: '¡Buenas noches! 🌙 ¿Cómo puedo ayudarte?',
            newUser: '¡Hola! Veo que es tu primera vez aquí. Te explico brevemente cómo funciono...'
        },
        errors: {
            invalidOption: '❌ Opción no válida. Por favor, selecciona una opción del menú.',
            apiError: '😔 Ups, algo salió mal. Por favor, intenta de nuevo en unos momentos.',
            outsideHours: '🕐 Estamos fuera de horario de atención.',
            userPaused: '⏸️ El asistente está pausado. Escribe "reactivar" para continuar.'
        },
        confirmations: {
            dataSaved: '✅ Información guardada correctamente.',
            processComplete: '🎉 ¡Proceso completado exitosamente!',
            waitingResponse: '⏳ Procesando tu solicitud, por favor espera...',
            goodbye: '👋 ¡Gracias por contactarnos! Que tengas un excelente día.'
        }
    };
    
    updateMessagesForm();
}

// Actualizar formulario con los mensajes actuales
function updateMessagesForm() {
    // Saludos
    document.getElementById('msgMorningGreeting').value = currentMessages.greetings.morning;
    document.getElementById('msgAfternoonGreeting').value = currentMessages.greetings.afternoon;
    document.getElementById('msgEveningGreeting').value = currentMessages.greetings.evening;
    document.getElementById('msgNewUser').value = currentMessages.greetings.newUser;
    
    // Errores
    document.getElementById('msgInvalidOption').value = currentMessages.errors.invalidOption;
    document.getElementById('msgApiError').value = currentMessages.errors.apiError;
    document.getElementById('msgOutsideHours').value = currentMessages.errors.outsideHours;
    document.getElementById('msgUserPaused').value = currentMessages.errors.userPaused;
    
    // Confirmaciones
    document.getElementById('msgDataSaved').value = currentMessages.confirmations.dataSaved;
    document.getElementById('msgProcessComplete').value = currentMessages.confirmations.processComplete;
    document.getElementById('msgWaitingResponse').value = currentMessages.confirmations.waitingResponse;
    document.getElementById('msgGoodbye').value = currentMessages.confirmations.goodbye;
}

// Cambiar entre pestañas de mensajes
function switchMessageTab(tabId) {
    activeMessageTab = tabId;
    
    // Ocultar todas las pestañas
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.style.display = 'none';
    });
    
    // Desactivar todos los botones
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    
    // Mostrar pestaña seleccionada
    const tabElement = document.getElementById(`messages-${tabId}`);
    if (tabElement) {
        tabElement.style.display = 'block';
    }
    
    // Activar botón correspondiente
    document.querySelectorAll('.tab-button').forEach(button => {
        if (button.getAttribute('data-tab') === tabId || 
            button.textContent.toLowerCase() === tabId) {
            button.classList.add('active');
        }
    });
}

// Actualizar mensajes desde los campos del formulario
function updateMessages() {
    // Saludos
    currentMessages.greetings.morning = document.getElementById('msgMorningGreeting').value;
    currentMessages.greetings.afternoon = document.getElementById('msgAfternoonGreeting').value;
    currentMessages.greetings.evening = document.getElementById('msgEveningGreeting').value;
    currentMessages.greetings.newUser = document.getElementById('msgNewUser').value;
    
    // Errores
    currentMessages.errors.invalidOption = document.getElementById('msgInvalidOption').value;
    currentMessages.errors.apiError = document.getElementById('msgApiError').value;
    currentMessages.errors.outsideHours = document.getElementById('msgOutsideHours').value;
    currentMessages.errors.userPaused = document.getElementById('msgUserPaused').value;
    
    // Confirmaciones
    currentMessages.confirmations.dataSaved = document.getElementById('msgDataSaved').value;
    currentMessages.confirmations.processComplete = document.getElementById('msgProcessComplete').value;
    currentMessages.confirmations.waitingResponse = document.getElementById('msgWaitingResponse').value;
    currentMessages.confirmations.goodbye = document.getElementById('msgGoodbye').value;
}

// Guardar mensajes
async function saveMessages() {
    if (!selectedBotForMessages) {
        showNotification('Selecciona un bot primero', 'warning');
        return;
    }
    
    updateMessages();
    
    try {
        const response = await fetch(`/api/bots/${selectedBotForMessages.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: currentMessages
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Mensajes guardados exitosamente', 'success');
            selectedBotForMessages = data.bot;
        } else {
            showNotification('Error guardando mensajes: ' + data.error, 'error');
        }
    } catch (error) {
        console.error('Error guardando mensajes:', error);
        showNotification('Error de comunicación con el servidor', 'error');
    }
}

// Restaurar mensajes por defecto para la categoría actual
function restoreDefaultMessages() {
    if (!confirm('¿Estás seguro de restaurar los mensajes por defecto para esta categoría?')) {
        return;
    }
    
    // Determinar qué categoría restaurar
    switch (activeMessageTab) {
        case 'greetings':
            currentMessages.greetings = {
                morning: '¡Buenos días! 🌅 ¿Cómo puedo ayudarte hoy?',
                afternoon: '¡Buenas tardes! 🌞 ¿En qué puedo asistirte?',
                evening: '¡Buenas noches! 🌙 ¿Cómo puedo ayudarte?',
                newUser: '¡Hola! Veo que es tu primera vez aquí. Te explico brevemente cómo funciono...'
            };
            break;
        case 'errors':
            currentMessages.errors = {
                invalidOption: '❌ Opción no válida. Por favor, selecciona una opción del menú.',
                apiError: '😔 Ups, algo salió mal. Por favor, intenta de nuevo en unos momentos.',
                outsideHours: '🕐 Estamos fuera de horario de atención.',
                userPaused: '⏸️ El asistente está pausado. Escribe "reactivar" para continuar.'
            };
            break;
        case 'confirmations':
            currentMessages.confirmations = {
                dataSaved: '✅ Información guardada correctamente.',
                processComplete: '🎉 ¡Proceso completado exitosamente!',
                waitingResponse: '⏳ Procesando tu solicitud, por favor espera...',
                goodbye: '👋 ¡Gracias por contactarnos! Que tengas un excelente día.'
            };
            break;
    }
    
    // Actualizar el formulario
    updateMessagesForm();
    showNotification('Mensajes restaurados a valores por defecto', 'success');
}

// Inicializar el módulo cuando se cargue la página
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si estamos en la sección de mensajes
    if (document.getElementById('messages')) {
        initMessagesModule();
    }
});