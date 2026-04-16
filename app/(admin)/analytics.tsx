import React from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView, Dimensions } from 'react-native';
import { Text, IconButton, Card, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { theme, spacing } from '../../constants/theme';
import { ArrowLeft, Download, Calendar, TrendingUp, Clock, Map as MapIcon, Fuel } from 'lucide-react-native';
// Note: In a real app, use react-native-chart-kit. Mocking visual with styled components.

const { width } = Dimensions.get('window');

export default function AnalyticsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <IconButton 
          icon={() => <ArrowLeft color="#fff" size={24} />} 
          onPress={() => router.back()} 
        />
        <Text style={styles.title}>Analyses & Rapports</Text>
        <IconButton 
          icon={() => <Download color="#94a3b8" size={20} />} 
          onPress={() => {}} 
        />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.dateSelector}>
          <Calendar size={18} color="#6366f1" />
          <Text style={styles.dateRange}>7 derniers jours: 6 Avr - 12 Avr</Text>
        </View>

        {/* Efficiency Chart Placeholder */}
        <Card style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={styles.chartTitle}>Livraisons par jour</Text>
              <Text style={styles.chartSubtitle}>Moyenne de 24.5 livraisons</Text>
            </View>
            <TrendingUp color="#10b981" size={24} />
          </View>
          
          <View style={styles.mockChart}>
            {/* Visual representation of a bar chart */}
            {[45, 60, 35, 80, 55, 90, 75].map((h, i) => (
              <View key={i} style={styles.chartBarWrapper}>
                <View style={[styles.chartBar, { height: h }]} />
                <Text style={styles.barLabel}>{['L', 'M', 'M', 'J', 'V', 'S', 'D'][i]}</Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Detailed Stats */}
        <View style={styles.grid}>
          <Card style={styles.statBox}>
            <Clock size={20} color="#f59e0b" style={styles.boxIcon} />
            <Text style={styles.boxValue}>28 min</Text>
            <Text style={styles.boxLabel}>Temps moy. / livraison</Text>
          </Card>
          
          <Card style={styles.statBox}>
            <MapIcon size={20} color="#6366f1" style={styles.boxIcon} />
            <Text style={styles.boxValue}>1 245 km</Text>
            <Text style={styles.boxLabel}>Distance totale</Text>
          </Card>
          
          <Card style={styles.statBox}>
            <Fuel size={20} color="#ef4444" style={styles.boxIcon} />
            <Text style={styles.boxValue}>142 L</Text>
            <Text style={styles.boxLabel}>Carburant estimé</Text>
          </Card>
          
          <Card style={styles.statBox}>
            <TrendingUp size={20} color="#10b981" style={styles.boxIcon} />
            <Text style={styles.boxValue}>94.8%</Text>
            <Text style={styles.boxLabel}>Taux de réussite</Text>
          </Card>
        </View>

        {/* Driver Leaderboard */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance Chauffeurs</Text>
          {[
            { name: 'Mohamed Kaci', deliveries: 156, rating: 4.9 },
            { name: 'Ahmed Benali', deliveries: 142, rating: 4.8 },
            { name: 'Youcef Mebarki', deliveries: 128, rating: 4.6 },
          ].map((driver, i) => (
            <View key={i} style={styles.leaderboardRow}>
              <Text style={styles.rank}>{i + 1}</Text>
              <View style={styles.driverMain}>
                <Text style={styles.driverName}>{driver.name}</Text>
                <Text style={styles.driverStats}>{driver.deliveries} livraisons</Text>
              </View>
              <View style={styles.ratingBox}>
                <Text style={styles.ratingText}>⭐ {driver.rating}</Text>
              </View>
            </View>
          ))}
        </View>

        <Button mode="outlined" style={styles.exportBtn} textColor="#94a3b8">
          Générer rapport PDF détaillé
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  scroll: {
    padding: spacing.md,
    paddingBottom: 40,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  dateRange: {
    color: '#f8fafc',
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '600',
  },
  chartCard: {
    backgroundColor: '#1e293b',
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  chartTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
  },
  chartSubtitle: {
    color: '#94a3b8',
    fontSize: 12,
  },
  mockChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    paddingHorizontal: 10,
  },
  chartBarWrapper: {
    alignItems: 'center',
    gap: 8,
  },
  chartBar: {
    width: 14,
    backgroundColor: '#6366f1',
    borderRadius: 4,
  },
  barLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statBox: {
    width: (width - 32 - 12) / 2,
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 16,
  },
  boxIcon: {
    marginBottom: 12,
  },
  boxValue: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: '800',
  },
  boxLabel: {
    color: '#94a3b8',
    fontSize: 12,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 16,
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
  },
  rank: {
    color: '#6366f1',
    fontSize: 18,
    fontWeight: '900',
    width: 30,
  },
  driverMain: {
    flex: 1,
  },
  driverName: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '700',
  },
  driverStats: {
    color: '#94a3b8',
    fontSize: 12,
  },
  ratingBox: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingText: {
    color: '#f59e0b',
    fontSize: 12,
    fontWeight: '700',
  },
  exportBtn: {
    marginTop: 10,
    borderRadius: 12,
    borderColor: '#334155',
  },
});
