// src/screens/DetailScreen.js
import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function DetailScreen({ route }) {
  const { exercise } = route.params;

  // useState #2: tracks whether the user has marked this exercise as done.
  // Local to this screen -- resets each time you navigate back in and out,
  // which is intentional: each warm-up session should start fresh.
  const [completed, setCompleted] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{exercise.exercise}</Text>
      <Text style={styles.sport}>{exercise.sport} warm-up</Text>

      <View style={styles.metaRow}>
        <View style={styles.metaBox}>
          <Text style={styles.metaLabel}>Duration</Text>
          <Text style={styles.metaValue}>{exercise.duration}</Text>
        </View>
        <View style={styles.metaBox}>
          <Text style={styles.metaLabel}>Intensity</Text>
          <Text style={styles.metaValue}>{exercise.intensity}</Text>
        </View>
      </View>

      <Text style={styles.description}>{exercise.description}</Text>

      <TouchableOpacity
        style={[styles.button, completed && styles.buttonDone]}
        onPress={() => setCompleted(!completed)}
      >
        <Text style={styles.buttonText}>
          {completed ? '✓ Marked as Done' : 'Mark as Done'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 40, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: '700' },
  sport: { color: '#666', marginBottom: 20 },
  metaRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  metaBox: { backgroundColor: '#f5f6fa', borderRadius: 10, padding: 12, flex: 1 },
  metaLabel: { fontSize: 12, color: '#888' },
  metaValue: { fontSize: 16, fontWeight: '600', marginTop: 2 },
  description: { fontSize: 15, lineHeight: 22, color: '#333', marginBottom: 30 },
  button: { backgroundColor: '#2563eb', padding: 14, borderRadius: 10, alignItems: 'center' },
  buttonDone: { backgroundColor: '#16a34a' },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
