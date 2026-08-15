// src/screens/HomeScreen.js
import { useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { WARMUPS, SPORTS } from '../data/warmups';

export default function HomeScreen({ navigation }) {
  // useState #1: controls which sport filter is active.
  // 'All' shows every exercise; otherwise we filter by sport name.
  const [selectedSport, setSelectedSport] = useState('All');

  const filteredWarmups =
    selectedSport === 'All'
      ? WARMUPS
      : WARMUPS.filter(item => item.sport === selectedSport);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>WarmUp Buddy</Text>
      <Text style={styles.subheader}>Pick a sport, do the routine, avoid injury.</Text>

      {/* Filter chips */}
      <View style={styles.chipRow}>
        {['All', ...SPORTS].map(sport => (
          <TouchableOpacity
            key={sport}
            style={[styles.chip, selectedSport === sport && styles.chipActive]}
            onPress={() => setSelectedSport(sport)}
          >
            <Text style={[styles.chipText, selectedSport === sport && styles.chipTextActive]}>
              {sport}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

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
              <Text style={styles.cardTitle}>{item.exercise}</Text>
              <Text style={styles.badge}>{item.intensity}</Text>
            </View>
            <Text style={styles.cardMeta}>{item.sport} · {item.duration}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text>No exercises found for this sport.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingTop: 50, backgroundColor: '#fff' },
  header: { fontSize: 26, fontWeight: '700' },
  subheader: { color: '#666', marginBottom: 14 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, backgroundColor: '#eee' },
  chipActive: { backgroundColor: '#2563eb' },
  chipText: { color: '#333', fontWeight: '500' },
  chipTextActive: { color: '#fff' },
  card: { backgroundColor: '#f5f6fa', borderRadius: 12, padding: 14, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  cardMeta: { color: '#666', marginTop: 4 },
  badge: { fontSize: 12, color: '#2563eb', fontWeight: '600' },
});
