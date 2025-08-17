import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabaseClient';
import { useCart } from '../context/CartContext';

const ProductList = () => {
  const { i18n, t } = useTranslation();
  const { addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setProducts(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) return <p>{t('loadingProducts', 'Loading products...')}</p>;
  if (error) return <p style={{ color: 'red' }}>{t('errorLoadingProducts', 'Error loading products:')} {error}</p>;
  if (products.length === 0) return <p>{t('noProducts', 'No products available at the moment.')}</p>;

  // Determine which language-specific fields to use
  const nameField = i18n.language === 'ar' ? 'name_ar' : 'name_en';
  const descriptionField = i18n.language === 'ar' ? 'description_ar' : 'description_en';

  return (
    <div className="product-list" style={{ marginTop: '2rem' }}>
      <h2>{t('productsTitle', 'Our Products')}</h2>
      <div className="products-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
        {products.map((product) => (
          <div key={product.id} className="product-card" style={{ border: '1px solid #444', padding: '15px', borderRadius: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <img src={product.image_url || 'https://placehold.co/600x400?text=No+Image'} alt={product[nameField]} style={{ maxWidth: '100%', height: 'auto', borderRadius: '4px' }} />
              <h3>{product[nameField]}</h3>
              <p>{product[descriptionField]}</p>
              <div className="price">
                <p><strong>{t('priceSyp', 'Price (SYP):')}</strong> {product.price_syp}</p>
                <p><strong>{t('priceUsd', 'Price (USD):')}</strong> ${product.price_usd}</p>
              </div>
            </div>
            <button onClick={() => addToCart(product)} style={{ marginTop: '10px' }}>
              {t('addToCart', 'Add to Cart')}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductList;
