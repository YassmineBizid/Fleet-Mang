import React from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView, Dimensions } from 'react-native';
import { Text, Avatar, IconButton } from 'react-native-paper';
import { useAuthStore } from '../../stores/authStore';
import { useFleetStore } from '../../stores/fleetStore';
import { theme, spacing } from '../../constants/theme';
import StatCard from '../../components/ui/StatCard';
import MenuCard from '../../components/ui/MenuCard';
import { useRouter } from 'expo-router';
import { Bell, Search } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function AdminDashboard() {
  const { user, logout } = useAuthStore();
  const { stats } = useFleetStore();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcome}>Gestion de Flotte</Text>
            <Text style={styles.userName}>Karim Mansouri</Text>
          </View>
          <View style={styles.headerActions}>
            <IconButton icon={() => <Search size={22} color="#94a3b8" />} onPress={() => {}} />
            <IconButton icon={() => <Bell size={22} color="#94a3b8" />} onPress={() => {}} />
          </View>
        </View>

        {/* Global KPIs */}
        <View style={styles.statsGrid}>
          <StatCard
            title="Livraisons"
            value={stats.deliveriesToday}
            subtitle="Aujourd'hui"
            icon="📦"
            color="#6366f1"
            trend={{ value: 12, isPositive: true }}
          />
          <StatCard
            title="Distance"
            value={`${stats.totalKmToday} km`}
            subtitle="Parcourus"
            icon="🛣️"
            color="#10b981"
            trend={{ value: 5, isPositive: true }}
          />
          <StatCard
            title="Véhicules"
            value={`${stats.activeVehicles}/${stats.totalVehicles}`}
            subtitle="En service"
            icon="🚛"
            color="#f59e0b"
          />
          <StatCard
            title="Taux"
            value={`${stats.onTimeRate}%`}
            subtitle="Ponctualité"
            icon="⏱️"
            color="#8b5cf6"
            trend={{ value: 2, isPositive: true }}
          />
        </View>

        {/* Management Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gestion Opérationnelle</Text>
          
          <MenuCard
            title="Suivi Temps Réel"
            subtitle="Voir la position de tous les chauffeurs"
            icon="🎯"
            color="#6366f1"
            onPress={() => router.push('/(admin)/tracking')}
          />
          
          <MenuCard
            title="Gestion des Véhicules"
            subtitle="Maintenance, inventaire, assignation"
            icon="🚛"
            color="#10b981"
            onPress={() => router.push('/(admin)/fleet')}
          />
          
          <MenuCard
            title="Équipe Chauffeurs"
            subtitle="Performance et plannings"
            icon="👥"
            color="#f59e0b"
            onPress={() => router.push('/(admin)/drivers')}
          />
          
          <MenuCard
            title="Rapports & Analytics"
            subtitle="Statistiques détaillées de la flotte"
            icon="📊"
            color="#8b5cf6"
            onPress={() => router.push('/(admin)/analytics')}
          />
        </View>

        {/* Active Alerts */}
        <View style={styles.alertSection}>
          <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>Alertes Critiques</Text>
          <View style={styles.alertCard}>
            <View style={styles.alertIconBg}>
              <Text>⚠️</Text>
            </View>
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>Maintenance Requise</Text>
              <Text style={styles.alertDesc}>Peugeot Partner (00789-110-16) - Freins</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scroll: {
    padding: spacing.md,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
    marginTop: spacing.sm,
  },
  welcome: {
    fontSize: 14,
    color: '#94a3b8',
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f8fafc',
  },
  headerActions: {
    flexDirection: 'row',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: spacing.md,
  },
  alertSection: {
    marginBottom: 20,
  },
  alertCard: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ef444450',
    alignItems: 'center',
  },
  alertIconBg: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#ef444420',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f8fafc',
  },
  alertDesc: {
    fontSize: 12,
    color: '#94a3b8',
  },
});
