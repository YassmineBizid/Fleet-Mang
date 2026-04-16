// ========== User & Auth ==========
export type UserRole = 'driver' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  vehicleId?: string;
  createdAt: string;
}

// ========== Invoice ==========
export interface Invoice {
  id: string;
  imageUri: string;
  clientName: string;
  clientAddress: string;
  amount: number;
  currency: string;
  date: string;
  status: 'scanned' | 'pending' | 'delivered' | 'failed';
  latitude?: number;
  longitude?: number;
  scannedAt: string;
  deliveredAt?: string;
}

// ========== Route & Maps ==========
export interface RouteWaypoint {
  id: string;
  invoiceId: string;
  clientName: string;
  address: string;
  latitude: number;
  longitude: number;
  order: number;
  status: 'pending' | 'arrived' | 'delivered';
}

export interface OptimizedRoute {
  id: string;
  waypoints: RouteWaypoint[];
  totalDistance: number; // km
  totalDuration: number; // minutes
  polyline: string; // encoded polyline
  startAddress?: string;
  endAddress?: string;
  startTime?: string;
  selectedInvoiceIds?: string[];
  createdAt: string;
}

// ========== Fleet Management ==========
export type VehicleStatus = 'active' | 'inactive' | 'maintenance' | 'en_route';

export interface Vehicle {
  id: string;
  plate: string;
  model: string;
  brand: string;
  year: number;
  status: VehicleStatus;
  fuelLevel: number; // percentage
  mileage: number; // km
  lastMaintenance: string;
  assignedDriverId?: string;
  currentLatitude?: number;
  currentLongitude?: number;
  lastUpdated: string;
}

export interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  licenseNumber: string;
  vehicleId?: string;
  status: 'available' | 'on_delivery' | 'offline' | 'break';
  totalDeliveries: number;
  rating: number;
  currentLatitude?: number;
  currentLongitude?: number;
  lastUpdated: string;
}

// ========== Analytics ==========
export interface FleetStats {
  totalVehicles: number;
  activeVehicles: number;
  totalDrivers: number;
  activeDrivers: number;
  deliveriesToday: number;
  totalKmToday: number;
  avgDeliveryTime: number; // minutes
  onTimeRate: number; // percentage
}

export interface DailyStats {
  date: string;
  deliveries: number;
  kmDriven: number;
  fuelUsed: number;
}
