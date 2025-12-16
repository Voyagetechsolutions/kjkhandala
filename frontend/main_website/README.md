# Voyage Main Website - Public Pages

This folder contains all public-facing pages for the Voyage bus management system that **do not require authentication**.

## 📁 Structure

```
main_website/
├── public/              # Static assets (images, logos, bus photos)
├── src/
│   ├── components/      # Shared UI components
│   │   ├── ui/         # shadcn/ui components
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   ├── Hero.tsx
│   │   └── ...         # Other shared components
│   ├── contexts/        # React contexts (Currency, etc.)
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility functions and configs
│   ├── pages/           # Public page components
│   │   ├── Index.tsx           # Home page
│   │   ├── About.tsx           # About us
│   │   ├── OurCoaches.tsx      # Fleet/Coaches
│   │   ├── Charters.tsx        # Charter services
│   │   ├── Contact.tsx         # Contact page
│   │   ├── Careers.tsx         # Careers
│   │   ├── BookingOffices.tsx  # Booking offices
│   │   ├── FAQs.tsx            # FAQs
│   │   ├── Terms.tsx           # Terms & Conditions
│   │   ├── Privacy.tsx         # Privacy Policy
│   │   ├── TicketRules.tsx     # Ticket rules
│   │   ├── ServiceAdvisories.tsx
│   │   ├── AcceptanceOfRisk.tsx
│   │   └── NotFound.tsx        # 404 page
│   ├── App.tsx          # Main app with public routes only
│   ├── main.tsx         # Entry point
│   └── index.css        # Global styles
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

## 🎯 Purpose

This is a standalone version of the main website that includes:

- ✅ **Home page** - Landing page with hero, services, and booking widget
- ✅ **About page** - Company history, mission, and values
- ✅ **Our Fleet** - Bus fleet showcase with photos
- ✅ **Charters** - Charter service information
- ✅ **Contact** - Contact form and information
- ✅ **Careers** - Job listings and application info
- ✅ **Booking Offices** - Physical office locations
- ✅ **Legal pages** - Terms, Privacy, Ticket Rules
- ✅ **Support pages** - FAQs, Service Advisories

## 🚫 What's NOT Included

This folder **excludes** all authenticated/internal pages:
- ❌ Admin dashboard and management pages
- ❌ Operations and fleet management
- ❌ Driver app pages
- ❌ Finance and HR modules
- ❌ Ticketing system
- ❌ Booking flow (seat selection, payment, confirmation)
- ❌ User authentication pages

## 🛠️ Technology Stack

- **React 18** with TypeScript
- **Vite** for build tooling
- **React Router** for navigation
- **TailwindCSS** for styling
- **shadcn/ui** for UI components
- **React Query** for data fetching
- **Supabase** for backend (API calls only)

## 🚀 Usage

### Installation
```bash
cd frontend/main_website
npm install
```

### Development
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## 📝 Notes

- All pages are **public** and don't require authentication
- The `AuthProvider` has been removed from App.tsx
- Booking widget is included but redirects to main booking flow
- Routes component may reference booking system for trip search
- All styling uses TailwindCSS and shadcn/ui components
- Images are stored in the `public/` folder

## 🔗 Integration

This standalone website can be:
1. **Deployed separately** as a marketing/informational site
2. **Integrated** with the main booking system via links
3. **Used as a subdomain** (e.g., www.voyage.com)
4. **Merged** back into main frontend if needed

## 📦 Dependencies

Key dependencies (from package.json):
- react & react-dom
- react-router-dom
- @tanstack/react-query
- tailwindcss
- shadcn/ui components
- lucide-react (icons)
- supabase-js (API client)

## 🎨 Customization

To customize the website:
1. Edit page content in `src/pages/`
2. Modify components in `src/components/`
3. Update styles in `tailwind.config.ts` and `src/index.css`
4. Replace images in `public/`
5. Configure routes in `src/App.tsx`

## 📞 Support

For questions about this website, contact the development team.
