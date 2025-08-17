import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { supabase } from '../supabaseClient';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const CheckoutPage = () => {
    const { t } = useTranslation();
    const { cartItems, getCartTotal, clearCart } = useCart();
    const { totalSyp, totalUsd } = getCartTotal();
    const navigate = useNavigate();

    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handlePlaceOrder = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not found. Please log in again.");

            const orderItems = cartItems.map(item => ({
                product_id: item.id,
                quantity: item.quantity,
            }));

            const { data, error: rpcError } = await supabase.rpc('create_order', {
                p_client_id: user.id,
                p_delivery_address: deliveryAddress,
                p_notes: notes,
                p_cart_items: orderItems,
            });

            if (rpcError) throw rpcError;

            // Order successful
            alert(t('orderSuccess', 'Your order has been placed successfully!'));
            clearCart();
            navigate('/');

        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    if (cartItems.length === 0) {
        return (
            <div>
                <h2>{t('checkoutTitle', 'Checkout')}</h2>
                <p>{t('cartEmpty', 'Your cart is empty. Nothing to check out.')}</p>
            </div>
        );
    }

    return (
        <div>
            <h2>{t('checkoutTitle', 'Checkout')}</h2>
            <form onSubmit={handlePlaceOrder}>
                <div>
                    <label htmlFor="deliveryAddress">{t('addressLabel', 'Delivery Address')}</label>
                    <textarea
                        id="deliveryAddress"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        placeholder={t('addressPlaceholder', 'Enter your full address')}
                        required
                        rows="3"
                        style={{ width: '100%', maxWidth: '500px' }}
                    />
                </div>
                <div style={{ marginTop: '1rem' }}>
                    <label htmlFor="notes">{t('notesLabel', 'Order Notes (optional)')}</label>
                    <textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder={t('notesPlaceholder', 'Any special instructions?')}
                        rows="3"
                        style={{ width: '100%', maxWidth: '500px' }}
                    />
                </div>

                <div style={{ marginTop: '2rem' }}>
                    <h3>{t('orderSummary', 'Order Summary')}</h3>
                    <p>{t('cartSubtotal', 'Subtotal')}: {totalSyp.toFixed(2)} {t('syp', 'SYP')} / ${totalUsd.toFixed(2)} USD</p>
                </div>

                {error && <p style={{ color: 'red', marginTop: '1rem' }}>{error}</p>}

                <button type="submit" disabled={loading} style={{ marginTop: '1rem', padding: '10px 20px' }}>
                    {loading ? t('placingOrder', 'Placing Order...') : t('placeOrder', 'Place Order')}
                </button>
            </form>
        </div>
    );
};

export default CheckoutPage;
