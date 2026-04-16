import { create } from 'zustand';
import { OptimizedRoute, RouteWaypoint } from '../types';
import axios from 'axios';
import * as Location from 'expo-location';
import { API_CONFIG } from '../constants/config';
import { useInvoiceStore } from './invoiceStore';

interface RouteState {
  currentRoute: OptimizedRoute | null;
  isOptimizing: boolean;
  optimizeRoute: (invoiceIds: string[], options?: { startAddress?: string, endAddress?: string, startTime?: string }) => Promise<void>;
  updateWaypointStatus: (waypointId: string, status: RouteWaypoint['status']) => void;
  clearRoute: () => void;
}

export const useRouteStore = create<RouteState>((set) => ({
  currentRoute: null,
  isOptimizing: false,

  optimizeRoute: async (
    invoiceIds: string[], 
    options?: { startAddress?: string, endAddress?: string, startTime?: string }
  ) => {
    set({ isOptimizing: true });
    
    try {
      // 1. Get current location for fallback starting point
      const { status } = await Location.requestForegroundPermissionsAsync();
      let startLat = 36.8065;
      let startLon = 10.1815;

      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        startLat = location.coords.latitude;
        startLon = location.coords.longitude;
      }

      // 2. Prepare waypoints from invoice store
      const invoices = useInvoiceStore.getState().invoices;
      const selectedInvoices = invoices.filter(inv => invoiceIds.includes(inv.id));
      const routableInvoices = selectedInvoices.filter(
        (inv) => typeof inv.latitude === 'number' && typeof inv.longitude === 'number'
      );

      if (routableInvoices.length === 0) {
        throw new Error('Aucune facture geolocalisee disponible pour calculer la tournee.');
      }
      
      const waypoints = routableInvoices.map(inv => ({
        id: inv.id,
        latitude: inv.latitude,
        longitude: inv.longitude,
        address: inv.clientAddress,
        client_name: inv.clientName
      }));

      // 3. Call Real Backend (OR-Tools + OSRM)
      const payload = {
        driver_id: 'driver-1',
        start_latitude: startLat,
        start_longitude: startLon,
        waypoints: waypoints,
        start_address: options?.startAddress,
        end_address: options?.endAddress,
        start_time: options?.startTime
      };

      const response = await axios.post(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.OPTIMIZE}`, payload);

      const data = response.data;

      const optimizedRoute: OptimizedRoute = {
        id: data.route_id,
        waypoints: data.optimized_waypoints.map((wp: any, index: number) => ({
          id: wp.id,
          invoiceId: wp.id,
          clientName: wp.client_name,
          address: wp.address,
          latitude: wp.latitude,
          longitude: wp.longitude,
          order: index + 1,
          status: 'pending',
        })),
        totalDistance: data.total_distance_km,
        totalDuration: data.total_duration_min,
        polyline: data.polyline,
        startAddress: options?.startAddress,
        endAddress: options?.endAddress,
        startTime: options?.startTime,
        selectedInvoiceIds: routableInvoices.map((inv) => inv.id),
        createdAt: new Date().toISOString(),
      };

      set({ currentRoute: optimizedRoute, isOptimizing: false });
    } catch (error) {
      console.error('Optimization Error:', error);
      set({ isOptimizing: false });
      throw error;
    }
  },

  updateWaypointStatus: (waypointId: string, status: RouteWaypoint['status']) =>
    set((state) => ({
      currentRoute: state.currentRoute
        ? {
            ...state.currentRoute,
            waypoints: state.currentRoute.waypoints.map((wp) =>
              wp.id === waypointId ? { ...wp, status } : wp
            ),
          }
        : null,
    })),

  clearRoute: () => set({ currentRoute: null }),
}));
