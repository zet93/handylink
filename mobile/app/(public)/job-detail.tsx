import { useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import BottomSheet from '@gorhom/bottom-sheet';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import AuthPromptSheet from '../../components/AuthPromptSheet';

const GATED_STATUSES = ['open', 'bidding'];

export default function PublicJobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const sheetRef = useRef<BottomSheet>(null);

  const { data: job, isLoading } = useQuery({
    queryKey: ['public-job', id],
    queryFn: async () => {
      const res = await api.get(`/api/jobs/${id}`);
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

  if (!job) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>Job not found.</Text>
      </View>
    );
  }

  const showBidButton = GATED_STATUSES.includes(job.status?.toLowerCase());

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>{job.title}</Text>

        <View style={styles.metaRow}>
          {job.city ? <Text style={styles.metaText}>{job.city}</Text> : null}
          {job.country ? <Text style={styles.metaText}>{job.country}</Text> : null}
          {job.category ? <Text style={styles.metaText}>{job.category}</Text> : null}
        </View>

        <View style={styles.budgetRow}>
          {job.budgetMin ? <Text style={styles.budget}>From {job.budgetMin} RON</Text> : null}
          {job.budgetMax ? <Text style={styles.budget}>Up to {job.budgetMax} RON</Text> : null}
        </View>

        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{job.status}</Text>
        </View>

        {job.description ? (
          <Text style={styles.description}>{job.description}</Text>
        ) : null}

        {showBidButton ? (
          <TouchableOpacity style={styles.bidButton} onPress={() => sheetRef.current?.expand()}>
            <Text style={styles.bidButtonText}>Submit a Bid</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>

      <AuthPromptSheet ref={sheetRef} returnTo={`/(public)/job-detail?id=${id}`} />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  notFound: { color: '#888', fontSize: 15 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#111', marginBottom: 12 },
  metaRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginBottom: 8 },
  metaText: { fontSize: 13, color: '#888' },
  budgetRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  budget: { fontSize: 14, color: '#374151', fontWeight: '600' },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#DBEAFE',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 16,
  },
  statusText: { fontSize: 12, color: '#1D4ED8', fontWeight: '600' },
  description: { fontSize: 15, color: '#374151', lineHeight: 22, marginBottom: 24 },
  bidButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    minHeight: 44,
  },
  bidButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
