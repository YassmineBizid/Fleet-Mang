import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button, ActivityIndicator, Text } from 'react-native-paper';
import { CameraView, FlashMode, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import axios from 'axios';
import {
  Check,
  Image as ImageIcon,
  MapPin,
  Navigation,
  RotateCcw,
  User,
  X,
  Zap,
  ZapOff,
} from 'lucide-react-native';
import { useInvoiceStore } from '../../stores/invoiceStore';
import { theme } from '../../constants/theme';
import { API_CONFIG } from '../../constants/config';
import { Invoice } from '../../types';

const { width } = Dimensions.get('window');
const CAMERA_CARD_WIDTH = Math.min(width - 20, 420);

type ScanStep = 'camera' | 'preview' | 'processing' | 'edit' | 'success';

interface ExtractedData {
  client_name: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  amount?: number | null;
  date?: string | null;
  status: 'success' | 'failed_geocoding';
}

interface EditableData {
  client_name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
}

interface GeocodeResponse {
  address: string;
  latitude: number | null;
  longitude: number | null;
  display_name?: string | null;
  status: 'success' | 'failed';
}

function normalizeAddress(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [step, setStep] = useState<ScanStep>('camera');
  const [photo, setPhoto] = useState<string | null>(null);
  const [flash, setFlash] = useState<FlashMode>('off');
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [editData, setEditData] = useState<EditableData>({
    client_name: '',
    address: '',
    latitude: null,
    longitude: null,
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);

  const cameraRef = useRef<any>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const { addInvoice } = useInvoiceStore();
  const router = useRouter();

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.02,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const takePicture = useCallback(async () => {
    if (!cameraRef.current) return;
    try {
      const data = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        base64: false,
        skipProcessing: false,
        // FIX: shutterSound is not a valid option in expo-camera v14+; removed to avoid warnings
      });
      setPhoto(data.uri);
      setErrorMessage(null);
      setStep('preview');
    } catch {
      Alert.alert('Erreur', 'Impossible de prendre la photo.');
    }
  }, []);

  const processInvoice = async () => {
    if (!photo) return;

    setStep('processing');
    setErrorMessage(null);

    try {
      // FIX: Build FormData correctly for React Native / Expo Go
      const formData = new FormData();
      formData.append('image', {
        uri: photo,
        type: 'image/jpeg',
        name: 'invoice.jpg',
      } as any);

      // FIX: Ensure no double-slash in URL
      const ocrUrl = `${API_CONFIG.BASE_URL.replace(/\/$/, '')}${API_CONFIG.ENDPOINTS.OCR}`;

      const response = await axios.post<ExtractedData>(ocrUrl, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000,
        // FIX: Needed on Android to avoid multipart boundary issues
        transformRequest: (data) => data,
      });

      const data = response.data;
      const normalizedAddress = normalizeAddress(data.address || '');

      setExtractedData({ ...data, address: normalizedAddress });
      setEditData({
        client_name: (data.client_name || '').trim(),
        address: normalizedAddress,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
      });
      setStep('edit');
    } catch (error: any) {
      const message =
        error?.code === 'ECONNABORTED'
          ? 'Delai depasse. Verifiez votre connexion.'
          : 'Impossible de traiter la facture. Verifiez votre connexion au serveur.';
      setErrorMessage(message);
      setStep('preview');
    }
  };

  const geocodeManually = async () => {
    const address = normalizeAddress(editData.address);
    if (!address) {
      Alert.alert('Adresse requise', "Entrez d'abord une adresse a geolocaliser.");
      return;
    }

    setIsGeocoding(true);
    try {
      // FIX: Ensure no double-slash in URL
      const geocodeUrl = `${API_CONFIG.BASE_URL.replace(/\/$/, '')}/api/geocode/address`;

      const response = await axios.post<GeocodeResponse>(
        geocodeUrl,
        { address },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 15000,
        }
      );

      const data = response.data;
      if (data.status === 'success' && data.latitude !== null && data.longitude !== null) {
        setEditData((prev) => ({
          ...prev,
          address,
          latitude: data.latitude,
          longitude: data.longitude,
        }));
        setExtractedData((prev) =>
          prev
            ? {
                ...prev,
                address,
                latitude: data.latitude,
                longitude: data.longitude,
                status: 'success',
              }
            : prev
        );
        Alert.alert('Coordonnees trouvees', "L'adresse a ete geolocalisee avec succes.");
      } else {
        setEditData((prev) => ({ ...prev, address, latitude: null, longitude: null }));
        setExtractedData((prev) =>
          prev
            ? { ...prev, address, latitude: null, longitude: null, status: 'failed_geocoding' }
            : prev
        );
        Alert.alert(
          'Geolocalisation impossible',
          'Essayez une adresse plus precise avec ville et code postal.'
        );
      }
    } catch (error: any) {
      const message =
        error?.code === 'ECONNABORTED'
          ? 'Le serveur a mis trop de temps a repondre.'
          : "Impossible de geolocaliser cette adresse pour l'instant.";
      Alert.alert('Erreur', message);
    } finally {
      setIsGeocoding(false);
    }
  };

  const confirmAndSave = () => {
    const clientName = editData.client_name.trim();
    const address = normalizeAddress(editData.address);

    if (!clientName) {
      Alert.alert('Champ requis', 'Le nom du client est obligatoire.');
      return;
    }

    if (!address) {
      Alert.alert('Champ requis', "L'adresse est obligatoire.");
      return;
    }

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      imageUri: photo!,
      clientName,
      clientAddress: address,
      amount: extractedData?.amount || 0,
      currency: 'TND',
      date: extractedData?.date || new Date().toISOString().split('T')[0],
      status:
        editData.latitude !== null && editData.longitude !== null ? 'scanned' : 'pending',
      latitude: editData.latitude ?? undefined,
      longitude: editData.longitude ?? undefined,
      scannedAt: new Date().toISOString(),
    };

    addInvoice(newInvoice);
    setStep('success');
  };

  const reset = () => {
    setPhoto(null);
    setExtractedData(null);
    setEditData({ client_name: '', address: '', latitude: null, longitude: null });
    setErrorMessage(null);
    setStep('camera');
  };

  // ─── Permission loading ───────────────────────────────────────────────────
  if (!permission) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.permissionCard}>
          <ImageIcon color={theme.colors.primary} size={48} />
          <Text style={styles.permissionTitle}>Acces camera requis</Text>
          <Text style={styles.permissionText}>
            Pour scanner vos factures, autorisez l'acces a la camera.
          </Text>
          <Button mode="contained" onPress={requestPermission} style={styles.permissionBtn}>
            Autoriser la camera
          </Button>
        </View>
      </View>
    );
  }

  // ─── Camera step ──────────────────────────────────────────────────────────
  if (step === 'camera') {
    return (
      <View style={styles.cameraScreen}>
        <View style={styles.cameraTopBar}>
          <TouchableOpacity style={styles.iconCircle} onPress={() => router.back()}>
            <X color="#fff" size={22} />
          </TouchableOpacity>
          <Text style={styles.cameraTitle}>Scanner l'adresse</Text>
          <TouchableOpacity
            style={styles.iconCircle}
            onPress={() => setFlash((v) => (v === 'off' ? 'on' : 'off'))}
          >
            {flash === 'on' ? (
              <Zap color="#FFD700" size={22} />
            ) : (
              <ZapOff color="#fff" size={22} />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.cameraStage}>
          <CameraView style={styles.cameraCard} ref={cameraRef} flash={flash}>
            <View style={styles.cameraCardOverlay}>
              <Animated.View
                style={[styles.scanFrame, { transform: [{ scale: pulseAnim }] }]}
              >
                <View style={styles.invoiceGuide}>
                  <View style={styles.invoiceGuideHeader}>
                    <Text style={styles.invoiceGuideTitle}>
                      Cadrez seulement le bloc adresse
                    </Text>
                    <Text style={styles.invoiceGuideHint}>
                      Cadre plus large pour capturer l'adresse clairement.
                    </Text>
                  </View>
                  <View style={styles.addressWindow}>
                    <View style={[styles.corner, styles.tl]} />
                    <View style={[styles.corner, styles.tr]} />
                    <View style={[styles.corner, styles.bl]} />
                    <View style={[styles.corner, styles.br]} />
                    <View style={styles.addressWindowInner}>
                      <Text style={styles.frameLabel}>Zone adresse</Text>
                      <Text style={styles.addressWindowHint}>
                        Nom, rue, ville, code postal
                      </Text>
                    </View>
                  </View>
                </View>
              </Animated.View>
            </View>
          </CameraView>
        </View>

        <View style={styles.cameraFooter}>
          <View style={styles.tipsRow}>
            <TipBadge icon="L" text="Bonne lumiere" />
            <TipBadge icon="R" text="Image droite" />
            <TipBadge icon="A" text="Adresse seule" />
          </View>
          <View style={styles.shutterRow}>
            <View style={styles.shutterSide} />
            <TouchableOpacity
              style={styles.shutter}
              onPress={takePicture}
              activeOpacity={0.8}
            >
              <View style={styles.shutterInner} />
            </TouchableOpacity>
            <View style={styles.shutterSide} />
          </View>
        </View>
      </View>
    );
  }

  // ─── Preview step ─────────────────────────────────────────────────────────
  if (step === 'preview') {
    return (
      <View style={styles.container}>
        <Image source={{ uri: photo! }} style={styles.previewImage} resizeMode="cover" />
        <View style={styles.previewOverlay}>
          {errorMessage && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}
          <Text style={styles.previewTitle}>Facture capturee</Text>
          <Text style={styles.previewSubtitle}>
            Verifiez que le texte est bien lisible avant de traiter.
          </Text>
          <View style={styles.previewActions}>
            <Button
              mode="outlined"
              onPress={reset}
              style={styles.previewBtn}
              textColor="#fff"
              icon={() => <RotateCcw size={16} color="#fff" />}
            >
              Reprendre
            </Button>
            <Button
              mode="contained"
              onPress={processInvoice}
              style={[styles.previewBtn, { backgroundColor: theme.colors.primary }]}
              icon={() => <Zap size={16} color="#fff" />}
            >
              Analyser
            </Button>
          </View>
        </View>
      </View>
    );
  }

  // ─── Processing step ──────────────────────────────────────────────────────
  if (step === 'processing') {
    return (
      <View style={[styles.container, styles.centerContainer, { backgroundColor: '#0f172a' }]}>
        <Image source={{ uri: photo! }} style={styles.processingThumb} />
        <ActivityIndicator
          color={theme.colors.primary}
          size="large"
          style={{ marginTop: 32 }}
        />
        <Text style={styles.processingTitle}>Analyse en cours...</Text>
        <Text style={styles.processingSubtitle}>OCR + extraction de l'adresse</Text>
      </View>
    );
  }

  // ─── Edit step ────────────────────────────────────────────────────────────
  if (step === 'edit') {
    const hasCoords = editData.latitude !== null && editData.longitude !== null;
    const isIncomplete = !editData.client_name.trim() || !editData.address.trim();

    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: '#0f172a' }}
        contentContainerStyle={styles.editContainer}
        keyboardShouldPersistTaps="handled"
      >
        <Image source={{ uri: photo! }} style={styles.editThumb} />

        <Text style={styles.editTitle}>Verifier l'extraction</Text>
        <Text style={styles.editSubtitle}>
          Corrigez le client et l'adresse avant de confirmer.
        </Text>

        {extractedData?.status === 'failed_geocoding' && (
          <View style={styles.warningBanner}>
            <Text style={styles.warningText}>
              Adresse non geolocalisee. Corrigez-la puis utilisez "Recalculer coordonnees".
            </Text>
          </View>
        )}

        <View style={styles.fieldGroup}>
          <View style={styles.fieldLabel}>
            <User size={14} color="#64748b" />
            <Text style={styles.fieldLabelText}>NOM DU CLIENT</Text>
          </View>
          <TextInput
            value={editData.client_name}
            onChangeText={(value) =>
              setEditData((prev) => ({ ...prev, client_name: value }))
            }
            style={[
              styles.editInput,
              !editData.client_name.trim() && styles.editInputError,
            ]}
            placeholder="Nom du client"
            placeholderTextColor="#475569"
            autoCapitalize="words"
          />
        </View>

        <View style={styles.fieldGroup}>
          <View style={styles.fieldLabel}>
            <MapPin size={14} color="#64748b" />
            <Text style={styles.fieldLabelText}>ADRESSE DE LIVRAISON</Text>
          </View>
          <TextInput
            value={editData.address}
            onChangeText={(value) =>
              setEditData((prev) => ({ ...prev, address: value }))
            }
            style={[
              styles.editInput,
              !editData.address.trim() && styles.editInputError,
            ]}
            placeholder="Ville + code postal (ex: Tunis 1000)"
            placeholderTextColor="#475569"
            autoCapitalize="words"
            multiline
          />
          <TouchableOpacity
            style={[styles.reGeoBtn, isGeocoding && { opacity: 0.5 }]}
            onPress={geocodeManually}
            disabled={isGeocoding}
          >
            {isGeocoding ? (
              <ActivityIndicator size={14} color={theme.colors.primary} />
            ) : (
              <Navigation size={14} color={theme.colors.primary} />
            )}
            <Text style={styles.reGeoBtnText}>
              {isGeocoding ? 'Recherche...' : 'Recalculer coordonnees'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.gpsStatus}>
          <View
            style={[
              styles.gpsDot,
              { backgroundColor: hasCoords ? '#22c55e' : '#f59e0b' },
            ]}
          />
          <Text style={styles.gpsText}>
            {hasCoords
              ? `GPS : ${editData.latitude!.toFixed(4)}, ${editData.longitude!.toFixed(4)}`
              : 'GPS : Coordonnees non disponibles'}
          </Text>
        </View>

        <View style={styles.editActions}>
          <Button
            mode="outlined"
            onPress={reset}
            style={styles.editBtn}
            textColor="#94a3b8"
            icon={() => <RotateCcw size={16} color="#94a3b8" />}
          >
            Recommencer
          </Button>
          <Button
            mode="contained"
            onPress={confirmAndSave}
            disabled={isIncomplete}
            style={[styles.editBtn, { backgroundColor: theme.colors.primary }]}
            icon={() => <Check size={16} color="#fff" />}
          >
            Confirmer
          </Button>
        </View>
      </ScrollView>
    );
  }

  // ─── Success step ─────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, styles.centerContainer, { backgroundColor: '#0f172a' }]}>
      <View style={styles.successRing}>
        <View style={styles.successIcon}>
          <Check color="#fff" size={40} />
        </View>
      </View>
      <Text style={styles.successTitle}>Facture ajoutee !</Text>
      <View style={styles.successCard}>
        <SuccessRow
          icon={<User size={16} color={theme.colors.primary} />}
          label="Client"
          value={editData.client_name}
        />
        <SuccessRow
          icon={<MapPin size={16} color={theme.colors.primary} />}
          label="Adresse"
          value={normalizeAddress(editData.address)}
        />
        <SuccessRow
          icon={<Navigation size={16} color={theme.colors.primary} />}
          label="GPS"
          value={
            editData.latitude !== null && editData.longitude !== null
              ? `${editData.latitude.toFixed(4)}, ${editData.longitude.toFixed(4)}`
              : 'A resoudre'
          }
        />
      </View>
      <Button
        mode="contained"
        onPress={() => router.replace('/(driver)/invoices')}
        style={styles.successPrimaryBtn}
      >
        Voir ma liste
      </Button>
      <TouchableOpacity onPress={reset} style={{ marginTop: 12 }}>
        <Text style={styles.successSecondaryBtn}>Scanner une autre facture</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TipBadge({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={tipStyles.badge}>
      <Text style={tipStyles.icon}>{icon}</Text>
      <Text style={tipStyles.text}>{text}</Text>
    </View>
  );
}

function SuccessRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View style={successRowStyles.row}>
      {icon}
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={successRowStyles.label}>{label}</Text>
        <Text style={successRowStyles.value}>{value || '-'}</Text>
      </View>
    </View>
  );
}

// ─── StyleSheets ──────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },

  // ── Permission ──
  permissionCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    gap: 16,
    width: '100%',
    maxWidth: 360,
  },
  permissionTitle: {
    color: '#f1f5f9',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 8,
    textAlign: 'center',
  },
  permissionText: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  permissionBtn: {
    marginTop: 8,
    borderRadius: 12,
    width: '100%',
  },

  // ── Camera ──
  cameraScreen: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  cameraTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraStage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  cameraCard: {
    width: CAMERA_CARD_WIDTH,
    aspectRatio: 3 / 4,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cameraCardOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: '90%',
    alignItems: 'center',
  },
  invoiceGuide: {
    width: '100%',
    gap: 12,
  },
  invoiceGuideHeader: {
    alignItems: 'center',
    gap: 4,
  },
  invoiceGuideTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  invoiceGuideHint: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  addressWindow: {
    height: 110,
    borderColor: 'rgba(255,255,255,0.6)',
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#fff',
    borderWidth: 2,
  },
  tl: { top: -1, left: -1, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 6 },
  tr: { top: -1, right: -1, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 6 },
  bl: { bottom: -1, left: -1, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 6 },
  br: { bottom: -1, right: -1, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 6 },
  addressWindowInner: {
    alignItems: 'center',
    gap: 4,
  },
  frameLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  addressWindowHint: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // ── Camera footer ──
  cameraFooter: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    paddingTop: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    gap: 20,
  },
  tipsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  shutterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterSide: {
    flex: 1,
  },
  shutter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 3,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
  },

  // ── Preview ──
  previewImage: {
    ...StyleSheet.absoluteFillObject,
  },
  previewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
    padding: 24,
    gap: 12,
  },
  errorBanner: {
    backgroundColor: '#7f1d1d',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 13,
    textAlign: 'center',
  },
  previewTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  previewSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  previewActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  previewBtn: {
    flex: 1,
    borderRadius: 12,
    borderColor: 'rgba(255,255,255,0.4)',
  },

  // ── Processing ──
  processingThumb: {
    width: 120,
    height: 120,
    borderRadius: 16,
    opacity: 0.5,
  },
  processingTitle: {
    color: '#f1f5f9',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
  },
  processingSubtitle: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 4,
  },

  // ── Edit ──
  editContainer: {
    padding: 20,
    gap: 16,
    paddingBottom: 48,
  },
  editThumb: {
    width: '100%',
    height: 140,
    borderRadius: 12,
    marginBottom: 4,
    opacity: 0.7,
  },
  editTitle: {
    color: '#f1f5f9',
    fontSize: 20,
    fontWeight: '700',
  },
  editSubtitle: {
    color: '#64748b',
    fontSize: 13,
  },
  warningBanner: {
    backgroundColor: '#451a03',
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
  },
  warningText: {
    color: '#fcd34d',
    fontSize: 13,
    lineHeight: 20,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fieldLabelText: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
  },
  editInput: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    color: '#f1f5f9',
    fontSize: 15,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
  },
  editInputError: {
    borderColor: '#ef4444',
  },
  reGeoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    borderRadius: 8,
    backgroundColor: 'rgba(99,102,241,0.1)',
  },
  reGeoBtnText: {
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  gpsStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 12,
  },
  gpsDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  gpsText: {
    color: '#94a3b8',
    fontSize: 13,
    fontFamily: 'monospace',
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  editBtn: {
    flex: 1,
    borderRadius: 12,
    borderColor: '#334155',
  },

  // ── Success ──
  successRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    color: '#f1f5f9',
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 20,
  },
  successCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    gap: 16,
    marginBottom: 24,
  },
  successPrimaryBtn: {
    borderRadius: 14,
    width: '100%',
  },
  successSecondaryBtn: {
    color: '#64748b',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});

