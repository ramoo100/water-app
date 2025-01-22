import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { DataTable, Searchbar, Button, Menu, Provider, FAB, Avatar, Card, Title, Paragraph } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function WorkerManagementScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [visible, setVisible] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState(null);

  const workers = [
    {
      id: '1',
      name: 'محمد أحمد',
      phone: '0501234567',
      status: 'active',
      completedOrders: 156,
      rating: 4.8,
      joinDate: '2024-12-01',
    },
    {
      id: '2',
      name: 'عبدالله خالد',
      phone: '0507654321',
      status: 'inactive',
      completedOrders: 89,
      rating: 4.5,
      joinDate: '2024-12-15',
    },
    // Add more workers as needed
  ];

  const itemsPerPage = 5;
  const from = page * itemsPerPage;
  const to = Math.min((page + 1) * itemsPerPage, workers.length);

  const onChangeSearch = query => setSearchQuery(query);

  const filteredWorkers = workers.filter(worker =>
    worker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    worker.phone.includes(searchQuery)
  );

  const WorkerCard = ({ worker }) => (
    <Card style={styles.workerCard}>
      <Card.Content>
        <View style={styles.workerHeader}>
          <View style={styles.workerInfo}>
            <Avatar.Text size={40} label={worker.name.substring(0, 2)} />
            <View style={styles.workerDetails}>
              <Title>{worker.name}</Title>
              <Paragraph>{worker.phone}</Paragraph>
            </View>
          </View>
          <Menu
            visible={visible && selectedWorker === worker.id}
            onDismiss={() => setVisible(false)}
            anchor={
              <Button
                onPress={() => {
                  setSelectedWorker(worker.id);
                  setVisible(true);
                }}
              >
                <MaterialCommunityIcons name="dots-vertical" size={20} />
              </Button>
            }
          >
            <Menu.Item
              onPress={() => {
                navigation.navigate('WorkerDetails', { worker });
                setVisible(false);
              }}
              title="عرض التفاصيل"
            />
            <Menu.Item
              onPress={() => {
                navigation.navigate('EditWorker', { worker });
                setVisible(false);
              }}
              title="تعديل البيانات"
            />
            <Menu.Item
              onPress={() => {
                // Handle worker deactivation
                setVisible(false);
              }}
              title={worker.status === 'active' ? 'إيقاف العامل' : 'تفعيل العامل'}
            />
          </Menu>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.stat}>
            <MaterialCommunityIcons name="truck-delivery" size={20} color="#666" />
            <Paragraph>{worker.completedOrders} طلب</Paragraph>
          </View>
          <View style={styles.stat}>
            <MaterialCommunityIcons name="star" size={20} color="#FFC107" />
            <Paragraph>{worker.rating}</Paragraph>
          </View>
          <View style={styles.stat}>
            <MaterialCommunityIcons
              name="circle"
              size={20}
              color={worker.status === 'active' ? '#4CAF50' : '#757575'}
            />
            <Paragraph>{worker.status === 'active' ? 'نشط' : 'غير نشط'}</Paragraph>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <Provider>
      <View style={styles.container}>
        <Searchbar
          placeholder="بحث عن عامل..."
          onChangeText={onChangeSearch}
          value={searchQuery}
          style={styles.searchbar}
        />

        <ScrollView>
          {filteredWorkers.slice(from, to).map((worker) => (
            <WorkerCard key={worker.id} worker={worker} />
          ))}

          <DataTable.Pagination
            page={page}
            numberOfPages={Math.ceil(filteredWorkers.length / itemsPerPage)}
            onPageChange={page => setPage(page)}
            label={`${from + 1}-${to} من ${filteredWorkers.length}`}
          />
        </ScrollView>

        <FAB
          style={styles.fab}
          icon="plus"
          onPress={() => navigation.navigate('AddWorker')}
          label="إضافة عامل"
        />
      </View>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchbar: {
    margin: 10,
    elevation: 4,
  },
  workerCard: {
    margin: 10,
    elevation: 4,
  },
  workerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  workerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workerDetails: {
    marginLeft: 10,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});
