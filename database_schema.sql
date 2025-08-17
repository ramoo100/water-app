-- =================================================================
--  Syrian Cigarette Distribution System - Database Schema
--  Author: Jules
--  Platform: Supabase (PostgreSQL)
-- =================================================================

-- -----------------------------------------------------------------
--  Enable UUID extension
-- -----------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------
--  Custom Types
-- -----------------------------------------------------------------
CREATE TYPE user_role AS ENUM ('manager', 'assistant', 'client', 'delivery_worker');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'out_for_delivery', 'delivered', 'cancelled', 'rejected');
CREATE TYPE payment_status AS ENUM ('paid', 'unpaid', 'partial');
CREATE TYPE currency_type AS ENUM ('SYP', 'USD');
CREATE TYPE inventory_movement_type AS ENUM ('stock_in', 'sale', 'return', 'adjustment');

-- -----------------------------------------------------------------
--  Table: users
--  Stores user accounts for all roles.
--  Auth is handled by Supabase Auth, this table stores public profile data.
-- -----------------------------------------------------------------
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone_number TEXT UNIQUE,
    role user_role NOT NULL DEFAULT 'client',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Comment on users table
COMMENT ON TABLE users IS 'Profile information for all users. Links to Supabase auth.users table.';

-- -----------------------------------------------------------------
--  Table: permissions
--  Defines a list of possible permissions in the system.
-- -----------------------------------------------------------------
CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE, -- e.g., 'manage_products', 'view_invoices', 'delete_users'
    description_ar TEXT,
    description_en TEXT
);

-- Comment on permissions table
COMMENT ON TABLE permissions IS 'List of all available permissions that can be assigned to assistants.';

-- -----------------------------------------------------------------
--  Table: assistant_permissions
--  Links assistants to their specific permissions.
-- -----------------------------------------------------------------
CREATE TABLE assistant_permissions (
    assistant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (assistant_id, permission_id)
);

-- Comment on assistant_permissions table
COMMENT ON TABLE assistant_permissions IS 'Join table to grant specific permissions to users with the "assistant" role.';

-- -----------------------------------------------------------------
--  Table: products
--  Stores all cigarette products available for sale.
-- -----------------------------------------------------------------
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    description_ar TEXT,
    description_en TEXT,
    price_syp NUMERIC(10, 2) NOT NULL,
    price_usd NUMERIC(10, 2) NOT NULL,
    quantity_in_stock INTEGER NOT NULL DEFAULT 0,
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Comment on products table
COMMENT ON TABLE products IS 'Represents the cigarette products available for sale.';

-- -----------------------------------------------------------------
--  Table: orders
--  Stores customer orders.
-- -----------------------------------------------------------------
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES users(id),
    delivery_worker_id UUID REFERENCES users(id),
    status order_status NOT NULL DEFAULT 'pending',
    total_amount_syp NUMERIC(12, 2) NOT NULL,
    total_amount_usd NUMERIC(12, 2) NOT NULL,
    delivery_address TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Comment on orders table
COMMENT ON TABLE orders IS 'Contains all customer orders.';

-- -----------------------------------------------------------------
--  Table: order_items
--  Stores the individual items within an order.
-- -----------------------------------------------------------------
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price_per_unit_syp NUMERIC(10, 2) NOT NULL,
    price_per_unit_usd NUMERIC(10, 2) NOT NULL
);

-- Comment on order_items table
COMMENT ON TABLE order_items IS 'Acts as a join table for the many-to-many relationship between orders and products.';

-- -----------------------------------------------------------------
--  Table: invoices
--  Stores invoice data related to orders.
-- -----------------------------------------------------------------
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID UNIQUE NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '7 day'),
    status payment_status NOT NULL DEFAULT 'unpaid',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Comment on invoices table
COMMENT ON TABLE invoices IS 'Stores invoice information for each order.';

-- -----------------------------------------------------------------
--  Table: payments
--  Records all payment transactions.
-- -----------------------------------------------------------------
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id),
    amount NUMERIC(12, 2) NOT NULL,
    currency currency_type NOT NULL,
    payment_method TEXT, -- e.g., 'Cash', 'Card'
    transaction_id TEXT, -- For external payment gateways
    status TEXT NOT NULL, -- e.g., 'completed', 'failed'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Comment on payments table
COMMENT ON TABLE payments IS 'Logs all payment attempts and successful transactions.';

-- -----------------------------------------------------------------
--  Table: inventory_movements
--  Tracks changes in product stock for auditing.
-- -----------------------------------------------------------------
CREATE TABLE inventory_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id),
    type inventory_movement_type NOT NULL,
    quantity_change INTEGER NOT NULL, -- Can be positive or negative
    reason TEXT, -- e.g., "Order #123", "Stock correction"
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Comment on inventory_movements table
COMMENT ON TABLE inventory_movements IS 'Provides an audit trail for all inventory changes.';

-- -----------------------------------------------------------------
--  Table: notifications
--  Stores push notifications sent to users.
-- -----------------------------------------------------------------
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Comment on notifications table
COMMENT ON TABLE notifications IS 'Stores notifications to be sent to users.';

