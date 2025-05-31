// Abrir el modal de edición de opción
function openOptionEditModal(index) {
    if (!currentFlows || !currentFlows[currentSelectedFlow]) return;

    const flow = currentFlows[currentSelectedFlow];
    if (!flow.options || index < 0 || index >= flow.options.length) return;

    currentFlowOption = index;
    currentFlowStep = null;
    currentFlowMessage = null;

    // Obtener el modal
    const modal = document.getElementById('optionEditModal');
    if (!modal) return;

    // Mostrar el modal
    modal.style.display = 'flex';
    populateOptionStepSelect(); // POBLAR SELECT DE PASOS
    // Actualizar los campos del formulario
    updateOptionEditForm();

    // Actualizar vista previa
    updateOptionPreview();

    // Evitar que el fondo se desplace
    document.body.style.overflow = 'hidden';
}

// Cerrar el modal de edición de opción
function closeOptionEditModal() {
    const modal = document.getElementById('optionEditModal');
    if (modal) {
        modal.style.display = 'none';
    }

    // Restaurar el desplazamiento del fondo
    document.body.style.overflow = 'auto';
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
    console.log("(Moda)Actualizando formulario para la opción:", option);
    
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

// Actualizar vista previa de la opción
function updateOptionPreview() {
    const emojiEl = document.getElementById('optionEmoji');
    const textEl = document.getElementById('optionText');
    const previewEmojiEl = document.getElementById('previewEmoji');
    const previewTextEl = document.getElementById('previewText');

    if (emojiEl && textEl && previewEmojiEl && previewTextEl) {
        previewEmojiEl.textContent = emojiEl.value;
        previewTextEl.textContent = textEl.value || 'Texto de ejemplo';
    }
}

// Añadir event listeners para actualizar la vista previa en tiempo real
function setupOptionPreviewListeners() {
    const emojiEl = document.getElementById('optionEmoji');
    const textEl = document.getElementById('optionText');

    if (emojiEl) {
        emojiEl.addEventListener('change', updateOptionPreview);
    }

    if (textEl) {
        textEl.addEventListener('input', updateOptionPreview);
    }
}

// Guardar cambios en la opción actual (versión para modal)
// Guardar cambios en la opción actual (versión para modal)
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
    const step = document.getElementById('optionStepSelect').value; // Obtener el paso seleccionado
    const action = document.getElementById('optionAction').value;
    const actionValue = document.getElementById('optionActionValue').value.trim();

    console.log("Guardando opción con paso:", step); // Log para depuración

    if (!text) {
        showNotification('El texto de la opción no puede estar vacío', 'warning');
        return;
    }

    // Actualizar la opción
    option.emoji = emoji;
    option.text = text;
    option.step = step; // Guardar el paso seleccionado
    option.action = action;
    option.actionValue = actionValue;

    console.log("Opción actualizada:", option); // Log para depuración

    // Cerrar el modal
    closeOptionEditModal();

    // Actualizar UI
    loadFlowOptions(flow);

    showNotification('Opción actualizada', 'success');

    // Guardar cambios en el servidor
    saveAllFlowsToServer();

    // Actualizar diagrama si está visible
    if (document.getElementById('flowDiagramTab') && document.getElementById('flowDiagramTab').classList.contains('active')) {
        generateFlowDiagram(flow);
    }
}

// Eliminar opción actual (versión para modal)
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

    // Cerrar el modal
    closeOptionEditModal();

    // Actualizar UI
    currentFlowOption = null;
    loadFlowOptions(flow);

    showNotification('Opción eliminada', 'success');

    // Guardar cambios en el servidor
    saveAllFlowsToServer();

    // Actualizar diagrama si está visible
    if (document.getElementById('flowDiagramTab') && document.getElementById('flowDiagramTab').classList.contains('active')) {
        generateFlowDiagram(flow);
    }
}


// Abrir el modal de edición de mensaje
function openMessageEditModal(key) {
    if (!currentFlows || !currentFlows[currentSelectedFlow]) return;

    const flow = currentFlows[currentSelectedFlow];
    if (!flow.messages || !flow.messages[key]) return;

    currentFlowMessage = key;
    currentFlowStep = null;
    currentFlowOption = null;

    // Obtener el modal
    const modal = document.getElementById('messageEditModal');
    if (!modal) return;

    // Mostrar el modal
    modal.style.display = 'flex';

    // Actualizar los campos del formulario
    updateMessageEditForm();

    // Actualizar vista previa
    updateMessagePreview();

    // Evitar que el fondo se desplace
    document.body.style.overflow = 'hidden';
}

// Cerrar el modal de edición de mensaje
function closeMessageEditModal() {
    const modal = document.getElementById('messageEditModal');
    if (modal) {
        modal.style.display = 'none';
    }

    // Restaurar el desplazamiento del fondo
    document.body.style.overflow = 'auto';
}