const tipStyles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  icon: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    width: 18,
    height: 18,
    textAlign: 'center',
    lineHeight: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 9,
    overflow: 'hidden',
  },
  text: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
  },
});

const successRowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  label: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  value: {
    color: '#e2e8f0',
    fontSize: 14,
    lineHeight: 20,
  },
});
// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#000' },
//   cameraScreen: {
//     flex: 1,
//     backgroundColor: '#020617',
//     paddingHorizontal: 10,
//     paddingTop: 18,
//     paddingBottom: 28,
//   },
//   centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
//   cameraTopBar: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 18,
//   },
//   cameraStage: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   cameraCard: {
//     width: CAMERA_CARD_WIDTH,
//     aspectRatio: 3 / 4,
//     borderRadius: 24,
//     overflow: 'hidden',
//     backgroundColor: '#000',
//   },
//   cameraCardOverlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0,0,0,0.2)',
//     justifyContent: 'center',
//     paddingHorizontal: 10,
//     paddingVertical: 14,
//   },
//   cameraFooter: {
//     marginTop: 18,
//   },
//   cameraTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
//   iconCircle: {
//     width: 42,
//     height: 42,
//     borderRadius: 21,
//     backgroundColor: 'rgba(255,255,255,0.15)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   scanFrame: {
//     width: '100%',
//     height: '100%',
//     alignSelf: 'center',
//     position: 'relative',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   invoiceGuide: {
//     width: '100%',
//     alignItems: 'center',
//   },
//   invoiceGuideHeader: {
//     alignItems: 'center',
//     marginBottom: 12,
//     paddingHorizontal: 12,
//   },
//   invoiceGuideTitle: {
//     color: '#fff',
//     fontSize: 15,
//     fontWeight: '800',
//     textAlign: 'center',
//   },
//   invoiceGuideHint: {
//     color: '#cbd5e1',
//     fontSize: 12,
//     marginTop: 4,
//     textAlign: 'center',
//   },
//   addressWindow: {
//     width: '92%',
//     height: '36%',
//     minHeight: 160,
//     backgroundColor: 'rgba(255,255,255,0.12)',
//     borderRadius: 18,
//     position: 'relative',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   addressWindowInner: {
//     alignItems: 'center',
//     backgroundColor: 'rgba(15,23,42,0.68)',
//     borderRadius: 14,
//     paddingHorizontal: 16,
//     paddingVertical: 10,
//   },
//   corner: {
//     position: 'absolute',
//     width: 36,
//     height: 36,
//     borderColor: theme.colors.primary,
//     borderWidth: 3,
//   },
//   tl: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
//   tr: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
//   bl: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
//   br: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
//   frameLabel: { color: '#fff', fontSize: 13, fontWeight: '600' },
//   addressWindowHint: {
//     color: '#93c5fd',
//     fontSize: 11,
//     marginTop: 4,
//     fontWeight: '600',
//   },
//   tipsRow: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     gap: 8,
//   },
//   shutterRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//   },
//   shutterSide: { flex: 1 },
//   shutter: {
//     width: 78,
//     height: 78,
//     borderRadius: 39,
//     backgroundColor: 'rgba(255,255,255,0.25)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderWidth: 4,
//     borderColor: '#fff',
//   },
//   shutterInner: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#fff' },
//   previewImage: { flex: 1 },
//   previewOverlay: {
//     position: 'absolute',
//     bottom: 0,
//     width: '100%',
//     padding: 24,
//     backgroundColor: 'rgba(15,23,42,0.95)',
//     borderTopLeftRadius: 28,
//     borderTopRightRadius: 28,
//   },
//   previewTitle: {
//     color: '#fff',
//     fontSize: 20,
//     fontWeight: '800',
//     textAlign: 'center',
//     marginBottom: 6,
//   },
//   previewSubtitle: {
//     color: '#94a3b8',
//     fontSize: 13,
//     textAlign: 'center',
//     marginBottom: 20,
//   },
//   previewActions: { flexDirection: 'row', gap: 12 },
//   previewBtn: { flex: 1, borderRadius: 12 },
//   processingThumb: {
//     width: 120,
//     height: 160,
//     borderRadius: 12,
//     opacity: 0.5,
//   },
//   processingTitle: {
//     color: '#fff',
//     fontSize: 20,
//     fontWeight: '800',
//     marginTop: 20,
//   },
//   processingSubtitle: { color: '#64748b', fontSize: 13, marginTop: 6 },
//   errorBanner: {
//     backgroundColor: '#ef4444',
//     padding: 10,
//     borderRadius: 10,
//     marginBottom: 12,
//   },
//   errorText: { color: '#fff', fontSize: 13 },
//   warningBanner: {
//     backgroundColor: 'rgba(251,191,36,0.12)',
//     borderWidth: 1,
//     borderColor: '#FBBF24',
//     padding: 10,
//     borderRadius: 10,
//     marginBottom: 16,
//   },
//   warningText: { color: '#FBBF24', fontSize: 12, lineHeight: 16 },
//   editContainer: {
//     padding: 20,
//     paddingBottom: 40,
//   },
//   editThumb: {
//     width: '100%',
//     height: 160,
//     borderRadius: 16,
//     marginBottom: 20,
//     opacity: 0.8,
//   },
//   editTitle: {
//     color: '#fff',
//     fontSize: 22,
//     fontWeight: '800',
//     marginBottom: 4,
//   },
//   editSubtitle: { color: '#64748b', fontSize: 13, marginBottom: 20 },
//   fieldGroup: { marginBottom: 16 },
//   fieldLabel: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 6,
//     marginBottom: 6,
//   },
//   fieldLabelText: {
//     color: '#64748b',
//     fontSize: 11,
//     fontWeight: '700',
//     textTransform: 'uppercase',
//     letterSpacing: 0.8,
//   },
//   editInput: {
//     backgroundColor: '#1e293b',
//     color: '#f1f5f9',
//     padding: 14,
//     borderRadius: 12,
//     fontSize: 15,
//     borderWidth: 1.5,
//     borderColor: '#334155',
//   },
//   editInputError: {
//     borderColor: '#ef4444',
//   },
//   reGeoBtn: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 6,
//     marginTop: 8,
//     alignSelf: 'flex-start',
//   },
//   reGeoBtnText: { color: theme.colors.primary, fontSize: 12, fontWeight: '600' },
//   gpsStatus: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 8,
//     backgroundColor: '#1e293b',
//     padding: 12,
//     borderRadius: 10,
//     marginBottom: 24,
//   },
//   gpsDot: { width: 10, height: 10, borderRadius: 5 },
//   gpsText: { color: '#94a3b8', fontSize: 12, flex: 1 },
//   editActions: { flexDirection: 'row', gap: 12 },
//   editBtn: { flex: 1, borderRadius: 12 },
//   permissionCard: {
//     backgroundColor: '#1e293b',
//     padding: 28,
//     borderRadius: 20,
//     alignItems: 'center',
//     gap: 12,
//   },
//   permissionTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
//   permissionText: { color: '#94a3b8', textAlign: 'center', fontSize: 14, lineHeight: 20 },
//   permissionBtn: { marginTop: 8, width: '100%', borderRadius: 12 },
//   successRing: {
//     width: 110,
//     height: 110,
//     borderRadius: 55,
//     borderWidth: 4,
//     borderColor: '#22c55e',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: 24,
//   },
//   successIcon: {
//     width: 80,
//     height: 80,
//     borderRadius: 40,
//     backgroundColor: '#22c55e',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   successTitle: {
//     color: '#fff',
//     fontSize: 26,
//     fontWeight: '900',
//     marginBottom: 24,
//   },
//   successCard: {
//     width: '100%',
//     backgroundColor: '#1e293b',
//     borderRadius: 16,
//     padding: 16,
//     marginBottom: 28,
//   },
//   successPrimaryBtn: {
//     width: '100%',
//     borderRadius: 12,
//     backgroundColor: theme.colors.primary,
//   },
//   successSecondaryBtn: {
//     color: '#64748b',
//     fontSize: 14,
//     fontWeight: '600',
//   },
// });
