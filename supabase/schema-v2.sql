-- Washerman Karachi Database Schema v2
-- This schema matches the application code exactly
-- Run this in your Supabase SQL Editor

-- IMPORTANT: If you have existing tables, run these DROP commands first:
-- DROP TABLE IF EXISTS driver_locations CASCADE;
-- DROP TABLE IF EXISTS reviews CASCADE;
-- DROP TABLE IF EXISTS notifications CASCADE;
-- DROP TABLE IF EXISTS order_tracking CASCADE;
-- DROP TABLE IF EXISTS order_items CASCADE;
-- DROP TABLE IF EXISTS orders CASCADE;
-- DROP TABLE IF EXISTS promotions CASCADE;
-- DROP TABLE IF EXISTS services CASCADE;
-- DROP TABLE IF EXISTS addresses CASCADE;
-- DROP TABLE IF EXISTS profiles CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- PROFILES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'driver', 'manager')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ADDRESSES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS addresses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  label TEXT NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  area TEXT NOT NULL,
  city TEXT DEFAULT 'Karachi',
  postal_code TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  delivery_instructions TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SERVICES TABLE (matches app code)
-- =============================================
CREATE TABLE IF NOT EXISTS services (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('wash-fold', 'dry-cleaning', 'ironing', 'specialty', 'wash_fold', 'dry_clean', 'iron', 'premium')),
  base_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  price_per_kg DECIMAL(10, 2),
  estimated_duration TEXT DEFAULT '24-48 hours',
  estimated_hours INTEGER DEFAULT 48,
  features TEXT[] DEFAULT '{}',
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ORDERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  order_number TEXT UNIQUE,
  pickup_address_id UUID REFERENCES addresses(id) ON DELETE SET NULL,
  delivery_address_id UUID REFERENCES addresses(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'confirmed', 'assigned', 'picked_up', 'at_facility',
    'washing', 'quality_check', 'ready_for_delivery', 'out_for_delivery', 'delivered', 'cancelled'
  )),
  preferred_pickup_time TIMESTAMPTZ,
  actual_pickup_time TIMESTAMPTZ,
  preferred_delivery_time TIMESTAMPTZ,
  actual_delivery_time TIMESTAMPTZ,
  assigned_driver_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  subtotal DECIMAL(10, 2) DEFAULT 0,
  delivery_fee DECIMAL(10, 2) DEFAULT 0,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) DEFAULT 0,
  promo_code TEXT,
  payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'easypaisa', 'jazzcash')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed')),
  special_instructions TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generate order number automatically
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number := 'WK-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
                      LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_order_number ON orders;
CREATE TRIGGER set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  WHEN (NEW.order_number IS NULL)
  EXECUTE FUNCTION generate_order_number();

-- =============================================
-- ORDER ITEMS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  weight_kg DECIMAL(10, 2),
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  special_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ORDER TRACKING TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS order_tracking (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL,
  notes TEXT,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PROMOTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS promotions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10, 2) NOT NULL,
  max_discount_amount DECIMAL(10, 2),
  min_order_amount DECIMAL(10, 2) DEFAULT 0,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ NOT NULL,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- NOTIFICATIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'general' CHECK (type IN ('order', 'promo', 'general', 'system')),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- REVIEWS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE UNIQUE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  response_text TEXT,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- DRIVER LOCATIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS driver_locations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  driver_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  heading DECIMAL(5, 2),
  speed DECIMAL(5, 2),
  accuracy DECIMAL(5, 2),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_locations ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES FOR PROFILES
-- =============================================
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

-- =============================================
-- RLS POLICIES FOR ADDRESSES
-- =============================================
DROP POLICY IF EXISTS "Users can view their own addresses" ON addresses;
CREATE POLICY "Users can view their own addresses" ON addresses
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own addresses" ON addresses;
CREATE POLICY "Users can insert their own addresses" ON addresses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own addresses" ON addresses;
CREATE POLICY "Users can update their own addresses" ON addresses
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own addresses" ON addresses;
CREATE POLICY "Users can delete their own addresses" ON addresses
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- RLS POLICIES FOR SERVICES
-- =============================================
DROP POLICY IF EXISTS "Anyone can view active services" ON services;
CREATE POLICY "Anyone can view active services" ON services
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage services" ON services;
CREATE POLICY "Admins can manage services" ON services
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

-- =============================================
-- RLS POLICIES FOR ORDERS
-- =============================================
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
CREATE POLICY "Users can view their own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own orders" ON orders;
CREATE POLICY "Users can insert their own orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own pending orders" ON orders;
CREATE POLICY "Users can update their own pending orders" ON orders
  FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
CREATE POLICY "Admins can view all orders" ON orders
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

DROP POLICY IF EXISTS "Admins can update all orders" ON orders;
CREATE POLICY "Admins can update all orders" ON orders
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

DROP POLICY IF EXISTS "Drivers can view assigned orders" ON orders;
CREATE POLICY "Drivers can view assigned orders" ON orders
  FOR SELECT USING (auth.uid() = assigned_driver_id);

DROP POLICY IF EXISTS "Drivers can update assigned orders" ON orders;
CREATE POLICY "Drivers can update assigned orders" ON orders
  FOR UPDATE USING (auth.uid() = assigned_driver_id);

-- =============================================
-- RLS POLICIES FOR ORDER ITEMS
-- =============================================
DROP POLICY IF EXISTS "Users can view their order items" ON order_items;
CREATE POLICY "Users can view their order items" ON order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert order items" ON order_items;
CREATE POLICY "Users can insert order items" ON order_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Admins can view all order items" ON order_items;
CREATE POLICY "Admins can view all order items" ON order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

