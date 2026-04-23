import { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usePostHog } from 'posthog-react-native';
import api from '../../services/api';
import { palette, typography } from '../constants/design';
import LocationPickerMobile from '../../components/LocationPickerMobile';

const CATEGORIES = ['electrical', 'plumbing', 'painting', 'carpentry', 'cleaning', 'other'];

export default function PostJobScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const posthog = usePostHog();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('electrical');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [location, setLocation] = useState<{ latitude: number | null; longitude: number | null; address: string | null }>({ latitude: null, longitude: null, address: null });

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      api.post('/api/jobs', {
        title,
        description,
        city,
        country: 'RO',
        category,
        budgetMin: budgetMin ? Number(budgetMin) : null,
        budgetMax: budgetMax ? Number(budgetMax) : null,
        latitude: location.latitude ?? null,
        longitude: location.longitude ?? null,
        address: location.address ?? null,
      }),
    onSuccess: () => {
      posthog?.capture('job_posted', { category });
      queryClient.invalidateQueries({ queryKey: ['my-jobs'] });
      router.back();
    },
    onError: (err: any) => {
      Alert.alert('Error', err?.response?.data?.error ?? 'Failed to post job.');
    },
  });

  function handleSubmit() {
    if (!title.trim()) {
      Alert.alert('Error', 'Title is required.');
      return;
    }
    mutate();
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>Post a Job</Text>

        <Text style={styles.label}>Title *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Fix kitchen sink"
          placeholderTextColor="#999"
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe the work needed..."
          placeholderTextColor="#999"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
        />

        <Text style={styles.label}>City</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Bucharest"
          placeholderTextColor="#999"
          value={city}
          onChangeText={setCity}
          autoCapitalize="words"
        />

        <LocationPickerMobile
          latitude={location.latitude}
          longitude={location.longitude}
          address={location.address}
          onChange={setLocation}
        />

        <Text style={styles.label}>Category</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={category}
            onValueChange={setCategory}
            style={styles.picker}
          >
            {CATEGORIES.map(c => (
              <Picker.Item key={c} label={c.charAt(0).toUpperCase() + c.slice(1)} value={c} />
            ))}
          </Picker>
        </View>

        <View style={styles.budgetRow}>
          <View style={styles.budgetField}>
            <Text style={styles.label}>Budget Min</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor="#999"
              value={budgetMin}
              onChangeText={setBudgetMin}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.budgetField}>
            <Text style={styles.label}>Budget Max</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor="#999"
              value={budgetMax}
              onChangeText={setBudgetMax}
              keyboardType="numeric"
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, isPending && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={isPending}
        >
          {isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Post Job</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.background },
  container: { padding: 24, paddingBottom: 48, backgroundColor: palette.background },
  heading: { fontSize: typography.headingSize, fontWeight: 'bold', color: palette.text, marginBottom: 24 },
  label: { fontSize: 13, fontWeight: '600', color: palette.text, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: typography.bodySize,
    color: palette.text,
    marginBottom: 16,
    backgroundColor: palette.panel,
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 10,
    marginBottom: 16,
    overflow: 'hidden',
  },
  picker: { height: 50 },
  budgetRow: { flexDirection: 'row', gap: 12 },
  budgetField: { flex: 1 },
  button: {
    backgroundColor: palette.accent,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
