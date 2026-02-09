-- =============================================
-- WASHERMAN KARACHI - GUEST ORDERS MIGRATION
-- =============================================
-- This migration adds support for guest checkout (non-authenticated users)
-- Run this in your Supabase SQL Editor AFTER running schema-v2.sql
-- 
-- What this does:
-- 1. Creates guest_orders table for orders placed without an account
-- 2. Creates guest_order_items table for itemized services
-- 3. Creates guest_order_tracking table for status history
-- 4. Adds RLS (Row Level Security) policies
-- 5. Adds auto-updating timestamps trigger
-- 6. Adds admin notification function
-- 7. Adds guest-to-user order migration function
-- 8. Creates indexes for performance
-- 9. Creates a view for admin to see all orders (both registered & guest)

-- =============================================
-- 1. GUEST ORDERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS guest_orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- Order identification
  order_number TEXT UNIQUE NOT NULL,
  
  -- Guest information (collected at checkout)
  guest_name TEXT NOT NULL,
  guest_email TEXT,
  guest_phone TEXT NOT NULL,
  
  -- Address information (stored as JSONB for flexibility)
  -- Format: { "label": "Home", "address_line1": "...", "address_line2": "...", "area": "DHA Phase 6", "city": "Karachi" }
  pickup_address JSONB NOT NULL,
  delivery_address JSONB,
  
  -- Order items (stored as JSONB array)
  -- Format: [{ "service_id": "uuid", "service_name": "Wash & Fold", "quantity": 2, "unit_price": 120, "total_price": 240 }]
  items JSONB NOT NULL DEFAULT '[]',
  
  -- Scheduling
  preferred_pickup_time TIMESTAMPTZ,
  preferred_delivery_time TIMESTAMPTZ,
  actual_pickup_time TIMESTAMPTZ,
  actual_delivery_time TIMESTAMPTZ,
  
  -- Pricing
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
  delivery_fee DECIMAL(10, 2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  promo_code TEXT,
  
  -- Additional info
  special_instructions TEXT,
  
  -- Payment
  payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'easypaisa', 'jazzcash')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed')),
  
  -- Order status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'confirmed', 'assigned', 'picked_up', 'at_facility',
    'washing', 'quality_check', 'ready_for_delivery', 'out_for_delivery', 'delivered', 'cancelled'
  )),
  
  -- Admin / driver assignment
  assigned_driver_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  admin_notes TEXT,
  
  -- If guest later creates account, link it
  converted_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  converted_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- 2. GUEST ORDER ITEMS TABLE (optional detailed breakdown)
-- =============================================
CREATE TABLE IF NOT EXISTS guest_order_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  guest_order_id UUID REFERENCES guest_orders(id) ON DELETE CASCADE NOT NULL,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  service_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  weight_kg DECIMAL(10, 2),
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  special_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- 3. GUEST ORDER TRACKING TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS guest_order_tracking (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  guest_order_id UUID REFERENCES guest_orders(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL,
  notes TEXT,
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- 4. ENABLE ROW LEVEL SECURITY
-- =============================================
ALTER TABLE guest_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_order_tracking ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 5. RLS POLICIES FOR GUEST ORDERS
-- =============================================

-- Allow anonymous inserts (for the guest checkout API using service_role key)
-- The API uses the Supabase service_role key, which bypasses RLS
-- But we still need policies for admin access via the dashboard

-- Admins can view all guest orders
DROP POLICY IF EXISTS "Admins can view all guest orders" ON guest_orders;
CREATE POLICY "Admins can view all guest orders" ON guest_orders
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

-- Admins can update guest orders (status changes, assigning drivers, etc.)
DROP POLICY IF EXISTS "Admins can update guest orders" ON guest_orders;
CREATE POLICY "Admins can update guest orders" ON guest_orders
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

-- Admins can delete guest orders (if needed)
DROP POLICY IF EXISTS "Admins can delete guest orders" ON guest_orders;
CREATE POLICY "Admins can delete guest orders" ON guest_orders
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

-- Allow service role to insert (bypasses RLS anyway, but explicit)
DROP POLICY IF EXISTS "Service role can insert guest orders" ON guest_orders;
CREATE POLICY "Service role can insert guest orders" ON guest_orders
  FOR INSERT WITH CHECK (true);

-- Drivers can view their assigned guest orders
DROP POLICY IF EXISTS "Drivers can view assigned guest orders" ON guest_orders;
CREATE POLICY "Drivers can view assigned guest orders" ON guest_orders
  FOR SELECT USING (auth.uid() = assigned_driver_id);

-- Drivers can update their assigned guest orders
DROP POLICY IF EXISTS "Drivers can update assigned guest orders" ON guest_orders;
CREATE POLICY "Drivers can update assigned guest orders" ON guest_orders
  FOR UPDATE USING (auth.uid() = assigned_driver_id);

-- Converted users can view their guest orders
DROP POLICY IF EXISTS "Converted users can view their guest orders" ON guest_orders;
CREATE POLICY "Converted users can view their guest orders" ON guest_orders
  FOR SELECT USING (auth.uid() = converted_user_id);

-- =============================================
-- 6. RLS POLICIES FOR GUEST ORDER ITEMS
-- =============================================
DROP POLICY IF EXISTS "Admins can view guest order items" ON guest_order_items;
CREATE POLICY "Admins can view guest order items" ON guest_order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

DROP POLICY IF EXISTS "Service role can insert guest order items" ON guest_order_items;
CREATE POLICY "Service role can insert guest order items" ON guest_order_items
  FOR INSERT WITH CHECK (true);

-- =============================================
-- 7. RLS POLICIES FOR GUEST ORDER TRACKING
-- =============================================
DROP POLICY IF EXISTS "Admins can manage guest order tracking" ON guest_order_tracking;
CREATE POLICY "Admins can manage guest order tracking" ON guest_order_tracking
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

DROP POLICY IF EXISTS "Drivers can add guest order tracking" ON guest_order_tracking;
CREATE POLICY "Drivers can add guest order tracking" ON guest_order_tracking
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM guest_orders WHERE guest_orders.id = guest_order_tracking.guest_order_id AND guest_orders.assigned_driver_id = auth.uid())
  );

