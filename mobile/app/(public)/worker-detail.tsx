import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';

export default function PublicWorkerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: worker, isLoading } = useQuery({
    queryKey: ['public-worker', id],
    queryFn: async () => {
      const res = await api.get(`/api/workers/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!worker) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>Worker not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.name}>{worker.fullName ?? worker.full_name ?? 'Worker'}</Text>

      {worker.category ? (
        <Text style={styles.category}>{worker.category}</Text>
      ) : null}

      {worker.averageRating != null ? (
        <Text style={styles.rating}>Rating: {worker.averageRating.toFixed(1)} ({worker.reviewCount ?? 0} reviews)</Text>
      ) : null}

      {worker.bio ? (
        <Text style={styles.bio}>{worker.bio}</Text>
      ) : null}

      {Array.isArray(worker.skills) && worker.skills.length > 0 ? (
        <View style={styles.skillsSection}>
          <Text style={styles.sectionLabel}>Skills</Text>
          <View style={styles.skillsRow}>
            {worker.skills.map((skill: string, i: number) => (
              <View key={i} style={styles.skillBadge}>
                <Text style={styles.skillText}>{skill}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  notFound: { color: '#888', fontSize: 15 },
  name: { fontSize: 22, fontWeight: 'bold', color: '#111', marginBottom: 6 },
  category: { fontSize: 15, color: '#666', marginBottom: 6 },
  rating: { fontSize: 14, color: '#D97706', fontWeight: '600', marginBottom: 16 },
  bio: { fontSize: 15, color: '#374151', lineHeight: 22, marginBottom: 20 },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: '#111', marginBottom: 8 },
  skillsSection: { marginBottom: 20 },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillBadge: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  skillText: { fontSize: 13, color: '#374151' },
});
