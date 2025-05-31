// Implementación del módulo de Menús Interactivos
// Este script debe incluirse en index.html o importarse como un módulo

// Estado global de los menús
let currentMenuName = 'MENU_PRINCIPAL';
let currentMenuMessage = '¡Hola! Soy tu asistente virtual. ¿En qué puedo ayudarte hoy?';
let currentMenuOptions = [
    { emoji: '1️⃣', text: 'Ver Servicios' },
    { emoji: '2️⃣', text: 'Consultar Estado' },
    { emoji: '3️⃣', text: 'Hablar con Asesor' }
];
let activeMenuTab = 'builder';

// Inicialización
function initMenusModule() {
    // Cargar menú inicial
    renderMenuBuilder();
    updateMenuPreview();
    updateMenuCode();
    
    // Event listeners para cambio de pestañas
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab') || this.textContent.toLowerCase();
            switchMenuTab(tabId);
        });
    });
    
    // Event listeners para cambios en el menú
    document.getElementById('menuBuilderName').addEventListener('input', updateMenuFromInputs);
    document.getElementById('menuBuilderMessage').addEventListener('input', updateMenuFromInputs);
}

// Cambiar entre pestañas (Builder, Preview, Code)
function switchMenuTab(tabId) {
    activeMenuTab = tabId;
    
    // Ocultar todas las pestañas
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.style.display = 'none';
    });
    
    // Desactivar todos los botones
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    
    // Mostrar pestaña seleccionada
    const tabElement = document.getElementById(`menu-${tabId}`);
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
    
    // Actualizar contenido si es necesario
    if (tabId === 'preview') {
        updateMenuPreview();
    } else if (tabId === 'code') {
        updateMenuCode();
    }
}

// Renderizar el constructor de menús
function renderMenuBuilder() {
    // Actualizar los campos de configuración
    document.getElementById('menuBuilderName').value = currentMenuName;
    document.getElementById('menuBuilderMessage').value = currentMenuMessage;
    
    // Renderizar las opciones del menú
    const optionsContainer = document.getElementById('menuBuilderOptions');
    if (!optionsContainer) return;
    
    let optionsHtml = '';
    
    currentMenuOptions.forEach((option, index) => {
        optionsHtml += `
            <div class="menu-option" style="border: 1px solid #e9ecef; padding: 10px; margin: 5px 0; border-radius: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <select class="form-control" style="width: 80px;" onchange="updateOptionEmoji(${index}, this.value)">
                            <option value="1️⃣" ${option.emoji === '1️⃣' ? 'selected' : ''}>1️⃣</option>
                            <option value="2️⃣" ${option.emoji === '2️⃣' ? 'selected' : ''}>2️⃣</option>
                            <option value="3️⃣" ${option.emoji === '3️⃣' ? 'selected' : ''}>3️⃣</option>
                            <option value="4️⃣" ${option.emoji === '4️⃣' ? 'selected' : ''}>4️⃣</option>
                            <option value="5️⃣" ${option.emoji === '5️⃣' ? 'selected' : ''}>5️⃣</option>
                            <option value="6️⃣" ${option.emoji === '6️⃣' ? 'selected' : ''}>6️⃣</option>
                            <option value="7️⃣" ${option.emoji === '7️⃣' ? 'selected' : ''}>7️⃣</option>
                            <option value="8️⃣" ${option.emoji === '8️⃣' ? 'selected' : ''}>8️⃣</option>
                            <option value="9️⃣" ${option.emoji === '9️⃣' ? 'selected' : ''}>9️⃣</option>
                            <option value="🔄" ${option.emoji === '🔄' ? 'selected' : ''}>🔄</option>
                            <option value="ℹ️" ${option.emoji === 'ℹ️' ? 'selected' : ''}>ℹ️</option>
                            <option value="📞" ${option.emoji === '📞' ? 'selected' : ''}>📞</option>
                            <option value="📋" ${option.emoji === '📋' ? 'selected' : ''}>📋</option>
                            <option value="📅" ${option.emoji === '📅' ? 'selected' : ''}>📅</option>
                            <option value="💰" ${option.emoji === '💰' ? 'selected' : ''}>💰</option>
                            <option value="🏠" ${option.emoji === '🏠' ? 'selected' : ''}>🏠</option>
                            <option value="⬅️" ${option.emoji === '⬅️' ? 'selected' : ''}>⬅️</option>
                        </select>
                        <span>${option.text}</span>
                    </div>
                    <button class="btn btn-danger" onclick="removeMenuOption(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <input type="text" class="form-control" value="${option.text}" 
                       placeholder="Texto de la opción" style="margin-top: 8px;"
                       onchange="updateOptionText(${index}, this.value)">
            </div>
        `;
    });
    
    optionsContainer.innerHTML = optionsHtml;
}

