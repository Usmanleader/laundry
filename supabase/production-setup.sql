-- =============================================
-- WASHERMAN KARACHI - PRODUCTION DATABASE SETUP
-- Run this entire file in Supabase SQL Editor
-- =============================================

-- Step 1: Drop problematic RLS policies that cause recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
DROP POLICY IF EXISTS "Admins can update all orders" ON orders;

-- Step 2: Create fixed RLS policies for profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Step 3: Create fixed RLS policies for orders (no recursion)
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own orders" ON orders
  FOR UPDATE USING (auth.uid() = user_id);

-- Step 4: Create RLS policies for order_items
DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
CREATE POLICY "Users can view own order items" ON order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert own order items" ON order_items;
CREATE POLICY "Users can insert own order items" ON order_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
  );

-- Step 5: Create RLS policies for order_tracking
DROP POLICY IF EXISTS "Users can view own order tracking" ON order_tracking;
CREATE POLICY "Users can view own order tracking" ON order_tracking
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_tracking.order_id AND orders.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert own order tracking" ON order_tracking;
CREATE POLICY "Users can insert own order tracking" ON order_tracking
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_tracking.order_id AND orders.user_id = auth.uid())
  );

-- Step 6: Services should be readable by everyone
DROP POLICY IF EXISTS "Anyone can view active services" ON services;
CREATE POLICY "Anyone can view active services" ON services
  FOR SELECT USING (is_active = true);

-- Step 7: Promotions should be readable by authenticated users
DROP POLICY IF EXISTS "Users can view active promotions" ON promotions;
CREATE POLICY "Users can view active promotions" ON promotions
  FOR SELECT USING (is_active = true AND auth.uid() IS NOT NULL);

-- Step 8: Notifications for user
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Step 9: Addresses policies
DROP POLICY IF EXISTS "Users can view own addresses" ON addresses;
CREATE POLICY "Users can view own addresses" ON addresses
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own addresses" ON addresses;
CREATE POLICY "Users can insert own addresses" ON addresses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own addresses" ON addresses;
CREATE POLICY "Users can update own addresses" ON addresses
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own addresses" ON addresses;
CREATE POLICY "Users can delete own addresses" ON addresses
  FOR DELETE USING (auth.uid() = user_id);

-- Step 10: Create profile trigger (runs with elevated permissions)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 11: Create profiles for existing auth users
INSERT INTO profiles (id, email, full_name)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', '')
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING;

-- Step 12: Insert production services with real UUIDs
DELETE FROM order_items WHERE service_id IN (SELECT id FROM services);
DELETE FROM services;

INSERT INTO services (name, description, category, base_price, price_per_kg, estimated_duration, estimated_hours, features, is_active) VALUES
  ('Wash & Fold', 'Our most popular service. We wash, dry, and neatly fold your everyday clothes using premium detergents. Perfect for daily wear, casual clothes, and household items.', 'wash-fold', 120, 120, '24-48 hours', 48, ARRAY['Machine wash with premium detergent', 'Tumble dry at optimal temperature', 'Neatly folded and packaged', 'Eco-friendly detergent options', 'Stain pre-treatment included'], true),
  
  ('Dry Cleaning', 'Professional dry cleaning for your delicate and formal garments. We handle suits, dresses, silk, wool, and specialty fabrics with expert care.', 'dry-cleaning', 350, NULL, '48-72 hours', 72, ARRAY['Professional solvent cleaning', 'Expert stain removal', 'Steam pressed and finished', 'Protective garment bags', 'Button and minor repair check'], true),
  
  ('Ironing & Pressing', 'Get crisp, wrinkle-free clothes with our professional steam pressing service. Perfect for office wear and formal occasions.', 'ironing', 80, 80, '12-24 hours', 24, ARRAY['Professional steam pressing', 'Collar and cuff attention', 'Crease setting for pants', 'Hanger or folded delivery', 'Express service available'], true),
  
  ('Premium Laundry', 'Our luxury service for those who want the best. Premium detergents, individual care, hand finishing, and priority handling.', 'specialty', 400, 400, '24-36 hours', 36, ARRAY['Hand-selected premium detergents', 'Individual item inspection', 'Color-separated washing', 'Premium fabric softener', 'Hand finishing touches', 'Priority processing'], true),
  
  ('Bedding & Linens', 'Complete bedding care - sheets, blankets, comforters, pillows, and curtains. Fresh and sanitized for better sleep.', 'wash-fold', 200, 150, '48-72 hours', 72, ARRAY['Deep cleaning for bedding', 'Dust mite treatment', 'Fresh scent finishing', 'Pillow fluffing', 'Blanket and comforter care'], true),
  
  ('Wedding & Formal Wear', 'Specialized care for wedding dresses, sherwanis, formal gowns, and traditional attire. Preservation options available.', 'dry-cleaning', 1500, NULL, '5-7 days', 168, ARRAY['Expert handling of delicate fabrics', 'Hand finishing and detailing', 'Preservation packaging available', 'Beadwork and embroidery care', 'Steaming and pressing'], true);

-- Step 13: Insert sample promotions
DELETE FROM promotions;

INSERT INTO promotions (code, description, discount_type, discount_value, min_order_amount, max_discount_amount, valid_from, valid_until, is_active) VALUES
  ('WELCOME20', 'Welcome discount for new customers - 20% off your first order', 'percentage', 20, 500, 300, NOW(), NOW() + INTERVAL '1 year', true),
  ('FLAT100', 'Flat Rs. 100 off on orders above Rs. 800', 'fixed', 100, 800, NULL, NOW(), NOW() + INTERVAL '6 months', true),
  ('PREMIUM15', '15% off on Premium Laundry services', 'percentage', 15, 1000, 500, NOW(), NOW() + INTERVAL '3 months', true);

-- Verification: Check everything is set up correctly
SELECT 'Services' as table_name, COUNT(*) as count FROM services WHERE is_active = true
UNION ALL
SELECT 'Promotions', COUNT(*) FROM promotions WHERE is_active = true
UNION ALL
SELECT 'Profiles', COUNT(*) FROM profiles;
