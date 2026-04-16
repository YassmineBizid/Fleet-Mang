import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, SafeAreaView, Platform, ScrollView } from 'react-native';
import { Text, Avatar, Searchbar, Chip, Button } from 'react-native-paper';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useRouter } from 'expo-router';
import { useFleetStore } from '../../stores/fleetStore';
import { theme } from '../../constants/theme';
import { ArrowLeft, Filter, Truck, Navigation2, MoreVertical } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const STATUS_COLORS: Record<string, string> = {
  active: '#10b981',
  en_route: '#6366f1',
  maintenance: '#ef4444',
  inactive: '#94a3b8',
};

export default function FleetTrackingScreen() {
  const { vehicles, drivers } = useFleetStore();
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);
  const selectedDriver = drivers.find(d => d.id === selectedVehicle?.assignedDriverId);

  useEffect(() => {
    if (vehicles.length > 0 && mapRef.current && !selectedVehicleId) {
      const coords = vehicles
        .filter(v => v.currentLatitude && v.currentLongitude)
        .map(v => ({
          latitude: v.currentLatitude!,
          longitude: v.currentLongitude!
        }));
      
      if (coords.length > 0) {
        mapRef.current.fitToCoordinates(coords, {
          edgePadding: { top: 100, right: 100, bottom: 300, left: 100 },
          animated: true,
        });
      }
    }
  }, [vehicles]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: 36.7538,
          longitude: 3.0588,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
        customMapStyle={darkMapStyle}
      >
        {vehicles.map((vehicle) => {
          if (!vehicle.currentLatitude || !vehicle.currentLongitude) return null;
          return (
            <Marker
              key={vehicle.id}
              coordinate={{ 
                latitude: vehicle.currentLatitude, 
                longitude: vehicle.currentLongitude 
              }}
              onPress={() => setSelectedVehicleId(vehicle.id)}
            >
              <View style={[
                styles.vehicleMarker, 
                { backgroundColor: STATUS_COLORS[vehicle.status] },
                selectedVehicleId === vehicle.id && styles.selectedMarker
              ]}>
                <Truck color="#fff" size={16} />
              </View>
            </Marker>
          );
        })}
      </MapView>

      <SafeAreaView style={styles.overlay}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft color="#fff" size={24} />
          </TouchableOpacity>
          <Searchbar
            placeholder="Rechercher véhicule..."
            value=""
            style={styles.searchBar}
            inputStyle={styles.searchInput}
            placeholderTextColor="#94a3b8"
            iconColor="#94a3b8"
          />
        </View>

        <View style={styles.filterRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            <Chip style={styles.chip} selected={true} textStyle={styles.chipText}>Tous (4)</Chip>
            <Chip style={styles.chip} textStyle={styles.chipText}>En route (2)</Chip>
            <Chip style={styles.chip} textStyle={styles.chipText}>Maintenance (1)</Chip>
            <Chip style={styles.chip} textStyle={styles.chipText}>À l'arrêt (1)</Chip>
          </ScrollView>
        </View>

        {selectedVehicle && (
          <View style={styles.detailsCard}>
            <View style={styles.detailsHeader}>
              <View style={styles.vehicleInfo}>
                <Text style={styles.plate}>{selectedVehicle.plate}</Text>
                <Text style={styles.model}>{selectedVehicle.brand} {selectedVehicle.model}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[selectedVehicle.status] + '20' }]}>
                <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[selectedVehicle.status] }]} />
                <Text style={[styles.statusText, { color: STATUS_COLORS[selectedVehicle.status] }]}>
                  {selectedVehicle.status.replace('_', ' ').toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={styles.driverRow}>
              <Avatar.Text size={40} label={selectedDriver?.name?.[0] || '?'} style={styles.avatar} />
              <View style={styles.driverInfo}>
                <Text style={styles.driverName}>{selectedDriver?.name || 'Non assigné'}</Text>
                <Text style={styles.driverStatus}>{selectedDriver?.status || 'Hors ligne'}</Text>
              </View>
              <TouchableOpacity style={styles.actionBtn}>
                <Navigation2 color={theme.colors.primary} size={20} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn}>
                <MoreVertical color="#94a3b8" size={20} />
              </TouchableOpacity>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Carburant</Text>
                <Text style={styles.statValue}>{selectedVehicle.fuelLevel}%</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Vitesse</Text>
                <Text style={styles.statValue}>45 km/h</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Aujourd'hui</Text>
                <Text style={styles.statValue}>82 km</Text>
              </View>
            </View>

            <Button 
              mode="contained" 
              onPress={() => router.push('/(admin)/fleet')}
              style={styles.viewBtn}
            >
              Détails complets
            </Button>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const darkMapStyle = [
  { "elementType": "geometry", "stylers": [{ "color": "#212121" }] },
  { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#212121" }] },
  { "featureType": "administrative", "elementType": "geometry", "stylers": [{ "color": "#757575" }] },
  { "featureType": "administrative.country", "elementType": "labels.text.fill", "stylers": [{ "color": "#9e9e9e" }] },
  { "featureType": "road", "elementType": "geometry.fill", "stylers": [{ "color": "#2c2c2c" }] },
  { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#3c3c3c" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#000000" }] }
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    height: 44,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    elevation: 0,
  },
  searchInput: {
    minHeight: 0,
    fontSize: 14,
  },
  filterRow: {
    marginTop: 8,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    borderWidth: 1,
  },
  chipText: {
    color: '#94a3b8',
    fontSize: 12,
  },
  vehicleMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  selectedMarker: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderColor: theme.colors.primary,
  },
  detailsCard: {
    position: 'absolute',
    bottom: 0,
    width: width - 32,
    margin: 16,
    backgroundColor: '#1e293b',
    borderRadius: 24,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  vehicleInfo: {
    flex: 1,
    marginRight: 12,
  },
  plate: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  model: {
    color: '#94a3b8',
    fontSize: 13,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#0f172a',
    padding: 12,
    borderRadius: 16,
  },
  avatar: {
    backgroundColor: '#6366f1',
  },
  driverInfo: {
    flex: 1,
    marginLeft: 12,
  },
  driverName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  driverStatus: {
    color: '#6366f1',
    fontSize: 12,
  },
  actionBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    color: '#64748b',
    fontSize: 11,
    marginBottom: 4,
  },
  statValue: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '700',
  },
  viewBtn: {
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
  },
});
