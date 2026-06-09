import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import MapView, { Marker, MapPressEvent, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';

const DEFAULT_REGION: Region = {
  latitude: -6.2088,
  longitude: 106.8456,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (lat: number, lng: number, address: string) => void;
}

export default function LocationPickerModal({ visible, onClose, onSelect }: Props) {
  const mapRef = useRef<MapView>(null);
  const [marker, setMarker] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!visible) {
      setMarker(null);
      setAddress('');
      setSearchQuery('');
    }
  }, [visible]);

  const reverseGeocode = async (lat: number, lng: number) => {
    setIsGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
        { headers: { "Accept-Language": "id", "User-Agent": "AduanWargaApp/1.0" } }
      );
      if (!res.ok) throw new Error('Gagal reverse geocode');
      const data = await res.json();
      setAddress(data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    } catch {
      setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    } finally {
      setIsGeocoding(false);
    }
  };

  const searchAddress = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1&countrycodes=id`,
        { headers: { 'Accept-Language': 'id', 'User-Agent': 'AduanWargaApp/1.0' } }
      );
      if (!res.ok) throw new Error('Gagal menghubungi server');
      const data = await res.json();
      if (data[0]) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        mapRef.current?.animateToRegion(
          { latitude: lat, longitude: lng, latitudeDelta: 0.01, longitudeDelta: 0.01 },
          500
        );
        setMarker({ lat, lng });
        reverseGeocode(lat, lng);
      } else {
        Alert.alert('Tidak ditemukan', `Tidak ada hasil untuk "${searchQuery}". Coba kata kunci lain.`);
      }
    } catch (err: any) {
      Alert.alert('Gagal mencari', err.message || 'Terjadi kesalahan saat mencari alamat.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleMapPress = (e: MapPressEvent) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setMarker({ lat: latitude, lng: longitude });
    reverseGeocode(latitude, longitude);
  };

  const useMyLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = loc.coords;
      mapRef.current?.animateToRegion(
        { latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 },
        500
      );
      setMarker({ lat: latitude, lng: longitude });
      reverseGeocode(latitude, longitude);
    } catch {
    }
  };

  const handleConfirm = () => {
    if (marker) {
      onSelect(marker.lat, marker.lng, address);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIcon}>
                <MaterialIcons name="place" size={18} color={Colors.light.primary} />
              </View>
              <View>
                <Text style={styles.headerTitle}>Pilih Lokasi</Text>
                <Text style={styles.headerSubtitle}>Tap di peta atau cari alamat</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialIcons name="close" size={16} color={Colors.light.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchRow}>
            <View style={styles.searchInputWrap}>
              <TextInput
                style={styles.searchInput}
                placeholder="Cari alamat, nama jalan..."
                placeholderTextColor={Colors.light.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={searchAddress}
                returnKeyType="search"
              />
            </View>
            <TouchableOpacity
              style={styles.searchBtn}
              onPress={searchAddress}
              disabled={isSearching}
            >
              {isSearching ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.searchBtnText}>Cari</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.myLocBtn} onPress={useMyLocation}>
              <MaterialIcons name="my-location" size={18} color={Colors.light.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.mapContainer}>
            <MapView
              ref={mapRef}
              style={styles.map}
              initialRegion={DEFAULT_REGION}
              onPress={handleMapPress}
            >
              {marker && (
                <Marker
                  coordinate={{ latitude: marker.lat, longitude: marker.lng }}
                  title="Lokasi dipilih"
                />
              )}
            </MapView>
          </View>

          <View style={styles.bottomBar}>
            {marker ? (
              <>
                <View style={styles.bottomIcon}>
                  <MaterialIcons name="place" size={16} color={Colors.light.primary} />
                </View>
                <View style={styles.bottomInfo}>
                  {isGeocoding ? (
                    <View style={styles.geocodingRow}>
                      <ActivityIndicator size="small" color={Colors.light.textMuted} />
                      <Text style={styles.geocodingText}>Mengambil detail alamat...</Text>
                    </View>
                  ) : (
                    <>
                      <Text style={styles.addressText} numberOfLines={2}>
                        {address}
                      </Text>
                      <Text style={styles.coordText}>
                        {marker.lat.toFixed(6)}, {marker.lng.toFixed(6)}
                      </Text>
                    </>
                  )}
                </View>
                <TouchableOpacity
                  style={[styles.confirmBtn, isGeocoding && styles.confirmBtnDisabled]}
                  onPress={handleConfirm}
                  disabled={isGeocoding}
                >
                  <Text style={styles.confirmBtnText}>Pilih</Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text style={styles.hintText}>Tap titik mana saja di peta untuk memilih lokasi.</Text>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '95%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.light.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.light.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  searchInputWrap: {
    flex: 1,
  },
  searchInput: {
    height: 40,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: BorderRadius.md,
    fontSize: 14,
    color: Colors.light.text,
  },
  searchBtn: {
    height: 40,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.light.primary,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  myLocBtn: {
    height: 40,
    width: 40,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapContainer: {
    height: 400,
    width: '100%',
  },
  map: {
    flex: 1,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderLight,
    gap: Spacing.md,
    minHeight: 64,
  },
  bottomIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomInfo: {
    flex: 1,
  },
  geocodingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  geocodingText: {
    fontSize: 13,
    color: Colors.light.textMuted,
  },
  addressText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  coordText: {
    fontSize: 11,
    color: Colors.light.textMuted,
    marginTop: 2,
  },
  confirmBtn: {
    height: 36,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.light.primary,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnDisabled: {
    opacity: 0.6,
  },
  confirmBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  hintText: {
    fontSize: 13,
    color: Colors.light.textMuted,
    flex: 1,
    textAlign: 'center',
  },
});
