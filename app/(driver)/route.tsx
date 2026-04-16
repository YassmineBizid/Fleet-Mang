import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Callout, Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import polyline from '@mapbox/polyline';
import { Button, ActivityIndicator, Text } from 'react-native-paper';
import {
  ChevronDown,
  ChevronUp,
  Clock,
  Flag,
  Home,
  MapPin,
  Navigation,
  Package,
  Truck,
} from 'lucide-react-native';
import { useInvoiceStore } from '../../stores/invoiceStore';
import { useRouteStore } from '../../stores/routeStore';
import { theme } from '../../constants/theme';

const { height } = Dimensions.get('window');
const DELIVERY_TIME_MIN = 20;
const DEFAULT_START_TIME = '08:00';

const STOP_COLORS = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b',
  '#10b981', '#06b6d4', '#f97316', '#6366f1',
];

type RouteCoord = { latitude: number; longitude: number };

interface StopInfo {
  index: number;
  waypoint: {
    id: string;
    clientName: string;
    address: string;
    latitude: number;
    longitude: number;
  };
  estimatedArrival: string;
  estimatedDeparture: string;
  cumulativeDist: number;
}

function addMinutes(timeStr: string, minutes: number): string {
  const [h, m] = timeStr.split(':').map(Number);
  const safeHours = Number.isFinite(h) ? h : 8;
  const safeMinutes = Number.isFinite(m) ? m : 0;
  const total = safeHours * 60 + safeMinutes + Math.round(minutes);
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}

function isValidTime(value: string): boolean {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
}

