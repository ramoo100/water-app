-- =================================================================
--  Function: create_order
--  Description: Creates a new order and its associated items in a
--               single transaction. This is meant to be called via RPC
--               from the client application.
--
--  Instructions: Run this script in your Supabase SQL Editor to
--                create the database function.
-- =================================================================

CREATE OR REPLACE FUNCTION create_order(
    p_client_id UUID,
    p_delivery_address TEXT,
    p_notes TEXT,
    p_cart_items JSONB -- e.g., '[{"product_id": "uuid", "quantity": 2}, ...]'
)
RETURNS UUID -- Returns the new order's ID
LANGUAGE plpgsql
SECURITY DEFINER -- Important for allowing inserts with the user's permissions
AS $$
DECLARE
    v_total_syp NUMERIC(12, 2) := 0;
    v_total_usd NUMERIC(12, 2) := 0;
    v_product RECORD;
    v_order_id UUID;
    cart_item JSONB;
BEGIN
    -- Step 1: Calculate the total price of the order on the backend
    -- This prevents the client from manipulating prices.
    FOR cart_item IN SELECT * FROM jsonb_array_elements(p_cart_items)
    LOOP
        SELECT * INTO v_product FROM products WHERE id = (cart_item->>'product_id')::UUID;

        IF v_product IS NULL THEN
            RAISE EXCEPTION 'Product with ID % not found', cart_item->>'product_id';
        END IF;

        v_total_syp := v_total_syp + (v_product.price_syp * (cart_item->>'quantity')::INTEGER);
        v_total_usd := v_total_usd + (v_product.price_usd * (cart_item->>'quantity')::INTEGER);
    END LOOP;

    -- Step 2: Insert the new order into the `orders` table
    INSERT INTO public.orders (client_id, delivery_address, notes, total_amount_syp, total_amount_usd)
    VALUES (p_client_id, p_delivery_address, p_notes, v_total_syp, v_total_usd)
    RETURNING id INTO v_order_id;

    -- Step 3: Insert each item from the cart into the `order_items` table
    FOR cart_item IN SELECT * FROM jsonb_array_elements(p_cart_items)
    LOOP
        SELECT * INTO v_product FROM products WHERE id = (cart_item->>'product_id')::UUID;

        INSERT INTO public.order_items (order_id, product_id, quantity, price_per_unit_syp, price_per_unit_usd)
        VALUES (v_order_id, (cart_item->>'product_id')::UUID, (cart_item->>'quantity')::INTEGER, v_product.price_syp, v_product.price_usd);
    END LOOP;

    -- Step 4: Return the newly created order's ID
    RETURN v_order_id;
END;
$$;
