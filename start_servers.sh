#!/bin/bash

# Script para levantar frontend y backend simultáneamente

echo "🚀 Iniciando servidores..."

# Directorio base del proyecto
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Función para manejar la señal de interrupción (Ctrl+C)
cleanup() {
    echo -e "\n🛑 Deteniendo servidores..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Iniciar backend en segundo plano
echo "📦 Iniciando backend en http://localhost:8000..."
cd "$PROJECT_DIR/backend"
./venv/bin/python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Esperar un momento para que el backend inicie
sleep 2

# Iniciar frontend en segundo plano
echo "⚛️  Iniciando frontend en http://localhost:5173..."
cd "$PROJECT_DIR/frontend"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Servidores iniciados:"
echo "   - Frontend: http://localhost:5173"
echo "   - Backend:  http://localhost:8000"
echo "   - API Docs: http://localhost:8000/docs"
echo ""
echo "Presiona Ctrl+C para detener ambos servidores"

# Esperar a que ambos procesos terminen
wait
