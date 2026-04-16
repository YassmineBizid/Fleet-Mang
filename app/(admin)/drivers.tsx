import React from 'react';
import { View, StyleSheet, FlatList, SafeAreaView, TouchableOpacity } from 'react-native';
import { Text, Searchbar, Avatar } from 'react-native-paper';
import { useFleetStore } from '../../stores/fleetStore';
import { Driver } from '../../types';
import { spacing } from '../../constants/theme';
import { Phone, Star, Package, MapPin } from 'lucide-react-native';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  available: { label: 'Disponible', color: '#10b981' },
  on_delivery: { label: 'En livraison', color: '#6366f1' },
  offline: { label: 'Hors ligne', color: '#64748b' },
  break: { label: 'En pause', color: '#f59e0b' },
};

function DriverCard({ driver }: { driver: Driver }) {
  const status = STATUS_MAP[driver.status];
  const vehicle = useFleetStore.getState().vehicles.find(v => v.id === driver.vehicleId);

  return (
    <TouchableOpacity style={styles.card}>
      <View style={styles.cardTop}>
        <Avatar.Text
          size={50}
          label={driver.name.split(' ').map(n => n[0]).join('')}
          style={{ backgroundColor: status.color }}
        />
        <View style={styles.driverInfo}>
          <Text style={styles.driverName}>{driver.name}</Text>
          <View style={[styles.badge, { backgroundColor: status.color + '20' }]}>
            <View style={[styles.dot, { backgroundColor: status.color }]} />
            <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Package size={14} color="#6366f1" />
          <Text style={styles.statValue}>{driver.totalDeliveries}</Text>
          <Text style={styles.statLabel}>Livraisons</Text>
        </View>
        <View style={styles.statItem}>
          <Star size={14} color="#f59e0b" />
          <Text style={styles.statValue}>{driver.rating}</Text>
          <Text style={styles.statLabel}>Note</Text>
        </View>
        <View style={styles.statItem}>
          <MapPin size={14} color="#10b981" />
          <Text style={styles.statValue}>{vehicle ? vehicle.plate : '—'}</Text>
          <Text style={styles.statLabel}>Véhicule</Text>
        </View>
      </View>

      <View style={styles.contactRow}>
        <View style={styles.contactItem}>
          <Phone size={14} color="#94a3b8" />
          <Text style={styles.contactText}>{driver.phone}</Text>
        </View>
        <TouchableOpacity style={styles.callBtn}>
          <Phone size={16} color="#fff" />
          <Text style={styles.callBtnText}>Appeler</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export default function DriversScreen() {
  const { drivers } = useFleetStore();
  const [search, setSearch] = React.useState('');

  const filtered = drivers.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  const onlineCount = drivers.filter(d => d.status !== 'offline').length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Chauffeurs</Text>
        <Text style={styles.subtitle}>{onlineCount}/{drivers.length} connectés</Text>
      </View>

      <View style={styles.searchRow}>
        <Searchbar
          placeholder="Rechercher un chauffeur..."
          value={search}
          onChangeText={setSearch}
          style={styles.search}
          inputStyle={{ color: '#f8fafc', fontSize: 14 }}
          placeholderTextColor="#64748b"
          iconColor="#94a3b8"
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <DriverCard driver={item} />}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    padding: spacing.md,
    paddingBottom: 0,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#f8fafc',
  },
  subtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  searchRow: {
    padding: spacing.md,
  },
  search: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    elevation: 0,
    borderWidth: 1,
    borderColor: '#334155',
  },
  list: {
    padding: spacing.md,
    paddingTop: 0,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  driverInfo: {
    marginLeft: 14,
    flex: 1,
  },
  driverName: {
    color: '#f8fafc',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  statValue: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '800',
  },
  statLabel: {
    color: '#64748b',
    fontSize: 10,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactText: {
    color: '#94a3b8',
    fontSize: 13,
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#6366f1',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  callBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
});
