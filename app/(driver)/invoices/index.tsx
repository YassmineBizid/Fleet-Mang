import React from 'react';
import { View, StyleSheet, FlatList, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text, Searchbar, Button, IconButton, Portal, Modal, TextInput } from 'react-native-paper';
import { useInvoiceStore } from '../../../stores/invoiceStore';
import { useRouteStore } from '../../../stores/routeStore';
import { theme, spacing } from '../../../constants/theme';
import InvoiceCard from '../../../components/ui/InvoiceCard';
import { useRouter } from 'expo-router';
import { ArrowLeft, Filter, Map, Clock, MapPin, Navigation } from 'lucide-react-native';

export default function InvoiceListScreen() {
  const { invoices, updateInvoiceStatus } = useInvoiceStore();
  const { optimizeRoute, isOptimizing } = useRouteStore();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [configVisible, setConfigVisible] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  
  // Configuration State
  const [startAddress, setStartAddress] = React.useState('');
  const [endAddress, setEndAddress] = React.useState('');
  const [startTime, setStartTime] = React.useState('08:00');
  
  const router = useRouter();

  const filteredInvoices = invoices.filter(inv => 
    inv.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.clientAddress.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingInvoices = invoices.filter(inv => inv.status === 'pending' || inv.status === 'scanned');

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleOptimizePrompt = () => {
    if (selectedIds.length === 0) {
      // Si rien n'est sélectionné, on propose de tout prendre ou on avertit
      const ids = pendingInvoices.map(inv => inv.id);
      if (ids.length === 0) return;
      setSelectedIds(ids); 
    }
    
    // Si l'heure n'a pas été modifiée, la pré-remplir avec l'heure actuelle
    if (startTime === '08:00') {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      setStartTime(`${hours}:${mins}`);
    }
    
    setConfigVisible(true);
  };

  const confirmOptimize = async () => {
    if (selectedIds.length === 0) return;
    
    setConfigVisible(false);
    await optimizeRoute(selectedIds, {
      startAddress: startAddress.trim() !== '' ? startAddress : undefined,
      endAddress: endAddress.trim() !== '' ? endAddress : undefined,
      startTime: startTime
    });
    router.push('/(driver)/route');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* ... header and search bar ... */}
      <View style={styles.header}>
        <IconButton 
          icon={() => <ArrowLeft color="#fff" size={24} />} 
          onPress={() => router.back()} 
        />
        <Text style={styles.title}>Mes Factures</Text>
        <IconButton 
          icon={() => <Filter color="#94a3b8" size={20} />} 
          onPress={() => {}} 
        />
      </View>

      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Rechercher un client..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
          placeholderTextColor="#94a3b8"
          iconColor="#94a3b8"
        />
      </View>

      <FlatList
        data={filteredInvoices}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <InvoiceCard 
            invoice={item} 
            selected={selectedIds.includes(item.id)}
            onPress={() => toggleSelection(item.id)} 
            onStatusChange={(status) => updateInvoiceStatus(item.id, status)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Aucune facture trouvée</Text>
          </View>
        }
      />

      {pendingInvoices.length > 0 && (
        <View style={styles.footer}>
          <Button
            mode="contained"
            onPress={handleOptimizePrompt}
            loading={isOptimizing}
            disabled={isOptimizing}
            style={styles.optimizeBtn}
            contentStyle={styles.optimizeBtnContent}
            icon={() => <Map size={20} color="#fff" />}
          >
            {selectedIds.length > 0 
              ? `Optimiser ${selectedIds.length} factures` 
              : `Optimiser tout (${pendingInvoices.length})`}
          </Button>
        </View>
      )}

      {/* Configuration Modal */}
      <Portal>
        <Modal 
          visible={configVisible} 
          onDismiss={() => setConfigVisible(false)}
          contentContainerStyle={styles.modalContent}
        >
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Nouvelle Tournée</Text>
                <Text style={styles.modalSubtitle}>Configurez votre point de départ</Text>
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.inputLabelRow}>
                  <Navigation size={16} color={theme.colors.primary} />
                  <Text style={styles.inputLabel}>Point de départ</Text>
                </View>
                <TextInput
                  mode="outlined"
                  value={startAddress}
                  onChangeText={setStartAddress}
                  placeholder="Ex: Avenue de Carthage, Tunis"
                  placeholderTextColor="#64748b"
                  textColor="#fff"
                  style={styles.textInput}
                  outlineColor="#334155"
                  activeOutlineColor={theme.colors.primary}
                />
                <Text style={styles.inputHint}>Laissez vide pour utiliser le GPS actuel.</Text>
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.inputLabelRow}>
                  <MapPin size={16} color={theme.colors.secondary} />
                  <Text style={styles.inputLabel}>Point d'arrivée (Optionnel)</Text>
                </View>
                <TextInput
                  mode="outlined"
                  value={endAddress}
                  onChangeText={setEndAddress}
                  placeholder="Ex: Entrepôt Charguia"
                  placeholderTextColor="#64748b"
                  textColor="#fff"
                  style={styles.textInput}
                  outlineColor="#334155"
                  activeOutlineColor={theme.colors.secondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.inputLabelRow}>
                  <Clock size={16} color="#f59e0b" />
                  <Text style={styles.inputLabel}>Heure de départ</Text>
                </View>
                <TextInput
                  mode="outlined"
                  value={startTime}
                  onChangeText={setStartTime}
                  keyboardType="numbers-and-punctuation"
                  placeholder="08:00"
                  placeholderTextColor="#64748b"
                  textColor="#fff"
                  style={styles.textInput}
                  outlineColor="#334155"
                  activeOutlineColor="#f59e0b"
                />
              </View>

              <View style={styles.modalActions}>
                <Button 
                  mode="text" 
                  onPress={() => setConfigVisible(false)} 
                  textColor="#94a3b8"
                  style={{ flex: 1 }}
                >
                  Annuler
                </Button>
                <Button 
                  mode="contained" 
                  onPress={confirmOptimize} 
                  style={[styles.optimizeBtn, { flex: 2 }]}
                  contentStyle={{ paddingVertical: 6 }}
                >
                  Calculer le trajet
                </Button>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </Modal>
      </Portal>
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
  searchContainer: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  searchBar: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    elevation: 0,
    borderWidth: 1,
    borderColor: '#334155',
  },
  searchInput: {
    color: '#f8fafc',
    fontSize: 15,
  },
  list: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  empty: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 16,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  optimizeBtn: {
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
  },
  optimizeBtnContent: {
    paddingVertical: 10,
  },
  modalContent: {
    backgroundColor: '#1e293b',
    margin: 20,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155',
    maxHeight: '90%',
  },
  modalHeader: {
    marginBottom: 24,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  modalSubtitle: {
    color: '#94a3b8',
    fontSize: 14,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  inputLabel: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: '#0f172a',
    fontSize: 16,
  },
  inputHint: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 6,
    fontStyle: 'italic',
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 12,
  },
});
