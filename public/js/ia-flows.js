// Script de integración de IA con flujos conversacionales

// Variables globales para la configuración de IA
let globalAIConfig = null;
let currentAIConfig = {
    geminiApiKey: '',
    model: 'gemini-1.5-flash',
    botName: 'Jbot',
    tone: 'amigable',
    systemPrompt: 'Eres un asistente virtual especializado en ayudar a los clientes. Mantén un tono profesional pero cálido, y siempre trata de ser útil y eficiente.'
};

// Inicializar módulo de IA
function initAIModule() {
    console.log('Inicializando módulo de IA para flujos conversacionales...');
    
    // Cargar configuración global de IA
    loadGlobalAIConfig().then(config => {
        console.log('Configuración global de IA cargada');
    });
    
    // Añadir opción de IA al selector de tipo de mensaje
    document.addEventListener('DOMContentLoaded', function() {
        // Cuando se abre el modal de edición de mensaje, añadir opción de IA
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'attributes' && 
                    mutation.attributeName === 'style' && 
                    mutation.target.id === 'messageEditModal' &&
                    mutation.target.style.display === 'flex') {
                    addAIMessageTypeOption();
                }
            });
        });
        
        const messageEditModal = document.getElementById('messageEditModal');
        if (messageEditModal) {
            observer.observe(messageEditModal, { attributes: true });
        }
    });
}

// Inicializar integración de IA con la vista previa de flujos
function initAIFlowPreview() {
    // Manejar mensajes generados por IA en la vista previa
    document.addEventListener('DOMContentLoaded', function() {
        // Registrar manejador para la vista previa de mensajes
        const originalUpdatePreview = window.updateMessagePreview;
        if (originalUpdatePreview) {
            window.updateMessagePreview = function() {
                originalUpdatePreview();
                
                // Añadir indicador de IA si es necesario
                const messageType = document.getElementById('messageType')?.value;
                const previewBubble = document.getElementById('previewBubble');
                
                if (messageType === 'ia' && previewBubble) {
                    previewBubble.classList.add('ai-generated');
                } else if (previewBubble) {
                    previewBubble.classList.remove('ai-generated');
                }
            };
        }
    });
}

// Función para procesar mensajes IA en la simulación de flujos
function processAIMessageInPreview(message, flow) {
    if (typeof message === 'object' && message.type === 'ia') {
        // Añadir indicador visual de que es un mensaje generado por IA
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message bot';
        
        // Contenido del mensaje
        const messageBubble = document.createElement('div');
        messageBubble.className = 'chat-message-bubble ai-generated';
        messageBubble.innerHTML = message.content.replace(/\n/g, '<br>');
        
        // Información sobre la generación
        const aiInfo = document.createElement('div');
        aiInfo.className = 'ai-generation-info';
        aiInfo.dataset.info = `Generado por IA (${new Date(message.generatedAt).toLocaleString()})`;
        aiInfo.innerHTML = '<small>IA</small>';
        messageBubble.appendChild(aiInfo);
        
        // Hora del mensaje
        const messageTime = document.createElement('div');
        messageTime.className = 'chat-message-time';
        messageTime.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        // Ensamblar mensaje
        messageDiv.appendChild(messageBubble);
        messageDiv.appendChild(messageTime);
        
        return messageDiv;
    }
    
    return null; // No es un mensaje de IA, usar el procesamiento normal
}

// Sobrescribir la función de simulación de mensaje del bot para soportar IA
const originalSimulateBotMessage = window.simulateBotMessage;
if (originalSimulateBotMessage) {
    window.simulateBotMessage = function(message) {
        const chatContainer = document.getElementById('previewChat');
        if (!chatContainer) return;
        
        // Si es un mensaje de IA, procesarlo de forma especial
        if (typeof message === 'object' && message.type === 'ia') {
            const aiMessageElement = processAIMessageInPreview(message);
            if (aiMessageElement) {
                chatContainer.appendChild(aiMessageElement);
                
                // Scroll al final
                chatContainer.scrollTop = chatContainer.scrollHeight;
                
                // Guardar mensaje en historial
                previewMessages.push({
                    type: 'bot',
                    content: message.content,
                    isAI: true,
                    time: new Date()
                });
                
                return; // Terminar aquí, ya se ha procesado
            }
        }
        
        // Si no es un mensaje de IA o no se pudo procesar, usar el comportamiento original
        originalSimulateBotMessage(message);
    };
}

