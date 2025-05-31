//=============================================
// Funciones para manejar mensajes del flujo
//=============================================
// Seleccionar un mensaje del flujo
function selectFlowMessage(key) {
    if (!currentFlows || !currentFlows[currentSelectedFlow]) return;

    const flow = currentFlows[currentSelectedFlow];
    if (!flow.messages || !flow.messages[key]) return;

    currentFlowMessage = key;
    currentFlowStep = null;
    currentFlowOption = null;

    // Actualizar UI
    loadFlowMessages(flow);

    // Mostrar formulario de edición de mensaje
    const messageForm = document.getElementById('messageEditForm');
    const placeholder = document.getElementById('messageEditorPlaceholder');

    if (messageForm) {
        messageForm.style.display = 'block';
    }

    if (placeholder) {
        placeholder.style.display = 'none';
    }

    openMessageEditModal(key);


    updateMessageEditForm();
}

// Guardar cambios en el mensaje actual (versión para modal)
async function saveMessageChanges() {
    if (currentSelectedFlow === null || currentFlowMessage === null || !currentFlows || !currentFlows[currentSelectedFlow]) {
        showNotification('No hay mensaje seleccionado para guardar', 'warning');
        return;
    }

    const flow = currentFlows[currentSelectedFlow];

    // Obtener valores del formulario
    const newKey = document.getElementById('messageKey').value.trim().toLowerCase().replace(/\s+/g, '_');
    const messageType = document.getElementById('messageType').value;
    const content = document.getElementById('messageContent').value.trim();

    // Validaciones
    if (!newKey) {
        showNotification('La clave del mensaje no puede estar vacía', 'warning');
        return;
    }

    if (!content && messageType === 'text') {
        showNotification('El contenido del mensaje no puede estar vacío', 'warning');
        return;
    }

    // Si cambió la clave, verificar que no exista ya
    if (newKey !== currentFlowMessage && flow.messages && flow.messages[newKey]) {
        showNotification('Ya existe un mensaje con esa clave', 'warning');
        return;
    }

    // Preparar el objeto del mensaje según el tipo
    let messageObject;

    switch (messageType) {
        case 'text':
            // Para mensajes de texto, guardamos directamente el string
            messageObject = content;
            break;
        case 'ia':
            // Para mensajes de IA, guardamos un objeto con prompt, contexto y contenido
            const aiPrompt = document.getElementById('aiPrompt')?.value || '';
            const aiContext = document.getElementById('aiContext')?.value || '';

            messageObject = {
                type: 'ia',
                prompt: aiPrompt,
                context: aiContext,
                content: content,
                generatedAt: new Date().toISOString()
            };
            break;

        case 'image':
        case 'video':
        case 'audio':
        case 'document':
            // Para mensajes de medios, guardamos un objeto con URL y caption
            const mediaUrl = document.getElementById('mediaUrl')?.value || '';
            const mediaCaption = document.getElementById('mediaCaption')?.value || '';

            if (!mediaUrl) {
                showNotification('La URL del archivo es requerida', 'warning');
                return;
            }

            messageObject = {
                type: messageType,
                url: mediaUrl,
                caption: mediaCaption || content
            };
            break;

        case 'location':
            // Para ubicaciones, guardamos coordenadas y nombre
            const lat = parseFloat(document.getElementById('locationLat')?.value);
            const lng = parseFloat(document.getElementById('locationLng')?.value);
            const locationName = document.getElementById('locationName')?.value || '';

            if (isNaN(lat) || isNaN(lng)) {
                showNotification('Las coordenadas de latitud y longitud son requeridas y deben ser números válidos', 'warning');
                return;
            }

            if (lat < -90 || lat > 90) {
                showNotification('La latitud debe estar entre -90 y 90', 'warning');
                return;
            }

            if (lng < -180 || lng > 180) {
                showNotification('La longitud debe estar entre -180 y 180', 'warning');
                return;
            }

            messageObject = {
                type: messageType,
                latitude: lat,
                longitude: lng,
                name: locationName || content
            };
            break;

        case 'contact':
            // Para contactos, guardamos nombre y teléfono
            const contactName = document.getElementById('contactName')?.value || '';
            const contactPhone = document.getElementById('contactPhone')?.value || '';
            const contactCompany = document.getElementById('contactCompany')?.value || '';

            if (!contactName || !contactPhone) {
                showNotification('El nombre y teléfono del contacto son requeridos', 'warning');
                return;
            }

            messageObject = {
                type: messageType,
                name: contactName,
                phone: contactPhone,
                company: contactCompany
            };
            break;

        case 'buttons':
            // Para botones interactivos
            const buttonsTitle = document.getElementById('buttonsTitle')?.value || '';
            const buttonElements = document.querySelectorAll('#messageButtons input');
            const buttons = Array.from(buttonElements)
                .map(input => input.value.trim())
                .filter(text => text.length > 0);

            if (buttons.length === 0) {
                showNotification('Debes agregar al menos un botón', 'warning');
                return;
            }

            if (buttons.length > 3) {
                showNotification('WhatsApp permite máximo 3 botones por mensaje', 'warning');
                return;
            }

            messageObject = {
                type: messageType,
                title: buttonsTitle || content,
                buttons: buttons
            };
            break;

        case 'list':
            // Para listas de opciones
            const listTitle = document.getElementById('listTitle')?.value || '';
            const listButtonText = document.getElementById('listButtonText')?.value || 'Ver opciones';
            const optionElements = document.querySelectorAll('#listOptions input');
            const options = Array.from(optionElements)
                .map(input => input.value.trim())
                .filter(text => text.length > 0);

            if (options.length === 0) {
                showNotification('Debes agregar al menos una opción a la lista', 'warning');
                return;
            }

            if (options.length > 10) {
                showNotification('WhatsApp permite máximo 10 opciones en una lista', 'warning');
                return;
            }

            messageObject = {
                type: messageType,
                title: listTitle || content,
                buttonText: listButtonText,
                options: options
            };
            break;

        case 'template':
            // Para plantillas de mensaje
            const templateName = document.getElementById('templateName')?.value || '';
            const templateLanguage = document.getElementById('templateLanguage')?.value || 'es';
            const templateComponents = document.getElementById('templateComponents')?.value || '[]';

            if (!templateName) {
                showNotification('El nombre de la plantilla es requerido', 'warning');
                return;
            }

            try {
                const components = JSON.parse(templateComponents);
                messageObject = {
                    type: messageType,
                    name: templateName,
                    language: templateLanguage,
                    components: components,
                    text: content
                };
            } catch (e) {
                showNotification('Los componentes de la plantilla deben estar en formato JSON válido', 'warning');
                return;
            }
            break;

        default:
            // Para cualquier otro tipo, usar texto plano
            messageObject = content;
    }

    try {
        // Inicializar el objeto de mensajes si no existe
        if (!flow.messages) {
            flow.messages = {};
        }

        // Si cambió la clave, eliminar la antigua y crear la nueva
        if (newKey !== currentFlowMessage) {
            delete flow.messages[currentFlowMessage];
            flow.messages[newKey] = messageObject;
            currentFlowMessage = newKey;
        } else {
            // Si la clave es la misma, actualizar el contenido
            flow.messages[newKey] = messageObject;
        }

        // Guardar cambios en el servidor
        await saveFlowChanges();

        // Cerrar el modal
        closeMessageEditModal();

        // Actualizar la vista de flujos
        renderFlowsList();

        showNotification('Mensaje guardado exitosamente', 'success');

    } catch (error) {
        console.error('Error guardando mensaje:', error);
        showNotification('Error guardando el mensaje: ' + error.message, 'error');
    }
}

