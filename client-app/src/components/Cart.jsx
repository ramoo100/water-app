import React from 'react';
import { useCart } from '../context/CartContext';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const Cart = () => {
  const { cartItems, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart();
  const { t, i18n } = useTranslation();
  const { totalSyp, totalUsd } = getCartTotal();

  const nameField = i18n.language === 'ar' ? 'name_ar' : 'name_en';

  if (cartItems.length === 0) {
    return (
      <div>
        <h2>{t('cartTitle', 'Shopping Cart')}</h2>
        <p>{t('cartEmpty', 'Your cart is empty.')}</p>
        <Link to="/">{t('continueShopping', 'Continue Shopping')}</Link>
      </div>
    );
  }

  return (
    <div>
      <h2>{t('cartTitle', 'Shopping Cart')}</h2>
      <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{t('cartProduct', 'Product')}</th>
            <th style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{t('cartQuantity', 'Quantity')}</th>
            <th style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{t('cartPrice', 'Price')}</th>
            <th style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{t('cartTotal', 'Total')}</th>
            <th style={{ padding: '8px', borderBottom: '1px solid #ddd' }}></th>
          </tr>
        </thead>
        <tbody>
          {cartItems.map(item => (
            <tr key={item.id}>
              <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{item[nameField]}</td>
              <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => updateQuantity(item.id, parseInt(e.target.value, 10))}
                  min="1"
                  style={{ width: '60px' }}
                />
              </td>
              <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{item.price_syp} {t('syp', 'SYP')}</td>
              <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{(item.price_syp * item.quantity).toFixed(2)} {t('syp', 'SYP')}</td>
              <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>
                <button onClick={() => removeFromCart(item.id)}>{t('cartRemove', 'Remove')}</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: '20px', textAlign: 'right' }}>
        <h3>{t('cartSubtotal', 'Subtotal')}: {totalSyp.toFixed(2)} {t('syp', 'SYP')} / ${totalUsd.toFixed(2)} USD</h3>
        <button onClick={clearCart} style={{ marginRight: '10px' }}>{t('cartClear', 'Clear Cart')}</button>
        <Link to="/checkout">
            <button style={{ background: '#4CAF50', color: 'white' }}>{t('proceedToCheckout', 'Proceed to Checkout')}</button>
        </Link>
      </div>
    </div>
  );
};

export default Cart;
