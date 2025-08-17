import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabaseClient';

const RegisterPage = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;

      // Check if user is returned and needs confirmation
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        setError("User already exists.");
      } else {
        setSuccess(true);
      }

    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>{t('createAccount')}</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success ? (
        <p style={{ color: 'green' }}>
          {t('registrationSuccess')}
        </p>
      ) : (
        <form onSubmit={handleRegister}>
          <div>
            <label htmlFor="fullName">{t('fullNameLabel')}</label>
            <input
              id="fullName"
              type="text"
              placeholder={t('fullNamePlaceholder')}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="email">{t('emailLabel')}</label>
            <input
              id="email"
              type="email"
              placeholder={t('emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="password">{t('passwordLabel')}</label>
            <input
              id="password"
              type="password"
              placeholder={t('passwordPlaceholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? t('registering') : t('signUp')}
          </button>
        </form>
      )}
      <p>
        {t('alreadyHaveAccount')} <Link to="/login">{t('login')}</Link>
      </p>
    </div>
  );
};

export default RegisterPage;
