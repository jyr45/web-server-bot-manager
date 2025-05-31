// routes/auth-router.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('../db/mysql');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this';
const TOKEN_EXPIRE = process.env.TOKEN_EXPIRE || '24h';

// Iniciar sesión
router.post('/login', async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email y contraseña son requeridos' });
    }
    
    // Buscar usuario por email
    const users = await db.query('SELECT * FROM users WHERE email = ? AND active = 1', [email]);
    
    if (users.length === 0) {
      return res.status(401).json({ success: false, error: 'Credenciales inválidas' });
    }
    
    const user = users[0];
    
    // Verificar contraseña
    const passwordMatch = await bcrypt.compare(password, user.password);
    
    if (!passwordMatch) {
      return res.status(401).json({ success: false, error: 'Credenciales inválidas' });
    }
    
    // Generar token JWT
    const tokenDuration = rememberMe ? '30d' : TOKEN_EXPIRE;
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name }, 
      JWT_SECRET, 
      { expiresIn: tokenDuration }
    );
    
    // Actualizar último login
    await db.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);
    
    // Enviar respuesta
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Verificar token
router.get('/verify', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ success: false, error: 'Token no proporcionado' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ success: true, user: decoded });
  } catch (error) {
    res.status(401).json({ success: false, error: 'Token inválido o expirado' });
  }
});

// Obtener perfil del usuario
router.get('/profile', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ success: false, error: 'Token no proporcionado' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Obtener datos actualizados del usuario
    const users = await db.query('SELECT id, name, email, role, created_at, last_login FROM users WHERE id = ?', [decoded.id]);
    
    if (users.length === 0) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }
    
    res.json({ success: true, user: users[0] });
  } catch (error) {
    res.status(401).json({ success: false, error: 'Token inválido o expirado' });
  }
});

module.exports = router;