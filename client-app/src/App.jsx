import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next';
import { supabase } from './supabaseClient'
import { CartProvider } from './context/CartContext';
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import HomePage from './pages/HomePage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import './App.css'

function App() {
  const [session, setSession] = useState(null)
  const navigate = useNavigate()
  const { i18n } = useTranslation();

  useEffect(() => {
    // Check for an existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    // Listen for changes in auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (_event === 'SIGNED_IN') {
        navigate('/')
      }
      if (_event === 'SIGNED_OUT') {
        navigate('/login')
      }
    })

    // Cleanup subscription on component unmount
    return () => subscription.unsubscribe()
  }, [navigate])

  useEffect(() => {
    const handleLanguageChange = (lng) => {
      document.documentElement.dir = i18n.dir(lng);
    };

    // Set initial direction
    handleLanguageChange(i18n.language);

    i18n.on('languageChanged', handleLanguageChange);

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    }
  }, [i18n]);

  return (
    <CartProvider>
      <div className="App">
        <Routes>
          <Route
            path="/"
            element={session ? <HomePage session={session} /> : <LoginPage />}
          />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/cart"
            element={session ? <CartPage /> : <LoginPage />}
          />
          {/* Add a placeholder for checkout route */}
          <Route
            path="/checkout"
            element={session ? <CheckoutPage /> : <LoginPage />}
          />
        </Routes>
      </div>
    </CartProvider>
  )
}

export default App
