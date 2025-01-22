import React from 'react';
import { StyleSheet } from 'react-native';
import { Card, ListItem, Icon, Badge } from 'react-native-elements';
import { useNavigation } from '@react-navigation/native';

const AlertsList = ({ alerts }) => {
  const navigation = useNavigation();

  const getAlertIcon = (type) => {
    const icons = {
      'inventory': {
        name: 'inventory',
        type: 'material',
        color: '#F44336'
      },
      'order': {
        name: 'shopping-cart',
        type: 'material',
        color: '#2196F3'
      },
      'delivery': {
        name: 'local-shipping',
        type: 'material',
        color: '#FF9800'
      },
      'maintenance': {
        name: 'build',
        type: 'material',
        color: '#795548'
      },
      'quality': {
        name: 'verified',
        type: 'material',
        color: '#4CAF50'
      }
    };
    return icons[type] || icons['order'];
  };

  const getAlertBadge = (priority) => {
    const badges = {
      'high': {
        value: 'عالي',
        status: 'error'
      },
      'medium': {
        value: 'متوسط',
        status: 'warning'
      },
      'low': {
        value: 'منخفض',
        status: 'success'
      }
    };
    return badges[priority] || badges['medium'];
  };

  const handleAlertPress = (alert) => {
    switch (alert.type) {
      case 'inventory':
        navigation.navigate('Inventory', { alert });
        break;
      case 'order':
        navigation.navigate('OrderDetails', { orderId: alert.referenceId });
        break;
      case 'delivery':
        navigation.navigate('DeliveryDetails', { deliveryId: alert.referenceId });
        break;
      case 'maintenance':
        navigation.navigate('Maintenance', { alert });
        break;
      case 'quality':
        navigation.navigate('QualityChecks', { alert });
        break;
      default:
        navigation.navigate('Alerts');
    }
  };

  return (
    <Card containerStyle={styles.container}>
      <Card.Title>التنبيهات الأخيرة</Card.Title>
      {alerts.map((alert, index) => {
        const icon = getAlertIcon(alert.type);
        const badge = getAlertBadge(alert.priority);

        return (
          <ListItem
            key={alert.id}
            bottomDivider={index !== alerts.length - 1}
            onPress={() => handleAlertPress(alert)}
            containerStyle={[
              styles.alertItem,
              alert.unread && styles.unreadAlert
            ]}
          >
            <Icon
              name={icon.name}
              type={icon.type}
              color={icon.color}
              size={24}
            />
            <ListItem.Content>
              <ListItem.Title style={styles.alertTitle}>
                {alert.title}
              </ListItem.Title>
              <ListItem.Subtitle style={styles.alertSubtitle}>
                {alert.message}
              </ListItem.Subtitle>
              <ListItem.Subtitle style={styles.alertTime}>
                {alert.time}
              </ListItem.Subtitle>
            </ListItem.Content>
            <Badge
              value={badge.value}
              status={badge.status}
              containerStyle={styles.badge}
            />
          </ListItem>
        );
      })}
      {alerts.length === 0 && (
        <ListItem>
          <ListItem.Content>
            <ListItem.Title style={styles.noAlerts}>
              لا توجد تنبيهات جديدة
            </ListItem.Title>
          </ListItem.Content>
        </ListItem>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    marginBottom: 10
  },
  alertItem: {
    borderRadius: 5,
    marginVertical: 2
  },
  unreadAlert: {
    backgroundColor: '#E3F2FD'
  },
  alertTitle: {
    fontWeight: 'bold',
    fontSize: 16
  },
  alertSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2
  },
  alertTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 2
  },
  badge: {
    marginTop: 0
  },
  noAlerts: {
    textAlign: 'center',
    color: '#666'
  }
});

export default AlertsList;
