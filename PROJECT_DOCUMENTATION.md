# Washerman Karachi - Complete Project Documentation

**Last Updated:** February 9, 2026  
**Project Path:** `E:\Laundry\washerman-karachi`  
**GitHub:** https://github.com/Usmanleader/laundry  
**Live URL:** https://washerman-karachi.vercel.app  
**WhatsApp:** +92 336 279 3950  
**Status:** Production-Ready | Build Passing (29 routes)

---

## 🤖 AI CONTINUATION PROMPT

**Copy-paste this entire block when starting a new AI session on any computer. This gives the AI full context about your project:**

```
I'm working on "Washerman Karachi" — a professional laundry service web app.
Project path: E:\Laundry\washerman-karachi

TECH STACK:
- Next.js 16.1.6 (App Router, TypeScript, Turbopack)
- Tailwind CSS 4 (uses @import "tailwindcss" and @theme inline syntax, NOT tailwind.config.ts)
- Supabase (Auth + PostgreSQL Database): https://teeajweekcayugyswyyp.supabase.co
- React 19.2.3, react-hook-form 7.71, Zod 4.3.6
- @supabase/ssr 0.8.0 for cookie-based auth
- lucide-react for icons, class-variance-authority for component variants
- Payment: Cash on Delivery, Credit Card (Stripe), EasyPaisa, JazzCash

COLOR SCHEME:
- Primary: sky-500 (#0ea5e9), sky-600, sky-700
- Secondary: emerald-500 (#10b981)
- Text: slate-900, slate-600, slate-500
- Backgrounds: white, slate-50
- NO dark mode (forced light mode in globals.css)

DATABASE TABLES (Supabase PostgreSQL):
- profiles (extends auth.users — id, email, full_name, phone, role: customer|admin|driver)
- addresses (user_id FK, label, address_line1, area, city default 'Karachi')
- services (name, category, price_type: per_piece|per_kg, price_per_unit, turnaround_hours)
- orders (user_id FK, order_number, status, payment_method, payment_status, total_amount)
- order_items (order_id FK, service_id FK, quantity, unit_price, total_price)
- order_tracking (order_id FK, status, notes, updated_by)
- guest_orders (for non-authenticated users — guest_name, guest_phone, items as JSONB, pickup_address as JSONB)
- guest_order_items, guest_order_tracking
- promotions, notifications, reviews, driver_locations

KEY FILES:
- src/app/globals.css — CSS variables, forced light mode, animations
- src/app/booking/page.tsx — Multi-step booking (guest + authenticated), 4 steps
- src/app/api/orders/guest/route.ts — Guest order API (uses createAdminClient with service_role key)
- src/context/CartContext.tsx — Cart state with localStorage persistence
- src/lib/supabase/server.ts — Server-side Supabase client (cookie-based)
- src/lib/supabase/client.ts — Browser Supabase client
- src/middleware.ts — Protects /dashboard and /admin routes only (NOT /booking)
- supabase/schema.sql — Original database schema
- supabase/migration-guest-orders.sql — Guest orders tables + RLS + functions + triggers
- supabase/production-setup.sql — RLS fixes + seed services data

ROUTES (29 total):
- Public: /, /services, /pricing, /about, /contact, /booking, /booking/confirmation
- Auth: /auth/login, /auth/register, /auth/forgot-password, /auth/callback
- Dashboard (auth required): /dashboard, /dashboard/orders, /dashboard/orders/[id], /dashboard/addresses, /dashboard/profile
- Admin (admin role required): /admin, /admin/orders, /admin/orders/[id], /admin/services, /admin/users
- API: /api/orders, /api/orders/[id], /api/orders/guest, /api/payments, /api/services, /api/webhooks/payments

GUEST CHECKOUT FLOW:
- Users can place orders WITHOUT creating an account
- /booking page detects if user is logged in
- Guest users fill: name, email (optional), phone, pickup address inline
- Guest orders go to /api/orders/guest → guest_orders table
- Confirmation at /booking/confirmation?order=WK...&phone=03...
- RLS policies allow anonymous INSERT + SELECT on guest_orders

ADMIN FEATURES:
- Admin dashboard at /admin with order stats, status counts
- /admin/orders shows both regular orders AND guest_orders (merged via admin_all_orders view)
- Admin email: tzkusman786@gmail.com (role must be set to 'admin' in profiles table)

ENV VARS (.env.local):
- NEXT_PUBLIC_SUPABASE_URL=https://teeajweekcayugyswyyp.supabase.co
- NEXT_PUBLIC_SUPABASE_ANON_KEY=(set)
- SUPABASE_SERVICE_ROLE_KEY=(needed for guest orders to bypass RLS)
- NEXT_PUBLIC_APP_URL=http://localhost:3000
- NEXT_PUBLIC_DELIVERY_FEE=150

CONTACT INFO:
- WhatsApp: +92 336 279 3950 (all contact links use wa.me/923362793950)
- All tel: links have been replaced with WhatsApp links across the app

DEPLOYMENT:
- GitHub: https://github.com/Usmanleader/laundry
- Vercel: https://washerman-karachi.vercel.app
- Auto-deploys on push to main branch

IMPORTANT NOTES:
- Build passes with 0 errors (npm run build)
- Tailwind CSS 4 does NOT use tailwind.config.ts — uses @theme inline in globals.css
- Dark mode is disabled (prefers-color-scheme: dark overridden to use light values)
- All pages have explicit bg-white or bg-slate-50 backgrounds
- Cart clears on logout
- The middleware.ts uses deprecated "middleware" convention (Next.js 16 prefers "proxy")

What I need help with: [YOUR REQUEST HERE]
```

