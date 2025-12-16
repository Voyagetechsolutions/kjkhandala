# 🔗 SaaS Integration Guide
## Connecting Main Website ↔ VTS SaaS

This document explains how the **main_website** (marketing site) connects to the **vts_saas** (multi-tenant application).

---

## 📁 Project Structure

```
frontend/
├── main_website/         # 🌐 Public Marketing Website
│   ├── Home, About, Fleet, Contact
│   ├── Pricing, Features
│   └── Sign Up Flow (leads to VTS)
│
├── vts_saas/            # 🔐 Multi-Tenant SaaS App
│   ├── Tenant Dashboard
│   ├── Fleet Management
│   ├── Operations, Finance, HR
│   └── API Management
│
└── SAAS_INTEGRATION.md  # 📖 This file
```

---

## 🌊 User Flow

### **Flow 1: New Tenant Sign-Up**
```
1. User visits: https://voyage.com
2. Clicks "Start Free Trial" button
3. Redirected to: https://vts.voyage.com/signup
4. Fills out company details:
   - Company name
   - Email
   - Phone
   - Industry
5. Account created → Email verification
6. Redirected to: https://vts.voyage.com/{tenant-slug}/dashboard
7. Onboarding wizard:
   - Add first bus
   - Create first route
   - Invite team members
   - Get API keys
```

### **Flow 2: Existing User Login**
```
1. User visits: https://voyage.com
2. Clicks "Sign In" button
3. Redirected to: https://vts.voyage.com/login
4. Enters credentials (or SSO)
5. Auth0/Clerk authenticates
6. Redirected to: https://vts.voyage.com/{tenant-slug}/dashboard
```

### **Flow 3: Widget User (End Customer)**
```
1. Customer visits bus company website: https://acme-buses.com
2. Uses embedded Voyage booking widget
3. Searches trips, selects seats, pays
4. Receives e-ticket via email
5. (Optional) Can track booking at: https://voyage.com/bookings/{booking-id}
```

---

## 🔑 Authentication Architecture

### **Auth Provider: Auth0 or Clerk**

**Why Auth0/Clerk?**
- ✅ Built-in multi-tenancy support
- ✅ SSO (Single Sign-On) ready
- ✅ Social logins (Google, Microsoft)
- ✅ MFA (Multi-Factor Authentication)
- ✅ User management UI
- ✅ Session management
- ✅ Role-based access control

### **Recommended: Clerk**
Clerk is modern, developer-friendly, and has better React integration.

**Installation:**
```bash
cd frontend/vts_saas
npm install @clerk/clerk-react
```

**Setup in vts_saas:**
```typescript
// vts_saas/src/main.tsx
import { ClerkProvider } from '@clerk/clerk-react';

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

createRoot(document.getElementById("root")!).render(
  <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
    <App />
  </ClerkProvider>
);
```

```typescript
// vts_saas/src/App.tsx
import { SignedIn, SignedOut, RedirectToSignIn, useUser } from '@clerk/clerk-react';

function App() {
  return (
    <>
      <SignedIn>
        <Dashboard />
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}
```

---

## 🔐 Tenant Context Management

### **TenantContext.tsx**
```typescript
// vts_saas/src/contexts/TenantContext.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '@/lib/supabase';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo_url: string;
  status: string;
  subscription_tier: string;
}

interface TenantContextType {
  tenant: Tenant | null;
  loading: boolean;
  switchTenant: (tenantId: string) => void;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadUserTenant();
    }
  }, [user]);

  async function loadUserTenant() {
    try {
      // Get user's tenant from Supabase
      const { data, error } = await supabase
        .from('tenant_users')
        .select('tenant:tenants(*)')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (error) throw error;
      setTenant(data.tenant);
    } catch (error) {
      console.error('Error loading tenant:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <TenantContext.Provider value={{ tenant, loading, switchTenant: loadUserTenant }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) throw new Error('useTenant must be used within TenantProvider');
  return context;
}
```

---

## 🌐 Main Website → VTS Links

### **In main_website components:**

```typescript
// main_website/src/components/Navbar.tsx
import { Button } from "@/components/ui/button";

export default function Navbar() {
  return (
    <nav>
      {/* ... other nav items ... */}
      
      {/* Sign In - redirects to VTS */}
      <Button 
        variant="outline"
        onClick={() => window.location.href = 'https://vts.voyage.com/login'}
      >
        Sign In
      </Button>
      
      {/* Sign Up - redirects to VTS */}
      <Button 
        onClick={() => window.location.href = 'https://vts.voyage.com/signup'}
      >
        Start Free Trial
      </Button>
    </nav>
  );
}
```

