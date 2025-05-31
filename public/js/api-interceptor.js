(function() {
    // Solo si estamos en un navegador
    if (typeof window === 'undefined') return;
    
    console.log('API Interceptor inicializado');
    
    // Guardar referencia al fetch original
    const originalFetch = window.fetch;

    // Función para obtener headers de autenticación
    function getAuthHeaders() {
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        return {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
        };
    }

    // Sobreescribir la función fetch
    window.fetch = async function(url, options = {}) {
        // Solo interceptar llamadas a la API
        if ((url.includes('/api/') || url.startsWith('http')) && !url.includes('/api/auth/login')) {
            const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
            
            if (!token) {
                console.warn('Intento de llamada a API sin token:', url);
                
                // Para llamadas que no son de login, redirigir si no hay token
                if (!url.includes('/api/auth/')) {
                    // Comentado para evitar redirecciones innecesarias durante desarrollo
                    // window.location.href = '/login.html';
                    console.error('⚠️ API call without authentication:', url);
                }
            }
            
            // Preparar opciones con headers de autenticación
            options = {
                ...options,
                headers: {
                    ...options.headers,
                    ...getAuthHeaders()
                }
            };
        }
        
        // Agregar timeout por defecto
        if (!options.timeout && typeof AbortController !== 'undefined') {
            const controller = new AbortController();
            options.signal = controller.signal;
            
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
            
            try {
                // Llamar al fetch original con las opciones actualizadas
                const response = await originalFetch(url, options);
                clearTimeout(timeoutId);
                return response;
            } catch (error) {
                clearTimeout(timeoutId);
                throw error;
            }
        } else {
            // Llamar al fetch original con las opciones actualizadas
            return originalFetch(url, options);
        }
    };
    
    // Exponer una función auxiliar global para peticiones autenticadas
    window.fetchWithAuth = async function(url, options = {}) {
        // Preparar opciones con headers de autenticación
        options = {
            ...options,
            headers: {
                ...options.headers,
                ...getAuthHeaders()
            }
        };
        
        return fetch(url, options);
    };
})();