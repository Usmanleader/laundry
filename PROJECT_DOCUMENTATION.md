# Washerman Karachi - Complete Project Documentation

**Last Updated:** February 6, 2026  
**Project Path:** `E:\Laundry\washerman-karachi`  
**Status:** Production-Ready (Pending Database Setup)

---

## 🔄 CONTINUATION PROMPT

Use this prompt to continue the conversation in a new session:

```
I'm working on "Washerman Karachi" - a laundry service app at E:\Laundry\washerman-karachi

Tech Stack:
- Next.js 16.1.6 (App Router, TypeScript, Tailwind CSS 4)
- Supabase (Auth + Database): https://teeajweekcayugyswyyp.supabase.co
- Payment Methods: Cash, Card, EasyPaisa, JazzCash

Current Status:
- Build succeeds with 27 routes
- Need to run supabase/production-setup.sql to fix RLS policies and add real services
- Admin account: tzkusman786@gmail.com (password needs reset in Supabase dashboard)

Key Files:
- supabase/production-setup.sql - Run this in Supabase SQL Editor
- src/app/booking/page.tsx - Multi-step booking flow
- src/context/CartContext.tsx - Cart with localStorage persistence
- src/app/api/payments/route.ts - Payment processing API

What I need help with: [YOUR REQUEST HERE]
```

---

## 📁 PROJECT STRUCTURE

```
E:\Laundry\washerman-karachi\
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Auth group routes
│   │   │   └── auth/
│   │   │       ├── login/page.tsx    # Login with email/Google
│   │   │       ├── register/page.tsx # User registration
│   │   │       ├── callback/route.ts # OAuth callback handler
│   │   │       └── forgot-password/page.tsx
│   │   ├── admin/                    # Admin dashboard (role-protected)
│   │   │   ├── page.tsx              # Admin overview with stats
│   │   │   ├── orders/page.tsx       # Manage all orders
│   │   │   ├── services/page.tsx     # Manage services
│   │   │   └── users/page.tsx        # Manage users
│   │   ├── api/                      # API routes
│   │   │   ├── orders/route.ts       # Orders CRUD
│   │   │   ├── payments/route.ts     # Payment processing
│   │   │   ├── services/route.ts     # Services API
│   │   │   └── webhooks/
│   │   │       └── payments/route.ts # Payment gateway callbacks
│   │   ├── booking/page.tsx          # Multi-step booking flow
│   │   ├── dashboard/                # User dashboard
│   │   │   ├── page.tsx              # Overview
│   │   │   ├── orders/page.tsx       # User's orders
│   │   │   ├── orders/[id]/page.tsx  # Order details
│   │   │   ├── addresses/page.tsx    # Manage addresses
│   │   │   └── profile/page.tsx      # User profile
│   │   ├── services/page.tsx         # Services listing
│   │   ├── pricing/page.tsx          # Pricing page
│   │   ├── about/page.tsx            # About page
│   │   ├── contact/page.tsx          # Contact page
│   │   ├── layout.tsx                # Root layout
│   │   └── page.tsx                  # Homepage
│   ├── components/
│   │   ├── layout/
│   │   │   ├── navbar.tsx            # Navigation with cart indicator
│   │   │   └── footer.tsx            # Footer
│   │   └── ui/                       # Reusable UI components
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── input.tsx
│   │       ├── badge.tsx
│   │       ├── textarea.tsx
│   │       └── toast.tsx
│   ├── context/
│   │   └── CartContext.tsx           # Cart state + localStorage
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts             # Browser Supabase client
│   │   │   └── server.ts             # Server Supabase client
│   │   └── utils.ts                  # Helper functions
│   └── types/
│       ├── index.ts                  # Constants (TIME_SLOTS, KARACHI_AREAS)
│       └── database.ts               # TypeScript types for Supabase
├── supabase/
│   ├── schema.sql                    # Original database schema
│   ├── schema-v2.sql                 # Updated schema
│   └── production-setup.sql          # ⚠️ RUN THIS - Fixes RLS + adds services
├── public/                           # Static assets
├── .env.local                        # Environment variables (not in git)
├── .env.example                      # Template for env vars
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.ts
```

---

## 🔧 WHAT WE DID TODAY

### 1. Fixed Cart Logout Issue
**Problem:** Cart items remained after user logged out  
**Solution:** Added `clearCart()` call in navbar's `handleSignOut` function