-- -----------------------------------------------------------------
--  Table: chat
--  Stores chat messages between users.
-- -----------------------------------------------------------------
CREATE TABLE chat (
    id BIGSERIAL PRIMARY KEY,
    sender_id UUID NOT NULL REFERENCES users(id),
    receiver_id UUID NOT NULL REFERENCES users(id),
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Comment on chat table
COMMENT ON TABLE chat IS 'Contains all chat messages within the system.';

-- -----------------------------------------------------------------
--  Table: tracking
--  Stores GPS location history for delivery workers.
-- -----------------------------------------------------------------
CREATE TABLE tracking (
    id BIGSERIAL PRIMARY KEY,
    delivery_worker_id UUID NOT NULL REFERENCES users(id),
    order_id UUID REFERENCES orders(id), -- Optional: link location to a specific order
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Comment on tracking table
COMMENT ON TABLE tracking IS 'Stores live location data for delivery workers.';


-- =================================================================
--  Functions and Triggers
-- =================================================================

-- -----------------------------------------------------------------
--  Trigger: handle_new_user
--  Copies new user from auth.users to public.users.
-- -----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, full_name, phone_number, role)
    VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'phone_number', 'client');
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- -----------------------------------------------------------------
--  Trigger: update_stock_on_order
--  Reduces product stock when an order is confirmed.
--  Creates an inventory movement record.
-- -----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_stock_on_order()
RETURNS TRIGGER AS $$
DECLARE
    order_item RECORD;
BEGIN
    IF NEW.status = 'confirmed' AND OLD.status = 'pending' THEN
        FOR order_item IN SELECT * FROM order_items WHERE order_id = NEW.id LOOP
            -- Decrease product quantity
            UPDATE products
            SET quantity_in_stock = quantity_in_stock - order_item.quantity
            WHERE id = order_item.product_id;

            -- Log the inventory movement
            INSERT INTO inventory_movements (product_id, type, quantity_change, reason)
            VALUES (order_item.product_id, 'sale', -order_item.quantity, 'Order ' || NEW.id::text);
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_order_confirmed
    AFTER UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_stock_on_order();

-- -----------------------------------------------------------------
--  Trigger: create_invoice_on_order_confirmation
--  Automatically creates an invoice when an order is confirmed.
-- -----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_invoice_on_order_confirmation()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'confirmed' AND OLD.status = 'pending' THEN
        INSERT INTO invoices (order_id)
        VALUES (NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_order_confirmed_create_invoice
    AFTER UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION create_invoice_on_order_confirmation();

-- -----------------------------------------------------------------
--  Row Level Security (RLS) Policies (Examples)
--  These need to be enabled on each table in Supabase UI.
-- -----------------------------------------------------------------

-- Example: Users can only see their own profile.
-- This section enables Row Level Security (RLS) on tables and defines
-- the access policies. RLS is a critical security feature that ensures
-- users can only access data they are permitted to see.

-- Enable RLS on all tables that store user-specific or sensitive data.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistant_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------
--  RLS Policies for `users` table
-- -----------------------------------------------------------------
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Managers and assistants can view all users" ON users
    FOR SELECT USING ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('manager', 'assistant'));

-- -----------------------------------------------------------------
--  RLS Policies for `products` table
-- -----------------------------------------------------------------
CREATE POLICY "All authenticated users can view products" ON products
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers and assistants can manage products" ON products
    FOR ALL USING ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('manager', 'assistant'));

-- -----------------------------------------------------------------
--  RLS Policies for `orders` table
-- -----------------------------------------------------------------
CREATE POLICY "Clients can create their own orders" ON orders
    FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Clients can view their own orders" ON orders
    FOR SELECT USING (auth.uid() = client_id);
CREATE POLICY "Managers and assistants can manage all orders" ON orders
    FOR ALL USING ((SELECT role FROM public.users WHERE id = auth.uid()) IN ('manager', 'assistant'));
CREATE POLICY "Delivery workers can view assigned orders" ON orders
    FOR SELECT USING (auth.uid() = delivery_worker_id);

-- -----------------------------------------------------------------
--  RLS Policies for `order_items` table
-- -----------------------------------------------------------------
CREATE POLICY "Users can view order items for orders they can access" ON order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders WHERE orders.id = order_items.order_id
        )
    );
CREATE POLICY "Clients can create order items for their own orders" ON order_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.client_id = auth.uid()
        )
    );

-- -----------------------------------------------------------------
--  RLS Policies for `chat` table
-- -----------------------------------------------------------------
CREATE POLICY "Users can access their own chat messages" ON chat
    FOR ALL USING (auth.uid() = sender_id OR auth.uid() = receiver_id)
    WITH CHECK (auth.uid() = sender_id);

-- This is a foundational set of RLS policies. A production system
-- would require more granular policies for each table and role,
-- especially for assistants with custom permissions.

-- =================================================================
--  End of Schema
-- =================================================================
