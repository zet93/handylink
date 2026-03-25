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
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../services/supabase';
import api from '../../services/api';

export default function WorkerProfileScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');

  const { data: profile, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('/api/users/me').then(r => r.data),
    onSuccess: (data: any) => {
      setName(data.fullName ?? data.full_name ?? '');
      setCity(data.city ?? '');
    },
  } as any);

  const { mutate: saveProfile, isPending: saving } = useMutation({
    mutationFn: () => api.put('/api/users/me', { full_name: name, city }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      setEditing(false);
    },
    onError: () => Alert.alert('Error', 'Failed to save profile.'),
  });

  const [connectLoading, setConnectLoading] = useState(false);

  async function handleConnectStripe() {
    setConnectLoading(true);
    try {
      const { data } = await api.post('/api/payments/connect-onboard');
      await Linking.openURL(data.onboardingUrl);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error ?? 'Failed to start Stripe onboarding.');
    } finally {
      setConnectLoading(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace('/(auth)/login');
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const displayName = profile?.fullName ?? profile?.full_name ?? name;
  const displayCity = profile?.city ?? city;
  const displayEmail = profile?.email ?? '';
  const displayRole = profile?.role ?? 'worker';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.heading}>Profile</Text>

        <View style={styles.card}>
          {editing ? (
            <>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
              <Text style={styles.label}>City</Text>
              <TextInput
                style={styles.input}
                value={city}
                onChangeText={setCity}
                autoCapitalize="words"
              />
              <View style={styles.row}>
                <TouchableOpacity
                  style={[styles.button, saving && styles.buttonDisabled]}
                  onPress={() => saveProfile()}
                  disabled={saving}
                >
                  {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditing(false)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Name</Text>
                <Text style={styles.infoValue}>{displayName || '—'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{displayEmail || '—'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>City</Text>
                <Text style={styles.infoValue}>{displayCity || '—'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Role</Text>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleBadgeText}>{displayRole}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => {
                  setName(displayName);
                  setCity(displayCity);
                  setEditing(true);
                }}
              >
                <Text style={styles.editBtnText}>Edit Profile</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <TouchableOpacity
          style={[styles.stripeBtn, connectLoading && styles.buttonDisabled]}
          onPress={handleConnectStripe}
          disabled={connectLoading}
        >
          {connectLoading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.stripeBtnText}>Connect to Stripe</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  container: { padding: 20, paddingBottom: 48 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  heading: { fontSize: 24, fontWeight: 'bold', color: '#111', marginBottom: 20 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 20,
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  infoLabel: { fontSize: 14, color: '#888' },
  infoValue: { fontSize: 14, color: '#111', fontWeight: '500' },
  roleBadge: { backgroundColor: '#D1FAE5', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  roleBadgeText: { fontSize: 12, color: '#065F46', fontWeight: '600', textTransform: 'capitalize' },
  editBtn: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  editBtnText: { color: '#007AFF', fontWeight: '600', fontSize: 15 },
  label: { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 6, marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111',
    marginBottom: 12,
  },
  row: { flexDirection: 'row', gap: 10 },
  button: { flex: 1, backgroundColor: '#007AFF', borderRadius: 10, paddingVertical: 11, alignItems: 'center' },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 10, paddingVertical: 11, alignItems: 'center' },
  cancelText: { color: '#555', fontSize: 15 },
  stripeBtn: {
    backgroundColor: '#4F46E5',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: 12,
  },
  stripeBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  signOutBtn: {
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DC2626',
  },
  signOutText: { color: '#DC2626', fontWeight: '600', fontSize: 15 },
});
