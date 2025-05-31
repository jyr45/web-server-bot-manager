#!/bin/bash
echo "🚀 Iniciando en modo producción..."
export NODE_ENV=production
pm2 start server.js --name "bot-manager"
pm2 startup
pm2 save
echo "✅ Servidor iniciado con PM2"