**File:** `src/components/layout/navbar.tsx`
```typescript
const handleSignOut = async () => {
  clearCart()  // Clear cart before logout
  await supabase.auth.signOut()
  window.location.href = '/'
}
```

### 2. Fixed Profile Creation Errors
**Problem:** "Failed to create user profile" when adding addresses  
**Solution:** Changed from INSERT to UPSERT pattern

**Files Modified:**
- `src/app/auth/callback/route.ts` - Added profile upsert after OAuth
- `src/app/auth/login/page.tsx` - Added profile upsert after password login
- `src/app/dashboard/addresses/page.tsx` - Changed insert to upsert

### 3. Fixed RLS Infinite Recursion
**Problem:** "infinite recursion detected in policy for relation 'profiles'"  
**Cause:** Admin policies queried `profiles` table from within `profiles` policies  
**Solution:** Created `supabase/production-setup.sql` with fixed policies

### 4. Fixed UUID Format Error
**Problem:** "invalid input syntax for type uuid: 'wash-fold'"  
**Cause:** Static services had fake string IDs instead of real UUIDs  
**Solution:** SQL script inserts real services with proper UUIDs

### 5. Added Payment Integration
**Files Created:**
- `src/app/api/payments/route.ts` - Handles all payment methods
- `src/app/api/webhooks/payments/route.ts` - Payment gateway callbacks

**Supported Payment Methods:**
- Cash on Delivery (COD)
- Credit/Debit Card (Stripe)
- EasyPaisa (Pakistani mobile wallet)
- JazzCash (Pakistani mobile wallet)

### 6. Updated Booking Flow
**File:** `src/app/booking/page.tsx`
- Added payment API call after order creation
- Handles payment redirects for card payments
- Shows payment confirmation messages

---

## 🗄️ DATABASE SCHEMA

### Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles (extends auth.users) |
| `addresses` | User delivery/pickup addresses |
| `services` | Laundry services offered |
| `orders` | Customer orders |
| `order_items` | Items in each order |
| `order_tracking` | Order status history |
| `promotions` | Promo codes and discounts |
| `reviews` | Customer reviews |
| `driver_locations` | Real-time driver tracking |

### Key Relationships
```
auth.users (1) ──> (1) profiles
profiles (1) ──> (many) addresses
profiles (1) ──> (many) orders
orders (1) ──> (many) order_items
orders (1) ──> (many) order_tracking
order_items (many) ──> (1) services
```

### User Roles
- `customer` - Regular users
- `admin` - Full access to admin dashboard
- `driver` - Delivery drivers

---

## 🔐 AUTHENTICATION FLOW

### Email/Password Login
1. User enters email/password at `/auth/login`
2. Supabase validates credentials
3. On success, profile is upserted (created if missing)
4. User redirected to `/dashboard`

### Google OAuth Login
1. User clicks "Sign in with Google"
2. Redirected to Google consent screen
3. Callback at `/auth/callback` exchanges code for session
4. Profile upserted with Google email/name
5. User redirected to `/dashboard`

### Session Management
- Uses `@supabase/ssr` for cookie-based sessions
- Middleware checks auth for protected routes
- Sessions refresh automatically

---

## 🛒 CART SYSTEM

### How It Works
**File:** `src/context/CartContext.tsx`

1. **Context Provider** wraps the app in `layout.tsx`
2. **State** stored in React state + localStorage
3. **Persistence** survives page refresh
4. **Clear on Logout** prevents data leakage

### Cart Item Structure
```typescript
interface CartItem {
  service: Service      // The service object
  quantity: number      // Number of items
  weight?: number       // Weight in kg (for weight-based pricing)
}
```

### Available Functions
```typescript
addToCart(service, quantity, weight?)  // Add item
updateQuantity(serviceId, quantity)    // Update quantity
updateWeight(serviceId, weight)        // Update weight
removeFromCart(serviceId)              // Remove item
clearCart()                            // Clear all items
getItemPrice(item)                     // Calculate item price
getSubtotal()                          // Calculate cart total
getItemCount()                         // Get number of items
```

---

## 💳 PAYMENT SYSTEM

### Payment Flow
1. User completes booking form
2. Order created in database with `payment_status: 'pending'`
3. Frontend calls `/api/payments` with order details
4. Payment API processes based on method:
   - **Cash:** Marks as COD, confirmed immediately
   - **Card:** Creates Stripe session, redirects to checkout
   - **EasyPaisa/JazzCash:** Sends payment request to mobile wallet