---

## 📁 FULL PROJECT STRUCTURE

```
E:\Laundry\washerman-karachi\
├── .env.local                         # Environment variables (NOT in git)
├── .env.example                       # Template for env vars
├── package.json                       # Dependencies & scripts
├── next.config.ts                     # Next.js config
├── tsconfig.json                      # TypeScript config
├── postcss.config.mjs                 # PostCSS (Tailwind CSS 4)
├── eslint.config.mjs                  # ESLint config
├── PROJECT_DOCUMENTATION.md           # This file
│
├── public/                            # Static assets
│
├── supabase/                          # Database SQL files
│   ├── schema.sql                     # Original schema (profiles, orders, services, etc.)
│   ├── schema-v2.sql                  # Updated schema
│   ├── production-setup.sql           # RLS fixes + seed services data
│   └── migration-guest-orders.sql     # Guest orders migration (tables + RLS + functions)
│
└── src/
    ├── middleware.ts                   # Auth middleware (protects /dashboard, /admin)
    │
    ├── app/
    │   ├── globals.css                # CSS variables, animations, forced light mode
    │   ├── layout.tsx                 # Root layout (Navbar + Footer + CartProvider)
    │   ├── page.tsx                   # Homepage (hero, services grid, CTA)
    │   ├── loading.tsx                # Global loading spinner
    │   ├── error.tsx                  # Global error page
    │   ├── not-found.tsx              # 404 page
    │   ├── robots.ts                  # SEO robots.txt
    │   ├── sitemap.ts                 # SEO sitemap
    │   │
    │   ├── about/page.tsx             # About page
    │   ├── contact/page.tsx           # Contact form page
    │   ├── services/page.tsx          # Services listing (add to cart, book)
    │   ├── pricing/page.tsx           # Pricing tables
    │   │
    │   ├── booking/
    │   │   ├── page.tsx               # Multi-step booking (guest + auth)
    │   │   └── confirmation/page.tsx  # Guest order confirmation
    │   │
    │   ├── auth/
    │   │   ├── login/page.tsx         # Email + Google login
    │   │   ├── register/page.tsx      # User registration
    │   │   ├── forgot-password/page.tsx
    │   │   └── callback/route.ts      # OAuth callback handler
    │   │
    │   ├── dashboard/                 # USER dashboard (auth required)
    │   │   ├── page.tsx               # Dashboard overview
    │   │   ├── orders/page.tsx        # User's order list
    │   │   ├── orders/[id]/page.tsx   # Order detail view
    │   │   ├── addresses/page.tsx     # Address management (CRUD)
    │   │   └── profile/page.tsx       # Edit profile
    │   │
    │   ├── admin/                     # ADMIN dashboard (admin role required)
    │   │   ├── page.tsx               # Admin stats + quick actions
    │   │   ├── orders/page.tsx        # All orders (regular + guest)
    │   │   ├── orders/[id]/page.tsx   # Order detail + status update
    │   │   ├── services/page.tsx      # Manage services (CRUD)
    │   │   └── users/page.tsx         # View users
    │   │
    │   └── api/                       # API routes (server-side)
    │       ├── orders/
    │       │   ├── route.ts           # GET/POST orders (authenticated)
    │       │   ├── [id]/route.ts      # GET/PATCH single order
    │       │   └── guest/route.ts     # POST guest order (no auth needed)
    │       ├── payments/route.ts      # Payment processing
    │       ├── services/route.ts      # GET services
    │       └── webhooks/
    │           └── payments/route.ts  # Payment gateway callbacks
    │
    ├── components/
    │   ├── layout/
    │   │   ├── index.ts               # Re-exports
    │   │   ├── navbar.tsx             # Navigation + mobile menu + cart badge
    │   │   └── footer.tsx             # Footer with social links
    │   └── ui/
    │       ├── index.ts               # Re-exports
    │       ├── button.tsx             # Button (variants: default, outline, ghost, success)
    │       ├── card.tsx               # Card + CardHeader + CardContent + CardTitle
    │       ├── input.tsx              # Input with label + error
    │       ├── select.tsx             # Select dropdown
    │       ├── textarea.tsx           # Textarea
    │       ├── badge.tsx              # Badge (default, secondary, success, warning, destructive)
    │       ├── spinner.tsx            # Loading spinner
    │       └── toast.tsx              # Toast notifications (success, error, info, warning)
    │
    ├── context/
    │   └── CartContext.tsx             # Cart state (React Context + localStorage)
    │
    ├── lib/
    │   ├── utils.ts                   # cn() helper, formatPrice(), formatDate()
    │   ├── actions.ts                 # Server actions
    │   ├── validations.ts             # Zod schemas
    │   └── supabase/
    │       ├── client.ts              # Browser Supabase client
    │       ├── server.ts              # Server Supabase client (cookie-based)
    │       └── middleware.ts           # Supabase middleware helper
    │
    └── types/
        ├── index.ts                   # Constants: TIME_SLOTS, KARACHI_AREAS, ORDER_STATUSES
        └── database.ts                # TypeScript types for Supabase tables
```

