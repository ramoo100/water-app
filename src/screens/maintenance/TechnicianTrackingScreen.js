import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView
} from 'react-native';
import {
  Text,
  Card,
  Button,
  Icon,
  Badge,
  Overlay
} from 'react-native-elements';
import MapView, { Marker, Callout } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import MaintenanceService from '../../services/maintenance.service';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import TechnicianDetails from '../../components/maintenance/TechnicianDetails';
import MaintenanceReportForm from '../../components/maintenance/MaintenanceReportForm';

const { width, height } = Dimensions.get('window');

const TechnicianTrackingScreen = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [technicians, setTechnicians] = useState([]);
  const [selectedTechnician, setSelectedTechnician] = useState(null);
  const [showReportForm, setShowReportForm] = useState(false);
  const [region, setRegion] = useState({
    latitude: 24.7136,
    longitude: 46.6753,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421
  });

  useEffect(() => {
    loadTechnicians();
    const interval = setInterval(loadTechnicians, 30000); // تحديث كل 30 ثانية
    return () => clearInterval(interval);
  }, []);

  const loadTechnicians = async () => {
    try {
      setLoading(true);
      const response = await MaintenanceService.getTechniciansLocations();
      setTechnicians(response.data);
    } catch (err) {
      setError('حدث خطأ في تحميل مواقع الفنيين');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkerPress = (technician) => {
    setSelectedTechnician(technician);
  };

  const handleReportSubmit = async (reportData) => {
    try {
      await MaintenanceService.submitReport({
        ...reportData,
        technician: selectedTechnician._id
      });
      setShowReportForm(false);
      loadTechnicians();
    } catch (err) {
      console.error(err);
    }
  };

  const getMarkerColor = (status) => {
    switch (status) {
      case 'available':
        return '#4CAF50';
      case 'busy':
        return '#FF9800';
      case 'offline':
        return '#9E9E9E';
      default:
        return '#2196F3';
    }
  };

  const renderTechnicianMarker = (technician) => (
    <Marker
      key={technician._id}
      coordinate={{
        latitude: technician.location.coordinates[1],
        longitude: technician.location.coordinates[0]
      }}
      pinColor={getMarkerColor(technician.status)}
      onPress={() => handleMarkerPress(technician)}
    >
      <Callout>
        <View style={styles.callout}>
          <Text style={styles.calloutName}>{technician.name}</Text>
          <Text style={styles.calloutStatus}>
            {getStatusText(technician.status)}
          </Text>
          {technician.currentTask && (
            <Text style={styles.calloutTask}>
              يعمل على: {technician.currentTask.description}
            </Text>
          )}
        </View>
      </Callout>
    </Marker>
  );

  const renderTechniciansList = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.techniciansList}
    >
      {technicians.map(technician => (
        <TouchableOpacity
          key={technician._id}
          onPress={() => handleMarkerPress(technician)}
        >
          <Card containerStyle={styles.technicianCard}>
            <View style={styles.technicianHeader}>
              <Text style={styles.technicianName}>{technician.name}</Text>
              <Badge
                value={getStatusText(technician.status)}
                status={getStatusBadge(technician.status)}
              />
            </View>
            {technician.currentTask && (
              <Text style={styles.currentTask}>
                {technician.currentTask.description}
              </Text>
            )}
            <Text style={styles.lastUpdate}>
              آخر تحديث: {new Date(technician.lastUpdate).toLocaleTimeString('ar-SA')}
            </Text>
          </Card>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderTechnicianDetails = () => (
    <Overlay
      isVisible={!!selectedTechnician}
      onBackdropPress={() => setSelectedTechnician(null)}
      overlayStyle={styles.overlay}
    >
      {selectedTechnician && (
        <View>
          <TechnicianDetails
            technician={selectedTechnician}
            onClose={() => setSelectedTechnician(null)}
            onCreateReport={() => setShowReportForm(true)}
          />
        </View>
      )}
    </Overlay>
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadTechnicians} />;
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
      >
        {technicians.map(renderTechnicianMarker)}
      </MapView>

      {renderTechniciansList()}
      {renderTechnicianDetails()}

      <Overlay
        isVisible={showReportForm}
        onBackdropPress={() => setShowReportForm(false)}
        overlayStyle={styles.overlay}
      >
        <MaintenanceReportForm
          technician={selectedTechnician}
          onSubmit={handleReportSubmit}
          onCancel={() => setShowReportForm(false)}
        />
      </Overlay>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  map: {
    width,
    height: height - 200
  },
  techniciansList: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    paddingVertical: 10
  },
  technicianCard: {
    width: 200,
    margin: 5,
    borderRadius: 10
  },
  technicianHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5
  },
  technicianName: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  currentTask: {
    fontSize: 14,
    color: '#666',
    marginVertical: 5
  },
  lastUpdate: {
    fontSize: 12,
    color: '#999'
  },
  callout: {
    padding: 10,
    width: 200
  },
  calloutName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5
  },
  calloutStatus: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5
  },
  calloutTask: {
    fontSize: 14,
    color: '#666'
  },
  overlay: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 10
  }
});

const getStatusText = (status) => {
  const statuses = {
    available: 'متاح',
    busy: 'مشغول',
    offline: 'غير متصل'
  };
  return statuses[status] || status;
};

const getStatusBadge = (status) => {
  const badges = {
    available: 'success',
    busy: 'warning',
    offline: 'grey'
  };
  return badges[status] || 'primary';
};

export default TechnicianTrackingScreen;
