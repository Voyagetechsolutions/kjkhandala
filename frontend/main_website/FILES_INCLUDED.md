# Files Included in Main Website

## 📄 Public Pages (14 pages)

All pages in `src/pages/`:

1. **Index.tsx** - Home/Landing page
2. **About.tsx** - About Us page
3. **OurCoaches.tsx** - Our Fleet page (bus showcase)
4. **Charters.tsx** - Charter Services page
5. **Contact.tsx** - Contact Us page
6. **Careers.tsx** - Careers/Jobs page
7. **BookingOffices.tsx** - Booking Office Locations
8. **FAQs.tsx** - Frequently Asked Questions
9. **Terms.tsx** - Terms & Conditions
10. **Privacy.tsx** - Privacy Policy
11. **TicketRules.tsx** - Ticket Rules
12. **ServiceAdvisories.tsx** - Service Advisories
13. **AcceptanceOfRisk.tsx** - Acceptance of Risk
14. **NotFound.tsx** - 404 Error Page

## 🧩 Shared Components (19 components)

All components in `src/components/`:

1. **Navbar.tsx** - Navigation bar with logo and menu
2. **Footer.tsx** - Footer with links and info
3. **Hero.tsx** - Main hero section
4. **NewHero.tsx** - Alternative hero design
5. **HeroCarousel.tsx** - Hero image carousel
6. **HeroSlideshow.tsx** - Hero slideshow component
7. **AboutStorySection.tsx** - About story section
8. **ServicesSection.tsx** - Services showcase
9. **WhyChooseUsSection.tsx** - Why choose us section
10. **PopularRoutesSection.tsx** - Popular routes display
11. **MobileAppSection.tsx** - Mobile app promotion
12. **SupportSection.tsx** - Support/help section
13. **DiscountsSection.tsx** - Discounts and offers
14. **BookingWidget.tsx** - Trip search/booking widget
15. **CurrencySelector.tsx** - Multi-currency selector
16. **DateInput.tsx** - Date input component
17. **TypingAnimation.tsx** - Typing animation effect
18. **LayoutWrapper.tsx** - Layout wrapper component
19. **RouteWrapper.tsx** - Route wrapper component

## 🎨 UI Components (49 components)

All shadcn/ui components in `src/components/ui/`:

- accordion, alert, alert-dialog, aspect-ratio, avatar
- badge, breadcrumb, button
- calendar, card, carousel, chart, checkbox, collapsible, command, context-menu
- dialog, drawer, dropdown-menu
- form
- hover-card
- input, input-otp
- label
- menubar
- navigation-menu
- pagination, popover, progress
- radio-group, resizable
- scroll-area, select, separator, sheet, sidebar, skeleton, slider, sonner, switch
- table, tabs, textarea, toast, toaster, toggle, toggle-group, tooltip
- use-toast (hook)

## 📚 Library Files

In `src/lib/`:
- All utility functions and configurations
- Query client setup
- Supabase client
- Helper functions

## 🔧 Contexts

In `src/contexts/`:
- **CurrencyContext** - Multi-currency support

## 🪝 Hooks

In `src/hooks/`:
- All custom React hooks used by public pages

## 🖼️ Public Assets (32 files)

In `public/`:
- **Bus photos**: 2buses1-13.jpg, scania1-7.jpg, torino1-4.jpg
- **Branding**: logo.png, favicon.ico, whitebgbuseskj.png
- **Config**: manifest.json, robots.txt, service-worker.js
- **Other**: offline.html, placeholder.svg

## ⚙️ Configuration Files (9 files)

Root level:
1. **package.json** - Dependencies and scripts
2. **vite.config.ts** - Vite configuration
3. **tailwind.config.ts** - TailwindCSS configuration
4. **postcss.config.js** - PostCSS configuration
5. **tsconfig.json** - TypeScript base config
6. **tsconfig.app.json** - App TypeScript config
7. **tsconfig.node.json** - Node TypeScript config
8. **components.json** - shadcn/ui config
9. **eslint.config.js** - ESLint configuration

## 📝 Entry Files

- **index.html** - HTML entry point
- **src/main.tsx** - React entry point
- **src/App.tsx** - Main app component (public routes only)
- **src/index.css** - Global styles
- **src/App.css** - App-specific styles

## 📊 Summary

| Category | Count |
|----------|-------|
| **Public Pages** | 14 |
| **Shared Components** | 19 |
| **UI Components** | 49 |
| **Assets** | 32 |
| **Config Files** | 9 |
| **Total Files** | 123+ |

## ✅ What's Working

- ✅ All public pages are standalone
- ✅ No authentication dependencies
- ✅ Complete UI component library
- ✅ All styling and assets included
- ✅ Ready to build and deploy independently

## 🔗 Routes Available

```
/                    → Home page
/about               → About Us
/our-coaches         → Fleet/Coaches
/charters            → Charter Services
/contact             → Contact Us
/careers             → Careers
/booking-offices     → Booking Offices
/faqs                → FAQs
/terms               → Terms & Conditions
/privacy             → Privacy Policy
/ticket-rules        → Ticket Rules
/service-advisories  → Service Advisories
/risk                → Acceptance of Risk
*                    → 404 Page
```

## 🚀 Next Steps

1. Run `npm install` to install dependencies
2. Run `npm run dev` to start development server
3. Visit `http://localhost:5173`
4. Build with `npm run build` when ready to deploy

---

**Note**: This is a clean, standalone version containing only public-facing marketing and informational pages. No admin, operations, driver, finance, HR, or booking flow pages are included.