export default function RouteScreen() {
  const mapRef = useRef<MapView>(null);
  const { invoices } = useInvoiceStore();
  const { currentRoute, isOptimizing, optimizeRoute, clearRoute } = useRouteStore();

  const [startAddress, setStartAddress] = useState(currentRoute?.startAddress || '');
  const [endAddress, setEndAddress] = useState(currentRoute?.endAddress || '');
  const [startTime, setStartTime] = useState(currentRoute?.startTime || DEFAULT_START_TIME);
  const [activeStop, setActiveStop] = useState<number | null>(null);
  const [panelExpanded, setPanelExpanded] = useState(true);

  useEffect(() => {
    setStartAddress(currentRoute?.startAddress || '');
    setEndAddress(currentRoute?.endAddress || '');
    setStartTime(currentRoute?.startTime || DEFAULT_START_TIME);
  }, [currentRoute]);

  const routableInvoices = useMemo(
    () => invoices.filter((inv) => typeof inv.latitude === 'number' && typeof inv.longitude === 'number'),
    [invoices]
  );

  const missingGpsInvoices = useMemo(
    () => invoices.filter((inv) => typeof inv.latitude !== 'number' || typeof inv.longitude !== 'number'),
    [invoices]
  );

  const routeCoords = useMemo<RouteCoord[]>(() => {
    if (!currentRoute?.polyline) return [];
    return polyline
      .decode(currentRoute.polyline)
      .map(([latitude, longitude]: [number, number]) => ({ latitude, longitude }));
  }, [currentRoute]);

  const startCoord = routeCoords[0] || null;
  const endCoord = routeCoords.length > 0 ? routeCoords[routeCoords.length - 1] : null;
  const lastWaypoint = currentRoute && currentRoute.waypoints.length > 0
    ? currentRoute.waypoints[currentRoute.waypoints.length - 1]
    : null;

  const stopInfos = useMemo<StopInfo[]>(() => {
    if (!currentRoute) return [];
    const totalDrivingMin = currentRoute.totalDuration - currentRoute.waypoints.length * DELIVERY_TIME_MIN;
    const drivingPerLeg = currentRoute.waypoints.length > 0 ? Math.max(totalDrivingMin, 0) / currentRoute.waypoints.length : 0;
    const distPerLeg = currentRoute.waypoints.length > 0 ? currentRoute.totalDistance / currentRoute.waypoints.length : 0;

    let currentTime = currentRoute.startTime || startTime || DEFAULT_START_TIME;
    let cumulativeDist = 0;

    return currentRoute.waypoints.map((waypoint, index) => {
      currentTime = addMinutes(currentTime, drivingPerLeg);
      const estimatedArrival = currentTime;
      currentTime = addMinutes(currentTime, DELIVERY_TIME_MIN);
      const estimatedDeparture = currentTime;
      cumulativeDist += distPerLeg;

      return {
        index,
        waypoint,
        estimatedArrival,
        estimatedDeparture,
        cumulativeDist: Math.round(cumulativeDist * 10) / 10,
      };
    });
  }, [currentRoute, startTime]);

  const estimatedEndTime = useMemo(() => {
    if (!currentRoute) return null;
    return addMinutes(currentRoute.startTime || startTime || DEFAULT_START_TIME, currentRoute.totalDuration);
  }, [currentRoute, startTime]);

  useEffect(() => {
    if (!mapRef.current || routeCoords.length === 0) return;

    mapRef.current.fitToCoordinates(routeCoords, {
      edgePadding: { top: 80, right: 40, bottom: 320, left: 40 },
      animated: true,
    });
  }, [routeCoords]);

  const handleOptimize = async () => {
    if (!isValidTime(startTime)) {
      Alert.alert('Heure invalide', "Utilisez le format HH:MM pour l'heure de depart.");
      return;
    }

    if (routableInvoices.length === 0) {
      Alert.alert('Aucune adresse geolocalisee', "Scannez d'abord des factures avec des coordonnees GPS.");
      return;
    }

    const invoiceIds = currentRoute?.selectedInvoiceIds?.length
      ? currentRoute.selectedInvoiceIds
      : routableInvoices.map((invoice) => invoice.id);

    try {
      await optimizeRoute(invoiceIds, {
        startAddress: startAddress.trim() || undefined,
        endAddress: endAddress.trim() || undefined,
        startTime,
      });
      setActiveStop(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible de calculer la tournee.";
      Alert.alert('Optimisation impossible', message);
    }
  };

  const focusStop = (stop: StopInfo) => {
    setActiveStop(stop.index);
    mapRef.current?.animateToRegion(
      {
        latitude: stop.waypoint.latitude,
        longitude: stop.waypoint.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      },
      500
    );
  };

  return (
    <View style={styles.root}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: 36.8065,
          longitude: 10.1815,
          latitudeDelta: 0.8,
          longitudeDelta: 0.8,
        }}
        showsUserLocation
        showsCompass
      >
        {routeCoords.length > 0 && (
          <Polyline coordinates={routeCoords} strokeWidth={5} strokeColor={theme.colors.primary} />
        )}

        {startCoord && (
          <Marker coordinate={startCoord} pinColor="#22c55e">
            <Callout>
              <View style={styles.callout}>
                <Text style={styles.calloutTitle}>Point de depart</Text>
                <Text style={styles.calloutText}>{currentRoute?.startAddress || 'Position actuelle du chauffeur'}</Text>
              </View>
            </Callout>
          </Marker>
        )}

        {endCoord && (
          <Marker coordinate={endCoord} pinColor="#ef4444">
            <Callout>
              <View style={styles.callout}>
                <Text style={styles.calloutTitle}>Point d'arrivee</Text>
                <Text style={styles.calloutText}>
                  {currentRoute?.endAddress || lastWaypoint?.address || 'Derniere livraison'}
                </Text>
              </View>
            </Callout>
          </Marker>
        )}

        {stopInfos.map((stop, index) => (
          <Marker
            key={stop.waypoint.id}
            coordinate={{ latitude: stop.waypoint.latitude, longitude: stop.waypoint.longitude }}
            onPress={() => setActiveStop(index)}
          >
            <View style={[styles.markerWrap, activeStop === index && styles.markerWrapActive]}>
              <View
                style={[
                  styles.markerBubble,
                  { backgroundColor: STOP_COLORS[index % STOP_COLORS.length] },
                ]}
              >
                <Text style={styles.markerText}>{index + 1}</Text>
              </View>
              <View
                style={[
                  styles.markerTail,
                  { borderTopColor: STOP_COLORS[index % STOP_COLORS.length] },
                ]}
              />
            </View>
            <Callout tooltip>
              <View style={styles.callout}>
                <Text style={styles.calloutTitle}>{stop.waypoint.clientName}</Text>
                <Text style={styles.calloutText}>{stop.waypoint.address}</Text>
                <Text style={styles.calloutMeta}>Arrivee estimee: {stop.estimatedArrival}</Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      <View style={styles.panel}>
        {!currentRoute ? (
          <View style={styles.formSection}>
            <Text style={styles.panelTitle}>Construire une tournee</Text>
            <Text style={styles.panelSubtitle}>
              Scannez des factures puis indiquez votre point de depart et votre point d'arrivee.
            </Text>

            <View style={styles.inputRow}>
              <Home size={16} color="#64748b" style={styles.inputIcon} />
              <TextInput
                placeholder="Point de depart"
                placeholderTextColor="#94a3b8"
                value={startAddress}
                onChangeText={setStartAddress}
                style={styles.input}
              />
            </View>

            <View style={styles.inputRow}>
              <Flag size={16} color="#64748b" style={styles.inputIcon} />
              <TextInput
                placeholder="Point d'arrivee (optionnel)"
                placeholderTextColor="#94a3b8"
                value={endAddress}
                onChangeText={setEndAddress}
                style={styles.input}
              />
            </View>

            <View style={styles.inputRow}>
              <Clock size={16} color="#64748b" style={styles.inputIcon} />
              <TextInput
                placeholder="Heure de depart (HH:MM)"
                placeholderTextColor="#94a3b8"
                keyboardType="numbers-and-punctuation"
                maxLength={5}
                value={startTime}
                onChangeText={setStartTime}
                style={styles.input}
              />
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Package size={16} color={theme.colors.primary} />
                <Text style={styles.infoText}>{routableInvoices.length} adresses pretes a optimiser</Text>
              </View>
              {missingGpsInvoices.length > 0 && (
                <View style={styles.infoRow}>
                  <MapPin size={16} color="#f59e0b" />
                  <Text style={styles.infoText}>
                    {missingGpsInvoices.length} factures sans coordonnees seront ignorees
                  </Text>
                </View>
              )}
            </View>

            <Button
              mode="contained"
              onPress={handleOptimize}
              disabled={isOptimizing || routableInvoices.length === 0}
              style={styles.primaryButton}
              contentStyle={styles.primaryButtonContent}
              icon={() => <Truck size={18} color="#fff" />}
            >
              {isOptimizing ? 'Optimisation...' : 'Calculer le trajet optimal'}
            </Button>

            {isOptimizing && <ActivityIndicator color={theme.colors.primary} style={styles.loader} />}
          </View>
        ) : (
          <View style={styles.resultSection}>
            <View style={styles.summaryBar}>
              <StatChip icon={<MapPin size={14} color={theme.colors.primary} />} value={`${currentRoute.totalDistance} km`} label="Distance" />
              <StatChip icon={<Clock size={14} color={theme.colors.primary} />} value={formatDuration(currentRoute.totalDuration)} label="Duree" />
              <StatChip icon={<Package size={14} color={theme.colors.primary} />} value={`${currentRoute.waypoints.length}`} label="Arrets" />
              <StatChip icon={<Flag size={14} color={theme.colors.primary} />} value={estimatedEndTime || '--:--'} label="Fin" />
            </View>

            <View style={styles.routeMetaCard}>
              <View style={styles.routeMetaRow}>
                <Navigation size={15} color="#22c55e" />
                <Text style={styles.routeMetaText}>{currentRoute.startAddress || 'Position actuelle du chauffeur'}</Text>
              </View>
              <View style={styles.routeMetaRow}>
                <Flag size={15} color="#ef4444" />
                <Text style={styles.routeMetaText}>
                  {currentRoute.endAddress || lastWaypoint?.address || 'Derniere livraison'}
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.collapseRow} onPress={() => setPanelExpanded((value) => !value)}>
              <Text style={styles.collapseLabel}>Timeline des livraisons</Text>
              {panelExpanded ? <ChevronDown size={18} color="#64748b" /> : <ChevronUp size={18} color="#64748b" />}
            </TouchableOpacity>

            {panelExpanded && (
              <ScrollView style={styles.timeline} showsVerticalScrollIndicator={false}>
                <TimelineNode
                  color="#22c55e"
                  icon={<Home size={14} color="#fff" />}
                  time={currentRoute.startTime || DEFAULT_START_TIME}
                  title="Depart"
                  subtitle={currentRoute.startAddress || 'Position actuelle du chauffeur'}
                  isFirst
                  isActive={false}
                />

                {stopInfos.map((stop, index) => (
                  <TouchableOpacity key={stop.waypoint.id} onPress={() => focusStop(stop)} activeOpacity={0.75}>
                    <TimelineNode
                      color={STOP_COLORS[index % STOP_COLORS.length]}
                      icon={<Text style={styles.nodeNum}>{index + 1}</Text>}
                      time={stop.estimatedArrival}
                      title={stop.waypoint.clientName}
                      subtitle={stop.waypoint.address}
                      duration={`${DELIVERY_TIME_MIN} min livraison · depart ${stop.estimatedDeparture}`}
                      cumDist={`${stop.cumulativeDist} km parcourus`}
                      isActive={activeStop === index}
                      isLast={index === stopInfos.length - 1 && !currentRoute.endAddress}
                    />
                  </TouchableOpacity>
                ))}

                <TimelineNode
                  color="#ef4444"
                  icon={<Flag size={14} color="#fff" />}
                  time={estimatedEndTime || '--:--'}
                  title="Arrivee"
                  subtitle={currentRoute.endAddress || lastWaypoint?.address || 'Derniere livraison'}
                  isLast
                  isActive={false}
                />

                <View style={styles.timelineSpacer} />
              </ScrollView>
            )}

            <View style={styles.resultActions}>
              <Button mode="outlined" onPress={clearRoute} textColor="#94a3b8" style={styles.secondaryButton}>
                Nouvelle tournee
              </Button>
              <Button
                mode="contained"
                onPress={handleOptimize}
                loading={isOptimizing}
                disabled={isOptimizing}
                style={styles.primaryButton}
              >
                Recalculer
              </Button>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

function StatChip({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <View style={statStyles.chip}>
      {icon}
      <Text style={statStyles.value}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

interface TimelineNodeProps {
  color: string;
  icon: React.ReactNode;
  time: string;
  title: string;
  subtitle: string;
  duration?: string;
  cumDist?: string;
  isFirst?: boolean;
  isLast?: boolean;
  isActive: boolean;
}

function TimelineNode({
  color, icon, time, title, subtitle, duration, cumDist, isFirst, isLast, isActive,
}: TimelineNodeProps) {
  return (
    <View style={[timelineStyles.row, isActive && timelineStyles.rowActive]}>
      <Text style={timelineStyles.time}>{time}</Text>
      <View style={timelineStyles.dotColumn}>
        {!isFirst && <View style={[timelineStyles.lineTop, { backgroundColor: `${color}55` }]} />}
        <View style={[timelineStyles.dot, { backgroundColor: color }]}>{icon}</View>
        {!isLast && <View style={[timelineStyles.lineBottom, { backgroundColor: `${color}55` }]} />}
      </View>
      <View style={timelineStyles.content}>
        <Text style={timelineStyles.title} numberOfLines={1}>{title}</Text>
        <Text style={timelineStyles.subtitle} numberOfLines={1}>{subtitle}</Text>
        {duration && <Text style={timelineStyles.meta}>{duration}</Text>}
        {cumDist && <Text style={timelineStyles.distance}>{cumDist}</Text>}
      </View>
    </View>
  );
}

const statStyles = StyleSheet.create({
  chip: { alignItems: 'center', flex: 1 },
  value: { color: '#f1f5f9', fontSize: 14, fontWeight: '800', marginTop: 3 },
  label: { color: '#64748b', fontSize: 10, fontWeight: '600', textTransform: 'uppercase' },
});

const timelineStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingHorizontal: 4,
    borderRadius: 10,
    paddingVertical: 4,
  },
  rowActive: { backgroundColor: 'rgba(59,130,246,0.08)' },
  time: {
    width: 50,
    color: '#64748b',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'right',
    paddingTop: 12,
    marginRight: 6,
  },
  dotColumn: {
    alignItems: 'center',
    width: 32,
    marginRight: 10,
  },
  lineTop: { flex: 1, width: 2, minHeight: 8 },
  lineBottom: { flex: 1, width: 2, minHeight: 16 },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  content: { flex: 1, paddingVertical: 6 },
  title: { color: '#f1f5f9', fontSize: 14, fontWeight: '700' },
  subtitle: { color: '#94a3b8', fontSize: 12, marginTop: 1 },
  meta: { color: '#64748b', fontSize: 11, marginTop: 3 },
  distance: { color: '#475569', fontSize: 10, marginTop: 2 },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0f172a' },
  map: { flex: 1 },
  panel: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 14,
    paddingHorizontal: 16,
    maxHeight: height * 0.6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  formSection: { paddingBottom: 24 },
  panelTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 6, textAlign: 'center' },
  panelSubtitle: { color: '#94a3b8', fontSize: 13, marginBottom: 16, textAlign: 'center' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    marginBottom: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  inputIcon: { marginRight: 8 },
  input: {
    flex: 1,
    color: '#f1f5f9',
    fontSize: 14,
    paddingVertical: 12,
  },
  infoCard: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 14,
    marginVertical: 8,
    gap: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    color: '#cbd5e1',
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
  },
  primaryButton: {
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
  },
  primaryButtonContent: {
    paddingVertical: 6,
  },
  secondaryButton: {
    borderRadius: 14,
    borderColor: '#334155',
  },
  loader: {
    marginTop: 12,
  },
  resultSection: {
    flex: 1,
    paddingBottom: 16,
  },
  summaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  routeMetaCard: {
    backgroundColor: '#111827',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    gap: 10,
  },
  routeMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeMetaText: {
    color: '#e2e8f0',
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
  },
  collapseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  collapseLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  timeline: { flex: 1 },
  timelineSpacer: { height: 20 },
  resultActions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  nodeNum: { color: '#fff', fontSize: 12, fontWeight: '900' },
  markerWrap: { alignItems: 'center' },
  markerWrapActive: { transform: [{ scale: 1.15 }] },
  markerBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  markerText: { color: '#fff', fontSize: 13, fontWeight: '900' },
  markerTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
  callout: {
    backgroundColor: '#1e293b',
    padding: 12,
    borderRadius: 12,
    minWidth: 180,
  },
  calloutTitle: { color: '#f1f5f9', fontSize: 14, fontWeight: '800', marginBottom: 3 },
  calloutText: { color: '#94a3b8', fontSize: 12 },
  calloutMeta: { color: '#22c55e', fontSize: 12, marginTop: 4, fontWeight: '600' },
});
