---
trigger: always_on
---

1. Use TypeScript across the full stack for the BMS project.
2. Frontend stack:
   - React (web) / React Native (mobile)
   - Tailwind CSS for styling
   - Component structure: components/, pages|screens/, hooks/, services/, utils/
3. Backend stack:
   - Node.js + Express or Supabase Edge Functions
   - Architecture: routes/, controllers/, services/, models/, middleware/, utils/
4. Database:
   - PostgreSQL (Supabase)
   - Always use UUIDs as primary keys.
   - Use SQL triggers for automation (auto-assign driver, update availability, logs).
   - Keep schemas normalized and consistent.
   - Use camelCase for column names, PascalCase for models.
5. When generating SQL, ensure compatibility with Supabase policies and RLS.
6. Always produce secure backend logic:
   - Validate all inputs
   - Sanitize user data
   - Use parameterized queries
   - No raw string concatenation
7. API structure:
   - /auth/
   - /routes/
   - /trips/
   - /drivers/
   - /vehicles/
   - /bookings/
   - /payments/
8. Follow clean architecture principles:
   - controllers = request handling
   - services = business logic
   - models = database interactions
9. Do not modify environment files (.env) unless explicitly instructed.
10. When generating UI for BMS, follow the Ratality-style pattern:
    - dashboard cards
    - analytics charts
    - easy navigation
11. When writing logic for scheduling:
    - ensure no overlapping trips
    - ensure correct vehicle capacity
    - ensure auto driver assignment follows business rules
12. Use consistent error handling with clear messages for debugging.
13. Always log important operations (trip creation, driver assignment, bookings).
14. Use modular utilities for repeated logic (date handling, seat numbering, fare calculation).
15. When creating diagrams or flows, follow this order:
    - Widget ➜ Trip Results ➜ Trip Selection ➜ Passenger Details ➜ Seat Selection ➜ Payment ➜ E-Ticket

