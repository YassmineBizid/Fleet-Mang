import React from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { Text, Avatar, IconButton } from 'react-native-paper';
import { useAuthStore } from '../../stores/authStore';
import { useInvoiceStore } from '../../stores/invoiceStore';
import { theme, spacing } from '../../constants/theme';
import StatCard from '../../components/ui/StatCard';
import MenuCard from '../../components/ui/MenuCard';
import { useRouter } from 'expo-router';
import { LogOut, Bell } from 'lucide-react-native';

export default function DriverDashboard() {
  const { user, logout } = useAuthStore();
  const { invoices } = useInvoiceStore();
  const router = useRouter();

  const pendingInvoices = invoices.filter(inv => inv.status === 'pending' || inv.status === 'scanned').length;
  const deliveredToday = invoices.filter(inv => inv.status === 'delivered').length;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcome}>Bonjour,</Text>
            <Text style={styles.userName}>{user?.name}</Text>
          </View>
          <View style={styles.headerActions}>
            <IconButton icon={() => <Bell size={24} color="#94a3b8" />} onPress={() => {}} />
            <TouchableOpacity onPress={logout}>
              <Avatar.Text size={40} label={user?.name?.[0] || 'U'} style={styles.avatar} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <StatCard
            title="À livrer"
            value={pendingInvoices}
            icon="📦"
            color={theme.colors.primary}
          />
          <StatCard
            title="Complétées"
            value={deliveredToday}
            icon="✅"
            color={theme.colors.secondary}
          />
        </View>

        {/* Menu Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Opérations</Text>
          
          <MenuCard
            title="Scanner Facture"
            subtitle="Capturez une nouvelle facture"
            icon="📷"
            color="#6366f1"
            onPress={() => router.push('/(driver)/scan')}
          />
          
          <MenuCard
            title="Optimiser Trajet"
            subtitle="Calculer le chemin le plus court"
            icon="🗺️"
            color="#10b981"
            onPress={() => router.push('/(driver)/route')}
            badge={pendingInvoices > 0 ? pendingInvoices : undefined}
          />
          
          <MenuCard
            title="Mes Factures"
            subtitle="Gérer la liste des colis"
            icon="📄"
            color="#f59e0b"
            onPress={() => router.push('/(driver)/invoices')}
          />
          
          <MenuCard
            title="Historique"
            subtitle="Voir vos livraisons passées"
            icon="🕒"
            color="#94a3b8"
            onPress={() => router.push('/(driver)/history')}
          />
        </View>

        {/* Vehicle Status */}
        <View style={styles.vehicleCard}>
          <View style={styles.vehicleHeader}>
            <Text style={styles.vehicleTitle}>Mon Véhicule</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>EN ROUTE</Text>
            </View>
          </View>
          <Text style={styles.vehicleInfo}>Peugeot Partner — 00123-110-16</Text>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Carburant</Text>
            <Text style={styles.progressValue}>72%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: '72%' }]} />
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
    fontSize: 24,
    fontWeight: '800',
    color: '#f8fafc',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: '#6366f1',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  vehicleCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  vehicleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  vehicleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
  },
  statusBadge: {
    backgroundColor: '#10b98120',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10b981',
  },
  vehicleInfo: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 16,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    color: '#94a3b8',
  },
  progressValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f8fafc',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#334155',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#6366f1',
  },
});
