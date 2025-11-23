#!/bin/bash
# Bash script to install all dependencies
# Run this with: bash install-dependencies.sh

echo "🚀 Installing dependencies for BMS Voyage Onboard System..."
echo ""

# Backend
echo "📦 Installing Backend dependencies..."
cd backend
npm install @supabase/supabase-js
if [ $? -eq 0 ]; then
    echo "✅ Backend dependencies installed successfully!"
else
    echo "❌ Backend installation failed!"
fi
echo ""

# Web
echo "📦 Installing Web dependencies..."
cd ../web
npm install @supabase/supabase-js react-big-calendar moment @types/react-big-calendar
if [ $? -eq 0 ]; then
    echo "✅ Web dependencies installed successfully!"
else
    echo "❌ Web installation failed!"
fi
echo ""

# Driver App
echo "📦 Installing Driver App dependencies..."
cd ../mobile/driver-app
npx expo install @supabase/supabase-js @react-native-async-storage/async-storage
if [ $? -eq 0 ]; then
    echo "✅ Driver App dependencies installed successfully!"
else
    echo "❌ Driver App installation failed!"
fi
echo ""

# Return to root
cd ../..

echo "🎉 All dependencies installed!"
echo ""
echo "Next steps:"
echo "1. Set up environment variables (.env files)"
echo "2. Run database migration: psql -f supabase/migrations/20251124_driver_shifts_final.sql"
echo "3. Start backend: cd backend && npm run dev"
echo "4. Start web: cd web && npm start"
echo "5. Start driver app: cd mobile/driver-app && npx expo start"
