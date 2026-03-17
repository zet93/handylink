import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  open: { bg: '#DBEAFE', text: '#1D4ED8' },
  bidding: { bg: '#FEF3C7', text: '#D97706' },
  accepted: { bg: '#D1FAE5', text: '#065F46' },
  in_progress: { bg: '#E0E7FF', text: '#3730A3' },
  completed: { bg: '#F3F4F6', text: '#374151' },
  cancelled: { bg: '#FEE2E2', text: '#DC2626' },
};

const BID_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: '#F3F4F6', text: '#374151' },
  accepted: { bg: '#D1FAE5', text: '#065F46' },
  rejected: { bg: '#FEE2E2', text: '#DC2626' },
};

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: job, isLoading } = useQuery({
    queryKey: ['job', id],
    queryFn: () => api.get(`/api/jobs/${id}`).then(r => r.data),
  });

  const { data: bids = [] } = useQuery({
    queryKey: ['bids', id],
    queryFn: () => api.get(`/api/jobs/${id}/bids`).then(r => r.data),
    enabled: !!job,
  });

  const accept = useMutation({
    mutationFn: (bidId: string) => api.patch(`/api/bids/${bidId}/accept`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', id] });
      queryClient.invalidateQueries({ queryKey: ['bids', id] });
    },
    onError: () => Alert.alert('Error', 'Failed to accept bid.'),
  });

  const reject = useMutation({
    mutationFn: (bidId: string) => api.patch(`/api/bids/${bidId}/reject`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bids', id] });
    },
    onError: () => Alert.alert('Error', 'Failed to reject bid.'),
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

  const jobColors = STATUS_COLORS[job.status] ?? { bg: '#F3F4F6', text: '#374151' };
  const canAct = job.status === 'open' || job.status === 'bidding';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.jobCard}>
        <View style={styles.jobHeader}>
          <Text style={styles.jobTitle}>{job.title}</Text>
          <View style={[styles.badge, { backgroundColor: jobColors.bg }]}>
            <Text style={[styles.badgeText, { color: jobColors.text }]}>
              {job.status.replace('_', ' ')}
            </Text>
          </View>
        </View>
        {job.description ? (
          <Text style={styles.description}>{job.description}</Text>
        ) : null}
        <View style={styles.metaGrid}>
          {job.city ? <Text style={styles.meta}>Location: {job.city}</Text> : null}
          {job.category ? <Text style={styles.meta}>Category: {job.category}</Text> : null}
          {job.budgetMin ? <Text style={styles.meta}>Min: {job.budgetMin} RON</Text> : null}
          {job.budgetMax ? <Text style={styles.meta}>Max: {job.budgetMax} RON</Text> : null}
          <Text style={styles.meta}>
            Posted: {new Date(job.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Bids ({bids.length})</Text>

      {bids.length === 0 ? (
        <Text style={styles.emptyText}>No bids yet.</Text>
      ) : (
        bids.map((bid: any) => {
          const bidColors = BID_STATUS_COLORS[bid.status] ?? BID_STATUS_COLORS.pending;
          return (
            <View key={bid.id} style={styles.bidCard}>
              <View style={styles.bidHeader}>
                <View>
                  <Text style={styles.bidWorker}>
                    Worker: {bid.workerId?.slice(0, 8) ?? 'Unknown'}...
                  </Text>
                  <Text style={styles.bidPrice}>{bid.priceEstimate} RON</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: bidColors.bg }]}>
                  <Text style={[styles.badgeText, { color: bidColors.text }]}>
                    {bid.status}
                  </Text>
                </View>
              </View>
              {bid.message ? <Text style={styles.bidMessage}>{bid.message}</Text> : null}
              {canAct && bid.status === 'pending' ? (
                <View style={styles.bidActions}>
                  <TouchableOpacity
                    style={styles.acceptBtn}
                    onPress={() => accept.mutate(bid.id)}
                    disabled={accept.isPending || reject.isPending}
                  >
                    <Text style={styles.acceptText}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.rejectBtn}
                    onPress={() => reject.mutate(bid.id)}
                    disabled={accept.isPending || reject.isPending}
                  >
                    <Text style={styles.rejectText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 16, paddingBottom: 48 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  notFound: { color: '#888', fontSize: 16 },
  jobCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  jobHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  jobTitle: { fontSize: 20, fontWeight: 'bold', color: '#111', flex: 1, marginRight: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  badgeText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  description: { fontSize: 14, color: '#555', lineHeight: 20, marginBottom: 12 },
  metaGrid: { gap: 4 },
  meta: { fontSize: 13, color: '#666' },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#111', marginBottom: 12 },
  emptyText: { color: '#888', fontSize: 14, marginBottom: 20 },
  bidCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  bidHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  bidWorker: { fontSize: 13, color: '#555', marginBottom: 2 },
  bidPrice: { fontSize: 18, fontWeight: 'bold', color: '#007AFF' },
  bidMessage: { fontSize: 13, color: '#666', marginBottom: 10 },
  bidActions: { flexDirection: 'row', gap: 10 },
  acceptBtn: {
    backgroundColor: '#16A34A',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  acceptText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  rejectBtn: {
    borderWidth: 1,
    borderColor: '#DC2626',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  rejectText: { color: '#DC2626', fontWeight: '600', fontSize: 14 },
});