```typescript
// main_website/src/pages/Index.tsx (Home page)
<section className="cta-section">
  <h2>Ready to transform your bus operations?</h2>
  <Button 
    size="lg"
    onClick={() => window.location.href = 'https://vts.voyage.com/signup?ref=homepage'}
  >
    Get Started - It's Free!
  </Button>
</section>
```

---

## 🎨 Branding: "Powered by Voyage"

### **VTS SaaS Footer Component:**

```typescript
// vts_saas/src/components/PoweredByVoyage.tsx
import { Link } from 'react-router-dom';

export default function PoweredByVoyage() {
  return (
    <div className="flex items-center justify-center py-4 text-sm text-muted-foreground border-t">
      <span>Powered by</span>
      <Link 
        to="https://voyage.com" 
        target="_blank"
        className="ml-1 font-semibold text-primary hover:underline"
      >
        Voyage
      </Link>
      <span className="mx-2">•</span>
      <Link to="/terms" className="hover:underline">Terms</Link>
      <span className="mx-2">•</span>
      <Link to="/privacy" className="hover:underline">Privacy</Link>
      <span className="mx-2">•</span>
      <Link to="/support" className="hover:underline">Support</Link>
    </div>
  );
}
```

**Usage in all VTS pages:**
```typescript
// vts_saas/src/components/DashboardLayout.tsx
import PoweredByVoyage from './PoweredByVoyage';

export default function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <PoweredByVoyage />
    </div>
  );
}
```

---

## 📊 Deployment Strategy

### **Option 1: Subdomains (Recommended)**
```
Main Website:      https://voyage.com
VTS SaaS:          https://vts.voyage.com
API:               https://api.voyage.com
Widget CDN:        https://widget.voyage.com
Documentation:     https://docs.voyage.com
```

**Benefits:**
- Clear separation of concerns
- Can deploy independently
- Better SEO for main site
- Easier SSL management

### **Option 2: Subdirectories**
```
Main Website:      https://voyage.com
VTS SaaS:          https://voyage.com/app
API:               https://voyage.com/api
```

**Benefits:**
- Single domain
- Shared cookies/sessions
- Simpler DNS setup

---

## 🚀 Deployment Configuration

### **Vercel Deployment (Recommended)**

**vercel.json for main_website:**
```json
{
  "buildCommand": "cd frontend/main_website && npm run build",
  "outputDirectory": "frontend/main_website/dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

**vercel.json for vts_saas:**
```json
{
  "buildCommand": "cd frontend/vts_saas && npm run build",
  "outputDirectory": "frontend/vts_saas/dist",
  "framework": "vite",
  "env": {
    "VITE_CLERK_PUBLISHABLE_KEY": "@clerk_publishable_key",
    "VITE_SUPABASE_URL": "@supabase_url",
    "VITE_SUPABASE_ANON_KEY": "@supabase_anon_key"
  },
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

---

## 🔗 Cross-Origin Communication

### **Shared Data via URL Parameters:**

**Passing tenant context:**
```
https://vts.voyage.com/signup?
  utm_source=homepage&
  utm_campaign=free_trial&
  ref=acme-buses
```

**Reading params in VTS:**
```typescript
const searchParams = new URLSearchParams(window.location.search);
const refCompany = searchParams.get('ref');
const utmSource = searchParams.get('utm_source');
```

### **Local Storage (same domain):**
```typescript
// Store after signup
localStorage.setItem('voyage_tenant_slug', 'acme-buses');

// Read on next visit
const tenantSlug = localStorage.getItem('voyage_tenant_slug');
```

---

## 📱 Mobile Considerations

For mobile views, you can deep link directly to VTS:

```typescript
// Detect mobile
const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);

if (isMobile) {
  // Deep link to mobile-optimized VTS
  window.location.href = 'https://m.vts.voyage.com/login';
}
```

---

## 🎯 Summary

| Aspect | Main Website | VTS SaaS |
|--------|--------------|----------|
| **Purpose** | Marketing & Awareness | Tenant Management |
| **Auth** | None (public) | Auth0/Clerk Required |
| **URL** | voyage.com | vts.voyage.com |
| **Users** | Potential customers | Authenticated tenants |
| **Branding** | Full Voyage branding | "Powered by Voyage" |
| **Data** | Static content | Dynamic tenant data |

---

## ✅ Next Steps

1. ✅ Set up Clerk account
2. ✅ Configure Clerk application
3. ✅ Update environment variables
4. ✅ Test signup flow
5. ✅ Test tenant context loading
6. ✅ Deploy both sites
7. ✅ Configure DNS & SSL

---

**Questions or issues?**  
Contact: tech@voyage.com