DROP POLICY IF EXISTS "Service role can insert guest order tracking" ON guest_order_tracking;
CREATE POLICY "Service role can insert guest order tracking" ON guest_order_tracking
  FOR INSERT WITH CHECK (true);

-- =============================================
-- 8. AUTO-UPDATE TIMESTAMPS TRIGGER
-- =============================================
DROP TRIGGER IF EXISTS update_guest_orders_updated_at ON guest_orders;
CREATE TRIGGER update_guest_orders_updated_at
  BEFORE UPDATE ON guest_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 9. PERFORMANCE INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_guest_orders_phone ON guest_orders(guest_phone);
CREATE INDEX IF NOT EXISTS idx_guest_orders_email ON guest_orders(guest_email);
CREATE INDEX IF NOT EXISTS idx_guest_orders_status ON guest_orders(status);
CREATE INDEX IF NOT EXISTS idx_guest_orders_order_number ON guest_orders(order_number);
CREATE INDEX IF NOT EXISTS idx_guest_orders_created_at ON guest_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_guest_orders_payment_status ON guest_orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_guest_orders_assigned_driver ON guest_orders(assigned_driver_id);
CREATE INDEX IF NOT EXISTS idx_guest_orders_converted_user ON guest_orders(converted_user_id);
CREATE INDEX IF NOT EXISTS idx_guest_order_items_order ON guest_order_items(guest_order_id);
CREATE INDEX IF NOT EXISTS idx_guest_order_tracking_order ON guest_order_tracking(guest_order_id);

-- =============================================
-- 10. ADMIN VIEW: ALL ORDERS (registered + guest)
-- =============================================
-- This view combines regular orders and guest orders for admin dashboard
CREATE OR REPLACE VIEW admin_all_orders AS
SELECT 
  o.id,
  o.order_number,
  p.full_name AS customer_name,
  p.email AS customer_email,
  p.phone AS customer_phone,
  'registered' AS customer_type,
  o.status,
  o.payment_method,
  o.payment_status,
  o.subtotal,
  o.delivery_fee,
  o.discount_amount,
  o.total_amount,
  o.special_instructions,
  o.created_at,
  o.updated_at
FROM orders o
LEFT JOIN profiles p ON o.user_id = p.id

UNION ALL

SELECT 
  go.id,
  go.order_number,
  go.guest_name AS customer_name,
  go.guest_email AS customer_email,
  go.guest_phone AS customer_phone,
  'guest' AS customer_type,
  go.status,
  go.payment_method,
  go.payment_status,
  go.subtotal,
  go.delivery_fee,
  go.discount_amount,
  go.total_amount,
  go.special_instructions,
  go.created_at,
  go.updated_at
FROM guest_orders go

ORDER BY created_at DESC;