// Exportar e importar flujos con soporte para mensajes de IA
function exportFlowsWithAISupport() {
    if (!currentFlows || currentFlows.length === 0) {
        showNotification('No hay flujos para exportar', 'warning');
        return;
    }

    try {
        // Crear objeto para exportar
        const exportData = {
            botId: currentFlowBot?.id || 'unknown',
            botName: currentFlowBot?.name || 'Bot desconocido',
            exportDate: new Date().toISOString(),
            aiConfig: currentAIConfig, // Incluir configuración de IA
            flows: currentFlows
        };

        // Convertir a JSON
        const jsonData = JSON.stringify(exportData, null, 2);

        // Crear blob y descargar
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `flows_${currentFlowBot?.name || 'bot'}_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showNotification('Flujos exportados correctamente con configuración de IA', 'success');
    } catch (error) {
        console.error('Error exportando flujos:', error);
        showNotification('Error exportando flujos', 'error');
    }
}

// Importar flujos con soporte para mensajes de IA
function importFlowsWithAISupport() {
    // Crear input de archivo invisible
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'application/json';
    fileInput.style.display = 'none';

    // Manejar selección de archivo
    fileInput.addEventListener('change', function () {
        if (!this.files || !this.files[0]) return;

        const file = this.files[0];
        const reader = new FileReader();

        reader.onload = function (e) {
            try {
                const data = JSON.parse(e.target.result);

                if (!data.flows || !Array.isArray(data.flows)) {
                    throw new Error('Formato de archivo inválido');
                }

                // Confirmar importación
                if (confirm(`¿Importar ${data.flows.length} flujos de "${data.botName || 'Bot desconocido'}"?`)) {
                    // Decidir si reemplazar o añadir
                    const replaceExisting = confirm('¿Reemplazar flujos existentes? (Cancelar para añadir a los existentes)');

                    if (replaceExisting) {
                        currentFlows = data.flows;
                    } else {
                        // Añadir nuevos flujos
                        currentFlows = currentFlows.concat(data.flows);
                    }
                    
                    // Importar configuración de IA si existe
                    if (data.aiConfig) {
                        const importAIConfig = confirm('El archivo contiene configuración de IA. ¿Deseas importarla también?');
                        if (importAIConfig) {
                            currentAIConfig = data.aiConfig;
                            showNotification('Configuración de IA importada correctamente', 'success');
                        }
                    }

                    // Actualizar UI
                    renderFlowsList();

                    // Seleccionar el primer flujo importado
                    if (currentFlows.length > 0) {
                        currentSelectedFlow = replaceExisting ? 0 : (currentFlows.length - data.flows.length);
                        showFlowEditor();
                        loadFlowToEditor(currentFlows[currentSelectedFlow]);
                    }

                    showNotification(`${data.flows.length} flujos importados correctamente`, 'success');
                }
            } catch (error) {
                console.error('Error importando flujos:', error);
                showNotification('Error importando flujos: ' + error.message, 'error');
            }
        };

        reader.readAsText(file);
    });

    // Simular clic en el input
    document.body.appendChild(fileInput);
    fileInput.click();
    document.body.removeChild(fileInput);
}

// Inicializar todo cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar módulo de IA si estamos en la página de flujos
    if (document.getElementById('flows') || document.getElementById('flowsContainer')) {
        initAIModule();
        initAIFlowPreview();
        
        console.log('Módulo de IA para flujos inicializado correctamente');
    }
});

// Reemplazar funciones existentes para añadir soporte de IA
if (window.exportAllFlows) {
    window.originalExportAllFlows = window.exportAllFlows;
    window.exportAllFlows = exportFlowsWithAISupport;
}

if (window.importFlow) {
    window.originalImportFlow = window.importFlow;
    window.importFlow = importFlowsWithAISupport;
}