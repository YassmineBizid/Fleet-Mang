import React from 'react';
import { View, StyleSheet, FlatList, SafeAreaView, TouchableOpacity, Dimensions } from 'react-native';
import { Text, Searchbar, FAB } from 'react-native-paper';
import { useFleetStore } from '../../stores/fleetStore';
import { Vehicle } from '../../types';
import { theme, spacing } from '../../constants/theme';
import { Truck, Fuel, MapPin, Settings, Plus } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  active: { label: 'Actif', color: '#10b981' },
  en_route: { label: 'En route', color: '#6366f1' },
  maintenance: { label: 'Maintenance', color: '#ef4444' },
  inactive: { label: 'Inactif', color: '#94a3b8' },
};

function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  const status = STATUS_MAP[vehicle.status];
  const driver = useFleetStore.getState().drivers.find(d => d.id === vehicle.assignedDriverId);

  return (
    <TouchableOpacity style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconBox, { backgroundColor: status.color + '20' }]}>
          <Truck size={22} color={status.color} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.plate}>{vehicle.plate}</Text>
          <Text style={styles.model}>{vehicle.brand} {vehicle.model} ({vehicle.year})</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: status.color + '20' }]}>
          <View style={[styles.dot, { backgroundColor: status.color }]} />
          <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>

      <View style={styles.cardDetails}>
        <View style={styles.detailItem}>
          <Fuel size={14} color="#94a3b8" />
          <Text style={styles.detailText}>{vehicle.fuelLevel}%</Text>
          <View style={styles.fuelBarBg}>
            <View style={[
              styles.fuelBarFill, 
              { width: `${vehicle.fuelLevel}%`, backgroundColor: vehicle.fuelLevel > 30 ? '#10b981' : '#ef4444' }
            ]} />
          </View>
        </View>
        <View style={styles.detailItem}>
          <MapPin size={14} color="#94a3b8" />
          <Text style={styles.detailText}>{vehicle.mileage.toLocaleString()} km</Text>
        </View>
      </View>

      {driver && (
        <View style={styles.driverRow}>
          <View style={styles.driverAvatar}>
            <Text style={styles.avatarText}>{driver.name[0]}</Text>
          </View>
          <Text style={styles.driverName}>{driver.name}</Text>
        </View>
      )}

      {!driver && (
        <View style={[styles.driverRow, { borderColor: '#f59e0b30' }]}>
          <Text style={styles.noDriver}>⚠ Aucun chauffeur assigné</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function FleetScreen() {
  const { vehicles } = useFleetStore();
  const [search, setSearch] = React.useState('');

  const filtered = vehicles.filter(v =>
    v.plate.toLowerCase().includes(search.toLowerCase()) ||
    v.brand.toLowerCase().includes(search.toLowerCase()) ||
    v.model.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = vehicles.filter(v => v.status === 'active' || v.status === 'en_route').length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Véhicules</Text>
        <Text style={styles.subtitle}>{activeCount}/{vehicles.length} en service</Text>
      </View>

      <View style={styles.searchRow}>
        <Searchbar
          placeholder="Rechercher..."
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
        renderItem={({ item }) => <VehicleCard vehicle={item} />}
        showsVerticalScrollIndicator={false}
      />

      <FAB
        icon={() => <Plus size={24} color="#fff" />}
        style={styles.fab}
        onPress={() => {}}
        color="#fff"
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
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  cardInfo: {
    flex: 1,
  },
  plate: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '800',
  },
  model: {
    color: '#94a3b8',
    fontSize: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  cardDetails: {
    gap: 10,
    marginBottom: 14,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '600',
    width: 50,
  },
  fuelBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: '#334155',
    borderRadius: 3,
    overflow: 'hidden',
  },
  fuelBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  driverAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 12,
  },
  driverName: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '600',
  },
  noDriver: {
    color: '#f59e0b',
    fontSize: 12,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 90,
    backgroundColor: '#6366f1',
    borderRadius: 16,
  },
});
