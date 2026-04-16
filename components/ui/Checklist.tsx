import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Checkbox } from 'expo-checkbox';

// Définition des types pour TypeScript
interface CheckItemProps {
  label: string;
  value: boolean;
  onValueChange: (newValue: boolean) => void;
}

interface ChecksState {
  health: boolean;
  license: boolean;
  vehicle: boolean;
  papers: boolean;
}

export default function ChecklistModal() {
  const [isVisible, setIsVisible] = useState(false);
  const [checks, setChecks] = useState<ChecksState>({
    health: false,
    license: false,
    vehicle: false,
    papers: false,
  });

  useEffect(() => {
    checkIfValidatedToday();
  }, []);

  // Vérifie si le chauffeur a déjà validé la checklist aujourd'hui
  const checkIfValidatedToday = async () => {
    try {
      const lastCheckDate = await AsyncStorage.getItem('driver_check_date');
      const today = new Date().toLocaleDateString();

      if (lastCheckDate !== today) {
        setIsVisible(true);
      }
    } catch (error) {
      console.error("Erreur AsyncStorage:", error);
      setIsVisible(true); // Par sécurité, on l'affiche en cas d'erreur
    }
  };

  // Enregistre la validation et ferme le modal
  const handleConfirm = async () => {
    const allChecked = Object.values(checks).every(v => v === true);

    if (allChecked) {
      try {
        const today = new Date().toLocaleDateString();
        await AsyncStorage.setItem('driver_check_date', today);
        setIsVisible(false);
      } catch (error) {
        Alert.alert("Erreur", "Impossible de sauvegarder votre validation.");
      }
    } else {
      Alert.alert(
        "Action requise", 
        "Veuillez cocher toutes les cases pour confirmer que vous et le véhicule êtes prêts."
      );
    }
  };

  return (
    <Modal 
      visible={isVisible} 
      animationType="fade" 
      transparent={true}
      hardwareAccelerated={true}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.emoji}>🚛</Text>
          <Text style={styles.title}>Checklist de Sécurité</Text>
          <Text style={styles.subtitle}>
            Avant de démarrer votre tournée, veuillez confirmer les points suivants :
          </Text>

          <ScrollView style={styles.list}>
            <CheckItem 
              label="Je suis reposé et apte à conduire" 
              value={checks.health} 
              onValueChange={(v) => setChecks({...checks, health: v})} 
            />
            <CheckItem 
              label="J'ai mon permis de conduire valide" 
              value={checks.license} 
              onValueChange={(v) => setChecks({...checks, license: v})} 
            />
            <CheckItem 
              label="État du camion vérifié (Pneus, Freins)" 
              value={checks.vehicle} 
              onValueChange={(v) => setChecks({...checks, vehicle: v})} 
            />
            <CheckItem 
              label="Documents de transport à bord" 
              value={checks.papers} 
              onValueChange={(v) => setChecks({...checks, papers: v})} 
            />
          </ScrollView>

          <TouchableOpacity 
            style={[styles.button, { opacity: Object.values(checks).every(v => v) ? 1 : 0.6 }]} 
            onPress={handleConfirm}
          >
            <Text style={styles.buttonText}>Confirmer et Démarrer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// Composant interne pour chaque ligne de la liste
const CheckItem = ({ label, value, onValueChange }: CheckItemProps) => (
  <View style={styles.checkRow}>
    <Checkbox 
      value={value} 
      onValueChange={onValueChange} 
      color={value ? '#6366f1' : '#94a3b8'} 
      style={styles.checkbox}
    />
    <Text style={styles.checkLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.9)', // Fond sombre pro
    justifyContent: 'center',
    padding: 24,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  emoji: {
    fontSize: 40,
    textAlign: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  list: {
    marginBottom: 24,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
  },
  checkLabel: {
    marginLeft: 12,
    fontSize: 15,
    color: '#334155',
    fontWeight: '500',
    flex: 1,
  },
  button: {
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    elevation: 5,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});