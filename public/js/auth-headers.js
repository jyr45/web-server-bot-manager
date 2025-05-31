// auth-headers.js
function getAuthHeaders() {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
}

// Función para hacer peticiones autenticadas
async function fetchWithAuth(url, options = {}) {
    const headers = {
        ...options.headers,
        ...getAuthHeaders()
    };
    
    try {
        const response = await fetch(url, {
            ...options,
            headers
        });
        
        if (response.status === 401) {
            // Token inválido o expirado
            console.warn('Token inválido o expirado. Redirigiendo a login...');
            auth.logout();
            window.location.href = '/login.html';
            return null;
        }
        
        return response;
    } catch (error) {
        console.error('Error en fetchWithAuth:', error);
        throw error;
    }
}

// Exponer al ámbito global
window.fetchWithAuth = fetchWithAuth;
window.getAuthHeaders = getAuthHeaders;