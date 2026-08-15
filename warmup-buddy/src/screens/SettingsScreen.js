// src/screens/SettingsScreen.js
import { useState } from 'react';
import { View, Text, TextInput, Switch, StyleSheet } from 'react-native';

export default function SettingsScreen() {
  // useState #3 (bonus, beyond the required 2): controls the text input value.
  const [name, setName] = useState('');

  // useState #4 (bonus): controls the reminder toggle.
  const [remindersOn, setRemindersOn] = useState(true);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Settings</Text>

      <Text style={styles.label}>Your name</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your name"
        value={name}
        onChangeText={setName}
      />

      <View style={styles.row}>
        <Text style={styles.label}>Warm-up reminders</Text>
        <Switch value={remindersOn} onValueChange={setRemindersOn} />
      </View>

      {name.length > 0 && (
        <Text style={styles.greeting}>
          Hi {name}, {remindersOn ? "we'll remind you before training." : "reminders are off."}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 50, backgroundColor: '#fff' },
  header: { fontSize: 26, fontWeight: '700', marginBottom: 20 },
  label: { fontSize: 15, fontWeight: '500', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, marginBottom: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  greeting: { marginTop: 10, color: '#2563eb' },
});