// Actualizar la vista previa del menú
function updateMenuPreview() {
    const previewContainer = document.getElementById('menuPreviewMessage');
    if (previewContainer) {
        previewContainer.textContent = currentMenuMessage;
    }
    
    const optionsContainer = document.getElementById('menuPreviewOptions');
    if (optionsContainer) {
        let optionsHtml = '';
        
        currentMenuOptions.forEach(option => {
            optionsHtml += `
                <div style="background: white; padding: 10px; margin: 5px 0; border-radius: 8px; border-left: 4px solid #25D366;">
                    ${option.emoji} ${option.text}
                </div>
            `;
        });
        
        optionsContainer.innerHTML = optionsHtml;
    }
}

// Actualizar el código generado del menú
function updateMenuCode() {
    const codeContainer = document.getElementById('menuGeneratedCode');
    if (!codeContainer) return;
    
    // Crear código JavaScript para el menú
    const code = `// Menú: ${currentMenuName}
// Generado automáticamente

/**
 * Función para mostrar el menú ${currentMenuName}
 * @param {Object} client - Cliente de WhatsApp Web
 * @param {string} number - Número del usuario (con @c.us)
 */
async function show${currentMenuName.replace(/[^a-zA-Z0-9]/g, '')}(client, number) {
    try {
        // Mensaje de bienvenida
        const message = \`${currentMenuMessage.replace(/`/g, '\\`')}\`;
        
        // Opciones del menú
        let menuOptions = "";
${currentMenuOptions.map(option => `        menuOptions += "${option.emoji} ${option.text}\\n"`).join(';\n')};
        
        // Enviar mensaje completo
        await client.sendMessage(number, \`\${message}\\n\\n\${menuOptions}\`);
        
        // Actualizar la sesión del usuario al paso de espera de selección
        updateUserSession(number, {
            currentFlow: "${currentMenuName}",
            step: "AWAITING_CHOICE"
        });
        
        console.log(\`Menú ${currentMenuName} enviado a \${number}\`);
        
    } catch (error) {
        console.error(\`Error enviando menú ${currentMenuName}:\`, error);
    }
}

/**
 * Procesa la respuesta del usuario al menú ${currentMenuName}
 * @param {Object} client - Cliente de WhatsApp Web
 * @param {Object} message - Mensaje recibido
 * @param {Object} session - Sesión del usuario
 */
async function handle${currentMenuName.replace(/[^a-zA-Z0-9]/g, '')}Response(client, message, session) {
    const number = message.from;
    const text = message.body.trim();
    
    switch(text) {
${currentMenuOptions.map((option, index) => {
        const optionNumber = option.emoji.match(/^\d/) ? option.emoji.match(/^\d/)[0] : index + 1;
        return `        case "${optionNumber}":
        case "${option.text}":
            await handleOption${optionNumber}(client, number, session);
            break;`;
    }).join('\n')}
        default:
            // Opción no válida
            await client.sendMessage(number, "❌ Opción no válida. Por favor, selecciona una opción del menú.");
            await show${currentMenuName.replace(/[^a-zA-Z0-9]/g, '')}(client, number);
            break;
    }
}

// Funciones para manejar cada opción
${currentMenuOptions.map((option, index) => {
        const optionNumber = option.emoji.match(/^\d/) ? option.emoji.match(/^\d/)[0] : index + 1;
        return `async function handleOption${optionNumber}(client, number, session) {
    // TODO: Implementar lógica para "${option.text}"
    await client.sendMessage(number, "Has seleccionado: ${option.text}");
    
    // Actualizar sesión o mostrar siguiente menú
    // updateUserSession(number, { currentFlow: "SIGUIENTE_MENU", step: "INITIAL" });
    // await showSiguienteMenu(client, number);
}`;
    }).join('\n\n')}

// Exportar funciones
module.exports = {
    show${currentMenuName.replace(/[^a-zA-Z0-9]/g, '')},
    handle${currentMenuName.replace(/[^a-zA-Z0-9]/g, '')}Response
};`;
    
    codeContainer.textContent = code;
    
    // Aplicar destacado de sintaxis si hay una biblioteca disponible
    if (typeof hljs !== 'undefined') {
        hljs.highlightElement(codeContainer);
    }
}

// Actualizar el menú desde los inputs
function updateMenuFromInputs() {
    const nameInput = document.getElementById('menuBuilderName');
    const messageInput = document.getElementById('menuBuilderMessage');
    
    if (nameInput) {
        currentMenuName = nameInput.value.trim();
    }
    
    if (messageInput) {
        currentMenuMessage = messageInput.value.trim();
    }
    
    updateMenuPreview();
    if (activeMenuTab === 'code') {
        updateMenuCode();
    }
}

// Añadir una opción al menú
function addMenuOption() {
    // Determinar el siguiente emoji numérico disponible
    let nextEmoji = '1️⃣';
    const usedNumbers = currentMenuOptions.map(opt => {
        const match = opt.emoji.match(/^(\d)️⃣/);
        return match ? parseInt(match[1]) : 0;
    });
    
    for (let i = 1; i <= 9; i++) {
        if (!usedNumbers.includes(i)) {
            nextEmoji = `${i}️⃣`;
            break;
        }
    }
    
    currentMenuOptions.push({
        emoji: nextEmoji,
        text: `Nueva Opción ${currentMenuOptions.length + 1}`
    });
    
    renderMenuBuilder();
    updateMenuPreview();
    if (activeMenuTab === 'code') {
        updateMenuCode();
    }
}