---

## 🚀 SETUP GUIDE (From Scratch)

### 1. Clone & Install
```bash
cd E:\Laundry\washerman-karachi
npm install
```

### 2. Environment Variables
Create `.env.local`:
```bash
# REQUIRED
NEXT_PUBLIC_SUPABASE_URL=https://teeajweekcayugyswyyp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Washerman Karachi
NEXT_PUBLIC_DELIVERY_FEE=150

# RECOMMENDED (for guest orders to bypass RLS)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# OPTIONAL (add when ready for payments)
# STRIPE_SECRET_KEY=sk_test_...
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
# STRIPE_WEBHOOK_SECRET=whsec_...
# EASYPAISA_MERCHANT_ID=
# EASYPAISA_STORE_ID=
# EASYPAISA_HASH_KEY=
# JAZZCASH_MERCHANT_ID=
# JAZZCASH_PASSWORD=
# JAZZCASH_INTEGRITY_SALT=
```

### 3. Supabase Database Setup
Run these SQL files **in order** in your **Supabase SQL Editor** (https://supabase.com/dashboard → your project → SQL Editor):

**Step 1:** Core schema
```
Paste contents of: supabase/schema.sql
```

**Step 2:** Production fixes (RLS + seed services)
```
Paste contents of: supabase/production-setup.sql
```

**Step 3:** Guest orders support
```
Paste contents of: supabase/migration-guest-orders.sql
```

**Step 4:** Fix RLS for anonymous inserts (run after Step 3)
```sql
DROP POLICY IF EXISTS "Service role can insert guest orders" ON guest_orders;
CREATE POLICY "Anyone can insert guest orders" ON guest_orders
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can insert guest order items" ON guest_order_items;
CREATE POLICY "Anyone can insert guest order items" ON guest_order_items
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can insert guest order tracking" ON guest_order_tracking;
CREATE POLICY "Anyone can insert guest order tracking" ON guest_order_tracking
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can view guest order by order number" ON guest_orders;
CREATE POLICY "Anyone can view guest order by order number" ON guest_orders
  FOR SELECT USING (true);
```

**Step 5:** Make yourself admin
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'tzkusman786@gmail.com';
```

### 4. Run the Project
```bash
# Development
npm run dev
# Open http://localhost:3000

# Production build
npm run build
npm start

# Deploy to Vercel
npx vercel
```

---

## 🗄️ ALL SQL QUERIES USED

### A. Core Schema (`supabase/schema.sql`)

Creates these tables:
- `profiles` — extends auth.users (id, email, full_name, phone, role, is_active)
- `addresses` — user addresses (label, address_line1, area, city, lat/lng)
- `services` — laundry services (name, category, price_type, price_per_unit, turnaround_hours)
- `orders` — customer orders (order_number, status, payment_method, total_amount)
- `order_items` — items per order (service_id, quantity, weight_kg, unit_price)
- `order_tracking` — status history (status, notes, updated_by)
- `promotions` — promo codes (code, discount_type, discount_value, valid_until)
- `notifications` — user notifications (title, message, type, is_read)
- `reviews` — order reviews (rating 1-5, review_text)
- `driver_locations` — real-time driver GPS (latitude, longitude, speed)

Key triggers:
- `on_auth_user_created` → auto-creates profile row when user signs up
- `update_updated_at` → auto-updates `updated_at` timestamp on row changes

Key functions:
- `handle_new_user()` → copies auth.users data to profiles table
- `update_updated_at_column()` → generic timestamp updater

### B. Guest Orders Migration (`supabase/migration-guest-orders.sql`)

Creates:
- `guest_orders` table (order_number, guest_name, guest_phone, guest_email, pickup_address JSONB, delivery_address JSONB, items JSONB, status, payment_method, payment_status, total_amount, assigned_driver_id, converted_user_id)
- `guest_order_items` table (guest_order_id FK, service_name, quantity, unit_price, total_price)
- `guest_order_tracking` table (guest_order_id FK, status, notes, updated_by)

RLS Policies:
- Admins can view/update/delete all guest orders
- Drivers can view/update their assigned guest orders
- Converted users can view their linked guest orders
- Anyone can insert (for anonymous checkout)

Functions:
- `migrate_guest_orders_to_user(phone, user_id)` → links guest orders when user later registers
- `get_guest_order_by_number_and_phone(order_number, phone)` → guest order lookup
- `get_dashboard_stats()` → combined stats (registered + guest orders, revenue, today's orders)
- `notify_admin_new_guest_order()` → trigger: notifies all admins on new guest order
- `notify_guest_order_status_change()` → trigger: logs status changes to tracking table

Views:
- `admin_all_orders` → UNION of `orders` + `guest_orders` for admin dashboard

Indexes (10 total):
- `idx_guest_orders_phone`, `idx_guest_orders_email`, `idx_guest_orders_status`
- `idx_guest_orders_order_number`, `idx_guest_orders_created_at`
- `idx_guest_orders_payment_status`, `idx_guest_orders_assigned_driver`
- `idx_guest_orders_converted_user`, `idx_guest_order_items_order`
- `idx_guest_order_tracking_order`

### C. Useful Admin Queries

```sql
-- Make a user admin
UPDATE profiles SET role = 'admin' WHERE email = 'tzkusman786@gmail.com';

-- Check who is admin
SELECT id, email, full_name, role FROM profiles WHERE role = 'admin';

-- View guest orders
SELECT * FROM guest_orders ORDER BY created_at DESC LIMIT 10;

-- View all orders (registered + guest)
SELECT * FROM admin_all_orders LIMIT 20;

-- Get dashboard stats
SELECT get_dashboard_stats();

-- Check RLS policies on guest tables
SELECT tablename, policyname, permissive, cmd
FROM pg_policies
WHERE tablename IN ('guest_orders', 'guest_order_items', 'guest_order_tracking')
ORDER BY tablename, cmd;

-- Count orders by status
SELECT status, COUNT(*) FROM orders GROUP BY status;
SELECT status, COUNT(*) FROM guest_orders GROUP BY status;

-- Revenue summary
SELECT
  SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END) as paid_revenue,
  SUM(CASE WHEN payment_status = 'pending' THEN total_amount ELSE 0 END) as pending_revenue,
  COUNT(*) as total_orders
