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
    //applyFlowStyles();
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
            
            /* Estilos mejorados para el diagrama */
            #flowDiagramCanvas {
                position: relative;
                width: 100%;
                min-height: 500px;
                border: 1px solid #ddd;
                border-radius: 8px;
                background: #f9f9f9;
                overflow: auto;
                padding: 20px;
            }
            
            .flow-node {
                position: absolute;
                min-width: 180px;
                padding: 12px;
                border-radius: 8px;
                background: white;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                z-index: 10;
                user-select: none;
                transition: box-shadow 0.2s ease;
            }
            
            .flow-node:hover {
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            }
            
            .flow-node.start {
                border-left: 4px solid #28a745;
            }
            
            .flow-node.step {
                border-left: 4px solid #007bff;
            }
            
            .flow-node.option {
                border-left: 4px solid #fd7e14;
            }
            
            .flow-node.end {
                border-left: 4px solid #dc3545;
            }
            
            .flow-node h6 {
                display: flex;
                justify-content: space-between;
                margin: 0 0 8px 0;
                font-size: 0.9rem;
                color: #6c757d;
            }
            
            .flow-node .node-type {
                font-weight: normal;
                font-size: 0.8rem;
                padding: 2px 6px;
                border-radius: 4px;
                background: #f8f9fa;
            }
            
            .flow-node .node-content {
                font-weight: 500;
            }
            
            .flow-node .handle {
                cursor: move;
                color: #adb5bd;
            }
            
            .flow-node.dragging {
                opacity: 0.8;
                z-index: 100;
            }
            
            .flow-connector path {
                stroke-linecap: round;
                transition: stroke 0.2s ease;
            }
            
            .flow-connector:hover path {
                stroke: #007bff;
                stroke-width: 3;
            }
        `;
        document.head.appendChild(styleSheet);
    }
}

// Seleccionar un flujo para editar
function selectFlow(index) {
    if (index < 0 || index >= currentFlows.length) return;

    // Guardar selección anterior
    const previousFlow = currentSelectedFlow;

    // Actualizar selección
    currentSelectedFlow = index;
    currentFlowStep = null;
    currentFlowOption = null;
    currentFlowMessage = null;

    // Actualizar UI
    renderFlowsList();
    showFlowEditor();

    const flow = currentFlows[index];
    console.log("Seleccionando flujo:", flow.name, "Pasos:", flow.steps);

    // Cargar el flujo al editor
    loadFlowToEditor(flow);

    // Si estamos en la pestaña de pasos, asegurar que se muestren
    if (document.getElementById('flowStepsTab').classList.contains('active')) {
        setTimeout(() => {
            console.log("Refrescando vista de pasos");
            loadFlowSteps(flow);
        }, 100);
    }
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
        actionValue: option.actionValue || '',
        step: option.step || 'INITIAL' // Asegurar que siempre tenga un paso asignado
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

    // Asegurarse que el flujo tenga los pasos básicos
    if (!flow.steps || flow.steps.length === 0) {
        console.log("El flujo no tiene pasos, añadiendo pasos predeterminados");
        flow.steps = ['INITIAL', 'AWAITING_CHOICE'];
    }

    // Debug - imprimir los pasos que se van a cargar
    console.log("Pasos a cargar:", flow.steps);

    // Cargar pestañas con los datos del flujo
    loadFlowSteps(flow);
    loadFlowOptions(flow);
    loadFlowMessages(flow);

    // Generar diagrama
    generateFlowDiagram(flow);

    // Generar código
    generateFlowCode(flow);

    // Activar la pestaña deseada
    const activeTab = document.querySelector('.flow-edit-tabs .tab-button.active');
    if (activeTab) {
        switchFlowTab(activeTab.getAttribute('data-tab'));
    } else {
        switchFlowTab('steps'); // Por defecto mostrar la pestaña de pasos
    }
}

// Cargar pasos del flujo
function loadFlowSteps(flow) {
    console.log("Cargando pasos:", flow.steps);
    const stepsList = document.getElementById('flowStepsList');
    if (!stepsList) {
        console.error("No se encontró el elemento flowStepsList");
        return;
    }

    // Verificar si hay pasos
    if (!flow.steps || flow.steps.length === 0) {
        stepsList.innerHTML = `
            <div class="empty-state">
                <p>No hay pasos definidos para este flujo</p>
                <button class="btn btn-sm btn-primary" onclick="addDefaultSteps()">
                    <i class="fas fa-plus"></i> Añadir Pasos Predeterminados
                </button>
            </div>
        `;
        return;
    }

    // Generar HTML para cada paso
    let html = '';
    flow.steps.forEach((step, index) => {
        const isActive = index === currentFlowStep;
        html += `
            <div class="flow-step-item ${isActive ? 'active' : ''}" onclick="selectFlowStep(${index})">
                <h6><i class="fas fa-code-branch"></i> ${step}</h6>
                <p>${getStepDescription(step, flow)}</p>
            </div>
        `;
    });

    // Insertar los pasos en el contenedor
    stepsList.innerHTML = html;

    // Actualizar el formulario de edición de paso
    updateStepEditForm();
}


// Función para añadir pasos predeterminados
function addDefaultSteps() {
    if (currentSelectedFlow === null || !currentFlows || !currentFlows[currentSelectedFlow]) {
        showNotification('Selecciona un flujo primero', 'warning');
        return;
    }

    const flow = currentFlows[currentSelectedFlow];

    // Añadir pasos básicos si no existen
    if (!flow.steps || flow.steps.length === 0) {
        flow.steps = ['INITIAL', 'AWAITING_CHOICE'];

        // Añadir mensaje de bienvenida básico si no existe
        if (!flow.messages) {
            flow.messages = {};
        }

        if (!flow.messages.welcome) {
            flow.messages.welcome = '¡Bienvenido! Por favor selecciona una opción:';
        }

        // Actualizar la UI
        loadFlowSteps(flow);
        showNotification('Pasos predeterminados añadidos', 'success');

        // Regenerar diagrama si está visible
        if (document.getElementById('flowDiagramTab').classList.contains('active')) {
            generateFlowDiagram(flow);
        }

        // Guardar cambios
        saveFlowChanges();
    }
}
// Obtener descripción de un paso
function getStepDescription(step, flow) {
    switch (step) {
        case 'INITIAL':
            return 'Paso inicial del flujo';
        case 'AWAITING_CHOICE':
            return 'Esperando selección del usuario';
        default:
            // Para pasos personalizados, intentar obtener una descripción basada en mensajes
            if (flow.messages && flow.messages[step]) {
                const msg = flow.messages[step];
                const previewText = typeof msg === 'string'
                    ? (msg.length > 40 ? msg.substring(0, 37) + '...' : msg)
                    : 'Mensaje con formato especial';
                return previewText;
            }
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

// Función mejorada para poblar el selector de pasos
function populateOptionStepSelect() {
    const stepSelect = document.getElementById('optionStepSelect');
    if (!stepSelect) return;
    
    stepSelect.innerHTML = ''; // Limpiar opciones actuales

    if (currentSelectedFlow === null || !currentFlows) return;

    const currentFlow = currentFlows[currentSelectedFlow];
    if (!currentFlow || !currentFlow.steps || !Array.isArray(currentFlow.steps)) return;

    // Agregar una opción vacía para evitar selección automática
    const emptyOption = document.createElement('option');
    emptyOption.value = '';
    emptyOption.textContent = '-- Seleccione un paso --';
    stepSelect.appendChild(emptyOption);

    // Agregar los pasos disponibles
    currentFlow.steps.forEach((step, index) => {
        const option = document.createElement('option');
        option.value = step;
        option.textContent = step;
        stepSelect.appendChild(option);
    });
}

// Función mejorada para actualizar el formulario de edición de opción
function updateOptionEditForm() {
    // Ocultar/mostrar el formulario según corresponda
    const optionForm = document.getElementById('optionEditForm');
    const placeholder = document.getElementById('optionEditorPlaceholder');

    if (currentFlowOption === null || !currentFlows || !currentFlows[currentSelectedFlow]) {
        // Ocultar formulario
        if (optionForm) optionForm.style.display = 'none';
        if (placeholder) placeholder.style.display = 'block';
        return;
    } else {
        // Mostrar formulario
        if (optionForm) optionForm.style.display = 'block';
        if (placeholder) placeholder.style.display = 'none';
    }

    // Primero, asegurarse de que el dropdown de pasos esté poblado
    populateOptionStepSelect();

    const flow = currentFlows[currentSelectedFlow];
    const option = flow.options[currentFlowOption];

    // Para depuración
    console.log("Actualizando formulario para la opción:", option);
    
    // Actualizar campos del formulario
    const currentOptionNumberEl = document.getElementById('currentOptionNumber');
    const optionEmojiEl = document.getElementById('optionEmoji');
    const optionTextEl = document.getElementById('optionText');
    const optionStepSelectEl = document.getElementById('optionStepSelect');
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
    
    // Mejorada la selección del paso
    if (optionStepSelectEl && option.step) {
        console.log("Intentando seleccionar paso:", option.step);
        
        // Establecer directamente el valor (enfoque más simple)
        optionStepSelectEl.value = option.step;
        
        // Verificar si la asignación directa funcionó
        if (optionStepSelectEl.value !== option.step) {
            console.warn(`La asignación directa falló para el paso "${option.step}"`);
            
            // Si no funcionó, intentar encontrar la opción que coincida por texto
            for (let i = 0; i < optionStepSelectEl.options.length; i++) {
                if (optionStepSelectEl.options[i].text === option.step) {
                    optionStepSelectEl.selectedIndex = i;
                    console.log(`Paso encontrado por texto en índice ${i}`);
                    break;
                }
            }
        } else {
            console.log(`Paso "${option.step}" seleccionado correctamente`);
        }
    } else if (optionStepSelectEl) {
        // Si no hay paso seleccionado, establecer a vacío
        optionStepSelectEl.value = '';
    }

    if (optionActionEl) {
        // Intentar seleccionar la acción actual
        if (option.action && Array.from(optionActionEl.options).some(opt => opt.value === option.action)) {
            optionActionEl.value = option.action;
        } else {
            // Usar la primera acción disponible
            optionActionEl.selectedIndex = 0;
        }
        
        // Asegurar que se actualicen las opciones de valor de acción después de establecer la acción
        setTimeout(() => showActionValueOptions(), 0);
    }

    if (optionActionValueEl) {
        optionActionValueEl.value = option.actionValue || '';
    }
    
    // Verificación final para comprobar qué se seleccionó realmente
    if (optionStepSelectEl) {
        console.log("Paso finalmente seleccionado:", optionStepSelectEl.value);
    }
}


// Cambiar entre pestañas del editor de flujo con soporte mejorado para diagrama
function switchFlowTab(tabId) {
    // Guardar referencia al tab actual antes de cambiar
    const previousTabId = document.querySelector('.flow-edit-tabs .tab-button.active')?.getAttribute('data-tab');

    // Ocultar todas las pestañas
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
    if (tabId === 'steps' && currentSelectedFlow !== null) {
        console.log("Cambiando a pestaña de pasos, recargando...");
        setTimeout(() => {
            loadFlowSteps(currentFlows[currentSelectedFlow]);
        }, 50);
    } else if (tabId === 'diagram') {
        // Al cambiar a la pestaña de diagrama, asegurar que esté correctamente
        // inicializado y adaptado al contenedor
        refreshDiagramForContainer();
    } else if (tabId === 'code') {
        refreshFlowCode();
    }
}
// Refrescar diagrama adaptándolo al contenedor
function refreshDiagramForContainer() {
    // Primero, asegurar que el contenedor esté visible y tenga dimensiones
    const container = document.querySelector('.flow-diagram-container');
    if (!container) return;
    
    // Asegurar que el contenedor sea visible
    container.style.display = 'block';
    
    // Calcular dimensiones iniciales
    setTimeout(() => {
        // Generar o refrescar el diagrama
        if (currentSelectedFlow !== null && currentFlows && currentFlows[currentSelectedFlow]) {
            // Restablecer zoom
            diagramZoom = 1;
            
            // Reiniciar registro de nodos externos
            window.externalFlowNodeIds = {};
            
            // Regenerar el diagrama completamente
            generateFlowDiagram(currentFlows[currentSelectedFlow]);
            
            // Aplicar zoom después de que el diagrama esté generado
            setTimeout(() => {
                applyDiagramZoom();
            }, 100);
        }
    }, 200); // Dar tiempo para que el DOM se actualice
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
    const optionEmojiEl = document.getElementById('optionEmoji');
    const optionTextEl = document.getElementById('optionText');
    const optionStepSelectEl = document.getElementById('optionStepSelect');
    const optionActionEl = document.getElementById('optionAction');
    const optionActionValueEl = document.getElementById('optionActionValue');

    console.log("Guardando opción:", {
        emoji: optionEmojiEl ? optionEmojiEl.value : null,
        text: optionTextEl ? optionTextEl.value : null,
        step: optionStepSelectEl ? optionStepSelectEl.value : null,
        action: optionActionEl ? optionActionEl.value : null,
        actionValue: optionActionValueEl ? optionActionValueEl.value : null
    });

    if (!optionTextEl || !optionTextEl.value.trim()) {
        showNotification('El texto de la opción no puede estar vacío', 'warning');
        return;
    }

    // Guardar valores actualizados
    if (optionEmojiEl) option.emoji = optionEmojiEl.value;
    if (optionTextEl) option.text = optionTextEl.value;
    if (optionStepSelectEl) {
        option.step = optionStepSelectEl.value;
        console.log("Guardando opción con paso:", optionStepSelectEl.value);
    }
    if (optionActionEl) option.action = optionActionEl.value;
    if (optionActionValueEl) option.actionValue = optionActionValueEl.value;

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

function populateOptionStepSelect() {
    const stepSelect = document.getElementById('optionStepSelect');
    if (!stepSelect) {
        console.error("Elemento del selector de pasos no encontrado");
        return;
    }
    
    stepSelect.innerHTML = ''; // Limpiar opciones actuales

    if (currentSelectedFlow === null || !currentFlows) {
        console.warn("No hay flujo seleccionado al poblar selector de pasos");
        return;
    }

    const currentFlow = currentFlows[currentSelectedFlow];
    if (!currentFlow || !currentFlow.steps || !Array.isArray(currentFlow.steps)) {
        console.warn("El flujo actual no tiene un array de pasos");
        return;
    }

    console.log("Poblando dropdown de pasos con:", currentFlow.steps);

    // Agregar una opción vacía para evitar selección automática
    const emptyOption = document.createElement('option');
    emptyOption.value = '';
    emptyOption.textContent = '-- Seleccione un paso --';
    stepSelect.appendChild(emptyOption);

    // Agregar los pasos disponibles
    currentFlow.steps.forEach((step, index) => {
        const option = document.createElement('option');
        option.value = step;
        option.textContent = step;
        stepSelect.appendChild(option);
    });
    
    console.log("Dropdown de pasos poblado con", stepSelect.options.length, "opciones");
}


// Mostrar opciones de valor de acción según la acción seleccionada
// Aseguramos que showActionValueOptions se llame después de actualizar el action
function showActionValueOptions() {
    const actionSelect = document.getElementById('optionAction');
    const valueContainer = document.getElementById('optionActionValueContainer');
    const valueInput = document.getElementById('optionActionValue');

    if (!actionSelect || !valueContainer || !valueInput) {
        console.warn("No se encontraron elementos necesarios para showActionValueOptions");
        return;
    }

    const action = actionSelect.value;
    console.log("Configurando opciones para acción:", action);

    // Mantener el valor actual si existe
    const currentValue = valueInput.value;

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

     // Restaurar el valor después de cambiar los atributos
    valueInput.value = currentValue;

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

// Generar diagrama del flujo con restricciones de contenedor
function generateFlowDiagram(flow) {
    const canvas = document.getElementById('flowDiagramCanvas');
    const container = document.querySelector('.flow-diagram-container');
    if (!canvas || !container) return;

    // Limpiar canvas
    canvas.innerHTML = '';

    if (!flow || !flow.steps || flow.steps.length === 0) {
        canvas.innerHTML = '<div class="empty-state"><p>No hay pasos para mostrar en el diagrama</p></div>';
        return;
    }

    // Obtener dimensiones del contenedor
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    // Establecer tamaño mínimo del canvas basado en el contenedor
    canvas.style.minWidth = `${containerWidth}px`;
    canvas.style.minHeight = `${containerHeight}px`;

    // Almacenar un registro de IDs de nodos externos para evitar duplicados
    window.externalFlowNodeIds = {};

    // Calcular posiciones con mejor distribución y dentro de los límites
    const nodeWidth = 180;
    const nodeHeight = 80;
    const padding = 20; // Espacio desde los bordes
    const horizontalGap = 100;
    const verticalGap = 120;
    
    // Calcular número máximo de elementos por columna para distribución vertical
    const maxElementsPerColumn = Math.floor((containerHeight - padding * 2) / (nodeHeight + verticalGap));
    
    // Crear nodos para los pasos con mejor posicionamiento dentro del contenedor
    const stepNodes = flow.steps.map((step, index) => {
        // Calcular posición respetando los límites
        const column = Math.floor(index / maxElementsPerColumn);
        const rowInColumn = index % maxElementsPerColumn;
        
        return {
            id: `step-${index}`,
            name: step,
            type: step === 'INITIAL' ? 'start' : 'step',
            x: padding + column * (nodeWidth + horizontalGap),  // Posición X basada en columna
            y: padding + rowInColumn * (nodeHeight + verticalGap)  // Posición Y dentro de la columna
        };
    });

    // Calcular posiciones para las opciones
    const optionStartX = Math.min(containerWidth / 2, padding + nodeWidth + horizontalGap);
    
    // Generar nodos de opciones con mejor posicionamiento
    const optionNodes = [];
    if (flow.options && flow.options.length > 0) {
        // Calcular altura de opciones para evitar superposición
        const optionHeight = Math.min(50, (containerHeight - padding * 2) / flow.options.length);
        
        flow.options.forEach((option, index) => {
            optionNodes.push({
                id: `option-${index}`,
                name: option.text,
                type: 'option',
                emoji: option.emoji || getEmojiForNumber(option.number || (index + 1)),
                action: option.action,
                actionValue: option.actionValue,
                x: optionStartX,  // Colocar opciones en segunda columna
                y: padding + index * (nodeHeight + optionHeight)  // Distribuir verticalmente
            });
        });
    }

    // Crear nodos en el diagrama
    const allNodes = [...stepNodes, ...optionNodes];

    // Añadir todos los nodos al diagrama
    allNodes.forEach(node => {
        const nodeEl = document.createElement('div');
        nodeEl.className = `flow-node ${node.type}`;
        nodeEl.id = node.id;
        
        // Asegurar que esté dentro de los límites
        const safeX = Math.min(Math.max(node.x, padding), containerWidth - nodeWidth - padding);
        const safeY = Math.min(Math.max(node.y, padding), containerHeight - nodeHeight - padding);
        
        nodeEl.style.left = `${safeX}px`;
        nodeEl.style.top = `${safeY}px`;
        nodeEl.setAttribute('data-name', node.name); // Añadir atributo para facilitar búsqueda

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

    // Crear conectores DESPUÉS de que todos los nodos están en el DOM
    setTimeout(() => {
        createConnectors(flow, stepNodes, optionNodes);
    }, 50);
}


// Crear conectores entre nodos - VERSIÓN CORREGIDA
function createConnectors(flow, stepNodes, optionNodes) {
    const canvas = document.getElementById('flowDiagramCanvas');
    if (!canvas) return;

    // Eliminar conectores existentes (para evitar duplicados)
    canvas.querySelectorAll('.flow-connector').forEach(el => el.remove());

    // Crear marcador de flecha si no existe
    if (!document.getElementById('arrow-marker-def')) {
        const svgDefs = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svgDefs.style.position = 'absolute';
        svgDefs.style.width = '0';
        svgDefs.style.height = '0';

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
        svgDefs.appendChild(defs);
        canvas.appendChild(svgDefs);
    }

    // Conectar pasos secuenciales (SIEMPRE conectamos los pasos en orden)
    for (let i = 0; i < stepNodes.length - 1; i++) {
        createConnector(canvas, stepNodes[i].id, stepNodes[i + 1].id);
    }

    // Conectar opciones con sus destinos
    if (flow.options && flow.options.length > 0) {
        // Primero encontrar el paso AWAITING_CHOICE (si existe)
        const awaitingChoiceStep = stepNodes.find(node => node.name === 'AWAITING_CHOICE');

        flow.options.forEach((option, index) => {
            const sourceId = `option-${index}`;

            // Si existe AWAITING_CHOICE, conectarlo con todas las opciones
            if (awaitingChoiceStep) {
                createConnector(canvas, awaitingChoiceStep.id, sourceId);
            }

            // Conectar cada opción con su destino según la acción
            if (option.action === 'goToStep' && option.actionValue) {
                // Buscar el nodo de paso correspondiente por nombre
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
}

// Crear un conector entre dos nodos
function createConnector(canvas, sourceId, targetId) {
    const sourceNode = document.getElementById(sourceId);
    const targetNode = document.getElementById(targetId);

    if (!sourceNode || !targetNode) {
        console.warn(`No se pudo crear conector: nodo no encontrado (${sourceId} -> ${targetId})`);
        return;
    }

    // Crear un ID único para el conector
    const connectorId = `connector-${sourceId}-${targetId}`;
    
    // Verificar si ya existe un conector con este ID
    if (document.getElementById(connectorId)) {
        return; // Evitar duplicados
    }

    // Obtener posiciones
    const sourceRect = sourceNode.getBoundingClientRect();
    const targetRect = targetNode.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();

    // Calcular posiciones relativas al canvas con scroll
    const sourceX = sourceRect.left - canvasRect.left + sourceRect.width / 2 + canvas.scrollLeft;
    const sourceY = sourceRect.top - canvasRect.top + sourceRect.height + canvas.scrollTop;
    const targetX = targetRect.left - canvasRect.left + targetRect.width / 2 + canvas.scrollLeft;
    const targetY = targetRect.top - canvasRect.top + canvas.scrollTop;

    // Crear SVG para el conector
    const connector = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    connector.setAttribute('class', 'flow-connector');
    connector.setAttribute('id', connectorId); // Añadir ID único
    connector.setAttribute('data-source', sourceId);
    connector.setAttribute('data-target', targetId);
    connector.style.position = 'absolute';
    connector.style.left = '0';
    connector.style.top = '0';
    connector.style.width = '100%';
    connector.style.height = '100%';
    connector.style.pointerEvents = 'none';
    connector.style.zIndex = '1'; // Asegurar que esté debajo de los nodos

    // Crear path
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

    // Calcular puntos de control para curva
    const dx = targetX - sourceX;
    const dy = targetY - sourceY;
    const controlX1 = sourceX;
    const controlY1 = sourceY + Math.max(40, dy / 3);
    const controlX2 = targetX;
    const controlY2 = targetY - Math.max(40, dy / 3);

    // Definir path
    path.setAttribute('d', `M ${sourceX} ${sourceY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${targetX} ${targetY}`);
    path.setAttribute('stroke', '#6c757d');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('fill', 'none');
    path.setAttribute('marker-end', 'url(#arrow)');

    // Añadir path al conector
    connector.appendChild(path);

    // Añadir conector al canvas
    canvas.appendChild(connector);
}

// Generar diagrama del flujo con restricciones de contenedor
function generateFlowDiagram(flow) {
    const canvas = document.getElementById('flowDiagramCanvas');
    const container = document.querySelector('.flow-diagram-container');
    if (!canvas || !container) return;

    // Limpiar canvas
    canvas.innerHTML = '';

    if (!flow || !flow.steps || flow.steps.length === 0) {
        canvas.innerHTML = '<div class="empty-state"><p>No hay pasos para mostrar en el diagrama</p></div>';
        return;
    }

    // Obtener dimensiones del contenedor
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    // Establecer tamaño mínimo del canvas basado en el contenedor
    canvas.style.minWidth = `${containerWidth}px`;
    canvas.style.minHeight = `${containerHeight}px`;

    // Almacenar un registro de IDs de nodos externos para evitar duplicados
    window.externalFlowNodeIds = {};

    // Calcular posiciones con mejor distribución y dentro de los límites
    const nodeWidth = 180;
    const nodeHeight = 80;
    const padding = 20; // Espacio desde los bordes
    const horizontalGap = 100;
    const verticalGap = 120;
    
    // Calcular número máximo de elementos por columna para distribución vertical
    const maxElementsPerColumn = Math.floor((containerHeight - padding * 2) / (nodeHeight + verticalGap));
    
    // Crear nodos para los pasos con mejor posicionamiento dentro del contenedor
    const stepNodes = flow.steps.map((step, index) => {
        // Calcular posición respetando los límites
        const column = Math.floor(index / maxElementsPerColumn);
        const rowInColumn = index % maxElementsPerColumn;
        
        return {
            id: `step-${index}`,
            name: step,
            type: step === 'INITIAL' ? 'start' : 'step',
            x: padding + column * (nodeWidth + horizontalGap),  // Posición X basada en columna
            y: padding + rowInColumn * (nodeHeight + verticalGap)  // Posición Y dentro de la columna
        };
    });

    // Calcular posiciones para las opciones
    const optionStartX = Math.min(containerWidth / 2, padding + nodeWidth + horizontalGap);
    
    // Generar nodos de opciones con mejor posicionamiento
    const optionNodes = [];
    if (flow.options && flow.options.length > 0) {
        // Calcular altura de opciones para evitar superposición
        const optionHeight = Math.min(50, (containerHeight - padding * 2) / flow.options.length);
        
        flow.options.forEach((option, index) => {
            optionNodes.push({
                id: `option-${index}`,
                name: option.text,
                type: 'option',
                emoji: option.emoji || getEmojiForNumber(option.number || (index + 1)),
                action: option.action,
                actionValue: option.actionValue,
                x: optionStartX,  // Colocar opciones en segunda columna
                y: padding + index * (nodeHeight + optionHeight)  // Distribuir verticalmente
            });
        });
    }

    // Crear nodos en el diagrama
    const allNodes = [...stepNodes, ...optionNodes];

    // Añadir todos los nodos al diagrama
    allNodes.forEach(node => {
        const nodeEl = document.createElement('div');
        nodeEl.className = `flow-node ${node.type}`;
        nodeEl.id = node.id;
        
        // Asegurar que esté dentro de los límites
        const safeX = Math.min(Math.max(node.x, padding), containerWidth - nodeWidth - padding);
        const safeY = Math.min(Math.max(node.y, padding), containerHeight - nodeHeight - padding);
        
        nodeEl.style.left = `${safeX}px`;
        nodeEl.style.top = `${safeY}px`;
        nodeEl.setAttribute('data-name', node.name); // Añadir atributo para facilitar búsqueda

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

    // Crear conectores DESPUÉS de que todos los nodos están en el DOM
    setTimeout(() => {
        createConnectors(flow, stepNodes, optionNodes);
    }, 50);
}

// Crear indicador de flujo externo - VERSIÓN CON RESTRICCIONES DE CONTENEDOR
function createExternalFlowIndicator(canvas, sourceId, flowName) {
    const sourceNode = document.getElementById(sourceId);
    const container = document.querySelector('.flow-diagram-container');
    if (!sourceNode || !container) return;

    // Crear un ID único para el nodo externo
    const externalId = `external-${flowName}-${sourceId}`;
    
    // Comprobar si ya existe para evitar duplicados
    if (document.getElementById(externalId)) {
        return; // Ya existe, no crear duplicado
    }
    
    // Registrar este ID para evitar duplicados en futuras llamadas
    if (!window.externalFlowNodeIds) {
        window.externalFlowNodeIds = {};
    }
    window.externalFlowNodeIds[externalId] = true;

    // Obtener posición
    const sourceRect = sourceNode.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    // Dimensiones del nodo externo
    const nodeWidth = 180;
    const nodeHeight = 80;
    const padding = 20;

    // Ajustar a coordenadas relativas al canvas
    let sourceX = sourceRect.left - canvasRect.left + sourceRect.width + canvas.scrollLeft;
    let sourceY = sourceRect.top - canvasRect.top + sourceRect.height / 2 + canvas.scrollTop;

    // Asegurar que el nodo externo esté dentro de los límites del contenedor
    const maxX = containerRect.width - nodeWidth - padding;
    const maxY = containerRect.height - nodeHeight - padding;

    // Posición para el nodo externo
    let externalX = sourceX + 50;
    let externalY = sourceY - 40;
    
    // Restringir dentro de los límites
    externalX = Math.min(Math.max(externalX, padding), maxX);
    externalY = Math.min(Math.max(externalY, padding), maxY);

    // Crear nodo de flujo externo
    const externalNode = document.createElement('div');
    externalNode.className = 'flow-node end';
    externalNode.id = externalId;
    externalNode.style.left = `${externalX}px`;
    externalNode.style.top = `${externalY}px`;
    externalNode.innerHTML = `
        <h6>
            <span class="node-type">Flujo Externo</span>
            <i class="fas fa-grip-horizontal handle"></i>
        </h6>
        <div class="node-content">${flowName || 'Sin nombre'}</div>
    `;

    // Hacer el nodo arrastrable
    externalNode.addEventListener('mousedown', startDrag);

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

// Arrastrar nodo - VERSIÓN CON RESTRICCIONES DE CONTENEDOR
function dragNode(e) {
    if (!isDragging || !draggedNode) return;

    e.preventDefault();

    // Obtener posición del canvas y contenedor
    const canvas = document.getElementById('flowDiagramCanvas');
    const container = document.querySelector('.flow-diagram-container');
    if (!canvas || !container) return;
    
    const canvasRect = canvas.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    // Dimensiones aproximadas del nodo
    const nodeWidth = draggedNode.offsetWidth;
    const nodeHeight = draggedNode.offsetHeight;
    const padding = 10; // Margen de seguridad

    // Calcular nueva posición
    let x = e.clientX - canvasRect.left - dragStartX + canvas.scrollLeft;
    let y = e.clientY - canvasRect.top - dragStartY + canvas.scrollTop;
    
    // Restringir dentro de los límites del contenedor
    const minX = padding;
    const minY = padding;
    const maxX = containerRect.width - nodeWidth - padding;
    const maxY = containerRect.height - nodeHeight - padding;
    
    x = Math.min(Math.max(x, minX), maxX);
    y = Math.min(Math.max(y, minY), maxY);

    // Actualizar posición del nodo
    draggedNode.style.left = `${x}px`;
    draggedNode.style.top = `${y}px`;

    // Actualizar conectores sin crear nuevos nodos externos
    updateConnectorsForDrag();
}

// Obtener límites del contenedor para asegurar que los nodos permanezcan dentro
function getContainerBounds() {
    const container = document.querySelector('.flow-diagram-container');
    if (!container) return { minX: 0, minY: 0, maxX: 1000, maxY: 1000 };
    
    const padding = 10; // Margen de seguridad
    return {
        minX: padding,
        minY: padding,
        maxX: container.clientWidth - padding,
        maxY: container.clientHeight - padding
    };
}

// Auto-organizar diagrama dentro de los límites del contenedor
function autoArrangeDiagram() {
    const canvas = document.getElementById('flowDiagramCanvas');
    const container = document.querySelector('.flow-diagram-container');
    if (!canvas || !container || !currentFlows || currentSelectedFlow === null) return;
    
    const flow = currentFlows[currentSelectedFlow];
    if (!flow) return;
    
    // Confirmar antes de reorganizar
    if (!confirm('¿Reorganizar automáticamente el diagrama? Esto reposicionará todos los nodos.')) {
        return;
    }
    
    // Recrear el diagrama con posiciones optimizadas
    generateFlowDiagram(flow);
    
    showNotification('Diagrama reorganizado', 'success');
}

// Actualizar conectores solo para el nodo que se está arrastrando
function updateConnectorsForDrag() {
    if (!draggedNode) return;
    
    const canvas = document.getElementById('flowDiagramCanvas');
    if (!canvas) return;
    
    const nodeId = draggedNode.id;
    
    // Encontrar y actualizar conectores relacionados con este nodo
    const relatedConnectors = canvas.querySelectorAll(`.flow-connector[data-source="${nodeId}"], .flow-connector[data-target="${nodeId}"]`);
    
    relatedConnectors.forEach(connector => {
        const sourceId = connector.getAttribute('data-source');
        const targetId = connector.getAttribute('data-target');
        
        const sourceNode = document.getElementById(sourceId);
        const targetNode = document.getElementById(targetId);
        
        if (sourceNode && targetNode) {
            // Actualizar la posición del conector
            updateConnectorPath(connector, sourceNode, targetNode);
        }
    });
}

// Actualizar la ruta de un conector existente
function updateConnectorPath(connector, sourceNode, targetNode) {
    const path = connector.querySelector('path');
    if (!path) return;
    
    const canvas = document.getElementById('flowDiagramCanvas');
    const canvasRect = canvas.getBoundingClientRect();
    
    // Obtener posiciones
    const sourceRect = sourceNode.getBoundingClientRect();
    const targetRect = targetNode.getBoundingClientRect();
    
    // Calcular posiciones relativas al canvas con scroll
    const sourceX = sourceRect.left - canvasRect.left + sourceRect.width / 2 + canvas.scrollLeft;
    const sourceY = sourceRect.top - canvasRect.top + sourceRect.height + canvas.scrollTop;
    const targetX = targetRect.left - canvasRect.left + targetRect.width / 2 + canvas.scrollLeft;
    const targetY = targetRect.top - canvasRect.top + canvas.scrollTop;
    
    // Calcular puntos de control para curva
    const dx = targetX - sourceX;
    const dy = targetY - sourceY;
    const controlX1 = sourceX;
    const controlY1 = sourceY + Math.max(40, dy / 3);
    const controlX2 = targetX;
    const controlY2 = targetY - Math.max(40, dy / 3);
    
    // Actualizar path
    path.setAttribute('d', `M ${sourceX} ${sourceY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${targetX} ${targetY}`);
}
// Detener arrastre - VERSIÓN CORREGIDA
function stopDrag() {
    if (!isDragging || !draggedNode) return;

    // Eliminar clase de arrastre
    draggedNode.classList.remove('dragging');

    // Eliminar manejadores de eventos
    document.removeEventListener('mousemove', dragNode);
    document.removeEventListener('mouseup', stopDrag);

    // Actualizar conectores una última vez sin crear nuevos nodos
    updateConnectorsForDrag();

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
            return {
                id: node.id,
                name: node.getAttribute('data-name'),
                type: node.classList.contains('start') ? 'start' : 'step',
            };
        });

        const optionNodes = Array.from(canvas.querySelectorAll('.flow-node')).filter(node =>
            node.id.startsWith('option-')
        ).map(node => {
            return {
                id: node.id,
                name: node.getAttribute('data-name'),
                type: 'option',
            };
        });

        // Recrear conectores
        createConnectors(flow, stepNodes, optionNodes);
    }
}

// Actualizar diagrama de flujo
function resetFlowDiagram() {
    if (currentSelectedFlow === null || !currentFlows || !currentFlows[currentSelectedFlow]) {
        return;
    }
    
    // Limpiar registro de nodos externos
    window.externalFlowNodeIds = {};
    
    // Regenerar el diagrama completo
    generateFlowDiagram(currentFlows[currentSelectedFlow]);
    
    // Restaurar zoom predeterminado
    diagramZoom = 1;
    applyDiagramZoom();
    
    showNotification('Diagrama reiniciado correctamente', 'success');
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

// Aplicar zoom al diagrama - VERSION MEJORADA
function applyDiagramZoom() {
    const canvas = document.getElementById('flowDiagramCanvas');
    if (!canvas) return;

    canvas.style.transform = `scale(${diagramZoom})`;
    canvas.style.transformOrigin = 'top left';
    
    // Actualizar contador de zoom si existe
    const zoomCounter = document.getElementById('diagramZoomLevel');
    if (zoomCounter) {
        zoomCounter.textContent = `${Math.round(diagramZoom * 100)}%`;
    }
}
// Ajustar diagrama cuando cambia el tamaño de la ventana
function handleWindowResize() {
    // Solo actualizar si estamos en la pestaña de diagrama
    const isDiagramTabActive = document.querySelector('.flow-edit-tabs .tab-button[data-tab="diagram"].active');
    if (isDiagramTabActive) {
        // Esperar un poco para que las dimensiones se estabilicen
        setTimeout(() => {
            refreshDiagramForContainer();
        }, 300);
    }
}
// Guardar diagrama como PNG
function saveFlowAsPNG() {
    // Implementación básica, en un entorno real usaríamos html2canvas o similar
    //alert('Funcionalidad no implementada: Guardar diagrama como PNG');
    showNotification('Funcionalidad no implementada: Guardar diagrama como PNG', 'warning');
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

    // Añadir listener para redimensión de ventana
    window.addEventListener('resize', handleWindowResize);
    
    // Añadir listeners para zoom con rueda del ratón
    const diagramContainer = document.querySelector('.flow-diagram-container');
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
