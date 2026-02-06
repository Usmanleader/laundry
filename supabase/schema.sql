-- Washerman Karachi Database Schema
-- Run this in your Supabase SQL Editor to create all required tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'driver')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Addresses table
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

-- Services table
CREATE TABLE IF NOT EXISTS services (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('wash_fold', 'dry_clean', 'iron', 'premium')),
  price_type TEXT NOT NULL CHECK (price_type IN ('per_piece', 'per_kg')),
  price_per_unit DECIMAL(10, 2) NOT NULL,
  min_quantity INTEGER DEFAULT 1,
  turnaround_hours INTEGER DEFAULT 48,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders table
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

-- Order Items table
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

-- Order Tracking table
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

-- Promotions table
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

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'general' CHECK (type IN ('order', 'promo', 'general', 'system')),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews table
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

-- Driver Locations table (for real-time tracking)
CREATE TABLE IF NOT EXISTS driver_locations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  driver_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  heading DECIMAL(5, 2),
  speed DECIMAL(5, 2),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_tracking_order_id ON order_tracking(order_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_reviews_order_id ON reviews(order_id);
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_services_is_active ON services(is_active);

-- Function to handle new user creation
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

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_addresses_updated_at BEFORE UPDATE ON addresses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
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

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for addresses
CREATE POLICY "Users can view their own addresses" ON addresses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own addresses" ON addresses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own addresses" ON addresses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own addresses" ON addresses
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for services (public read)
CREATE POLICY "Anyone can view active services" ON services
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage services" ON services
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for orders
CREATE POLICY "Users can view their own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending orders" ON orders
  FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can view all orders" ON orders
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update all orders" ON orders
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Drivers can view assigned orders" ON orders
  FOR SELECT USING (auth.uid() = assigned_driver_id);

CREATE POLICY "Drivers can update assigned orders" ON orders
  FOR UPDATE USING (auth.uid() = assigned_driver_id);

-- RLS Policies for order_items
CREATE POLICY "Users can view their order items" ON order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
  );

CREATE POLICY "Users can insert order items" ON order_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
  );

CREATE POLICY "Admins can view all order items" ON order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for order_tracking
CREATE POLICY "Users can view tracking for their orders" ON order_tracking
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_tracking.order_id AND orders.user_id = auth.uid())
  );

CREATE POLICY "Admins can manage order tracking" ON order_tracking
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Drivers can add tracking updates" ON order_tracking
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_tracking.order_id AND orders.assigned_driver_id = auth.uid())
  );

-- RLS Policies for promotions (public read for active)
CREATE POLICY "Anyone can view active promotions" ON promotions
  FOR SELECT USING (is_active = true AND valid_until > NOW());

CREATE POLICY "Admins can manage promotions" ON promotions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- RLS Policies for reviews
CREATE POLICY "Anyone can view published reviews" ON reviews
  FOR SELECT USING (is_published = true);

CREATE POLICY "Users can insert reviews for their orders" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" ON reviews
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage reviews" ON reviews
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for driver_locations
CREATE POLICY "Drivers can update their location" ON driver_locations
  FOR ALL USING (auth.uid() = driver_id);

CREATE POLICY "Admins can view driver locations" ON driver_locations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can view driver location for their orders" ON driver_locations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.assigned_driver_id = driver_locations.driver_id 
      AND orders.user_id = auth.uid()
      AND orders.status IN ('picked_up', 'out_for_delivery')
    )
  );

-- Insert sample services
INSERT INTO services (name, description, category, price_type, price_per_unit, turnaround_hours, is_active) VALUES
  ('Wash & Fold - Regular', 'Standard wash and fold service for everyday clothes', 'wash_fold', 'per_kg', 150, 48, true),
  ('Wash & Fold - Express', 'Same-day wash and fold service', 'wash_fold', 'per_kg', 250, 12, true),
  ('Wash & Fold - Delicate', 'Special care for delicate fabrics', 'wash_fold', 'per_kg', 200, 48, true),
  ('Dry Clean - Suit', 'Professional dry cleaning for suits', 'dry_clean', 'per_piece', 800, 72, true),
  ('Dry Clean - Dress', 'Dry cleaning for dresses and gowns', 'dry_clean', 'per_piece', 600, 72, true),
  ('Dry Clean - Coat', 'Dry cleaning for coats and jackets', 'dry_clean', 'per_piece', 700, 72, true),
  ('Dry Clean - Saree', 'Specialized dry cleaning for sarees', 'dry_clean', 'per_piece', 500, 72, true),
  ('Iron Only', 'Professional ironing service', 'iron', 'per_piece', 40, 24, true),
  ('Iron - Bulk', 'Ironing service for large quantities', 'iron', 'per_kg', 80, 24, true),
  ('Premium - Wedding Dress', 'Specialized cleaning for wedding attire', 'premium', 'per_piece', 3000, 120, true),
  ('Premium - Curtains', 'Cleaning for curtains and drapes', 'premium', 'per_piece', 400, 72, true),
  ('Premium - Carpet', 'Professional carpet cleaning', 'premium', 'per_kg', 300, 72, true)
ON CONFLICT DO NOTHING;

-- Insert sample promotions
INSERT INTO promotions (code, description, discount_type, discount_value, max_discount_amount, min_order_amount, valid_until, is_active) VALUES
  ('WELCOME20', 'Welcome discount for new customers', 'percentage', 20, 500, 500, NOW() + INTERVAL '1 year', true),
  ('FIRST100', 'Rs. 100 off on first order', 'fixed', 100, 100, 300, NOW() + INTERVAL '1 year', true),
  ('SAVE15', 'Save 15% on orders above Rs. 1000', 'percentage', 15, 300, 1000, NOW() + INTERVAL '6 months', true)
ON CONFLICT DO NOTHING;
