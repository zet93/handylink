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
import { useStripe } from '@stripe/stripe-react-native';
import api from '../../services/api';
import { palette, typography } from '../constants/design';
import JobMapMobile from '../../components/JobMapMobile';

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
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  async function handlePay() {
    try {
      const { data } = await api.post('/api/payments/create-intent', { jobId: id });
      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: data.clientSecret,
        merchantDisplayName: 'HandyLink',
      });
      if (initError) {
        Alert.alert('Error', initError.message);
        return;
      }
      const { error } = await presentPaymentSheet();
      if (error) {
        Alert.alert('Payment failed', error.message);
      } else {
        queryClient.invalidateQueries({ queryKey: ['job', id] });
        Alert.alert('Success', 'Payment complete! The job is now finished.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error ?? 'Something went wrong.');
    }
  }

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

        <View style={styles.helpBox}>
          <Text style={styles.helpText}>Submit bid if you are a worker. Clients can choose the best offer and press Accept or Mark In Progress.</Text>
        </View>

        {job.description ? <Text style={styles.description}>{job.description}</Text> : null}

        {job.latitude && job.longitude && (
          <View style={{ marginTop: 16, marginBottom: 16 }}>
            <Text style={{ fontSize: 17, fontWeight: '600', marginBottom: 8, color: palette.text }}>Location</Text>
            <JobMapMobile latitude={job.latitude} longitude={job.longitude} address={job.address} />
          </View>
        )}

        <View style={styles.metaGrid}>
          {job.city ? <Text style={styles.meta}>Location: {job.city}</Text> : null}
          {job.category ? <Text style={styles.meta}>Category: {job.category}</Text> : null}
          {job.budgetMin ? <Text style={styles.meta}>Min: {job.budgetMin} RON</Text> : null}
          {job.budgetMax ? <Text style={styles.meta}>Max: {job.budgetMax} RON</Text> : null}
          <Text style={styles.meta}>Posted: {new Date(job.createdAt).toLocaleDateString()}</Text>
        </View>
      </View>

      {job.status === 'in_progress' && (
        <TouchableOpacity style={styles.payBtn} onPress={handlePay}>
          <Text style={styles.payBtnText}>Pay Now</Text>
        </TouchableOpacity>
      )}

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
                  <Text style={styles.bidWorker}>Worker: {bid.workerId?.slice(0, 8) ?? 'Unknown'}...</Text>
                  <Text style={styles.bidPrice}>{bid.priceEstimate} RON</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: bidColors.bg }]}>
                  <Text style={[styles.badgeText, { color: bidColors.text }]}>{bid.status}</Text>
                </View>
              </View>
              {bid.message ? <Text style={styles.bidMessage}>{bid.message}</Text> : null}
              {canAct && bid.status === 'pending' && (
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
              )}
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  content: { padding: 16, paddingBottom: 72 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: palette.background },
  notFound: { color: palette.muted, fontSize: typography.bodySize },
  jobCard: {
    backgroundColor: palette.panel,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: palette.border,
  },
  jobHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  jobTitle: { fontSize: typography.headingSize, fontWeight: '700', color: palette.text, flex: 1, marginRight: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  badgeText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  helpBox: { backgroundColor: '#E0F2FE', padding: 10, borderRadius: 10, marginBottom: 10 },
  helpText: { fontSize: typography.bodySize, color: '#0C4A6E' },
  description: { fontSize: typography.bodySize, color: palette.text, lineHeight: 20, marginBottom: 12 },
  metaGrid: { gap: 4 },
  meta: { fontSize: typography.bodySize, color: palette.muted },
  sectionTitle: { fontSize: typography.titleSize, fontWeight: '700', color: palette.text, marginBottom: 12 },
  emptyText: { color: palette.muted, fontSize: typography.bodySize, marginBottom: 20 },
  bidCard: {
    backgroundColor: palette.panel,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: palette.border,
  },
  bidHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  bidWorker: { fontSize: typography.bodySize, color: palette.text, marginBottom: 2 },
  bidPrice: { fontSize: typography.titleSize, fontWeight: 'bold', color: palette.accent },
  bidMessage: { fontSize: typography.bodySize, color: palette.muted, marginBottom: 10 },
  bidActions: { flexDirection: 'row', gap: 10 },
  acceptBtn: { backgroundColor: palette.accent, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  acceptText: { color: '#fff', fontWeight: '600', fontSize: typography.bodySize },
  rejectBtn: { borderWidth: 1, borderColor: '#DC2626', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  rejectText: { color: '#DC2626', fontWeight: '600', fontSize: typography.bodySize },
  payBtn: {
    backgroundColor: palette.accent,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: 20,
  },
  payBtnText: { color: '#fff', fontWeight: '700', fontSize: typography.bodySize },
});