FROM admin_all_orders;
```

---

## 🗺️ DATABASE RELATIONSHIPS

```
auth.users (1) ──── (1) profiles
                          │
                          ├── (many) addresses
                          ├── (many) orders ──── (many) order_items ──── (1) services
                          │                 └── (many) order_tracking
                          ├── (many) notifications
                          └── (many) reviews

guest_orders (standalone) ──── (many) guest_order_items
                           └── (many) guest_order_tracking
                           └── (optional) converted_user_id → profiles
```

### User Roles
| Role | Access |
|------|--------|
| `customer` | Dashboard, orders, addresses, profile |
| `admin` | Everything + /admin panel |
| `driver` | Assigned orders + location updates |

---

## 🛒 CART SYSTEM

**File:** `src/context/CartContext.tsx`

```typescript
// Available functions from useCart()
addToCart(service, quantity, weight?)  // Add service to cart
updateQuantity(serviceId, quantity)    // Change quantity
updateWeight(serviceId, weight)        // Change weight (per-kg services)
removeFromCart(serviceId)              // Remove item
clearCart()                            // Clear everything (also called on logout)
getItemPrice(item)                     // Calculate single item price
getSubtotal()                          // Cart total
getItemCount()                         // Number of services in cart
```

- State: React Context + localStorage persistence
- Cart badge displayed in navbar
- Clears on user logout

---

## 📦 BOOKING FLOW

### For Logged-In Users (4 Steps)
1. **Services** → Select from cart or add services
2. **Address** → Choose pickup/delivery from saved addresses
3. **Schedule** → Pick date + time slot for pickup and delivery
4. **Review** → Confirm details, choose payment, place order → `POST /api/orders`

### For Guest Users (Simplified)
1. **Your Info** → Name, email, phone number
2. **Services** → Select services from cart or add new
3. **Address** → Enter pickup address inline (no saved addresses)
4. **Review** → Confirm details, place order → `POST /api/orders/guest`
5. **Confirmation** → Redirect to `/booking/confirmation?order=WK...&phone=03...`

---

## 💳 PAYMENT METHODS

| Method | Status | How It Works |
|--------|--------|-------------|
| Cash on Delivery | Working | Order created, marked as COD pending |
| Credit Card (Stripe) | Needs API keys | Stripe checkout session redirect |
| EasyPaisa | Needs merchant account | Mobile wallet API integration |
| JazzCash | Needs merchant account | Mobile wallet API integration |

---

## 🔐 AUTH & MIDDLEWARE

### Protected Routes (`src/middleware.ts`)
- `/dashboard/*` → requires authenticated user
- `/admin/*` → requires authenticated user with `role = 'admin'`
- `/booking` → **NOT protected** (allows guest checkout)

### Auth Methods
- Email/password (Supabase Auth)
- Google OAuth (needs configuration in Supabase)
- Password reset via email

---

## 🎨 DESIGN SYSTEM

### Color Palette
| Usage | Tailwind Class | Hex |
|-------|---------------|-----|
| Primary | `sky-500` | #0ea5e9 |
| Primary dark | `sky-600` | #0284c7 |
| Hero gradients | `from-sky-500 to-sky-700` | — |
| Secondary | `emerald-500` | #10b981 |
| Accent | `amber-500` | #f59e0b |
| Text primary | `slate-900` | #0f172a |
| Text secondary | `slate-600` | #475569 |
| Text muted | `slate-500` | #64748b |
| Page background | `white` / `bg-white` | #ffffff |
| Surface/cards | `slate-50` | #f8fafc |

### Important CSS Notes
- Dark mode is **DISABLED** in `globals.css` (forced light values)
- All pages have explicit `bg-white` or `bg-slate-50` on root div
- Tailwind CSS 4 uses `@theme inline` in CSS, NOT `tailwind.config.ts`
- Custom animations: fadeIn, slideUp, slideInRight, float, pulse-glow, shimmer

### Component Variants
- **Button:** default (sky-500), outline, ghost, link, success (emerald), destructive
- **Button sizes:** sm, md, lg, xl
- **Badge:** default (sky), secondary (slate), success (emerald), warning (yellow), destructive (red)
- **Toast:** success (green), error (red), info (sky), warning (yellow)

---

## ⚠️ KNOWN ISSUES & NOTES

| Issue | Status | Notes |
|-------|--------|-------|
| Middleware deprecation warning | Known | Next.js 16 prefers "proxy" over "middleware" — works fine |
| Supabase DNS timeout (ENOTFOUND) | Intermittent | Network/DNS issue on some machines, not a code bug |
| `guest_orders` not in TypeScript types | Workaround | Uses `(supabase as any)` cast in guest route |
| Payment gateways not configured | Pending | Need real Stripe/EasyPaisa/JazzCash API keys |
| Google OAuth needs setup | Pending | Configure in Supabase Auth → Providers → Google |

---

## 🚀 DEPLOYMENT CHECKLIST

- [ ] Run all 4 SQL migrations in Supabase (schema → production-setup → migration-guest-orders → RLS fix)
- [ ] Set `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`
- [ ] Set admin role: `UPDATE profiles SET role = 'admin' WHERE email = '...'`
- [ ] Configure Stripe keys (for card payments)
- [ ] Configure EasyPaisa/JazzCash merchant accounts
- [ ] Configure Google OAuth in Supabase Auth → Providers
- [ ] Set production URL in Supabase Auth → URL Configuration
- [ ] Deploy to Vercel: `npx vercel`
- [ ] Set all env vars in Vercel dashboard
- [ ] Test guest checkout flow end-to-end
- [ ] Test authenticated checkout flow end-to-end
- [ ] Test admin dashboard (view orders, change status)

---

## 📞 QUICK REFERENCE

| What | Where |
|------|-------|
| Supabase Dashboard | https://supabase.com/dashboard |
| Project URL | https://teeajweekcayugyswyyp.supabase.co |
| Local Dev | http://localhost:3000 |
| Admin Panel | http://localhost:3000/admin |
| Admin Email | tzkusman786@gmail.com |
| Build Command | `npm run build` |
| Dev Command | `npm run dev` |
| Deploy Command | `npx vercel` |

---

*Last updated: February 9, 2026*
