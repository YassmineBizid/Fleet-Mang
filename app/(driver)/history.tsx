import React from 'react';
import { View, StyleSheet, FlatList, SafeAreaView, TouchableOpacity } from 'react-native';
import { Text, IconButton, Chip } from 'react-native-paper';
import { useInvoiceStore } from '../../stores/invoiceStore';
import { theme, spacing } from '../../constants/theme';
import { ArrowLeft, CheckCircle2, XCircle, Clock } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function HistoryScreen() {
  const { invoices } = useInvoiceStore();
  const router = useRouter();

  const deliveredInvoices = invoices.filter(inv => inv.status === 'delivered' || inv.status === 'failed');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Historique</Text>
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <CheckCircle2 color="#10b981" size={20} />
          <Text style={styles.summaryValue}>{invoices.filter(i => i.status === 'delivered').length}</Text>
          <Text style={styles.summaryLabel}>Livrées</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryItem}>
          <XCircle color="#ef4444" size={20} />
          <Text style={styles.summaryValue}>{invoices.filter(i => i.status === 'failed').length}</Text>
          <Text style={styles.summaryLabel}>Échouées</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryItem}>
          <Clock color="#f59e0b" size={20} />
          <Text style={styles.summaryValue}>{invoices.filter(i => i.status === 'pending').length}</Text>
          <Text style={styles.summaryLabel}>En attente</Text>
        </View>
      </View>

      <FlatList
        data={deliveredInvoices}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.historyItem}>
            <View style={[styles.statusIcon, { backgroundColor: item.status === 'delivered' ? '#10b98120' : '#ef444420' }]}>
              {item.status === 'delivered'
                ? <CheckCircle2 size={20} color="#10b981" />
                : <XCircle size={20} color="#ef4444" />
              }
            </View>
            <View style={styles.itemContent}>
              <Text style={styles.itemClient}>{item.clientName}</Text>
              <Text style={styles.itemAddress} numberOfLines={1}>{item.clientAddress}</Text>
              <Text style={styles.itemDate}>
                {item.deliveredAt
                  ? new Date(item.deliveredAt).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })
                  : item.date
                }
              </Text>
            </View>
            <Text style={styles.itemAmount}>{item.amount.toLocaleString()} {item.currency}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>Aucun historique pour le moment</Text>
            <Text style={styles.emptySubtext}>Vos livraisons terminées apparaîtront ici</Text>
          </View>
        }
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#f8fafc',
  },
  summary: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    marginHorizontal: spacing.md,
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  summaryItem: {
    alignItems: 'center',
    gap: 6,
  },
  summaryValue: {
    color: '#f8fafc',
    fontSize: 22,
    fontWeight: '800',
  },
  summaryLabel: {
    color: '#94a3b8',
    fontSize: 12,
  },
  divider: {
    width: 1,
    height: 50,
    backgroundColor: '#334155',
  },
  list: {
    padding: spacing.md,
    paddingBottom: 40,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
  },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  itemContent: {
    flex: 1,
  },
  itemClient: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '700',
  },
  itemAddress: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  itemDate: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 4,
  },
  itemAmount: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '800',
  },
  empty: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtext: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 4,
  },
});
