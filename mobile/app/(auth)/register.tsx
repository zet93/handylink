import { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../services/supabase';
import api from '../../services/api';

type Role = 'client' | 'worker';

export default function RegisterScreen() {
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [city, setCity] = useState('');
  const [role, setRole] = useState<Role>('client');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!name || !email || !password || !city) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name, role } },
    });
    if (error) {
      setLoading(false);
      Alert.alert('Registration Failed', error.message);
      return;
    }
    try {
      await api.post('/api/users/register', { full_name: name, city, role });
    } catch {
      try {
        const userId = data.session?.user.id ?? data.user?.id;
        if (userId) {
          await supabase.from('profiles').insert({ user_id: userId, full_name: name, city, role });
        }
      } catch {
        // non-fatal
      }
    }
    setLoading(false);
    if (returnTo) {
      router.replace(returnTo as any);
    } else {
      router.replace(role === 'worker' ? '/(worker)/browse' : '/(client)');
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join HandyLink today</Text>

        <TextInput
          style={styles.input}
          placeholder="Full Name"
          placeholderTextColor="#999"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TextInput
          style={styles.input}
          placeholder="City"
          placeholderTextColor="#999"
          value={city}
          onChangeText={setCity}
          autoCapitalize="words"
        />

        <Text style={styles.roleLabel}>I want to...</Text>
        <View style={styles.roleRow}>
          <Pressable
            style={[styles.roleCard, role === 'client' && styles.roleCardSelected]}
            onPress={() => setRole('client')}
          >
            <Text style={[styles.roleCardTitle, role === 'client' && styles.roleCardTitleSelected]}>
              Get work done
            </Text>
            <Text style={styles.roleCardSub}>Post jobs, hire workers</Text>
          </Pressable>
          <Pressable
            style={[styles.roleCard, role === 'worker' && styles.roleCardSelected]}
            onPress={() => setRole('worker')}
          >
            <Text style={[styles.roleCardTitle, role === 'worker' && styles.roleCardTitleSelected]}>
              Find work
            </Text>
            <Text style={styles.roleCardSub}>Browse jobs, place bids</Text>
          </Pressable>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Create Account</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.link}>Already have an account? Sign In</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { padding: 24, paddingTop: 48 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#007AFF', marginBottom: 6 },
  subtitle: { fontSize: 15, color: '#666', marginBottom: 28 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111',
    marginBottom: 14,
  },
  roleLabel: { fontSize: 15, fontWeight: '600', color: '#111', marginBottom: 10 },
  roleRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  roleCard: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  roleCardSelected: { borderColor: '#007AFF', backgroundColor: '#EAF4FF' },
  roleCardTitle: { fontSize: 15, fontWeight: '700', color: '#333', marginBottom: 4 },
  roleCardTitleSelected: { color: '#007AFF' },
  roleCardSub: { fontSize: 12, color: '#888', textAlign: 'center' },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  link: { color: '#007AFF', textAlign: 'center', fontSize: 14 },
});
