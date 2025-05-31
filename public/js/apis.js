// Implementación del módulo de Configuración de APIs
// Este script debe incluirse en index.html o importarse como un módulo

// Estado global de la configuración de APIs
let currentAPIConfig = {
    folioApi: '',
    serviciosApi: '',
    garantiasApi: '',
    timeout: 30,
    retries: 3,
    password: ''
};

let selectedBotForAPI = null;

// Inicialización
function initAPIConfigModule() {
    // Cargar bots para selector
    loadBotsForAPISelector();
    
    // Event listeners para los inputs
    document.getElementById('apiConfigFolio').addEventListener('input', updateAPIConfig);
    document.getElementById('apiConfigServicios').addEventListener('input', updateAPIConfig);
    document.getElementById('apiConfigGarantias').addEventListener('input', updateAPIConfig);
    document.getElementById('apiConfigTimeout').addEventListener('input', updateAPIConfig);
    document.getElementById('apiConfigRetries').addEventListener('input', updateAPIConfig);
    document.getElementById('apiConfigPassword').addEventListener('input', updateAPIConfig);
}

// Cargar bots para el selector
async function loadBotsForAPISelector() {
    try {
        const response = await fetchWithAuth('/api/bots');
        const data = await response.json();
        
        if (data.success && data.bots.length > 0) {
            const apiConfigSection = document.getElementById('apis');
            if (!apiConfigSection) return;
            
            // Añadir selector de bots si no existe
            if (!document.getElementById('selectedBotForAPI')) {
                const selectorHtml = `
                    <div class="form-group">
                        <label>Seleccionar Bot</label>
                        <select class="form-control" id="selectedBotForAPI">
                            <option value="">Selecciona un bot para configurar</option>
                        </select>
                    </div>
                `;
                
                // Insertar el selector al principio de la sección
                const firstCard = apiConfigSection.querySelector('.card');
                if (firstCard) {
                    const cardBody = firstCard.querySelector('.card-body') || firstCard;
                    cardBody.insertAdjacentHTML('afterbegin', selectorHtml);
                    
                    // Añadir event listener
                    document.getElementById('selectedBotForAPI').addEventListener('change', function() {
                        const botId = this.value;
                        if (botId) {
                            loadAPIConfigForBot(botId);
                        } else {
                            clearAPIConfigForm();
                        }
                    });
                }
            }
            
            // Llenar el selector con los bots
            const selectElement = document.getElementById('selectedBotForAPI');
            if (selectElement) {
                // Mantener la selección actual si existe
                const currentSelection = selectElement.value;
                
                selectElement.innerHTML = '<option value="">Selecciona un bot para configurar</option>';
                
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
        console.error('Error cargando bots para configuración de APIs:', error);
        showNotification('Error cargando bots', 'error');
    }
}

// Cargar configuración de APIs para un bot específico
async function loadAPIConfigForBot(botId) {
    try {
        const response = await fetch(`/api/bots/${botId}`);
        const data = await response.json();
        
        if (data.success) {
            selectedBotForAPI = data.bot;
            
            // Extraer configuración de APIs
            const apiConfig = selectedBotForAPI.apis || {};
            
            // Llenar el formulario con la configuración existente
            currentAPIConfig = {
                folioApi: apiConfig.folioApi || '',
                serviciosApi: apiConfig.serviciosApi || '',
                garantiasApi: apiConfig.garantiasApi || '',
                timeout: apiConfig.timeout || 30,
                retries: apiConfig.retries || 3,
                password: selectedBotForAPI.apiPassword || ''
            };
            
            updateAPIConfigForm();
        } else {
            showNotification('Error cargando configuración de APIs del bot', 'error');
        }
    } catch (error) {
        console.error('Error cargando configuración de APIs:', error);
        showNotification('Error de comunicación con el servidor', 'error');
    }
}

// Actualizar formulario con la configuración actual
function updateAPIConfigForm() {
    document.getElementById('apiConfigFolio').value = currentAPIConfig.folioApi;
    document.getElementById('apiConfigServicios').value = currentAPIConfig.serviciosApi;
    document.getElementById('apiConfigGarantias').value = currentAPIConfig.garantiasApi;
    document.getElementById('apiConfigTimeout').value = currentAPIConfig.timeout;
    document.getElementById('apiConfigRetries').value = currentAPIConfig.retries;
    document.getElementById('apiConfigPassword').value = currentAPIConfig.password;
}

// Limpiar el formulario
function clearAPIConfigForm() {
    selectedBotForAPI = null;
    currentAPIConfig = {
        folioApi: '',
        serviciosApi: '',
        garantiasApi: '',
        timeout: 30,
        retries: 3,
        password: ''
    };
    updateAPIConfigForm();
}

// Actualizar la configuración de APIs desde los inputs
function updateAPIConfig() {
    currentAPIConfig.folioApi = document.getElementById('apiConfigFolio').value.trim();
    currentAPIConfig.serviciosApi = document.getElementById('apiConfigServicios').value.trim();
    currentAPIConfig.garantiasApi = document.getElementById('apiConfigGarantias').value.trim();
    currentAPIConfig.timeout = parseInt(document.getElementById('apiConfigTimeout').value) || 30;
    currentAPIConfig.retries = parseInt(document.getElementById('apiConfigRetries').value) || 3;
    currentAPIConfig.password = document.getElementById('apiConfigPassword').value.trim();
}

// Guardar configuración de APIs
async function saveApiConfig() {
    if (!selectedBotForAPI) {
        showNotification('Selecciona un bot primero', 'warning');
        return;
    }
    
    updateAPIConfig();
    
    try {
        const response = await fetch(`/api/bots/${selectedBotForAPI.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                apiPassword: currentAPIConfig.password,
                apis: {
                    folioApi: currentAPIConfig.folioApi,
                    serviciosApi: currentAPIConfig.serviciosApi,
                    garantiasApi: currentAPIConfig.garantiasApi,
                    timeout: currentAPIConfig.timeout,
                    retries: currentAPIConfig.retries
                }
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Configuración de APIs guardada exitosamente', 'success');
            selectedBotForAPI = data.bot;
        } else {
            showNotification('Error guardando configuración de APIs: ' + data.error, 'error');
        }
    } catch (error) {
        console.error('Error guardando configuración de APIs:', error);
        showNotification('Error de comunicación con el servidor', 'error');
    }
}

// Probar todas las APIs configuradas
async function testAllApis() {
    if (!selectedBotForAPI) {
        showNotification('Selecciona un bot primero', 'warning');
        return;
    }
    
    updateAPIConfig();
    
    // Verificar si hay al menos una API configurada
    if (!currentAPIConfig.folioApi && !currentAPIConfig.serviciosApi && !currentAPIConfig.garantiasApi) {
        showNotification('No hay APIs configuradas para probar', 'warning');
        return;
    }
    
    // Mostrar indicador de carga
    const testButton = document.querySelector('button[onclick="testAllApis()"]');
    const originalButtonText = testButton.innerHTML;
    testButton.disabled = true;
    testButton.innerHTML = '<div class="loading"></div> Probando...';
    
    // Resultados de las pruebas
    const results = {
        success: true,
        tests: []
    };
    
    try {
        // Probar cada API configurada
        if (currentAPIConfig.folioApi) {
            const folioResult = await testAPI('folio', currentAPIConfig.folioApi);
            results.tests.push({
                name: 'API de Folios',
                url: currentAPIConfig.folioApi,
                success: folioResult.success,
                message: folioResult.message
            });
            if (!folioResult.success) results.success = false;
        }
        
        if (currentAPIConfig.serviciosApi) {
            const serviciosResult = await testAPI('servicios', currentAPIConfig.serviciosApi);
            results.tests.push({
                name: 'API de Servicios',
                url: currentAPIConfig.serviciosApi,
                success: serviciosResult.success,
                message: serviciosResult.message
            });
            if (!serviciosResult.success) results.success = false;
        }
        
        if (currentAPIConfig.garantiasApi) {
            const garantiasResult = await testAPI('garantias', currentAPIConfig.garantiasApi);
            results.tests.push({
                name: 'API de Garantías',
                url: currentAPIConfig.garantiasApi,
                success: garantiasResult.success,
                message: garantiasResult.message
            });
            if (!garantiasResult.success) results.success = false;
        }
        
        // Mostrar resultados
        showAPITestResults(results);
    } catch (error) {
        console.error('Error probando APIs:', error);
        showNotification('Error de comunicación con el servidor', 'error');
    } finally {
        // Restaurar botón
        testButton.disabled = false;
        testButton.innerHTML = originalButtonText;
    }
}

// Probar una API específica
async function testAPI(type, url) {
    if (!url) {
        return { success: false, message: 'URL no proporcionada' };
    }
    
    try {
        // Endpoint para probar la API (este endpoint debe ser implementado en el servidor)
        const response = await fetch('/api/test-api', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type,
                url,
                timeout: currentAPIConfig.timeout * 1000, // convertir a milisegundos
                password: currentAPIConfig.password
            })
        });
        
        const data = await response.json();
        return data;
    } catch (error) {
        return { success: false, message: error.message };
    }
}

// Mostrar resultados de pruebas de APIs
function showAPITestResults(results) {
    // Crear modal para mostrar los resultados
    const modalHtml = `
        <div id="apiTestModal" class="modal" style="display: block; position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5);">
            <div class="modal-content" style="background-color: white; margin: 10% auto; padding: 20px; border-radius: 10px; width: 80%; max-width: 600px;">
                <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 15px;">
                    <h4 style="margin: 0;">Resultados de Pruebas de APIs</h4>
                    <span onclick="document.getElementById('apiTestModal').remove()" style="font-size: 24px; cursor: pointer;">&times;</span>
                </div>
                <div class="modal-body">
                    <div style="margin-bottom: 15px;">
                        <h5 style="margin-top: 0;">Resumen</h5>
                        <div style="background-color: ${results.success ? '#e9f7ef' : '#fcf1f0'}; padding: 10px; border-radius: 5px;">
                            <p style="margin: 0;"><strong>${results.success ? '✅ Todas las APIs funcionan correctamente' : '❌ Hay problemas con algunas APIs'}</strong></p>
                        </div>
                    </div>
                    
                    <div class="test-results">
                        ${results.tests.map(test => `
                            <div style="margin-bottom: 10px; background-color: ${test.success ? '#f8f9fa' : '#fcf1f0'}; padding: 15px; border-radius: 8px; border-left: 4px solid ${test.success ? '#28a745' : '#dc3545'};">
                                <p style="margin: 0 0 5px 0;"><strong>${test.name}</strong> ${test.success ? '✅' : '❌'}</p>
                                <p style="margin: 0 0 5px 0; font-size: 0.9em; color: #6c757d; word-break: break-all;"><small>${test.url}</small></p>
                                ${test.message ? `<p style="margin: 5px 0 0 0; ${!test.success ? 'color: #dc3545;' : ''}">${test.message}</p>` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="modal-footer" style="margin-top: 20px; text-align: right;">
                    <button class="btn btn-primary" onclick="document.getElementById('apiTestModal').remove()">Cerrar</button>
                </div>
            </div>
        </div>
    `;
    
    // Añadir modal al body
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// Implementación del endpoint para probar las APIs (debe añadirse al servidor)
// Este código debe añadirse a server.js

/*
// Endpoint para probar APIs
app.post('/api/test-api', async (req, res) => {
    try {
        const { type, url, timeout, password } = req.body;
        
        if (!url) {
            return res.status(400).json({ success: false, message: 'URL no proporcionada' });
        }
        
        // Configurar request
        const axios = require('axios');
        const instance = axios.create({
            timeout: timeout || 30000,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': password ? `Bearer ${password}` : undefined
            }
        });
        
        // Intentar hacer una petición GET a la API
        try {
            const response = await instance.get(url);
            
            // Verificar si la respuesta es válida
            if (response.status >= 200 && response.status < 300) {
                return res.json({ 
                    success: true, 
                    message: `Conexión exitosa (${response.status})`,
                    data: response.data
                });
            } else {
                return res.json({ 
                    success: false, 
                    message: `Error: código de estado ${response.status}`
                });
            }
        } catch (error) {
            if (error.response) {
                // La petición fue hecha y el servidor respondió con un estado fuera del rango 2xx
                return res.json({ 
                    success: false, 
                    message: `Error: código de estado ${error.response.status} - ${error.response.statusText}`
                });
            } else if (error.request) {
                // La petición fue hecha pero no se recibió respuesta
                return res.json({ 
                    success: false, 
                    message: 'Error: No se recibió respuesta del servidor'
                });
            } else {
                // Hubo un error al configurar la petición
                return res.json({ 
                    success: false, 
                    message: `Error: ${error.message}`
                });
            }
        }
    } catch (error) {
        console.error('Error probando API:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});
*/
// Funciones de API con autenticación
const api = {
    // Obtener headers con autenticación
    getHeaders() {
        const token = auth.getToken();
        return {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
        };
    },
    
    // GET request
    async get(url) {
        const response = await fetch(url, {
            headers: this.getHeaders()
        });
        return await response.json();
    },
    
    // POST request
    async post(url, data) {
        const response = await fetch(url, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(data)
        });
        return await response.json();
    },
    
    // PUT request
    async put(url, data) {
        const response = await fetch(url, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(data)
        });
        return await response.json();
    },
    
    // DELETE request
    async delete(url) {
        const response = await fetch(url, {
            method: 'DELETE',
            headers: this.getHeaders()
        });
        return await response.json();
    }
};
// Inicializar el módulo cuando se cargue la página
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si estamos en la sección de configuración de APIs
    if (document.getElementById('apis')) {
        initAPIConfigModule();
    }
});