import React from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabaseClient';
import LanguageSwitcher from '../components/LanguageSwitcher';
import ProductList from '../components/ProductList';
import CartIcon from '../components/CartIcon';

const HomePage = ({ session }) => {
  const { t } = useTranslation();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error logging out:', error.message);
    }
  };

  return (
    <div>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #444', paddingBottom: '1rem' }}>
        <div>
          <h1>{t('welcome')}</h1>
          <p>{t('loggedInAs')} <strong>{session.user.email}</strong></p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <CartIcon />
          <LanguageSwitcher />
          <button onClick={handleLogout}>{t('logout')}</button>
        </div>
      </header>
      <main>
        <ProductList />
      </main>
    </div>
  );
};

export default HomePage;
