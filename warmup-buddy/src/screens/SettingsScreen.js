// src/screens/SettingsScreen.js
import { useState, useEffect } from 'react';
import { View, Text, TextInput, Switch, StyleSheet, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Keys used to save/load these two settings in AsyncStorage
const NAME_KEY = 'settings_name';
const REMINDERS_KEY = 'settings_reminders';

export default function SettingsScreen() {
  // useState #1: controls the text input value.
  const [name, setName] = useState('');

  // useState #2: controls the reminder toggle.
  const [remindersOn, setRemindersOn] = useState(true);

  // useState #3: true while we're loading saved settings on first mount
  const [loading, setLoading] = useState(true);

  // On first mount, load any previously saved settings from AsyncStorage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedName = await AsyncStorage.getItem(NAME_KEY);
        const savedReminders = await AsyncStorage.getItem(REMINDERS_KEY);

        if (savedName !== null) setName(savedName);
        if (savedReminders !== null) setRemindersOn(savedReminders === 'true');
      } catch (err) {
        console.log('Could not load settings:', err.message);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Saves the name to AsyncStorage every time it changes
  const handleNameChange = (text) => {
    setName(text);
    AsyncStorage.setItem(NAME_KEY, text).catch(err =>
      console.log('Could not save name:', err.message)
    );
  };

  // Saves the reminders toggle to AsyncStorage every time it changes
  const handleRemindersChange = (value) => {
    setRemindersOn(value);
    AsyncStorage.setItem(REMINDERS_KEY, value.toString()).catch(err =>
      console.log('Could not save reminders setting:', err.message)
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Settings</Text>

      <Text style={styles.label}>Your name</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your name"
        value={name}
        onChangeText={handleNameChange}
      />

      <View style={styles.row}>
        <Text style={styles.label}>Warm-up reminders</Text>
        <Switch value={remindersOn} onValueChange={handleRemindersChange} />
      </View>

      {name.length > 0 && (
        <Text style={styles.greeting}>
          Hi {name}, {remindersOn ? "we'll remind you before training." : "reminders are off."}
        </Text>
      )}

      <Text style={styles.hint}>
        These settings are saved automatically and will still be here next time you open the app.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 50, backgroundColor: '#fff' },
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  header: { fontSize: 26, fontWeight: '700', marginBottom: 20 },
  label: { fontSize: 15, fontWeight: '500', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, marginBottom: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  greeting: { marginTop: 10, color: '#2563eb' },
  hint: { marginTop: 30, fontSize: 12, color: '#999', fontStyle: 'italic' },
});