// Eliminar el mensaje actual
async function deleteCurrentMessage() {
    if (!currentFlowMessage || !confirm('¿Estás seguro de eliminar este mensaje? Esta acción no se puede deshacer.')) {
        return;
    }

    try {
        const flow = currentFlows[currentSelectedFlow];

        if (flow.messages && flow.messages[currentFlowMessage]) {
            delete flow.messages[currentFlowMessage];

            // Si no quedan mensajes, eliminar el objeto completo
            if (Object.keys(flow.messages).length === 0) {
                delete flow.messages;
            }

            // Guardar cambios
            await saveFlowChanges();

            // Cerrar modal
            closeMessageEditModal();

            // Actualizar vista
            renderFlowsList();

            showNotification('Mensaje eliminado exitosamente', 'success');
        }
    } catch (error) {
        console.error('Error eliminando mensaje:', error);
        showNotification('Error eliminando el mensaje: ' + error.message, 'error');
    }
}
// Crear nuevo mensaje
function createNewFlowMessage() {
    if (currentSelectedFlow === null || !currentFlows || !currentFlows[currentSelectedFlow]) {
        showNotification('Selecciona un flujo primero', 'warning');
        return;
    }

    const flow = currentFlows[currentSelectedFlow];

    // Generar una clave única para el nuevo mensaje
    let messageKey = 'nuevo_mensaje';
    let counter = 1;

    if (!flow.messages) {
        flow.messages = {};
    }

    while (flow.messages[messageKey]) {
        messageKey = `nuevo_mensaje_${counter}`;
        counter++;
    }

    // Crear el nuevo mensaje con contenido por defecto
    flow.messages[messageKey] = '¡Hola! Este es un nuevo mensaje.';

    // Abrir el editor para el nuevo mensaje
    currentFlowMessage = messageKey;
    openMessageEditModal(messageKey);
}

