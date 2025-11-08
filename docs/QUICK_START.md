# 🚀 KJ Khandala - Quick Start Guide

## ✅ Installation Complete!

### What's Ready:
- ✅ Web app dependencies installed
- ✅ Recharts installed for analytics
- ⏳ Mobile app installing (in progress)

## 🖥️ Run Web Application

```bash
# Make sure you're in the root directory
cd "c:\Users\Mthokozisi\Downloads\KJ khandala\voyage-onboard-now"

# Start the development server
npm run dev
```

**Access at**: http://localhost:8080

## 📱 Run Mobile Application

```bash
# Navigate to mobile directory
cd mobile

# Start Expo
npm start
```

Then:
1. Download **Expo Go** app on your phone
2. Scan the QR code that appears
3. App will load on your device!

## 🎨 Test New Features

### 1. Currency Selector
- Look at top-right of navbar
- Click to switch between USD, Pula, Rand
- Prices update automatically

### 2. Visual Seat Map
- Go to booking flow
- Select a trip
- See the beautiful bus seat layout
- Click seats to select

### 3. QR Code E-Tickets
- Complete a booking
- View your e-ticket
- See QR code with booking details
- Download PDF with QR code

### 4. Admin Analytics (Coming Soon)
- Login as admin
- Go to dashboard
- Add the analytics components

## ⚠️ Common Warnings (Safe to Ignore)

### CSS Warnings
```
Unknown at rule @tailwind
Unknown at rule @apply
```
**Status**: Normal - Tailwind CSS directives work fine

### TypeScript Warnings
```
File 'expo/tsconfig.base' not found
```
**Status**: Will resolve after mobile install completes

## 🔧 If You Get Errors

### Web App Won't Start
```bash
# Clear cache and reinstall
rm -rf node_modules
npm install
npm run dev
```

### Mobile App Issues
```bash
cd mobile
rm -rf node_modules
npm install --legacy-peer-deps
npm start -- --clear
```

### Port Already in Use
```bash
# Kill process on port 8080
npx kill-port 8080

# Or change port in vite.config.ts
```

## 📦 Environment Variables

### Web App (.env in root)
```env
VITE_SUPABASE_URL=https://dvllpqinpoxoscpgigmw.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_key_here

# Optional for production
VITE_DPO_COMPANY_TOKEN=your_token
VITE_RESEND_API_KEY=your_key
```

### Mobile App (.env in mobile/)
```env
EXPO_PUBLIC_SUPABASE_URL=https://dvllpqinpoxoscpgigmw.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_key_here
```

## 🎯 Feature Checklist

Test these features:

- [ ] Login/Register
- [ ] Search trips
- [ ] Select seats (visual map)
- [ ] Change currency
- [ ] View bookings
- [ ] See QR code on e-ticket
- [ ] Admin dashboard

## 📱 Mobile App Setup

After install completes:

```bash
cd mobile

# Copy environment file
copy .env.example .env

# Start the app
npm start
```

## 🚀 Production Deployment

### Web App
```bash
# Build for production
npm run build

# Deploy to Vercel
vercel deploy

# Or Netlify
netlify deploy
```

### Mobile App
```bash
cd mobile

# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build for Android
eas build --platform android

# Build for iOS
eas build --platform ios
```

## 📞 Need Help?

Check these files:
- `COMPLETE_FEATURES.md` - All features
- `IMPLEMENTATION_GUIDE.md` - Detailed setup
- `ENHANCEMENT_STATUS.md` - Status tracking

## 🎉 You're All Set!

Your KJ Khandala booking system is ready to use!

**Start with**: `npm run dev`

---

**KJ Khandala Travel & Tours** 🚌
