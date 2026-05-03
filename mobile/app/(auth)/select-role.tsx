import { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../services/supabase';
import api from '../../services/api';

type Role = 'client' | 'worker' | 'both';

const ROLES: { value: Role; title: string; sub: string }[] = [
  { value: 'client', title: 'Get work done', sub: 'Post jobs, hire workers' },
  { value: 'worker', title: 'Find work', sub: 'Browse jobs, place bids' },
  { value: 'both', title: 'Both', sub: 'Post and find work' },
];

export default function SelectRoleScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<Role>('client');
  const [loading, setLoading] = useState(false);

  async function handleContinue() {
    setLoading(true);
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    if (!token) {
      setLoading(false);
      Alert.alert('Error', 'Session expired. Please sign in again.');
      router.replace('/(auth)/login');
      return;
    }
    try {
      await api.post('/api/users/me/role', { role: selected }, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      Alert.alert('Error', 'Could not save your role. Please try again.');
      setLoading(false);
      return;
    }
    setLoading(false);
    router.replace(selected === 'worker' ? '/(worker)/browse' : '/(client)');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Welcome to HandyLink</Text>
        <Text style={styles.subtitle}>How do you want to use HandyLink?</Text>

        {ROLES.map(({ value, title, sub }) => (
          <TouchableOpacity
            key={value}
            style={[styles.card, selected === value && styles.cardSelected]}
            onPress={() => setSelected(value)}
          >
            <Text style={[styles.cardTitle, selected === value && styles.cardTitleSelected]}>
              {title}
            </Text>
            <Text style={styles.cardSub}>{sub}</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Continue</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, padding: 24, paddingTop: 48 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#007AFF', marginBottom: 6 },
  subtitle: { fontSize: 15, color: '#666', marginBottom: 28 },
  card: {
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardSelected: { borderColor: '#007AFF', backgroundColor: '#EAF4FF' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 4 },
  cardTitleSelected: { color: '#007AFF' },
  cardSub: { fontSize: 13, color: '#888' },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
