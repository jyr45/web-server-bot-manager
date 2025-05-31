// Gestión de autenticación
const auth = {
    // Verificar si el usuario está autenticado
    isAuthenticated() {
        return !!this.getToken();
    },
    
    // Obtener token de autenticación
    getToken() {
        return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    },
    
    // Obtener datos del usuario actual
    getUser() {
        const userData = localStorage.getItem('userData') || sessionStorage.getItem('userData');
        return userData ? JSON.parse(userData) : null;
    },
    
    // Guardar información de autenticación
    setAuth(token, user, remember) {
        const storage = remember ? localStorage : sessionStorage;
        storage.setItem('authToken', token);
        storage.setItem('userData', JSON.stringify(user));
    },
    
    // Cerrar sesión
    logout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('userData');
        window.location.href = '/login.html';
    },
    
    // Verificar permisos de administrador
    isAdmin() {
        const user = this.getUser();
        return user && user.role === 'admin';
    },
    
    // Verificar si el usuario es dueño de un bot
    isOwner(botUserId) {
        const user = this.getUser();
        return user && (user.id === botUserId || this.isAdmin());
    },

    // Obtener usuario actual desde localStorage/sessionStorage
    getUser: function() {
        const userData = localStorage.getItem('userData') || sessionStorage.getItem('userData');
        return userData ? JSON.parse(userData) : null;
    },
    
    // Verificar si el usuario actual es administrador
    isAdmin: function() {
        const user = this.getUser();
        return user && user.role === 'admin';
    },
    
    // Verificar si el usuario es dueño de un recurso
    isOwner: function(ownerId) {
        const user = this.getUser();
        return user && (user.id === ownerId || user.role === 'admin');
    },
    
    // Verificar token en el servidor
    async verifyToken() {
        try {
            const token = this.getToken();
            
            if (!token) {
                return false;
            }
            
            const response = await fetch('/api/auth/verify', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const data = await response.json();
            return data.success;
        } catch (error) {
            console.error('Error verificando token:', error);
            return false;
        }
    },
    
    // Función para iniciar sesión
    async login(email, password, rememberMe) {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    password,
                    rememberMe
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.setAuth(data.token, data.user, rememberMe);
                return { success: true, user: data.user };
            } else {
                return { success: false, error: data.error || 'Credenciales inválidas' };
            }
        } catch (error) {
            console.error('Error en login:', error);
            return { success: false, error: 'Error de conexión al servidor' };
        }
    }
};

// Función para realizar peticiones autenticadas
async function fetchWithAuth(url, options = {}) {
    const token = auth.getToken();
    
    if (!token) {
        // Si no hay token y se intenta una operación autenticada, redirigir al login
        auth.logout();
        return;
    }
    
    // Configurar headers con el token de autenticación
    const headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`
    };
    
    try {
        const response = await fetch(url, {
            ...options,
            headers
        });
        
        // Si recibimos un 401 (No autorizado), el token puede ser inválido
        if (response.status === 401) {
            // Verificar si el token sigue siendo válido
            const isValid = await auth.verifyToken();
            
            if (!isValid) {
                // Si el token no es válido, cerrar sesión
                auth.logout();
                return;
            }
        }
        
        return response;
    } catch (error) {
        console.error('Error en petición autenticada:', error);
        throw error;
    }
}

// Proteger rutas que requieren autenticación
document.addEventListener('DOMContentLoaded', async function() {
    // Excepto login.html, verificar autenticación en todas las páginas
    if (!window.location.pathname.includes('login.html')) {
        const isValid = await auth.verifyToken();
        
        if (!isValid) {
            // Redirigir a login si no está autenticado
            window.location.href = '/login.html';
        } else {
            // Configurar UI según rol de usuario
            setupUserInterface();
        }
    }
});

// Configurar interfaz según el rol del usuario
function setupUserInterface() {
    const user = auth.getUser();
    
    if (!user) return;
    
    // Mostrar nombre de usuario
    const userNameElements = document.querySelectorAll('.user-name');
    userNameElements.forEach(el => {
        el.textContent = user.name;
    });
    
    // Ocultar elementos solo para administradores
    if (user.role !== 'admin') {
        const adminOnlyElements = document.querySelectorAll('.admin-only');
        adminOnlyElements.forEach(el => {
            el.style.display = 'none';
        });
    }
    
    // Mostrar sección de perfil si existe
    const userSection = document.getElementById('user-profile');
    if (userSection) {
        const roleText = user.role === 'admin' ? 'Administrador' : 'Usuario';
        userSection.innerHTML = `
            <h3>Perfil de Usuario</h3>
            <p><strong>Nombre:</strong> ${user.name}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Rol:</strong> ${roleText}</p>
            <button class="btn btn-danger" onclick="auth.logout()">
                <i class="fas fa-sign-out-alt"></i> Cerrar Sesión
            </button>
        `;
    }
}

// Exponer logout como función global
window.logout = function() {
    auth.logout();
};