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
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SPORTS } from '../data/warmups';
import { API_URL } from '../api/config';
import { useTheme } from '../theme/ThemeContext';

// AsyncStorage keys
const CACHE_KEY = 'cached_exercises';
const FAVORITES_KEY = 'favorite_exercise_ids';

// Fixed lists — used for the tap-to-select pickers so users can never type
// something that doesn't match a filter chip or an intensity colour.
const INTENSITY_LEVELS = ['Low', 'Medium', 'High'];

const SPORT_ICONS = { Football: '⚽', Badminton: '🏸', Basketball: '🏀', Running: '🏃' };
const INTENSITY_COLORS = { Low: '#16a34a', Medium: '#d97706', High: '#dc2626' };

export default function HomeScreen({ navigation }) {
  const { colors } = useTheme();

  // useState #1: controls which sport filter is active.
  const [selectedSport, setSelectedSport] = useState('All');

  // useState #1b: controls the search text, filters by exercise name
  const [searchText, setSearchText] = useState('');

  // useState #1c: when true, only favorited exercises are shown
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // useState #1d: array of favorited exercise ids, loaded from AsyncStorage
  const [favoriteIds, setFavoriteIds] = useState([]);

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

  // useState #7-10: the four form fields for a new exercise.
  const [newExercise, setNewExercise] = useState('');
  const [newSport, setNewSport] = useState(SPORTS[0]);
  const [newDuration, setNewDuration] = useState('');
  const [newIntensity, setNewIntensity] = useState('Low');

  // useState #11: true while the POST request is being sent
  const [submitting, setSubmitting] = useState(false);

  // useState #12: true while the user is pull-to-refreshing the list
  const [refreshing, setRefreshing] = useState(false);

  // useState #13: holds a short success message shown briefly after Add succeeds
  const [toastMessage, setToastMessage] = useState('');

  // Fetches exercises from MockAPI. On success, saves a copy to AsyncStorage.
  // On failure, tries to load the last saved copy from AsyncStorage instead
  // of just showing a dead-end error.
  const fetchWarmups = async () => {
    setLoading(true);
    setError(null);
    setIsOffline(false);

    try {
      const response = await axios.get(API_URL);
      setWarmups(response.data);
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(response.data));
    } catch (err) {
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

  // Loads the saved list of favorite exercise ids from AsyncStorage
  const loadFavorites = async () => {
    try {
      const saved = await AsyncStorage.getItem(FAVORITES_KEY);
      setFavoriteIds(saved ? JSON.parse(saved) : []);
    } catch (err) {
      setFavoriteIds([]);
    }
  };

  // Re-fetches every time this screen comes into focus (e.g. returning from Detail)
  useFocusEffect(
    useCallback(() => {
      fetchWarmups();
      loadFavorites();
    }, [])
  );

  // Called when the user pulls down on the list to manually refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchWarmups();
    setRefreshing(false);
  };

  // Adds or removes an exercise id from the favorites list, saving the
  // result to AsyncStorage so it survives an app restart.
  const toggleFavorite = (id) => {
    const updated = favoriteIds.includes(id)
      ? favoriteIds.filter(favId => favId !== id)
      : [...favoriteIds, id];

    setFavoriteIds(updated);
    AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updated)).catch(() => {});
  };

  // Shows a short success message for 2 seconds, then hides it
  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(''), 2000);
  };

  // Resets the Add form back to its defaults
  const resetForm = () => {
    setNewExercise('');
    setNewSport(SPORTS[0]);
    setNewDuration('');
    setNewIntensity('Low');
  };

  // Sends the new exercise to MockAPI, then closes the modal and refreshes the list
  const handleAddExercise = () => {
    if (!newExercise.trim() || !newDuration.trim()) {
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
        resetForm();
        setModalVisible(false);
        fetchWarmups();
        showToast('Exercise added!');
      })
      .catch(err => {
        setError('Could not add exercise. Try again.');
      })
      .finally(() => setSubmitting(false));
  };

  const filteredWarmups = warmups
    .filter(item => selectedSport === 'All' || item.sport === selectedSport)
    .filter(item => item.exercise.toLowerCase().includes(searchText.toLowerCase()))
    .filter(item => !showFavoritesOnly || favoriteIds.includes(item.id));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.header, { color: colors.text }]}>WarmUp Buddy</Text>
          <Text style={[styles.subheader, { color: colors.subtext }]}>
            Pick a sport, do the routine, avoid injury.
          </Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Success toast — shows briefly after adding an exercise */}
      {!!toastMessage && (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      {/* Offline banner — shown when live fetch failed but cached data is available */}
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineBannerText}>You're offline — showing saved data.</Text>
        </View>
      )}

      {/* Search bar */}
      <TextInput
        style={[styles.searchInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
        placeholder="🔍 Search exercises..."
        placeholderTextColor={colors.subtext}
        value={searchText}
        onChangeText={setSearchText}
        clearButtonMode="while-editing"
      />

      {/* Filter chips + Favorites toggle */}
      <View style={styles.chipRow}>
        {['All', ...SPORTS].map(sport => (
          <TouchableOpacity
            key={sport}
            style={[styles.chip, { backgroundColor: colors.chipBg }, selectedSport === sport && styles.chipActive]}
            onPress={() => setSelectedSport(sport)}
          >
            <Text style={[styles.chipText, { color: colors.text }, selectedSport === sport && styles.chipTextActive]}>
              {sport === 'All' ? sport : `${SPORT_ICONS[sport] || ''} ${sport}`}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[styles.chip, { backgroundColor: colors.chipBg }, showFavoritesOnly && styles.favChipActive]}
          onPress={() => setShowFavoritesOnly(!showFavoritesOnly)}
        >
          <Text style={[styles.chipText, { color: colors.text }, showFavoritesOnly && styles.chipTextActive]}>
            {showFavoritesOnly ? '★' : '☆'} Favorites
          </Text>
        </TouchableOpacity>
      </View>

      {/* Loading state */}
      {loading && (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={[styles.centerText, { color: colors.subtext }]}>Loading exercises...</Text>
        </View>
      )}

      {/* Error state */}
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
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#2563eb']} />
          }
          renderItem={({ item }) => {
            const isFavorite = favoriteIds.includes(item.id);
            return (
              <TouchableOpacity
                style={[styles.card, { backgroundColor: colors.card }]}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('Detail', { exercise: item })}
              >
                <View style={styles.cardHeader}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>
                    {item.iCompleted ? '✓ ' : ''}{SPORT_ICONS[item.sport] || '💪'} {item.exercise}
                  </Text>
                  <TouchableOpacity
                    onPress={(e) => { e.stopPropagation && e.stopPropagation(); toggleFavorite(item.id); }}
                    style={styles.starButton}
                  >
                    <Text style={styles.starIcon}>{isFavorite ? '★' : '☆'}</Text>
                  </TouchableOpacity>
                  <View style={[styles.badge, { backgroundColor: (INTENSITY_COLORS[item.intensity] || '#2563eb') + '22' }]}>
                    <Text style={[styles.badgeText, { color: INTENSITY_COLORS[item.intensity] || '#2563eb' }]}>
                      {item.intensity}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.cardMeta, { color: colors.subtext }]}>{item.sport} · {item.duration}</Text>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.centerBox}>
              <Text style={styles.emptyEmoji}>🧘</Text>
              <Text style={[styles.centerText, { color: colors.subtext }]}>
                {showFavoritesOnly
                  ? 'No favorites yet — tap the star on an exercise.'
                  : searchText
                  ? `No exercises match "${searchText}".`
                  : 'No exercises found for this sport.'}
              </Text>
            </View>
          }
        />
      )}

      {/* Add Exercise modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>New Exercise</Text>

            <Text style={[styles.fieldLabel, { color: colors.subtext }]}>Exercise name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
              placeholder="e.g. Jogging in place"
              placeholderTextColor={colors.subtext}
              value={newExercise}
              onChangeText={setNewExercise}
            />

            <Text style={[styles.fieldLabel, { color: colors.subtext }]}>Sport</Text>
            <View style={styles.pickerRow}>
              {SPORTS.map(sport => (
                <TouchableOpacity
                  key={sport}
                  style={[styles.pickerChip, { backgroundColor: colors.chipBg }, newSport === sport && styles.pickerChipActive]}
                  onPress={() => setNewSport(sport)}
                >
                  <Text style={[styles.pickerChipText, { color: colors.text }, newSport === sport && styles.pickerChipTextActive]}>
                    {SPORT_ICONS[sport]} {sport}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.fieldLabel, { color: colors.subtext }]}>Duration</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
              placeholder="e.g. 2 min"
              placeholderTextColor={colors.subtext}
              value={newDuration}
              onChangeText={setNewDuration}
            />

            <Text style={[styles.fieldLabel, { color: colors.subtext }]}>Intensity</Text>
            <View style={styles.pickerRow}>
              {INTENSITY_LEVELS.map(level => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.pickerChip,
                    { backgroundColor: colors.chipBg },
                    newIntensity === level && { backgroundColor: INTENSITY_COLORS[level] },
                  ]}
                  onPress={() => setNewIntensity(level)}
                >
                  <Text style={[styles.pickerChipText, { color: colors.text }, newIntensity === level && styles.pickerChipTextActive]}>
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: colors.chipBg }]}
                onPress={() => { setModalVisible(false); resetForm(); }}
                disabled={submitting}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
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
  container: { flex: 1, padding: 16, paddingTop: 50 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  header: { fontSize: 26, fontWeight: '700' },
  subheader: { marginBottom: 14 },
  addButton: { backgroundColor: '#2563eb', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10 },
  addButtonText: { color: '#fff', fontWeight: '700' },
  offlineBanner: { backgroundColor: '#fef3c7', borderRadius: 10, padding: 10, marginBottom: 12 },
  offlineBannerText: { color: '#92400e', fontSize: 13, fontWeight: '500', textAlign: 'center' },
  toast: { backgroundColor: '#16a34a', borderRadius: 10, padding: 10, marginBottom: 12 },
  toastText: { color: '#fff', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  searchInput: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 14, fontSize: 15 },
  chip: { paddingVertical: 7, paddingHorizontal: 14, borderRadius: 20 },
  chipActive: { backgroundColor: '#2563eb' },
  favChipActive: { backgroundColor: '#d97706' },
  chipText: { fontWeight: '500' },
  chipTextActive: { color: '#fff' },
  card: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '700', flex: 1, marginRight: 6 },
  starButton: { paddingHorizontal: 4 },
  starIcon: { fontSize: 20, color: '#d97706' },
  cardMeta: { marginTop: 4, fontSize: 13 },
  badge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 40 },
  emptyEmoji: { fontSize: 36, marginBottom: 8 },
  centerText: { marginTop: 10 },
  errorText: { color: '#dc2626', textAlign: 'center', marginBottom: 12 },
  retryButton: { backgroundColor: '#2563eb', paddingVertical: 8, paddingHorizontal: 20, borderRadius: 10 },
  retryButtonText: { color: '#fff', fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalBox: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 22, maxHeight: '85%' },
  modalTitle: { fontSize: 19, fontWeight: '700', marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 6 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 4 },
  pickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  pickerChip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 },
  pickerChipActive: { backgroundColor: '#2563eb' },
  pickerChipText: { fontWeight: '600', fontSize: 13 },
  pickerChipTextActive: { color: '#fff' },
  modalButtonRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 18 },
  cancelButton: { paddingVertical: 11, paddingHorizontal: 18, borderRadius: 10 },
  cancelButtonText: { fontWeight: '600' },
  saveButton: { paddingVertical: 11, paddingHorizontal: 22, borderRadius: 10, backgroundColor: '#2563eb', minWidth: 80, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontWeight: '700' },
});