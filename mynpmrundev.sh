#!/bin/bash

# Port à utiliser
PORT=3002

# Vérifier si le port est utilisé
PROC=$(lsof -ti:$PORT)

if [ -n "$PROC" ]; then
    echo "Port $PORT est occupé par le PID $PROC. Arrêt du process..."
    kill -9 $PROC
    sleep 1
    echo "Process tué. Port $PORT libre."
else
    echo "Port $PORT libre."
fi

# Lancer npm run dev (mode développement)
echo "Lancement de npm run dev sur le port $PORT..."
npx next dev -p $PORT
