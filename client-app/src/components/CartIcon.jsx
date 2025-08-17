import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useTranslation } from 'react-i18next';

const CartIcon = () => {
    const { itemCount } = useCart();
    const { t } = useTranslation();

    return (
        <Link to="/cart" style={{ textDecoration: 'none', color: 'inherit', position: 'relative', display: 'inline-block' }}>
            <span>🛒</span>
            <span style={{ marginLeft: '5px' }}>{t('cartTitle', 'Cart')}</span>
            {itemCount > 0 && (
                <span style={{
                    position: 'absolute',
                    top: '-10px',
                    right: '-10px',
                    background: 'red',
                    color: 'white',
                    borderRadius: '50%',
                    padding: '2px 6px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                }}>
                    {itemCount}
                </span>
            )}
        </Link>
    );
};

export default CartIcon;
