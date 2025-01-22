import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch
} from 'react-native';
import {
  Card,
  Text,
  Button,
  Icon,
  Input,
  ListItem,
  Divider,
  Overlay,
  ColorPicker
} from 'react-native-elements';
import DraggableGrid from 'react-native-draggable-grid';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import DashboardService from '../../services/dashboard.service';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';

const DashboardSettingsScreen = () => {
  const { theme, updateTheme } = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [settings, setSettings] = useState(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedColor, setSelectedColor] = useState(null);
  const [colorType, setColorType] = useState(null);
  const [editingWidget, setEditingWidget] = useState(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await DashboardService.getDashboardSettings();
      setSettings(response.data);
    } catch (err) {
      setError('حدث خطأ في تحميل الإعدادات');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleWidgetReorder = async (newOrder) => {
    try {
      await DashboardService.updateWidgetOrder(newOrder);
      setSettings(prev => ({
        ...prev,
        widgets: newOrder
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleWidgetToggle = async (widgetId) => {
    try {
      await DashboardService.toggleWidget(widgetId);
      setSettings(prev => ({
        ...prev,
        widgets: prev.widgets.map(w =>
          w.id === widgetId ? { ...w, enabled: !w.enabled } : w
        )
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleThemeChange = async (updates) => {
    try {
      await DashboardService.updateTheme(updates);
      setSettings(prev => ({
        ...prev,
        theme: { ...prev.theme, ...updates }
      }));
      updateTheme(updates);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationToggle = async (type, value) => {
    try {
      await DashboardService.updateNotificationSettings({ [type]: value });
      setSettings(prev => ({
        ...prev,
        notifications: {
          ...prev.notifications,
          types: {
            ...prev.notifications.types,
            [type]: { ...prev.notifications.types[type], enabled: value }
          }
        }
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const renderWidgetSettings = () => (
    <Card containerStyle={styles.section}>
      <Card.Title>الأدوات</Card.Title>
      <DraggableGrid
        numColumns={2}
        renderItem={({ item }) => (
          <Card containerStyle={styles.widgetCard}>
            <View style={styles.widgetHeader}>
              <Text style={styles.widgetTitle}>{item.title}</Text>
              <Switch
                value={item.enabled}
                onValueChange={() => handleWidgetToggle(item.id)}
              />
            </View>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setEditingWidget(item)}
            >
              <Icon name="edit" type="material" size={20} />
            </TouchableOpacity>
          </Card>
        )}
        data={settings?.widgets || []}
        onDragRelease={handleWidgetReorder}
      />
    </Card>
  );

  const renderThemeSettings = () => (
    <Card containerStyle={styles.section}>
      <Card.Title>المظهر</Card.Title>
      <ListItem onPress={() => {
        setColorType('primary');
        setSelectedColor(settings.theme.primaryColor);
        setShowColorPicker(true);
      }}>
        <Icon name="palette" type="material" />
        <ListItem.Content>
          <ListItem.Title>اللون الرئيسي</ListItem.Title>
        </ListItem.Content>
        <View
          style={[styles.colorPreview, { backgroundColor: settings.theme.primaryColor }]}
        />
      </ListItem>
      <ListItem onPress={() => {
        setColorType('background');
        setSelectedColor(settings.theme.backgroundColor);
        setShowColorPicker(true);
      }}>
        <Icon name="format-color-fill" type="material" />
        <ListItem.Content>
          <ListItem.Title>لون الخلفية</ListItem.Title>
        </ListItem.Content>
        <View
          style={[styles.colorPreview, { backgroundColor: settings.theme.backgroundColor }]}
        />
      </ListItem>
      <ListItem>
        <Icon name="format-size" type="material" />
        <ListItem.Content>
          <ListItem.Title>حجم الخط</ListItem.Title>
        </ListItem.Content>
        <Input
          containerStyle={styles.fontSizeInput}
          value={settings.theme.fontSize.toString()}
          keyboardType="numeric"
          onChangeText={value => handleThemeChange({ fontSize: parseInt(value) || 14 })}
        />
      </ListItem>
    </Card>
  );

  const renderNotificationSettings = () => (
    <Card containerStyle={styles.section}>
      <Card.Title>التنبيهات</Card.Title>
      {Object.entries(settings?.notifications?.types || {}).map(([type, config]) => (
        <ListItem key={type}>
          <Icon name={getNotificationIcon(type)} type="material" />
          <ListItem.Content>
            <ListItem.Title>{getNotificationTitle(type)}</ListItem.Title>
          </ListItem.Content>
          <Switch
            value={config.enabled}
            onValueChange={value => handleNotificationToggle(type, value)}
          />
        </ListItem>
      ))}
    </Card>
  );

  const renderWidgetEditor = () => (
    <Overlay
      isVisible={!!editingWidget}
      onBackdropPress={() => setEditingWidget(null)}
      overlayStyle={styles.overlay}
    >
      {editingWidget && (
        <View>
          <Text h4>تعديل {editingWidget.title}</Text>
          <Input
            label="العنوان"
            value={editingWidget.title}
            onChangeText={value => setEditingWidget(prev => ({
              ...prev,
              title: value
            }))}
          />
          <Input
            label="فترة التحديث (ثواني)"
            value={editingWidget.refreshInterval.toString()}
            keyboardType="numeric"
            onChangeText={value => setEditingWidget(prev => ({
              ...prev,
              refreshInterval: parseInt(value) || 300
            }))}
          />
          <Button
            title="حفظ التغييرات"
            onPress={async () => {
              try {
                await DashboardService.updateWidget(editingWidget.id, editingWidget);
                setSettings(prev => ({
                  ...prev,
                  widgets: prev.widgets.map(w =>
                    w.id === editingWidget.id ? editingWidget : w
                  )
                }));
                setEditingWidget(null);
              } catch (err) {
                console.error(err);
              }
            }}
          />
        </View>
      )}
    </Overlay>
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadSettings} />;
  }

  return (
    <ScrollView style={styles.container}>
      {renderWidgetSettings()}
      {renderThemeSettings()}
      {renderNotificationSettings()}
      {renderWidgetEditor()}

      <Overlay
        isVisible={showColorPicker}
        onBackdropPress={() => setShowColorPicker(false)}
        overlayStyle={styles.overlay}
      >
        <ColorPicker
          color={selectedColor}
          onColorSelected={color => {
            handleThemeChange({ [`${colorType}Color`]: color });
            setShowColorPicker(false);
          }}
        />
      </Overlay>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  section: {
    borderRadius: 10,
    marginBottom: 10
  },
  widgetCard: {
    width: '48%',
    margin: '1%',
    borderRadius: 10
  },
  widgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  widgetTitle: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  editButton: {
    position: 'absolute',
    right: 5,
    bottom: 5
  },
  colorPreview: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#ddd'
  },
  fontSizeInput: {
    width: 60
  },
  overlay: {
    width: '80%',
    padding: 20,
    borderRadius: 10
  }
});

const getNotificationIcon = (type) => {
  const icons = {
    inventory: 'inventory',
    orders: 'shopping-cart',
    deliveries: 'local-shipping',
    maintenance: 'build',
    quality: 'verified'
  };
  return icons[type] || 'notifications';
};

const getNotificationTitle = (type) => {
  const titles = {
    inventory: 'تنبيهات المخزون',
    orders: 'تنبيهات الطلبات',
    deliveries: 'تنبيهات التوصيل',
    maintenance: 'تنبيهات الصيانة',
    quality: 'تنبيهات الجودة'
  };
  return titles[type] || type;
};

export default DashboardSettingsScreen;
