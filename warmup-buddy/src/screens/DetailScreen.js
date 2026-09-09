// src/screens/DetailScreen.js
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../api/config';
import { SPORTS } from '../data/warmups';
import { useTheme } from '../theme/ThemeContext';

const FAVORITES_KEY = 'favorite_exercise_ids';
const INTENSITY_LEVELS = ['Low', 'Medium', 'High'];
const SPORT_ICONS = { Football: '⚽', Badminton: '🏸', Basketball: '🏀', Running: '🏃' };
const INTENSITY_COLORS = { Low: '#16a34a', Medium: '#d97706', High: '#dc2626' };

export default function DetailScreen({ route, navigation }) {
  const { colors } = useTheme();
  const { exercise: initialExercise } = route.params;

  // useState #1: holds the current exercise data, replaced after a successful Edit
  const [exercise, setExercise] = useState(initialExercise);

  // useState #2: tracks whether this exercise is marked done.
  const [completed, setCompleted] = useState(initialExercise.iCompleted || false);

  // useState #3/#4: loading flags for the two PUT-based actions
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // useState #5: controls the Edit modal visibility
  const [editVisible, setEditVisible] = useState(false);

  // useState #6-9: the editable form fields, pre-filled from the current exercise.
  const [editExercise, setEditExercise] = useState(exercise.exercise);
  const [editSport, setEditSport] = useState(exercise.sport);
  const [editDuration, setEditDuration] = useState(exercise.duration);
  const [editIntensity, setEditIntensity] = useState(exercise.intensity);

  // useState #10: true while the Edit PUT request is in flight
  const [savingEdit, setSavingEdit] = useState(false);

  // useState #11: whether this exercise is in the user's favorites
  const [isFavorite, setIsFavorite] = useState(false);

  // Loads the favorite status for this exercise from AsyncStorage on mount
  useEffect(() => {
    AsyncStorage.getItem(FAVORITES_KEY)
      .then(saved => {
        const ids = saved ? JSON.parse(saved) : [];
        setIsFavorite(ids.includes(exercise.id));
      })
      .catch(() => {});
  }, []);

  // Toggles this exercise's favorite status and saves it back to AsyncStorage
  const toggleFavorite = async () => {
    try {
      const saved = await AsyncStorage.getItem(FAVORITES_KEY);
      const ids = saved ? JSON.parse(saved) : [];
      const updated = ids.includes(exercise.id)
        ? ids.filter(id => id !== exercise.id)
        : [...ids, exercise.id];

      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
      setIsFavorite(!isFavorite);
    } catch (err) {
      // Silently ignore — favoriting is a non-critical nice-to-have
    }
  };

  const handleToggleComplete = () => {
    const newValue = !completed;
    setUpdating(true);

    axios
      .put(`${API_URL}/${exercise.id}`, { ...exercise, iCompleted: newValue })
      .then(() => {
        setCompleted(newValue);
        setExercise(prev => ({ ...prev, iCompleted: newValue }));
      })
      .catch(err => {
        Alert.alert('Error', 'Could not update this exercise. Check your connection.');
      })
      .finally(() => setUpdating(false));
  };

  const openEditModal = () => {
    setEditExercise(exercise.exercise);
    setEditSport(exercise.sport);
    setEditDuration(exercise.duration);
    setEditIntensity(exercise.intensity);
    setEditVisible(true);
  };

  const handleSaveEdit = () => {
    if (!editExercise.trim() || !editDuration.trim()) {
      return;
    }

    setSavingEdit(true);

    const updated = {
      ...exercise,
      exercise: editExercise,
      sport: editSport,
      duration: editDuration,
      intensity: editIntensity,
    };

    axios
      .put(`${API_URL}/${exercise.id}`, updated)
      .then(() => {
        setExercise(updated);
        setEditVisible(false);
        Alert.alert('Saved', 'Exercise updated successfully.');
      })
      .catch(err => {
        Alert.alert('Error', 'Could not save changes. Check your connection.');
      })
      .finally(() => setSavingEdit(false));
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete exercise?',
      `This will permanently remove "${exercise.exercise}".`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setDeleting(true);
            axios
              .delete(`${API_URL}/${exercise.id}`)
              .then(() => navigation.goBack())
              .catch(err => {
                Alert.alert('Error', 'Could not delete this exercise. Check your connection.');
                setDeleting(false);
              });
          },
        },
      ]
    );
  };

  const intensityColor = INTENSITY_COLORS[exercise.intensity] || '#2563eb';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.titleRow}>
        <Text style={[styles.title, { color: colors.text }]}>
          {SPORT_ICONS[exercise.sport] || '💪'} {exercise.exercise}
        </Text>
        <TouchableOpacity onPress={toggleFavorite} style={styles.starButton}>
          <Text style={styles.starIcon}>{isFavorite ? '★' : '☆'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.editIconButton} onPress={openEditModal}>
          <Text style={styles.editIconText}>Edit</Text>
        </TouchableOpacity>
      </View>
      <Text style={[styles.sport, { color: colors.subtext }]}>{exercise.sport} warm-up</Text>

      <View style={styles.metaRow}>
        <View style={[styles.metaBox, { backgroundColor: colors.card }]}>
          <Text style={[styles.metaLabel, { color: colors.subtext }]}>Duration</Text>
          <Text style={[styles.metaValue, { color: colors.text }]}>{exercise.duration}</Text>
        </View>
        <View style={[styles.metaBox, { backgroundColor: intensityColor + '15' }]}>
          <Text style={[styles.metaLabel, { color: colors.subtext }]}>Intensity</Text>
          <Text style={[styles.metaValue, { color: intensityColor }]}>{exercise.intensity}</Text>
        </View>
      </View>

      {!!exercise.description && (
        <Text style={[styles.description, { color: colors.text }]}>{exercise.description}</Text>
      )}

      <TouchableOpacity
        style={[styles.button, completed && styles.buttonDone]}
        onPress={handleToggleComplete}
        disabled={updating}
      >
        {updating ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>
            {completed ? '✓ Marked as Done' : 'Mark as Done'}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteButton} onPress={handleDelete} disabled={deleting}>
        {deleting ? (
          <ActivityIndicator color="#dc2626" />
        ) : (
          <Text style={styles.deleteButtonText}>Delete Exercise</Text>
        )}
      </TouchableOpacity>

      {/* Edit modal */}
      <Modal visible={editVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Exercise</Text>

            <Text style={[styles.fieldLabel, { color: colors.subtext }]}>Exercise name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
              value={editExercise}
              onChangeText={setEditExercise}
            />

            <Text style={[styles.fieldLabel, { color: colors.subtext }]}>Sport</Text>
            <View style={styles.pickerRow}>
              {SPORTS.map(sport => (
                <TouchableOpacity
                  key={sport}
                  style={[styles.pickerChip, { backgroundColor: colors.chipBg }, editSport === sport && styles.pickerChipActive]}
                  onPress={() => setEditSport(sport)}
                >
                  <Text style={[styles.pickerChipText, { color: colors.text }, editSport === sport && styles.pickerChipTextActive]}>
                    {SPORT_ICONS[sport]} {sport}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.fieldLabel, { color: colors.subtext }]}>Duration</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
              value={editDuration}
              onChangeText={setEditDuration}
            />

            <Text style={[styles.fieldLabel, { color: colors.subtext }]}>Intensity</Text>
            <View style={styles.pickerRow}>
              {INTENSITY_LEVELS.map(level => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.pickerChip,
                    { backgroundColor: colors.chipBg },
                    editIntensity === level && { backgroundColor: INTENSITY_COLORS[level] },
                  ]}
                  onPress={() => setEditIntensity(level)}
                >
                  <Text style={[styles.pickerChipText, { color: colors.text }, editIntensity === level && styles.pickerChipTextActive]}>
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtonRow}>
              <TouchableOpacity style={[styles.cancelButton, { backgroundColor: colors.chipBg }]} onPress={() => setEditVisible(false)} disabled={savingEdit}>
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveEdit} disabled={savingEdit}>
                {savingEdit ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 40 },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '700', flex: 1 },
  starButton: { paddingHorizontal: 6 },
  starIcon: { fontSize: 24, color: '#d97706' },
  editIconButton: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 10, backgroundColor: '#eef2ff' },
  editIconText: { color: '#2563eb', fontWeight: '700' },
  sport: { marginBottom: 20, marginTop: 4 },
  metaRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  metaBox: { borderRadius: 12, padding: 14, flex: 1 },
  metaLabel: { fontSize: 12 },
  metaValue: { fontSize: 17, fontWeight: '700', marginTop: 2 },
  description: { fontSize: 15, lineHeight: 22, marginBottom: 30 },
  button: { backgroundColor: '#2563eb', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  buttonDone: { backgroundColor: '#16a34a' },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  deleteButton: { padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 12, borderWidth: 1.5, borderColor: '#dc2626' },
  deleteButtonText: { color: '#dc2626', fontWeight: '700', fontSize: 15 },
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