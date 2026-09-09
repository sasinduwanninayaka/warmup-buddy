// src/screens/HomeScreen.js
import { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SPORTS } from '../data/warmups';
import { API_URL } from '../api/config';

// The key used to save/load the cached exercise list in AsyncStorage
const CACHE_KEY = 'cached_exercises';

// Small visual touch: an emoji per sport, and a colour per intensity level.
// Falls back gracefully if a sport/intensity value doesn't match (e.g. typos in data).
const SPORT_ICONS = { Football: '⚽', Badminton: '🏸', Basketball: '🏀', Running: '🏃' };
const INTENSITY_COLORS = { Low: '#16a34a', Medium: '#d97706', High: '#dc2626' };

export default function HomeScreen({ navigation }) {
  // useState #1: controls which sport filter is active.
  const [selectedSport, setSelectedSport] = useState('All');

  // useState #2: holds the exercises currently shown (from API or cache)
  const [warmups, setWarmups] = useState([]);

  // useState #3: true while the GET request is in flight
  const [loading, setLoading] = useState(true);

  // useState #4: holds an error message if the request fails AND there's no cache to fall back on
  const [error, setError] = useState(null);

  // useState #5: true when we're showing cached (offline) data instead of live data
  const [isOffline, setIsOffline] = useState(false);

  // useState #6: controls whether the "Add Exercise" modal is visible
  const [modalVisible, setModalVisible] = useState(false);

  // useState #7-10: the four form fields for a new exercise
  const [newExercise, setNewExercise] = useState('');
  const [newSport, setNewSport] = useState('');
  const [newDuration, setNewDuration] = useState('');
  const [newIntensity, setNewIntensity] = useState('');

  // useState #11: true while the POST request is being sent
  const [submitting, setSubmitting] = useState(false);

  // Fetches exercises from MockAPI. On success, saves a copy to AsyncStorage.
  // On failure, tries to load the last saved copy from AsyncStorage instead
  // of just showing a dead-end error — this is the offline persistence behaviour.
  const fetchWarmups = async () => {
    setLoading(true);
    setError(null);
    setIsOffline(false);

    try {
      const response = await axios.get(API_URL);
      setWarmups(response.data);
      // Cache the fresh data for offline use later
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(response.data));
    } catch (err) {
      console.log('Fetch error:', err.message);

      // Network/API failed — try falling back to cached data
      try {
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        if (cached) {
          setWarmups(JSON.parse(cached));
          setIsOffline(true);
        } else {
          setError('Could not load exercises. Check your internet connection.');
        }
      } catch (cacheErr) {
        setError('Could not load exercises. Check your internet connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Re-fetches every time this screen comes into focus (e.g. returning from Detail)
  useFocusEffect(
    useCallback(() => {
      fetchWarmups();
    }, [])
  );

  // Sends the new exercise to MockAPI, then closes the modal and refreshes the list
  const handleAddExercise = () => {
    if (!newExercise.trim() || !newSport.trim()) {
      return;
    }

    setSubmitting(true);

    axios
      .post(API_URL, {
        exercise: newExercise,
        sport: newSport,
        duration: newDuration,
        intensity: newIntensity,
        iCompleted: false,
      })
      .then(() => {
        setNewExercise('');
        setNewSport('');
        setNewDuration('');
        setNewIntensity('');
        setModalVisible(false);
        fetchWarmups();
      })
      .catch(err => {
        console.log('Add error:', err.message);
        setError('Could not add exercise. Try again.');
      })
      .finally(() => setSubmitting(false));
  };

  const filteredWarmups =
    selectedSport === 'All'
      ? warmups
      : warmups.filter(item => item.sport === selectedSport);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.header}>WarmUp Buddy</Text>
          <Text style={styles.subheader}>Pick a sport, do the routine, avoid injury.</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Offline banner — shown when live fetch failed but cached data is available */}
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineBannerText}>
            You're offline — showing saved data.
          </Text>
        </View>
      )}

      {/* Filter chips */}
      <View style={styles.chipRow}>
        {['All', ...SPORTS].map(sport => (
          <TouchableOpacity
            key={sport}
            style={[styles.chip, selectedSport === sport && styles.chipActive]}
            onPress={() => setSelectedSport(sport)}
          >
            <Text style={[styles.chipText, selectedSport === sport && styles.chipTextActive]}>
              {sport === 'All' ? sport : `${SPORT_ICONS[sport] || ''} ${sport}`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Loading state */}
      {loading && (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.centerText}>Loading exercises...</Text>
        </View>
      )}

      {/* Error state (only shown if there's no cache to fall back on) */}
      {!loading && error && (
        <View style={styles.centerBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchWarmups}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Success state — list or empty message */}
      {!loading && !error && (
        <FlatList
          data={filteredWarmups}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('Detail', { exercise: item })}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>
                  {item.iCompleted ? '✓ ' : ''}{SPORT_ICONS[item.sport] || '💪'} {item.exercise}
                </Text>
                <View style={[styles.badge, { backgroundColor: (INTENSITY_COLORS[item.intensity] || '#2563eb') + '20' }]}>
                  <Text style={[styles.badgeText, { color: INTENSITY_COLORS[item.intensity] || '#2563eb' }]}>
                    {item.intensity}
                  </Text>
                </View>
              </View>
              <Text style={styles.cardMeta}>{item.sport} · {item.duration}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.centerText}>No exercises found for this sport.</Text>}
        />
      )}

      {/* Add Exercise modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>New Exercise</Text>

            <TextInput style={styles.input} placeholder="Exercise name" value={newExercise} onChangeText={setNewExercise} />
            <TextInput style={styles.input} placeholder="Sport (e.g. Football)" value={newSport} onChangeText={setNewSport} />
            <TextInput style={styles.input} placeholder="Duration (e.g. 2 min)" value={newDuration} onChangeText={setNewDuration} />
            <TextInput style={styles.input} placeholder="Intensity (e.g. Low)" value={newIntensity} onChangeText={setNewIntensity} />

            <View style={styles.modalButtonRow}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)} disabled={submitting}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleAddExercise} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingTop: 50, backgroundColor: '#fff' },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  header: { fontSize: 26, fontWeight: '700' },
  subheader: { color: '#666', marginBottom: 14 },
  addButton: { backgroundColor: '#2563eb', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 },
  addButtonText: { color: '#fff', fontWeight: '600' },
  offlineBanner: { backgroundColor: '#fef3c7', borderRadius: 8, padding: 10, marginBottom: 12 },
  offlineBannerText: { color: '#92400e', fontSize: 13, fontWeight: '500', textAlign: 'center' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, backgroundColor: '#eee' },
  chipActive: { backgroundColor: '#2563eb' },
  chipText: { color: '#333', fontWeight: '500' },
  chipTextActive: { color: '#fff' },
  card: { backgroundColor: '#f5f6fa', borderRadius: 12, padding: 14, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  cardMeta: { color: '#666', marginTop: 4 },
  badge: { paddingVertical: 3, paddingHorizontal: 10, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 40 },
  centerText: { color: '#666', marginTop: 10 },
  errorText: { color: '#dc2626', textAlign: 'center', marginBottom: 12 },
  retryButton: { backgroundColor: '#2563eb', paddingVertical: 8, paddingHorizontal: 20, borderRadius: 8 },
  retryButtonText: { color: '#fff', fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 14 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, marginBottom: 10 },
  modalButtonRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 8 },
  cancelButton: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#eee' },
  cancelButtonText: { color: '#333', fontWeight: '600' },
  saveButton: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, backgroundColor: '#2563eb', minWidth: 70, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontWeight: '600' },
});