import React from 'react';
import Cart from '../components/Cart';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const CartPage = () => {
    const { t } = useTranslation();
    return (
        <div>
            <Link to="/">{t('backToHome', '< Back to Home')}</Link>
            <Cart />
        </div>
    );
};

export default CartPage;
