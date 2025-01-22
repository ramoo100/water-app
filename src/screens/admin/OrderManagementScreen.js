import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { DataTable, Searchbar, Button, Menu, Provider, FAB } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function OrderManagementScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [sortAscending, setSortAscending] = useState(true);
  const [visible, setVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const orders = [
    {
      id: '1',
      customerName: 'أحمد محمد',
      product: 'عبوة مياه كبيرة',
      quantity: 2,
      status: 'pending',
      date: '2025-01-13',
    },
    {
      id: '2',
      customerName: 'خالد عبدالله',
      product: 'عبوة مياه متوسطة',
      quantity: 3,
      status: 'in_progress',
      date: '2025-01-13',
    },
    // Add more orders as needed
  ];

  const itemsPerPage = 5;
  const from = page * itemsPerPage;
  const to = Math.min((page + 1) * itemsPerPage, orders.length);

  const onChangeSearch = query => setSearchQuery(query);

  const filteredOrders = orders.filter(order =>
    order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.id.includes(searchQuery)
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#FFA000';
      case 'in_progress':
        return '#1976D2';
      case 'completed':
        return '#388E3C';
      default:
        return '#757575';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'قيد الانتظار';
      case 'in_progress':
        return 'جاري التنفيذ';
      case 'completed':
        return 'مكتمل';
      default:
        return 'غير معروف';
    }
  };

  return (
    <Provider>
      <View style={styles.container}>
        <Searchbar
          placeholder="بحث عن طلب..."
          onChangeText={onChangeSearch}
          value={searchQuery}
          style={styles.searchbar}
        />

        <ScrollView>
          <DataTable>
            <DataTable.Header>
              <DataTable.Title
                sortDirection={sortAscending ? 'ascending' : 'descending'}
                onPress={() => setSortAscending(!sortAscending)}
              >
                رقم الطلب
              </DataTable.Title>
              <DataTable.Title>العميل</DataTable.Title>
              <DataTable.Title numeric>الكمية</DataTable.Title>
              <DataTable.Title>الحالة</DataTable.Title>
              <DataTable.Title>الإجراءات</DataTable.Title>
            </DataTable.Header>

            {filteredOrders.slice(from, to).map((order) => (
              <DataTable.Row key={order.id}>
                <DataTable.Cell>{order.id}</DataTable.Cell>
                <DataTable.Cell>{order.customerName}</DataTable.Cell>
                <DataTable.Cell numeric>{order.quantity}</DataTable.Cell>
                <DataTable.Cell>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                    <MaterialCommunityIcons name="circle-small" size={20} color="white" />
                    <View style={styles.statusText}>{getStatusText(order.status)}</View>
                  </View>
                </DataTable.Cell>
                <DataTable.Cell>
                  <Menu
                    visible={visible && selectedOrder === order.id}
                    onDismiss={() => setVisible(false)}
                    anchor={
                      <Button
                        onPress={() => {
                          setSelectedOrder(order.id);
                          setVisible(true);
                        }}
                      >
                        <MaterialCommunityIcons name="dots-vertical" size={20} />
                      </Button>
                    }
                  >
                    <Menu.Item
                      onPress={() => {
                        navigation.navigate('OrderDetails', { order });
                        setVisible(false);
                      }}
                      title="عرض التفاصيل"
                    />
                    <Menu.Item
                      onPress={() => {
                        navigation.navigate('AssignWorker', { order });
                        setVisible(false);
                      }}
                      title="تعيين عامل"
                    />
                    <Menu.Item
                      onPress={() => {
                        // Handle order cancellation
                        setVisible(false);
                      }}
                      title="إلغاء الطلب"
                    />
                  </Menu>
                </DataTable.Cell>
              </DataTable.Row>
            ))}

            <DataTable.Pagination
              page={page}
              numberOfPages={Math.ceil(filteredOrders.length / itemsPerPage)}
              onPageChange={page => setPage(page)}
              label={`${from + 1}-${to} من ${filteredOrders.length}`}
            />
          </DataTable>
        </ScrollView>

        <FAB
          style={styles.fab}
          icon="plus"
          onPress={() => navigation.navigate('CreateOrder')}
          label="طلب جديد"
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
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
    borderRadius: 15,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});