5. Webhook receives callback and updates order status

### Environment Variables Needed
```bash
# EasyPaisa
EASYPAISA_MERCHANT_ID=
EASYPAISA_STORE_ID=
EASYPAISA_HASH_KEY=

# JazzCash
JAZZCASH_MERCHANT_ID=
JAZZCASH_PASSWORD=
JAZZCASH_INTEGRITY_SALT=

# Stripe
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
```

---

## 📋 BOOKING FLOW (4 Steps)

### Step 1: Services
- Displays all active services from database
- Grouped by category
- User adds services to cart with quantity/weight

### Step 2: Address
- Select pickup address
- Select delivery address (or same as pickup)
- Option to add new address

### Step 3: Schedule
- Select pickup date and time slot
- Select delivery date and time slot
- Add special instructions

### Step 4: Review
- Review all selections
- Choose payment method
- Apply promo code
- Confirm and place order

---

## ⚠️ PENDING TASKS

### Critical (Must Do)
1. **Run Production SQL**
   - Go to Supabase SQL Editor
   - Run contents of `supabase/production-setup.sql`
   - This fixes RLS policies and adds real services

2. **Reset Admin Password**
   - Go to Supabase → Authentication → Users
   - Find `tzkusman786@gmail.com`
   - Click ⋮ → Send password recovery
   - Or delete user and sign up again

3. **Make User Admin**
   ```sql
   UPDATE profiles SET role = 'admin' WHERE email = 'tzkusman786@gmail.com';
   ```

### Before Going Live
- [ ] Configure real EasyPaisa merchant account
- [ ] Configure real JazzCash merchant account  
- [ ] Configure Stripe for card payments
- [ ] Set up email templates in Supabase
- [ ] Configure custom domain
- [ ] Set up SSL certificate
- [ ] Enable Supabase RLS for production
- [ ] Test complete order flow with real payments

### Nice to Have
- [ ] SMS notifications for order updates
- [ ] Push notifications
- [ ] Driver mobile app
- [ ] Real-time order tracking on map
- [ ] Customer loyalty program
- [ ] Subscription plans

---

## 🚀 HOW TO RUN

### Development
```bash
cd E:\Laundry\washerman-karachi
npm install
npm run dev
```
Open http://localhost:3000

### Production Build
```bash
npm run build
npm start
```

### Deploy to Vercel
```bash
npx vercel
```

---

## 🔗 KEY URLS

| URL | Purpose |
|-----|---------|
| `/` | Homepage |
| `/services` | All services |
| `/pricing` | Pricing details |
| `/booking` | Book a pickup |
| `/auth/login` | Login |
| `/auth/register` | Sign up |
| `/dashboard` | User dashboard |
| `/dashboard/orders` | User's orders |
| `/dashboard/addresses` | Manage addresses |
| `/admin` | Admin dashboard (admin only) |
| `/admin/orders` | Manage all orders |
| `/admin/services` | Manage services |

---

## 📝 SUPABASE CONFIGURATION

**Project URL:** `https://teeajweekcayugyswyyp.supabase.co`

### Required Settings
1. **Authentication → Providers**
   - Email: Enabled
   - Google: Enabled (configure OAuth credentials)

2. **Authentication → URL Configuration**
   - Site URL: `http://localhost:3000` (or your domain)
   - Redirect URLs: Add your callback URLs

3. **Database → Tables**
   - All tables created via schema.sql
   - RLS enabled on all tables

---

## 🐛 KNOWN ISSUES & SOLUTIONS

### Issue: "infinite recursion detected in policy"
**Solution:** Run `production-setup.sql` to fix RLS policies

### Issue: "invalid input syntax for type uuid"
**Solution:** Services need real UUIDs. Run `production-setup.sql`

### Issue: Cart not clearing on logout
**Solution:** Already fixed. `clearCart()` called in `handleSignOut`

### Issue: Profile creation fails
**Solution:** Already fixed. Using UPSERT instead of INSERT

### Issue: Emails not sending
**Solution:** Check Supabase email rate limits and SMTP configuration

---

## 📞 SUPPORT CONTACTS

- **Supabase Docs:** https://supabase.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **EasyPaisa API:** https://easypay.easypaisa.com.pk/
- **JazzCash API:** https://sandbox.jazzcash.com.pk/

---

*This documentation was auto-generated on February 6, 2026*