// Actualizar contadores y previsualizaciones cuando se escriba
document.addEventListener('DOMContentLoaded', function () {
    // Event listener para el textarea del mensaje
    const messageContentTextarea = document.getElementById('messageContent');
    if (messageContentTextarea) {
        messageContentTextarea.addEventListener('input', function () {
            updateCharCounter();
            updateMessagePreview();
        });
    }
});

// Función para manejar el tipo de mensaje template
function handleTemplateFields() {
    return `
        <div class="media-field">
            <div class="media-field-header">
                <i class="fas fa-file-alt"></i>
                <span>Configuración de Plantilla</span>
            </div>
            <div class="form-group">
                <label>Nombre de la Plantilla <span class="required">*</span></label>
                <input type="text" class="form-control" id="templateName" 
                       placeholder="nombre_plantilla">
                <div class="format-hint">
                    El nombre debe coincidir con el registrado en WhatsApp Business API
                </div>
            </div>
            <div class="form-group">
                <label>Idioma de la Plantilla</label>
                <select class="form-control" id="templateLanguage">
                    <option value="es">Español (es)</option>
                    <option value="es_MX">Español México (es_MX)</option>
                    <option value="en">Inglés (en)</option>
                    <option value="en_US">Inglés US (en_US)</option>
                </select>
            </div>
            <div class="form-group">
                <label>Componentes (JSON)</label>
                <textarea class="form-control" id="templateComponents" rows="4"
                          placeholder='[{"type": "header", "parameters": [{"type": "text", "text": "Hola {{1}}"}]}]'></textarea>
                <div class="format-hint">
                    <i class="fas fa-info-circle"></i> Define los componentes de la plantilla en formato JSON
                </div>
            </div>
        </div>
    `;
}


// Actualizar formulario de edición de mensaje
function updateMessageEditForm() {
    if (currentFlowMessage === null || !currentFlows || !currentFlows[currentSelectedFlow]) {
        return;
    }

    const flow = currentFlows[currentSelectedFlow];
    const messageContent = flow.messages[currentFlowMessage];

    // Actualizar campos del formulario
    const currentMessageKeyEl = document.getElementById('currentMessageKey');
    const messageKeyEl = document.getElementById('messageKey');
    const messageContentEl = document.getElementById('messageContent');
    const messageTypeEl = document.getElementById('messageType');

    if (currentMessageKeyEl) currentMessageKeyEl.textContent = currentFlowMessage;
    if (messageKeyEl) messageKeyEl.value = currentFlowMessage;

    // Determinar el tipo de mensaje basado en el contenido
    let messageType = 'text'; // Por defecto

    if (messageContentEl) {
        if (typeof messageContent === 'string') {
            messageContentEl.value = messageContent;
            updateCharCounter();
        } else if (typeof messageContent === 'object') {
            // Si es un objeto, puede ser un mensaje con formato especial
            if (messageContent.type) {
                messageType = messageContent.type;

                // Si es un mensaje de IA, manejar de forma especial
                if (messageType === 'ia') {
                    messageContentEl.value = messageContent.content || '';

                    // Después de cambiar el tipo, los campos se cargarán
                    setTimeout(() => {
                        const aiPromptEl = document.getElementById('aiPrompt');
                        const aiContextEl = document.getElementById('aiContext');

                        if (aiPromptEl) aiPromptEl.value = messageContent.prompt || '';
                        if (aiContextEl) aiContextEl.value = messageContent.context || '';
                    }, 100);
                } else {
                    // Manejar otros tipos como antes
                    switch (messageType) {
                        case 'image':
                        case 'video':
                        case 'audio':
                        case 'document':
                            messageContentEl.value = messageContent.caption || '';
                            break;
                        case 'location':
                            messageContentEl.value = messageContent.name || '';
                            break;
                        default:
                            messageContentEl.value = messageContent.text || '';
                    }
                }
            }
        }
    }

    // Establecer el tipo de mensaje
    if (messageTypeEl) {
        // Asegurar que 'ia' esté como opción
        if (!messageTypeEl.querySelector('option[value="ia"]')) {
            const iaOption = document.createElement('option');
            iaOption.value = 'ia';
            iaOption.textContent = '🤖 Inteligencia Artificial';
            messageTypeEl.appendChild(iaOption);
        }

        if (messageTypeEl.querySelector(`option[value="${messageType}"]`)) {
            messageTypeEl.value = messageType;
        } else {
            messageTypeEl.value = 'text'; // Valor por defecto
        }

        // Actualizar campos específicos del tipo
        changeMessageType();
    }

    // Actualizar vista previa
    updateMessagePreview();
}

