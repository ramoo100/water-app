import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions
} from 'react-native';
import {
  Card,
  Text,
  Button,
  Icon,
  SearchBar,
  Badge,
  Overlay,
  Divider
} from 'react-native-elements';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import ProductService from '../../services/product.service';
import MaintenanceService from '../../services/maintenance.service';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import MaintenanceRequestForm from '../../components/maintenance/MaintenanceRequestForm';
import { formatCurrency } from '../../utils/currency';

const screenWidth = Dimensions.get('window').width;

const HVACProductsScreen = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const categories = [
    { id: 'all', nameAr: 'الكل', icon: 'apps' },
    { id: 'ac', nameAr: 'تكييف', icon: 'ac-unit' },
    { id: 'refrigeration', nameAr: 'تبريد', icon: 'kitchen' },
    { id: 'solar', nameAr: 'طاقة شمسية', icon: 'wb-sunny' },
    { id: 'inverter', nameAr: 'إنفيرتر', icon: 'power' },
    { id: 'battery', nameAr: 'بطاريات', icon: 'battery-full' }
  ];

  useEffect(() => {
    loadProducts();
  }, [selectedCategory]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await ProductService.getHVACProducts(selectedCategory);
      setProducts(response.data);
    } catch (err) {
      setError('حدث خطأ في تحميل المنتجات');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMaintenanceRequest = async (formData) => {
    try {
      await MaintenanceService.createRequest({
        ...formData,
        product: selectedProduct?._id
      });
      setShowMaintenanceForm(false);
      // Show success message
    } catch (err) {
      // Show error message
      console.error(err);
    }
  };

  const renderCategories = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.categoriesContainer}
    >
      {categories.map(category => (
        <TouchableOpacity
          key={category.id}
          style={[
            styles.categoryButton,
            selectedCategory === category.id && styles.selectedCategory
          ]}
          onPress={() => setSelectedCategory(category.id)}
        >
          <Icon
            name={category.icon}
            type="material"
            color={selectedCategory === category.id ? theme.colors.primary : '#666'}
          />
          <Text style={styles.categoryText}>{category.nameAr}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderProductCard = (product) => (
    <Card key={product._id} containerStyle={styles.productCard}>
      <Card.Image
        source={{ uri: product.images[0]?.url }}
        style={styles.productImage}
      />
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{product.nameAr}</Text>
        <Text style={styles.productModel}>{product.brand} - {product.model}</Text>
        
        <View style={styles.specificationsList}>
          {renderSpecifications(product)}
        </View>

        <View style={styles.priceContainer}>
          <Text style={styles.price}>
            {formatCurrency(product.price.amount)}
          </Text>
          {product.installation.included && (
            <Badge
              value="شامل التركيب"
              status="success"
              containerStyle={styles.badge}
            />
          )}
        </View>

        <View style={styles.buttonsContainer}>
          <Button
            title="طلب المنتج"
            icon={<Icon name="shopping-cart" type="material" color="white" />}
            onPress={() => navigation.navigate('ProductDetails', { product })}
          />
          <Button
            title="طلب صيانة"
            type="outline"
            icon={<Icon name="build" type="material" color={theme.colors.primary} />}
            onPress={() => {
              setSelectedProduct(product);
              setShowMaintenanceForm(true);
            }}
          />
        </View>
      </View>
    </Card>
  );

  const renderSpecifications = (product) => {
    const specs = product.specifications[product.category];
    if (!specs) return null;

    const specsList = [];
    
    if (specs.capacity) {
      specsList.push(
        <Text key="capacity" style={styles.spec}>
          <Icon name="speed" type="material" size={16} />
          {` ${specs.capacity} ${getCapacityUnit(product.category)}`}
        </Text>
      );
    }

    if (specs.power) {
      specsList.push(
        <Text key="power" style={styles.spec}>
          <Icon name="flash-on" type="material" size={16} />
          {` ${specs.power} واط`}
        </Text>
      );
    }

    if (specs.efficiency) {
      specsList.push(
        <Text key="efficiency" style={styles.spec}>
          <Icon name="eco" type="material" size={16} />
          {` كفاءة ${specs.efficiency}%`}
        </Text>
      );
    }

    return specsList;
  };

  const getCapacityUnit = (category) => {
    switch (category) {
      case 'ac':
        return 'BTU';
      case 'battery':
        return 'Ah';
      default:
        return '';
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadProducts} />;
  }

  return (
    <View style={styles.container}>
      <SearchBar
        placeholder="ابحث عن منتج..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        containerStyle={styles.searchBar}
        platform="ios"
      />

      {renderCategories()}

      <ScrollView style={styles.productsList}>
        {products
          .filter(p => p.nameAr.includes(searchQuery) || p.model.includes(searchQuery))
          .map(renderProductCard)}
      </ScrollView>

      <Overlay
        isVisible={showMaintenanceForm}
        onBackdropPress={() => setShowMaintenanceForm(false)}
        overlayStyle={styles.overlay}
      >
        <MaintenanceRequestForm
          product={selectedProduct}
          onSubmit={handleMaintenanceRequest}
          onCancel={() => setShowMaintenanceForm(false)}
        />
      </Overlay>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  searchBar: {
    backgroundColor: 'transparent',
    borderBottomColor: 'transparent',
    borderTopColor: 'transparent'
  },
  categoriesContainer: {
    paddingVertical: 10,
    paddingHorizontal: 5,
    backgroundColor: '#fff'
  },
  categoryButton: {
    alignItems: 'center',
    padding: 10,
    marginHorizontal: 5,
    borderRadius: 10,
    backgroundColor: '#f0f0f0'
  },
  selectedCategory: {
    backgroundColor: '#e3f2fd'
  },
  categoryText: {
    marginTop: 5,
    fontSize: 12
  },
  productCard: {
    borderRadius: 10,
    marginBottom: 10
  },
  productImage: {
    height: 200,
    borderRadius: 10
  },
  productInfo: {
    padding: 10
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  productModel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5
  },
  specificationsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 10
  },
  spec: {
    fontSize: 14,
    color: '#666',
    marginRight: 15,
    marginBottom: 5
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50'
  },
  badge: {
    marginLeft: 10
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10
  },
  overlay: {
    width: '90%',
    maxHeight: '80%'
  }
});

export default HVACProductsScreen;
