import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Text, HelperText, Snackbar } from 'react-native-paper';
import axios from 'axios';
import { API_URL } from '../../config/constants';

export default function LoginScreen({ navigation }) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [visible, setVisible] = useState(false);

  const validateInputs = () => {
    if (!phone || !password) {
      setError('الرجاء إدخال جميع البيانات المطلوبة');
      setVisible(true);
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    try {
      if (!validateInputs()) return;

      setLoading(true);
      setError('');

      const response = await axios.post(`${API_URL}/auth/login`, {
        phone,
        password
      });

      // Handle successful login
      if (response.data.success) {
        // Store token and navigate to Home
        // You should implement proper token storage (e.g., using AsyncStorage)
        navigation.navigate('Home');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'حدث خطأ أثناء تسجيل الدخول');
      setVisible(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>تسجيل الدخول</Text>
      
      <TextInput
        label="رقم الهاتف"
        value={phone}
        onChangeText={setPhone}
        style={styles.input}
        keyboardType="phone-pad"
        mode="outlined"
        error={!!error}
      />
      
      <TextInput
        label="كلمة المرور"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
        mode="outlined"
        error={!!error}
      />
      
      <HelperText type="error" visible={!!error}>
        {error}
      </HelperText>
      
      <Button 
        mode="contained" 
        onPress={handleLogin}
        style={styles.button}
        loading={loading}
        disabled={loading}
      >
        تسجيل الدخول
      </Button>
      
      <Button 
        mode="text" 
        onPress={() => navigation.navigate('Register')}
        disabled={loading}
      >
        ليس لديك حساب؟ سجل الآن
      </Button>

      <Snackbar
        visible={visible}
        onDismiss={() => setVisible(false)}
        duration={3000}
        action={{
          label: 'إغلاق',
          onPress: () => setVisible(false),
        }}>
        {error}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    marginBottom: 10,
  },
  button: {
    marginTop: 10,
    marginBottom: 10,
  },
});
