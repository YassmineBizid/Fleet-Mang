import { create } from 'zustand';
import { Vehicle, Driver, FleetStats } from '../types';

interface FleetState {
  vehicles: Vehicle[];
  drivers: Driver[];
  stats: FleetStats;
  addVehicle: (vehicle: Vehicle) => void;
  updateVehicle: (id: string, data: Partial<Vehicle>) => void;
  removeVehicle: (id: string) => void;
  updateDriverStatus: (id: string, status: Driver['status']) => void;
  updateDriverLocation: (id: string, lat: number, lng: number) => void;
}

const MOCK_VEHICLES: Vehicle[] = [
  {
    id: 'v1',
    plate: '00123-110-16',
    model: 'Partner',
    brand: 'Peugeot',
    year: 2023,
    status: 'en_route',
    fuelLevel: 72,
    mileage: 45230,
    lastMaintenance: '2026-03-10',
    assignedDriverId: 'd1',
    currentLatitude: 36.7538,
    currentLongitude: 3.0588,
    lastUpdated: '2026-04-13T09:00:00Z',
  },
  {
    id: 'v2',
    plate: '00456-110-16',
    model: 'Kangoo',
    brand: 'Renault',
    year: 2022,
    status: 'active',
    fuelLevel: 55,
    mileage: 62100,
    lastMaintenance: '2026-02-28',
    assignedDriverId: 'd2',
    currentLatitude: 36.7400,
    currentLongitude: 3.0500,
    lastUpdated: '2026-04-13T08:45:00Z',
  },
  {
    id: 'v3',
    plate: '00789-110-16',
    model: 'Berlingo',
    brand: 'Citroën',
    year: 2024,
    status: 'maintenance',
    fuelLevel: 30,
    mileage: 12300,
    lastMaintenance: '2026-04-01',
    lastUpdated: '2026-04-13T07:00:00Z',
  },
  {
    id: 'v4',
    plate: '01012-110-16',
    model: 'Dokker',
    brand: 'Dacia',
    year: 2021,
    status: 'active',
    fuelLevel: 88,
    mileage: 98500,
    lastMaintenance: '2026-03-22',
    assignedDriverId: 'd3',
    currentLatitude: 36.7650,
    currentLongitude: 3.0750,
    lastUpdated: '2026-04-13T09:10:00Z',
  },
];

const MOCK_DRIVERS: Driver[] = [
  {
    id: 'd1',
    name: 'Ahmed Benali',
    email: 'ahmed@facturemap.com',
    phone: '+213 555 123 456',
    licenseNumber: 'DL-2020-1234',
    vehicleId: 'v1',
    status: 'on_delivery',
    totalDeliveries: 342,
    rating: 4.8,
    currentLatitude: 36.7538,
    currentLongitude: 3.0588,
    lastUpdated: '2026-04-13T09:00:00Z',
  },
  {
    id: 'd2',
    name: 'Youcef Mebarki',
    email: 'youcef@facturemap.com',
    phone: '+213 555 234 567',
    licenseNumber: 'DL-2019-5678',
    vehicleId: 'v2',
    status: 'available',
    totalDeliveries: 567,
    rating: 4.6,
    currentLatitude: 36.7400,
    currentLongitude: 3.0500,
    lastUpdated: '2026-04-13T08:45:00Z',
  },
  {
    id: 'd3',
    name: 'Mohamed Kaci',
    email: 'mohamed@facturemap.com',
    phone: '+213 555 345 678',
    licenseNumber: 'DL-2021-9012',
    vehicleId: 'v4',
    status: 'on_delivery',
    totalDeliveries: 189,
    rating: 4.9,
    currentLatitude: 36.7650,
    currentLongitude: 3.0750,
    lastUpdated: '2026-04-13T09:10:00Z',
  },
  {
    id: 'd4',
    name: 'Rachid Hamoudi',
    email: 'rachid@facturemap.com',
    phone: '+213 555 456 789',
    licenseNumber: 'DL-2022-3456',
    status: 'offline',
    totalDeliveries: 78,
    rating: 4.3,
    lastUpdated: '2026-04-12T18:00:00Z',
  },
];

const MOCK_STATS: FleetStats = {
  totalVehicles: 4,
  activeVehicles: 3,
  totalDrivers: 4,
  activeDrivers: 3,
  deliveriesToday: 23,
  totalKmToday: 187,
  avgDeliveryTime: 28,
  onTimeRate: 94.5,
};

export const useFleetStore = create<FleetState>((set) => ({
  vehicles: MOCK_VEHICLES,
  drivers: MOCK_DRIVERS,
  stats: MOCK_STATS,

  addVehicle: (vehicle: Vehicle) =>
    set((state) => ({ vehicles: [...state.vehicles, vehicle] })),

  updateVehicle: (id: string, data: Partial<Vehicle>) =>
    set((state) => ({
      vehicles: state.vehicles.map((v) => (v.id === id ? { ...v, ...data } : v)),
    })),

  removeVehicle: (id: string) =>
    set((state) => ({ vehicles: state.vehicles.filter((v) => v.id !== id) })),

  updateDriverStatus: (id: string, status: Driver['status']) =>
    set((state) => ({
      drivers: state.drivers.map((d) => (d.id === id ? { ...d, status } : d)),
    })),

  updateDriverLocation: (id: string, lat: number, lng: number) =>
    set((state) => ({
      drivers: state.drivers.map((d) =>
        d.id === id
          ? { ...d, currentLatitude: lat, currentLongitude: lng, lastUpdated: new Date().toISOString() }
          : d
      ),
    })),
}));
