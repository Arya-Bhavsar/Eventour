#!/bin/bash
# filepath: /Users/jonnypater/eventure/start-app.sh

echo "Starting Eventure application..."

# Start backend in background
cd backend
source venv/bin/activate
uvicorn app:app --reload &
BACKEND_PID=$!
# Start frontend in background
cd ../ui
npm start &
FRONTEND_PID=$!

echo "✅ Backend running at http://localhost:8000"
echo "✅ Frontend running at http://localhost:3000"
echo "✅ API docs at http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for Ctrl+C
trap "echo 'Stopping services...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
cd backend
deactivate
cd ..