-- =============================================
-- 11. FUNCTION: Migrate guest order to registered user
-- =============================================
-- When a guest creates an account, call this to link their past orders
CREATE OR REPLACE FUNCTION migrate_guest_orders_to_user(
  p_phone TEXT,
  p_user_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  migrated_count INTEGER;
BEGIN
  UPDATE guest_orders
  SET 
    converted_user_id = p_user_id,
    updated_at = NOW()
  WHERE guest_phone = p_phone
    AND converted_user_id IS NULL;
    
  GET DIAGNOSTICS migrated_count = ROW_COUNT;
  
  RETURN migrated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 12. FUNCTION: Get order by number and phone (for guest tracking)
-- =============================================
CREATE OR REPLACE FUNCTION get_guest_order_by_number_and_phone(
  p_order_number TEXT,
  p_phone TEXT
)
RETURNS SETOF guest_orders AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM guest_orders
  WHERE order_number = p_order_number
    AND guest_phone = p_phone;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 13. FUNCTION: Dashboard stats including guest orders
-- =============================================
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_registered_orders', (SELECT COUNT(*) FROM orders),
    'total_guest_orders', (SELECT COUNT(*) FROM guest_orders),
    'total_orders', (SELECT COUNT(*) FROM orders) + (SELECT COUNT(*) FROM guest_orders),
    'pending_orders', (
      (SELECT COUNT(*) FROM orders WHERE status = 'pending') +
      (SELECT COUNT(*) FROM guest_orders WHERE status = 'pending')
    ),
    'active_orders', (
      (SELECT COUNT(*) FROM orders WHERE status NOT IN ('delivered', 'cancelled')) +
      (SELECT COUNT(*) FROM guest_orders WHERE status NOT IN ('delivered', 'cancelled'))
    ),
    'completed_orders', (
      (SELECT COUNT(*) FROM orders WHERE status = 'delivered') +
      (SELECT COUNT(*) FROM guest_orders WHERE status = 'delivered')
    ),
    'total_revenue', (
      COALESCE((SELECT SUM(total_amount) FROM orders WHERE payment_status = 'paid'), 0) +
      COALESCE((SELECT SUM(total_amount) FROM guest_orders WHERE payment_status = 'paid'), 0)
    ),
    'pending_revenue', (
      COALESCE((SELECT SUM(total_amount) FROM orders WHERE payment_status = 'pending'), 0) +
      COALESCE((SELECT SUM(total_amount) FROM guest_orders WHERE payment_status = 'pending'), 0)
    ),
    'today_orders', (
      (SELECT COUNT(*) FROM orders WHERE created_at::date = CURRENT_DATE) +
      (SELECT COUNT(*) FROM guest_orders WHERE created_at::date = CURRENT_DATE)
    ),
    'today_revenue', (
      COALESCE((SELECT SUM(total_amount) FROM orders WHERE created_at::date = CURRENT_DATE AND payment_status = 'paid'), 0) +
      COALESCE((SELECT SUM(total_amount) FROM guest_orders WHERE created_at::date = CURRENT_DATE AND payment_status = 'paid'), 0)
    ),
    'guest_conversion_rate', (
      CASE 
        WHEN (SELECT COUNT(*) FROM guest_orders) > 0 
        THEN ROUND(
          ((SELECT COUNT(*) FROM guest_orders WHERE converted_user_id IS NOT NULL)::DECIMAL / 
           (SELECT COUNT(*) FROM guest_orders)::DECIMAL) * 100, 2
        )
        ELSE 0
      END
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 14. NOTIFICATION TRIGGER: New guest order placed
-- =============================================
CREATE OR REPLACE FUNCTION notify_admin_new_guest_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a notification for all admin users
  INSERT INTO notifications (user_id, title, message, type)
  SELECT 
    p.id,
    'New Guest Order #' || NEW.order_number,
    'Guest order from ' || NEW.guest_name || ' (' || NEW.guest_phone || ') - Rs. ' || NEW.total_amount,
    'order'
  FROM profiles p
  WHERE p.role IN ('admin', 'manager');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_guest_order_created ON guest_orders;
CREATE TRIGGER on_guest_order_created
  AFTER INSERT ON guest_orders
  FOR EACH ROW EXECUTE FUNCTION notify_admin_new_guest_order();

-- =============================================
-- 15. NOTIFICATION TRIGGER: Guest order status change
-- =============================================
CREATE OR REPLACE FUNCTION notify_guest_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status <> NEW.status THEN
    -- Log the status change in tracking
    INSERT INTO guest_order_tracking (guest_order_id, status, notes)
    VALUES (NEW.id, NEW.status, 'Status changed from ' || OLD.status || ' to ' || NEW.status);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_guest_order_status_change ON guest_orders;
CREATE TRIGGER on_guest_order_status_change
  AFTER UPDATE OF status ON guest_orders
  FOR EACH ROW EXECUTE FUNCTION notify_guest_order_status_change();

-- =============================================
-- DONE!
-- =============================================
-- After running this migration:
-- 1. Guest checkout will be fully functional
-- 2. Admin dashboard will show both registered and guest orders
-- 3. Guest orders are tracked with full status history  
-- 4. When guests register, their orders can be linked to their account
-- 5. Dashboard stats include guest order data
--
-- To verify, run:
-- SELECT * FROM guest_orders LIMIT 5;
-- SELECT * FROM admin_all_orders LIMIT 10;
-- SELECT get_dashboard_stats();