// Eliminar una opción del menú
function removeMenuOption(index) {
    if (index < 0 || index >= currentMenuOptions.length) return;
    
    currentMenuOptions.splice(index, 1);
    
    renderMenuBuilder();
    updateMenuPreview();
    if (activeMenuTab === 'code') {
        updateMenuCode();
    }
}

// Actualizar el emoji de una opción
function updateOptionEmoji(index, emoji) {
    if (index < 0 || index >= currentMenuOptions.length) return;
    
    currentMenuOptions[index].emoji = emoji;
    
    updateMenuPreview();
    if (activeMenuTab === 'code') {
        updateMenuCode();
    }
}

// Actualizar el texto de una opción
function updateOptionText(index, text) {
    if (index < 0 || index >= currentMenuOptions.length) return;
    
    currentMenuOptions[index].text = text;
    
    updateMenuPreview();
    if (activeMenuTab === 'code') {
        updateMenuCode();
    }
}

// Copiar el código generado
function copyMenuCode() {
    const codeElement = document.getElementById('menuGeneratedCode');
    if (!codeElement) return;
    
    const textArea = document.createElement('textarea');
    textArea.value = codeElement.textContent;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    
    showNotification('Código copiado al portapapeles', 'success');
}

// Guardar menú en un bot seleccionado
async function saveMenuToBot(botId) {
    try {
        // Primero obtener el bot actual
        const response = await fetch(`/api/bots/${botId}`);
        const data = await response.json();
        
        if (!data.success) {
            showNotification('Error obteniendo información del bot', 'error');
            return;
        }
        
        const bot = data.bot;
        
        // Crear o actualizar la estructura de menús
        if (!bot.menus) {
            bot.menus = {};
        }
        
        // Guardar el menú actual
        bot.menus[currentMenuName] = {
            message: currentMenuMessage,
            options: currentMenuOptions
        };
        
        // Actualizar el bot
        const updateResponse = await fetch(`/api/bots/${botId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                menus: bot.menus
            })
        });
        
        const updateData = await updateResponse.json();
        
        if (updateData.success) {
            showNotification(`Menú ${currentMenuName} guardado exitosamente`, 'success');
        } else {
            showNotification('Error guardando el menú: ' + updateData.error, 'error');
        }
    } catch (error) {
        console.error('Error guardando menú:', error);
        showNotification('Error de comunicación con el servidor', 'error');
    }
}

// Cargar menús desde un bot
async function loadMenusFromBot(botId, menuName) {
    try {
        const response = await fetch(`/api/bots/${botId}`);
        const data = await response.json();
        
        if (!data.success) {
            showNotification('Error obteniendo información del bot', 'error');
            return;
        }
        
        const bot = data.bot;
        
        if (!bot.menus || !bot.menus[menuName]) {
            showNotification(`El menú ${menuName} no existe en este bot`, 'warning');
            return;
        }
        
        // Cargar el menú
        const menu = bot.menus[menuName];
        currentMenuName = menuName;
        currentMenuMessage = menu.message;
        currentMenuOptions = menu.options;
        
        renderMenuBuilder();
        updateMenuPreview();
        updateMenuCode();
        
        showNotification(`Menú ${menuName} cargado exitosamente`, 'success');
    } catch (error) {
        console.error('Error cargando menú:', error);
        showNotification('Error de comunicación con el servidor', 'error');
    }
}

// Inicializar el módulo de menús cuando se cargue la página
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si estamos en la sección de menús
    if (document.getElementById('menus')) {
        initMenusModule();
        
        // Aplicar estilos para las pestañas si no existen
        if (!document.getElementById('tabs-styles')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'tabs-styles';
            styleSheet.innerHTML = `
                .tab-buttons {
                    display: flex;
                    border-bottom: 1px solid #dee2e6;
                    margin-bottom: 20px;
                }
                
                .tab-button {
                    padding: 10px 20px;
                    border: 1px solid transparent;
                    border-bottom: none;
                    border-top-left-radius: 4px;
                    border-top-right-radius: 4px;
                    cursor: pointer;
                    background-color: #f8f9fa;
                    margin-right: 5px;
                    transition: all 0.2s ease;
                }
                
                .tab-button:hover {
                    background-color: #e9ecef;
                }
                
                .tab-button.active {
                    background-color: white;
                    border-color: #dee2e6;
                    border-bottom-color: white;
                    margin-bottom: -1px;
                    font-weight: 600;
                }
                
                .tab-content {
                    padding: 20px 0;
                }
            `;
            document.head.appendChild(styleSheet);
        }
    }
});