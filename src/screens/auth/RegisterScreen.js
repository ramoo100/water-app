import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [address, setAddress] = useState('');

  const handleRegister = () => {
    // TODO: Implement registration logic
    navigation.navigate('Home');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>إنشاء حساب جديد</Text>
      
      <TextInput
        label="الاسم الكامل"
        value={name}
        onChangeText={setName}
        style={styles.input}
        mode="outlined"
      />
      
      <TextInput
        label="رقم الهاتف"
        value={phone}
        onChangeText={setPhone}
        style={styles.input}
        keyboardType="phone-pad"
        mode="outlined"
      />
      
      <TextInput
        label="كلمة المرور"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
        mode="outlined"
      />
      
      <TextInput
        label="العنوان"
        value={address}
        onChangeText={setAddress}
        style={styles.input}
        multiline
        numberOfLines={3}
        mode="outlined"
      />
      
      <Button 
        mode="contained" 
        onPress={handleRegister}
        style={styles.button}
      >
        إنشاء حساب
      </Button>
      
      <Button 
        mode="text" 
        onPress={() => navigation.navigate('Login')}
      >
        لديك حساب بالفعل؟ سجل دخول
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
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
