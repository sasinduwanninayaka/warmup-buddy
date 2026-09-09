// src/screens/DetailScreen.js
import { useState } from 'react';
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
import { API_URL } from '../api/config';

export default function DetailScreen({ route, navigation }) {
  const { exercise: initialExercise } = route.params;

  // useState #1: holds the current exercise data. Starts from what was passed
  // in via navigation, but gets replaced after a successful Edit so the
  // screen shows the latest saved values without needing to go back and forth.
  const [exercise, setExercise] = useState(initialExercise);

  // useState #2: tracks whether this exercise is marked done.
  const [completed, setCompleted] = useState(initialExercise.iCompleted || false);

  // useState #3/#4: loading flags for the two PUT-based actions
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // useState #5: controls the Edit modal visibility
  const [editVisible, setEditVisible] = useState(false);

  // useState #6-9: the editable form fields, pre-filled from the current exercise
  const [editExercise, setEditExercise] = useState(exercise.exercise);
  const [editSport, setEditSport] = useState(exercise.sport);
  const [editDuration, setEditDuration] = useState(exercise.duration);
  const [editIntensity, setEditIntensity] = useState(exercise.intensity);

  // useState #10: true while the Edit PUT request is in flight
  const [savingEdit, setSavingEdit] = useState(false);

  // Toggles "completed" and PUTs the new value back to MockAPI.
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
        console.log('Update error:', err.message);
        Alert.alert('Error', 'Could not update this exercise. Check your connection.');
      })
      .finally(() => setUpdating(false));
  };

  // Opens the edit form, pre-filled with current values
  const openEditModal = () => {
    setEditExercise(exercise.exercise);
    setEditSport(exercise.sport);
    setEditDuration(exercise.duration);
    setEditIntensity(exercise.intensity);
    setEditVisible(true);
  };

  // Sends the edited fields to MockAPI via PUT, updates this screen's state
  const handleSaveEdit = () => {
    if (!editExercise.trim() || !editSport.trim()) {
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
      })
      .catch(err => {
        console.log('Edit error:', err.message);
        Alert.alert('Error', 'Could not save changes. Check your connection.');
      })
      .finally(() => setSavingEdit(false));
  };

  // Confirms, then DELETEs this exercise from MockAPI and navigates back.
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
                console.log('Delete error:', err.message);
                Alert.alert('Error', 'Could not delete this exercise. Check your connection.');
                setDeleting(false);
              });
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{exercise.exercise}</Text>
        <TouchableOpacity style={styles.editIconButton} onPress={openEditModal}>
          <Text style={styles.editIconText}>Edit</Text>
        </TouchableOpacity>
      </View>
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

      {!!exercise.description && (
        <Text style={styles.description}>{exercise.description}</Text>
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
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Edit Exercise</Text>

            <TextInput style={styles.input} placeholder="Exercise name" value={editExercise} onChangeText={setEditExercise} />
            <TextInput style={styles.input} placeholder="Sport" value={editSport} onChangeText={setEditSport} />
            <TextInput style={styles.input} placeholder="Duration" value={editDuration} onChangeText={setEditDuration} />
            <TextInput style={styles.input} placeholder="Intensity" value={editIntensity} onChangeText={setEditIntensity} />

            <View style={styles.modalButtonRow}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setEditVisible(false)} disabled={savingEdit}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
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
  container: { flex: 1, padding: 20, paddingTop: 40, backgroundColor: '#fff' },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '700', flex: 1 },
  editIconButton: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#eef2ff' },
  editIconText: { color: '#2563eb', fontWeight: '600' },
  sport: { color: '#666', marginBottom: 20 },
  metaRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  metaBox: { backgroundColor: '#f5f6fa', borderRadius: 10, padding: 12, flex: 1 },
  metaLabel: { fontSize: 12, color: '#888' },
  metaValue: { fontSize: 16, fontWeight: '600', marginTop: 2 },
  description: { fontSize: 15, lineHeight: 22, color: '#333', marginBottom: 30 },
  button: { backgroundColor: '#2563eb', padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  buttonDone: { backgroundColor: '#16a34a' },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  deleteButton: { padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 12, borderWidth: 1, borderColor: '#dc2626' },
  deleteButtonText: { color: '#dc2626', fontWeight: '600', fontSize: 15 },
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