import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Text } from 'react-native-paper';
import { Invoice } from '../../types';
import { CheckCircle2, MapPin } from 'lucide-react-native';
import { theme } from '../../constants/theme';

interface InvoiceCardProps {
  invoice: Invoice;
  onPress: () => void;
  onStatusChange?: (status: Invoice['status']) => void;
  selected?: boolean;
}

const STATUS_CONFIG: Record<Invoice['status'], { label: string; color: string; bg: string }> = {
  scanned: { label: 'Scanné', color: '#6366f1', bg: '#6366f120' },
  pending: { label: 'En attente', color: '#f59e0b', bg: '#f59e0b20' },
  delivered: { label: 'Livré', color: '#10b981', bg: '#10b98120' },
  failed: { label: 'Échoué', color: '#ef4444', bg: '#ef444420' },
};

export default function InvoiceCard({ invoice, onPress, onStatusChange, selected }: InvoiceCardProps) {
  const statusCfg = STATUS_CONFIG[invoice.status];

  return (
    <TouchableOpacity 
      style={[
        styles.card, 
        selected && styles.selectedCard
      ]} 
      onPress={onPress} 
      activeOpacity={0.7}
    >
      <View style={styles.row}>
        <View style={styles.leftBar}>
          <View style={[styles.statusDot, { backgroundColor: statusCfg.color }]} />
        </View>
        <View style={styles.content}>
          <View style={styles.topRow}>
            <Text style={styles.clientName} numberOfLines={1}>{invoice.clientName}</Text>
            <View style={styles.topRight}>
              <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg, marginRight: 8 }]}>
                <Text style={[styles.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
              </View>
              {selected && (
                <CheckCircle2 size={20} color={theme.colors.primary} />
              )}
            </View>
          </View>
          <Text style={styles.address} numberOfLines={1}>
            <MapPin size={14} color="#94a3b8" /> {invoice.clientAddress}
          </Text>
          <View style={styles.bottomRow}>
            <Text style={styles.amount}>
              {invoice.amount.toLocaleString()} {invoice.currency}
            </Text>
            <Text style={styles.date}>{invoice.date}</Text>
          </View>
        </View>
      </View>
      {invoice.status === 'pending' && onStatusChange && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#10b98120' }]}
            onPress={(e) => {
              e.stopPropagation();
              onStatusChange('delivered');
            }}
          >
            <Text style={{ color: '#10b981', fontWeight: '700', fontSize: 13 }}>✓ Livré</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#ef444420' }]}
            onPress={(e) => {
              e.stopPropagation();
              onStatusChange('failed');
            }}
          >
            <Text style={{ color: '#ef4444', fontWeight: '700', fontSize: 13 }}>✗ Échoué</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  selectedCard: {
    borderColor: '#6366f1',
    backgroundColor: '#1e293b',
  },
  row: {
    flexDirection: 'row',
    padding: 16,
  },
  leftBar: {
    width: 4,
    marginRight: 12,
    justifyContent: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  content: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  topRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clientName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f8fafc',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  address: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 8,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#6366f1',
  },
  date: {
    fontSize: 12,
    color: '#64748b',
  },
  actions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
});
