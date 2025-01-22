import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity
} from 'react-native';
import {
  Text,
  Input,
  Button,
  Icon,
  Divider,
  CheckBox
} from 'react-native-elements';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import LocationPicker from '../common/LocationPicker';

const MaintenanceRequestForm = ({ product, onSubmit, onCancel }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    type: 'maintenance',
    priority: 'normal',
    description: '',
    location: {
      address: '',
      coordinates: null
    },
    preferredDate: new Date(),
    alternativeDate: new Date(),
    attachments: []
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateType, setDateType] = useState('preferred');
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  const maintenanceTypes = [
    { id: 'installation', nameAr: 'تركيب', icon: 'build' },
    { id: 'repair', nameAr: 'إصلاح', icon: 'handyman' },
    { id: 'maintenance', nameAr: 'صيانة', icon: 'settings' },
    { id: 'consultation', nameAr: 'استشارة', icon: 'help' }
  ];

  const priorities = [
    { id: 'urgent', nameAr: 'عاجل', color: '#f44336' },
    { id: 'high', nameAr: 'مرتفع', color: '#ff9800' },
    { id: 'normal', nameAr: 'عادي', color: '#4caf50' },
    { id: 'low', nameAr: 'منخفض', color: '#2196f3' }
  ];

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData(prev => ({
        ...prev,
        [dateType === 'preferred' ? 'preferredDate' : 'alternativeDate']: selectedDate
      }));
    }
  };

  const handleLocationSelect = (location) => {
    setFormData(prev => ({
      ...prev,
      location
    }));
    setShowLocationPicker(false);
  };

  const handleSubmit = () => {
    // Validate form
    if (!formData.description) {
      // Show error
      return;
    }
    onSubmit(formData);
  };

  return (
    <ScrollView style={styles.container}>
      <Text h4 style={styles.title}>طلب صيانة</Text>
      
      {product && (
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{product.nameAr}</Text>
          <Text style={styles.productModel}>{product.brand} - {product.model}</Text>
          <Divider style={styles.divider} />
        </View>
      )}

      <Text style={styles.sectionTitle}>نوع الخدمة</Text>
      <View style={styles.typeButtons}>
        {maintenanceTypes.map(type => (
          <TouchableOpacity
            key={type.id}
            style={[
              styles.typeButton,
              formData.type === type.id && styles.selectedType
            ]}
            onPress={() => setFormData(prev => ({ ...prev, type: type.id }))}
          >
            <Icon
              name={type.icon}
              type="material"
              color={formData.type === type.id ? theme.colors.primary : '#666'}
            />
            <Text style={styles.typeText}>{type.nameAr}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>الأولوية</Text>
      <View style={styles.priorityButtons}>
        {priorities.map(priority => (
          <CheckBox
            key={priority.id}
            title={priority.nameAr}
            checked={formData.priority === priority.id}
            onPress={() => setFormData(prev => ({ ...prev, priority: priority.id }))}
            checkedColor={priority.color}
            containerStyle={styles.priorityCheckbox}
          />
        ))}
      </View>

      <Input
        label="وصف المشكلة"
        multiline
        numberOfLines={4}
        value={formData.description}
        onChangeText={text => setFormData(prev => ({ ...prev, description: text }))}
        placeholder="يرجى وصف المشكلة بالتفصيل..."
      />

      <Text style={styles.sectionTitle}>الموقع</Text>
      <TouchableOpacity
        style={styles.locationButton}
        onPress={() => setShowLocationPicker(true)}
      >
        <Icon name="location-on" type="material" color={theme.colors.primary} />
        <Text style={styles.locationText}>
          {formData.location.address || 'اختر الموقع'}
        </Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>التاريخ المفضل</Text>
      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => {
          setDateType('preferred');
          setShowDatePicker(true);
        }}
      >
        <Icon name="event" type="material" color={theme.colors.primary} />
        <Text style={styles.dateText}>
          {formData.preferredDate.toLocaleDateString('ar-SA')}
        </Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>تاريخ بديل</Text>
      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => {
          setDateType('alternative');
          setShowDatePicker(true);
        }}
      >
        <Icon name="event" type="material" color={theme.colors.primary} />
        <Text style={styles.dateText}>
          {formData.alternativeDate.toLocaleDateString('ar-SA')}
        </Text>
      </TouchableOpacity>

      <View style={styles.buttonsContainer}>
        <Button
          title="إرسال الطلب"
          onPress={handleSubmit}
          icon={<Icon name="send" type="material" color="white" />}
          containerStyle={styles.submitButton}
        />
        <Button
          title="إلغاء"
          type="outline"
          onPress={onCancel}
          containerStyle={styles.cancelButton}
        />
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={dateType === 'preferred' ? formData.preferredDate : formData.alternativeDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}

      {showLocationPicker && (
        <LocationPicker
          onSelect={handleLocationSelect}
          onCancel={() => setShowLocationPicker(false)}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 15
  },
  title: {
    textAlign: 'center',
    marginBottom: 20
  },
  productInfo: {
    marginBottom: 20
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  productModel: {
    fontSize: 14,
    color: '#666'
  },
  divider: {
    marginVertical: 10
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 10
  },
  typeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  typeButton: {
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
    width: '23%'
  },
  selectedType: {
    backgroundColor: '#e3f2fd'
  },
  typeText: {
    marginTop: 5,
    fontSize: 12
  },
  priorityButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20
  },
  priorityCheckbox: {
    width: '48%',
    borderWidth: 0,
    backgroundColor: 'transparent'
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    marginBottom: 20
  },
  locationText: {
    marginLeft: 10
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    marginBottom: 20
  },
  dateText: {
    marginLeft: 10
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20
  },
  submitButton: {
    width: '48%'
  },
  cancelButton: {
    width: '48%'
  }
});

export default MaintenanceRequestForm;
