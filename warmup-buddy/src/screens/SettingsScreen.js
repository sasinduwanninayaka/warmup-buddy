// src/screens/SettingsScreen.js
import { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, Switch, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/ThemeContext';

const NAME_KEY = 'settings_name';
const REMINDERS_KEY = 'settings_reminders';
const CACHE_KEY = 'cached_exercises';
const FAVORITES_KEY = 'favorite_exercise_ids';

export default function SettingsScreen() {
  const { colors, isDark, toggleDark } = useTheme();

  // useState #1: controls the text input value.
  const [name, setName] = useState('');

  // useState #2: controls the reminder toggle.
  const [remindersOn, setRemindersOn] = useState(true);

  // useState #3: true while we're loading saved settings on first mount
  const [loading, setLoading] = useState(true);

  // useState #4/#5: a small stats summary — total exercises and how many are done.
  const [totalCount, setTotalCount] = useState(0);
  const [doneCount, setDoneCount] = useState(0);

  // useState #6: how many exercises are currently favorited
  const [favoriteCount, setFavoriteCount] = useState(0);

  // useState #7: true while clearing the cached exercise data
  const [clearing, setClearing] = useState(false);

  // On first mount, load any previously saved settings from AsyncStorage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedName = await AsyncStorage.getItem(NAME_KEY);
        const savedReminders = await AsyncStorage.getItem(REMINDERS_KEY);
        if (savedName !== null) setName(savedName);
        if (savedReminders !== null) setRemindersOn(savedReminders === 'true');
      } catch (err) {
        // Nothing saved yet — defaults are fine
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  // Recomputes the stats every time this screen is focused
  useFocusEffect(
    useCallback(() => {
      const loadStats = async () => {
        try {
          const cached = await AsyncStorage.getItem(CACHE_KEY);
          if (cached) {
            const list = JSON.parse(cached);
            setTotalCount(list.length);
            setDoneCount(list.filter(item => item.iCompleted).length);
          }
          const favs = await AsyncStorage.getItem(FAVORITES_KEY);
          setFavoriteCount(favs ? JSON.parse(favs).length : 0);
        } catch (err) {
          // No cached data yet — leave stats at 0
        }
      };
      loadStats();
    }, [])
  );

  const handleNameChange = (text) => {
    setName(text);
    AsyncStorage.setItem(NAME_KEY, text).catch(() => {});
  };

  const handleRemindersChange = (value) => {
    setRemindersOn(value);
    AsyncStorage.setItem(REMINDERS_KEY, value.toString()).catch(() => {});
  };

  // Clears the locally cached exercise list (does not touch MockAPI data).
  const handleClearCache = () => {
    Alert.alert(
      'Clear saved data?',
      'This removes the offline copy of your exercises from this phone. Your MockAPI data is not affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            setClearing(true);
            await AsyncStorage.removeItem(CACHE_KEY);
            setTotalCount(0);
            setDoneCount(0);
            setClearing(false);
            Alert.alert('Done', 'Offline cache cleared.');
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.header, { color: colors.text }]}>Settings</Text>

      {/* Stats card */}
      <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{totalCount}</Text>
          <Text style={[styles.statLabel, { color: colors.subtext }]}>Total</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: '#16a34a' }]}>{doneCount}</Text>
          <Text style={[styles.statLabel, { color: colors.subtext }]}>Completed</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: '#d97706' }]}>{favoriteCount}</Text>
          <Text style={[styles.statLabel, { color: colors.subtext }]}>Favorites</Text>
        </View>
      </View>

      <Text style={[styles.sectionLabel, { color: colors.subtext }]}>Profile</Text>
      <Text style={[styles.label, { color: colors.text }]}>Your name</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
        placeholder="Enter your name"
        placeholderTextColor={colors.subtext}
        value={name}
        onChangeText={handleNameChange}
      />

      <View style={styles.row}>
        <Text style={[styles.label, { color: colors.text }]}>Warm-up reminders</Text>
        <Switch value={remindersOn} onValueChange={handleRemindersChange} trackColor={{ true: '#2563eb' }} />
      </View>

      {name.length > 0 && (
        <Text style={styles.greeting}>
          Hi {name}, {remindersOn ? "we'll remind you before training." : 'reminders are off.'}
        </Text>
      )}

      <Text style={[styles.sectionLabel, { color: colors.subtext }]}>Appearance</Text>
      <View style={styles.row}>
        <Text style={[styles.label, { color: colors.text }]}>Dark mode</Text>
        <Switch value={isDark} onValueChange={toggleDark} trackColor={{ true: '#2563eb' }} />
      </View>

      <Text style={[styles.sectionLabel, { color: colors.subtext }]}>Storage</Text>
      <TouchableOpacity style={styles.clearButton} onPress={handleClearCache} disabled={clearing}>
        {clearing ? (
          <ActivityIndicator color="#dc2626" />
        ) : (
          <Text style={styles.clearButtonText}>Clear Offline Cache</Text>
        )}
      </TouchableOpacity>

      <Text style={[styles.hint, { color: colors.subtext }]}>
        Your name, reminders, and dark mode are saved automatically and will still be here next time you open the app.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 50 },
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { fontSize: 26, fontWeight: '700', marginBottom: 20 },
  statsCard: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 18,
    marginBottom: 26,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statBox: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1 },
  statNumber: { fontSize: 24, fontWeight: '800', color: '#2563eb' },
  statLabel: { fontSize: 11, marginTop: 4 },
  sectionLabel: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', marginBottom: 10, marginTop: 4 },
  label: { fontSize: 15, fontWeight: '500', marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  greeting: { marginTop: -6, marginBottom: 20, color: '#2563eb', fontSize: 13 },
  clearButton: { padding: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1.5, borderColor: '#dc2626', marginBottom: 20 },
  clearButtonText: { color: '#dc2626', fontWeight: '700' },
  hint: { fontSize: 12, fontStyle: 'italic' },
});