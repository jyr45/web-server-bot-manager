// Implementación del módulo de Flujos Conversacionales
// Este script debe incluirse en index.html o importarse como un módulo

// Estado global de los flujos
let currentFlowBot = null;
let currentFlows = [];
let currentSelectedFlow = null;
let currentFlowStep = null;

// Inicialización
function initFlowsModule() {
    // Cargar bots para selector
    loadBotsForFlowSelector();

    // Event listeners
    document.getElementById('selectedBotForFlows').addEventListener('change', function () {
        const botId = this.value;
        if (botId) {
            loadFlowsForBot(botId);
        } else {
            clearFlowsView();
        }
    });
}

// Cargar bots para el selector
async function loadBotsForFlowSelector() {
    try {
        const response = await fetchWithAuth('/api/bots');
        const data = await response.json();

        if (data.success && data.bots.length > 0) {
            const selectElement = document.getElementById('selectedBotForFlows');
            selectElement.innerHTML = '<option value="">Selecciona un bot para editar</option>';

            data.bots.forEach(bot => {
                const option = document.createElement('option');
                option.value = bot.id;
                option.textContent = `${bot.name} (${bot.company})`;
                selectElement.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error cargando bots para flujos:', error);
        showNotification('Error cargando bots', 'error');
    }
}

// Cargar flujos para un bot específico
async function loadFlowsForBot(botId) {
    try {
        const response = await fetch(`/api/bots/${botId}`);
        const data = await response.json();

        if (data.success) {
            currentFlowBot = data.bot;
            currentFlows = data.bot.flows || [];
            renderFlowsList();
        } else {
            showNotification('Error cargando flujos del bot', 'error');
        }
    } catch (error) {
        console.error('Error cargando flujos:', error);
        showNotification('Error de comunicación con el servidor', 'error');
    }
}

// Renderizar lista de flujos
function renderFlowsList() {
    const container = document.getElementById('flowsContainer');

    if (!currentFlows || currentFlows.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-project-diagram"></i>
                <h4>No hay flujos configurados</h4>
                <p>Comienza creando un nuevo flujo conversacional.</p>
                <button class="btn btn-primary" onclick="addNewFlow()">
                    <i class="fas fa-plus"></i> Crear Primer Flujo
                </button>
            </div>
        `;
        return;
    }

    // Construir el HTML para la lista de flujos
    let html = `
        <div class="flow-list-header">
            <h4>Flujos Conversacionales (${currentFlows.length})</h4>
            <p>Haz clic en un flujo para editarlo</p>
        </div>
        <div class="flow-list">
    `;

    currentFlows.forEach((flow, index) => {
        html += `
    <div class="flow-item ${isActive ? 'active' : ''}" onclick="selectFlow(${index})">
        <div class="flow-item-header">
            <h5><i class="fas fa-project-diagram"></i> ${flow.name}</h5>
            <div class="flow-actions">
                <span class="status-indicator ${statusClass}" style="font-size: 10px;">
                    <span class="status-dot"></span> ${statusText}
                </span>
                <!-- AGREGAR estos botones -->
                <div class="flow-action-buttons">
                    <button class="btn btn-sm btn-outline-secondary" 
                            onclick="event.stopPropagation(); duplicateFlow(${index})" 
                            title="Duplicar flujo">
                        <i class="fas fa-copy"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-warning" 
                            onclick="event.stopPropagation(); toggleFlowStatus(${index})" 
                            title="${flow.active !== false ? 'Desactivar' : 'Activar'} flujo">
                        <i class="fas fa-${flow.active !== false ? 'pause' : 'play'}"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" 
                            onclick="event.stopPropagation(); deleteFlow(${index})" 
                            title="Eliminar flujo">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
        <p>${flow.description || 'Sin descripción'}</p>
        <div class="flow-details">
            <span><i class="fas fa-code-branch"></i> ${flow.steps?.length || 0} pasos</span>
            <span><i class="fas fa-list"></i> ${flow.options?.length || 0} opciones</span>
        </div>
    </div>
`;
    });

    html += `</div>`;

    // Si hay un flujo seleccionado, mostrar el editor
    if (currentSelectedFlow !== null) {
        const flow = currentFlows[currentSelectedFlow];

        html += `
            <div class="flow-editor">
                <div class="card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h4>Editor de Flujo: ${flow.name}</h4>
                        <button class="btn btn-success" onclick="saveFlowChanges()">
                            <i class="fas fa-save"></i> Guardar Cambios
                        </button>
                    </div>
                    <div class="card-body">
                        <div class="form-group">
                            <label>Nombre del Flujo</label>
                            <input type="text" class="form-control" id="flowName" value="${flow.name}" placeholder="Ej: MENU_PRINCIPAL">
                        </div>
                        <div class="form-group">
                            <label>Descripción</label>
                            <textarea class="form-control" id="flowDescription" rows="2" placeholder="Describe brevemente el propósito de este flujo...">${flow.description || ''}</textarea>
                        </div>
                        
                        <div class="flow-steps-section">
                            <h5><i class="fas fa-code-branch"></i> Pasos del Flujo</h5>
                            <div class="flow-steps" id="flowStepsContainer">
        `;

        // Renderizar pasos del flujo
        if (flow.steps && flow.steps.length > 0) {
            flow.steps.forEach((step, stepIndex) => {
                html += `
                    <div class="flow-step ${currentFlowStep === stepIndex ? 'active' : ''}" onclick="selectFlowStep(${stepIndex})">
                        <div class="flow-step-header">
                            <h6>Paso: ${step}</h6>
                            <div class="flow-step-actions">
                                <button class="btn btn-sm btn-danger" onclick="event.stopPropagation(); removeFlowStep(${stepIndex})">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            });
        } else {
            html += `
                <div class="empty-state" style="padding: 20px;">
                    <p>No hay pasos definidos para este flujo.</p>
                </div>
            `;
        }

        html += `
                            </div>
                            <div class="flow-step-add">
                                <input type="text" class="form-control" id="newStepName" placeholder="Nombre del nuevo paso...">
                                <button class="btn btn-primary" onclick="addFlowStep()">
                                    <i class="fas fa-plus"></i> Agregar Paso
                                </button>
                            </div>
                        </div>
                        
                        <div class="flow-options-section">
                            <h5><i class="fas fa-list"></i> Opciones del Menú</h5>
                            <div class="flow-options" id="flowOptionsContainer">
        `;

        // Renderizar opciones del flujo
        if (flow.options && flow.options.length > 0) {
            flow.options.forEach((option, optionIndex) => {
                html += `
                    <div class="flow-option">
                        <div class="flow-option-header">
                            <div class="option-number">
                                <input type="number" class="form-control" value="${option.number}" min="1" max="9" id="optionNumber_${optionIndex}">
                            </div>
                            <div class="option-text flex-grow-1">
                                <input type="text" class="form-control" value="${option.text}" placeholder="Texto de la opción" id="optionText_${optionIndex}">
                            </div>
                            <div class="option-action">
                                <input type="text" class="form-control" value="${option.action}" placeholder="Acción" id="optionAction_${optionIndex}">
                            </div>
                            <div class="option-actions">
                                <button class="btn btn-sm btn-danger" onclick="removeFlowOption(${optionIndex})">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            });
        } else {
            html += `
                <div class="empty-state" style="padding: 20px;">
                    <p>No hay opciones definidas para este flujo.</p>
                </div>
            `;
        }

        html += `
                            </div>
                            <div class="flow-option-add">
                                <button class="btn btn-primary" onclick="addFlowOption()">
                                    <i class="fas fa-plus"></i> Agregar Opción
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    container.innerHTML = html;

    // Aplicar estilos dinámicos
    applyFlowStyles();
}

// Aplicar estilos para el módulo de flujos
function applyFlowStyles() {
    // Si no existe un estilo para flujos, crearlo
    if (!document.getElementById('flow-styles')) {
        const styleSheet = document.createElement('style');
        styleSheet.id = 'flow-styles';
        styleSheet.innerHTML = `
            .flow-list-header {
                margin-bottom: 20px;
            }
            
            .flow-list {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                gap: 15px;
                margin-bottom: 30px;
            }
            
            .flow-item {
                background: white;
                border: 1px solid #e9ecef;
                border-radius: 10px;
                padding: 15px;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .flow-item:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
                border-color: #25D366;
            }
            
            .flow-item.active {
                border: 2px solid #25D366;
                background-color: rgba(37, 211, 102, 0.05);
            }
            
            .flow-item-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
            }
            
            .flow-actions {
                display: flex;
                gap: 5px;
            }
            
            .flow-details {
                display: flex;
                gap: 15px;
                margin-top: 10px;
                font-size: 0.9rem;
                color: #6c757d;
            }
            
            .flow-editor {
                margin-top: 30px;
            }
            
            .flow-steps-section,
            .flow-options-section {
                margin-top: 25px;
                border: 1px solid #e9ecef;
                border-radius: 10px;
                padding: 20px;
                background: #f8f9fa;
            }
            
            .flow-steps {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
                margin: 15px 0;
            }
            
            .flow-step {
                background: white;
                border: 1px solid #ced4da;
                border-radius: 8px;
                padding: 10px 15px;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .flow-step:hover {
                border-color: #25D366;
            }
            
            .flow-step.active {
                border-color: #25D366;
                background-color: rgba(37, 211, 102, 0.1);
            }
            
            .flow-step-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .flow-step-add,
            .flow-option-add {
                display: flex;
                gap: 10px;
                margin-top: 15px;
            }
            
            .flow-options {
                margin: 15px 0;
            }
            
            .flow-option {
                background: white;
                border: 1px solid #ced4da;
                border-radius: 8px;
                padding: 10px;
                margin-bottom: 10px;
            }
            
            .flow-option-header {
                display: flex;
                gap: 10px;
                align-items: center;
            }
            
            .option-number {
                width: 70px;
            }
            
            .option-action {
                width: 150px;
            }
        `;
        document.head.appendChild(styleSheet);
    }
}

// Seleccionar un flujo para editar
function selectFlow(index) {
    currentSelectedFlow = index;
    currentFlowStep = null;
    renderFlowsList();
}

// Seleccionar un paso de flujo
function selectFlowStep(index) {
    currentFlowStep = index;
    renderFlowsList();
}

// Añadir un nuevo flujo
function addNewFlow() {
    if (!currentFlowBot) {
        showNotification('Selecciona un bot primero', 'warning');
        return;
    }

    // Crear un nuevo flujo con valores por defecto
    const newFlow = {
        name: `FLUJO_${currentFlows.length + 1}`,
        description: 'Nuevo flujo conversacional',
        steps: ['INITIAL', 'AWAITING_CHOICE'],
        options: [
            { number: 1, text: 'Opción 1', action: 'action1' },
            { number: 2, text: 'Opción 2', action: 'action2' }
        ]
    };

    currentFlows.push(newFlow);
    currentSelectedFlow = currentFlows.length - 1;
    renderFlowsList();

    showNotification('Nuevo flujo creado', 'success');
}

// Duplicar un flujo existente
function duplicateFlow(index) {
    if (index < 0 || index >= currentFlows.length) return;

    // Clonar el flujo y modificar nombre
    const originalFlow = currentFlows[index];
    const newFlow = JSON.parse(JSON.stringify(originalFlow));
    newFlow.name = `${originalFlow.name}_COPIA`;

    currentFlows.push(newFlow);
    currentSelectedFlow = currentFlows.length - 1;
    renderFlowsList();

    showNotification('Flujo duplicado correctamente', 'success');
}

// Eliminar un flujo
function deleteFlow(index) {
    if (index < 0 || index >= currentFlows.length) return;

    if (!confirm(`¿Estás seguro de eliminar el flujo "${currentFlows[index].name}"? Esta acción no se puede deshacer.`)) {
        return;
    }

    currentFlows.splice(index, 1);

    if (currentSelectedFlow === index) {
        currentSelectedFlow = null;
    } else if (currentSelectedFlow > index) {
        currentSelectedFlow--;
    }

    // Actualizar UI
    renderFlowsList();

    // IMPORTANTE: Guardar los cambios en el servidor
    saveFlowChanges();

    showNotification('Flujo eliminado', 'success');
}

// Agregar un paso al flujo actual
function addFlowStep() {
    if (currentSelectedFlow === null) return;

    const stepNameInput = document.getElementById('newStepName');
    const stepName = stepNameInput.value.trim();

    if (!stepName) {
        showNotification('Ingresa un nombre para el paso', 'warning');
        return;
    }

    // Validar que no exista otro paso con el mismo nombre
    const currentFlow = currentFlows[currentSelectedFlow];
    if (currentFlow.steps && currentFlow.steps.includes(stepName)) {
        showNotification('Ya existe un paso con ese nombre', 'warning');
        return;
    }

    // Añadir el paso
    if (!currentFlow.steps) {
        currentFlow.steps = [];
    }

    currentFlow.steps.push(stepName);
    stepNameInput.value = '';
    renderFlowsList();

    showNotification('Paso agregado correctamente', 'success');
}

// Eliminar un paso del flujo actual
function removeFlowStep(stepIndex) {
    if (currentSelectedFlow === null) return;

    const currentFlow = currentFlows[currentSelectedFlow];
    if (!currentFlow.steps || stepIndex < 0 || stepIndex >= currentFlow.steps.length) return;

    const stepName = currentFlow.steps[stepIndex];
    if (!confirm(`¿Estás seguro de eliminar el paso "${stepName}"?`)) {
        return;
    }

    currentFlow.steps.splice(stepIndex, 1);

    if (currentFlowStep === stepIndex) {
        currentFlowStep = null;
    } else if (currentFlowStep > stepIndex) {
        currentFlowStep--;
    }

    renderFlowsList();
    showNotification('Paso eliminado', 'success');
}

// Agregar una opción al flujo actual
function addFlowOption() {
    if (currentSelectedFlow === null) return;

    const currentFlow = currentFlows[currentSelectedFlow];

    if (!currentFlow.options) {
        currentFlow.options = [];
    }

    // Determinar el siguiente número disponible
    let nextNumber = 1;
    if (currentFlow.options.length > 0) {
        nextNumber = Math.max(...currentFlow.options.map(opt => opt.number)) + 1;
    }

    // Añadir la opción
    currentFlow.options.push({
        number: nextNumber,
        text: `Opción ${nextNumber}`,
        action: `action${nextNumber}`
    });

    renderFlowsList();
    showNotification('Opción agregada correctamente', 'success');
}

// Eliminar una opción del flujo actual
function removeFlowOption(optionIndex) {
    if (currentSelectedFlow === null) return;

    const currentFlow = currentFlows[currentSelectedFlow];
    if (!currentFlow.options || optionIndex < 0 || optionIndex >= currentFlow.options.length) return;

    const optionText = currentFlow.options[optionIndex].text;
    if (!confirm(`¿Estás seguro de eliminar la opción "${optionText}"?`)) {
        return;
    }

    currentFlow.options.splice(optionIndex, 1);
    renderFlowsList();
    showNotification('Opción eliminada', 'success');
}

// Guardar cambios en el flujo actual
async function saveFlowChanges() {
    if (!currentFlowBot) return;

    const currentFlow = currentFlows[currentSelectedFlow];

    // Actualizar el nombre y descripción del flujo
    currentFlow.name = document.getElementById('flowName').value.trim();
    currentFlow.description = document.getElementById('flowDescription').value.trim();

    // Actualizar las opciones
    if (currentFlow.options) {
        currentFlow.options.forEach((option, index) => {
            const numberElement = document.getElementById(`optionNumber_${index}`);
            const textElement = document.getElementById(`optionText_${index}`);
            const actionElement = document.getElementById(`optionAction_${index}`);

            if (numberElement && textElement && actionElement) {
                option.number = parseInt(numberElement.value) || option.number;
                option.text = textElement.value.trim();
                option.action = actionElement.value.trim();
            }
        });
    }

    // Actualizar el bot en el servidor
    try {
        const response = await fetch(`/api/bots/${currentFlowBot.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                flows: currentFlows
            })
        });

        const data = await response.json();

        if (data.success) {
            showNotification('Flujos guardados exitosamente', 'success');
            // Actualizar el bot local
            currentFlowBot = data.bot;
        } else {
            showNotification('Error guardando flujos: ' + data.error, 'error');
        }
    } catch (error) {
        console.error('Error guardando flujos:', error);
        showNotification('Error de comunicación con el servidor', 'error');
    }
}
// Función 1: Guardar cambios en el flujo actualmente seleccionado
async function saveCurrentFlowChanges() {
    if (currentSelectedFlow === null || !currentFlows || !currentFlows[currentSelectedFlow] || !currentFlowBot) {
        showNotification('No hay flujo seleccionado para guardar', 'warning');
        return;
    }

    const currentFlow = currentFlows[currentSelectedFlow];

    // Actualizar el nombre y descripción del flujo
    currentFlow.name = document.getElementById('flowName').value.trim();
    currentFlow.description = document.getElementById('flowDescription').value.trim();

    // Actualizar las opciones
    if (currentFlow.options) {
        currentFlow.options.forEach((option, index) => {
            const numberElement = document.getElementById(`optionNumber_${index}`);
            const textElement = document.getElementById(`optionText_${index}`);
            const actionElement = document.getElementById(`optionAction_${index}`);

            if (numberElement && textElement && actionElement) {
                option.number = parseInt(numberElement.value) || option.number;
                option.text = textElement.value.trim();
                option.action = actionElement.value.trim();
            }
        });
    }

    // Guardar todos los flujos en el servidor
    await saveAllFlowsToServer();
}

// Función 2: Guardar todos los flujos en el servidor
async function saveAllFlowsToServer() {
    if (!currentFlowBot) {
        showNotification('No hay bot seleccionado', 'warning');
        return;
    }

    try {
        const response = await fetch(`/api/bots/${currentFlowBot.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                flows: currentFlows
            })
        });

        const data = await response.json();

        if (data.success) {
            showNotification('Flujos guardados exitosamente', 'success');
            // Actualizar el bot local
            currentFlowBot = data.bot;
        } else {
            showNotification('Error guardando flujos: ' + data.error, 'error');
        }
    } catch (error) {
        console.error('Error guardando flujos:', error);
        showNotification('Error de comunicación con el servidor', 'error');
    }
}
// Eliminar flujo por índice
function deleteFlow(index) {
    if (index < 0 || index >= currentFlows.length) {
        showNotification('Flujo no válido', 'error');
        return;
    }

    const flow = currentFlows[index];

    // Confirmación de seguridad
    const confirmMessage = `¿Estás seguro de eliminar el flujo "${flow.name}"?\n\n` +
        `Esta acción no se puede deshacer y eliminará:\n` +
        `• ${flow.steps?.length || 0} pasos\n` +
        `• ${flow.options?.length || 0} opciones\n` +
        `• ${Object.keys(flow.messages || {}).length} mensajes\n\n` +
        `Escribe "ELIMINAR" para confirmar:`;

    const confirmation = prompt(confirmMessage);

    if (confirmation !== 'ELIMINAR') {
        showNotification('Eliminación cancelada', 'info');
        return;
    }

    // Eliminar el flujo
    currentFlows.splice(index, 1);

    // Ajustar selección actual
    if (currentSelectedFlow === index) {
        // Si era el flujo seleccionado, deseleccionar
        currentSelectedFlow = null;
        hideFlowEditor();
        showFlowEditorPlaceholder();
    } else if (currentSelectedFlow > index) {
        // Si el seleccionado está después, ajustar índice
        currentSelectedFlow--;
    }

    // Actualizar UI
    renderFlowsList();

    // Guardar cambios en el servidor
    saveAllFlowsToServer(); // Usar la nueva función

    showNotification(`Flujo "${flow.name}" eliminado correctamente`, 'success');
}

// Eliminar flujo actualmente seleccionado
function deleteCurrentFlow() {
    if (currentSelectedFlow === null) {
        showNotification('No hay flujo seleccionado para eliminar', 'warning');
        return;
    }

    deleteFlow(currentSelectedFlow);
}

// Alternar estado activo/inactivo de un flujo
function toggleFlowStatus(index) {
    if (index < 0 || index >= currentFlows.length) return;

    const flow = currentFlows[index];
    const newStatus = !flow.active;

    flow.active = newStatus;

    // Actualizar UI
    renderFlowsList();

    // Si es el flujo seleccionado, actualizar editor
    if (currentSelectedFlow === index) {
        loadFlowToEditor(flow);
    }

    // Guardar cambios
    saveFlowChanges();

    const statusText = newStatus ? 'activado' : 'desactivado';
    showNotification(`Flujo "${flow.name}" ${statusText}`, 'success');
}

// Alternar estado del flujo actual
function toggleCurrentFlowStatus() {
    if (currentSelectedFlow === null) {
        showNotification('No hay flujo seleccionado', 'warning');
        return;
    }

    toggleFlowStatus(currentSelectedFlow);
}

// Eliminar todos los flujos (con mega-confirmación)
function deleteAllFlows() {
    if (!currentFlows || currentFlows.length === 0) {
        showNotification('No hay flujos para eliminar', 'info');
        return;
    }

    const totalFlows = currentFlows.length;

    // Triple confirmación para esta acción destructiva
    if (!confirm(`¿Eliminar TODOS los ${totalFlows} flujos?\n\nEsta acción es IRREVERSIBLE.`)) {
        return;
    }

    if (!confirm(`¿Estás COMPLETAMENTE seguro?\n\nSe eliminarán ${totalFlows} flujos permanentemente.`)) {
        return;
    }

    const finalConfirm = prompt(`Escribe "ELIMINAR TODO" para confirmar la eliminación de ${totalFlows} flujos:`);

    if (finalConfirm !== 'ELIMINAR TODO') {
        showNotification('Eliminación cancelada', 'info');
        return;
    }

    // Eliminar todos los flujos
    const deletedFlows = [...currentFlows];
    currentFlows = [];
    currentSelectedFlow = null;

    // Actualizar UI
    renderFlowsList();
    hideFlowEditor();
    showFlowEditorPlaceholder();

    // Guardar cambios
    saveFlowChanges();

    showNotification(`${totalFlows} flujos eliminados correctamente`, 'success');

    // Log de auditoría
    console.log(`[Flow Manager] Eliminación masiva: ${totalFlows} flujos`, deletedFlows);
}

// Restaurar flujo desde papelera (función avanzada)
function restoreFlowFromTrash(flowData) {
    if (!flowData) {
        showNotification('No hay datos de flujo para restaurar', 'error');
        return;
    }

    // Verificar que no exista un flujo con el mismo nombre
    const existingFlow = currentFlows.find(f => f.name === flowData.name);
    if (existingFlow) {
        flowData.name = `${flowData.name}_RESTAURADO_${Date.now()}`;
    }

    // Añadir el flujo restaurado
    currentFlows.push(flowData);

    // Seleccionar el flujo restaurado
    currentSelectedFlow = currentFlows.length - 1;

    // Actualizar UI
    renderFlowsList();
    showFlowEditor();
    loadFlowToEditor(flowData);

    // Guardar cambios
    saveFlowChanges();

    showNotification(`Flujo "${flowData.name}" restaurado correctamente`, 'success');
}

// Validar si el flujo se puede eliminar
function canDeleteFlow(flowIndex) {
    const flow = currentFlows[flowIndex];

    // Verificar si otros flujos dependen de este
    const dependencies = findFlowDependencies(flow.name);

    if (dependencies.length > 0) {
        const dependencyNames = dependencies.map(d => d.name).join(', ');
        showNotification(
            `No se puede eliminar: Este flujo es usado por: ${dependencyNames}`,
            'warning'
        );
        return false;
    }

    return true;
}

// Encontrar dependencias de un flujo
function findFlowDependencies(flowName) {
    const dependencies = [];

    currentFlows.forEach(flow => {
        if (flow.options) {
            flow.options.forEach(option => {
                if (option.action === 'goToFlow' && option.actionValue === flowName) {
                    dependencies.push(flow);
                }
            });
        }
    });

    return dependencies;
}

// Cargar flujos (desde la barra lateral)
function loadFlows() {
    // Actualizar la lista de bots
    loadBotsForFlowSelector();

    // Si hay un bot seleccionado, recargar sus flujos
    const selectedBotId = document.getElementById('selectedBotForFlows').value;
    if (selectedBotId) {
        loadFlowsForBot(selectedBotId);
    }

    showNotification('Lista de flujos actualizada', 'success');
}

// Limpiar la vista de flujos
function clearFlowsView() {
    currentFlowBot = null;
    currentFlows = [];
    currentSelectedFlow = null;
    currentFlowStep = null;

    const container = document.getElementById('flowsContainer');
    container.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-project-diagram"></i>
            <h4>Gestiona tus Flujos Conversacionales</h4>
            <p>Selecciona un bot arriba para ver y editar sus flujos.</p>
        </div>
    `;
}

// Inicializar el módulo de flujos cuando se cargue la página
document.addEventListener('DOMContentLoaded', function () {
    // Verificar si estamos en la sección de flujos
    if (document.getElementById('flows')) {
        initFlowsModule();
    }
});

// Sistema de Gestión de Flujos Conversacionales
// Este módulo maneja la creación, edición y gestión de flujos para bots de WhatsApp

// Estado global de flujos

let currentFlowOption = null; // Opción seleccionada actualmente
let currentFlowMessage = null; // Mensaje seleccionado actualmente

// Estado del diagrama
let diagramZoom = 1;
let isDragging = false;
let draggedNode = null;
let dragStartX = 0;
let dragStartY = 0;

// Estado de la vista previa
let previewStep = 'INITIAL';
let previewVariables = {};
let previewMessages = [];

// Plantillas predefinidas de flujos
const flowTemplates = {
    menuPrincipal: {
        name: 'MENU_PRINCIPAL',
        description: 'Menú principal para el bot',
        steps: ['INITIAL', 'AWAITING_CHOICE'],
        options: [
            { number: 1, emoji: '1️⃣', text: 'Servicios', action: 'goToFlow', actionValue: 'MENU_SERVICIOS' },
            { number: 2, emoji: '2️⃣', text: 'Consultar Estado', action: 'goToFlow', actionValue: 'CONSULTA_ESTADO' },
            { number: 3, emoji: '3️⃣', text: 'Hablar con Asesor', action: 'sendMessage', actionValue: 'CONTACTAR_ASESOR' },
            { number: 4, emoji: '4️⃣', text: 'Acerca de Nosotros', action: 'sendMessage', actionValue: 'ACERCA_DE' }
        ],
        messages: {
            welcome: '¡Hola! 👋 Bienvenido al asistente virtual. ¿En qué puedo ayudarte hoy?',
            CONTACTAR_ASESOR: 'En breve un asesor se comunicará contigo. Por favor, describe tu consulta.',
            ACERCA_DE: 'Somos una empresa dedicada a brindar soluciones eficientes para tu negocio.'
        }
    },
    servicios: {
        name: 'MENU_SERVICIOS',
        description: 'Catálogo de servicios disponibles',
        steps: ['INITIAL', 'AWAITING_CHOICE', 'DETAIL_VIEW'],
        options: [
            { number: 1, emoji: '1️⃣', text: 'Servicio 1', action: 'goToStep', actionValue: 'DETAIL_VIEW' },
            { number: 2, emoji: '2️⃣', text: 'Servicio 2', action: 'goToStep', actionValue: 'DETAIL_VIEW' },
            { number: 3, emoji: '3️⃣', text: 'Servicio 3', action: 'goToStep', actionValue: 'DETAIL_VIEW' },
            { number: 4, emoji: '⬅️', text: 'Regresar', action: 'goToFlow', actionValue: 'MENU_PRINCIPAL' }
        ],
        messages: {
            welcome: '📋 *Nuestros Servicios*\n\nSelecciona una opción para más detalles:',
            detail: 'Aquí encontrarás información detallada sobre el servicio seleccionado.'
        }
    },
    citas: {
        name: 'AGENDA_CITAS',
        description: 'Sistema de agendado de citas',
        steps: ['INITIAL', 'SELECT_DATE', 'SELECT_TIME', 'CONFIRM_APPOINTMENT'],
        options: [
            { number: 1, emoji: '✅', text: 'Confirmar Cita', action: 'goToStep', actionValue: 'CONFIRM_APPOINTMENT' },
            { number: 2, emoji: '🗓️', text: 'Cambiar Fecha', action: 'goToStep', actionValue: 'SELECT_DATE' },
            { number: 3, emoji: '⏰', text: 'Cambiar Hora', action: 'goToStep', actionValue: 'SELECT_TIME' },
            { number: 4, emoji: '❌', text: 'Cancelar', action: 'goToFlow', actionValue: 'MENU_PRINCIPAL' }
        ],
        messages: {
            welcome: '📅 *Agenda de Citas*\n\nPor favor selecciona una fecha disponible:',
            dateSelected: 'Has seleccionado: ${date}. Ahora elige una hora:',
            timeSelected: 'Has seleccionado: ${date} a las ${time}.\n\n¿Deseas confirmar esta cita?',
            confirmed: '✅ ¡Tu cita ha sido confirmada!\n\nFecha: ${date}\nHora: ${time}\n\nRecuerda llegar 10 minutos antes.'
        }
    },
    consultas: {
        name: 'CONSULTA_ESTADO',
        description: 'Consulta de estado de servicios o pedidos',
        steps: ['INITIAL', 'ENTER_ID', 'SHOW_STATUS'],
        options: [
            { number: 1, emoji: '🔄', text: 'Nueva Consulta', action: 'goToStep', actionValue: 'ENTER_ID' },
            { number: 2, emoji: '📞', text: 'Contactar Soporte', action: 'sendMessage', actionValue: 'CONTACTAR_SOPORTE' },
            { number: 3, emoji: '⬅️', text: 'Regresar al Menú', action: 'goToFlow', actionValue: 'MENU_PRINCIPAL' }
        ],
        messages: {
            welcome: '🔍 *Consulta de Estado*\n\nPor favor, envía el número de folio o ID de tu servicio:',
            searching: '⏳ Buscando información del folio ${id}...',
            result: '📋 *Resultado de la consulta:*\n\nFolio: ${id}\nEstatus: ${status}\nÚltima actualización: ${date}',
            notFound: '❌ No se encontró información para el folio ${id}. Verifica que el número sea correcto.',
            CONTACTAR_SOPORTE: 'Un agente de soporte se comunicará contigo en breve para ayudarte con tu consulta.'
        }
    }
};

// Inicialización del módulo
function initFlowsModule() {
    console.log('Inicializando módulo de Flujos Conversacionales...');

    // Cargar bots para selector
    loadBotsForFlowSelector();

    // Event listeners para tabs
    document.querySelectorAll('.flow-edit-tabs .tab-button').forEach(tab => {
        tab.addEventListener('click', function () {
            const tabId = this.getAttribute('data-tab');
            switchFlowTab(tabId);
        });
    });

    // Event listener para búsqueda de flujos
    const searchInput = document.getElementById('flowSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            const searchTerm = this.value.toLowerCase().trim();
            filterFlows(searchTerm);
        });
    }

    // Inicializar eventos de diagrama
    initDiagramEvents();
}

// Cargar bots para el selector
async function loadBotsForFlowSelector() {
    try {
        const response = await fetchWithAuth('/api/bots');
        const data = await response.json();

        if (data.success && data.bots.length > 0) {
            const selectElement = document.getElementById('selectedBotForFlows');
            if (!selectElement) return;

            // Guardar selección actual
            const currentSelection = selectElement.value;

            // Limpiar opciones actuales
            selectElement.innerHTML = '<option value="">Selecciona un bot para editar</option>';

            // Agregar bots al selector
            data.bots.forEach(bot => {
                const option = document.createElement('option');
                option.value = bot.id;
                option.textContent = `${bot.name} (${bot.company})`;
                selectElement.appendChild(option);
            });

            // Restaurar selección si es posible
            if (currentSelection && selectElement.querySelector(`option[value="${currentSelection}"]`)) {
                selectElement.value = currentSelection;
                loadFlowsForBot(currentSelection);
            }

            // Event listener para cambio de bot
            selectElement.addEventListener('change', function () {
                const botId = this.value;
                if (botId) {
                    loadFlowsForBot(botId);
                } else {
                    clearFlowsView();
                }
            });
        }
    } catch (error) {
        console.error('Error cargando bots para editor de flujos:', error);
        showNotification('Error cargando bots', 'error');
    }
}

// Cargar flujos para un bot específico
async function loadFlowsForBot(botId) {
    try {
        showNotification('Cargando flujos...', 'info');

        const response = await fetch(`/api/bots/${botId}`);
        const data = await response.json();

        if (data.success) {
            currentFlowBot = data.bot;

            // Extraer y procesar flujos
            if (Array.isArray(currentFlowBot.flows)) {
                currentFlows = currentFlowBot.flows;
            } else if (typeof currentFlowBot.flows === 'string') {
                try {
                    currentFlows = JSON.parse(currentFlowBot.flows);
                } catch (e) {
                    currentFlows = [];
                    console.error('Error parseando flujos del bot:', e);
                }
            } else {
                currentFlows = [];
            }

            // Asegurar que cada flujo tenga las propiedades necesarias
            currentFlows = currentFlows.map(normalizeFlow);

            // Actualizar la interfaz
            renderFlowsList();
            showNotification('Flujos cargados correctamente', 'success');

            // Mostrar el editor vacío
            hideFlowEditor();
            showFlowEditorPlaceholder();
        } else {
            showNotification('Error cargando flujos del bot', 'error');
        }
    } catch (error) {
        console.error('Error cargando flujos:', error);
        showNotification('Error de comunicación con el servidor', 'error');
    }
}

// Normalizar estructura de flujo
function normalizeFlow(flow) {
    return {
        name: flow.name || 'FLUJO_SIN_NOMBRE',
        description: flow.description || '',
        steps: Array.isArray(flow.steps) ? flow.steps : ['INITIAL'],
        options: Array.isArray(flow.options) ? flow.options.map(normalizeOption) : [],
        messages: flow.messages || {},
        active: flow.active !== false,
        conditions: flow.conditions || [],
        variables: flow.variables || {},
        validations: flow.validations || {},
        loops: flow.loops || [],
        timers: flow.timers || [],
        schedules: flow.schedules || {
            enabled: false,
            workingHours: {
                monday: { start: '09:00', end: '18:00', active: true },
                tuesday: { start: '09:00', end: '18:00', active: true },
                // ... resto de días
            },
            timezone: 'America/Mexico_City',
            outsideHoursMessage: 'Estamos fuera de horario'
        }
    };

}

// Normalizar estructura de opción
function normalizeOption(option) {
    return {
        number: option.number || 1,
        emoji: option.emoji || getEmojiForNumber(option.number || 1),
        text: option.text || 'Opción sin texto',
        action: option.action || 'goToStep',
        actionValue: option.actionValue || ''
    };
}

// Obtener emoji para un número
function getEmojiForNumber(num) {
    const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];
    return emojis[(num - 1) % emojis.length];
}

// Renderizar lista de flujos
function renderFlowsList() {
    const container = document.getElementById('flowsListContainer');
    if (!container) return;

    // Actualizar contador de flujos
    const countElement = document.getElementById('flowsCount');
    if (countElement) {
        countElement.textContent = currentFlows.length;
    }

    if (!currentFlows || currentFlows.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-project-diagram"></i>
                <p>No hay flujos disponibles</p>
            </div>
        `;
        return;
    }

    let html = '';

    // Generar HTML para cada flujo
    currentFlows.forEach((flow, index) => {
        const isActive = index === currentSelectedFlow;
        const statusClass = flow.active !== false ? 'status-enabled' : 'status-disabled';
        const statusText = flow.active !== false ? 'Activo' : 'Desactivado';

        html += `
            <div class="flow-item ${isActive ? 'active' : ''}" onclick="selectFlow(${index})">
                <h5>
                    <span><i class="fas fa-project-diagram"></i> ${flow.name}</span>
                    <div class="flow-actions">
                        <span class="status-indicator ${statusClass}" style="font-size: 10px;">
                            <span class="status-dot"></span> ${statusText}
                        </span>
                    </div>
                </h5>
                <p>${flow.description || 'Sin descripción'}</p>
                <div class="flow-details">
                    <span><i class="fas fa-code-branch"></i> ${flow.steps?.length || 0} pasos</span>
                    <span><i class="fas fa-list"></i> ${flow.options?.length || 0} opciones</span>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// Seleccionar un flujo para editar
function selectFlow(index) {
    if (index < 0 || index >= currentFlows.length) return;

    currentSelectedFlow = index;
    currentFlowStep = null;
    currentFlowOption = null;
    currentFlowMessage = null;

    // Actualizar UI
    renderFlowsList();
    showFlowEditor();
    loadFlowToEditor(currentFlows[index]);
}

// Cargar flujo en el editor
function loadFlowToEditor(flow) {
    // Cargar datos básicos
    document.getElementById('flowName').value = flow.name || '';
    document.getElementById('flowDescription').value = flow.description || '';

    // Actualizar nombre en el título
    document.querySelectorAll('.flow-title-area h4').forEach(el => {
        if (el) el.textContent = flow.name || 'Flujo sin nombre';
    });

    // Actualizar estado
    const statusIndicator = document.querySelector('.flow-status .status-indicator');
    if (statusIndicator) {
        statusIndicator.className = `status-indicator ${flow.active !== false ? 'status-enabled' : 'status-disabled'}`;
        statusIndicator.innerHTML = `<span class="status-dot"></span> ${flow.active !== false ? 'Activo' : 'Desactivado'}`;
    }

    // Cargar pestañas
    loadFlowSteps(flow);
    loadFlowOptions(flow);
    loadFlowMessages(flow);

    // Generar diagrama
    generateFlowDiagram(flow);

    // Cargar configuración de catálogos
    loadCatalogSettings(flow);
    

    // Generar código
    generateFlowCode(flow);

    // Activar la primera pestaña por defecto
    switchFlowTab('diagram');
}

// Cargar pasos del flujo
function loadFlowSteps(flow) {
    const stepsList = document.getElementById('flowStepsList');
    if (!stepsList) return;

    if (!flow.steps || flow.steps.length === 0) {
        stepsList.innerHTML = `
            <div class="empty-state">
                <p>No hay pasos definidos para este flujo</p>
            </div>
        `;
        return;
    }

    let html = '';

    // Generar HTML para cada paso
    flow.steps.forEach((step, index) => {
        const isActive = index === currentFlowStep;

        html += `
            <div class="flow-step-item ${isActive ? 'active' : ''}" onclick="selectFlowStep(${index})">
                <h6><i class="fas fa-code-branch"></i> ${step}</h6>
                <p>
                    ${getStepDescription(step, flow)}
                </p>
            </div>
        `;
    });

    stepsList.innerHTML = html;

    // Actualizar el formulario de edición de paso
    updateStepEditForm();
}

// Obtener descripción de un paso
function getStepDescription(step, flow) {
    switch (step) {
        case 'INITIAL':
            return 'Paso inicial del flujo';
        case 'AWAITING_CHOICE':
            return 'Esperando selección del usuario';
        default:
            return `Paso personalizado`;
    }
}

// Cargar opciones del flujo
function loadFlowOptions(flow) {
    const optionsList = document.getElementById('flowOptionsList');
    if (!optionsList) return;

    if (!flow.options || flow.options.length === 0) {
        optionsList.innerHTML = `
            <div class="empty-state">
                <p>No hay opciones definidas para este flujo</p>
            </div>
        `;
        return;
    }

    let html = '';

    // Generar HTML para cada opción
    flow.options.forEach((option, index) => {
        const isActive = index === currentFlowOption;
        const emoji = option.emoji || getEmojiForNumber(option.number || (index + 1));

        html += `
            <div class="flow-option-item ${isActive ? 'active' : ''}" onclick="selectFlowOption(${index})">
                <h6>
                    <span class="option-number">${emoji}</span>
                    ${option.text || 'Opción sin texto'}
                </h6>
                <p>
                    <span class="badge bg-secondary">${getActionDescription(option.action)}</span>
                    ${option.actionValue ? `<span class="text-muted">${option.actionValue}</span>` : ''}
                </p>
            </div>
        `;
    });

    optionsList.innerHTML = html;

    // Actualizar el formulario de edición de opción
    updateOptionEditForm();
}

// Obtener emoji para un número
function getEmojiForNumber(num) {
    const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];
    return emojis[(num - 1) % emojis.length];
}

// Obtener descripción de una acción
function getActionDescription(action) {
    switch (action) {
        case 'goToStep':
            return 'Ir a paso';
        case 'goToFlow':
            return 'Ir a flujo';
        case 'sendMessage':
            return 'Enviar mensaje';
        case 'sendMedia':
            return 'Enviar multimedia';
        case 'callAPI':
            return 'Llamar API';
        default:
            return action || 'Sin acción';
    }
}



// Configuración de APIs por flujo
function configureFlowAPI(flowIndex, apiConfig) {
    if (!currentFlows[flowIndex].apis) {
        currentFlows[flowIndex].apis = [];
    }

    currentFlows[flowIndex].apis.push({
        name: apiConfig.name,
        url: apiConfig.url,
        method: apiConfig.method,
        headers: apiConfig.headers,
        params: apiConfig.params,
        trigger: apiConfig.trigger // cuándo llamar la API
    });
}

// Generar código para llamadas API
function generateAPICallCode(apiConfig) {
    return `
async function call${apiConfig.name}API(client, userId, params, session) {
    try {
        const response = await axios.${apiConfig.method.toLowerCase()}('${apiConfig.url}', {
            headers: ${JSON.stringify(apiConfig.headers)},
            params: { ...params, ...${JSON.stringify(apiConfig.params)} }
        });
        
        // Procesar respuesta
        session.apiResponse = response.data;
        return response.data;
    } catch (error) {
        console.error('Error en API ${apiConfig.name}:', error);
        await client.sendMessage(userId, 'Error procesando solicitud');
        return null;
    }
}`;
}

// Cargar mensajes del flujo
function loadFlowMessages(flow) {
    const messagesList = document.getElementById('flowMessagesList');
    if (!messagesList) return;

    const messages = flow.messages || {};
    const messageKeys = Object.keys(messages);

    if (messageKeys.length === 0) {
        messagesList.innerHTML = `
            <div class="empty-state">
                <p>No hay mensajes definidos para este flujo</p>
            </div>
        `;
        return;
    }

    let html = '';

    // Generar HTML para cada mensaje
    messageKeys.forEach((key) => {
        const isActive = key === currentFlowMessage;
        const message = messages[key];
        const displayText = typeof message === 'string'
            ? message.substring(0, 50) + (message.length > 50 ? '...' : '')
            : 'Mensaje complejo';

        html += `
            <div class="flow-message-item ${isActive ? 'active' : ''}" onclick="selectFlowMessage('${key}')">
                <h6><i class="fas fa-comment"></i> ${key}</h6>
                <p>${displayText}</p>
            </div>
        `;
    });

    messagesList.innerHTML = html;
}

// Seleccionar un paso del flujo
function selectFlowStep(index) {
    if (!currentFlows || !currentFlows[currentSelectedFlow]) return;

    const flow = currentFlows[currentSelectedFlow];
    if (!flow.steps || index < 0 || index >= flow.steps.length) return;

    currentFlowStep = index;
    currentFlowOption = null;
    currentFlowMessage = null;

    // Actualizar UI
    loadFlowSteps(flow);

    // Mostrar formulario de edición de paso
    const stepForm = document.getElementById('stepEditForm');
    const placeholder = document.getElementById('stepEditorPlaceholder');

    if (stepForm && placeholder) {
        placeholder.style.display = 'none';
        stepForm.style.display = 'block';
    }

    updateStepEditForm();
}

// Actualizar formulario de edición de paso
function updateStepEditForm() {
    if (currentFlowStep === null || !currentFlows || !currentFlows[currentSelectedFlow]) {
        // Ocultar formulario
        const stepForm = document.getElementById('stepEditForm');
        const placeholder = document.getElementById('stepEditorPlaceholder');

        if (stepForm && placeholder) {
            stepForm.style.display = 'none';
            placeholder.style.display = 'flex';
        }
        return;
    }

    const flow = currentFlows[currentSelectedFlow];
    const step = flow.steps[currentFlowStep];

    // Actualizar campos del formulario
    const currentStepNameEl = document.getElementById('currentStepName');
    const stepNameEl = document.getElementById('stepName');
    const stepMessageEl = document.getElementById('stepMessage');
    const stepNextStepEl = document.getElementById('stepNextStep');
    const stepConditionEl = document.getElementById('stepCondition');

    if (currentStepNameEl) currentStepNameEl.textContent = step;
    if (stepNameEl) stepNameEl.value = step;

    // Obtener mensaje para este paso
    if (stepMessageEl) {
        let message = '';
        if (step === 'INITIAL' && flow.messages && flow.messages.welcome) {
            message = flow.messages.welcome;
        } else if (flow.messages && flow.messages[step]) {
            message = flow.messages[step];
        }
        stepMessageEl.value = message;
    }

    // Llenar selector de siguientes pasos
    if (stepNextStepEl) {
        stepNextStepEl.innerHTML = '<option value="">Seleccionar siguiente paso</option>';

        flow.steps.forEach(s => {
            if (s !== step) {
                const option = document.createElement('option');
                option.value = s;
                option.textContent = s;
                stepNextStepEl.appendChild(option);
            }
        });

        // Intentar seleccionar el siguiente paso
        const currentIndex = flow.steps.indexOf(step);
        if (currentIndex >= 0 && currentIndex < flow.steps.length - 1) {
            stepNextStepEl.value = flow.steps[currentIndex + 1];
        }
    }

    // Condición (si existe)
    if (stepConditionEl) {
        stepConditionEl.value = '';
    }
}

// Seleccionar una opción del flujo
function selectFlowOption(index) {
    if (!currentFlows || !currentFlows[currentSelectedFlow]) return;

    const flow = currentFlows[currentSelectedFlow];
    if (!flow.options || index < 0 || index >= flow.options.length) return;

    currentFlowOption = index;
    currentFlowStep = null;
    currentFlowMessage = null;

    // Actualizar UI
    loadFlowOptions(flow);

    // Mostrar formulario de edición de opción
    const optionForm = document.getElementById('optionEditForm');
    const placeholder = document.getElementById('optionEditorPlaceholder');

    if (optionForm) {
        optionForm.style.display = 'block';
    }

    if (placeholder) {
        placeholder.style.display = 'none';
    }
    openOptionEditModal(index);

    updateOptionEditForm();
}

// Actualizar formulario de edición de opción
function updateOptionEditForm() {
    if (currentFlowOption === null || !currentFlows || !currentFlows[currentSelectedFlow]) {
        // Ocultar formulario
        const optionForm = document.getElementById('optionEditForm');
        const placeholder = document.getElementById('optionEditorPlaceholder');

        if (optionForm) {
            optionForm.style.display = 'none';
        }

        if (placeholder) {
            placeholder.style.display = 'block';
        }
        return;
    }

    const flow = currentFlows[currentSelectedFlow];
    const option = flow.options[currentFlowOption];

    // Actualizar campos del formulario
    const currentOptionNumberEl = document.getElementById('currentOptionNumber');
    const optionEmojiEl = document.getElementById('optionEmoji');
    const optionTextEl = document.getElementById('optionText');
    const optionActionEl = document.getElementById('optionAction');
    const optionActionValueEl = document.getElementById('optionActionValue');

    if (currentOptionNumberEl) currentOptionNumberEl.textContent = option.number || (currentFlowOption + 1);

    if (optionEmojiEl) {
        // Intentar seleccionar el emoji actual
        const emoji = option.emoji || getEmojiForNumber(option.number || (currentFlowOption + 1));

        // Verificar si el emoji existe en las opciones
        const emojiExists = Array.from(optionEmojiEl.options).some(opt => opt.value === emoji);

        if (emojiExists) {
            optionEmojiEl.value = emoji;
        } else {
            // Usar el primer emoji disponible
            optionEmojiEl.selectedIndex = 0;
        }
    }

    if (optionTextEl) optionTextEl.value = option.text || '';

    if (optionActionEl) {
        // Intentar seleccionar la acción actual
        if (option.action && Array.from(optionActionEl.options).some(opt => opt.value === option.action)) {
            optionActionEl.value = option.action;
        } else {
            // Usar la primera acción disponible
            optionActionEl.selectedIndex = 0;
        }
    }

    if (optionActionValueEl) optionActionValueEl.value = option.actionValue || '';
}

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

            // Actualizar el contador de caracteres
            updateCharCounter();
        } else if (typeof messageContent === 'object') {
            // Si es un objeto, puede ser un mensaje con formato especial
            if (messageContent.type) {
                messageType = messageContent.type;

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

    // Establecer el tipo de mensaje
    if (messageTypeEl) {
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

// Cambiar entre pestañas del editor de flujo
function switchFlowTab(tabId) {
    // Guardar referencia al tab actual antes de cambiar
    const previousTabId = document.querySelector('.flow-edit-tabs .tab-button.active')?.getAttribute('data-tab');

    // Ocultar todas las pestañas (usando display: none explícitamente)
    document.querySelectorAll('.flow-tab-content .tab-pane').forEach(tab => {
        tab.style.display = 'none';
        tab.classList.remove('active');
    });

    // Desactivar todos los botones
    document.querySelectorAll('.flow-edit-tabs .tab-button').forEach(button => {
        button.classList.remove('active');
    });

    // Mostrar pestaña seleccionada
    const tabElement = document.getElementById(`flow${tabId.charAt(0).toUpperCase() + tabId.slice(1)}Tab`);
    if (tabElement) {
        tabElement.style.display = 'block';
        tabElement.classList.add('active');
    }

    // Activar botón correspondiente
    const buttonElement = document.querySelector(`.flow-edit-tabs .tab-button[data-tab="${tabId}"]`);
    if (buttonElement) {
        buttonElement.classList.add('active');
    }

    // Acciones específicas para cada pestaña
    if (tabId === 'diagram') {
        refreshFlowDiagram();
    } else if (tabId === 'code') {
        refreshFlowCode();
    }
if (tabId === 'catalog') {
    // Asegurarse que se carguen los catálogos cuando se cambia a esta pestaña
    if (currentSelectedFlow !== null && currentFlows && currentFlows[currentSelectedFlow]) {
        loadCatalogSettings(currentFlows[currentSelectedFlow]);
    }
}
    // Si venimos de la pestaña de código y vamos a otra pestaña, forzar la actualización de la UI
    if (previousTabId === 'code' && tabId !== 'code') {
        setTimeout(() => {
            // Forzar repintado de la UI
            if (currentSelectedFlow !== null && currentFlows && currentFlows[currentSelectedFlow]) {
                const flow = currentFlows[currentSelectedFlow];
                if (tabId === 'steps') {
                    loadFlowSteps(flow);
                } else if (tabId === 'options') {
                    loadFlowOptions(flow);
                } else if (tabId === 'messages') {
                    loadFlowMessages(flow);
                } else if (tabId === 'diagram') {
                    // Regenerar completamente el diagrama
                    const canvas = document.getElementById('flowDiagramCanvas');
                    if (canvas) {
                        canvas.innerHTML = '';
                        generateFlowDiagram(flow);
                    }
                }
            }
        }, 50); // Pequeño timeout para asegurar que el DOM se actualice
    }
}

// Mostrar editor de flujo
function showFlowEditor() {
    const editor = document.getElementById('flowEditContainer');
    const placeholder = document.getElementById('flowEditorPlaceholder');

    if (editor && placeholder) {
        editor.style.display = 'flex';
        placeholder.style.display = 'none';
    }
}

// Ocultar editor de flujo
function hideFlowEditor() {
    const editor = document.getElementById('flowEditContainer');

    if (editor) {
        editor.style.display = 'none';
    }
}

// Mostrar placeholder del editor
function showFlowEditorPlaceholder() {
    const placeholder = document.getElementById('flowEditorPlaceholder');

    if (placeholder) {
        placeholder.style.display = 'flex';
    }
}

// Añadir un nuevo flujo
function addNewFlow() {
    if (!currentFlowBot) {
        showNotification('Selecciona un bot primero', 'warning');
        return;
    }

    // Crear flujo con valores por defecto
    const newFlow = {
        name: `FLUJO_${currentFlows.length + 1}`,
        description: 'Nuevo flujo conversacional',
        steps: ['INITIAL', 'AWAITING_CHOICE'],
        options: [
            { number: 1, emoji: '1️⃣', text: 'Opción 1', action: 'goToStep', actionValue: 'AWAITING_CHOICE' },
            { number: 2, emoji: '2️⃣', text: 'Opción 2', action: 'goToStep', actionValue: 'AWAITING_CHOICE' }
        ],
        messages: {
            welcome: '¡Hola! Bienvenido a este flujo conversacional.'
        },
        active: true
    };

    // Añadir a la lista
    currentFlows.push(newFlow);

    // Seleccionar el nuevo flujo
    currentSelectedFlow = currentFlows.length - 1;

    // Actualizar UI
    renderFlowsList();
    showFlowEditor();
    loadFlowToEditor(newFlow);

    showNotification('Nuevo flujo creado', 'success');
}

// Duplicar flujo actual
function duplicateCurrentFlow() {
    if (currentSelectedFlow === null || !currentFlows || !currentFlows[currentSelectedFlow]) {
        showNotification('Selecciona un flujo primero', 'warning');
        return;
    }

    // Clonar el flujo
    const originalFlow = currentFlows[currentSelectedFlow];
    const newFlow = JSON.parse(JSON.stringify(originalFlow));

    // Modificar nombre
    newFlow.name = `${originalFlow.name}_COPIA`;

    // Añadir a la lista
    currentFlows.push(newFlow);

    // Seleccionar el nuevo flujo
    currentSelectedFlow = currentFlows.length - 1;

    // Actualizar UI
    renderFlowsList();
    loadFlowToEditor(newFlow);

    showNotification('Flujo duplicado', 'success');
}

// Guardar cambios en el flujo actual
function saveCurrentFlow() {
    if (currentSelectedFlow === null || !currentFlows || !currentFlows[currentSelectedFlow]) {
        showNotification('No hay flujo seleccionado para guardar', 'warning');
        return;
    }

    // Obtener valores del formulario
    const nameInput = document.getElementById('flowName');
    const descriptionInput = document.getElementById('flowDescription');

    if (!nameInput.value.trim()) {
        showNotification('El nombre del flujo no puede estar vacío', 'warning');
        return;
    }

    // Actualizar el flujo
    const flow = currentFlows[currentSelectedFlow];
    flow.name = nameInput.value.trim();
    flow.description = descriptionInput.value.trim();

    // Guardar en el servidor
    saveCurrentFlowChanges(); // Usar la función para el flujo actual
}

// Guardar los cambios en el servidor
/*async function saveFlowChanges() {
    if (!currentFlowBot || !currentFlows) {
        showNotification('No hay bot seleccionado', 'warning');
        return;
    }

    try {
        showNotification('Guardando flujos...', 'info');

        const response = await fetch(`/api/bots/${currentFlowBot.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                flows: currentFlows
            })
        });

        const data = await response.json();

        if (data.success) {
            showNotification('Flujos guardados exitosamente', 'success');

            // Actualizar el bot local
            currentFlowBot = data.bot;

            // Actualizar UI
            renderFlowsList();
        } else {
            showNotification('Error guardando flujos: ' + data.error, 'error');
        }
    } catch (error) {
        console.error('Error guardando flujos:', error);
        showNotification('Error de comunicación con el servidor', 'error');
    }
}*/

// Agregar un nuevo paso al flujo actual
function addFlowStep() {
    if (currentSelectedFlow === null || !currentFlows || !currentFlows[currentSelectedFlow]) {
        showNotification('Selecciona un flujo primero', 'warning');
        return;
    }

    // Mostrar modal para crear paso
    let stepName = prompt('Nombre del nuevo paso (ej: CONFIRM_ORDER):', '');

    if (!stepName) return;

    // Convertir a mayúsculas y reemplazar espacios
    stepName = stepName.toUpperCase().replace(/\s+/g, '_');

    // Validar que no exista ya
    const flow = currentFlows[currentSelectedFlow];
    if (flow.steps && flow.steps.includes(stepName)) {
        showNotification('Ya existe un paso con ese nombre', 'warning');
        return;
    }

    // Añadir el paso
    if (!flow.steps) {
        flow.steps = [];
    }

    flow.steps.push(stepName);

    // Actualizar UI
    loadFlowSteps(flow);

    // Seleccionar el nuevo paso
    currentFlowStep = flow.steps.length - 1;
    selectFlowStep(currentFlowStep);

    showNotification('Paso añadido correctamente', 'success');

    // Actualizar diagrama
    generateFlowDiagram(flow);
}

// Eliminar paso actual
function deleteCurrentStep() {
    if (currentSelectedFlow === null || currentFlowStep === null || !currentFlows || !currentFlows[currentSelectedFlow]) {
        return;
    }

    const flow = currentFlows[currentSelectedFlow];
    if (!flow.steps || currentFlowStep < 0 || currentFlowStep >= flow.steps.length) {
        return;
    }

    const stepName = flow.steps[currentFlowStep];

    // No permitir eliminar pasos esenciales
    if (stepName === 'INITIAL') {
        showNotification('No se puede eliminar el paso INITIAL', 'warning');
        return;
    }

    if (!confirm(`¿Estás seguro de eliminar el paso "${stepName}"?`)) {
        return;
    }

    // Eliminar el paso
    flow.steps.splice(currentFlowStep, 1);

    // Actualizar referencias en opciones
    if (flow.options) {
        flow.options.forEach(option => {
            if (option.action === 'goToStep' && option.actionValue === stepName) {
                option.actionValue = '';
            }
        });
    }

    // Actualizar UI
    currentFlowStep = null;
    loadFlowSteps(flow);

    showNotification('Paso eliminado', 'success');

    // Actualizar diagrama
    generateFlowDiagram(flow);
}

// Guardar cambios en el paso actual
function saveStepChanges() {
    if (currentSelectedFlow === null || currentFlowStep === null || !currentFlows || !currentFlows[currentSelectedFlow]) {
        return;
    }

    const flow = currentFlows[currentSelectedFlow];
    if (!flow.steps || currentFlowStep < 0 || currentFlowStep >= flow.steps.length) {
        return;
    }

    const oldStepName = flow.steps[currentFlowStep];
    const newStepName = document.getElementById('stepName').value.trim().toUpperCase().replace(/\s+/g, '_');

    if (!newStepName) {
        showNotification('El nombre del paso no puede estar vacío', 'warning');
        return;
    }

    // Si cambió el nombre, verificar que no exista
    if (oldStepName !== newStepName && flow.steps.includes(newStepName)) {
        showNotification('Ya existe un paso con ese nombre', 'warning');
        return;
    }

    // Actualizar el paso
    flow.steps[currentFlowStep] = newStepName;

    // Actualizar referencias en opciones si cambió el nombre
    if (oldStepName !== newStepName && flow.options) {
        flow.options.forEach(option => {
            if (option.action === 'goToStep' && option.actionValue === oldStepName) {
                option.actionValue = newStepName;
            }
        });
    }

    // Actualizar mensaje
    const stepMessage = document.getElementById('stepMessage').value.trim();
    if (stepMessage) {
        if (!flow.messages) {
            flow.messages = {};
        }

        if (newStepName === 'INITIAL') {
            flow.messages.welcome = stepMessage;
        } else {
            flow.messages[newStepName] = stepMessage;
        }
    }

    // Actualizar UI
    loadFlowSteps(flow);
    selectFlowStep(currentFlowStep);

    showNotification('Paso actualizado', 'success');

    // Actualizar diagrama
    generateFlowDiagram(flow);
}

// Agregar una opción al flujo actual (versión modificada para usar modal)
function addFlowOption() {
    if (currentSelectedFlow === null || !currentFlows || !currentFlows[currentSelectedFlow]) {
        showNotification('Selecciona un flujo primero', 'warning');
        return;
    }

    const flow = currentFlows[currentSelectedFlow];

    // Determinar el siguiente número
    let nextNumber = 1;
    if (flow.options && flow.options.length > 0) {
        const numbers = flow.options.map(opt => opt.number || 0);
        nextNumber = Math.max(...numbers) + 1;
    }

    // Crear nueva opción
    const newOption = {
        number: nextNumber,
        emoji: getEmojiForNumber(nextNumber),
        text: `Opción ${nextNumber}`,
        action: 'goToStep',
        actionValue: ''
    };

    // Añadir la opción
    if (!flow.options) {
        flow.options = [];
    }

    flow.options.push(newOption);

    // Actualizar UI
    loadFlowOptions(flow);

    // Seleccionar la nueva opción (abre el modal)
    currentFlowOption = flow.options.length - 1;
    openOptionEditModal(currentFlowOption);

    showNotification('Opción añadida correctamente', 'success');
}

// Eliminar opción actual
function deleteCurrentOption() {
    if (currentSelectedFlow === null || currentFlowOption === null || !currentFlows || !currentFlows[currentSelectedFlow]) {
        showNotification('No hay opción seleccionada para eliminar', 'warning');
        return;
    }

    const flow = currentFlows[currentSelectedFlow];
    if (!flow.options || currentFlowOption < 0 || currentFlowOption >= flow.options.length) {
        showNotification('Opción no válida', 'error');
        return;
    }

    const option = flow.options[currentFlowOption];

    if (!confirm(`¿Estás seguro de eliminar la opción "${option.text}"?`)) {
        return;
    }

    // Eliminar la opción
    flow.options.splice(currentFlowOption, 1);

    // Actualizar UI
    currentFlowOption = null;
    loadFlowOptions(flow);

    // Ocultar formulario de edición
    const optionForm = document.getElementById('optionEditForm');
    const placeholder = document.getElementById('optionEditorPlaceholder');

    if (optionForm) {
        optionForm.style.display = 'none';
    }

    if (placeholder) {
        placeholder.style.display = 'block';
    }

    showNotification('Opción eliminada', 'success');

    // Guardar cambios en el servidor
    saveAllFlowsToServer();

    // Actualizar diagrama si está visible
    if (document.getElementById('flowDiagramTab').classList.contains('active')) {
        generateFlowDiagram(flow);
    }
}

// Guardar cambios en la opción actual
function saveOptionChanges() {
    if (currentSelectedFlow === null || currentFlowOption === null || !currentFlows || !currentFlows[currentSelectedFlow]) {
        showNotification('No hay opción seleccionada para guardar', 'warning');
        return;
    }

    const flow = currentFlows[currentSelectedFlow];
    if (!flow.options || currentFlowOption < 0 || currentFlowOption >= flow.options.length) {
        showNotification('Opción no válida', 'error');
        return;
    }

    const option = flow.options[currentFlowOption];

    // Obtener valores del formulario
    const emoji = document.getElementById('optionEmoji').value;
    const text = document.getElementById('optionText').value.trim();
    const action = document.getElementById('optionAction').value;
    const actionValue = document.getElementById('optionActionValue').value.trim();

    if (!text) {
        showNotification('El texto de la opción no puede estar vacío', 'warning');
        return;
    }

    // Actualizar la opción
    option.emoji = emoji;
    option.text = text;
    option.action = action;
    option.actionValue = actionValue;

    // Actualizar UI
    loadFlowOptions(flow);
    selectFlowOption(currentFlowOption);

    showNotification('Opción actualizada', 'success');

    // Guardar cambios en el servidor
    saveAllFlowsToServer();

    // Actualizar diagrama si está visible
    if (document.getElementById('flowDiagramTab').classList.contains('active')) {
        generateFlowDiagram(flow);
    }
}

// Mostrar opciones de valor de acción según la acción seleccionada
function showActionValueOptions() {
    const actionSelect = document.getElementById('optionAction');
    const valueContainer = document.getElementById('optionActionValueContainer');
    const valueInput = document.getElementById('optionActionValue');

    if (!actionSelect || !valueContainer || !valueInput) return;

    const action = actionSelect.value;

    // Limpiar cualquier contenido previo
    valueInput.value = '';

    // Mostrar diferentes opciones según la acción
    switch (action) {
        case 'goToStep':
            valueInput.placeholder = 'Nombre del paso';

            // Si hay un flujo seleccionado, ofrecer sus pasos
            if (currentFlows && currentFlows[currentSelectedFlow] && currentFlows[currentSelectedFlow].steps) {
                // Crear un datalist para los pasos
                let datalist = document.getElementById('flowStepsList');
                if (!datalist) {
                    datalist = document.createElement('datalist');
                    datalist.id = 'flowStepsList';
                    document.body.appendChild(datalist);
                }

                // Limpiar datalist
                datalist.innerHTML = '';

                // Añadir pasos como opciones
                currentFlows[currentSelectedFlow].steps.forEach(step => {
                    const option = document.createElement('option');
                    option.value = step;
                    datalist.appendChild(option);
                });

                // Conectar input con datalist
                valueInput.setAttribute('list', 'flowStepsList');
            }
            break;

        case 'goToFlow':
            valueInput.placeholder = 'Nombre del flujo';

            // Ofrecer todos los flujos disponibles
            if (currentFlows) {
                // Crear un datalist para los flujos
                let datalist = document.getElementById('flowNamesList');
                if (!datalist) {
                    datalist = document.createElement('datalist');
                    datalist.id = 'flowNamesList';
                    document.body.appendChild(datalist);
                }

                // Limpiar datalist
                datalist.innerHTML = '';

                // Añadir flujos como opciones
                currentFlows.forEach(flow => {
                    const option = document.createElement('option');
                    option.value = flow.name;
                    datalist.appendChild(option);
                });

                // Conectar input con datalist
                valueInput.setAttribute('list', 'flowNamesList');
            }
            break;

        case 'sendMessage':
            valueInput.placeholder = 'Clave del mensaje';

            // Ofrecer mensajes del flujo actual
            if (currentFlows && currentFlows[currentSelectedFlow] && currentFlows[currentSelectedFlow].messages) {
                // Crear un datalist para los mensajes
                let datalist = document.getElementById('flowMessageKeysList');
                if (!datalist) {
                    datalist = document.createElement('datalist');
                    datalist.id = 'flowMessageKeysList';
                    document.body.appendChild(datalist);
                }

                // Limpiar datalist
                datalist.innerHTML = '';

                // Añadir mensajes como opciones
                Object.keys(currentFlows[currentSelectedFlow].messages).forEach(key => {
                    const option = document.createElement('option');
                    option.value = key;
                    datalist.appendChild(option);
                });

                // Conectar input con datalist
                valueInput.setAttribute('list', 'flowMessageKeysList');
            }
            break;

        case 'sendMedia':
            valueInput.placeholder = 'URL o ID del archivo';
            valueInput.removeAttribute('list');
            break;

        case 'callAPI':
            valueInput.placeholder = 'Endpoint o ID de la API';
            valueInput.removeAttribute('list');
            break;

        default:
            valueInput.placeholder = 'Valor de la acción';
            valueInput.removeAttribute('list');
    }

    // Asegurarse de que el contenedor esté visible
    valueContainer.style.display = 'block';
}

// Añadir event listener para cuando se cambia la acción
function setupActionChangeListener() {
    const actionSelect = document.getElementById('optionAction');
    if (actionSelect) {
        actionSelect.addEventListener('change', showActionValueOptions);
    }
}

// Agregar un nuevo mensaje al flujo actual
function addFlowMessage() {
    if (currentSelectedFlow === null || !currentFlows || !currentFlows[currentSelectedFlow]) {
        showNotification('Selecciona un flujo primero', 'warning');
        return;
    }

    // Mostrar modal para crear mensaje
    let messageKey = prompt('Clave del nuevo mensaje (ej: error_timeout):', '');

    if (!messageKey) return;

    // Validar formato
    messageKey = messageKey.toLowerCase().replace(/\s+/g, '_');

    const flow = currentFlows[currentSelectedFlow];

    // Validar que no exista ya
    if (flow.messages && flow.messages[messageKey]) {
        showNotification('Ya existe un mensaje con esa clave', 'warning');
        return;
    }

    // Contenido inicial
    let messageContent = prompt('Contenido del mensaje:', 'Nuevo mensaje');

    // Añadir el mensaje
    if (!flow.messages) {
        flow.messages = {};
    }

    flow.messages[messageKey] = messageContent || '';

    // Actualizar UI
    loadFlowMessages(flow);

    // Seleccionar el nuevo mensaje
    selectFlowMessage(messageKey);

    showNotification('Mensaje añadido correctamente', 'success');
}

// Eliminar mensaje actual
function deleteCurrentMessage() {
    if (currentSelectedFlow === null || currentFlowMessage === null || !currentFlows || !currentFlows[currentSelectedFlow]) {
        return;
    }

    const flow = currentFlows[currentSelectedFlow];
    if (!flow.messages || !flow.messages[currentFlowMessage]) {
        return;
    }

    // No permitir eliminar mensajes esenciales
    if (currentFlowMessage === 'welcome') {
        showNotification('No se puede eliminar el mensaje de bienvenida', 'warning');
        return;
    }

    if (!confirm(`¿Estás seguro de eliminar el mensaje "${currentFlowMessage}"?`)) {
        return;
    }

    // Eliminar el mensaje
    delete flow.messages[currentFlowMessage];

    // Actualizar UI
    currentFlowMessage = null;
    loadFlowMessages(flow);

    showNotification('Mensaje eliminado', 'success');
}

// Guardar cambios en el mensaje actual
function saveMessageChanges() {
    if (currentSelectedFlow === null || currentFlowMessage === null || !currentFlows || !currentFlows[currentSelectedFlow]) {
        return;
    }

    const flow = currentFlows[currentSelectedFlow];
    if (!flow.messages || !flow.messages[currentFlowMessage]) {
        return;
    }

    const oldKey = currentFlowMessage;
    const newKey = document.getElementById('messageKey').value.trim().toLowerCase().replace(/\s+/g, '_');
    const content = document.getElementById('messageContent').value.trim();

    if (!newKey) {
        showNotification('La clave del mensaje no puede estar vacía', 'warning');
        return;
    }

    if (!content) {
        showNotification('El contenido del mensaje no puede estar vacío', 'warning');
        return;
    }

    // Si cambió la clave, verificar que no exista
    if (oldKey !== newKey && flow.messages[newKey]) {
        showNotification('Ya existe un mensaje con esa clave', 'warning');
        return;
    }

    // Si cambió la clave, eliminar la anterior y crear la nueva
    if (oldKey !== newKey) {
        delete flow.messages[oldKey];
    }

    // Actualizar mensaje
    flow.messages[newKey] = content;

    // Actualizar UI
    currentFlowMessage = newKey;
    loadFlowMessages(flow);
    selectFlowMessage(newKey);

    showNotification('Mensaje actualizado', 'success');
}
const validationTypes = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^[\+]?[1-9][\d]{0,15}$/,
    number: /^\d+$/,
    date: /^\d{2}\/\d{2}\/\d{4}$/,
    time: /^\d{2}:\d{2}$/,
    minLength: (text, min) => text.length >= min,
    maxLength: (text, max) => text.length <= max,
    required: (text) => text.trim().length > 0
};

// Validar entrada del usuario
function validateUserInput(input, validations) {
    for (const validation of validations) {
        if (!validationTypes[validation.type](input, validation.value)) {
            return {
                valid: false,
                message: validation.errorMessage || 'Entrada no válida'
            };
        }
    }
    return { valid: true };
}

// Generar diagrama del flujo
function generateFlowDiagram(flow) {
    const canvas = document.getElementById('flowDiagramCanvas');
    if (!canvas) return;

    // Limpiar canvas
    canvas.innerHTML = '';

    if (!flow || !flow.steps || flow.steps.length === 0) {
        canvas.innerHTML = '<div class="empty-state"><p>No hay pasos para mostrar en el diagrama</p></div>';
        return;
    }

    // Calcular posiciones
    const nodeWidth = 180;
    const nodeHeight = 80;
    const horizontalGap = 50;
    const verticalGap = 100;

    const stepNodes = flow.steps.map((step, index) => {
        return {
            id: `step-${index}`,
            name: step,
            type: step === 'INITIAL' ? 'start' : 'step',
            x: 100,
            y: 100 + index * (nodeHeight + verticalGap)
        };
    });

    // Generar nodos de opciones si es necesario
    const optionNodes = [];
    if (flow.options && flow.options.length > 0) {
        flow.options.forEach((option, index) => {
            optionNodes.push({
                id: `option-${index}`,
                name: option.text,
                type: 'option',
                emoji: option.emoji,
                action: option.action,
                actionValue: option.actionValue,
                x: 400,
                y: 100 + index * (nodeHeight + 30)
            });
        });
    }

    // Crear nodos en el diagrama
    const allNodes = [...stepNodes, ...optionNodes];

    allNodes.forEach(node => {
        const nodeEl = document.createElement('div');
        nodeEl.className = `flow-node ${node.type}`;
        nodeEl.id = node.id;
        nodeEl.style.left = `${node.x}px`;
        nodeEl.style.top = `${node.y}px`;

        // Contenido del nodo según su tipo
        if (node.type === 'start') {
            nodeEl.innerHTML = `
                <h6>
                    <span class="node-type">Inicio</span>
                    <i class="fas fa-grip-horizontal handle"></i>
                </h6>
                <div class="node-content">${node.name}</div>
            `;
        } else if (node.type === 'option') {
            nodeEl.innerHTML = `
                <h6>
                    <span class="node-type">${node.emoji} Opción</span>
                    <i class="fas fa-grip-horizontal handle"></i>
                </h6>
                <div class="node-content">
                    ${node.name}<br>
                    <small>${getActionDescription(node.action)}: ${node.actionValue || '-'}</small>
                </div>
            `;
        } else {
            nodeEl.innerHTML = `
                <h6>
                    <span class="node-type">Paso</span>
                    <i class="fas fa-grip-horizontal handle"></i>
                </h6>
                <div class="node-content">${node.name}</div>
            `;
        }

        // Hacer el nodo arrastrable
        nodeEl.addEventListener('mousedown', startDrag);

        canvas.appendChild(nodeEl);
    });

    // Crear conectores
    createConnectors(flow, stepNodes, optionNodes);
}

// Crear conectores entre nodos
function createConnectors(flow, stepNodes, optionNodes) {
    const canvas = document.getElementById('flowDiagramCanvas');
    if (!canvas) return;

    // Conectar pasos secuenciales
    for (let i = 0; i < stepNodes.length - 1; i++) {
        createConnector(canvas, stepNodes[i].id, stepNodes[i + 1].id);
    }

    // Conectar opciones con sus destinos
    if (flow.options && flow.options.length > 0) {
        flow.options.forEach((option, index) => {
            const sourceId = `option-${index}`;

            if (option.action === 'goToStep' && option.actionValue) {
                // Buscar el nodo de paso correspondiente
                const targetStep = stepNodes.find(node => node.name === option.actionValue);
                if (targetStep) {
                    createConnector(canvas, sourceId, targetStep.id);
                }
            } else if (option.action === 'goToFlow') {
                // Conectar a un indicador de flujo externo
                createExternalFlowIndicator(canvas, sourceId, option.actionValue);
            }
        });
    }

    // Conectar el primer paso con las opciones si es AWAITING_CHOICE
    const awaitingChoiceStep = stepNodes.find(node => node.name === 'AWAITING_CHOICE');
    if (awaitingChoiceStep && optionNodes.length > 0) {
        optionNodes.forEach(option => {
            createConnector(canvas, awaitingChoiceStep.id, option.id);
        });
    }
}

// Crear un conector entre dos nodos
function createConnector(canvas, sourceId, targetId) {
    const sourceNode = document.getElementById(sourceId);
    const targetNode = document.getElementById(targetId);

    if (!sourceNode || !targetNode) return;

    // Obtener posiciones
    const sourceRect = sourceNode.getBoundingClientRect();
    const targetRect = targetNode.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();

    // Ajustar a coordenadas relativas al canvas
    const sourceX = sourceRect.left - canvasRect.left + sourceRect.width / 2 + canvas.scrollLeft;
    const sourceY = sourceRect.top - canvasRect.top + sourceRect.height + canvas.scrollTop;
    const targetX = targetRect.left - canvasRect.left + targetRect.width / 2 + canvas.scrollLeft;
    const targetY = targetRect.top - canvasRect.top + canvas.scrollTop;

    // Crear SVG para el conector
    const connector = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    connector.setAttribute('class', 'flow-connector');
    connector.style.position = 'absolute';
    connector.style.left = '0';
    connector.style.top = '0';
    connector.style.width = '100%';
    connector.style.height = '100%';
    connector.style.pointerEvents = 'none';

    // Crear path
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

    // Calcular puntos de control para curva
    const dx = targetX - sourceX;
    const dy = targetY - sourceY;
    const controlX1 = sourceX;
    const controlY1 = sourceY + dy / 3;
    const controlX2 = targetX;
    const controlY2 = targetY - dy / 3;

    // Definir path
    path.setAttribute('d', `M ${sourceX} ${sourceY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${targetX} ${targetY}`);
    path.setAttribute('stroke', '#6c757d');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('fill', 'none');

    // Añadir flecha al final
    path.setAttribute('marker-end', 'url(#arrow)');

    // Añadir path al conector
    connector.appendChild(path);

    // Definir marcador de flecha si no existe
    if (!document.getElementById('arrow-marker-def')) {
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        defs.id = 'arrow-marker-def';

        const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
        marker.setAttribute('id', 'arrow');
        marker.setAttribute('viewBox', '0 0 10 10');
        marker.setAttribute('refX', '5');
        marker.setAttribute('refY', '5');
        marker.setAttribute('markerWidth', '6');
        marker.setAttribute('markerHeight', '6');
        marker.setAttribute('orient', 'auto-start-reverse');

        const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        arrow.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z');
        arrow.setAttribute('fill', '#6c757d');

        marker.appendChild(arrow);
        defs.appendChild(marker);
        connector.appendChild(defs);
    }

    // Añadir conector al canvas
    canvas.appendChild(connector);
}

// Crear indicador de flujo externo
function createExternalFlowIndicator(canvas, sourceId, flowName) {
    const sourceNode = document.getElementById(sourceId);
    if (!sourceNode) return;

    // Obtener posición
    const sourceRect = sourceNode.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();

    // Ajustar a coordenadas relativas al canvas
    const sourceX = sourceRect.left - canvasRect.left + sourceRect.width + canvas.scrollLeft;
    const sourceY = sourceRect.top - canvasRect.top + sourceRect.height / 2 + canvas.scrollTop;

    // Crear nodo de flujo externo
    const externalNode = document.createElement('div');
    externalNode.className = 'flow-node end';
    externalNode.style.left = `${sourceX + 50}px`;
    externalNode.style.top = `${sourceY - 40}px`;
    externalNode.innerHTML = `
        <h6>
            <span class="node-type">Flujo Externo</span>
            <i class="fas fa-grip-horizontal handle"></i>
        </h6>
        <div class="node-content">${flowName || 'Sin nombre'}</div>
    `;

    // Hacer el nodo arrastrable
    externalNode.addEventListener('mousedown', startDrag);

    // ID único para el nodo externo
    const externalId = `external-${flowName}-${Date.now()}`;
    externalNode.id = externalId;

    canvas.appendChild(externalNode);

    // Crear conector
    createConnector(canvas, sourceId, externalId);
}

// Iniciar arrastre de nodo
function startDrag(e) {
    // Solo permitir arrastre desde el controlador
    if (!e.target.classList.contains('handle') && !e.target.parentElement.classList.contains('handle')) {
        return;
    }

    e.preventDefault();

    // Encontrar el elemento arrastrable (el nodo)
    draggedNode = e.target.closest('.flow-node');

    // Guardar posición inicial
    const rect = draggedNode.getBoundingClientRect();
    dragStartX = e.clientX - rect.left;
    dragStartY = e.clientY - rect.top;

    // Añadir clase de arrastre
    draggedNode.classList.add('dragging');

    // Añadir manejadores de eventos para seguir el movimiento
    document.addEventListener('mousemove', dragNode);
    document.addEventListener('mouseup', stopDrag);

    isDragging = true;
}

// Arrastrar nodo
function dragNode(e) {
    if (!isDragging || !draggedNode) return;

    e.preventDefault();

    // Obtener posición del canvas
    const canvas = document.getElementById('flowDiagramCanvas');
    const canvasRect = canvas.getBoundingClientRect();

    // Calcular nueva posición
    const x = e.clientX - canvasRect.left - dragStartX + canvas.scrollLeft;
    const y = e.clientY - canvasRect.top - dragStartY + canvas.scrollTop;

    // Actualizar posición del nodo
    draggedNode.style.left = `${x}px`;
    draggedNode.style.top = `${y}px`;

    // Actualizar conectores
    updateConnectors();
}

// Detener arrastre
function stopDrag() {
    if (!isDragging || !draggedNode) return;

    // Eliminar clase de arrastre
    draggedNode.classList.remove('dragging');

    // Eliminar manejadores de eventos
    document.removeEventListener('mousemove', dragNode);
    document.removeEventListener('mouseup', stopDrag);

    // Actualizar conectores una última vez
    updateConnectors();

    isDragging = false;
    draggedNode = null;
}

// Actualizar conectores cuando se mueven los nodos
function updateConnectors() {
    const canvas = document.getElementById('flowDiagramCanvas');
    if (!canvas) return;

    // Eliminar conectores actuales
    const connectors = canvas.querySelectorAll('.flow-connector');
    connectors.forEach(connector => connector.remove());

    // Recrear conectores
    if (currentSelectedFlow !== null && currentFlows && currentFlows[currentSelectedFlow]) {
        const flow = currentFlows[currentSelectedFlow];

        // Obtener nodos actuales
        const stepNodes = Array.from(canvas.querySelectorAll('.flow-node')).filter(node =>
            node.id.startsWith('step-')
        ).map(node => {
            const rect = node.getBoundingClientRect();
            const canvasRect = canvas.getBoundingClientRect();
            return {
                id: node.id,
                name: node.querySelector('.node-content').textContent,
                type: node.classList.contains('start') ? 'start' : 'step',
                x: rect.left - canvasRect.left + canvas.scrollLeft,
                y: rect.top - canvasRect.top + canvas.scrollTop
            };
        });

        const optionNodes = Array.from(canvas.querySelectorAll('.flow-node')).filter(node =>
            node.id.startsWith('option-')
        ).map(node => {
            const rect = node.getBoundingClientRect();
            const canvasRect = canvas.getBoundingClientRect();
            const content = node.querySelector('.node-content');
            return {
                id: node.id,
                name: content.childNodes[0].textContent.trim(),
                type: 'option',
                x: rect.left - canvasRect.left + canvas.scrollLeft,
                y: rect.top - canvasRect.top + canvas.scrollTop
            };
        });

        // Recrear conectores
        createConnectors(flow, stepNodes, optionNodes);
    }
}

// Actualizar diagrama de flujo
function refreshFlowDiagram() {
    if (currentSelectedFlow !== null && currentFlows && currentFlows[currentSelectedFlow]) {
        generateFlowDiagram(currentFlows[currentSelectedFlow]);
    }
}

// Zoom en el diagrama
function zoomInFlow() {
    diagramZoom += 0.1;
    applyDiagramZoom();
}

// Zoom out en el diagrama
function zoomOutFlow() {
    if (diagramZoom > 0.5) {
        diagramZoom -= 0.1;
        applyDiagramZoom();
    }
}

// Resetear zoom
function resetFlowZoom() {
    diagramZoom = 1;
    if (currentSelectedFlow !== null && currentFlows && currentFlows[currentSelectedFlow]) {
        generateFlowDiagram(currentFlows[currentSelectedFlow]);
    }
    applyDiagramZoom();
}

// Aplicar zoom al diagrama
function applyDiagramZoom() {
    const canvas = document.getElementById('flowDiagramCanvas');
    if (!canvas) return;

    canvas.style.transform = `scale(${diagramZoom})`;
    canvas.style.transformOrigin = 'top left';
}

// Guardar diagrama como PNG
function saveFlowAsPNG() {
    // Implementación básica, en un entorno real usaríamos html2canvas o similar
    alert('Funcionalidad no implementada: Guardar diagrama como PNG');
}

// Generar código para el flujo actual
function generateFlowCode(flow) {
    if (!flow) return;

    const codeContainer = document.getElementById('flowGeneratedCode');
    if (!codeContainer) return;

    // Crear código JavaScript
    const code = `// Flujo: ${flow.name}
// Generado automáticamente por WhatsApp Bot Manager

/**
 * Gestiona el flujo ${flow.name}
 * @param {Object} client - Cliente de WhatsApp
 * @param {Object} message - Mensaje recibido
 * @param {Object} session - Sesión del usuario
 */
async function handle${sanitizeForFunctionName(flow.name)}(client, message, session) {
    const userId = message.from;
    const step = session.step || 'INITIAL';
    const messageBody = message.body.trim();
    
    console.log(\`[${flow.name}] Procesando mensaje en paso \${step}\`);
    
    try {
        switch (step) {
            case 'INITIAL':
                await show${sanitizeForFunctionName(flow.name)}(client, userId, session);
                break;
                
            case 'AWAITING_CHOICE':
                await handleOptionSelection(client, message, session);
                break;
                
${flow.steps.filter(s => s !== 'INITIAL' && s !== 'AWAITING_CHOICE').map(step => `            case '${step}':
                await handle${sanitizeForFunctionName(step)}(client, message, session);
                break;
`).join('')}
                
            default:
                // Paso desconocido, volver al inicio
                session.step = 'INITIAL';
                await show${sanitizeForFunctionName(flow.name)}(client, userId, session);
                break;
        }
    } catch (error) {
        console.error(\`[${flow.name}] Error: \${error.message}\`);
        // Manejar error
        await client.sendMessage(userId, '❌ Ha ocurrido un error. Por favor, intenta nuevamente.');
        
        // Volver al inicio del flujo
        session.step = 'INITIAL';
        await show${sanitizeForFunctionName(flow.name)}(client, userId, session);
    }
}

/**
 * Muestra el menú inicial del flujo
 * @param {Object} client - Cliente de WhatsApp
 * @param {string} userId - ID del usuario
 * @param {Object} session - Sesión del usuario
 */
async function show${sanitizeForFunctionName(flow.name)}(client, userId, session) {
    // Mensaje de bienvenida
    const welcomeMessage = \`${flow.messages?.welcome || '¡Bienvenido!'}\`;
    
${flow.options && flow.options.length > 0 ? `    // Construir opciones del menú
    let menuOptions = "";
${flow.options.map(option => `    menuOptions += "${option.emoji} ${option.text}\\n";`).join('\n')}
    
    // Enviar mensaje con opciones
    await client.sendMessage(userId, \`\${welcomeMessage}\\n\\n\${menuOptions}\`);` :
            `    // Enviar mensaje de bienvenida
    await client.sendMessage(userId, welcomeMessage);`}
    
    // Actualizar sesión
    session.step = 'AWAITING_CHOICE';
    session.currentFlow = '${flow.name}';
}

/**
 * Maneja la selección de opciones
 * @param {Object} client - Cliente de WhatsApp
 * @param {Object} message - Mensaje recibido
 * @param {Object} session - Sesión del usuario
 */
async function handleOptionSelection(client, message, session) {
    const userId = message.from;
    const messageBody = message.body.trim();
    
${flow.options && flow.options.length > 0 ? `    // Verificar opción seleccionada
    switch (messageBody) {
${flow.options.map((option, index) => {
                // Crear casos para número y texto
                let caseStr = '';
                if (option.number) {
                    caseStr += `        case "${option.number}":\n`;
                }
                // Extracto de emoji para usarlo en el caso
                const emojiMatch = option.emoji && option.emoji.match(/^\d/) ? option.emoji.match(/^\d/)[0] : '';
                if (emojiMatch) {
                    caseStr += `        case "${emojiMatch}":\n`;
                }
                caseStr += `        case "${option.text}":\n`;

                // Acción a realizar
                let actionCode = '';
                switch (option.action) {
                    case 'goToStep':
                        actionCode = `            session.step = '${option.actionValue}';\n            await handle${sanitizeForFunctionName(flow.name)}(client, message, session);`;
                        break;
                    case 'goToFlow':
                        actionCode = `            session.currentFlow = '${option.actionValue}';\n            session.step = 'INITIAL';\n            await handleFlow(client, message, session);`;
                        break;
                    case 'sendMessage':
                        actionCode = `            await sendPredefinedMessage(client, userId, '${option.actionValue}', session);`;
                        break;
                    case 'sendMedia':
                        actionCode = `            await sendMediaMessage(client, userId, '${option.actionValue}', session);`;
                        break;
                    case 'callAPI':
                        actionCode = `            await callExternalAPI(client, userId, '${option.actionValue}', session);`;
                        break;
                    case 'buttons':
                        actionCode = `await sendButtonsMessage(client, userId, '${option.actionValue}', session);`;
                        break;
                    case 'list':
                        actionCode = `await sendListMessage(client, userId, '${option.actionValue}', session);`;
                        break;
                    default:
                        actionCode = `            // Acción no especificada\n            await client.sendMessage(userId, 'Opción seleccionada: ${option.text}');`;

                }

                return caseStr + `${actionCode}\n            break;\n`;
            }).join('\n')}
        default:
            // Opción no reconocida
            await client.sendMessage(userId, '❌ Opción no válida. Por favor, selecciona una opción del menú.');
            await show${sanitizeForFunctionName(flow.name)}(client, userId, session);
            break;
    }` :
            `    // No hay opciones definidas
    await client.sendMessage(userId, 'Por favor, envía un mensaje para continuar.');
    session.step = 'INITIAL';`}
}

${flow.steps.filter(s => s !== 'INITIAL' && s !== 'AWAITING_CHOICE').map(step => `
/**
 * Maneja el paso ${step}
 * @param {Object} client - Cliente de WhatsApp
 * @param {Object} message - Mensaje recibido
 * @param {Object} session - Sesión del usuario
 */
async function handle${sanitizeForFunctionName(step)}(client, message, session) {
    const userId = message.from;
    const messageBody = message.body.trim();
    
    // Mensaje para este paso
    ${flow.messages && flow.messages[step] ?
                    `const stepMessage = \`${flow.messages[step]}\`;\n    await client.sendMessage(userId, stepMessage);` :
                    `// No hay mensaje definido para este paso\n    await client.sendMessage(userId, 'Paso: ${step}');`}
    
    // Lógica específica del paso
    // TODO: Implementar lógica para el paso ${step}
    
    // Volver al menú principal
    session.step = 'INITIAL';
    await show${sanitizeForFunctionName(flow.name)}(client, userId, session);
}
`).join('')}

/**
 * Envía un mensaje predefinido
 * @param {Object} client - Cliente de WhatsApp
 * @param {string} userId - ID del usuario
 * @param {string} messageKey - Clave del mensaje
 * @param {Object} session - Sesión del usuario
 */
async function sendPredefinedMessage(client, userId, messageKey, session) {
    let messageContent = '';
    
    // Obtener mensaje según la clave
    switch (messageKey) {
${Object.entries(flow.messages || {}).filter(([key]) => key !== 'welcome').map(([key, value]) =>
                        `        case '${key}':\n            messageContent = \`${value}\`;\n            break;`
                    ).join('\n')}
        default:
            messageContent = 'Mensaje no encontrado';
            break;
    }
    
    // Enviar mensaje
    await client.sendMessage(userId, messageContent);
    
    // Volver al inicio del flujo
    session.step = 'INITIAL';
    await show${sanitizeForFunctionName(flow.name)}(client, userId, session);
}

// Exportar funciones
module.exports = {
    handle${sanitizeForFunctionName(flow.name)},
    show${sanitizeForFunctionName(flow.name)}
};`;

    codeContainer.textContent = code;

    // Aplicar syntax highlighting si está disponible
    if (typeof hljs !== 'undefined') {
        hljs.highlightElement(codeContainer);
    }
}

// Sanitizar nombre para usar como nombre de función
function sanitizeForFunctionName(name) {
    return name.replace(/[^a-zA-Z0-9]/g, '');
}

// Actualizar código generado
function refreshFlowCode() {
    if (currentSelectedFlow !== null && currentFlows && currentFlows[currentSelectedFlow]) {
        generateFlowCode(currentFlows[currentSelectedFlow]);
    }
}

// Sistema de recordatorios
function scheduleReminder(userId, message, delay) {
    setTimeout(async () => {
        await client.sendMessage(userId, message);
    }, delay);
}

// Disparadores automáticos
function setupFlowTriggers(flow) {
    if (flow.triggers) {
        flow.triggers.forEach(trigger => {
            switch (trigger.type) {
                case 'time':
                    scheduleTimeBasedTrigger(trigger);
                    break;
                case 'event':
                    setupEventTrigger(trigger);
                    break;
                case 'condition':
                    setupConditionalTrigger(trigger);
                    break;
            }
        });
    }
}

// Copiar código generado
function copyFlowCode() {
    const codeElement = document.getElementById('flowGeneratedCode');
    if (!codeElement) return;

    navigator.clipboard.writeText(codeElement.textContent)
        .then(() => {
            showNotification('Código copiado al portapapeles', 'success');
        })
        .catch(err => {
            console.error('Error al copiar código:', err);
            showNotification('Error al copiar código', 'error');
        });
}

// Exportar flujos actuales
function exportAllFlows() {
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

        showNotification('Flujos exportados correctamente', 'success');
    } catch (error) {
        console.error('Error exportando flujos:', error);
        showNotification('Error exportando flujos', 'error');
    }
}

// Importar flujos
function importFlow() {
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

// Mostrar vista previa del flujo
function previewFlow() {
    if (currentSelectedFlow === null || !currentFlows || !currentFlows[currentSelectedFlow]) {
        showNotification('Selecciona un flujo primero', 'warning');
        return;
    }

    const flow = currentFlows[currentSelectedFlow];

    // Mostrar la vista previa
    const previewContainer = document.getElementById('flowPreview');
    if (previewContainer) {
        previewContainer.style.display = 'flex';
    }

    // Actualizar nombre del flujo
    const previewFlowName = document.getElementById('previewFlowName');
    if (previewFlowName) {
        previewFlowName.textContent = flow.name;
    }

    // Actualizar nombre del bot
    const previewBotName = document.getElementById('previewBotName');
    if (previewBotName) {
        previewBotName.textContent = currentFlowBot?.name || 'Bot de WhatsApp';
    }

    // Inicializar vista previa
    previewStep = 'INITIAL';
    previewVariables = {};
    previewMessages = [];

    // Mostrar paso actual
    updatePreviewStep();

    // Mostrar variables
    updatePreviewVariables();

    // Simular mensaje inicial
    simulateBotMessage(flow.messages?.welcome || 'Bienvenido al flujo ' + flow.name);

    // Si hay opciones, mostrarlas
    if (flow.options && flow.options.length > 0) {
        // Pequeña pausa antes de mostrar opciones
        setTimeout(() => {
            let optionsText = '';
            flow.options.forEach(option => {
                optionsText += `${option.emoji} ${option.text}\n`;
            });

            simulateBotMessage(optionsText);

            // Actualizar paso
            previewStep = 'AWAITING_CHOICE';
            updatePreviewStep();
        }, 1000);
    }

    const testScenarios = [
        { name: 'Usuario Nuevo', input: ['1', 'Juan Pérez', 'juan@email.com'] },
        { name: 'Cliente Existente', input: ['2', '12345'] },
        { name: 'Entrada Inválida', input: ['abc', ''] }
    ];

    // Ejecutar escenarios automáticamente
    testScenarios.forEach(scenario => executeTestScenario(scenario));
}

// Simular mensaje del bot
function simulateBotMessage(message) {
    const chatContainer = document.getElementById('previewChat');
    if (!chatContainer) return;

    // Crear elemento de mensaje
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message bot';

    // Contenido del mensaje
    const messageBubble = document.createElement('div');
    messageBubble.className = 'chat-message-bubble';
    messageBubble.innerHTML = message.replace(/\n/g, '<br>');

    // Hora del mensaje
    const messageTime = document.createElement('div');
    messageTime.className = 'chat-message-time';
    messageTime.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Ensamblar mensaje
    messageDiv.appendChild(messageBubble);
    messageDiv.appendChild(messageTime);

    // Añadir a chat
    chatContainer.appendChild(messageDiv);

    // Scroll al final
    chatContainer.scrollTop = chatContainer.scrollHeight;

    // Guardar mensaje en historial
    previewMessages.push({
        type: 'bot',
        content: message,
        time: new Date()
    });
}

// Función para mostrar palabras clave disponibles en la vista previa
function showAvailableKeywords(flow) {
    if (!flow || !flow.messages) return;

    const keywordsContainer = document.getElementById('previewKeywords');
    if (!keywordsContainer) return;

    const excludedKeys = ['welcome']; // Claves a excluir (como mensajes de sistema)
    const keywords = Object.keys(flow.messages).filter(key => !excludedKeys.includes(key));

    if (keywords.length === 0) {
        keywordsContainer.style.display = 'none';
        return;
    }

    let html = '<strong>Palabras clave disponibles:</strong> ';
    html += keywords.map(key => `<span class="preview-keyword" onclick="setPreviewInput('${key}')">${key}</span>`).join(', ');

    keywordsContainer.innerHTML = html;
    keywordsContainer.style.display = 'block';
}

// Función para establecer una palabra clave en el input
function setPreviewInput(keyword) {
    const input = document.getElementById('previewUserInput');
    if (input) {
        input.value = keyword;
        input.focus();
    }
}


// Simular mensaje del usuario
function simulateUserMessage(message) {
    const chatContainer = document.getElementById('previewChat');
    if (!chatContainer) return;

    // Crear elemento de mensaje
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message user';

    // Contenido del mensaje
    const messageBubble = document.createElement('div');
    messageBubble.className = 'chat-message-bubble';
    messageBubble.textContent = message;

    // Hora del mensaje
    const messageTime = document.createElement('div');
    messageTime.className = 'chat-message-time';
    messageTime.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Ensamblar mensaje
    messageDiv.appendChild(messageBubble);
    messageDiv.appendChild(messageTime);

    // Añadir a chat
    chatContainer.appendChild(messageDiv);

    // Scroll al final
    chatContainer.scrollTop = chatContainer.scrollHeight;

    // Guardar mensaje en historial
    previewMessages.push({
        type: 'user',
        content: message,
        time: new Date()
    });
}

// Enviar mensaje en la vista previa
function sendPreviewMessage() {
    if (currentSelectedFlow === null || !currentFlows || !currentFlows[currentSelectedFlow]) {
        return;
    }

    const flow = currentFlows[currentSelectedFlow];
    const input = document.getElementById('previewUserInput');
    if (!input) return;

    const message = input.value.trim();
    if (!message) return;

    // Simular mensaje del usuario
    simulateUserMessage(message);

    // Limpiar input
    input.value = '';

    // Procesar mensaje según el paso actual
    processPreviewChoice(message, flow);
}

// Procesar selección de opción en la vista previa
function processPreviewChoice(message, flow) {
    // Verificar si el mensaje coincide con alguna clave de mensaje en flow.messages
    if (flow.messages && flow.messages[message.toLowerCase()]) {
        // Si existe un mensaje con esa clave, mostrarlo
        simulateBotMessage(flow.messages[message.toLowerCase()]);
        return;
    }

    if (!flow.options || flow.options.length === 0) {
        simulateBotMessage('No hay opciones disponibles en este flujo.');
        return;
    }

    // Buscar opción que coincida con el mensaje
    const option = flow.options.find(opt =>
        opt.text === message ||
        opt.number.toString() === message ||
        (opt.emoji && opt.emoji.match(/^\d/) && opt.emoji.match(/^\d/)[0] === message)
    );

    if (!option) {
        // Opción no válida
        simulateBotMessage('❌ Opción no válida. Por favor, selecciona una opción del menú.');
        return;
    }

    // Procesar según la acción
    switch (option.action) {
        case 'goToStep':
            if (option.actionValue && flow.steps && flow.steps.includes(option.actionValue)) {
                previewStep = option.actionValue;
                updatePreviewStep();

                // Mostrar mensaje del paso si existe
                const stepMessage = flow.messages && flow.messages[option.actionValue];
                if (stepMessage) {
                    setTimeout(() => {
                        simulateBotMessage(stepMessage);
                    }, 1000);
                }
            } else {
                simulateBotMessage(`Ir al paso: ${option.actionValue || 'No especificado'}`);
            }
            break;

        case 'goToFlow':
            simulateBotMessage(`Redirigiendo al flujo: ${option.actionValue || 'No especificado'}`);
            previewStep = 'EXTERNAL_FLOW';
            updatePreviewStep();
            break;

        case 'sendMessage':
            const messageKey = option.actionValue;
            const messageContent = flow.messages && flow.messages[messageKey];

            setTimeout(() => {
                simulateBotMessage(messageContent || `Mensaje: ${messageKey || 'No especificado'}`);
            }, 1000);
            break;

        case 'sendMedia':
            simulateBotMessage(`[Imagen/Archivo: ${option.actionValue || 'No especificado'}]`);
            break;

        case 'callAPI':
            simulateBotMessage(`[Llamada a API: ${option.actionValue || 'No especificado'}]`);
            // Simular respuesta de API
            setTimeout(() => {
                simulateBotMessage('✅ Datos procesados correctamente.');
            }, 1500);
            break;

        default:
            simulateBotMessage(`Acción seleccionada: ${option.text}`);
            break;
    }
}

// Actualizar paso actual en la vista previa
function updatePreviewStep() {
    const stepElement = document.getElementById('previewCurrentStep');
    if (stepElement) {
        stepElement.textContent = previewStep;
    }
}

// Actualizar variables en la vista previa
function updatePreviewVariables() {
    const variablesContainer = document.getElementById('previewVariables');
    if (!variablesContainer) return;

    // Añadir variables por defecto
    previewVariables = {
        currentFlow: currentFlows[currentSelectedFlow]?.name || '',
        step: previewStep,
        lastMessage: previewMessages.length > 0 ? previewMessages[previewMessages.length - 1].content : '',
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString()
    };

    // Generar HTML
    let html = '';

    Object.entries(previewVariables).forEach(([key, value]) => {
        html += `
            <div class="variable-item">
                <span class="variable-name">${key}:</span>
                <span class="variable-value">${value}</span>
            </div>
        `;
    });

    variablesContainer.innerHTML = html;
}

// Gestión de variables del usuario
function setUserVariable(userId, key, value) {
    if (!userVariables[userId]) userVariables[userId] = {};
    userVariables[userId][key] = value;
}

function getUserVariable(userId, key) {
    return userVariables[userId]?.[key] || null;
}

// Reemplazar variables en mensajes: {{nombreUsuario}}, {{fecha}}, etc.
function replaceVariables(message, userContext) {
    return message.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
        return userContext[variable] || match;
    });
}

// Cerrar vista previa
function closePreview() {
    const previewContainer = document.getElementById('flowPreview');
    if (previewContainer) {
        previewContainer.style.display = 'none';
    }
}

// Resetear vista previa
function resetPreview() {
    // Limpiar chat
    const chatContainer = document.getElementById('previewChat');
    if (chatContainer) {
        chatContainer.innerHTML = '';
    }

    // Reiniciar estado
    previewStep = 'INITIAL';
    previewVariables = {};
    previewMessages = [];

    // Actualizar UI
    updatePreviewStep();
    updatePreviewVariables();

    // Reiniciar simulación
    previewFlow();
}

// Aplicar plantilla de flujo
function applyFlowTemplate(templateName) {
    if (!currentFlowBot) {
        showNotification('Selecciona un bot primero', 'warning');
        return;
    }

    const template = flowTemplates[templateName];
    if (!template) {
        showNotification('Plantilla no encontrada', 'error');
        return;
    }

    // Confirmar aplicación
    if (!confirm(`¿Aplicar plantilla "${template.name}"? Esto creará un nuevo flujo basado en la plantilla.`)) {
        return;
    }

    // Crear copia de la plantilla
    const newFlow = JSON.parse(JSON.stringify(template));

    // Añadir a la lista
    currentFlows.push(newFlow);

    // Seleccionar el nuevo flujo
    currentSelectedFlow = currentFlows.length - 1;

    // Actualizar UI
    renderFlowsList();
    showFlowEditor();
    loadFlowToEditor(newFlow);

    showNotification(`Plantilla "${template.name}" aplicada correctamente`, 'success');

    // Guardar cambios
    saveFlowChanges();
}

// Filtrar flujos por término de búsqueda
function filterFlows(searchTerm) {
    const container = document.getElementById('flowsListContainer');
    if (!container) return;

    // Si no hay término de búsqueda, mostrar todos
    if (!searchTerm) {
        renderFlowsList();
        return;
    }

    // Filtrar flujos
    const filteredFlows = currentFlows.filter(flow =>
        flow.name.toLowerCase().includes(searchTerm) ||
        (flow.description && flow.description.toLowerCase().includes(searchTerm))
    );

    // Si no hay resultados
    if (filteredFlows.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <p>No se encontraron flujos con "${searchTerm}"</p>
            </div>
        `;
        return;
    }

    // Generar HTML
    let html = '';

    filteredFlows.forEach(flow => {
        // Encontrar el índice original
        const originalIndex = currentFlows.findIndex(f => f.name === flow.name);
        const isActive = originalIndex === currentSelectedFlow;

        html += `
            <div class="flow-item ${isActive ? 'active' : ''}" onclick="selectFlow(${originalIndex})">
                <h5>
                    <span><i class="fas fa-project-diagram"></i> ${flow.name}</span>
                    <div class="flow-actions">
                        <span class="status-indicator ${flow.active !== false ? 'status-enabled' : 'status-disabled'}" style="font-size: 10px;">
                            <span class="status-dot"></span> ${flow.active !== false ? 'Activo' : 'Desactivado'}
                        </span>
                    </div>
                </h5>
                <p>${flow.description || 'Sin descripción'}</p>
                <div class="flow-details">
                    <span><i class="fas fa-code-branch"></i> ${flow.steps?.length || 0} pasos</span>
                    <span><i class="fas fa-list"></i> ${flow.options?.length || 0} opciones</span>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// Inicializar eventos de diagrama
function initDiagramEvents() {
    // Los eventos de arrastre se manejan en las funciones startDrag, dragNode y stopDrag

    // Añadir listeners para zoom con rueda del ratón
    const diagramContainer = document.getElementById('flowDiagramCanvas');
    if (diagramContainer) {
        diagramContainer.addEventListener('wheel', (e) => {
            if (e.ctrlKey) {
                e.preventDefault();
                if (e.deltaY < 0) {
                    zoomInFlow();
                } else {
                    zoomOutFlow();
                }
            }
        });
    }
}

// Cambiar tipo de mensaje y mostrar campos específicos
// Actualizar la función changeMessageType para incluir template
function changeMessageType() {
    const messageType = document.getElementById('messageType').value;
    const fieldsContainer = document.getElementById('messageTypeFields');

    if (!fieldsContainer) return;

    let fieldsHTML = '';

    switch (messageType) {
        case 'image':
        case 'video':
        case 'audio':
        case 'document':
            fieldsHTML = `
                <div class="media-field">
                    <div class="media-field-header">
                        <i class="fas fa-${messageType === 'image' ? 'image' : messageType === 'video' ? 'video' : messageType === 'audio' ? 'music' : 'file-alt'}"></i>
                        <span>Configuración de ${messageType === 'image' ? 'Imagen' : messageType === 'video' ? 'Video' : messageType === 'audio' ? 'Audio' : 'Documento'}</span>
                    </div>
                    <div class="form-group">
                        <label>URL del Archivo <span class="required">*</span></label>
                        <input type="url" class="form-control" id="mediaUrl" 
                               placeholder="https://ejemplo.com/archivo.${messageType === 'image' ? 'jpg' : messageType === 'video' ? 'mp4' : messageType === 'audio' ? 'mp3' : 'pdf'}">
                        <div class="format-hint">Formatos soportados: ${messageType === 'image' ? 'JPG, PNG, GIF, WEBP' : messageType === 'video' ? 'MP4, MOV, AVI, 3GP' : messageType === 'audio' ? 'MP3, OGG, M4A, AAC' : 'PDF, DOCX, XLSX, TXT, CSV'}</div>
                    </div>
                    <div class="form-group">
                        <label>Texto Alternativo</label>
                        <input type="text" class="form-control" id="mediaCaption" 
                               placeholder="Descripción del archivo">
                    </div>
                </div>
            `;
            break;

        case 'location':
            fieldsHTML = `
                <div class="media-field">
                    <div class="media-field-header">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>Configuración de Ubicación</span>
                    </div>
                    <div class="form-row">
                        <div class="form-group col-md-6">
                            <label>Latitud <span class="required">*</span></label>
                            <input type="number" class="form-control" id="locationLat" 
                                   step="any" placeholder="-90 a 90">
                        </div>
                        <div class="form-group col-md-6">
                            <label>Longitud <span class="required">*</span></label>
                            <input type="number" class="form-control" id="locationLng" 
                                   step="any" placeholder="-180 a 180">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Nombre del Lugar</label>
                        <input type="text" class="form-control" id="locationName" 
                               placeholder="Nombre del lugar">
                    </div>
                    <div class="format-hint">
                        <i class="fas fa-lightbulb"></i> Tip: Puedes obtener las coordenadas desde Google Maps haciendo clic derecho en un lugar y seleccionando "¿Qué hay aquí?"
                    </div>
                </div>
            `;
            break;

        case 'contact':
            fieldsHTML = `
                <div class="media-field">
                    <div class="media-field-header">
                        <i class="fas fa-address-card"></i>
                        <span>Configuración de Contacto</span>
                    </div>
                    <div class="form-row">
                        <div class="form-group col-md-6">
                            <label>Nombre <span class="required">*</span></label>
                            <input type="text" class="form-control" id="contactName" 
                                   placeholder="Nombre del contacto">
                        </div>
                        <div class="form-group col-md-6">
                            <label>Teléfono <span class="required">*</span></label>
                            <input type="tel" class="form-control" id="contactPhone" 
                                   placeholder="+52 999 999 9999">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Empresa</label>
                        <input type="text" class="form-control" id="contactCompany" 
                               placeholder="Nombre de la empresa">
                    </div>
                </div>
            `;
            break;

        case 'buttons':
            fieldsHTML = `
                <div class="media-field">
                    <div class="media-field-header">
                        <i class="fas fa-hand-pointer"></i>
                        <span>Botones Interactivos</span>
                    </div>
                    <div class="form-group">
                        <label>Título de los Botones</label>
                        <input type="text" class="form-control" id="buttonsTitle" 
                               placeholder="Selecciona una opción">
                    </div>
                    <div class="message-buttons" id="messageButtons">
                        <div class="button-item">
                            <div class="input-group mb-2">
                                <input type="text" class="form-control" placeholder="Texto del botón 1">
                                <div class="input-group-append">
                                    <button class="btn btn-outline-danger" type="button" onclick="this.closest('.button-item').remove(); updateMessagePreview();">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="button-item">
                            <div class="input-group mb-2">
                                <input type="text" class="form-control" placeholder="Texto del botón 2">
                                <div class="input-group-append">
                                    <button class="btn btn-outline-danger" type="button" onclick="this.closest('.button-item').remove(); updateMessagePreview();">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <button type="button" class="btn btn-sm btn-outline-primary mt-2" onclick="addMessageButton()">
                        <i class="fas fa-plus"></i> Agregar Botón
                    </button>
                    <div class="format-hint mt-2">
                        <i class="fas fa-info-circle"></i> WhatsApp permite máximo 3 botones por mensaje
                    </div>
                </div>
            `;
            break;

        case 'list':
            fieldsHTML = `
                <div class="media-field">
                    <div class="media-field-header">
                        <i class="fas fa-list-ul"></i>
                        <span>Lista de Opciones</span>
                    </div>
                    <div class="form-group">
                        <label>Título de la Lista</label>
                        <input type="text" class="form-control" id="listTitle" 
                               placeholder="Selecciona una opción">
                    </div>
                    <div class="form-group">
                        <label>Texto del Botón</label>
                        <input type="text" class="form-control" id="listButtonText" 
                               placeholder="Ver opciones">
                    </div>
                    <div class="form-group">
                        <label>Opciones de la Lista</label>
                        <div class="list-options" id="listOptions">
                            <div class="option-item">
                                <div class="input-group mb-2">
                                    <input type="text" class="form-control" placeholder="Opción 1">
                                    <div class="input-group-append">
                                        <button class="btn btn-outline-danger" type="button" onclick="this.closest('.option-item').remove(); updateMessagePreview();">
                                            <i class="fas fa-times"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div class="option-item">
                                <div class="input-group mb-2">
                                    <input type="text" class="form-control" placeholder="Opción 2">
                                    <div class="input-group-append">
                                        <button class="btn btn-outline-danger" type="button" onclick="this.closest('.option-item').remove(); updateMessagePreview();">
                                            <i class="fas fa-times"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button type="button" class="btn btn-sm btn-outline-primary mt-2" onclick="addListOption()">
                            <i class="fas fa-plus"></i> Agregar Opción
                        </button>
                        <div class="format-hint mt-2">
                            <i class="fas fa-info-circle"></i> WhatsApp permite entre 1 y 10 opciones en una lista
                        </div>
                    </div>
                </div>
            `;
            break;

        case 'template':
            fieldsHTML = handleTemplateFields();
            break;
    }

    fieldsContainer.innerHTML = fieldsHTML;

    // Actualizar vista previa
    updateMessagePreview();
}

// Añadir botón a mensaje con botones
function addMessageButton() {
    const buttonsContainer = document.getElementById('messageButtons');
    if (!buttonsContainer) return;

    const buttonCount = buttonsContainer.children.length;

    if (buttonCount >= 3) {
        showNotification('WhatsApp permite máximo 3 botones por mensaje', 'warning');
        return;
    }

    const buttonItem = document.createElement('div');
    buttonItem.className = 'button-item';
    buttonItem.innerHTML = `
        <div class="input-group mb-2">
            <input type="text" class="form-control" placeholder="Texto del botón ${buttonCount + 1}">
            <div class="input-group-append">
                <button class="btn btn-outline-danger" type="button" onclick="this.closest('.button-item').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    `;

    buttonsContainer.appendChild(buttonItem);

    // Actualizar vista previa
    updateMessagePreview();
}

// Añadir opción a lista
function addListOption() {
    const optionsContainer = document.getElementById('listOptions');
    if (!optionsContainer) return;

    const optionCount = optionsContainer.children.length;

    const optionItem = document.createElement('div');
    optionItem.className = 'option-item';
    optionItem.innerHTML = `
        <div class="input-group mb-2">
            <input type="text" class="form-control" placeholder="Opción ${optionCount + 1}">
            <div class="input-group-append">
                <button class="btn btn-outline-danger" type="button" onclick="this.closest('.option-item').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    `;

    optionsContainer.appendChild(optionItem);

    // Actualizar vista previa
    updateMessagePreview();
}

// Insertar variable en el cursor
function insertVariable() {
    const textarea = document.getElementById('messageContent');
    const variable = prompt('Nombre de la variable (sin {{}}):');

    if (variable) {
        insertText(`{{${variable}}}`);
    }
}

// Insertar texto en la posición del cursor
function insertText(text) {
    const textarea = document.getElementById('messageContent');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentValue = textarea.value;

    textarea.value = currentValue.substring(0, start) + text + currentValue.substring(end);
    textarea.focus();
    textarea.setSelectionRange(start + text.length, start + text.length);

    updateCharCounter();
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
            previewHTML = content.replace(/\n/g, '<br>').replace(/\{\{(\w+)\}\}/g, '<span class="variable">$1</span>');
            break;
        case 'image':
            previewHTML = `<div class="media-preview">🖼️ Imagen</div>${content}`;
            break;
        case 'video':
            previewHTML = `<div class="media-preview">🎥 Video</div>${content}`;
            break;
        // ... más tipos
        default:
            previewHTML = content;
    }

    preview.innerHTML = previewHTML;

    // Mostrar preview
    document.getElementById('messagePreview').style.display = 'block';
}

// Variables globales para gestión de APIs
let currentFlowApi = null;

// Cargar APIs del flujo actual
function loadFlowApis(flow) {
    const apisList = document.getElementById('flowApisList');
    if (!apisList) return;

    // Inicializar el array de APIs si no existe
    if (!flow.apis) {
        flow.apis = [];
    }

    if (flow.apis.length === 0) {
        apisList.innerHTML = `
            <div class="empty-state">
                <p>No hay APIs configuradas para este flujo</p>
            </div>
        `;
        return;
    }

    let html = '';

    // Generar HTML para cada API
    flow.apis.forEach((api, index) => {
        const isActive = index === currentFlowApi;

        html += `
            <div class="flow-api-item ${isActive ? 'active' : ''}" onclick="selectFlowApi(${index})">
                <h6>
                    <span class="api-method ${api.method.toLowerCase()}">${api.method}</span>
                    ${api.name || 'API sin nombre'}
                </h6>
                <p class="api-url">${api.url || ''}</p>
                <div class="api-details">
                    <span><i class="fas fa-plug"></i> ${getTriggerDescription(api.trigger)}</span>
                    <span><i class="fas fa-key"></i> ${getAuthDescription(api.auth?.type)}</span>
                </div>
            </div>
        `;
    });

    apisList.innerHTML = html;
}

// Obtener descripción del disparador de la API
function getTriggerDescription(trigger) {
    switch (trigger) {
        case 'manual': return 'Manual';
        case 'step': return 'Al entrar al paso';
        case 'keyword': return 'Por palabra clave';
        case 'variable': return 'Al cambiar variable';
        default: return 'Manual';
    }
}

// Obtener descripción del tipo de autenticación
function getAuthDescription(authType) {
    switch (authType) {
        case 'basic': return 'Basic Auth';
        case 'bearer': return 'Bearer Token';
        case 'apikey': return 'API Key';
        default: return 'Sin auth';
    }
}

// Añadir una nueva API al flujo actual
function addFlowApi() {
    if (currentSelectedFlow === null || !currentFlows || !currentFlows[currentSelectedFlow]) {
        showNotification('Selecciona un flujo primero', 'warning');
        return;
    }

    const flow = currentFlows[currentSelectedFlow];

    // Crear una nueva API con valores por defecto
    const newApi = {
        name: `api_${flow.apis ? flow.apis.length + 1 : 1}`,
        method: 'GET',
        url: '',
        headers: [
            { key: 'Content-Type', value: 'application/json' }
        ],
        auth: {
            type: 'none'
        },
        body: '',
        responseMapping: [
            { variable: 'resultado', path: 'data' }
        ],
        trigger: 'manual',
        triggerValue: ''
    };

    // Añadir la API al flujo
    if (!flow.apis) {
        flow.apis = [];
    }

    flow.apis.push(newApi);

    // Actualizar UI
    loadFlowApis(flow);

    // Seleccionar la nueva API y abrir el modal
    currentFlowApi = flow.apis.length - 1;
    openApiEditModal();

    showNotification('Nueva API añadida', 'success');
}

// Seleccionar una API para editar
function selectFlowApi(index) {
    if (currentSelectedFlow === null || !currentFlows || !currentFlows[currentSelectedFlow]) return;

    const flow = currentFlows[currentSelectedFlow];
    if (!flow.apis || index < 0 || index >= flow.apis.length) return;

    currentFlowApi = index;
    currentFlowStep = null;
    currentFlowOption = null;
    currentFlowMessage = null;

    // Actualizar UI
    loadFlowApis(flow);

    // Abrir modal para editar la API
    openApiEditModal();
}

// Abrir modal para editar API
function openApiEditModal() {
    if (currentSelectedFlow === null || currentFlowApi === null ||
        !currentFlows || !currentFlows[currentSelectedFlow] ||
        !currentFlows[currentSelectedFlow].apis ||
        !currentFlows[currentSelectedFlow].apis[currentFlowApi]) {
        return;
    }

    const modal = document.getElementById('apiEditModal');
    if (modal) {
        modal.style.display = 'flex';
    }

    // Cargar datos de la API en el modal
    loadApiDataToModal();
}

// Cargar datos de la API en el modal
function loadApiDataToModal() {
    const flow = currentFlows[currentSelectedFlow];
    const api = flow.apis[currentFlowApi];

    // Título del modal
    const currentApiNameEl = document.getElementById('currentApiName');
    if (currentApiNameEl) {
        currentApiNameEl.textContent = api.name || 'Nueva API';
    }

    // Campos básicos
    document.getElementById('apiName').value = api.name || '';
    document.getElementById('apiMethod').value = api.method || 'GET';
    document.getElementById('apiUrl').value = api.url || '';
    document.getElementById('apiAuth').value = api.auth?.type || 'none';
    document.getElementById('apiTrigger').value = api.trigger || 'manual';

    // Mostrar/ocultar body según método
    toggleBodyField();

    // Cargar body si existe
    const apiBodyEl = document.getElementById('apiBody');
    if (apiBodyEl && api.body) {
        apiBodyEl.value = typeof api.body === 'string' ? api.body : JSON.stringify(api.body, null, 2);
    }

    // Cargar headers
    loadHeadersToModal(api.headers);

    // Campos de autenticación
    toggleAuthFields();
    loadAuthDataToModal(api.auth);

    // Cargar mapeo de respuesta
    loadResponseMappingToModal(api.responseMapping);

    // Cargar valor del disparador
    loadTriggerValueToModal(api.trigger, api.triggerValue);
}

// Alternar visibilidad del campo de body según método
function toggleBodyField() {
    const method = document.getElementById('apiMethod').value;
    const bodyContainer = document.getElementById('apiBodyContainer');

    if (bodyContainer) {
        bodyContainer.style.display = (method === 'POST' || method === 'PUT') ? 'block' : 'none';
    }
}

// Cargar headers al modal
function loadHeadersToModal(headers) {
    const container = document.getElementById('apiHeadersContainer');
    if (!container) return;

    // Limpiar contenedor
    container.innerHTML = '';

    // Si no hay headers, añadir uno vacío
    if (!headers || headers.length === 0) {
        addHeaderRow();
        return;
    }

    // Añadir cada header
    headers.forEach(header => {
        addHeaderRow(header.key, header.value);
    });
}

// Añadir fila de header
function addHeaderRow(key = '', value = '') {
    const container = document.getElementById('apiHeadersContainer');
    if (!container) return;

    const row = document.createElement('div');
    row.className = 'header-row';
    row.innerHTML = `
        <div class="input-group mb-2">
            <input type="text" class="form-control header-key" placeholder="Content-Type" value="${key}">
            <input type="text" class="form-control header-value" placeholder="application/json" value="${value}">
            <div class="input-group-append">
                <button class="btn btn-outline-danger" type="button" onclick="removeHeaderRow(this)">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    `;

    container.appendChild(row);
}

// Eliminar fila de header
function removeHeaderRow(button) {
    const row = button.closest('.header-row');
    if (row) {
        row.remove();
    }
}

// Alternar campos de autenticación
function toggleAuthFields() {
    const authType = document.getElementById('apiAuth').value;
    const container = document.getElementById('authFieldsContainer');

    if (!container) return;

    // Limpiar contenedor
    container.innerHTML = '';

    // Mostrar campos según tipo de autenticación
    switch (authType) {
        case 'none':
            container.style.display = 'none';
            break;
        case 'basic':
            container.style.display = 'block';
            container.innerHTML = `
                <div class="form-row">
                    <div class="form-group col-md-6">
                        <label>Usuario</label>
                        <input type="text" class="form-control" id="authUser" placeholder="Usuario">
                    </div>
                    <div class="form-group col-md-6">
                        <label>Contraseña</label>
                        <input type="password" class="form-control" id="authPassword" placeholder="Contraseña">
                    </div>
                </div>
            `;
            break;
        case 'bearer':
            container.style.display = 'block';
            container.innerHTML = `
                <div class="form-group">
                    <label>Token</label>
                    <input type="text" class="form-control" id="authToken" placeholder="Bearer token">
                </div>
            `;
            break;
        case 'apikey':
            container.style.display = 'block';
            container.innerHTML = `
                <div class="form-row">
                    <div class="form-group col-md-5">
                        <label>Nombre de la clave</label>
                        <input type="text" class="form-control" id="authKeyName" placeholder="API-Key o X-API-Key">
                    </div>
                    <div class="form-group col-md-5">
                        <label>Valor</label>
                        <input type="text" class="form-control" id="authKeyValue" placeholder="Tu API key">
                    </div>
                    <div class="form-group col-md-2">
                        <label>En</label>
                        <select class="form-control" id="authKeyIn">
                            <option value="header">Header</option>
                            <option value="query">Query</option>
                        </select>
                    </div>
                </div>
            `;
            break;
    }
}

// Cargar datos de autenticación al modal
function loadAuthDataToModal(auth) {
    if (!auth) return;

    switch (auth.type) {
        case 'basic':
            const userEl = document.getElementById('authUser');
            const passEl = document.getElementById('authPassword');
            if (userEl) userEl.value = auth.username || '';
            if (passEl) passEl.value = auth.password || '';
            break;
        case 'bearer':
            const tokenEl = document.getElementById('authToken');
            if (tokenEl) tokenEl.value = auth.token || '';
            break;
        case 'apikey':
            const keyNameEl = document.getElementById('authKeyName');
            const keyValueEl = document.getElementById('authKeyValue');
            const keyInEl = document.getElementById('authKeyIn');
            if (keyNameEl) keyNameEl.value = auth.keyName || '';
            if (keyValueEl) keyValueEl.value = auth.keyValue || '';
            if (keyInEl) keyInEl.value = auth.in || 'header';
            break;
    }
}

// Cargar mapeo de respuesta al modal
function loadResponseMappingToModal(mapping) {
    const container = document.querySelector('.response-mapping');
    if (!container) return;

    // Limpiar contenedor excepto el último botón
    const button = container.querySelector('button');
    container.innerHTML = '';

    // Si no hay mapeo, añadir uno por defecto
    if (!mapping || mapping.length === 0) {
        const row = document.createElement('div');
        row.className = 'form-row mb-2';
        row.innerHTML = `
            <div class="col-5">
                <input type="text" class="form-control" placeholder="Variable destino" value="resultado">
            </div>
            <div class="col-7">
                <input type="text" class="form-control" placeholder="Camino en JSON (ej: data.items[0].name)" value="data">
            </div>
        `;
        container.appendChild(row);
    } else {
        // Añadir cada mapeo
        mapping.forEach(map => {
            const row = document.createElement('div');
            row.className = 'form-row mb-2';
            row.innerHTML = `
                <div class="col-5">
                    <input type="text" class="form-control" placeholder="Variable destino" value="${map.variable || ''}">
                </div>
                <div class="col-7">
                    <input type="text" class="form-control" placeholder="Camino en JSON (ej: data.items[0].name)" value="${map.path || ''}">
                </div>
            `;
            container.appendChild(row);
        });
    }

    // Volver a añadir el botón
    container.appendChild(button);
}

// Añadir mapeo de respuesta
function addResponseMapping() {
    const container = document.querySelector('.response-mapping');
    if (!container) return;

    const button = container.querySelector('button');

    const row = document.createElement('div');
    row.className = 'form-row mb-2';
    row.innerHTML = `
        <div class="col-5">
            <input type="text" class="form-control" placeholder="Variable destino">
        </div>
        <div class="col-7">
            <input type="text" class="form-control" placeholder="Camino en JSON (ej: data.items[0].name)">
        </div>
    `;

    // Insertar antes del botón
    container.insertBefore(row, button);
}

// Cargar valor del disparador según su tipo
function loadTriggerValueToModal(trigger, value) {
    const container = document.getElementById('apiTriggerValueContainer');
    if (!container) return;

    // Limpiar contenedor
    container.innerHTML = '';

    switch (trigger) {
        case 'manual':
            container.style.display = 'none';
            break;

        case 'step':
            container.style.display = 'block';
            container.innerHTML = `
                <label>Paso que dispara la API</label>
                <select class="form-control" id="apiTriggerValue">
                    <option value="">Selecciona un paso</option>
                </select>
            `;

            // Cargar pasos disponibles
            const selectEl = document.getElementById('apiTriggerValue');
            if (selectEl && currentFlows && currentFlows[currentSelectedFlow] && currentFlows[currentSelectedFlow].steps) {
                currentFlows[currentSelectedFlow].steps.forEach(step => {
                    const option = document.createElement('option');
                    option.value = step;
                    option.textContent = step;
                    selectEl.appendChild(option);
                });

                // Seleccionar valor guardado
                if (value) selectEl.value = value;
            }
            break;

        case 'keyword':
            container.style.display = 'block';
            container.innerHTML = `
                <label>Palabra clave que dispara la API</label>
                <input type="text" class="form-control" id="apiTriggerValue" placeholder="Ej: consultar, estado, ayuda" value="${value || ''}">
            `;
            break;

        case 'variable':
            container.style.display = 'block';
            container.innerHTML = `
                <label>Variable que dispara la API cuando cambia</label>
                <input type="text" class="form-control" id="apiTriggerValue" placeholder="Ej: nombre, telefono" value="${value || ''}">
            `;
            break;
    }
}

// Cerrar modal de edición de API
function closeApiEditModal() {
    const modal = document.getElementById('apiEditModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Guardar cambios en la API actual
async function saveApiChanges() {
    if (currentSelectedFlow === null || currentFlowApi === null ||
        !currentFlows || !currentFlows[currentSelectedFlow]) {
        showNotification('No hay API seleccionada para guardar', 'warning');
        return;
    }

    // Recopilar datos del formulario
    const name = document.getElementById('apiName').value.trim();
    const method = document.getElementById('apiMethod').value;
    const url = document.getElementById('apiUrl').value.trim();
    const authType = document.getElementById('apiAuth').value;
    const trigger = document.getElementById('apiTrigger').value;

    // Validaciones
    if (!name) {
        showNotification('El nombre de la API no puede estar vacío', 'warning');
        return;
    }

    if (!url) {
        showNotification('La URL de la API no puede estar vacía', 'warning');
        return;
    }

    // Obtener datos de autenticación
    const auth = {
        type: authType
    };

    switch (authType) {
        case 'basic':
            auth.username = document.getElementById('authUser')?.value || '';
            auth.password = document.getElementById('authPassword')?.value || '';
            break;
        case 'bearer':
            auth.token = document.getElementById('authToken')?.value || '';
            break;
        case 'apikey':
            auth.keyName = document.getElementById('authKeyName')?.value || '';
            auth.keyValue = document.getElementById('authKeyValue')?.value || '';
            auth.in = document.getElementById('authKeyIn')?.value || 'header';
            break;
    }

    // Obtener headers
    const headers = [];
    document.querySelectorAll('.header-row').forEach(row => {
        const keyInput = row.querySelector('.header-key');
        const valueInput = row.querySelector('.header-value');

        if (keyInput && valueInput && keyInput.value.trim()) {
            headers.push({
                key: keyInput.value.trim(),
                value: valueInput.value.trim()
            });
        }
    });

    // Obtener body para POST/PUT
    let body = '';
    if (method === 'POST' || method === 'PUT') {
        body = document.getElementById('apiBody')?.value || '';
    }

    // Obtener mapeo de respuesta
    const responseMapping = [];
    document.querySelectorAll('.response-mapping .form-row').forEach(row => {
        const variableInput = row.querySelector('.col-5 input');
        const pathInput = row.querySelector('.col-7 input');

        if (variableInput && pathInput && variableInput.value.trim()) {
            responseMapping.push({
                variable: variableInput.value.trim(),
                path: pathInput.value.trim()
            });
        }
    });

    // Obtener valor del disparador
    const triggerValueEl = document.getElementById('apiTriggerValue');
    const triggerValue = triggerValueEl ? triggerValueEl.value : '';

    // Crear objeto de API
    const apiData = {
        name,
        method,
        url,
        headers,
        auth,
        body,
        responseMapping,
        trigger,
        triggerValue
    };

    // Actualizar la API en el flujo
    const flow = currentFlows[currentSelectedFlow];
    flow.apis[currentFlowApi] = apiData;

    // Guardar cambios
    try {
        await saveAllFlowsToServer();

        // Actualizar UI
        loadFlowApis(flow);

        // Cerrar modal
        closeApiEditModal();

        showNotification('API guardada exitosamente', 'success');
    } catch (error) {
        console.error('Error guardando API:', error);
        showNotification('Error guardando API: ' + error.message, 'error');
    }
}

// Eliminar API actual
async function deleteCurrentApi() {
    if (currentSelectedFlow === null || currentFlowApi === null ||
        !currentFlows || !currentFlows[currentSelectedFlow] ||
        !currentFlows[currentSelectedFlow].apis) {
        showNotification('No hay API seleccionada para eliminar', 'warning');
        return;
    }

    const flow = currentFlows[currentSelectedFlow];
    const api = flow.apis[currentFlowApi];

    if (!confirm(`¿Estás seguro de eliminar la API "${api.name}"? Esta acción no se puede deshacer.`)) {
        return;
    }

    // Eliminar la API
    flow.apis.splice(currentFlowApi, 1);

    // Actualizar UI
    currentFlowApi = null;
    loadFlowApis(flow);

    // Cerrar modal
    closeApiEditModal();

    // Guardar cambios
    try {
        await saveAllFlowsToServer();
        showNotification('API eliminada exitosamente', 'success');
    } catch (error) {
        console.error('Error eliminando API:', error);
        showNotification('Error eliminando API: ' + error.message, 'error');
    }
}

// Probar API
async function testApi() {
    // Recopilar datos del formulario temporalmente sin guardar
    const name = document.getElementById('apiName').value.trim();
    const method = document.getElementById('apiMethod').value;
    const url = document.getElementById('apiUrl').value.trim();
    const authType = document.getElementById('apiAuth').value;

    // Validaciones básicas
    if (!url) {
        showNotification('La URL de la API no puede estar vacía', 'warning');
        return;
    }

    // Mostrar indicador de carga
    const testResult = document.getElementById('apiTestResult');
    const testResponse = document.getElementById('apiTestResponse');

    if (testResult) testResult.style.display = 'block';
    if (testResponse) testResponse.innerHTML = 'Realizando prueba...';

    try {
        // Simular una solicitud sin realizar la conexión real
        // En un entorno real, se haría la solicitud y se mostraría la respuesta

        // Simular demora
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Simular respuesta exitosa
        const mockResponse = {
            success: true,
            data: {
                id: 12345,
                name: "Producto de ejemplo",
                price: 99.99,
                available: true,
                features: ["Característica 1", "Característica 2"]
            },
            meta: {
                totalItems: 42,
                page: 1
            }
        };

        // Mostrar respuesta
        if (testResponse) {
            testResponse.innerHTML = JSON.stringify(mockResponse, null, 2);
        }

        showNotification('Prueba de API completada', 'success');
    } catch (error) {
        // Mostrar error
        if (testResponse) {
            testResponse.innerHTML = `Error: ${error.message}`;
        }

        showNotification('Error en la prueba de API', 'error');
    }
}

// Generar código para llamada de API
function generateApiCallCode(api) {
    return `
// Llamada a la API ${api.name}
async function call${api.name.charAt(0).toUpperCase() + api.name.slice(1)}(client, userId, session) {
    try {
        // Preparar URL con variables
        let apiUrl = "${api.url}";
        
        // Reemplazar variables en la URL
        apiUrl = apiUrl.replace(/\\{\\{(\\w+)\\}\\}/g, (match, variable) => {
            return session[variable] || match;
        });

        // Configurar headers
        const headers = {};
        ${api.headers.map(h => `headers["${h.key}"] = "${h.value}";`).join('\n        ')}
        
        // Configurar autenticación
        ${generateAuthCode(api.auth)}

        // Preparar body para POST/PUT
        ${api.method === 'POST' || api.method === 'PUT' ? `
        let requestBody = ${api.body ? `\`${api.body}\`` : '{}'};
        
        // Reemplazar variables en el body
        if (typeof requestBody === 'string') {
            requestBody = requestBody.replace(/\\{\\{(\\w+)\\}\\}/g, (match, variable) => {
                return session[variable] || match;
            });
            
            // Convertir a objeto si es JSON
            try {
                requestBody = JSON.parse(requestBody);
            } catch (e) {
                console.error('Error parseando body:', e);
            }
        }` : '// No se requiere body para este método'}

        // Configurar opciones de la solicitud
        const requestOptions = {
            method: '${api.method}',
            headers,
            ${api.method === 'POST' || api.method === 'PUT' ? 'body: JSON.stringify(requestBody),' : ''}
        };

        // Realizar solicitud
        const response = await fetch(apiUrl, requestOptions);
        
        // Verificar si la respuesta es exitosa
        if (!response.ok) {
            throw new Error(\`Error en la API: \${response.status} \${response.statusText}\`);
        }
        
        // Parsear respuesta como JSON
        const data = await response.json();
        
        // Procesar mapeo de respuesta
        ${api.responseMapping.map(map => `session.${map.variable} = getValueByPath(data, "${map.path}");`).join('\n        ')}
        
        // Notificar al usuario
        await client.sendMessage(userId, \`✅ Información obtenida correctamente\`);
        
        return data;
    } catch (error) {
        console.error('Error en API ${api.name}:', error);
        
        // Notificar error al usuario
        await client.sendMessage(userId, \`❌ Error al procesar la solicitud: \${error.message}\`);
        
        return null;
    }
}

// Función auxiliar para obtener valor por ruta en objeto
function getValueByPath(obj, path) {
    return path.split('.').reduce((o, i) => {
        if (o === null || o === undefined) return o;
        
        // Manejar notación de array: items[0]
        const arrayMatch = i.match(/(\\w+)\\[(\\d+)\\]/);
        
        if (arrayMatch) {
            const prop = arrayMatch[1];
            const index = parseInt(arrayMatch[2]);
            return o[prop] ? o[prop][index] : undefined;
        }
        
        return o[i];
    }, obj);
}`;
}

// Generar código para autenticación de API
function generateAuthCode(auth) {
    if (!auth) return '// Sin autenticación';

    switch (auth.type) {
        case 'basic':
            return `// Basic Auth
        const credentials = btoa(\`\${${auth.username}:${auth.password}}\`);
        headers['Authorization'] = \`Basic \${credentials}\`;`;

        case 'bearer':
            return `// Bearer Token
        headers['Authorization'] = \`Bearer ${auth.token}\`;`;

        case 'apikey':
            if (auth.in === 'header') {
                return `// API Key en header
        headers['${auth.keyName}'] = '${auth.keyValue}';`;
            } else {
                return `// API Key en query
        apiUrl += apiUrl.includes('?') ? '&' : '?';
        apiUrl += \`${auth.keyName}=${auth.keyValue}\`;`;
            }

        default:
            return '// Sin autenticación';
    }
}

// ===============================================
// Sistema de Gestión de Citas
// ===============================================

// Cargar configuración de citas cuando se selecciona un flujo
function loadAppointmentSettings(flow) {
    if (!flow.appointments) {
        // Inicializar con valores por defecto
        flow.appointments = {
            enabled: false,
            serviceName: 'Cita',
            duration: 30,
            minNotice: 2,
            maxNotice: 30,
            requiredFields: ['name', 'phone'],
            reminders: {
                enabled24h: true,
                enabled1h: false
            },
            workingHours: {
                monday: { active: true, start: '09:00', end: '18:00', breakStart: '13:00', breakEnd: '14:00' },
                tuesday: { active: true, start: '09:00', end: '18:00', breakStart: '13:00', breakEnd: '14:00' },
                wednesday: { active: true, start: '09:00', end: '18:00', breakStart: '13:00', breakEnd: '14:00' },
                thursday: { active: true, start: '09:00', end: '18:00', breakStart: '13:00', breakEnd: '14:00' },
                friday: { active: true, start: '09:00', end: '18:00', breakStart: '13:00', breakEnd: '14:00' },
                saturday: { active: false, start: '10:00', end: '15:00', breakStart: '13:00', breakEnd: '13:30' },
                sunday: { active: false, start: '10:00', end: '15:00', breakStart: '13:00', breakEnd: '13:30' }
            },
            holidays: [],
            services: [
                { name: 'Servicio Estándar', duration: 30 }
            ],
            messages: {
                request: 'Por favor, proporciona la siguiente información para tu cita:\n1. Nombre completo\n2. Servicio requerido\n3. Fecha preferida (DD/MM/AAAA)\n4. Hora preferida',
                confirm: '✅ Tu cita ha sido confirmada:\n📅 Fecha: {{fecha}}\n⏰ Hora: {{hora}}\n🔖 Servicio: {{servicio}}\n👤 A nombre de: {{nombre}}\n\nPara cancelar responde con la palabra "cancelar".',
                reminder: '⏰ RECORDATORIO:\nTienes una cita mañana {{fecha}} a las {{hora}} para {{servicio}}.\n\nTe esperamos puntualmente. Si necesitas cancelar, responde "cancelar".'
            },
            integrations: {
                googleCalendar: {
                    enabled: false,
                    calendarId: '',
                    apiKey: ''
                },
                outlookCalendar: {
                    enabled: false,
                    appId: '',
                    secretKey: ''
                }
            }
        };
    }

    // Actualizar UI con los valores
    updateAppointmentSettingsUI(flow.appointments);
}

// Actualizar UI con los valores de configuración
function updateAppointmentSettingsUI(appointmentSettings) {
    // Estado general
    document.getElementById('appointmentsEnabled').checked = appointmentSettings.enabled;

    // Configuración general
    document.getElementById('appointmentServiceName').value = appointmentSettings.serviceName || '';
    document.getElementById('appointmentDuration').value = appointmentSettings.duration || 30;
    document.getElementById('appointmentMinNotice').value = appointmentSettings.minNotice || 2;
    document.getElementById('appointmentMaxNotice').value = appointmentSettings.maxNotice || 30;

    // Campos requeridos (múltiples)
    const requiredFieldsEl = document.getElementById('appointmentRequiredFields');
    if (requiredFieldsEl) {
        // Desmarcar todos
        Array.from(requiredFieldsEl.options).forEach(option => {
            option.selected = false;
        });

        // Marcar los seleccionados
        if (appointmentSettings.requiredFields && Array.isArray(appointmentSettings.requiredFields)) {
            appointmentSettings.requiredFields.forEach(field => {
                const option = Array.from(requiredFieldsEl.options).find(opt => opt.value === field);
                if (option) option.selected = true;
            });
        }
    }

    // Recordatorios
    document.getElementById('appointmentReminder24h').checked = appointmentSettings.reminders?.enabled24h || false;
    document.getElementById('appointmentReminder1h').checked = appointmentSettings.reminders?.enabled1h || false;

    // Horarios
    updateWorkingHoursUI(appointmentSettings.workingHours);

    // Días festivos
    updateHolidaysUI(appointmentSettings.holidays);

    // Servicios
    updateServicesUI(appointmentSettings.services);

    // Mensajes
    document.getElementById('appointmentRequestMessage').value = appointmentSettings.messages?.request || '';
    document.getElementById('appointmentConfirmMessage').value = appointmentSettings.messages?.confirm || '';
    document.getElementById('appointmentReminderMessage').value = appointmentSettings.messages?.reminder || '';

    // Integraciones
    document.getElementById('googleCalendarEnabled').checked = appointmentSettings.integrations?.googleCalendar?.enabled || false;
    document.getElementById('outlookCalendarEnabled').checked = appointmentSettings.integrations?.outlookCalendar?.enabled || false;

    // Mostrar/ocultar configuraciones de integraciones
    toggleIntegrationConfig('googleCalendar');
    toggleIntegrationConfig('outlookCalendar');
}

// Actualizar UI de horarios de trabajo
function updateWorkingHoursUI(workingHours) {
    if (!workingHours) return;

    const daysMap = {
        monday: 'monday',
        tuesday: 'tuesday',
        wednesday: 'wednesday',
        thursday: 'thursday',
        friday: 'friday',
        saturday: 'saturday',
        sunday: 'sunday'
    };

    // Actualizar cada día
    Object.keys(daysMap).forEach(dayKey => {
        const row = document.querySelector(`#workingHoursTable tr[data-day="${dayKey}"]`);
        if (!row) return;

        const dayConfig = workingHours[dayKey] || { active: false, start: '09:00', end: '18:00', breakStart: '13:00', breakEnd: '14:00' };

        // Actualizar cada campo
        row.querySelector('.day-active').checked = dayConfig.active;
        row.querySelector('.day-start').value = dayConfig.start || '09:00';
        row.querySelector('.day-end').value = dayConfig.end || '18:00';
        row.querySelector('.day-break-start').value = dayConfig.breakStart || '13:00';
        row.querySelector('.day-break-end').value = dayConfig.breakEnd || '14:00';
    });
}

// Actualizar UI de días festivos
function updateHolidaysUI(holidays) {
    const container = document.getElementById('holidaysContainer');
    if (!container) return;

    // Limpiar contenedor
    container.innerHTML = '';

    // Si no hay días festivos, añadir uno vacío
    if (!holidays || holidays.length === 0) {
        addHoliday();
        return;
    }

    // Añadir cada día festivo
    holidays.forEach(holiday => {
        addHoliday(holiday.date, holiday.description);
    });
}

// Añadir un día festivo
function addHoliday(date = '', description = '') {
    const container = document.getElementById('holidaysContainer');
    if (!container) return;

    const holidayItem = document.createElement('div');
    holidayItem.className = 'holiday-item';
    holidayItem.innerHTML = `
        <div class="input-group mb-2">
            <input type="date" class="form-control holiday-date" value="${date}">
            <input type="text" class="form-control holiday-description" placeholder="Descripción" value="${description}">
            <div class="input-group-append">
                <button class="btn btn-outline-danger" type="button" onclick="removeHoliday(this)">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    `;

    container.appendChild(holidayItem);
}

// Eliminar un día festivo
function removeHoliday(button) {
    const item = button.closest('.holiday-item');
    if (item) {
        item.remove();
    }
}

// Actualizar UI de servicios
function updateServicesUI(services) {
    const container = document.getElementById('servicesContainer');
    if (!container) return;

    // Limpiar contenedor
    container.innerHTML = '';

    // Si no hay servicios, añadir uno vacío
    if (!services || services.length === 0) {
        addService();
        return;
    }

    // Añadir cada servicio
    services.forEach(service => {
        addService(service.name, service.duration);
    });
}

// Añadir un servicio
function addService(name = '', duration = '') {
    const container = document.getElementById('servicesContainer');
    if (!container) return;

    const serviceItem = document.createElement('div');
    serviceItem.className = 'service-item';
    serviceItem.innerHTML = `
        <div class="input-group mb-2">
            <input type="text" class="form-control service-name" placeholder="Nombre del servicio" value="${name}">
            <input type="number" class="form-control service-duration" placeholder="Duración (min)" min="5" step="5" value="${duration}">
            <div class="input-group-append">
                <button class="btn btn-outline-danger" type="button" onclick="removeService(this)">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    `;

    container.appendChild(serviceItem);
}

// Eliminar un servicio
function removeService(button) {
    const item = button.closest('.service-item');
    if (item) {
        item.remove();
    }
}

// Alternar estado del sistema de citas
function toggleAppointmentsEnabled(enabled) {
    if (currentSelectedFlow === null || !currentFlows || !currentFlows[currentSelectedFlow]) {
        return;
    }

    const flow = currentFlows[currentSelectedFlow];

    // Inicializar si no existe
    if (!flow.appointments) {
        flow.appointments = {};
    }

    flow.appointments.enabled = enabled;

    // Opcional: guardar cambios inmediatamente
    // saveFlowChanges();
}

// Alternar visibilidad de la configuración de integración
function toggleIntegrationConfig(integrationType) {
    const checkbox = document.getElementById(`${integrationType}Enabled`);
    const configContainer = document.getElementById(`${integrationType}Config`);

    if (checkbox && configContainer) {
        configContainer.style.display = checkbox.checked ? 'block' : 'none';
    }
}

// Guardar configuración de citas
async function saveAppointmentSettings() {
    if (currentSelectedFlow === null || !currentFlows || !currentFlows[currentSelectedFlow]) {
        showNotification('No hay flujo seleccionado para guardar', 'warning');
        return;
    }

    const flow = currentFlows[currentSelectedFlow];

    // Inicializar si no existe
    if (!flow.appointments) {
        flow.appointments = {};
    }

    // Recopilar datos del formulario
    flow.appointments.enabled = document.getElementById('appointmentsEnabled').checked;
    flow.appointments.serviceName = document.getElementById('appointmentServiceName').value.trim();
    flow.appointments.duration = parseInt(document.getElementById('appointmentDuration').value) || 30;
    flow.appointments.minNotice = parseInt(document.getElementById('appointmentMinNotice').value) || 2;
    flow.appointments.maxNotice = parseInt(document.getElementById('appointmentMaxNotice').value) || 30;

    // Campos requeridos (selección múltiple)
    const requiredFieldsEl = document.getElementById('appointmentRequiredFields');
    if (requiredFieldsEl) {
        flow.appointments.requiredFields = Array.from(requiredFieldsEl.selectedOptions).map(option => option.value);
    }

    // Recordatorios
    flow.appointments.reminders = {
        enabled24h: document.getElementById('appointmentReminder24h').checked,
        enabled1h: document.getElementById('appointmentReminder1h').checked
    };

    // Horarios de trabajo
    flow.appointments.workingHours = getWorkingHoursFromUI();

    // Días festivos
    flow.appointments.holidays = getHolidaysFromUI();

    // Servicios
    flow.appointments.services = getServicesFromUI();

    // Mensajes
    flow.appointments.messages = {
        request: document.getElementById('appointmentRequestMessage').value,
        confirm: document.getElementById('appointmentConfirmMessage').value,
        reminder: document.getElementById('appointmentReminderMessage').value
    };

    // Integraciones
    flow.appointments.integrations = {
        googleCalendar: {
            enabled: document.getElementById('googleCalendarEnabled').checked,
            // Otros campos se recogerían aquí
        },
        outlookCalendar: {
            enabled: document.getElementById('outlookCalendarEnabled').checked,
            // Otros campos se recogerían aquí
        }
    };

    // Guardar cambios
    try {
        await saveAllFlowsToServer();
        showNotification('Configuración de citas guardada correctamente', 'success');

        // Generar flujo de citas si está habilitado
        if (flow.appointments.enabled) {
            generateAppointmentFlow(flow);
        }
    } catch (error) {
        console.error('Error guardando configuración de citas:', error);
        showNotification('Error guardando configuración de citas', 'error');
    }
}

// Obtener horarios de trabajo desde la UI
function getWorkingHoursFromUI() {
    const workingHours = {};
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    days.forEach(day => {
        const row = document.querySelector(`#workingHoursTable tr[data-day="${day}"]`);
        if (!row) return;

        workingHours[day] = {
            active: row.querySelector('.day-active').checked,
            start: row.querySelector('.day-start').value,
            end: row.querySelector('.day-end').value,
            breakStart: row.querySelector('.day-break-start').value,
            breakEnd: row.querySelector('.day-break-end').value
        };
    });

    return workingHours;
}

// Obtener días festivos desde la UI
function getHolidaysFromUI() {
    const holidays = [];

    document.querySelectorAll('.holiday-item').forEach(item => {
        const dateInput = item.querySelector('.holiday-date');
        const descInput = item.querySelector('.holiday-description');

        if (dateInput && dateInput.value) {
            holidays.push({
                date: dateInput.value,
                description: descInput ? descInput.value : ''
            });
        }
    });

    return holidays;
}

// Obtener servicios desde la UI
function getServicesFromUI() {
    const services = [];

    document.querySelectorAll('.service-item').forEach(item => {
        const nameInput = item.querySelector('.service-name');
        const durationInput = item.querySelector('.service-duration');

        if (nameInput && nameInput.value.trim()) {
            services.push({
                name: nameInput.value.trim(),
                duration: parseInt(durationInput ? durationInput.value : 30) || 30
            });
        }
    });

    return services;
}

// Generar flujo de citas a partir de la configuración
function generateAppointmentFlow(flow) {
    if (!flow.appointments || !flow.appointments.enabled) {
        return;
    }

    // Verificar si ya existe un flujo de citas
    const existingAppointmentFlow = currentFlows.find(f => f.name === 'AGENDA_CITAS');

    if (existingAppointmentFlow) {
        // Actualizar el flujo existente
        updateAppointmentFlow(existingAppointmentFlow, flow.appointments);
    } else {
        // Crear un nuevo flujo
        const appointmentFlow = createAppointmentFlow(flow.appointments);
        currentFlows.push(appointmentFlow);
    }

    // Notificar al usuario
    showNotification('Flujo de citas actualizado', 'success');
}

// Crear flujo de citas
function createAppointmentFlow(appointmentSettings) {
    // Crear flujo base para gestión de citas
    const flow = {
        name: 'AGENDA_CITAS',
        description: 'Sistema de agendado de citas',
        steps: [
            'INITIAL',                 // Paso inicial
            'COLLECT_NAME',            // Recolectar nombre
            'COLLECT_PHONE',           // Recolectar teléfono
            'SELECT_SERVICE',          // Seleccionar servicio
            'SELECT_DATE',             // Seleccionar fecha
            'SELECT_TIME',             // Seleccionar hora
            'CONFIRM_APPOINTMENT',     // Confirmar cita
            'APPOINTMENT_CONFIRMED',   // Cita confirmada
            'CANCEL_APPOINTMENT',      // Cancelar cita
            'RESCHEDULE_APPOINTMENT'   // Reprogramar cita
        ],
        options: [
            { number: 1, emoji: '✅', text: 'Confirmar Cita', action: 'goToStep', actionValue: 'APPOINTMENT_CONFIRMED' },
            { number: 2, emoji: '📅', text: 'Cambiar Fecha', action: 'goToStep', actionValue: 'SELECT_DATE' },
            { number: 3, emoji: '⏰', text: 'Cambiar Hora', action: 'goToStep', actionValue: 'SELECT_TIME' },
            { number: 4, emoji: '❌', text: 'Cancelar', action: 'goToStep', actionValue: 'CANCEL_APPOINTMENT' }
        ],
        messages: {
            welcome: `📅 *Sistema de Citas*\n\nBienvenido al sistema de agendado de citas${appointmentSettings.serviceName ? ' para ' + appointmentSettings.serviceName : ''}.`,
            COLLECT_NAME: 'Por favor, escribe tu nombre completo:',
            COLLECT_PHONE: 'Gracias. Ahora, por favor proporciona un número de teléfono de contacto:',
            SELECT_SERVICE: 'Por favor, selecciona el servicio que deseas agendar:',
            SELECT_DATE: 'Selecciona una fecha para tu cita (formato DD/MM/YYYY):\n\nFechas disponibles próximas:',
            SELECT_TIME: 'Selecciona una hora para tu cita:\n\nHorarios disponibles:',
            CONFIRM_APPOINTMENT: 'Por favor, confirma tu cita con los siguientes detalles:\n\n📅 Fecha: {{fecha}}\n⏰ Hora: {{hora}}\n🔖 Servicio: {{servicio}}\n👤 A nombre de: {{nombre}}\n\nSelecciona una opción:',
            APPOINTMENT_CONFIRMED: '✅ ¡Tu cita ha sido confirmada!\n\nFecha: {{fecha}}\nHora: {{hora}}\nServicio: {{servicio}}\n\nRecuerda llegar 10 minutos antes. Para cancelar, responde con la palabra "cancelar".',
            CANCEL_APPOINTMENT: '❌ Tu cita ha sido cancelada.\n\nPuedes agendar una nueva cita cuando lo desees.',
            RESCHEDULE_APPOINTMENT: '🔄 Vamos a reprogramar tu cita.\n\nPor favor, selecciona una nueva fecha:',
            invalidDate: '❌ Fecha no válida o no disponible. Por favor, selecciona una fecha en formato DD/MM/YYYY y asegúrate que sea un día disponible.',
            invalidTime: '❌ Hora no válida o no disponible. Por favor, selecciona una hora disponible.',
            noAvailability: '❌ Lo sentimos, no hay disponibilidad para la fecha seleccionada. Por favor, elige otra fecha.',
            appointmentReminder: '⏰ RECORDATORIO: Tienes una cita mañana {{fecha}} a las {{hora}} para {{servicio}}.\n\nTe esperamos puntualmente. Si necesitas cancelar, responde "cancelar".'
        },
        active: true
    };

    // Agregar servicios como opciones de menú
    if (appointmentSettings.services && appointmentSettings.services.length > 0) {
        flow.messages.serviceOptions = 'Selecciona el servicio deseado:\n\n';

        appointmentSettings.services.forEach((service, index) => {
            const emoji = getEmojiForNumber(index + 1);
            flow.messages.serviceOptions += `${emoji} ${service.name}\n`;

            // Agregar opción para selección de servicio
            flow.options.push({
                number: index + 5, // Empezar después de las opciones base
                emoji: emoji,
                text: service.name,
                action: 'goToStep',
                actionValue: 'SELECT_DATE'
            });
        });
    }

    return flow;
}

// Actualizar flujo de citas existente
function updateAppointmentFlow(flow, appointmentSettings) {
    // Actualizar mensajes principales
    flow.messages.welcome = `📅 *Sistema de Citas*\n\nBienvenido al sistema de agendado de citas${appointmentSettings.serviceName ? ' para ' + appointmentSettings.serviceName : ''}.`;
    flow.messages.APPOINTMENT_CONFIRMED = appointmentSettings.messages.confirm || flow.messages.APPOINTMENT_CONFIRMED;
    flow.messages.appointmentReminder = appointmentSettings.messages.reminder || flow.messages.appointmentReminder;

    // Actualizar opciones de servicios
    if (appointmentSettings.services && appointmentSettings.services.length > 0) {
        // Eliminar opciones de servicio anteriores (empiezan después de índice 4)
        flow.options = flow.options.filter(option => option.number <= 4);

        // Actualizar mensaje de opciones de servicio
        flow.messages.serviceOptions = 'Selecciona el servicio deseado:\n\n';

        // Añadir nuevas opciones de servicio
        appointmentSettings.services.forEach((service, index) => {
            const emoji = getEmojiForNumber(index + 1);
            flow.messages.serviceOptions += `${emoji} ${service.name}\n`;

            // Agregar opción para selección de servicio
            flow.options.push({
                number: index + 5, // Empezar después de las opciones base
                emoji: emoji,
                text: service.name,
                action: 'goToStep',
                actionValue: 'SELECT_DATE'
            });
        });
    }

    return flow;
}

// Vista previa del flujo de citas
function previewAppointmentFlow() {
    if (currentSelectedFlow === null || !currentFlows || !currentFlows[currentSelectedFlow]) {
        showNotification('No hay flujo seleccionado', 'warning');
        return;
    }

    const flow = currentFlows[currentSelectedFlow];

    // Verificar si la configuración de citas está habilitada
    if (!flow.appointments || !flow.appointments.enabled) {
        if (confirm('El sistema de citas no está habilitado. ¿Deseas activarlo y ver la vista previa?')) {
            document.getElementById('appointmentsEnabled').checked = true;
            toggleAppointmentsEnabled(true);
        } else {
            return;
        }
    }

    // Guardar cambios temporalmente para la vista previa
    const appointmentSettings = {
        enabled: document.getElementById('appointmentsEnabled').checked,
        serviceName: document.getElementById('appointmentServiceName').value.trim(),
        duration: parseInt(document.getElementById('appointmentDuration').value) || 30,
        services: getServicesFromUI(),
        messages: {
            request: document.getElementById('appointmentRequestMessage').value,
            confirm: document.getElementById('appointmentConfirmMessage').value,
            reminder: document.getElementById('appointmentReminderMessage').value
        },
        workingHours: getWorkingHoursFromUI()
    };

    // Generar flujo temporal para vista previa
    const previewFlow = createAppointmentFlow(appointmentSettings);

    // Mostrar vista previa usando el flujo generado
    showAppointmentPreview(previewFlow);
}

// Mostrar vista previa del flujo de citas
function showAppointmentPreview(flow) {
    // Usar la función existente de vista previa pero con el flujo de citas
    const originalSelectedFlow = currentSelectedFlow;
    const previewFlowIndex = currentFlows.length;

    // Añadir temporalmente el flujo de vista previa
    currentFlows.push(flow);
    currentSelectedFlow = previewFlowIndex;

    // Mostrar vista previa
    previewFlow();

    // Eliminar el flujo temporal después de cerrar la vista previa
    document.querySelector('#flowPreview .preview-header button').addEventListener('click', function onClose() {
        currentFlows.pop(); // Eliminar el flujo temporal
        currentSelectedFlow = originalSelectedFlow; // Restaurar selección original
        this.removeEventListener('click', onClose);
    }, { once: true });
}

// Generar horarios disponibles para fecha
function generateAvailableTimesForDate(date, appointmentSettings) {
    // Extraer día de la semana (0 = domingo, 1 = lunes, etc.)
    const dayOfWeek = new Date(date).getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[dayOfWeek];

    // Verificar si el día está activo
    const daySettings = appointmentSettings.workingHours[dayName];
    if (!daySettings || !daySettings.active) {
        return [];
    }

    // Verificar si es un día festivo
    const dateStr = date.toISOString().split('T')[0]; // Formato YYYY-MM-DD
    const isHoliday = appointmentSettings.holidays.some(h => h.date === dateStr);
    if (isHoliday) {
        return [];
    }

    // Generar horarios disponibles
    const availableTimes = [];
    const duration = appointmentSettings.duration || 30;

    // Convertir horas a minutos desde medianoche
    const startMinutes = timeToMinutes(daySettings.start);
    const endMinutes = timeToMinutes(daySettings.end);
    const breakStartMinutes = timeToMinutes(daySettings.breakStart);
    const breakEndMinutes = timeToMinutes(daySettings.breakEnd);

    // Generar slots antes del descanso
    for (let time = startMinutes; time < breakStartMinutes; time += duration) {
        availableTimes.push(minutesToTime(time));
    }

    // Generar slots después del descanso
    for (let time = breakEndMinutes; time < endMinutes; time += duration) {
        availableTimes.push(minutesToTime(time));
    }

    return availableTimes;
}

// Convertir hora (HH:MM) a minutos desde medianoche
function timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

// Convertir minutos desde medianoche a hora (HH:MM)
function minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

// Validar fecha para cita
function isValidAppointmentDate(dateStr, appointmentSettings) {
    // Verificar formato de fecha (DD/MM/YYYY)
    const dateParts = dateStr.split('/');
    if (dateParts.length !== 3) return false;

    const day = parseInt(dateParts[0]);
    const month = parseInt(dateParts[1]) - 1; // Meses en JS: 0-11
    const year = parseInt(dateParts[2]);

    // Verificar si la fecha es válida
    const date = new Date(year, month, day);
    if (
        date.getDate() !== day ||
        date.getMonth() !== month ||
        date.getFullYear() !== year ||
        isNaN(date.getTime())
    ) {
        return false;
    }

    // Verificar que la fecha sea futura
    const now = new Date();
    if (date < now) return false;

    // Verificar tiempo mínimo de anticipación
    const minNoticeHours = appointmentSettings.minNotice || 2;
    const minNoticeDate = new Date();
    minNoticeDate.setHours(minNoticeDate.getHours() + minNoticeHours);
    if (date < minNoticeDate) return false;

    // Verificar tiempo máximo de anticipación
    const maxNoticeDays = appointmentSettings.maxNotice || 30;
    const maxNoticeDate = new Date();
    maxNoticeDate.setDate(maxNoticeDate.getDate() + maxNoticeDays);
    if (date > maxNoticeDate) return false;

    // Extraer día de la semana
    const dayOfWeek = date.getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[dayOfWeek];

    // Verificar si el día está activo
    const daySettings = appointmentSettings.workingHours[dayName];
    if (!daySettings || !daySettings.active) return false;

    // Verificar si es un día festivo
    const dateStrISO = date.toISOString().split('T')[0]; // Formato YYYY-MM-DD
    if (appointmentSettings.holidays.some(h => h.date === dateStrISO)) return false;

    return true;
}

// Validar hora para cita
function isValidAppointmentTime(timeStr, date, appointmentSettings) {
    // Verificar formato de hora (HH:MM)
    if (!/^\d{1,2}:\d{2}$/.test(timeStr)) return false;

    // Obtener horarios disponibles para la fecha
    const availableTimes = generateAvailableTimesForDate(date, appointmentSettings);

    // Verificar si la hora está disponible
    return availableTimes.includes(timeStr);
}

// Generar código para gestión de citas
function generateAppointmentCode(flow, appointmentSettings) {
    return `
// Módulo de Gestión de Citas
// Generado automáticamente para el flujo: ${flow.name}

/**
 * Maneja el flujo de agendado de citas
 * @param {Object} client - Cliente de WhatsApp
 * @param {Object} message - Mensaje recibido
 * @param {Object} session - Sesión del usuario
 */
async function handleAppointmentFlow(client, message, session) {
    const userId = message.from;
    const step = session.step || 'INITIAL';
    const messageBody = message.body.trim();
    
    console.log(\`[${flow.name}] Procesando mensaje en paso \${step}\`);
    
    try {
        switch (step) {
            case 'INITIAL':
                await showAppointmentWelcome(client, userId, session);
                break;
                
            case 'COLLECT_NAME':
                session.appointmentData = session.appointmentData || {};
                session.appointmentData.nombre = messageBody;
                
                await client.sendMessage(userId, '${flow.messages.COLLECT_PHONE}');
                session.step = 'COLLECT_PHONE';
                break;
                
            case 'COLLECT_PHONE':
                session.appointmentData = session.appointmentData || {};
                session.appointmentData.telefono = messageBody;
                
                // Si hay múltiples servicios, mostrar opciones
                ${appointmentSettings.services && appointmentSettings.services.length > 1 ? `
                await client.sendMessage(userId, '${flow.messages.serviceOptions}');
                session.step = 'SELECT_SERVICE';` : `
                // Si solo hay un servicio, asignarlo automáticamente
                session.appointmentData.servicio = '${appointmentSettings.services?.[0]?.name || appointmentSettings.serviceName || "Cita"}';
                
                // Mostrar selección de fecha
                await showDateSelection(client, userId, session);
                session.step = 'SELECT_DATE';`}
                break;
                
            case 'SELECT_SERVICE':
                // Procesar selección de servicio
                const selectedService = processServiceSelection(messageBody, ${JSON.stringify(appointmentSettings.services)});
                
                if (selectedService) {
                    session.appointmentData.servicio = selectedService.name;
                    
                    // Mostrar selección de fecha
                    await showDateSelection(client, userId, session);
                    session.step = 'SELECT_DATE';
                } else {
                    await client.sendMessage(userId, '❌ Servicio no válido. Por favor, selecciona una opción válida:');
                    await client.sendMessage(userId, '${flow.messages.serviceOptions}');
                }
                break;
                
            case 'SELECT_DATE':
                // Validar fecha
                if (isValidAppointmentDate(messageBody, ${JSON.stringify(appointmentSettings)})) {
                    session.appointmentData.fecha = messageBody;
                    
                    // Mostrar horarios disponibles
                    await showTimeSelection(client, userId, session);
                    session.step = 'SELECT_TIME';
                } else {
                    await client.sendMessage(userId, '${flow.messages.invalidDate}');
                    await showDateSelection(client, userId, session);
                }
                break;
                
            case 'SELECT_TIME':
                // Validar hora
                const dateParts = session.appointmentData.fecha.split('/');
                const appointmentDate = new Date(
                    parseInt(dateParts[2]), // año
                    parseInt(dateParts[1]) - 1, // mes (0-11)
                    parseInt(dateParts[0]) // día
                );
                
                if (isValidAppointmentTime(messageBody, appointmentDate, ${JSON.stringify(appointmentSettings)})) {
                    session.appointmentData.hora = messageBody;
                    
                    // Mostrar confirmación
                    await showAppointmentConfirmation(client, userId, session);
                    session.step = 'CONFIRM_APPOINTMENT';
                } else {
                    await client.sendMessage(userId, '${flow.messages.invalidTime}');
                    await showTimeSelection(client, userId, session);
                }
                break;
                
            case 'CONFIRM_APPOINTMENT':
                // Procesar confirmación
                if (/^1|✅|confirmar|si|sí|yes/i.test(messageBody)) {
                    // Cita confirmada
                    await confirmAppointment(client, userId, session);
                    session.step = 'APPOINTMENT_CONFIRMED';
                } else if (/^2|📅|fecha|cambiar fecha/i.test(messageBody)) {
                    // Cambiar fecha
                    await showDateSelection(client, userId, session);
                    session.step = 'SELECT_DATE';
                } else if (/^3|⏰|hora|cambiar hora/i.test(messageBody)) {
                    // Cambiar hora
                    await showTimeSelection(client, userId, session);
                    session.step = 'SELECT_TIME';
                } else if (/^4|❌|cancelar|cancel|no/i.test(messageBody)) {
                    // Cancelar cita
                    await client.sendMessage(userId, '${flow.messages.CANCEL_APPOINTMENT}');
                    session.step = 'INITIAL';
                    delete session.appointmentData;
                } else {
                    // Opción no válida
                    await client.sendMessage(userId, '❌ Opción no válida. Por favor, selecciona una de las siguientes opciones:');
                    await showAppointmentConfirmation(client, userId, session);
                }
                break;
                
            case 'APPOINTMENT_CONFIRMED':
                // Procesar mensajes después de confirmación
                if (/cancelar|cancel/i.test(messageBody)) {
                    // Cancelar cita
                    await cancelAppointment(client, userId, session);
                    session.step = 'CANCEL_APPOINTMENT';
                } else if (/reprogramar|reschedule|cambiar/i.test(messageBody)) {
                    // Reprogramar cita
                    await client.sendMessage(userId, '${flow.messages.RESCHEDULE_APPOINTMENT}');
                    await showDateSelection(client, userId, session);
                    session.step = 'SELECT_DATE';
                } else {
                    // Mensaje no reconocido, mostrar opciones
                    await client.sendMessage(userId, 'Para gestionar tu cita, puedes responder con: "cancelar" o "reprogramar".');
                }
                break;
                
            case 'CANCEL_APPOINTMENT':
                // Después de cancelar, volver al inicio
                await showAppointmentWelcome(client, userId, session);
                break;
                
            default:
                // Paso desconocido, volver al inicio
                await showAppointmentWelcome(client, userId, session);
                break;
        }
    } catch (error) {
        console.error(\`[${flow.name}] Error: \${error.message}\`);
        
        // Manejar error
        await client.sendMessage(userId, '❌ Ha ocurrido un error. Por favor, intenta nuevamente.');
        
        // Volver al inicio
        session.step = 'INITIAL';
        await showAppointmentWelcome(client, userId, session);
    }
}

/**
 * Muestra el mensaje de bienvenida del sistema de citas
 */
async function showAppointmentWelcome(client, userId, session) {
    await client.sendMessage(userId, '${flow.messages.welcome}');
    await client.sendMessage(userId, '${flow.messages.COLLECT_NAME}');
    
    session.step = 'COLLECT_NAME';
    session.appointmentData = {}; // Reiniciar datos de cita
}

/**
 * Muestra las fechas disponibles para agendar
 */
async function showDateSelection(client, userId, session) {
    // Obtener próximas fechas disponibles (ejemplo: próximos 7 días)
    const availableDates = getNextAvailableDates(7, ${JSON.stringify(appointmentSettings)});
    
    let message = '${flow.messages.SELECT_DATE}\\n\\n';
    
    if (availableDates.length > 0) {
        availableDates.forEach(date => {
            message += \`• \${formatDate(date)}\\n\`;
        });
    } else {
        message += 'No hay fechas disponibles en los próximos días.';
    }
    
    await client.sendMessage(userId, message);
}

/**
 * Muestra los horarios disponibles para la fecha seleccionada
 */
async function showTimeSelection(client, userId, session) {
    // Convertir fecha seleccionada a objeto Date
    const dateParts = session.appointmentData.fecha.split('/');
    const selectedDate = new Date(
        parseInt(dateParts[2]), // año
        parseInt(dateParts[1]) - 1, // mes (0-11)
        parseInt(dateParts[0]) // día
    );
    
    // Obtener horarios disponibles
    const availableTimes = generateAvailableTimesForDate(selectedDate, ${JSON.stringify(appointmentSettings)});
    
    let message = '${flow.messages.SELECT_TIME}\\n\\n';
    
    if (availableTimes.length > 0) {
        // Mostrar horarios en columnas
        const columns = 3; // Número de columnas
        let timeRows = [];
        
        for (let i = 0; i < availableTimes.length; i += columns) {
            const rowTimes = availableTimes.slice(i, i + columns);
            timeRows.push(rowTimes.join('    '));
        }
        
        message += timeRows.join('\\n');
    } else {
        message += '${flow.messages.noAvailability}';
        
        // Volver a selección de fecha
        session.step = 'SELECT_DATE';
        await showDateSelection(client, userId, session);
        return;
    }
    
    await client.sendMessage(userId, message);
}

/**
 * Muestra la confirmación de la cita
 */
async function showAppointmentConfirmation(client, userId, session) {
    // Preparar mensaje de confirmación con los datos de la cita
    let confirmMessage = '${flow.messages.CONFIRM_APPOINTMENT}';
    
    // Reemplazar variables
    confirmMessage = confirmMessage
        .replace(/\\{\\{fecha\\}\\}/g, session.appointmentData.fecha)
        .replace(/\\{\\{hora\\}\\}/g, session.appointmentData.hora)
        .replace(/\\{\\{servicio\\}\\}/g, session.appointmentData.servicio)
        .replace(/\\{\\{nombre\\}\\}/g, session.appointmentData.nombre);
    
    await client.sendMessage(userId, confirmMessage);
    
    // Enviar opciones de confirmación
    let optionsMessage = '';
    optionsMessage += '1️⃣ Confirmar Cita\\n';
    optionsMessage += '2️⃣ Cambiar Fecha\\n';
    optionsMessage += '3️⃣ Cambiar Hora\\n';
    optionsMessage += '4️⃣ Cancelar\\n';
    
    await client.sendMessage(userId, optionsMessage);
}

/**
 * Confirma y guarda la cita
 */
async function confirmAppointment(client, userId, session) {
    // Preparar mensaje de confirmación
    let confirmMessage = '${flow.messages.APPOINTMENT_CONFIRMED}';
    
    // Reemplazar variables
    confirmMessage = confirmMessage
        .replace(/\\{\\{fecha\\}\\}/g, session.appointmentData.fecha)
        .replace(/\\{\\{hora\\}\\}/g, session.appointmentData.hora)
        .replace(/\\{\\{servicio\\}\\}/g, session.appointmentData.servicio)
        .replace(/\\{\\{nombre\\}\\}/g, session.appointmentData.nombre);
    
    // Guardar la cita en base de datos o sistema externo
    saveAppointment(session.appointmentData)
        .then(() => {
            // Programar recordatorios si están habilitados
            if (${appointmentSettings.reminders?.enabled24h}) {
                scheduleReminder(userId, session.appointmentData, 24);
            }
            
            if (${appointmentSettings.reminders?.enabled1h}) {
                scheduleReminder(userId, session.appointmentData, 1);
            }
        })
        .catch(error => {
            console.error('Error guardando cita:', error);
        });
    
    await client.sendMessage(userId, confirmMessage);
}

/**
 * Cancela una cita existente
 */
async function cancelAppointment(client, userId, session) {
    // Eliminar la cita de la base de datos o sistema externo
    if (session.appointmentData && session.appointmentData.id) {
        deleteAppointment(session.appointmentData.id)
            .catch(error => {
                console.error('Error eliminando cita:', error);
            });
    }
    
    await client.sendMessage(userId, '${flow.messages.CANCEL_APPOINTMENT}');
    
    // Limpiar datos de la cita
    delete session.appointmentData;
    
    // Volver al inicio
    session.step = 'INITIAL';
}

/**
 * Programa un recordatorio para la cita
 */
function scheduleReminder(userId, appointmentData, hoursBeforeÍ) {
    // Convertir fecha y hora a objeto Date
    const dateParts = appointmentData.fecha.split('/');
    const timeParts = appointmentData.hora.split(':');
    
    const appointmentDateTime = new Date(
        parseInt(dateParts[2]), // año
        parseInt(dateParts[1]) - 1, // mes (0-11)
        parseInt(dateParts[0]), // día
        parseInt(timeParts[0]), // hora
        parseInt(timeParts[1]) // minutos
    );
    
    // Calcular tiempo para el recordatorio
    const reminderTime = new Date(appointmentDateTime);
    reminderTime.setHours(reminderTime.getHours() - hoursBeforeÍ);
    
    // Calcular tiempo en milisegundos
    const now = new Date();
    const delay = reminderTime.getTime() - now.getTime();
    
    if (delay <= 0) return; // Ya pasó la hora del recordatorio
    
    // Programar recordatorio
    setTimeout(async () => {
        try {
            // Preparar mensaje de recordatorio
            let reminderMessage = '${flow.messages.appointmentReminder}';
            
            // Reemplazar variables
            reminderMessage = reminderMessage
                .replace(/\\{\\{fecha\\}\\}/g, appointmentData.fecha)
                .replace(/\\{\\{hora\\}\\}/g, appointmentData.hora)
                .replace(/\\{\\{servicio\\}\\}/g, appointmentData.servicio)
                .replace(/\\{\\{nombre\\}\\}/g, appointmentData.nombre);
            
            // Enviar recordatorio
            const client = getWhatsAppClient(); // Función que devuelve el cliente activo
            if (client) {
                await client.sendMessage(userId, reminderMessage);
            }
        } catch (error) {
            console.error('Error enviando recordatorio:', error);
        }
    }, delay);
}

/**
 * Guarda la cita en la base de datos o sistema externo
 */
async function saveAppointment(appointmentData) {
    // Implementación dependerá del sistema de almacenamiento
    console.log('Guardando cita:', appointmentData);
    
    // Aquí iría la lógica para guardar en DB o sistema externo
    
    // Ejemplo: Asignar un ID a la cita
    appointmentData.id = 'cita_' + Date.now();
    
    return appointmentData;
}

/**
 * Elimina una cita de la base de datos o sistema externo
 */
async function deleteAppointment(appointmentId) {
    // Implementación dependerá del sistema de almacenamiento
    console.log('Eliminando cita:', appointmentId);
    
    // Aquí iría la lógica para eliminar de DB o sistema externo
    
    return true;
}

/**
 * Procesa la selección de servicio del usuario
 */
function processServiceSelection(input, services) {
    // Buscar por número
    if (/^\\d+$/.test(input)) {
        const serviceIndex = parseInt(input) - 1;
        if (serviceIndex >= 0 && serviceIndex < services.length) {
            return services[serviceIndex];
        }
    }
    
    // Buscar por emoji
    const emojiMatch = input.match(/^(\\d️⃣)/);
    if (emojiMatch) {
        const emojiNum = emojiMatch[1];
        const serviceIndex = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'].indexOf(emojiNum);
        if (serviceIndex >= 0 && serviceIndex < services.length) {
            return services[serviceIndex];
        }
    }
    
    // Buscar por nombre (texto)
    const serviceByName = services.find(service => 
        service.name.toLowerCase() === input.toLowerCase()
    );
    
    return serviceByName || null;
}

/**
 * Obtiene las próximas fechas disponibles
 */
function getNextAvailableDates(daysToCheck, appointmentSettings) {
    const availableDates = [];
    const now = new Date();
    
    // Verificar los próximos N días
    for (let i = 0; i < daysToCheck; i++) {
        const date = new Date();
        date.setDate(now.getDate() + i);
        
        // Verificar si la fecha es válida para citas
        const dateStr = \`\${date.getDate().toString().padStart(2, '0')}/\${(date.getMonth() + 1).toString().padStart(2, '0')}/\${date.getFullYear()}\`;
        if (isValidAppointmentDate(dateStr, appointmentSettings)) {
            availableDates.push(date);
        }
    }
    
    return availableDates;
}

/**
 * Formatea una fecha como DD/MM/YYYY
 */
function formatDate(date) {
    return \`\${date.getDate().toString().padStart(2, '0')}/\${(date.getMonth() + 1).toString().padStart(2, '0')}/\${date.getFullYear()}\`;
}

// Exportar funciones
module.exports = {
    handleAppointmentFlow,
    showAppointmentWelcome,
    confirmAppointment,
    cancelAppointment
};`;
}

// ===============================================
// Sistema de Gestión de Catálogos
// ===============================================

// Variables globales para catálogos
let currentCatalogType = 'products';
let currentCatalogCategory = null;
let currentCatalogItem = null;
let catalogImageChanged = false;

// Cargar configuración de catálogos cuando se selecciona un flujo
function loadCatalogSettings(flow) {
    if (!flow.catalog) {
        // Inicializar con valores por defecto
        flow.catalog = {
            products: {
                categories: [
                    { id: 'electronics', name: 'Electrónicos', description: 'Productos electrónicos y gadgets' },
                    { id: 'clothing', name: 'Ropa', description: 'Ropa y accesorios' },
                    { id: 'home', name: 'Hogar', description: 'Productos para el hogar' }
                ],
                items: [
                    {
                        id: 'product1',
                        name: 'Smartphone XYZ',
                        description: 'Smartphone de última generación con cámara de 48MP',
                        price: 599.99,
                        category: 'electronics',
                        imageUrl: 'https://via.placeholder.com/100',
                        availability: 'available',
                        options: []
                    },
                    {
                        id: 'product2',
                        name: 'Laptop Pro',
                        description: 'Laptop para profesionales con 16GB RAM y SSD de 512GB',
                        price: 1299.99,
                        category: 'electronics',
                        imageUrl: 'https://via.placeholder.com/100',
                        availability: 'available',
                        options: []
                    },
                    {
                        id: 'product3',
                        name: 'Auriculares Bluetooth',
                        description: 'Auriculares inalámbricos con cancelación de ruido',
                        price: 149.99,
                        category: 'electronics',
                        imageUrl: 'https://via.placeholder.com/100',
                        availability: 'available',
                        options: []
                    }
                ]
            },
            services: {
                categories: [
                    { id: 'consultation', name: 'Consultas', description: 'Servicios de consultoría' },
                    { id: 'maintenance', name: 'Mantenimiento', description: 'Servicios de mantenimiento' },
                    { id: 'installation', name: 'Instalación', description: 'Servicios de instalación' }
                ],
                items: [
                    {
                        id: 'service1',
                        name: 'Consulta Legal',
                        description: 'Asesoría legal en temas civiles y mercantiles',
                        price: 80,
                        priceUnit: 'hora',
                        category: 'consultation',
                        imageUrl: 'https://via.placeholder.com/100',
                        availability: 'available',
                        options: []
                    },
                    {
                        id: 'service2',
                        name: 'Limpieza de Hogar',
                        description: 'Servicio de limpieza profesional para hogares',
                        price: 25,
                        priceUnit: 'hora',
                        category: 'maintenance',
                        imageUrl: 'https://via.placeholder.com/100',
                        availability: 'available',
                        options: []
                    },
                    {
                        id: 'service3',
                        name: 'Reparación de Computadoras',
                        description: 'Reparación y mantenimiento de equipos informáticos',
                        price: 50,
                        priceUnit: 'hora',
                        category: 'maintenance',
                        imageUrl: 'https://via.placeholder.com/100',
                        availability: 'available',
                        options: []
                    }
                ]
            },
            menu: {
                categories: [
                    { id: 'starters', name: 'Entradas', description: 'Para comenzar' },
                    { id: 'main', name: 'Platos Principales', description: 'Especialidades de la casa' },
                    { id: 'desserts', name: 'Postres', description: 'Dulces tentaciones' },
                    { id: 'drinks', name: 'Bebidas', description: 'Para acompañar tu comida' }
                ],
                items: [
                    {
                        id: 'menu1',
                        name: 'Ensalada César',
                        description: 'Lechuga romana, crutones, queso parmesano y aderezo César',
                        price: 8.99,
                        category: 'starters',
                        imageUrl: 'https://via.placeholder.com/100',
                        availability: 'available',
                        options: []
                    },
                    {
                        id: 'menu2',
                        name: 'Pasta Alfredo',
                        description: 'Fettuccine con salsa cremosa de queso parmesano',
                        price: 12.99,
                        category: 'main',
                        imageUrl: 'https://via.placeholder.com/100',
                        availability: 'available',
                        options: []
                    },
                    {
                        id: 'menu3',
                        name: 'Tarta de Chocolate',
                        description: 'Tarta de chocolate con helado de vainilla',
                        price: 6.99,
                        category: 'desserts',
                        imageUrl: 'https://via.placeholder.com/100',
                        availability: 'available',
                        options: []
                    }
                ]
            }
        };
    }

    // Actualizar UI con los valores
    updateCatalogUI(flow.catalog);
}

// Actualizar UI del catálogo
function updateCatalogUI(catalog) {
    // Mostrar el panel del tipo de catálogo actual
    switchCatalogType(currentCatalogType);
}

// Cambiar entre tipos de catálogo
function switchCatalogType(catalogType) {
    // Guardar tipo actual
    currentCatalogType = catalogType;

    // Ocultar todos los paneles
    document.querySelectorAll('.catalog-panel').forEach(panel => {
        panel.style.display = 'none';
    });

    // Mostrar el panel seleccionado
    const panel = document.getElementById(`${catalogType}CatalogPanel`);
    if (panel) {
        panel.style.display = 'block';
    }

    // Actualizar botones de selección
    document.querySelectorAll('.catalog-type-selector .btn').forEach(btn => {
        btn.classList.remove('active');
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-outline-primary');
    });

    const activeButton = document.querySelector(`.catalog-type-selector .btn[onclick*="${catalogType}"]`);
    if (activeButton) {
        activeButton.classList.add('active');
        activeButton.classList.remove('btn-outline-primary');
        activeButton.classList.add('btn-primary');
    }

    // Actualizar contenido del catálogo
    if (currentSelectedFlow !== null && currentFlows && currentFlows[currentSelectedFlow] &&
        currentFlows[currentSelectedFlow].catalog && currentFlows[currentSelectedFlow].catalog[catalogType]) {
        updateCatalogCategories(currentFlows[currentSelectedFlow].catalog[catalogType].categories, catalogType);
        updateCatalogItems(currentFlows[currentSelectedFlow].catalog[catalogType].items, catalogType);
    }
}

// Actualizar categorías del catálogo
function updateCatalogCategories(categories, catalogType) {
    const container = document.getElementById(`${catalogType}Categories`);
    if (!container) return;

    let html = '';

    // Añadir categoría "Todas"
    const totalItems = currentFlows[currentSelectedFlow].catalog[catalogType].items.length;
    html += `
        <div class="category-item ${currentCatalogCategory === null ? 'active' : ''}" onclick="selectCatalogCategory('${catalogType}', null)">
            <span>Todos ${catalogType === 'products' ? 'los productos' : catalogType === 'services' ? 'los servicios' : 'los platos'}</span>
            <span class="badge bg-secondary">${totalItems}</span>
        </div>
    `;

    // Añadir cada categoría
    categories.forEach(category => {
        const itemCount = currentFlows[currentSelectedFlow].catalog[catalogType].items.filter(
            item => item.category === category.id
        ).length;

        html += `
            <div class="category-item ${currentCatalogCategory === category.id ? 'active' : ''}" onclick="selectCatalogCategory('${catalogType}', '${category.id}')">
                <span>${category.name}</span>
                <span class="badge bg-secondary">${itemCount}</span>
            </div>
        `;
    });

    container.innerHTML = html;
}

// Actualizar items del catálogo
function updateCatalogItems(items, catalogType) {
    const container = document.getElementById(`${catalogType}Items`);
    if (!container) return;

    // Filtrar items por categoría si es necesario
    if (currentCatalogCategory) {
        items = items.filter(item => item.category === currentCatalogCategory);
    }

    let html = '';

    if (items.length === 0) {
        html = `
            <div class="empty-state">
                <i class="fas fa-box-open"></i>
                <p>No hay ${catalogType === 'products' ? 'productos' : catalogType === 'services' ? 'servicios' : 'platos'} en esta categoría</p>
            </div>
        `;
    } else {
        // Añadir cada item
        items.forEach(item => {
            html += `
                <div class="catalog-item" data-id="${item.id}">
                    <div class="item-image">
                        <img src="${item.imageUrl || 'https://via.placeholder.com/100'}" alt="${item.name}">
                    </div>
                    <div class="item-details">
                        <h6>${item.name}</h6>
                        <p class="item-description">${item.description || ''}</p>
                        <div class="item-price">$${item.price.toFixed(2)}${item.priceUnit ? '/' + item.priceUnit : ''}</div>
                        <div class="item-actions">
                            <button class="btn btn-sm btn-outline-primary" onclick="editCatalogItem('${catalogType}', '${item.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteCatalogItem('${catalogType}', '${item.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
    }

    container.innerHTML = html;
}

// Seleccionar categoría del catálogo
function selectCatalogCategory(catalogType, categoryId) {
    currentCatalogCategory = categoryId;

    // Actualizar UI
    document.querySelectorAll(`#${catalogType}Categories .category-item`).forEach(item => {
        item.classList.remove('active');
    });

    if (categoryId === null) {
        document.querySelector(`#${catalogType}Categories .category-item:first-child`).classList.add('active');
    } else {
        const categoryItem = Array.from(document.querySelectorAll(`#${catalogType}Categories .category-item`)).find(
            item => item.textContent.includes(getCategoryNameById(catalogType, categoryId))
        );

        if (categoryItem) {
            categoryItem.classList.add('active');
        }
    }

    // Actualizar items
    if (currentSelectedFlow !== null && currentFlows && currentFlows[currentSelectedFlow] &&
        currentFlows[currentSelectedFlow].catalog && currentFlows[currentSelectedFlow].catalog[catalogType]) {
        updateCatalogItems(currentFlows[currentSelectedFlow].catalog[catalogType].items, catalogType);
    }
}

// Obtener nombre de categoría por ID
function getCategoryNameById(catalogType, categoryId) {
    if (currentSelectedFlow === null || !currentFlows || !currentFlows[currentSelectedFlow] ||
        !currentFlows[currentSelectedFlow].catalog || !currentFlows[currentSelectedFlow].catalog[catalogType]) {
        return '';
    }

    const category = currentFlows[currentSelectedFlow].catalog[catalogType].categories.find(
        cat => cat.id === categoryId
    );

    return category ? category.name : '';
}

// Añadir categoría al catálogo
function addCatalogCategory(catalogType) {
    // Mostrar modal
    const modal = document.getElementById('catalogCategoryModal');
    if (!modal) return;

    // Limpiar formulario
    document.getElementById('catalogCategoryForm').reset();

    // Actualizar título
    document.getElementById('catalogCategoryModalTitle').textContent = `Añadir ${catalogType === 'products' ? 'Categoría de Productos' : catalogType === 'services' ? 'Categoría de Servicios' : 'Sección del Menú'}`;

    // Guardar tipo de catálogo actual
    modal.dataset.catalogType = catalogType;

    // Mostrar modal
    modal.style.display = 'flex';
}

// Guardar categoría
function saveCatalogCategory() {
    if (currentSelectedFlow === null || !currentFlows || !currentFlows[currentSelectedFlow]) {
        showNotification('No hay flujo seleccionado', 'warning');
        return;
    }

    const modal = document.getElementById('catalogCategoryModal');
    if (!modal) return;

    const catalogType = modal.dataset.catalogType;
    const categoryName = document.getElementById('categoryName').value.trim();
    const categoryDescription = document.getElementById('categoryDescription').value.trim();

    if (!categoryName) {
        showNotification('El nombre de la categoría es obligatorio', 'warning');
        return;
    }

    // Generar ID a partir del nombre
    const categoryId = 'cat_' + categoryName.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now().toString(36);

    // Crear objeto de categoría
    const category = {
        id: categoryId,
        name: categoryName,
        description: categoryDescription
    };

    // Asegurarse de que exista la estructura
    if (!currentFlows[currentSelectedFlow].catalog) {
        currentFlows[currentSelectedFlow].catalog = {};
    }

    if (!currentFlows[currentSelectedFlow].catalog[catalogType]) {
        currentFlows[currentSelectedFlow].catalog[catalogType] = {
            categories: [],
            items: []
        };
    }

    // Añadir categoría
    currentFlows[currentSelectedFlow].catalog[catalogType].categories.push(category);

    // Actualizar UI
    updateCatalogCategories(currentFlows[currentSelectedFlow].catalog[catalogType].categories, catalogType);

    // Cerrar modal
    closeCatalogCategoryModal();

    showNotification('Categoría añadida correctamente', 'success');
}

// Cerrar modal de categoría
function closeCatalogCategoryModal() {
    const modal = document.getElementById('catalogCategoryModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Añadir item al catálogo
function addCatalogItem(catalogType) {
    // Mostrar modal
    const modal = document.getElementById('catalogItemModal');
    if (!modal) return;

    // Limpiar formulario
    document.getElementById('catalogItemForm').reset();

    // Restablecer vista previa de imagen
    document.getElementById('itemImagePreview').innerHTML = '<img src="https://via.placeholder.com/200" alt="Vista previa">';
    document.getElementById('itemImageUrl').value = '';

    // Vaciar contenedor de opciones
    document.getElementById('itemOptions').innerHTML = '';

    // Actualizar título
    document.getElementById('catalogItemModalTitle').textContent = `Añadir ${catalogType === 'products' ? 'Producto' : catalogType === 'services' ? 'Servicio' : 'Plato'}`;

    // Guardar tipo de catálogo actual
    modal.dataset.catalogType = catalogType;
    modal.dataset.itemId = '';

    // Cargar categorías disponibles
    loadCategoriesForSelect(catalogType);

    // Mostrar modal
    modal.style.display = 'flex';
}

// Editar item del catálogo
function editCatalogItem(catalogType, itemId) {
    if (currentSelectedFlow === null || !currentFlows || !currentFlows[currentSelectedFlow] ||
        !currentFlows[currentSelectedFlow].catalog || !currentFlows[currentSelectedFlow].catalog[catalogType]) {
        return;
    }

    // Buscar item
    const item = currentFlows[currentSelectedFlow].catalog[catalogType].items.find(
        item => item.id === itemId
    );

    if (!item) return;

    // Mostrar modal
    const modal = document.getElementById('catalogItemModal');
    if (!modal) return;

    // Actualizar título
    document.getElementById('catalogItemModalTitle').textContent = `Editar ${catalogType === 'products' ? 'Producto' : catalogType === 'services' ? 'Servicio' : 'Plato'}`;

    // Guardar tipo de catálogo y ID del item
    modal.dataset.catalogType = catalogType;
    modal.dataset.itemId = itemId;

    // Cargar categorías disponibles
    loadCategoriesForSelect(catalogType, item.category);

    // Cargar datos del item
    document.getElementById('itemName').value = item.name || '';
    document.getElementById('itemDescription').value = item.description || '';
    document.getElementById('itemPrice').value = item.price || '';

    if (document.getElementById('itemAvailability')) {
        document.getElementById('itemAvailability').value = item.availability || 'available';
    }

    // Cargar imagen
    if (item.imageUrl) {
        document.getElementById('itemImagePreview').innerHTML = `<img src="${item.imageUrl}" alt="${item.name}">`;
        document.getElementById('itemImageUrl').value = item.imageUrl;
    } else {
        document.getElementById('itemImagePreview').innerHTML = '<img src="https://via.placeholder.com/200" alt="Vista previa">';
        document.getElementById('itemImageUrl').value = '';
    }

    // Cargar opciones
    const optionsContainer = document.getElementById('itemOptions');
    optionsContainer.innerHTML = '';

    if (item.options && item.options.length > 0) {
        item.options.forEach(option => {
            addItemOptionToUI(option.name, option.values);
        });
    }

    // Mostrar modal
    modal.style.display = 'flex';
}

// Cargar categorías para el select
function loadCategoriesForSelect(catalogType, selectedCategoryId = '') {
    if (currentSelectedFlow === null || !currentFlows || !currentFlows[currentSelectedFlow] ||
        !currentFlows[currentSelectedFlow].catalog || !currentFlows[currentSelectedFlow].catalog[catalogType]) {
        return;
    }

    const categories = currentFlows[currentSelectedFlow].catalog[catalogType].categories;
    const selectElement = document.getElementById('itemCategory');

    if (!selectElement) return;

    // Limpiar select
    selectElement.innerHTML = '<option value="">Seleccionar...</option>';

    // Añadir cada categoría
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;

        if (category.id === selectedCategoryId) {
            option.selected = true;
        }

        selectElement.appendChild(option);
    });
}

// Guardar item del catálogo
function saveCatalogItem() {
    if (currentSelectedFlow === null || !currentFlows || !currentFlows[currentSelectedFlow]) {
        showNotification('No hay flujo seleccionado', 'warning');
        return;
    }

    const modal = document.getElementById('catalogItemModal');
    if (!modal) return;

    const catalogType = modal.dataset.catalogType;
    const itemId = modal.dataset.itemId;

    // Validar campos obligatorios
    const itemName = document.getElementById('itemName').value.trim();
    const itemCategory = document.getElementById('itemCategory').value;
    const itemPrice = parseFloat(document.getElementById('itemPrice').value);

    if (!itemName) {
        showNotification('El nombre del item es obligatorio', 'warning');
        return;
    }

    if (!itemCategory) {
        showNotification('La categoría es obligatoria', 'warning');
        return;
    }

    if (isNaN(itemPrice) || itemPrice < 0) {
        showNotification('El precio debe ser un número positivo', 'warning');
        return;
    }

    // Recopilar datos del formulario
    const itemData = {
        name: itemName,
        description: document.getElementById('itemDescription').value.trim(),
        price: itemPrice,
        category: itemCategory,
        availability: document.getElementById('itemAvailability')?.value || 'available',
        imageUrl: document.getElementById('itemImageUrl').value || 'https://via.placeholder.com/100'
    };

    // Si es un servicio, añadir unidad de precio
    if (catalogType === 'services') {
        itemData.priceUnit = 'hora'; // Por defecto
    }

    // Recopilar opciones
    itemData.options = [];
    document.querySelectorAll('#itemOptions .item-option').forEach(optionElem => {
        const optionName = optionElem.querySelector('.option-name').value.trim();
        const optionValues = optionElem.querySelector('.option-values').value.trim();

        if (optionName && optionValues) {
            itemData.options.push({
                name: optionName,
                values: optionValues.split(',').map(v => v.trim())
            });
        }
    });

    // Asegurarse de que exista la estructura
    if (!currentFlows[currentSelectedFlow].catalog) {
        currentFlows[currentSelectedFlow].catalog = {};
    }

    if (!currentFlows[currentSelectedFlow].catalog[catalogType]) {
        currentFlows[currentSelectedFlow].catalog[catalogType] = {
            categories: [],
            items: []
        };
    }

    // Determinar si es una edición o un nuevo item
    if (itemId) {
        // Edición: Buscar el índice del item
        const itemIndex = currentFlows[currentSelectedFlow].catalog[catalogType].items.findIndex(
            item => item.id === itemId
        );

        if (itemIndex !== -1) {
            // Preservar el ID
            itemData.id = itemId;

            // Actualizar item
            currentFlows[currentSelectedFlow].catalog[catalogType].items[itemIndex] = itemData;
        }
    } else {
        // Nuevo: Generar ID
        itemData.id = 'item_' + itemName.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now().toString(36);

        // Añadir item
        currentFlows[currentSelectedFlow].catalog[catalogType].items.push(itemData);
    }

    // Actualizar UI
    updateCatalogItems(currentFlows[currentSelectedFlow].catalog[catalogType].items, catalogType);

    // Cerrar modal
    closeCatalogItemModal();

    showNotification('Item guardado correctamente', 'success');
}

// Cerrar modal de item
function closeCatalogItemModal() {
    const modal = document.getElementById('catalogItemModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Eliminar item del catálogo
function deleteCatalogItem(catalogType, itemId) {
    if (currentSelectedFlow === null || !currentFlows || !currentFlows[currentSelectedFlow] ||
        !currentFlows[currentSelectedFlow].catalog || !currentFlows[currentSelectedFlow].catalog[catalogType]) {
        return;
    }

    // Confirmar eliminación
    if (!confirm('¿Estás seguro de eliminar este elemento del catálogo?')) {
        return;
    }

    // Buscar el índice del item
    const itemIndex = currentFlows[currentSelectedFlow].catalog[catalogType].items.findIndex(
        item => item.id === itemId
    );

    if (itemIndex !== -1) {
        // Eliminar item
        currentFlows[currentSelectedFlow].catalog[catalogType].items.splice(itemIndex, 1);

        // Actualizar UI
        updateCatalogItems(currentFlows[currentSelectedFlow].catalog[catalogType].items, catalogType);

        showNotification('Item eliminado correctamente', 'success');
    }
}

// Añadir opción al item
function addItemOption() {
    addItemOptionToUI('', []);
}

// Añadir opción a la UI
function addItemOptionToUI(name = '', values = []) {
    const container = document.getElementById('itemOptions');
    if (!container) return;

    const optionElem = document.createElement('div');
    optionElem.className = 'item-option';

    optionElem.innerHTML = `
        <div class="input-group mb-2">
            <input type="text" class="form-control option-name" placeholder="Nombre de la opción" value="${name}">
            <input type="text" class="form-control option-values" placeholder="Valores separados por comas" value="${Array.isArray(values) ? values.join(', ') : values}">
            <div class="input-group-append">
                <button class="btn btn-outline-danger" type="button" onclick="this.closest('.item-option').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    `;

    container.appendChild(optionElem);
}

// Solicitar URL de imagen
function enterImageUrl() {
    const url = prompt('Introduce la URL de la imagen:');
    if (url) {
        document.getElementById('itemImageUrl').value = url;
        document.getElementById('itemImagePreview').innerHTML = `<img src="${url}" alt="Vista previa">`;
    }
}

// Importar catálogo
function importCatalog(catalogType) {
    // Crear input de archivo invisible
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.style.display = 'none';

    fileInput.addEventListener('change', function () {
        if (!this.files || !this.files[0]) return;

        const file = this.files[0];
        const reader = new FileReader();

        reader.onload = function (e) {
            try {
                const data = JSON.parse(e.target.result);

                if (!data.categories || !data.items) {
                    throw new Error('Formato de archivo inválido');
                }

                // Confirmar importación
                if (confirm(`¿Importar ${data.categories.length} categorías y ${data.items.length} elementos?`)) {
                    // Guardar datos
                    if (currentSelectedFlow !== null && currentFlows && currentFlows[currentSelectedFlow]) {
                        if (!currentFlows[currentSelectedFlow].catalog) {
                            currentFlows[currentSelectedFlow].catalog = {};
                        }

                        currentFlows[currentSelectedFlow].catalog[catalogType] = data;

                        // Actualizar UI
                        updateCatalogCategories(data.categories, catalogType);
                        updateCatalogItems(data.items, catalogType);

                        showNotification('Catálogo importado correctamente', 'success');
                    }
                }
            } catch (error) {
                console.error('Error importando catálogo:', error);
                showNotification('Error importando catálogo: ' + error.message, 'error');
            }
        };

        reader.readAsText(file);
    });

    document.body.appendChild(fileInput);
    fileInput.click();
    document.body.removeChild(fileInput);
}

// Exportar catálogo
function exportCatalog(catalogType) {
    if (currentSelectedFlow === null || !currentFlows || !currentFlows[currentSelectedFlow] ||
        !currentFlows[currentSelectedFlow].catalog || !currentFlows[currentSelectedFlow].catalog[catalogType]) {
        showNotification('No hay catálogo para exportar', 'warning');
        return;
    }

    const catalog = currentFlows[currentSelectedFlow].catalog[catalogType];

    // Convertir a JSON
    const json = JSON.stringify(catalog, null, 2);

    // Crear blob y link de descarga
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `catalogo_${catalogType}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showNotification('Catálogo exportado correctamente', 'success');
}

// Guardar configuración de catálogo
async function saveCatalogSettings() {
    if (currentSelectedFlow === null || !currentFlows || !currentFlows[currentSelectedFlow]) {
        showNotification('No hay flujo seleccionado para guardar', 'warning');
        return;
    }

    try {
        await saveAllFlowsToServer();
        showNotification('Catálogo guardado correctamente', 'success');

        // Generar flujo para el catálogo
        generateCatalogFlow(currentSelectedFlow);
    } catch (error) {
        console.error('Error guardando catálogo:', error);
        showNotification('Error guardando catálogo: ' + error.message, 'error');
    }
}

// Vista previa del flujo de catálogo
function previewCatalogFlow() {
    if (currentSelectedFlow === null || !currentFlows || !currentFlows[currentSelectedFlow]) {
        showNotification('No hay flujo seleccionado', 'warning');
        return;
    }

    // Generar flujo temporal para vista previa
    const catalogFlowIndex = generateCatalogFlow(currentSelectedFlow, true);

    if (catalogFlowIndex !== -1) {
        // Mostrar vista previa del flujo
        const originalSelectedFlow = currentSelectedFlow;
        currentSelectedFlow = catalogFlowIndex;

        // Mostrar vista previa
        previewFlow();

        // Eliminar el flujo temporal después de cerrar la vista previa
        document.querySelector('#flowPreview .preview-header button').addEventListener('click', function onClose() {
            currentFlows.pop(); // Eliminar el flujo temporal
            currentSelectedFlow = originalSelectedFlow; // Restaurar selección original
            this.removeEventListener('click', onClose);
        }, { once: true });
    }
}

// Generar flujo para el catálogo
function generateCatalogFlow(flowIndex, temporary = false) {
    if (flowIndex === null || !currentFlows || !currentFlows[flowIndex] || !currentFlows[flowIndex].catalog) {
        showNotification('No hay catálogo configurado', 'warning');
        return -1;
    }

    const flow = currentFlows[flowIndex];

    // Verificar si existen flujos de catálogo
    let productFlowIndex = temporary ? -1 : currentFlows.findIndex(f => f.name === 'CATALOGO_PRODUCTOS');
    let serviceFlowIndex = temporary ? -1 : currentFlows.findIndex(f => f.name === 'CATALOGO_SERVICIOS');
    let menuFlowIndex = temporary ? -1 : currentFlows.findIndex(f => f.name === 'MENU_RESTAURANTE');

    // Generar flujos según los catálogos disponibles
    if (flow.catalog.products && flow.catalog.products.items.length > 0) {
        const productFlow = createProductCatalogFlow(flow.catalog.products);

        if (productFlowIndex !== -1) {
            // Actualizar flujo existente
            currentFlows[productFlowIndex] = productFlow;
        } else {
            // Crear nuevo flujo
            if (temporary) {
                currentFlows.push(productFlow);
                return currentFlows.length - 1;
            } else {
                currentFlows.push(productFlow);
            }
        }
    }

    if (flow.catalog.services && flow.catalog.services.items.length > 0) {
        const serviceFlow = createServiceCatalogFlow(flow.catalog.services);

        if (serviceFlowIndex !== -1) {
            // Actualizar flujo existente
            currentFlows[serviceFlowIndex] = serviceFlow;
        } else {
            // Crear nuevo flujo
            if (temporary) {
                currentFlows.push(serviceFlow);
                return currentFlows.length - 1;
            } else {
                currentFlows.push(serviceFlow);
            }
        }
    }

    if (flow.catalog.menu && flow.catalog.menu.items.length > 0) {
        const menuFlow = createMenuCatalogFlow(flow.catalog.menu);

        if (menuFlowIndex !== -1) {
            // Actualizar flujo existente
            currentFlows[menuFlowIndex] = menuFlow;
        } else {
            // Crear nuevo flujo
            if (temporary) {
                currentFlows.push(menuFlow);
                return currentFlows.length - 1;
            } else {
                currentFlows.push(menuFlow);
            }
        }
    }

    // Notificar al usuario
    if (!temporary) {
        showNotification('Flujos de catálogo generados correctamente', 'success');
    }

    return -1;
}

// Crear flujo para catálogo de productos
function createProductCatalogFlow(productCatalog) {
    // Crear flujo base
    const flow = {
        name: 'CATALOGO_PRODUCTOS',
        description: 'Catálogo de productos disponibles',
        steps: [
            'INITIAL',
            'SHOW_CATEGORIES',
            'SHOW_PRODUCTS',
            'PRODUCT_DETAIL',
            'SEARCH_PRODUCTS'
        ],
        options: [],
        messages: {
            welcome: '🛍️ *Catálogo de Productos*\n\nBienvenido a nuestro catálogo. ¿Qué te gustaría ver?',
            categoriesIntro: '📂 *Categorías de Productos*\n\nSelecciona una categoría para ver los productos:',
            productsIntro: '📦 *Productos Disponibles*\n\n',
            productDetail: '🔍 *Detalle del Producto*\n\n',
            searchPrompt: '🔍 Escribe el nombre o descripción del producto que estás buscando:',
            searchResults: '🔍 *Resultados de la Búsqueda*\n\n',
            noResults: '❌ No se encontraron productos que coincidan con tu búsqueda.',
            backToMenu: '⬅️ Volver al Menú Principal',
            backToCategories: '⬅️ Volver a Categorías'
        },
        active: true
    };

    // Añadir opciones principales
    flow.options.push(
        { number: 1, emoji: '📂', text: 'Ver Categorías', action: 'goToStep', actionValue: 'SHOW_CATEGORIES' },
        { number: 2, emoji: '🔍', text: 'Buscar Productos', action: 'goToStep', actionValue: 'SEARCH_PRODUCTS' },
        { number: 3, emoji: '🛒', text: 'Ver Todos los Productos', action: 'goToStep', actionValue: 'SHOW_PRODUCTS' }
    );

    // Añadir opciones de categorías
    flow.messages.categoryOptions = '📂 Selecciona una categoría:\n\n';

    productCatalog.categories.forEach((category, index) => {
        const emoji = getCategoryEmoji(index);
        flow.messages.categoryOptions += `${emoji} ${category.name}\n`;

        // Añadir opción para esta categoría
        flow.options.push({
            number: index + 10, // Empezar después de las opciones principales
            emoji: emoji,
            text: category.name,
            action: 'sendMessage',
            actionValue: `CATEGORY_${category.id}`
        });

        // Añadir mensaje específico para esta categoría
        flow.messages[`CATEGORY_${category.id}`] = `📂 *${category.name}*\n\n${category.description || ''}\n\nProductos en esta categoría:`;
    });

    // Añadir productos
    productCatalog.items.forEach((product, index) => {
        // Crear mensaje de detalle para este producto
        flow.messages[`PRODUCT_${product.id}`] = generateProductDetailMessage(product);

        // Añadir opción para este producto
        flow.options.push({
            number: index + 100, // Empezar después de las opciones de categorías
            emoji: '🛍️',
            text: product.name,
            action: 'sendMessage',
            actionValue: `PRODUCT_${product.id}`
        });
    });

    return flow;
}

// Crear flujo para catálogo de servicios
function createServiceCatalogFlow(serviceCatalog) {
    // Crear flujo base
    const flow = {
        name: 'CATALOGO_SERVICIOS',
        description: 'Catálogo de servicios disponibles',
        steps: [
            'INITIAL',
            'SHOW_CATEGORIES',
            'SHOW_SERVICES',
            'SERVICE_DETAIL',
            'SEARCH_SERVICES',
            'REQUEST_SERVICE'
        ],
        options: [],
        messages: {
            welcome: '🛎️ *Catálogo de Servicios*\n\nBienvenido a nuestro catálogo de servicios. ¿Qué te gustaría ver?',
            categoriesIntro: '📂 *Categorías de Servicios*\n\nSelecciona una categoría para ver los servicios:',
            servicesIntro: '👨‍💼 *Servicios Disponibles*\n\n',
            serviceDetail: '🔍 *Detalle del Servicio*\n\n',
            searchPrompt: '🔍 Escribe el nombre o descripción del servicio que estás buscando:',
            searchResults: '🔍 *Resultados de la Búsqueda*\n\n',
            noResults: '❌ No se encontraron servicios que coincidan con tu búsqueda.',
            requestPrompt: '📝 Por favor, proporciona la siguiente información para solicitar este servicio:\n\n1. Nombre completo\n2. Fecha preferida\n3. Detalles adicionales',
            requestConfirmation: '✅ Hemos recibido tu solicitud. Un asesor se pondrá en contacto contigo pronto para confirmar los detalles.',
            backToMenu: '⬅️ Volver al Menú Principal',
            backToCategories: '⬅️ Volver a Categorías'
        },
        active: true
    };

    // Añadir opciones principales
    flow.options.push(
        { number: 1, emoji: '📂', text: 'Ver Categorías', action: 'goToStep', actionValue: 'SHOW_CATEGORIES' },
        { number: 2, emoji: '🔍', text: 'Buscar Servicios', action: 'goToStep', actionValue: 'SEARCH_SERVICES' },
        { number: 3, emoji: '👨‍💼', text: 'Ver Todos los Servicios', action: 'goToStep', actionValue: 'SHOW_SERVICES' }
    );

    // Añadir opciones de categorías
    flow.messages.categoryOptions = '📂 Selecciona una categoría:\n\n';

    serviceCatalog.categories.forEach((category, index) => {
        const emoji = getCategoryEmoji(index);
        flow.messages.categoryOptions += `${emoji} ${category.name}\n`;

        // Añadir opción para esta categoría
        flow.options.push({
            number: index + 10, // Empezar después de las opciones principales
            emoji: emoji,
            text: category.name,
            action: 'sendMessage',
            actionValue: `CATEGORY_${category.id}`
        });

        // Añadir mensaje específico para esta categoría
        flow.messages[`CATEGORY_${category.id}`] = `📂 *${category.name}*\n\n${category.description || ''}\n\nServicios en esta categoría:`;
    });

    // Añadir servicios
    serviceCatalog.items.forEach((service, index) => {
        // Crear mensaje de detalle para este servicio
        flow.messages[`SERVICE_${service.id}`] = generateServiceDetailMessage(service);

        // Añadir opción para este servicio
        flow.options.push({
            number: index + 100, // Empezar después de las opciones de categorías
            emoji: '🛎️',
            text: service.name,
            action: 'sendMessage',
            actionValue: `SERVICE_${service.id}`
        });
    });

    return flow;
}

// Crear flujo para menú de restaurante
function createMenuCatalogFlow(menuCatalog) {
    // Crear flujo base
    const flow = {
        name: 'MENU_RESTAURANTE',
        description: 'Menú del restaurante',
        steps: [
            'INITIAL',
            'SHOW_SECTIONS',
            'SHOW_MENU',
            'DISH_DETAIL',
            'SEARCH_MENU',
            'ORDER_ITEM'
        ],
        options: [],
        messages: {
            welcome: '🍽️ *Menú del Restaurante*\n\nBienvenido a nuestro menú. ¿Qué te gustaría ver?',
            sectionsIntro: '📋 *Secciones del Menú*\n\nSelecciona una sección para ver los platos:',
            menuIntro: '🍽️ *Platos Disponibles*\n\n',
            dishDetail: '🔍 *Detalle del Plato*\n\n',
            searchPrompt: '🔍 Escribe el nombre o descripción del plato que estás buscando:',
            searchResults: '🔍 *Resultados de la Búsqueda*\n\n',
            noResults: '❌ No se encontraron platos que coincidan con tu búsqueda.',
            orderPrompt: '📝 ¿Cuántas unidades de este plato deseas ordenar?',
            orderConfirmation: '✅ Tu pedido ha sido añadido. ¿Deseas algo más?',
            backToMenu: '⬅️ Volver al Menú Principal',
            backToSections: '⬅️ Volver a Secciones'
        },
        active: true
    };

    // Añadir opciones principales
    flow.options.push(
        { number: 1, emoji: '📋', text: 'Ver Secciones', action: 'goToStep', actionValue: 'SHOW_SECTIONS' },
        { number: 2, emoji: '🔍', text: 'Buscar Platos', action: 'goToStep', actionValue: 'SEARCH_MENU' },
        { number: 3, emoji: '🍽️', text: 'Ver Menú Completo', action: 'goToStep', actionValue: 'SHOW_MENU' }
    );

    // Añadir opciones de secciones
    flow.messages.sectionOptions = '📋 Selecciona una sección:\n\n';

    menuCatalog.categories.forEach((category, index) => {
        const emoji = getFoodCategoryEmoji(category.id, index);
        flow.messages.sectionOptions += `${emoji} ${category.name}\n`;

        // Añadir opción para esta sección
        flow.options.push({
            number: index + 10, // Empezar después de las opciones principales
            emoji: emoji,
            text: category.name,
            action: 'sendMessage',
            actionValue: `CATEGORY_${category.id}`
        });

        // Añadir mensaje específico para esta sección
        flow.messages[`CATEGORY_${category.id}`] = `📋 *${category.name}*\n\n${category.description || ''}\n\nPlatos en esta sección:`;
    });

    // Añadir platos
    menuCatalog.items.forEach((dish, index) => {
        // Crear mensaje de detalle para este plato
        flow.messages[`DISH_${dish.id}`] = generateDishDetailMessage(dish);

        // Añadir opción para este plato
        flow.options.push({
            number: index + 100, // Empezar después de las opciones de secciones
            emoji: '🍽️',
            text: dish.name,
            action: 'sendMessage',
            actionValue: `DISH_${dish.id}`
        });

        // Añadir opción para ordenar este plato
        flow.options.push({
            number: index + 500, // Después de las opciones de platos
            emoji: '🛒',
            text: `Ordenar ${dish.name}`,
            action: 'goToStep',
            actionValue: 'ORDER_ITEM'
        });
    });

    return flow;
}

// Generar mensaje de detalle de producto
function generateProductDetailMessage(product) {
    let message = `🛍️ *${product.name}*\n\n`;

    if (product.description) {
        message += `${product.description}\n\n`;
    }

    message += `💰 Precio: $${product.price.toFixed(2)}\n`;

    if (product.availability) {
        const availabilityText = {
            'available': '✅ Disponible',
            'limited': '⚠️ Existencias Limitadas',
            'outofstock': '❌ Agotado'
        }[product.availability] || '';

        if (availabilityText) {
            message += `${availabilityText}\n`;
        }
    }

    if (product.options && product.options.length > 0) {
        message += '\n*Opciones disponibles:*\n';

        product.options.forEach(option => {
            message += `- ${option.name}: ${option.values.join(', ')}\n`;
        });
    }

    message += '\n1️⃣ Consultar disponibilidad\n';
    message += '2️⃣ Realizar pedido\n';
    message += '3️⃣ Volver al catálogo\n';

    return message;
}

// Generar mensaje de detalle de servicio
function generateServiceDetailMessage(service) {
    let message = `🛎️ *${service.name}*\n\n`;

    if (service.description) {
        message += `${service.description}\n\n`;
    }

    message += `💰 Precio: $${service.price.toFixed(2)}${service.priceUnit ? '/' + service.priceUnit : ''}\n`;

    if (service.availability) {
        const availabilityText = {
            'available': '✅ Disponible',
            'limited': '⚠️ Disponibilidad Limitada',
            'outofstock': '❌ No Disponible Temporalmente'
        }[service.availability] || '';

        if (availabilityText) {
            message += `${availabilityText}\n`;
        }
    }

    if (service.options && service.options.length > 0) {
        message += '\n*Opciones disponibles:*\n';

        service.options.forEach(option => {
            message += `- ${option.name}: ${option.values.join(', ')}\n`;
        });
    }

    message += '\n1️⃣ Solicitar este servicio\n';
    message += '2️⃣ Consultar disponibilidad\n';
    message += '3️⃣ Volver al catálogo\n';

    return message;
}

// Generar mensaje de detalle de plato
function generateDishDetailMessage(dish) {
    let message = `🍽️ *${dish.name}*\n\n`;

    if (dish.description) {
        message += `${dish.description}\n\n`;
    }

    message += `💰 Precio: $${dish.price.toFixed(2)}\n`;

    if (dish.availability) {
        const availabilityText = {
            'available': '✅ Disponible',
            'limited': '⚠️ Últimas Porciones',
            'outofstock': '❌ Agotado'
        }[dish.availability] || '';

        if (availabilityText) {
            message += `${availabilityText}\n`;
        }
    }

    if (dish.options && dish.options.length > 0) {
        message += '\n*Opciones disponibles:*\n';

        dish.options.forEach(option => {
            message += `- ${option.name}: ${option.values.join(', ')}\n`;
        });
    }

    message += '\n🛒 Ordenar este plato\n';
    message += '⬅️ Volver al menú\n';

    return message;
}

// Obtener emoji para categoría
function getCategoryEmoji(index) {
    const emojis = ['📱', '👕', '🏠', '💻', '🛁', '📚', '🎮', '🧸', '🚗', '💍'];
    return emojis[index % emojis.length];
}

// Obtener emoji para categoría de comida
function getFoodCategoryEmoji(categoryId, index) {
    const categoryEmojiMap = {
        'starters': '🥗',
        'appetizers': '🥗',
        'main': '🍲',
        'main_course': '🍲',
        'desserts': '🍰',
        'drinks': '🥤',
        'beverages': '🥤',
        'breakfast': '🍳',
        'lunch': '🍝',
        'dinner': '🍽️',
        'soups': '🍜',
        'salads': '🥗',
        'vegan': '🥬',
        'vegetarian': '🥦',
        'seafood': '🦞',
        'meat': '🥩',
        'chicken': '🍗',
        'pasta': '🍝',
        'pizza': '🍕',
        'sandwiches': '🥪',
        'sushi': '🍣',
        'tacos': '🌮',
        'burgers': '🍔',
        'snacks': '🥨',
        'sides': '🍟'
    };

    // Buscar por ID
    if (categoryId && categoryEmojiMap[categoryId]) {
        return categoryEmojiMap[categoryId];
    }

    // Fallback a lista genérica
    const emojis = ['🍽️', '🥗', '🍲', '🍰', '🥤', '🍝', '🍕', '🍣', '🌮', '🍔'];
    return emojis[index % emojis.length];
}

// ===============================================
// Sistema de Atención al Cliente
// ===============================================

// Cargar configuración de atención al cliente cuando se selecciona un flujo
function loadSupportSettings(flow) {
    if (!flow.support) {
        // Inicializar con valores por defecto
        flow.support = {
            enabled: false,
            pause: {
                enabled: true,
                triggers: 'pausar, pausa, detener, espera, asesor, humano, ayuda',
                pauseMessage: 'La conversación ha sido pausada. Un asesor humano continuará la atención en breve. Gracias por tu paciencia.',
                resumeMessage: 'La conversación automatizada se ha reanudado. ¿En qué más puedo ayudarte?',
                maxDuration: 60 // minutos
            },
            agentPanel: {
                enabled: true,
                url: '',
                admin: {
                    username: 'admin',
                    password: ''
                },
                agents: [
                    {
                        name: 'Juan Pérez',
                        username: 'juanp',
                        password: 'password',
                        status: 'active'
                    },
                    {
                        name: 'María Gómez',
                        username: 'mariag',
                        password: 'password',
                        status: 'active'
                    }
                ]
            },
            notifications: {
                email: {
                    enabled: true,
                    address: '',
                    onPause: true,
                    onHandoff: true,
                    onUrgent: false
                },
                push: {
                    enabled: false
                }
            },
            reports: {
                enabled: true,
                metrics: {
                    conversations: true,
                    pauses: true,
                    handoffs: true,
                    responseTime: true,
                    resolutionTime: true,
                    satisfaction: false
                },
                scheduled: {
                    enabled: false,
                    frequency: 'weekly',
                    email: ''
                }
            }
        };
    }

    // Actualizar UI con los valores
    updateSupportSettingsUI(flow.support);
}

// Actualizar UI con los valores de configuración
function updateSupportSettingsUI(supportSettings) {
    // Estado general
    document.getElementById('supportEnabled').checked = supportSettings.enabled;

    // Configuración de pausa
    document.getElementById('pauseEnabled').checked = supportSettings.pause.enabled;
    document.getElementById('pauseTriggers').value = supportSettings.pause.triggers;
    document.getElementById('pauseMessage').value = supportSettings.pause.pauseMessage;
    document.getElementById('resumeMessage').value = supportSettings.pause.resumeMessage;
    document.getElementById('maxPauseDuration').value = supportSettings.pause.maxDuration;

    // Panel de agentes
    document.getElementById('agentPanelEnabled').checked = supportSettings.agentPanel.enabled;
    document.getElementById('agentPanelUrl').value = supportSettings.agentPanel.url || '';
    document.getElementById('agentAdminUsername').value = supportSettings.agentPanel.admin.username || 'admin';
    document.getElementById('agentAdminPassword').value = supportSettings.agentPanel.admin.password || '';

    // Cargar agentes
    loadAgents(supportSettings.agentPanel.agents);

    // Notificaciones
    document.getElementById('emailNotificationsEnabled').checked = supportSettings.notifications.email.enabled;
    document.getElementById('notificationEmail').value = supportSettings.notifications.email.address || '';
    document.getElementById('notifyOnPause').checked = supportSettings.notifications.email.onPause;
    document.getElementById('notifyOnHandoff').checked = supportSettings.notifications.email.onHandoff;
    document.getElementById('notifyOnUrgent').checked = supportSettings.notifications.email.onUrgent;
    document.getElementById('pushNotificationsEnabled').checked = supportSettings.notifications.push.enabled;

    // Informes y estadísticas
    document.getElementById('reportsEnabled').checked = supportSettings.reports.enabled;
    document.getElementById('metricConversations').checked = supportSettings.reports.metrics.conversations;
    document.getElementById('metricPauses').checked = supportSettings.reports.metrics.pauses;
    document.getElementById('metricHandoffs').checked = supportSettings.reports.metrics.handoffs;
    document.getElementById('metricResponseTime').checked = supportSettings.reports.metrics.responseTime;
    document.getElementById('metricResolutionTime').checked = supportSettings.reports.metrics.resolutionTime;
    document.getElementById('metricSatisfaction').checked = supportSettings.reports.metrics.satisfaction;
    document.getElementById('scheduledReportsEnabled').checked = supportSettings.reports.scheduled.enabled;
    document.getElementById('reportFrequency').value = supportSettings.reports.scheduled.frequency;
    document.getElementById('reportEmail').value = supportSettings.reports.scheduled.email || '';
}

// Cargar agentes en la UI
function loadAgents(agents) {
    const container = document.getElementById('agentsContainer');
    if (!container) return;

    // Limpiar contenedor
    container.innerHTML = '';

    if (!agents || agents.length === 0) {
        // Añadir un agente vacío
        addAgent();
        return;
    }

    // Añadir cada agente
    agents.forEach(agent => {
        const row = document.createElement('div');
        row.className = 'agent-row';
        row.innerHTML = `
            <div class="agent-info">
                <input type="text" class="form-control agent-name" placeholder="Nombre del agente" value="${agent.name || ''}">
                <input type="text" class="form-control agent-username" placeholder="Nombre de usuario" value="${agent.username || ''}">
                <input type="password" class="form-control agent-password" placeholder="Contraseña" value="${agent.password || ''}">
            </div>
            <div class="agent-status">
                <select class="form-control">
                    <option value="active" ${agent.status === 'active' ? 'selected' : ''}>Activo</option>
                    <option value="inactive" ${agent.status === 'inactive' ? 'selected' : ''}>Inactivo</option>
                </select>
            </div>
            <div class="agent-actions">
                <button class="btn btn-sm btn-outline-danger" onclick="removeAgent(this)">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        container.appendChild(row);
    });
}

// Alternar estado de atención al cliente
function toggleSupportEnabled(enabled) {
    if (currentSelectedFlow === null || !currentFlows || !currentFlows[currentSelectedFlow]) {
        return;
    }

    const flow = currentFlows[currentSelectedFlow];
    
    // Inicializar si no existe
    if (!flow.support) {
        flow.support = {};
    }
    
    flow.support.enabled = enabled;
}

// Añadir un nuevo agente
function addAgent() {
    const container = document.getElementById('agentsContainer');
    if (!container) return;

    const row = document.createElement('div');
    row.className = 'agent-row';
    row.innerHTML = `
        <div class="agent-info">
            <input type="text" class="form-control agent-name" placeholder="Nombre del agente">
            <input type="text" class="form-control agent-username" placeholder="Nombre de usuario">
            <input type="password" class="form-control agent-password" placeholder="Contraseña">
        </div>
        <div class="agent-status">
            <select class="form-control">
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
            </select>
        </div>
        <div class="agent-actions">
            <button class="btn btn-sm btn-outline-danger" onclick="removeAgent(this)">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;

    container.appendChild(row);
}

// Eliminar un agente
function removeAgent(button) {
    const row = button.closest('.agent-row');
    if (row) {
        row.remove();
    }
}

// Copiar URL del panel de agentes
function copyAgentPanelUrl() {
    const urlInput = document.getElementById('agentPanelUrl');
    if (!urlInput || !urlInput.value) {
        showNotification('No hay URL para copiar', 'warning');
        return;
    }

    navigator.clipboard.writeText(urlInput.value)
        .then(() => {
            showNotification('URL copiada al portapapeles', 'success');
        })
        .catch(err => {
            console.error('Error al copiar URL:', err);
            showNotification('Error al copiar URL', 'error');
        });
}

// Guardar configuración de atención al cliente
async function saveSupportSettings() {
    if (currentSelectedFlow === null || !currentFlows || !currentFlows[currentSelectedFlow]) {
        showNotification('No hay flujo seleccionado para guardar', 'warning');
        return;
    }

    const flow = currentFlows[currentSelectedFlow];
    
    // Inicializar si no existe
    if (!flow.support) {
        flow.support = {};
    }
    
    // Recopilar datos del formulario
    flow.support.enabled = document.getElementById('supportEnabled').checked;
    
    // Configuración de pausa
    flow.support.pause = {
        enabled: document.getElementById('pauseEnabled').checked,
        triggers: document.getElementById('pauseTriggers').value,
        pauseMessage: document.getElementById('pauseMessage').value,
        resumeMessage: document.getElementById('resumeMessage').value,
        maxDuration: parseInt(document.getElementById('maxPauseDuration').value)
    };
    
    // Panel de agentes
    flow.support.agentPanel = {
        enabled: document.getElementById('agentPanelEnabled').checked,
        url: document.getElementById('agentPanelUrl').value,
        admin: {
            username: document.getElementById('agentAdminUsername').value,
            password: document.getElementById('agentAdminPassword').value
        },
        agents: []
    };
    
    // Recopilar agentes
    document.querySelectorAll('#agentsContainer .agent-row').forEach(row => {
        const nameInput = row.querySelector('.agent-name');
        const usernameInput = row.querySelector('.agent-username');
        const passwordInput = row.querySelector('.agent-password');
        const statusSelect = row.querySelector('.agent-status select');
        
        if (nameInput && usernameInput && nameInput.value.trim() && usernameInput.value.trim()) {
            flow.support.agentPanel.agents.push({
                name: nameInput.value.trim(),
                username: usernameInput.value.trim(),
                password: passwordInput ? passwordInput.value : '',
                status: statusSelect ? statusSelect.value : 'active'
            });
        }
    });
    
    // Notificaciones
    flow.support.notifications = {
        email: {
            enabled: document.getElementById('emailNotificationsEnabled').checked,
            address: document.getElementById('notificationEmail').value,
            onPause: document.getElementById('notifyOnPause').checked,
            onHandoff: document.getElementById('notifyOnHandoff').checked,
            onUrgent: document.getElementById('notifyOnUrgent').checked
        },
        push: {
            enabled: document.getElementById('pushNotificationsEnabled').checked
        }
    };
    
    // Informes y estadísticas
    flow.support.reports = {
        enabled: document.getElementById('reportsEnabled').checked,
        metrics: {
            conversations: document.getElementById('metricConversations').checked,
            pauses: document.getElementById('metricPauses').checked,
            handoffs: document.getElementById('metricHandoffs').checked,
            responseTime: document.getElementById('metricResponseTime').checked,
            resolutionTime: document.getElementById('metricResolutionTime').checked,
            satisfaction: document.getElementById('metricSatisfaction').checked
        },
        scheduled: {
            enabled: document.getElementById('scheduledReportsEnabled').checked,
            frequency: document.getElementById('reportFrequency').value,
            email: document.getElementById('reportEmail').value
        }
    };
    
    // Guardar cambios
    try {
        await saveAllFlowsToServer();
        showNotification('Configuración de atención al cliente guardada correctamente', 'success');
        
        // Generar flujo para soporte si está habilitado
        if (flow.support.enabled) {
            generateSupportFlowCode();
        }
    } catch (error) {
        console.error('Error guardando configuración de atención al cliente:', error);
        showNotification('Error guardando configuración: ' + error.message, 'error');
    }
}

// Generar código para integración de atención al cliente
function generateSupportFlowCode() {
    if (currentSelectedFlow === null || !currentFlows || !currentFlows[currentSelectedFlow] || !currentFlows[currentSelectedFlow].support) {
        showNotification('No hay configuración de atención al cliente para generar código', 'warning');
        return;
    }

    const supportSettings = currentFlows[currentSelectedFlow].support;
    
    // Verificar si ya existe un flujo de soporte
    let supportFlowIndex = currentFlows.findIndex(f => f.name === 'ATENCION_CLIENTE');
    
    if (supportFlowIndex === -1) {
        // Crear un nuevo flujo para soporte
        const supportFlow = createSupportFlow(supportSettings);
        currentFlows.push(supportFlow);
        
        // Actualizar el índice
        supportFlowIndex = currentFlows.length - 1;
    } else {
        // Actualizar flujo existente
        currentFlows[supportFlowIndex] = createSupportFlow(supportSettings);
    }
    
    // Seleccionar el flujo de soporte
    currentSelectedFlow = supportFlowIndex;
    
    // Actualizar UI
    renderFlowsList();
    showFlowEditor();
    loadFlowToEditor(currentFlows[supportFlowIndex]);
    
    // Cambiar a la pestaña de código
    switchFlowTab('code');
    
    showNotification('Código de atención al cliente generado correctamente', 'success');
}

// Crear flujo para atención al cliente
function createSupportFlow(supportSettings) {
    // Crear flujo base
    const flow = {
        name: 'ATENCION_CLIENTE',
        description: 'Sistema de atención al cliente y pausa de conversación',
        steps: [
            'INITIAL',
            'PAUSED',
            'AGENT_CONVERSATION',
            'RESOLVED',
            'FEEDBACK'
        ],
        options: [
            { number: 1, emoji: '👨‍💼', text: 'Hablar con un asesor', action: 'goToStep', actionValue: 'PAUSED' },
            { number: 2, emoji: '✅', text: 'Marcar como resuelto', action: 'goToStep', actionValue: 'RESOLVED' },
            { number: 3, emoji: '📝', text: 'Dejar comentario', action: 'goToStep', actionValue: 'FEEDBACK' }
        ],
        messages: {
            welcome: '👋 Bienvenido al sistema de atención al cliente. ¿En qué podemos ayudarte hoy?',
            paused: supportSettings.pause.pauseMessage,
            resumed: supportSettings.pause.resumeMessage,
            resolved: '✅ Tu consulta ha sido marcada como resuelta. Gracias por contactarnos.',
            feedbackRequest: '📝 Agradecemos tus comentarios. Por favor, cuéntanos tu experiencia con nuestro servicio:',
            feedbackThanks: '¡Gracias por tus comentarios! Nos ayudan a mejorar nuestro servicio.'
        },
        active: true
    };

    // Añadir código JavaScript
    flow.code = generateSupportIntegrationCode(supportSettings);

    return flow;
}

// Generar código para integración de atención al cliente
function generateSupportIntegrationCode(supportSettings) {
    return `// Sistema de Atención al Cliente
// Generado automáticamente - No modificar manualmente

/**
 * Maneja el sistema de atención al cliente y pausa de conversación
 * @param {Object} client - Cliente de WhatsApp
 * @param {Object} message - Mensaje recibido
 * @param {Object} session - Sesión del usuario
 */
async function handleCustomerSupport(client, message, session) {
    const userId = message.from;
    const messageText = message.body.trim();
    
    console.log(\`[Soporte] Procesando mensaje: \${messageText}\`);
    
    try {
        // Verificar si la conversación está pausada
        if (session.conversationPaused) {
            // Registrar mensaje para el agente
            logMessageForAgent(userId, messageText, session);
            
            // Si la conversación está asignada a un agente, no responder automáticamente
            if (session.assignedAgent) {
                console.log(\`[Soporte] Mensaje reenviado al agente \${session.assignedAgent}\`);
                return;
            }
            
            // Si no hay agente asignado, verificar si ha pasado el tiempo máximo de pausa
            const now = Date.now();
            const pauseStartTime = session.pauseStartTime || 0;
            const maxPauseDuration = ${supportSettings.pause.maxDuration} * 60 * 1000; // convertir a milisegundos
            
            if (now - pauseStartTime > maxPauseDuration) {
                // Reanudar conversación automáticamente
                await resumeConversation(client, userId, session);
                
                // Enviar mensaje de reanudación
                await client.sendMessage(userId, "${supportSettings.pause.resumeMessage}");
                
                // Registrar evento en métricas
                logSupportEvent(userId, 'auto_resume', {
                    pauseDuration: (now - pauseStartTime) / 1000 // en segundos
                });
                
                return;
            }
            
            // Si no ha pasado el tiempo máximo, solo notificar que la conversación sigue pausada
            if (!session.pauseReminderSent || now - session.lastPauseReminder > 60000) { // recordar cada minuto
                await client.sendMessage(userId, "Tu conversación sigue pausada. Un asesor te atenderá en breve.");
                session.pauseReminderSent = true;
                session.lastPauseReminder = now;
            }
            
            return;
        }
        
        // Verificar si es un paso específico del flujo
        if (session.step === 'FEEDBACK') {
            // Guardar feedback
            session.feedback = messageText;
            
            // Agradecer feedback
            await client.sendMessage(userId, "${flow.messages.feedbackThanks}");
            
            // Volver al inicio
            session.step = 'INITIAL';
            await client.sendMessage(userId, "${flow.messages.welcome}");
            
            // Registrar evento en métricas
            logSupportEvent(userId, 'feedback_received', {
                feedback: messageText
            });
            
            return;
        }
        
        // Verificar palabras clave para pausar si la conversación no está pausada
        if (${supportSettings.pause.enabled} && checkPauseTrigger(messageText)) {
            await pauseConversation(client, userId, session);
            return;
        }
        
        // Si llegamos aquí, procesar normalmente el mensaje según el flujo
        await processFlowStep(client, userId, messageText, session);
        
    } catch (error) {
        console.error(\`[Soporte] Error procesando mensaje: \${error.message}\`);
        await client.sendMessage(userId, "Lo siento, ha ocurrido un error. Por favor, intenta nuevamente.");
    }
}

/**
 * Verifica si el mensaje contiene palabras clave para pausar
 * @param {string} message - Mensaje del usuario
 * @returns {boolean} - True si se debe pausar
 */
function checkPauseTrigger(message) {
    const triggers = "${supportSettings.pause.triggers}".split(',').map(t => t.trim().toLowerCase());
    const lowerMessage = message.toLowerCase();
    
    return triggers.some(trigger => lowerMessage.includes(trigger));
}

/**
 * Pausa la conversación
 * @param {Object} client - Cliente de WhatsApp
 * @param {string} userId - ID del usuario
 * @param {Object} session - Sesión del usuario
 */
async function pauseConversation(client, userId, session) {
    // Marcar conversación como pausada
    session.conversationPaused = true;
    session.pauseStartTime = Date.now();
    session.step = 'PAUSED';
    
    // Enviar mensaje de pausa
    await client.sendMessage(userId, "${supportSettings.pause.pauseMessage}");
    
    // Notificar a agentes disponibles
    notifyAgentsAboutPause(userId, session);
    
    // Registrar evento en métricas
    logSupportEvent(userId, 'conversation_paused', {
        timestamp: new Date().toISOString()
    });
}

/**
 * Reanuda la conversación
 * @param {Object} client - Cliente de WhatsApp
 * @param {string} userId - ID del usuario
 * @param {Object} session - Sesión del usuario
 */
async function resumeConversation(client, userId, session) {
    // Marcar conversación como no pausada
    session.conversationPaused = false;
    delete session.pauseStartTime;
    delete session.assignedAgent;
    delete session.pauseReminderSent;
    delete session.lastPauseReminder;
    
    // Volver al paso inicial
    session.step = 'INITIAL';
    
    // Registrar evento en métricas
    logSupportEvent(userId, 'conversation_resumed', {
        timestamp: new Date().toISOString()
    });
}

/**
 * Notifica a los agentes disponibles sobre una nueva pausa
 * @param {string} userId - ID del usuario
 * @param {Object} session - Sesión del usuario
 */
function notifyAgentsAboutPause(userId, session) {
    // En una implementación real, esto enviaría notificaciones a agentes disponibles
    // a través de un sistema de tickets, correo electrónico, o un panel de agentes
    
    console.log(\`[Soporte] Nueva conversación pausada: \${userId}\`);
    
    // Si hay notificaciones por correo habilitadas
    if (${supportSettings.notifications.email.enabled} && ${supportSettings.notifications.email.onPause}) {
        const notificationEmail = "${supportSettings.notifications.email.address}";
        if (notificationEmail) {
            console.log(\`[Soporte] Notificación de pausa enviada a \${notificationEmail}\`);
            
            // Aquí iría el código para enviar correo electrónico
            // sendEmail(notificationEmail, 'Nueva conversación pausada', \`Usuario: \${userId}\`);
        }
    }
}

/**
 * Registra mensaje para visualización del agente
 * @param {string} userId - ID del usuario
 * @param {string} message - Mensaje del usuario
 * @param {Object} session - Sesión del usuario
 */
function logMessageForAgent(userId, message, session) {
    // En una implementación real, esto almacenaría el mensaje en una base de datos
    // para que los agentes puedan ver el historial de la conversación
    
    console.log(\`[Soporte] Mensaje de usuario \${userId} guardado: \${message}\`);
    
    // Almacenar mensajes en la sesión para persistencia temporal
    if (!session.pausedMessages) {
        session.pausedMessages = [];
    }
    
    session.pausedMessages.push({
        timestamp: new Date().toISOString(),
        content: message,
        direction: 'incoming'
    });
}

/**
 * Registra eventos de soporte para métricas
 * @param {string} userId - ID del usuario
 * @param {string} eventType - Tipo de evento
 * @param {Object} data - Datos adicionales del evento
 */
function logSupportEvent(userId, eventType, data = {}) {
    // En una implementación real, esto almacenaría eventos en una base de datos
    // para generar métricas e informes
    
    const event = {
        userId,
        eventType,
        timestamp: new Date().toISOString(),
        ...data
    };
    
    console.log(\`[Soporte] Evento registrado: \${JSON.stringify(event)}\`);
    
    // Aquí iría código para almacenar el evento en una base de datos
}

/**
 * Procesa el mensaje según el paso actual del flujo
 * @param {Object} client - Cliente de WhatsApp
 * @param {string} userId - ID del usuario
 * @param {string} message - Mensaje del usuario
 * @param {Object} session - Sesión del usuario
 */
async function processFlowStep(client, userId, message, session) {
    // Establecer paso inicial si no existe
    if (!session.step) {
        session.step = 'INITIAL';
    }
    
    switch (session.step) {
        case 'INITIAL':
            // Mostrar mensaje de bienvenida si es la primera interacción
            if (!session.welcomed) {
                await client.sendMessage(userId, "${flow.messages.welcome}");
                session.welcomed = true;
            } else {
                // Procesar mensaje normal
                await processRegularMessage(client, userId, message, session);
            }
            break;
            
        case 'PAUSED':
            // No debería llegar aquí si se verificó session.conversationPaused
            // pero por si acaso, manejar adecuadamente
            await client.sendMessage(userId, "${supportSettings.pause.pauseMessage}");
            break;
            
        case 'RESOLVED':
            // La conversación fue marcada como resuelta
            session.step = 'INITIAL';
            await client.sendMessage(userId, "${flow.messages.welcome}");
            break;
            
        default:
            // Paso desconocido, volver al inicio
            session.step = 'INITIAL';
            await client.sendMessage(userId, "${flow.messages.welcome}");
            break;
    }
}

/**
 * Procesa mensajes regulares (no asociados a un paso específico)
 * @param {Object} client - Cliente de WhatsApp
 * @param {string} userId - ID del usuario
 * @param {string} message - Mensaje del usuario
 * @param {Object} session - Sesión del usuario
 */
async function processRegularMessage(client, userId, message, session) {
    // Aquí se podría implementar lógica para derivar a otros flujos,
    // o integrar con el sistema de IA para respuestas automáticas
    
    // Por ahora, simplemente ofrecer opciones de soporte
    await client.sendMessage(userId, "¿Cómo puedo ayudarte hoy?\\n\\n1️⃣ Hablar con un asesor\\n2️⃣ Consultar estado\\n3️⃣ Dejar un comentario");
}

// Exportar funciones
module.exports = {
    handleCustomerSupport,
    pauseConversation,
    resumeConversation,
    checkPauseTrigger
};`;
}

// ===============================================
// Sistema de Procesamiento de Lenguaje Natural (NLP)
// ===============================================

// Cargar configuración de NLP cuando se selecciona un flujo
function loadNlpSettings(flow) {
    if (!flow.nlp) {
        // Inicializar con valores por defecto
        flow.nlp = {
            enabled: false,
            provider: {
                name: 'dialogflow',
                apiKey: '',
                projectId: '',
                customUrl: ''
            },
            language: 'es',
            multiLanguage: false,
            confidenceThreshold: 0.6,
            intents: [
                {
                    name: 'saludo',
                    examples: 'Hola, Buenos días, Buenas tardes, Hola qué tal, Saludos',
                    action: 'sendMessage',
                    actionValue: 'mensaje_saludo'
                },
                {
                    name: 'consulta_precio',
                    examples: 'Cuánto cuesta, Cuál es el precio, Precio de, Valor de, Costo de',
                    action: 'goToFlow',
                    actionValue: 'CATALOGO_PRODUCTOS'
                },
                {
                    name: 'agendar_cita',
                    examples: 'Quiero una cita, Agendar cita, Reservar hora, Solicitar turno, Programar visita',
                    action: 'goToFlow',
                    actionValue: 'AGENDA_CITAS'
                }
            ],
            entities: [
                {
                    name: 'producto',
                    type: 'list',
                    values: 'smartphone, laptop, tablet, auriculares, teclado, mouse'
                },
                {
                    name: 'fecha',
                    type: 'pattern',
                    values: 'dd/mm/yyyy, dd-mm-yyyy, hoy, mañana, pasado mañana, próximo lunes'
                },
                {
                    name: 'email',
                    type: 'regex',
                    values: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}'
                }
            ],
            systemEntities: {
                datetime: true,
                location: true,
                person: true,
                number: true,
                email: true,
                phone: true
            },
            fallback: {
                action: 'sendMessage',
                value: 'Lo siento, no he entendido tu mensaje. ¿Podrías reformularlo?'
            }
        };
    }

    // Actualizar UI con los valores
    updateNlpSettingsUI(flow.nlp);
}

// Actualizar UI con los valores de configuración de NLP
function updateNlpSettingsUI(nlpSettings) {
    // Estado general
    document.getElementById('nlpEnabled').checked = nlpSettings.enabled;

    // Configuración del proveedor
    document.getElementById('nlpProvider').value = nlpSettings.provider.name;
    document.getElementById('nlpApiKey').value = nlpSettings.provider.apiKey || '';
    document.getElementById('nlpProjectId').value = nlpSettings.provider.projectId || '';
    document.getElementById('nlpCustomUrl').value = nlpSettings.provider.customUrl || '';

    // Actualizar campos según el proveedor
    updateNlpProviderFields();

    // Configuración general
    document.getElementById('nlpLanguage').value = nlpSettings.language;
    document.getElementById('nlpMultiLanguage').checked = nlpSettings.multiLanguage;
    document.getElementById('nlpConfidenceThreshold').value = nlpSettings.confidenceThreshold;
    document.getElementById('nlpConfidenceValue').textContent = nlpSettings.confidenceThreshold;

    // Intenciones
    loadIntents(nlpSettings.intents);

    // Entidades
    loadEntities(nlpSettings.entities);

    // Entidades del sistema
    document.getElementById('entityDateTime').checked = nlpSettings.systemEntities.datetime;
    document.getElementById('entityLocation').checked = nlpSettings.systemEntities.location;
    document.getElementById('entityPerson').checked = nlpSettings.systemEntities.person;
    document.getElementById('entityNumber').checked = nlpSettings.systemEntities.number;
    document.getElementById('entityEmail').checked = nlpSettings.systemEntities.email;
    document.getElementById('entityPhone').checked = nlpSettings.systemEntities.phone;

    // Fallback
    document.getElementById('nlpFallbackAction').value = nlpSettings.fallback.action;
    document.getElementById('nlpFallbackValue').value = nlpSettings.fallback.value || '';
}

// Cargar intenciones en la UI
function loadIntents(intents) {
    const container = document.getElementById('intentsList');
    if (!container) return;

    // Limpiar contenedor
    container.innerHTML = '';

    if (!intents || intents.length === 0) {
        // Añadir una intención vacía
        addIntent();
        return;
    }

    // Añadir cada intención
    intents.forEach(intent => {
        const row = document.createElement('div');
        row.className = 'intent-row';
        row.innerHTML = `
            <div class="intent-name-col">
                <input type="text" class="form-control" value="${intent.name || ''}">
            </div>
            <div class="intent-examples-col">
                <textarea class="form-control">${intent.examples || ''}</textarea>
            </div>
            <div class="intent-action-col">
                <select class="form-control">
                    <option value="sendMessage" ${intent.action === 'sendMessage' ? 'selected' : ''}>Enviar mensaje</option>
                    <option value="goToFlow" ${intent.action === 'goToFlow' ? 'selected' : ''}>Ir a flujo</option>
                    <option value="goToStep" ${intent.action === 'goToStep' ? 'selected' : ''}>Ir a paso</option>
                </select>
                <input type="text" class="form-control mt-2" placeholder="Valor" value="${intent.actionValue || ''}">
            </div>
            <div class="intent-actions-col">
                <button class="btn btn-sm btn-outline-danger" onclick="removeIntent(this)">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        container.appendChild(row);
    });
}

// Cargar entidades en la UI
function loadEntities(entities) {
    const container = document.getElementById('entitiesList');
    if (!container) return;

    // Limpiar contenedor
    container.innerHTML = '';

    if (!entities || entities.length === 0) {
        // Añadir una entidad vacía
        addEntity();
        return;
    }

    // Añadir cada entidad
    entities.forEach(entity => {
        const row = document.createElement('div');
        row.className = 'entity-row';
        row.innerHTML = `
            <div class="entity-name-col">
                <input type="text" class="form-control" value="${entity.name || ''}">
            </div>
            <div class="entity-type-col">
                <select class="form-control">
                    <option value="list" ${entity.type === 'list' ? 'selected' : ''}>Lista</option>
                    <option value="regex" ${entity.type === 'regex' ? 'selected' : ''}>Expresión regular</option>
                    <option value="pattern" ${entity.type === 'pattern' ? 'selected' : ''}>Patrón</option>
                    <option value="composite" ${entity.type === 'composite' ? 'selected' : ''}>Compuesta</option>
                </select>
            </div>
            <div class="entity-values-col">
                <textarea class="form-control">${entity.values || ''}</textarea>
            </div>
            <div class="entity-actions-col">
                <button class="btn btn-sm btn-outline-danger" onclick="removeEntity(this)">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        container.appendChild(row);
    });
}

// Alternar estado de NLP
function toggleNlpEnabled(enabled) {
    if (currentSelectedFlow === null || !currentFlows || !currentFlows[currentSelectedFlow]) {
        return;
    }

    const flow = currentFlows[currentSelectedFlow];
    
    // Inicializar si no existe
    if (!flow.nlp) {
        flow.nlp = {};
    }
    
    flow.nlp.enabled = enabled;
}

// Actualizar campos según el proveedor de NLP seleccionado
function updateNlpProviderFields() {
    const selectedProvider = document.getElementById('nlpProvider').value;
    const projectIdContainer = document.getElementById('nlpProjectIdContainer');
    const customUrlContainer = document.getElementById('nlpCustomUrlContainer');
    
    // Mostrar/ocultar campos según el proveedor
    if (selectedProvider === 'custom') {
        customUrlContainer.style.display = 'block';
    } else {
        customUrlContainer.style.display = 'none';
    }
    
    if (selectedProvider === 'dialogflow' || selectedProvider === 'rasa') {
        projectIdContainer.style.display = 'block';
    } else {
        projectIdContainer.style.display = 'none';
    }
    
    // Actualizar placeholder del API Key según el proveedor
    const apiKeyInput = document.getElementById('nlpApiKey');
    
    switch (selectedProvider) {
        case 'dialogflow':
            apiKeyInput.placeholder = 'Clave de API de Google Cloud';
            break;
        case 'wit':
            apiKeyInput.placeholder = 'Server Access Token';
            break;
        case 'luis':
            apiKeyInput.placeholder = 'Clave de suscripción';
            break;
        case 'rasa':
            apiKeyInput.placeholder = 'Token de acceso (si se requiere)';
            break;
        case 'custom':
            apiKeyInput.placeholder = 'Clave de API (si se requiere)';
            break;
    }
}

// Actualizar valor del umbral de confianza
function updateNlpConfidenceValue() {
    const value = document.getElementById('nlpConfidenceThreshold').value;
    document.getElementById('nlpConfidenceValue').textContent = value;
}

// Añadir una nueva intención
function addIntent() {
    const container = document.getElementById('intentsList');
    if (!container) return;

    const row = document.createElement('div');
    row.className = 'intent-row';
    row.innerHTML = `
        <div class="intent-name-col">
            <input type="text" class="form-control" placeholder="Nombre de la intención">
        </div>
        <div class="intent-examples-col">
            <textarea class="form-control" placeholder="Ejemplos de frases separados por comas"></textarea>
        </div>
        <div class="intent-action-col">
            <select class="form-control">
                <option value="sendMessage">Enviar mensaje</option>
                <option value="goToFlow">Ir a flujo</option>
                <option value="goToStep">Ir a paso</option>
            </select>
            <input type="text" class="form-control mt-2" placeholder="Valor">
        </div>
        <div class="intent-actions-col">
            <button class="btn btn-sm btn-outline-danger" onclick="removeIntent(this)">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;

    container.appendChild(row);
}

// Eliminar una intención
function removeIntent(button) {
    const row = button.closest('.intent-row');
    if (row) {
        row.remove();
    }
}

// Añadir una nueva entidad
function addEntity() {
    const container = document.getElementById('entitiesList');
    if (!container) return;

    const row = document.createElement('div');
    row.className = 'entity-row';
    row.innerHTML = `
        <div class="entity-name-col">
            <input type="text" class="form-control" placeholder="Nombre de la entidad">
        </div>
        <div class="entity-type-col">
            <select class="form-control">
                <option value="list">Lista</option>
                <option value="regex">Expresión regular</option>
                <option value="pattern">Patrón</option>
                <option value="composite">Compuesta</option>
            </select>
        </div>
        <div class="entity-values-col">
            <textarea class="form-control" placeholder="Valores o ejemplos separados por comas"></textarea>
        </div>
        <div class="entity-actions-col">
            <button class="btn btn-sm btn-outline-danger" onclick="removeEntity(this)">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;

    container.appendChild(row);
}

// Eliminar una entidad
function removeEntity(button) {
    const row = button.closest('.entity-row');
    if (row) {
        row.remove();
    }
}

// Probar intención de NLP
function testNlpIntent() {
    const input = document.getElementById('nlpTestInput').value.trim();
    if (!input) {
        showNotification('Ingresa un texto para probar', 'warning');
        return;
    }

    // Mostrar contenedor de resultado
    const resultContainer = document.getElementById('nlpTestResult');
    resultContainer.style.display = 'block';

    // Obtener intenciones configuradas
    const intents = [];
    document.querySelectorAll('#intentsList .intent-row').forEach(row => {
        const nameInput = row.querySelector('.intent-name-col input');
        const examplesInput = row.querySelector('.intent-examples-col textarea');
        const actionSelect = row.querySelector('.intent-action-col select');
        const actionValueInput = row.querySelector('.intent-action-col input');
        
        if (nameInput && examplesInput && nameInput.value.trim()) {
            intents.push({
                name: nameInput.value.trim(),
                examples: examplesInput.value.trim(),
                action: actionSelect ? actionSelect.value : 'sendMessage',
                actionValue: actionValueInput ? actionValueInput.value.trim() : ''
            });
        }
    });

    // Simular reconocimiento de intención
    const result = simulateIntentRecognition(input, intents);

    // Actualizar UI con el resultado
    document.getElementById('detectedIntent').textContent = result.intent || 'No reconocida';
    
    const confidenceElement = document.getElementById('intentConfidence');
    confidenceElement.style.width = `${result.confidence * 100}%`;
    confidenceElement.textContent = `${Math.round(result.confidence * 100)}%`;
    
    // Ajustar color según nivel de confianza
    if (result.confidence >= 0.7) {
        confidenceElement.style.backgroundColor = '#28a745'; // verde
    } else if (result.confidence >= 0.4) {
        confidenceElement.style.backgroundColor = '#ffc107'; // amarillo
    } else {
        confidenceElement.style.backgroundColor = '#dc3545'; // rojo
    }
    
    // Mostrar entidades detectadas
    const entitiesContainer = document.getElementById('detectedEntities');
    if (result.entities && result.entities.length > 0) {
        entitiesContainer.innerHTML = result.entities.map(entity => 
            `<span class="entity-tag"><span class="entity-name">${entity.entity}:</span> ${entity.value}</span>`
        ).join('');
    } else {
        entitiesContainer.innerHTML = '<span class="no-entities">Ninguna</span>';
    }
    
    // Mostrar acción
    document.getElementById('intentAction').textContent = result.action ? 
        `${result.action} → ${result.actionValue || ''}` : '-';
}

// Simular reconocimiento de intención (para pruebas)
function simulateIntentRecognition(input, intents) {
    const text = input.toLowerCase();
    let bestMatch = null;
    let highestScore = 0;
    
    // Buscar la mejor coincidencia entre las intenciones
    intents.forEach(intent => {
        const examples = intent.examples.split(',').map(ex => ex.trim().toLowerCase());
        
        let intentScore = 0;
        examples.forEach(example => {
            // Calcular similaridad con cada ejemplo
            const similarity = calculateSimilarity(text, example);
            if (similarity > intentScore) {
                intentScore = similarity;
            }
        });
        
        if (intentScore > highestScore) {
            highestScore = intentScore;
            bestMatch = intent;
        }
    });
    
    // Determinar entidades detectadas
    const entities = [];
    
    // Buscar entidades en las tablas configuradas
    document.querySelectorAll('#entitiesList .entity-row').forEach(row => {
        const nameInput = row.querySelector('.entity-name-col input');
        const typeSelect = row.querySelector('.entity-type-col select');
        const valuesInput = row.querySelector('.entity-values-col textarea');
        
        if (nameInput && valuesInput && nameInput.value.trim()) {
            const entityName = nameInput.value.trim();
            const entityType = typeSelect ? typeSelect.value : 'list';
            const entityValues = valuesInput.value.trim().split(',').map(v => v.trim().toLowerCase());
            
            // Búsqueda simple para demostración
            entityValues.forEach(value => {
                if (text.includes(value)) {
                    entities.push({
                        entity: entityName,
                        value: value,
                        type: entityType
                    });
                }
            });
        }
    });
    
    // Añadir algunas entidades del sistema como demostración
    if (text.match(/\d{1,2}\/\d{1,2}\/\d{4}/)) {
        entities.push({
            entity: '@datetime',
            value: text.match(/\d{1,2}\/\d{1,2}\/\d{4}/)[0],
            type: 'system'
        });
    }
    
    if (text.match(/\d+/)) {
        entities.push({
            entity: '@number',
            value: text.match(/\d+/)[0],
            type: 'system'
        });
    }
    
    if (text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)) {
        entities.push({
            entity: '@email',
            value: text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)[0],
            type: 'system'
        });
    }
    
    // Construir resultado
    return {
        intent: bestMatch ? bestMatch.name : null,
        confidence: highestScore,
        entities: entities,
        action: bestMatch ? bestMatch.action : null,
        actionValue: bestMatch ? bestMatch.actionValue : null
    };
}

// Calcular similaridad entre dos textos (método simple para demostración)
function calculateSimilarity(text1, text2) {
    // Implementación simple para demostración
    // En un sistema real se usaría un algoritmo más sofisticado
    
    // Convertir a conjuntos de palabras
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    // Calcular intersección
    const intersection = new Set([...words1].filter(word => words2.has(word)));
    
    // Calcular unión
    const union = new Set([...words1, ...words2]);
    
    // Coeficiente de Jaccard
    return intersection.size / union.size;
}

// Entrenar modelo de NLP
function trainNlpModel() {
    // Mostrar estado de entrenamiento
    const trainingStatus = document.getElementById('trainingStatus');
    const trainButton = document.getElementById('trainButton');
    
    trainingStatus.style.display = 'flex';
    trainButton.disabled = true;
    
    // Simular entrenamiento
    setTimeout(() => {
        trainingStatus.style.display = 'none';
        trainButton.disabled = false;
        
        showNotification('Modelo entrenado correctamente', 'success');
    }, 3000);
}

// Guardar configuración de NLP
async function saveNlpSettings() {
    if (currentSelectedFlow === null || !currentFlows || !currentFlows[currentSelectedFlow]) {
        showNotification('No hay flujo seleccionado para guardar', 'warning');
        return;
    }

    const flow = currentFlows[currentSelectedFlow];
    
    // Inicializar si no existe
    if (!flow.nlp) {
        flow.nlp = {};
    }
    
    // Recopilar datos del formulario
    flow.nlp.enabled = document.getElementById('nlpEnabled').checked;
    
    // Configuración del proveedor
    flow.nlp.provider = {
        name: document.getElementById('nlpProvider').value,
        apiKey: document.getElementById('nlpApiKey').value,
        projectId: document.getElementById('nlpProjectId').value,
        customUrl: document.getElementById('nlpCustomUrl').value
    };
    
    // Configuración general
    flow.nlp.language = document.getElementById('nlpLanguage').value;
    flow.nlp.multiLanguage = document.getElementById('nlpMultiLanguage').checked;
    flow.nlp.confidenceThreshold = parseFloat(document.getElementById('nlpConfidenceThreshold').value);
    
    // Recopilar intenciones
    flow.nlp.intents = [];
    document.querySelectorAll('#intentsList .intent-row').forEach(row => {
        const nameInput = row.querySelector('.intent-name-col input');
        const examplesInput = row.querySelector('.intent-examples-col textarea');
        const actionSelect = row.querySelector('.intent-action-col select');
        const actionValueInput = row.querySelector('.intent-action-col input');
        
        if (nameInput && examplesInput && nameInput.value.trim()) {
            flow.nlp.intents.push({
                name: nameInput.value.trim(),
                examples: examplesInput.value.trim(),
                action: actionSelect ? actionSelect.value : 'sendMessage',
                actionValue: actionValueInput ? actionValueInput.value.trim() : ''
            });
        }
    });
    
    // Recopilar entidades
    flow.nlp.entities = [];
    document.querySelectorAll('#entitiesList .entity-row').forEach(row => {
        const nameInput = row.querySelector('.entity-name-col input');
        const typeSelect = row.querySelector('.entity-type-col select');
        const valuesInput = row.querySelector('.entity-values-col textarea');
        
        if (nameInput && valuesInput && nameInput.value.trim()) {
            flow.nlp.entities.push({
                name: nameInput.value.trim(),
                type: typeSelect ? typeSelect.value : 'list',
                values: valuesInput.value.trim()
            });
        }
    });
    
    // Entidades del sistema
    flow.nlp.systemEntities = {
        datetime: document.getElementById('entityDateTime').checked,
        location: document.getElementById('entityLocation').checked,
        person: document.getElementById('entityPerson').checked,
        number: document.getElementById('entityNumber').checked,
        email: document.getElementById('entityEmail').checked,
        phone: document.getElementById('entityPhone').checked
    };
    
    // Fallback
    flow.nlp.fallback = {
        action: document.getElementById('nlpFallbackAction').value,
        value: document.getElementById('nlpFallbackValue').value
    };
    
    // Guardar cambios
    try {
        await saveAllFlowsToServer();
        showNotification('Configuración de NLP guardada correctamente', 'success');
        
        // Generar flujo para NLP si está habilitado
        if (flow.nlp.enabled) {
            generateNlpFlowCode();
        }
    } catch (error) {
        console.error('Error guardando configuración de NLP:', error);
        showNotification('Error guardando configuración de NLP: ' + error.message, 'error');
    }
}

// Generar código para integración de NLP
function generateNlpFlowCode() {
    if (currentSelectedFlow === null || !currentFlows || !currentFlows[currentSelectedFlow] || !currentFlows[currentSelectedFlow].nlp) {
        showNotification('No hay configuración de NLP para generar código', 'warning');
        return;
    }

    const nlpSettings = currentFlows[currentSelectedFlow].nlp;
    
    // Verificar si ya existe un flujo de NLP
    let nlpFlowIndex = currentFlows.findIndex(f => f.name === 'NLP_INTENT');
    
    if (nlpFlowIndex === -1) {
        // Crear un nuevo flujo para NLP
        const nlpFlow = createNlpFlow(nlpSettings);
        currentFlows.push(nlpFlow);
        
        // Actualizar el índice
        nlpFlowIndex = currentFlows.length - 1;
    } else {
        // Actualizar flujo existente
        currentFlows[nlpFlowIndex] = createNlpFlow(nlpSettings);
    }
    
    // Seleccionar el flujo de NLP
    currentSelectedFlow = nlpFlowIndex;
    
    // Actualizar UI
    renderFlowsList();
    showFlowEditor();
    loadFlowToEditor(currentFlows[nlpFlowIndex]);
    
    // Cambiar a la pestaña de código
    switchFlowTab('code');
    
    showNotification('Código de integración de NLP generado correctamente', 'success');
}

// Crear flujo para NLP
function createNlpFlow(nlpSettings) {
    // Crear flujo base
    const flow = {
        name: 'NLP_INTENT',
        description: 'Sistema de reconocimiento de intenciones con NLP',
        steps: [
            'INITIAL',
            'INTENT_DETECTED',
            'NO_INTENT',
            'COLLECTING_ENTITY',
            'PROCESSING'
        ],
        options: [],
        messages: {
            welcome: '👋 Hola, ¿en qué puedo ayudarte hoy?',
            noIntent: '🤔 No he entendido completamente tu consulta. ¿Podrías expresarla de otra manera?',
            collectingEntity: 'Necesito un poco más de información. Por favor, proporciona un {{entityType}}.',
            processing: '⏳ Procesando tu consulta...'
        },
        active: true
    };

    // Añadir mensajes para intenciones
    nlpSettings.intents.forEach(intent => {
        if (intent.action === 'sendMessage') {
            flow.messages[intent.actionValue] = `Respuesta para intención: ${intent.name}`;
        }
    });

    // Añadir código JavaScript
    flow.code = generateNlpIntegrationCode(nlpSettings);

    return flow;
}

// Generar código para integración de NLP
function generateNlpIntegrationCode(nlpSettings) {
    return `// Sistema de Procesamiento de Lenguaje Natural (NLP)
// Generado automáticamente - No modificar manualmente

/**
 * Maneja mensajes entrantes utilizando NLP para detectar intenciones
 * @param {Object} client - Cliente de WhatsApp
 * @param {Object} message - Mensaje recibido
 * @param {Object} session - Sesión del usuario
 */
async function handleNlpIntent(client, message, session) {
    const userId = message.from;
    const messageText = message.body.trim();
    
    console.log(\`[NLP] Procesando mensaje: \${messageText}\`);
    
    try {
        // Verificar si estamos recolectando entidades específicas
        if (session.collectingEntity) {
            await processEntityCollection(client, userId, messageText, session);
            return;
        }
        
        // Procesar el mensaje con NLP
        const nlpResult = await processNlpMessage(messageText, session);
        
        // Verificar si se detectó una intención con suficiente confianza
        if (nlpResult.intent && nlpResult.confidence >= ${nlpSettings.confidenceThreshold}) {
            console.log(\`[NLP] Intención detectada: \${nlpResult.intent} (confianza: \${nlpResult.confidence})\`);
            
            // Guardar intención y entidades en la sesión
            session.currentIntent = nlpResult.intent;
            session.detectedEntities = nlpResult.entities || [];
            
            // Verificar si necesitamos recolectar entidades adicionales
            const requiredEntities = getRequiredEntitiesForIntent(nlpResult.intent);
            const missingEntity = findMissingRequiredEntity(requiredEntities, nlpResult.entities);
            
            if (missingEntity) {
                // Iniciar proceso de recolección de entidades
                session.collectingEntity = true;
                session.requiredEntityType = missingEntity;
                
                // Solicitar la entidad faltante
                const promptMessage = "${flow.messages.collectingEntity}".replace('{{entityType}}', missingEntity);
                await client.sendMessage(userId, promptMessage);
                
                return;
            }
            
            // Ejecutar acción correspondiente a la intención detectada
            await executeIntentAction(client, userId, nlpResult, session);
            
        } else {
            // No se detectó intención con suficiente confianza
            console.log(\`[NLP] No se detectó intención con suficiente confianza. Mejor coincidencia: \${nlpResult.intent || 'ninguna'} (confianza: \${nlpResult.confidence})\`);
            
            // Usar comportamiento de fallback
            await executeFallbackAction(client, userId, session);
        }
    } catch (error) {
        console.error(\`[NLP] Error procesando mensaje: \${error.message}\`);
        await client.sendMessage(userId, "Lo siento, ha ocurrido un error al procesar tu mensaje. Por favor, intenta nuevamente.");
    }
}

/**
 * Procesa el mensaje con el servicio de NLP
 * @param {string} message - Mensaje a procesar
 * @param {Object} session - Sesión del usuario
 * @returns {Promise<Object>} - Resultado del procesamiento
 */
async function processNlpMessage(message, session) {
    // Implementación actual: simulación local
    // En producción, conectaría con el servicio NLP configurado
    
    return simulateNlpProcessing(message);
}

/**
 * Simula el procesamiento NLP localmente
 * @param {string} message - Mensaje a procesar
 * @returns {Object} - Resultado simulado
 */
function simulateNlpProcessing(message) {
    const text = message.toLowerCase();
    let bestIntent = null;
    let highestScore = 0;
    let entities = [];
    
    // Intenciones configuradas
    const intents = ${JSON.stringify(nlpSettings.intents)};
    
    // Buscar la mejor coincidencia entre las intenciones
    intents.forEach(intent => {
        const examples = intent.examples.split(',').map(ex => ex.trim().toLowerCase());
        
        let intentScore = 0;
        examples.forEach(example => {
            // Calcular similaridad con cada ejemplo
            const similarity = calculateSimilarity(text, example);
            if (similarity > intentScore) {
                intentScore = similarity;
            }
        });
        
        if (intentScore > highestScore) {
            highestScore = intentScore;
            bestIntent = intent;
        }
    });
    
    // Detectar entidades
    const configuredEntities = ${JSON.stringify(nlpSettings.entities)};
    
    configuredEntities.forEach(entity => {
        const values = entity.values.split(',').map(v => v.trim().toLowerCase());
        
        // Estrategia de detección según el tipo
        switch (entity.type) {
            case 'list':
                // Buscar coincidencias exactas
                values.forEach(value => {
                    if (text.includes(value)) {
                        entities.push({
                            entity: entity.name,
                            value: value,
                            confidence: 0.9
                        });
                    }
                });
                break;
                
            case 'regex':
                // Buscar coincidencias con expresión regular
                try {
                    const regex = new RegExp(entity.values, 'i');
                    const match = text.match(regex);
                    if (match) {
                        entities.push({
                            entity: entity.name,
                            value: match[0],
                            confidence: 0.95
                        });
                    }
                } catch (e) {
                    console.error(\`Error en expresión regular para entidad \${entity.name}: \${e.message}\`);
                }
                break;
                
            case 'pattern':
                // Implementación simplificada para patrones
                if (entity.name === 'fecha') {
                    // Buscar fechas en formato dd/mm/yyyy o dd-mm-yyyy
                    const dateMatch = text.match(/\\b(\\d{1,2}[\\/\\-]\\d{1,2}[\\/\\-]\\d{4})\\b/);
                    if (dateMatch) {
                        entities.push({
                            entity: entity.name,
                            value: dateMatch[0],
                            confidence: 0.95
                        });
                    }
                    // Buscar fechas relativas
                    const relativeDates = ['hoy', 'mañana', 'pasado mañana'];
                    relativeDates.forEach(date => {
                        if (text.includes(date)) {
                            entities.push({
                                entity: entity.name,
                                value: date,
                                confidence: 0.9
                            });
                        }
                    });
                }
                break;
        }
    });
    
    // Añadir entidades del sistema si están habilitadas
    const systemEntities = ${JSON.stringify(nlpSettings.systemEntities)};
    
    if (systemEntities.datetime) {
        // Fechas y horas
        const dateTimeMatches = [
            ...text.matchAll(/\\b(\\d{1,2}[\\/\\-]\\d{1,2}[\\/\\-]\\d{4})\\b/g),
            ...text.matchAll(/\\b(\\d{1,2}:\\d{2})\\b/g)
        ];
        
        dateTimeMatches.forEach(match => {
            entities.push({
                entity: '@datetime',
                value: match[0],
                confidence: 0.95
            });
        });
    }
    
    if (systemEntities.number) {
        // Números
        const numberMatches = text.match(/\\b\\d+\\b/g);
        if (numberMatches) {
            numberMatches.forEach(match => {
                entities.push({
                    entity: '@number',
                    value: match,
                    confidence: 0.99
                });
            });
        }
    }
    
    if (systemEntities.email) {
        // Correos electrónicos
        const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/);
        if (emailMatch) {
            entities.push({
                entity: '@email',
                value: emailMatch[0],
                confidence: 0.98
            });
        }
    }
    
    if (systemEntities.phone) {
        // Números de teléfono (patrón simplificado)
        const phoneMatch = text.match(/\\b(\\+?\\d{8,15})\\b/);
        if (phoneMatch) {
            entities.push({
                entity: '@phone',
                value: phoneMatch[0],
                confidence: 0.9
            });
        }
    }
    
    // Construir y retornar resultado
    return {
        intent: bestIntent ? bestIntent.name : null,
        confidence: highestScore,
        entities: entities,
        action: bestIntent ? bestIntent.action : null,
        actionValue: bestIntent ? bestIntent.actionValue : null
    };
}

/**
 * Calcula la similaridad entre dos textos
 * @param {string} text1 - Primer texto
 * @param {string} text2 - Segundo texto
 * @returns {number} - Valor de similaridad (0-1)
 */
function calculateSimilarity(text1, text2) {
    // Implementación simple basada en palabras comunes
    const words1 = new Set(text1.toLowerCase().split(/\\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\\s+/));
    
    // Calcular intersección
    const intersection = new Set([...words1].filter(word => words2.has(word)));
    
    // Calcular unión
    const union = new Set([...words1, ...words2]);
    
    // Coeficiente de Jaccard
    return intersection.size / union.size;
}

/**
 * Obtiene las entidades requeridas para una intención específica
 * @param {string} intentName - Nombre de la intención
 * @returns {Array<string>} - Lista de entidades requeridas
 */
function getRequiredEntitiesForIntent(intentName) {
    // Esta función determinaría qué entidades son necesarias para cada intención
    // Simplificado para este ejemplo
    switch (intentName) {
        case 'consulta_precio':
            return ['producto'];
        case 'agendar_cita':
            return ['fecha'];
        default:
            return [];
    }
}

/**
 * Encuentra la primera entidad requerida que falta
 * @param {Array<string>} requiredEntities - Entidades requeridas
 * @param {Array<Object>} detectedEntities - Entidades detectadas
 * @returns {string|null} - Nombre de la entidad faltante o null
 */
function findMissingRequiredEntity(requiredEntities, detectedEntities) {
    if (!requiredEntities || requiredEntities.length === 0) {
        return null;
    }
    
    const detectedEntityNames = detectedEntities.map(e => e.entity);
    
    for (const required of requiredEntities) {
        if (!detectedEntityNames.includes(required)) {
            return required;
        }
    }
    
    return null;
}

/**
 * Procesa la recolección de entidades
 * @param {Object} client - Cliente de WhatsApp
 * @param {string} userId - ID del usuario
 * @param {string} message - Mensaje del usuario
 * @param {Object} session - Sesión del usuario
 */
async function processEntityCollection(client, userId, message, session) {
    // Extraer entidad del mensaje
    const entityType = session.requiredEntityType;
    const entityResult = extractEntityFromText(message, entityType);
    
    if (entityResult) {
        // Añadir entidad a la lista
        if (!session.detectedEntities) {
            session.detectedEntities = [];
        }
        
        session.detectedEntities.push({
            entity: entityType,
            value: entityResult.value,
            confidence: entityResult.confidence
        });
        
        // Finalizar recolección
        session.collectingEntity = false;
        delete session.requiredEntityType;
        
        // Ahora que tenemos la entidad, ejecutar la acción de la intención
        const nlpResult = {
            intent: session.currentIntent,
            confidence: 1, // Ya validamos la intención anteriormente
            entities: session.detectedEntities,
            action: getIntentAction(session.currentIntent),
            actionValue: getIntentActionValue(session.currentIntent)
        };
        
        await executeIntentAction(client, userId, nlpResult, session);
    } else {
        // No se pudo extraer la entidad, volver a solicitar
        const promptMessage = "${flow.messages.collectingEntity}".replace('{{entityType}}', entityType);
        await client.sendMessage(userId, promptMessage);
    }
}

/**
 * Extrae una entidad específica de un texto
 * @param {string} text - Texto a analizar
 * @param {string} entityType - Tipo de entidad a extraer
 * @returns {Object|null} - Entidad extraída o null
 */
function extractEntityFromText(text, entityType) {
    // Implementación simplificada para este ejemplo
    const lowerText = text.toLowerCase();
    
    // Buscar la entidad según su tipo
    const configuredEntities = ${JSON.stringify(nlpSettings.entities)};
    const entity = configuredEntities.find(e => e.name === entityType);
    
    if (!entity) {
        return null;
    }
    
    // Estrategia de extracción según el tipo
    switch (entity.type) {
        case 'list':
            const values = entity.values.split(',').map(v => v.trim().toLowerCase());
            for (const value of values) {
                if (lowerText.includes(value)) {
                    return {
                        value: value,
                        confidence: 0.9
                    };
                }
            }
            break;
            
        case 'regex':
            try {
                const regex = new RegExp(entity.values, 'i');
                const match = text.match(regex);
                if (match) {
                    return {
                        value: match[0],
                        confidence: 0.95
                    };
                }
            } catch (e) {
                console.error(\`Error en expresión regular para entidad \${entityType}: \${e.message}\`);
            }
            break;
            
        case 'pattern':
            if (entityType === 'fecha') {
                // Buscar fechas en formato dd/mm/yyyy o dd-mm-yyyy
                const dateMatch = text.match(/\\b(\\d{1,2}[\\/\\-]\\d{1,2}[\\/\\-]\\d{4})\\b/);
                if (dateMatch) {
                    return {
                        value: dateMatch[0],
                        confidence: 0.95
                    };
                }
                // Buscar fechas relativas
                const relativeDates = ['hoy', 'mañana', 'pasado mañana'];
                for (const date of relativeDates) {
                    if (lowerText.includes(date)) {
                        return {
                            value: date,
                            confidence: 0.9
                        };
                    }
                }
            }
            break;
    }
    
    // Intentar extraer una entidad del sistema
    const systemEntities = ${JSON.stringify(nlpSettings.systemEntities)};
    
    if (entityType === 'fecha' && systemEntities.datetime) {
        const dateMatch = text.match(/\\b(\\d{1,2}[\\/\\-]\\d{1,2}[\\/\\-]\\d{4})\\b/);
        if (dateMatch) {
            return {
                value: dateMatch[0],
                confidence: 0.95
            };
        }
    }
    
    if (entityType === 'email' && systemEntities.email) {
        const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/);
        if (emailMatch) {
            return {
                value: emailMatch[0],
                confidence: 0.98
            };
        }
    }
    
    if (entityType === 'telefono' && systemEntities.phone) {
        const phoneMatch = text.match(/\\b(\\+?\\d{8,15})\\b/);
        if (phoneMatch) {
            return {
                value: phoneMatch[0],
                confidence: 0.9
            };
        }
    }
    
    // No se encontró la entidad
    return null;
}

/**
 * Obtiene la acción para una intención
 * @param {string} intentName - Nombre de la intención
 * @returns {string} - Acción a ejecutar
 */
function getIntentAction(intentName) {
    const intents = ${JSON.stringify(nlpSettings.intents)};
    const intent = intents.find(i => i.name === intentName);
    return intent ? intent.action : 'sendMessage';
}

/**
 * Obtiene el valor de acción para una intención
 * @param {string} intentName - Nombre de la intención
 * @returns {string} - Valor de la acción
 */
function getIntentActionValue(intentName) {
    const intents = ${JSON.stringify(nlpSettings.intents)};
    const intent = intents.find(i => i.name === intentName);
    return intent ? intent.actionValue : '';
}

/**
 * Ejecuta la acción correspondiente a la intención detectada
 * @param {Object} client - Cliente de WhatsApp
 * @param {string} userId - ID del usuario
 * @param {Object} nlpResult - Resultado del procesamiento NLP
 * @param {Object} session - Sesión del usuario
 */
async function executeIntentAction(client, userId, nlpResult, session) {
    // Informar que estamos procesando
    await client.sendMessage(userId, "${flow.messages.processing}");
    
    const { action, actionValue } = nlpResult;
    
    // Ejecutar acción según su tipo
    switch (action) {
        case 'sendMessage':
            // Buscar mensaje en flujo actual
            let messageToSend = '${flow.messages.noIntent}';
            
            if (actionValue) {
                const messages = ${JSON.stringify(flow.messages)};
                messageToSend = messages[actionValue] || actionValue;
            }
            
            // Reemplazar variables de entidades
            messageToSend = replaceEntityVariables(messageToSend, nlpResult.entities);
            
            await client.sendMessage(userId, messageToSend);
            break;
            
        case 'goToFlow':
            // Transferir a otro flujo
            if (actionValue) {
                console.log(\`[NLP] Redirigiendo al flujo: \${actionValue}\`);
                
                // Reset de la sesión
                session.currentIntent = null;
                session.detectedEntities = null;
                
                // Establecer nuevo flujo
                session.currentFlow = actionValue;
                session.step = 'INITIAL';
                
                // Aquí iría la lógica para cambiar al nuevo flujo
                // Normalmente sería manejado por el controlador principal
            } else {
                await client.sendMessage(userId, "No se ha especificado un flujo para redirigir.");
            }
            break;
            
        case 'goToStep':
            // Ir a un paso específico
            if (actionValue) {
                console.log(\`[NLP] Redirigiendo al paso: \${actionValue}\`);
                
                // Establecer nuevo paso
                session.step = actionValue;
                
                // Aquí iría la lógica para cambiar al nuevo paso
                // Normalmente sería manejado por el controlador principal
            } else {
                await client.sendMessage(userId, "No se ha especificado un paso para redirigir.");
            }
            break;
            
        default:
            await client.sendMessage(userId, "${flow.messages.noIntent}");
            break;
    }
}

/**
 * Ejecuta la acción de fallback cuando no se detecta intención
 * @param {Object} client - Cliente de WhatsApp
 * @param {string} userId - ID del usuario
 * @param {Object} session - Sesión del usuario
 */
async function executeFallbackAction(client, userId, session) {
    const fallback = ${JSON.stringify(nlpSettings.fallback)};
    
    switch (fallback.action) {
        case 'sendMessage':
            await client.sendMessage(userId, fallback.value || "${flow.messages.noIntent}");
            break;
            
        case 'goToFlow':
            if (fallback.value) {
                // Reset de la sesión
                session.currentIntent = null;
                session.detectedEntities = null;
                
                // Establecer nuevo flujo
                session.currentFlow = fallback.value;
                session.step = 'INITIAL';
            } else {
                await client.sendMessage(userId, "${flow.messages.noIntent}");
            }
            break;
            
        case 'goToStep':
            if (fallback.value) {
                session.step = fallback.value;
            } else {
                await client.sendMessage(userId, "${flow.messages.noIntent}");
            }
            break;
            
        case 'useAI':
            // Aquí se integraría con el sistema de IA
            await client.sendMessage(userId, "Permíteme ayudarte con eso...");
            
            // En una implementación real, aquí se llamaría al módulo de IA
            // por ejemplo: await handleAiResponse(client, userId, message, session);
            break;
            
        default:
            await client.sendMessage(userId, "${flow.messages.noIntent}");
            break;
    }
}

/**
 * Reemplaza variables de entidades en un texto
 * @param {string} text - Texto con variables
 * @param {Array<Object>} entities - Entidades detectadas
 * @returns {string} - Texto con variables reemplazadas
 */
function replaceEntityVariables(text, entities) {
    if (!entities || entities.length === 0) {
        return text;
    }
    
    let result = text;
    
    entities.forEach(entity => {
        const entityName = entity.entity.startsWith('@') ? 
            entity.entity.substring(1) : entity.entity;
            
        const placeholder = new RegExp(\`\\{\\{${entityName}\\}\\}\`, 'gi');
        result = result.replace(placeholder, entity.value);
    });
    
    return result;
}

module.exports = {
    handleNlpIntent,
    processNlpMessage,
    calculateSimilarity
};`;
}

// Inicializar eventos cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    // Evento para cambio de proveedor NLP
    const providerSelect = document.getElementById('nlpProvider');
    if (providerSelect) {
        providerSelect.addEventListener('change', updateNlpProviderFields);
    }
    
    // Evento para slider de confianza
    const confidenceSlider = document.getElementById('nlpConfidenceThreshold');
    if (confidenceSlider) {
        confidenceSlider.addEventListener('input', updateNlpConfidenceValue);
    }
    
    // Input de prueba NLP
    const nlpTestInput = document.getElementById('nlpTestInput');
    if (nlpTestInput) {
        nlpTestInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                testNlpIntent();
            }
        });
    }
});

// Gestión de pestañas
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar la pestaña de webhooks
    initWebhooksTab();
    
    // Agregar event listeners para botones de pestañas
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            switchTab(tabName);
        });
    });
});

function switchTab(tabName) {
    // Ocultar todas las pestañas
    const tabPanes = document.querySelectorAll('.tab-pane');
    tabPanes.forEach(pane => {
        pane.style.display = 'none';
    });
    
    // Desactivar todos los botones de pestaña
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.classList.remove('active');
    });
    
    // Mostrar la pestaña seleccionada
    document.getElementById(`flow${tabName.charAt(0).toUpperCase() + tabName.slice(1)}Tab`).style.display = 'block';
    
    // Activar el botón de pestaña
    document.querySelector(`.tab-button[data-tab="${tabName}"]`).classList.add('active');
    
    // Inicializar pestaña específica si es necesario
    if (tabName === 'webhooks') {
        initWebhooksTab();
    }
}

// Inicialización de la pestaña de webhooks
function initWebhooksTab() {
    // Comprobar el estado de webhooks habilitados
    const webhooksEnabled = localStorage.getItem('webhooksEnabled') === 'true';
    document.getElementById('webhooksEnabled').checked = webhooksEnabled;
    toggleWebhooksContainer(webhooksEnabled);
    
    // Cargar webhooks guardados
    loadSavedWebhooks();
    
    // Inicializar otros componentes
    initWebhookSecurityOptions();
    initIncomingWebhooks();
    loadIntegrations();
}

// Gestión de webhooks habilitados
function toggleWebhooksEnabled(enabled) {
    localStorage.setItem('webhooksEnabled', enabled);
    toggleWebhooksContainer(enabled);
}

function toggleWebhooksContainer(enabled) {
    const webhooksContainer = document.querySelector('.webhooks-container');
    if (enabled) {
        webhooksContainer.style.display = 'block';
    } else {
        webhooksContainer.style.display = 'none';
    }
}

// Gestión de webhooks salientes
function loadSavedWebhooks() {
    const savedWebhooks = JSON.parse(localStorage.getItem('outgoingWebhooks') || '[]');
    const webhooksListContainer = document.getElementById('outgoingWebhooksList');
    
    // Si no hay webhooks guardados, mantener los ejemplos predeterminados
    if (savedWebhooks.length === 0) return;
    
    // Limpiar ejemplos predeterminados
    webhooksListContainer.innerHTML = '';
    
    // Cargar webhooks guardados
    savedWebhooks.forEach(webhook => {
        const webhookRow = createWebhookRow(webhook);
        webhooksListContainer.appendChild(webhookRow);
    });
}

function createWebhookRow(webhook = {}) {
    const { event = 'message_received', url = '', method = 'POST' } = webhook;
    
    const webhookRow = document.createElement('div');
    webhookRow.className = 'webhook-row';
    webhookRow.innerHTML = `
        <div class="webhook-event-col">
            <select class="form-control">
                <option value="message_received" ${event === 'message_received' ? 'selected' : ''}>Mensaje recibido</option>
                <option value="message_sent" ${event === 'message_sent' ? 'selected' : ''}>Mensaje enviado</option>
                <option value="conversation_started" ${event === 'conversation_started' ? 'selected' : ''}>Conversación iniciada</option>
                <option value="conversation_ended" ${event === 'conversation_ended' ? 'selected' : ''}>Conversación finalizada</option>
                <option value="step_changed" ${event === 'step_changed' ? 'selected' : ''}>Cambio de paso</option>
                <option value="flow_changed" ${event === 'flow_changed' ? 'selected' : ''}>Cambio de flujo</option>
            </select>
        </div>
        <div class="webhook-url-col">
            <input type="url" class="form-control" value="${url}">
        </div>
        <div class="webhook-method-col">
            <select class="form-control">
                <option value="POST" ${method === 'POST' ? 'selected' : ''}>POST</option>
                <option value="GET" ${method === 'GET' ? 'selected' : ''}>GET</option>
                <option value="PUT" ${method === 'PUT' ? 'selected' : ''}>PUT</option>
            </select>
        </div>
        <div class="webhook-actions-col">
            <button class="btn btn-sm btn-outline-primary" onclick="configureWebhook(this)">
                <i class="fas fa-cog"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger" onclick="removeWebhook(this)">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    return webhookRow;
}

function addOutgoingWebhook() {
    const webhooksList = document.getElementById('outgoingWebhooksList');
    const newWebhookRow = createWebhookRow();
    webhooksList.appendChild(newWebhookRow);
}

function removeWebhook(button) {
    const webhookRow = button.closest('.webhook-row');
    
    // Animación de eliminación
    webhookRow.style.transition = 'opacity 0.3s';
    webhookRow.style.opacity = '0';
    
    setTimeout(() => {
        webhookRow.remove();
    }, 300);
}

function configureWebhook(button) {
    const webhookRow = button.closest('.webhook-row');
    const eventSelect = webhookRow.querySelector('.webhook-event-col select');
    const urlInput = webhookRow.querySelector('.webhook-url-col input');
    const methodSelect = webhookRow.querySelector('.webhook-method-col select');
    
    // Guardar referencia al webhook que se está configurando
    currentWebhookRow = webhookRow;
    
    // Mostrar modal de configuración
    const modal = document.getElementById('webhookConfigModal');
    modal.style.display = 'flex';
    
    // Actualizar título del modal
    document.getElementById('webhookModalTitle').textContent = 
        `Configurar Webhook: ${eventSelect.options[eventSelect.selectedIndex].text}`;
    
    // Cargar configuración guardada si existe
    const webhookData = getWebhookDataFromRow(webhookRow);
    loadWebhookConfigToModal(webhookData);
}

function getWebhookDataFromRow(webhookRow) {
    const eventSelect = webhookRow.querySelector('.webhook-event-col select');
    const urlInput = webhookRow.querySelector('.webhook-url-col input');
    const methodSelect = webhookRow.querySelector('.webhook-method-col select');
    
    return {
        event: eventSelect.value,
        url: urlInput.value,
        method: methodSelect.value,
        // Otros datos se cargarán desde localStorage si existen
        config: getWebhookConfig(eventSelect.value, urlInput.value)
    };
}

function getWebhookConfig(event, url) {
    const savedConfigs = JSON.parse(localStorage.getItem('webhookConfigs') || '{}');
    const configKey = `${event}_${url}`;
    return savedConfigs[configKey] || {
        headers: [
            { key: 'Content-Type', value: 'application/json' },
            { key: 'Authorization', value: 'Bearer token123' }
        ],
        payloadFormat: 'json',
        payloadTemplate: `{
  "event": "{{event}}",
  "timestamp": "{{timestamp}}",
  "conversation": {
    "id": "{{conversation_id}}",
    "user": "{{user_id}}",
    "step": "{{current_step}}",
    "flow": "{{current_flow}}"
  },
  "message": {
    "text": "{{message_text}}",
    "type": "{{message_type}}"
  }
}`,
        conditions: [],
        active: true
    };
}

function loadWebhookConfigToModal(webhookData) {
    const { config } = webhookData;
    
    // Cargar headers
    const headersContainer = document.getElementById('webhookHeadersContainer');
    headersContainer.innerHTML = '';
    
    config.headers.forEach(header => {
        addHeaderToModal(header.key, header.value);
    });
    
    // Cargar formato de payload
    document.getElementById('webhookPayloadFormat').value = config.payloadFormat;
    
    // Cargar plantilla de payload
    document.getElementById('webhookPayloadTemplate').value = config.payloadTemplate;
    
    // Cargar condiciones
    const conditionsContainer = document.getElementById('webhookConditions');
    conditionsContainer.innerHTML = '';
    
    if (config.conditions && config.conditions.length > 0) {
        config.conditions.forEach(condition => {
            addConditionToModal(condition.field, condition.operator, condition.value);
        });
    } else {
        // Añadir una condición vacía por defecto
        addWebhookCondition();
    }
    
    // Cargar estado activo
    document.getElementById('webhookActive').checked = config.active;
}

function addHeaderToModal(key = '', value = '') {
    const headersContainer = document.getElementById('webhookHeadersContainer');
    const headerRow = document.createElement('div');
    headerRow.className = 'header-row';
    headerRow.innerHTML = `
        <div class="input-group mb-2">
            <input type="text" class="form-control header-key" placeholder="Nombre" value="${key}">
            <input type="text" class="form-control header-value" placeholder="Valor" value="${value}">
            <div class="input-group-append">
                <button class="btn btn-outline-danger" type="button" onclick="removeHeaderRow(this)">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    `;
    
    headersContainer.appendChild(headerRow);
}

function addWebhookHeader() {
    addHeaderToModal();
}

function removeHeaderRow(button) {
    const headerRow = button.closest('.header-row');
    headerRow.remove();
}

function addConditionToModal(field = 'flow', operator = 'equals', value = '') {
    const conditionsContainer = document.getElementById('webhookConditions');
    const conditionRow = document.createElement('div');
    conditionRow.className = 'condition-row';
    conditionRow.innerHTML = `
        <select class="form-control condition-field">
            <option value="flow" ${field === 'flow' ? 'selected' : ''}>Flujo</option>
            <option value="step" ${field === 'step' ? 'selected' : ''}>Paso</option>
            <option value="message" ${field === 'message' ? 'selected' : ''}>Mensaje</option>
            <option value="user" ${field === 'user' ? 'selected' : ''}>Usuario</option>
        </select>
        <select class="form-control condition-operator">
            <option value="equals" ${operator === 'equals' ? 'selected' : ''}>igual a</option>
            <option value="not_equals" ${operator === 'not_equals' ? 'selected' : ''}>no igual a</option>
            <option value="contains" ${operator === 'contains' ? 'selected' : ''}>contiene</option>
            <option value="starts_with" ${operator === 'starts_with' ? 'selected' : ''}>comienza con</option>
            <option value="ends_with" ${operator === 'ends_with' ? 'selected' : ''}>termina con</option>
        </select>
        <input type="text" class="form-control condition-value" placeholder="Valor" value="${value}">
        <button type="button" class="btn btn-outline-danger" onclick="removeCondition(this)">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    conditionsContainer.appendChild(conditionRow);
}

function addWebhookCondition() {
    addConditionToModal();
}

function removeCondition(button) {
    const conditionRow = button.closest('.condition-row');
    conditionRow.remove();
}

let currentWebhookRow = null;

function closeWebhookModal() {
    const modal = document.getElementById('webhookConfigModal');
    modal.style.display = 'none';
    currentWebhookRow = null;
}

function saveWebhookConfig() {
    if (!currentWebhookRow) return;
    
    // Obtener datos del webhook
    const eventSelect = currentWebhookRow.querySelector('.webhook-event-col select');
    const urlInput = currentWebhookRow.querySelector('.webhook-url-col input');
    
    // Recopilar headers
    const headers = [];
    document.querySelectorAll('#webhookHeadersContainer .header-row').forEach(row => {
        const keyInput = row.querySelector('.header-key');
        const valueInput = row.querySelector('.header-value');
        if (keyInput.value.trim()) {
            headers.push({
                key: keyInput.value.trim(),
                value: valueInput.value
            });
        }
    });
    
    // Recopilar condiciones
    const conditions = [];
    document.querySelectorAll('#webhookConditions .condition-row').forEach(row => {
        const fieldSelect = row.querySelector('.condition-field');
        const operatorSelect = row.querySelector('.condition-operator');
        const valueInput = row.querySelector('.condition-value');
        if (valueInput.value.trim()) {
            conditions.push({
                field: fieldSelect.value,
                operator: operatorSelect.value,
                value: valueInput.value.trim()
            });
        }
    });
    
    // Crear objeto de configuración
    const config = {
        headers,
        payloadFormat: document.getElementById('webhookPayloadFormat').value,
        payloadTemplate: document.getElementById('webhookPayloadTemplate').value,
        conditions,
        active: document.getElementById('webhookActive').checked
    };
    
    // Guardar configuración en localStorage
    const savedConfigs = JSON.parse(localStorage.getItem('webhookConfigs') || '{}');
    const configKey = `${eventSelect.value}_${urlInput.value}`;
    savedConfigs[configKey] = config;
    localStorage.setItem('webhookConfigs', JSON.stringify(savedConfigs));
    
    // Mostrar notificación de éxito
    showNotification('Configuración de webhook guardada correctamente', 'success');
    
    // Cerrar modal
    closeWebhookModal();
}

function testWebhook() {
    const testResult = document.getElementById('webhookTestResult');
    testResult.style.display = 'block';
    
    // Simular prueba (en una aplicación real, esto haría una solicitud real)
    const statusIcon = testResult.querySelector('.status-icon');
    const statusText = testResult.querySelector('.status-text');
    const testStatus = document.getElementById('webhookTestStatus');
    const testTime = document.getElementById('webhookTestTime');
    
    // Simulación de éxito/fracaso (80% de probabilidad de éxito)
    const success = Math.random() > 0.2;
    
    if (success) {
        statusIcon.className = 'status-icon success';
        statusIcon.innerHTML = '<i class="fas fa-check-circle"></i>';
        statusText.textContent = 'Webhook enviado exitosamente';
        testStatus.textContent = '200 OK';
        testTime.textContent = `${Math.floor(Math.random() * 400) + 100}ms`;
    } else {
        statusIcon.className = 'status-icon error';
        statusIcon.innerHTML = '<i class="fas fa-times-circle"></i>';
        statusText.textContent = 'Error al enviar webhook';
        testStatus.textContent = '404 Not Found';
        testTime.textContent = `${Math.floor(Math.random() * 600) + 200}ms`;
    }
}

// Opciones de seguridad de webhooks
function initWebhookSecurityOptions() {
    const webhookSecretEnabled = localStorage.getItem('webhookSecretEnabled') === 'true';
    document.getElementById('webhookSecretEnabled').checked = webhookSecretEnabled;
    
    const webhookSecretContainer = document.getElementById('webhookSecretContainer');
    webhookSecretContainer.style.display = webhookSecretEnabled ? 'flex' : 'none';
    
    document.getElementById('webhookSecretEnabled').addEventListener('change', function() {
        webhookSecretContainer.style.display = this.checked ? 'flex' : 'none';
        localStorage.setItem('webhookSecretEnabled', this.checked);
    });
    
    // Inicializar opciones de reintentos
    const webhookRetryEnabled = localStorage.getItem('webhookRetryEnabled') === 'true';
    document.getElementById('webhookRetryEnabled').checked = webhookRetryEnabled;
    
    const webhookRetryContainer = document.getElementById('webhookRetryContainer');
    webhookRetryContainer.style.display = webhookRetryEnabled ? 'flex' : 'none';
    
    document.getElementById('webhookRetryEnabled').addEventListener('change', function() {
        webhookRetryContainer.style.display = this.checked ? 'flex' : 'none';
        localStorage.setItem('webhookRetryEnabled', this.checked);
    });
}

function generateWebhookSecret() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const length = 32;
    
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    document.getElementById('webhookSecret').value = result;
}

// Webhooks entrantes
function initIncomingWebhooks() {
    // Inicializar URL del webhook entrante
    const incomingWebhookUrl = localStorage.getItem('incomingWebhookUrl');
    if (!incomingWebhookUrl) {
        const randomId = Math.random().toString(36).substring(2, 15);
        const newUrl = `https://tudominio.com/api/webhook/incoming/${randomId}`;
        localStorage.setItem('incomingWebhookUrl', newUrl);
        document.getElementById('incomingWebhookUrl').value = newUrl;
    } else {
        document.getElementById('incomingWebhookUrl').value = incomingWebhookUrl;
    }
    
    // Inicializar opciones de seguridad
    const securityType = localStorage.getItem('incomingWebhookSecurity') || 'token';
    document.getElementById('incomingWebhookSecurity').value = securityType;
    
    // Mostrar/ocultar contenedor de token según la seguridad seleccionada
    updateIncomingSecurityUI(securityType);
    
    // Event listener para cambios en el tipo de seguridad
    document.getElementById('incomingWebhookSecurity').addEventListener('change', function() {
        updateIncomingSecurityUI(this.value);
        localStorage.setItem('incomingWebhookSecurity', this.value);
    });
}

function updateIncomingSecurityUI(securityType) {
    const tokenContainer = document.getElementById('incomingSecurityTokenContainer');
    tokenContainer.style.display = securityType === 'token' ? 'block' : 'none';
}

function copyIncomingWebhookUrl() {
    const urlInput = document.getElementById('incomingWebhookUrl');
    urlInput.select();
    document.execCommand('copy');
    
    // Mostrar notificación
    showNotification('URL copiada al portapapeles', 'success');
}

function generateIncomingToken() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const length = 24;
    
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    document.getElementById('incomingSecurityToken').value = result;
}

function addIncomingAction() {
    const actionsList = document.getElementById('incomingActionsList');
    const actionRow = document.createElement('div');
    actionRow.className = 'action-row';
    actionRow.innerHTML = `
        <div class="action-key-col">
            <input type="text" class="form-control" value="nueva_accion">
        </div>
        <div class="action-description-col">
            <input type="text" class="form-control" value="Nueva acción personalizada">
        </div>
        <div class="action-enabled-col">
            <div class="form-check">
                <input class="form-check-input" type="checkbox" checked>
            </div>
        </div>
        <div class="action-actions-col">
            <button class="btn btn-sm btn-outline-primary" onclick="configureAction(this)">
                <i class="fas fa-cog"></i>
            </button>
        </div>
    `;
    
    actionsList.appendChild(actionRow);
}

let currentActionRow = null;

function configureAction(button) {
    const actionRow = button.closest('.action-row');
    currentActionRow = actionRow;
    
    const actionKey = actionRow.querySelector('.action-key-col input').value;
    
    // Mostrar modal de configuración
    const modal = document.getElementById('actionConfigModal');
    modal.style.display = 'flex';
    
    // Actualizar título del modal
    document.getElementById('actionModalTitle').textContent = `Configurar Acción: ${actionKey}`;
    
    // Cargar configuración guardada si existe
    loadActionConfigToModal(actionKey);
    
    // Event listener para cambiar la implementación
    document.getElementById('actionImplementation').addEventListener('change', function() {
        const customCodeContainer = document.getElementById('actionCustomCodeContainer');
        customCodeContainer.style.display = this.value === 'custom' ? 'block' : 'none';
    });
}

function loadActionConfigToModal(actionKey) {
    const savedActions = JSON.parse(localStorage.getItem('incomingActions') || '{}');
    const actionConfig = savedActions[actionKey] || {
        params: [
            { name: 'user_id', type: 'string', required: true },
            { name: 'message', type: 'string', required: true }
        ],
        implementation: 'sendMessage',
        customCode: `async function customAction(client, params, session) {
  // Implementación personalizada
  const userId = params.user_id;
  const message = params.message;
  
  // Enviar mensaje al usuario
  await client.sendMessage(userId, message);
  
  return { success: true };
}`,
        testJson: `{
  "user_id": "1234567890",
  "message": "Este es un mensaje de prueba"
}`,
        responseEnabled: true,
        responseFormat: 'json'
    };
    
    // Cargar parámetros
    const paramsContainer = document.getElementById('actionParamsContainer');
    paramsContainer.innerHTML = '';
    
    actionConfig.params.forEach(param => {
        addParamToModal(param.name, param.type, param.required);
    });
    
    // Cargar implementación
    document.getElementById('actionImplementation').value = actionConfig.implementation;
    
    // Mostrar/ocultar código personalizado
    const customCodeContainer = document.getElementById('actionCustomCodeContainer');
    customCodeContainer.style.display = actionConfig.implementation === 'custom' ? 'block' : 'none';
    
    // Cargar código personalizado
    document.getElementById('actionCustomCode').value = actionConfig.customCode;
    
    // Cargar JSON de prueba
    document.getElementById('actionTestJson').value = actionConfig.testJson;
    
    // Cargar opciones de respuesta
    document.getElementById('actionResponseEnabled').checked = actionConfig.responseEnabled;
    document.getElementById('actionResponseFormat').value = actionConfig.responseFormat;
}

function addParamToModal(name = '', type = 'string', required = true) {
    const paramsContainer = document.getElementById('actionParamsContainer');
    const paramRow = document.createElement('div');
    paramRow.className = 'param-row';
    paramRow.innerHTML = `
        <div class="input-group mb-2">
            <input type="text" class="form-control param-name" placeholder="Nombre del parámetro" value="${name}">
            <select class="form-control param-type">
                <option value="string" ${type === 'string' ? 'selected' : ''}>Texto</option>
                <option value="number" ${type === 'number' ? 'selected' : ''}>Número</option>
                <option value="boolean" ${type === 'boolean' ? 'selected' : ''}>Booleano</option>
                <option value="object" ${type === 'object' ? 'selected' : ''}>Objeto</option>
            </select>
            <div class="form-check form-check-inline ml-2">
                <input class="form-check-input param-required" type="checkbox" ${required ? 'checked' : ''}>
                <label class="form-check-label">Requerido</label>
            </div>
            <div class="input-group-append">
                <button class="btn btn-outline-danger" type="button" onclick="removeParamRow(this)">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    `;
    
    paramsContainer.appendChild(paramRow);
}

function addActionParam() {
    addParamToModal();
}

function removeParamRow(button) {
    const paramRow = button.closest('.param-row');
    paramRow.remove();
}

function closeActionModal() {
    const modal = document.getElementById('actionConfigModal');
    modal.style.display = 'none';
    currentActionRow = null;
}

function saveActionConfig() {
    if (!currentActionRow) return;
    
    const actionKey = currentActionRow.querySelector('.action-key-col input').value;
    
    // Recopilar parámetros
    const params = [];
    document.querySelectorAll('#actionParamsContainer .param-row').forEach(row => {
        const nameInput = row.querySelector('.param-name');
        const typeSelect = row.querySelector('.param-type');
        const requiredCheck = row.querySelector('.param-required');
        
        if (nameInput.value.trim()) {
            params.push({
                name: nameInput.value.trim(),
                type: typeSelect.value,
                required: requiredCheck.checked
            });
        }
    });
    
    // Crear objeto de configuración
    const actionConfig = {
        params,
        implementation: document.getElementById('actionImplementation').value,
        customCode: document.getElementById('actionCustomCode').value,
        testJson: document.getElementById('actionTestJson').value,
        responseEnabled: document.getElementById('actionResponseEnabled').checked,
        responseFormat: document.getElementById('actionResponseFormat').value
    };
    
    // Guardar configuración en localStorage
    const savedActions = JSON.parse(localStorage.getItem('incomingActions') || '{}');
    savedActions[actionKey] = actionConfig;
    localStorage.setItem('incomingActions', JSON.stringify(savedActions));
    
    // Mostrar notificación de éxito
    showNotification('Configuración de acción guardada correctamente', 'success');
    
    // Cerrar modal
    closeActionModal();
}

// Integraciones externas
function loadIntegrations() {
    // En una aplicación real, se cargarían las integraciones desde un servidor
    // Aquí simplemente actualizamos la UI basada en localStorage
    
    const connectedIntegrations = JSON.parse(localStorage.getItem('connectedIntegrations') || '["hubspot"]');
    
    document.querySelectorAll('.integration-card').forEach(card => {
        const integration = card.querySelector('.integration-details h5').textContent.toLowerCase().replace(/\s+/g, '_');
        const statusBadge = card.querySelector('.integration-status .badge');
        
        if (connectedIntegrations.includes(integration)) {
            statusBadge.className = 'badge bg-success';
            statusBadge.textContent = 'Conectado';
        } else {
            statusBadge.className = 'badge bg-secondary';
            statusBadge.textContent = 'No conectado';
        }
    });
}

let currentIntegration = null;

function configureIntegration(integration) {
    currentIntegration = integration;
    
    // Mostrar modal de configuración
    const modal = document.getElementById('integrationModal');
    modal.style.display = 'flex';
    
    // Actualizar título del modal
    let integrationName = '';
    switch (integration) {
        case 'google_sheets': integrationName = 'Google Sheets'; break;
        case 'hubspot': integrationName = 'HubSpot'; break;
        case 'slack': integrationName = 'Slack'; break;
        case 'zapier': integrationName = 'Zapier'; break;
        case 'woocommerce': integrationName = 'WooCommerce'; break;
        case 'google_forms': integrationName = 'Google Forms'; break;
        default: integrationName = integration;
    }
    
    document.getElementById('integrationModalTitle').textContent = `Configurar Integración: ${integrationName}`;
    
    // Cargar contenido dinámico según la integración
    loadIntegrationModalContent(integration);
}

function loadIntegrationModalContent(integration) {
    const modalBody = document.getElementById('integrationModalBody');
    
    // Contenido específico para cada integración
    let content = '';
    
    switch (integration) {
        case 'google_sheets':
            content = `
                <div class="form-group">
                    <label>Autenticación de Google</label>
                    <p>Para conectar con Google Sheets, necesitas autorizar esta aplicación.</p>
                    <button class="btn btn-primary" onclick="authenticateGoogle()">
                        <i class="fab fa-google"></i> Conectar con Google
                    </button>
                </div>
                
                <div class="form-group" id="googleSheetsContainer" style="display: none;">
                    <label>ID de la hoja de cálculo</label>
                    <input type="text" class="form-control" id="googleSheetId" placeholder="Ej: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms">
                    <div class="form-text text-muted">ID de la hoja de cálculo que encontrarás en la URL</div>
                    
                    <div class="form-group mt-3">
                        <label>Nombre de la hoja</label>
                        <input type="text" class="form-control" id="googleSheetName" placeholder="Ej: Hoja1">
                    </div>
                    
                    <div class="form-group mt-3">
                        <label>Mapeo de campos</label>
                        <div id="googleSheetsMappingContainer">
                            <div class="mapping-row">
                                <div class="input-group mb-2">
                                    <input type="text" class="form-control mapping-bot-field" placeholder="Campo del bot" value="user_id">
                                    <input type="text" class="form-control mapping-sheet-field" placeholder="Columna en la hoja" value="ID de Usuario">
                                    <div class="input-group-append">
                                        <button class="btn btn-outline-danger" type="button" onclick="removeMappingRow(this)">
                                            <i class="fas fa-times"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button class="btn btn-sm btn-outline-secondary" onclick="addGoogleSheetsMapping()">
                            <i class="fas fa-plus"></i> Añadir Mapeo
                        </button>
                    </div>
                </div>
            `;
            break;
            
        case 'hubspot':
            content = `
                <div class="form-group">
                    <label>Estado de la conexión</label>
                    <div class="alert alert-success">
                        <i class="fas fa-check-circle"></i> Conectado a HubSpot
                    </div>
                    <p>Cuenta: <strong>MiEmpresa (empresa@ejemplo.com)</strong></p>
                    <button class="btn btn-outline-danger" onclick="disconnectIntegration('hubspot')">
                        <i class="fas fa-unlink"></i> Desconectar
                    </button>
                </div>
                
                <div class="form-group mt-4">
                    <label>Sincronización de contactos</label>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" id="hubspotSyncContacts" checked>
                        <label class="form-check-label" for="hubspotSyncContacts">
                            Sincronizar usuarios del bot como contactos en HubSpot
                        </label>
                    </div>
                </div>
                
                <div class="form-group mt-3">
                    <label>Mapeo de propiedades de contacto</label>
                    <div id="hubspotMappingContainer">
                        <div class="mapping-row">
                            <div class="input-group mb-2">
                                <input type="text" class="form-control mapping-bot-field" placeholder="Campo del bot" value="user_email">
                                <input type="text" class="form-control mapping-hubspot-field" placeholder="Propiedad en HubSpot" value="email">
                                <div class="input-group-append">
                                    <button class="btn btn-outline-danger" type="button" onclick="removeMappingRow(this)">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <button class="btn btn-sm btn-outline-secondary" onclick="addHubspotMapping()">
                        <i class="fas fa-plus"></i> Añadir Mapeo
                    </button>
                </div>
                
                <div class="form-group mt-4">
                    <label>Eventos de HubSpot</label>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" id="hubspotCreateDeal" checked>
                        <label class="form-check-label" for="hubspotCreateDeal">
                            Crear oportunidad cuando se completa una conversación
                        </label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" id="hubspotLogActivity">
                        <label class="form-check-label" for="hubspotLogActivity">
                            Registrar conversaciones como actividades
                        </label>
                    </div>
                </div>
            `;
            break;
            
        case 'slack':
            content = `
                <div class="form-group">
                    <label>Conectar con Slack</label>
                    <p>Para recibir notificaciones en Slack, necesitas autorizar esta aplicación.</p>
                    <button class="btn btn-primary" onclick="authenticateSlack()">
                        <i class="fab fa-slack"></i> Conectar con Slack
                    </button>
                </div>
                
                <div class="form-group mt-4" id="slackConfigContainer" style="display: none;">
                    <label>Canal de Slack</label>
                    <select class="form-control" id="slackChannel">
                        <option value="#general">#general</option>
                        <option value="#soporte">#soporte</option>
                        <option value="#ventas">#ventas</option>
                    </select>
                    
                    <div class="form-group mt-3">
                        <label>Eventos para notificar</label>
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="slackNotifyNewConversation" checked>
                            <label class="form-check-label" for="slackNotifyNewConversation">
                                Nuevas conversaciones
                            </label>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="slackNotifyCompletedConversation" checked>
                            <label class="form-check-label" for="slackNotifyCompletedConversation">
                                Conversaciones completadas
                            </label>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="slackNotifyFailedConversation">
                            <label class="form-check-label" for="slackNotifyFailedConversation">
                                Conversaciones fallidas
                            </label>
                        </div>
                    </div>
                    
                    <div class="form-group mt-3">
                        <label>Formato de mensaje</label>
                        <textarea class="form-control" id="slackMessageFormat" rows="4">Nueva conversación iniciada:
- Usuario: {{user_name}} ({{user_id}})
- Flujo: {{flow_name}}
- Tiempo: {{timestamp}}</textarea>
                    </div>
                </div>
            `;
            break;
            
        // Contenido similar para otras integraciones...
        default:
            content = `
                <div class="form-group">
                    <label>Configuración para ${integration}</label>
                    <p>Esta integración aún no está completamente implementada.</p>
                    <p>Por favor, consulta la documentación para más información.</p>
                </div>
            `;
    }
    
    modalBody.innerHTML = content;
}

function authenticateGoogle() {
    // En una aplicación real, esto abriría el flujo de OAuth2 de Google
    // Aquí simplemente simulamos una autenticación exitosa
    
    showNotification('Autenticando con Google...', 'info');
    
    setTimeout(() => {
        document.getElementById('googleSheetsContainer').style.display = 'block';
        showNotification('Conectado correctamente con Google', 'success');
    }, 1500);
}

function authenticateSlack() {
    // Simulación de autenticación
    showNotification('Autenticando con Slack...', 'info');
    
    setTimeout(() => {
        document.getElementById('slackConfigContainer').style.display = 'block';
        showNotification('Conectado correctamente con Slack', 'success');
    }, 1500);
}

function disconnectIntegration(integration) {
    const connectedIntegrations = JSON.parse(localStorage.getItem('connectedIntegrations') || '[]');
    const index = connectedIntegrations.indexOf(integration);
    
    if (index !== -1) {
        connectedIntegrations.splice(index, 1);
        localStorage.setItem('connectedIntegrations', JSON.stringify(connectedIntegrations));
    }
    
    showNotification(`Integración con ${integration} desconectada`, 'success');
    closeIntegrationModal();
    
    // Actualizar UI
    loadIntegrations();
}

function closeIntegrationModal() {
    const modal = document.getElementById('integrationModal');
    modal.style.display = 'none';
    currentIntegration = null;
}

function saveIntegrationConfig() {
    if (!currentIntegration) return;
    
    // En una aplicación real, guardaríamos la configuración específica de la integración
    // Aquí simplemente simulamos una conexión exitosa
    
    const connectedIntegrations = JSON.parse(localStorage.getItem('connectedIntegrations') || '[]');
    
    if (!connectedIntegrations.includes(currentIntegration)) {
        connectedIntegrations.push(currentIntegration);
        localStorage.setItem('connectedIntegrations', JSON.stringify(connectedIntegrations));
    }
    
    showNotification(`Configuración de ${currentIntegration} guardada correctamente`, 'success');
    closeIntegrationModal();
    
    // Actualizar UI
    loadIntegrations();
}

function browseIntegractions() {
    // En una aplicación real, esto abriría un navegador de integraciones disponibles
    showNotification('Navegador de integraciones no implementado en esta versión', 'info');
}

// Funciones de guardado y generación de código
function saveWebhooksSettings() {
    // Guardar webhooks salientes
    const outgoingWebhooks = [];
    document.querySelectorAll('#outgoingWebhooksList .webhook-row').forEach(row => {
        const eventSelect = row.querySelector('.webhook-event-col select');
        const urlInput = row.querySelector('.webhook-url-col input');
        const methodSelect = row.querySelector('.webhook-method-col select');
        
        if (urlInput.value.trim()) {
            outgoingWebhooks.push({
                event: eventSelect.value,
                url: urlInput.value.trim(),
                method: methodSelect.value
            });
        }
    });
    
    localStorage.setItem('outgoingWebhooks', JSON.stringify(outgoingWebhooks));
    
    // Guardar opciones de seguridad
    localStorage.setItem('webhookSecret', document.getElementById('webhookSecret').value);
    localStorage.setItem('webhookRetryCount', document.getElementById('webhookRetryCount').value);
    localStorage.setItem('webhookRetryInterval', document.getElementById('webhookRetryInterval').value);
    
    // Guardar configuraciones de webhooks entrantes
    localStorage.setItem('incomingWebhookUrl', document.getElementById('incomingWebhookUrl').value);
    localStorage.setItem('incomingSecurityToken', document.getElementById('incomingSecurityToken').value);
    
    // Guardar acciones entrantes
    const incomingActions = {};
    document.querySelectorAll('#incomingActionsList .action-row').forEach(row => {
        const keyInput = row.querySelector('.action-key-col input');
        const descriptionInput = row.querySelector('.action-description-col input');
        const enabledCheck = row.querySelector('.action-enabled-col input');
        
        if (keyInput.value.trim()) {
            incomingActions[keyInput.value.trim()] = {
                description: descriptionInput.value,
                enabled: enabledCheck.checked,
                // Los detalles de configuración ya se guardan en saveActionConfig()
            };
        }
    });
    
    localStorage.setItem('incomingActionsIndex', JSON.stringify(incomingActions));
    
    showNotification('Configuración de webhooks guardada correctamente', 'success');
}

function generateWebhooksFlowCode() {
    // Simular generación de código
    showNotification('Generando código de integración...', 'info');
    
    setTimeout(() => {
        // En una aplicación real, esto generaría código basado en la configuración
        // Aquí simplemente mostramos un diálogo de éxito
        alert('Código de integración generado correctamente. El código se ha copiado al portapapeles.');
    }, 1000);
}

// Función de notificación
function showNotification(message, type = 'info') {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-icon">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        </div>
        <div class="notification-message">${message}</div>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Añadir a la página
    const notificationsContainer = document.querySelector('.notifications-container') || document.body;
    notificationsContainer.appendChild(notification);
    
    // Auto-ocultar después de 5 segundos
    setTimeout(() => {
        notification.classList.add('notification-hiding');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 5000);
}

// Funciones auxiliares para mapeos (utilizadas en las integraciones)
function addGoogleSheetsMapping() {
    const container = document.getElementById('googleSheetsMappingContainer');
    addMappingRow(container);
}

function addHubspotMapping() {
    const container = document.getElementById('hubspotMappingContainer');
    addMappingRow(container);
}

function addMappingRow(container) {
    const mappingRow = document.createElement('div');
    mappingRow.className = 'mapping-row';
    mappingRow.innerHTML = `
        <div class="input-group mb-2">
            <input type="text" class="form-control mapping-bot-field" placeholder="Campo del bot">
            <input type="text" class="form-control mapping-sheet-field" placeholder="Campo de destino">
            <div class="input-group-append">
                <button class="btn btn-outline-danger" type="button" onclick="removeMappingRow(this)">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    `;
    
    container.appendChild(mappingRow);
}

function removeMappingRow(button) {
    const mappingRow = button.closest('.mapping-row');
    mappingRow.remove();
}

// Inicializar cuando se carga el documento
document.addEventListener('DOMContentLoaded', function() {
    // Event listener para subida de imagen
    const fileInput = document.getElementById('itemImageFile');
    if (fileInput) {
        fileInput.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    document.getElementById('itemImagePreview').innerHTML = `<img src="${e.target.result}" alt="Vista previa">`;
                    document.getElementById('itemImageUrl').value = e.target.result;
                    catalogImageChanged = true;
                };
                
                reader.readAsDataURL(this.files[0]);
            }
        });
    }
});