// Actualizar contador de caracteres
function updateCharCounter() {
    const textarea = document.getElementById('messageContent');
    const counter = document.getElementById('charCounter');

    if (textarea && counter) {
        const length = textarea.value.length;
        counter.textContent = `${length}/4096`;

        if (length > 4000) {
            counter.style.color = '#dc3545';
        } else if (length > 3500) {
            counter.style.color = '#ffc107';
        } else {
            counter.style.color = '#6c757d';
        }
    }
}

// Actualizar vista previa del mensaje
function updateMessagePreview() {
    const preview = document.getElementById('previewBubble');
    const content = document.getElementById('messageContent').value;
    const type = document.getElementById('messageType').value;

    if (!preview) return;

    let previewHTML = '';

    switch (type) {
        case 'text':
            // Formatear contenido para la vista previa
            previewHTML = content
                .replace(/\n/g, '<br>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\_(.*?)\_/g, '<em>$1</em>')
                .replace(/\~(.*?)\~/g, '<del>$1</del>')
                .replace(/\{\{(\w+)\}\}/g, '<span class="variable-preview">$1</span>');
            break;
        case 'image':
            previewHTML = `<div class="media-preview">🖼️ Imagen</div>${content}`;
            break;
        case 'video':
            previewHTML = `<div class="media-preview">🎥 Video</div>${content}`;
            break;
        case 'audio':
            previewHTML = `<div class="media-preview">🎵 Audio</div>${content}`;
            break;
        case 'document':
            previewHTML = `<div class="media-preview">📄 Documento</div>${content}`;
            break;
        case 'location':
            previewHTML = `<div class="media-preview">📍 Ubicación</div>${content}`;
            break;
        case 'contact':
            previewHTML = `<div class="media-preview">👤 Contacto</div>${content}`;
            break;
        case 'buttons':
            previewHTML = `<div class="media-preview">🔘 Botones Interactivos</div>${content}`;
            break;
        case 'list':
            previewHTML = `<div class="media-preview">📋 Lista de Opciones</div>${content}`;
            break;
        default:
            previewHTML = content;
    }

    preview.innerHTML = previewHTML;

    // Mostrar preview
    document.getElementById('messagePreview').style.display = 'block';
}

// Insertar texto en la posición del cursor
function insertText(text) {
    const textarea = document.getElementById('messageContent');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentValue = textarea.value;

    textarea.value = currentValue.substring(0, start) + text + currentValue.substring(end);
    textarea.focus();
    textarea.setSelectionRange(start + text.length, start + text.length);

    updateCharCounter();
    updateMessagePreview();
}

// Insertar formato de texto (negrita, cursiva, etc.)
function formatText(prefix, suffix) {
    const textarea = document.getElementById('messageContent');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentValue = textarea.value;

    // Si hay texto seleccionado, aplicar formato al texto seleccionado
    if (start !== end) {
        const selectedText = currentValue.substring(start, end);
        textarea.value = currentValue.substring(0, start) + prefix + selectedText + suffix + currentValue.substring(end);
        textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    } else {
        // Si no hay selección, insertar el formato y posicionar el cursor entre ellos
        textarea.value = currentValue.substring(0, start) + prefix + suffix + currentValue.substring(end);
        textarea.setSelectionRange(start + prefix.length, start + prefix.length);
    }

    textarea.focus();
    updateCharCounter();
    updateMessagePreview();
}

// Insertar variable en el cursor
function insertVariable() {
    const variable = prompt('Nombre de la variable (sin {{}}):');
    if (variable) {
        insertText(`{{${variable}}}`);
    }
}

// Insertar emoji en el cursor
function insertEmoji() {
    // Aquí podrías implementar un selector de emojis
    // Por ahora, simplemente mostraremos un prompt
    const emoji = prompt('Ingresa un emoji:');
    if (emoji) {
        insertText(emoji);
    }
}

// Mostrar vista previa del mensaje
function previewMessage() {
    const content = document.getElementById('messageContent').value;
    const type = document.getElementById('messageType').value;

    // Actualizar vista previa
    updateMessagePreview();

    // Mostrar la vista previa
    document.getElementById('messagePreview').style.display = 'block';
}

//=============================================
// final De funciones para manejar mensajes del flujo
//=============================================