-- =============================================
-- RLS POLICIES FOR ORDER TRACKING
-- =============================================
DROP POLICY IF EXISTS "Users can view tracking for their orders" ON order_tracking;
CREATE POLICY "Users can view tracking for their orders" ON order_tracking
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_tracking.order_id AND orders.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert tracking for their orders" ON order_tracking;
CREATE POLICY "Users can insert tracking for their orders" ON order_tracking
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_tracking.order_id AND orders.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Admins can manage order tracking" ON order_tracking;
CREATE POLICY "Admins can manage order tracking" ON order_tracking
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

DROP POLICY IF EXISTS "Drivers can add tracking updates" ON order_tracking;
CREATE POLICY "Drivers can add tracking updates" ON order_tracking
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_tracking.order_id AND orders.assigned_driver_id = auth.uid())
  );

-- =============================================
-- RLS POLICIES FOR PROMOTIONS
-- =============================================
DROP POLICY IF EXISTS "Anyone can view active promotions" ON promotions;
CREATE POLICY "Anyone can view active promotions" ON promotions
  FOR SELECT USING (is_active = true AND valid_until > NOW());

DROP POLICY IF EXISTS "Admins can manage promotions" ON promotions;
CREATE POLICY "Admins can manage promotions" ON promotions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

-- =============================================
-- RLS POLICIES FOR NOTIFICATIONS
-- =============================================
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- =============================================
-- RLS POLICIES FOR REVIEWS
-- =============================================
DROP POLICY IF EXISTS "Anyone can view published reviews" ON reviews;
CREATE POLICY "Anyone can view published reviews" ON reviews
  FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Users can insert reviews for their orders" ON reviews;
CREATE POLICY "Users can insert reviews for their orders" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own reviews" ON reviews;
CREATE POLICY "Users can update their own reviews" ON reviews
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage reviews" ON reviews;
CREATE POLICY "Admins can manage reviews" ON reviews
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

-- =============================================
-- RLS POLICIES FOR DRIVER LOCATIONS
-- =============================================
DROP POLICY IF EXISTS "Drivers can update their location" ON driver_locations;
CREATE POLICY "Drivers can update their location" ON driver_locations
  FOR ALL USING (auth.uid() = driver_id);

DROP POLICY IF EXISTS "Admins can view driver locations" ON driver_locations;
CREATE POLICY "Admins can view driver locations" ON driver_locations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

DROP POLICY IF EXISTS "Users can view driver location for their orders" ON driver_locations;
CREATE POLICY "Users can view driver location for their orders" ON driver_locations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.assigned_driver_id = driver_locations.driver_id 
      AND orders.user_id = auth.uid()
      AND orders.status IN ('picked_up', 'out_for_delivery')
    )
  );

-- =============================================
-- CREATE PROFILE TRIGGER
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- INSERT SAMPLE SERVICES
-- =============================================
-- Delete existing services first to avoid duplicates
DELETE FROM services WHERE name IN ('Wash & Fold', 'Dry Cleaning', 'Ironing & Pressing', 'Premium Laundry');

INSERT INTO services (name, description, category, base_price, price_per_kg, estimated_duration, features, is_active) VALUES
  ('Wash & Fold', 'Our most popular service. We wash, dry, and neatly fold your everyday clothes using premium detergents.', 'wash-fold', 120, 120, '24-48 hours', ARRAY['Machine wash with premium detergent', 'Tumble dry at optimal temperature', 'Neatly folded and packaged', 'Eco-friendly detergent options'], true),
  ('Dry Cleaning', 'Professional dry cleaning for your delicate and formal garments. We handle suits, dresses, and specialty fabrics with care.', 'dry-cleaning', 300, NULL, '48-72 hours', ARRAY['Professional solvent cleaning', 'Expert stain removal', 'Pressed and finished', 'Protective garment bags'], true),
  ('Ironing & Pressing', 'Get crisp, wrinkle-free clothes with our professional steam pressing service.', 'ironing', 80, 80, '12-24 hours', ARRAY['Professional steam pressing', 'Collar and cuff attention', 'Crease setting for pants', 'Hanger or folded delivery'], true),
  ('Premium Laundry', 'Our luxury service for those who want the best. Premium detergents, special care, and priority handling.', 'specialty', 350, 350, '24-36 hours', ARRAY['Hand-selected premium detergents', 'Individual item inspection', 'Color-separated washing', 'Premium fabric softener'], true);

-- =============================================
-- INSERT SAMPLE PROMOTIONS
-- =============================================
INSERT INTO promotions (code, description, discount_type, discount_value, max_discount_amount, min_order_amount, valid_until, is_active) VALUES
  ('WELCOME20', 'Welcome discount for new customers', 'percentage', 20, 500, 500, NOW() + INTERVAL '1 year', true),
  ('FIRST100', 'Rs. 100 off on first order', 'fixed', 100, 100, 300, NOW() + INTERVAL '1 year', true),
  ('SAVE15', 'Save 15% on orders above Rs. 1000', 'percentage', 15, 300, 1000, NOW() + INTERVAL '6 months', true)
ON CONFLICT (code) DO NOTHING;

-- =============================================
-- HELPFUL FUNCTIONS
-- =============================================

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables with updated_at column
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_addresses_updated_at ON addresses;
CREATE TRIGGER update_addresses_updated_at
  BEFORE UPDATE ON addresses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_services_updated_at ON services;
CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;
CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- DONE!
-- =============================================
-- Your database is now ready to use with the Washerman Karachi app.
-- Make sure you have:
-- 1. Enabled Email/Password auth in Supabase Dashboard > Authentication > Providers
-- 2. (Optional) Enabled Google OAuth in Authentication > Providers > Google
