// middleware/auth.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this';

// Middleware para verificar token de autenticación
const authenticateToken = (req, res, next) => {
  // Obtener token de cabecera, cookies o query params
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ success: false, error: 'Acceso no autorizado' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ success: false, error: 'Token inválido o expirado' });
    
    req.user = user; // Guardar info del usuario en la solicitud
    next();
  });
};

// Middleware para verificar si es administrador
const isAdmin = (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Acceso denegado. Se requieren permisos de administrador' });
  }
  
  next();
};

module.exports = { authenticateToken, isAdmin };