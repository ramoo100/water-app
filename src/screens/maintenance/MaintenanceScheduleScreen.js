import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert
} from 'react-native';
import {
  Text,
  Button,
  Icon,
  Card,
  Badge,
  Overlay,
  ListItem
} from 'react-native-elements';
import { Calendar } from 'react-native-calendars';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import MaintenanceService from '../../services/maintenance.service';
import SparePartService from '../../services/sparePart.service';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import MaintenanceScheduleForm from '../../components/maintenance/MaintenanceScheduleForm';
import SparePartsList from '../../components/maintenance/SparePartsList';

const MaintenanceScheduleScreen = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [showSparePartsList, setShowSparePartsList] = useState(false);
  const [markedDates, setMarkedDates] = useState({});
  const [spareParts, setSpareParts] = useState([]);
  const [lowStockParts, setLowStockParts] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [schedulesRes, sparePartsRes] = await Promise.all([
        MaintenanceService.getMaintenanceSchedules(),
        SparePartService.getSpareParts()
      ]);
      
      setSchedules(schedulesRes.data);
      setSpareParts(sparePartsRes.data);
      setLowStockParts(sparePartsRes.data.filter(part => 
        part.stock.quantity <= part.stock.minQuantity
      ));
      
      updateMarkedDates(schedulesRes.data);
    } catch (err) {
      setError('حدث خطأ في تحميل البيانات');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateMarkedDates = (schedulesList) => {
    const dates = {};
    schedulesList.forEach(schedule => {
      const date = new Date(schedule.nextDate).toISOString().split('T')[0];
      dates[date] = {
        marked: true,
        dotColor: getScheduleColor(schedule.type)
      };
    });
    setMarkedDates(dates);
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date.dateString);
    const daySchedules = schedules.filter(schedule => 
      new Date(schedule.nextDate).toISOString().split('T')[0] === date.dateString
    );
    
    if (daySchedules.length > 0) {
      showDaySchedules(daySchedules);
    }
  };

  const showDaySchedules = (daySchedules) => {
    Alert.alert(
      'جدول الصيانة',
      `${daySchedules.length} مواعيد صيانة`,
      daySchedules.map(schedule => ({
        text: `${schedule.product.nameAr} - ${getScheduleTypeText(schedule.type)}`,
        onPress: () => navigation.navigate('MaintenanceDetails', { schedule })
      }))
    );
  };

  const handleScheduleSubmit = async (scheduleData) => {
    try {
      await MaintenanceService.createMaintenanceSchedule(scheduleData);
      setShowScheduleForm(false);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const renderSchedulesSummary = () => (
    <Card containerStyle={styles.summaryCard}>
      <Card.Title>ملخص جدول الصيانة</Card.Title>
      <View style={styles.summaryContent}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>
            {schedules.filter(s => s.type === 'preventive').length}
          </Text>
          <Text style={styles.summaryLabel}>صيانة وقائية</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>
            {schedules.filter(s => s.type === 'seasonal').length}
          </Text>
          <Text style={styles.summaryLabel}>صيانة موسمية</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>
            {schedules.filter(s => s.type === 'warranty').length}
          </Text>
          <Text style={styles.summaryLabel}>صيانة ضمان</Text>
        </View>
      </View>
    </Card>
  );

  const renderLowStockAlert = () => {
    if (lowStockParts.length === 0) return null;

    return (
      <TouchableOpacity
        style={styles.alertCard}
        onPress={() => setShowSparePartsList(true)}
      >
        <Icon
          name="warning"
          type="material"
          color="#f57c00"
          size={24}
        />
        <Text style={styles.alertText}>
          {lowStockParts.length} قطع غيار منخفضة المخزون
        </Text>
        <Icon
          name="chevron-right"
          type="material"
          color="#666"
        />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadData} />;
  }

  return (
    <ScrollView style={styles.container}>
      {renderLowStockAlert()}
      {renderSchedulesSummary()}

      <View style={styles.calendarContainer}>
        <Calendar
          markedDates={markedDates}
          onDayPress={handleDateSelect}
          theme={{
            selectedDayBackgroundColor: theme.colors.primary,
            todayTextColor: theme.colors.primary,
            arrowColor: theme.colors.primary
          }}
        />
      </View>

      <View style={styles.actionsContainer}>
        <Button
          title="جدولة صيانة جديدة"
          icon={<Icon name="add" type="material" color="white" />}
          onPress={() => setShowScheduleForm(true)}
          containerStyle={styles.actionButton}
        />
        <Button
          title="إدارة قطع الغيار"
          type="outline"
          icon={<Icon name="build" type="material" color={theme.colors.primary} />}
          onPress={() => setShowSparePartsList(true)}
          containerStyle={styles.actionButton}
        />
      </View>

      <Overlay
        isVisible={showScheduleForm}
        onBackdropPress={() => setShowScheduleForm(false)}
        overlayStyle={styles.overlay}
      >
        <MaintenanceScheduleForm
          onSubmit={handleScheduleSubmit}
          onCancel={() => setShowScheduleForm(false)}
        />
      </Overlay>

      <Overlay
        isVisible={showSparePartsList}
        onBackdropPress={() => setShowSparePartsList(false)}
        overlayStyle={styles.overlay}
      >
        <SparePartsList
          spareParts={spareParts}
          lowStockParts={lowStockParts}
          onClose={() => setShowSparePartsList(false)}
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
  summaryCard: {
    margin: 10,
    borderRadius: 10
  },
  summaryContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10
  },
  summaryItem: {
    alignItems: 'center'
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3'
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5
  },
  calendarContainer: {
    margin: 10,
    backgroundColor: 'white',
    borderRadius: 10,
    overflow: 'hidden'
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10
  },
  actionButton: {
    width: '45%'
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3e0',
    padding: 15,
    margin: 10,
    borderRadius: 10
  },
  alertText: {
    flex: 1,
    marginHorizontal: 10,
    color: '#f57c00',
    fontSize: 16
  },
  overlay: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 10
  }
});

const getScheduleColor = (type) => {
  const colors = {
    preventive: '#4CAF50',
    seasonal: '#2196F3',
    warranty: '#FF9800',
    custom: '#9C27B0'
  };
  return colors[type] || '#666';
};

const getScheduleTypeText = (type) => {
  const types = {
    preventive: 'صيانة وقائية',
    seasonal: 'صيانة موسمية',
    warranty: 'صيانة ضمان',
    custom: 'صيانة خاصة'
  };
  return types[type] || type;
};

export default MaintenanceScheduleScreen;
