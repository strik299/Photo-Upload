#!/usr/bin/env bash
# exit on error
set -o errexit

# Instalar dependencias de Python
cd backend
pip install -r requirements.txt

# Instalar dependencias de Frontend y construir
cd ../frontend
npm install
npm run build

# Volver a la raíz
cd ..
