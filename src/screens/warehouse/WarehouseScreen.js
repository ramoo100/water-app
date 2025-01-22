import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl
} from 'react-native';
import { Card, Button, Icon, SearchBar, Overlay } from 'react-native-elements';
import { BarChart, LineChart } from 'react-native-chart-kit';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import WarehouseService from '../../services/warehouse.service';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import WarehouseCard from '../../components/warehouse/WarehouseCard';
import InventoryList from '../../components/warehouse/InventoryList';
import TransferModal from '../../components/warehouse/TransferModal';
import StockCountModal from '../../components/warehouse/StockCountModal';
import { formatCurrency } from '../../utils/currency';

const WarehouseScreen = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation();
  
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showStockCountModal, setShowStockCountModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [inventoryStats, setInventoryStats] = useState(null);
  const [transferHistory, setTransferHistory] = useState([]);

  useEffect(() => {
    loadWarehouseData();
  }, []);

  const loadWarehouseData = async () => {
    try {
      setLoading(true);
      const response = await WarehouseService.getWarehouses();
      setWarehouses(response.data);
      if (response.data.length > 0) {
        setSelectedWarehouse(response.data[0]);
        await loadWarehouseStats(response.data[0]._id);
      }
    } catch (err) {
      setError('حدث خطأ في تحميل بيانات المستودعات');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadWarehouseStats = async (warehouseId) => {
    try {
      const [statsResponse, transfersResponse] = await Promise.all([
        WarehouseService.getWarehouseStats(warehouseId),
        WarehouseService.getTransferHistory(warehouseId)
      ]);
      setInventoryStats(statsResponse.data);
      setTransferHistory(transfersResponse.data);
    } catch (err) {
      console.error(err);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWarehouseData();
    setRefreshing(false);
  };

  const handleWarehouseSelect = async (warehouse) => {
    setSelectedWarehouse(warehouse);
    await loadWarehouseStats(warehouse._id);
  };

  const handleTransfer = () => {
    setShowTransferModal(true);
  };

  const handleStockCount = () => {
    setShowStockCountModal(true);
  };

  const renderInventoryChart = () => {
    if (!inventoryStats) return null;

    const data = {
      labels: ['مياه', 'ثلج'],
      datasets: [{
        data: [
          inventoryStats.occupancyRate.water,
          inventoryStats.occupancyRate.ice
        ]
      }]
    };

    return (
      <Card containerStyle={styles.chartCard}>
        <Card.Title>نسبة الإشغال</Card.Title>
        <BarChart
          data={data}
          width={300}
          height={200}
          chartConfig={{
            backgroundColor: theme.colors.background,
            backgroundGradientFrom: theme.colors.background,
            backgroundGradientTo: theme.colors.background,
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
            style: {
              borderRadius: 16
            }
          }}
          style={styles.chart}
        />
      </Card>
    );
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadWarehouseData} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <SearchBar
        placeholder="بحث في المستودعات..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        containerStyle={styles.searchBar}
        platform="ios"
      />

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.warehouseList}>
          {warehouses
            .filter(w => w.name.includes(searchQuery))
            .map(warehouse => (
              <WarehouseCard
                key={warehouse._id}
                warehouse={warehouse}
                selected={selectedWarehouse?._id === warehouse._id}
                onSelect={() => handleWarehouseSelect(warehouse)}
              />
            ))
          }
        </View>

        {selectedWarehouse && (
          <View style={styles.selectedWarehouse}>
            <Card containerStyle={styles.statsCard}>
              <Card.Title>{selectedWarehouse.name}</Card.Title>
              <Text style={styles.warehouseCode}>
                الرمز: {selectedWarehouse.code}
              </Text>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Icon name="water" type="material-community" />
                  <Text>السعة (مياه): {selectedWarehouse.capacity.water}</Text>
                </View>
                <View style={styles.statItem}>
                  <Icon name="snowflake" type="font-awesome-5" />
                  <Text>السعة (ثلج): {selectedWarehouse.capacity.ice}</Text>
                </View>
              </View>

              <View style={styles.actionButtons}>
                <Button
                  title="تحويل مخزون"
                  onPress={handleTransfer}
                  icon={<Icon name="exchange" type="font-awesome" color="white" />}
                />
                <Button
                  title="جرد"
                  onPress={handleStockCount}
                  icon={<Icon name="clipboard-list" type="font-awesome-5" color="white" />}
                />
              </View>
            </Card>

            {renderInventoryChart()}

            <InventoryList
              inventory={selectedWarehouse.inventory}
              onItemPress={(item) => navigation.navigate('InventoryDetails', { item })}
            />
          </View>
        )}
      </ScrollView>

      <TransferModal
        visible={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        sourceWarehouse={selectedWarehouse}
        warehouses={warehouses}
        onTransferComplete={onRefresh}
      />

      <StockCountModal
        visible={showStockCountModal}
        onClose={() => setShowStockCountModal(false)}
        warehouse={selectedWarehouse}
        onCountComplete={onRefresh}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  searchBar: {
    backgroundColor: 'transparent',
    borderBottomColor: 'transparent',
    borderTopColor: 'transparent'
  },
  warehouseList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10
  },
  selectedWarehouse: {
    padding: 10
  },
  statsCard: {
    borderRadius: 10,
    marginBottom: 10
  },
  warehouseCode: {
    textAlign: 'center',
    marginBottom: 10,
    color: '#666'
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10
  },
  statItem: {
    alignItems: 'center'
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10
  },
  chartCard: {
    borderRadius: 10,
    marginBottom: 10
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16
  }
});

export default WarehouseScreen;
