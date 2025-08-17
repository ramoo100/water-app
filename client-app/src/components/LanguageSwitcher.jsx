import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div style={{ marginTop: '20px', borderTop: '1px solid #ccc', paddingTop: '10px' }}>
      <button
        onClick={() => changeLanguage('en')}
        disabled={i18n.language === 'en'}
        style={{ marginRight: '10px' }}
      >
        English
      </button>
      <button
        onClick={() => changeLanguage('ar')}
        disabled={i18n.language === 'ar'}
      >
        العربية
      </button>
    </div>
  );
};

export default LanguageSwitcher;
