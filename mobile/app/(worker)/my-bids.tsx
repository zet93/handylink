import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: '#F3F4F6', text: '#374151' },
  accepted: { bg: '#D1FAE5', text: '#065F46' },
  rejected: { bg: '#FEE2E2', text: '#DC2626' },
};

export default function MyBidsScreen() {
  const { data = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['my-bids'],
    queryFn: () => api.get('/api/bids/my').then(r => r.data),
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>My Bids</Text>
      <FlatList
        data={data}
        keyExtractor={(item: any) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>You haven't placed any bids yet.</Text>
          </View>
        }
        renderItem={({ item }: { item: any }) => {
          const colors = STATUS_COLORS[item.status] ?? STATUS_COLORS.pending;
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.jobTitle} numberOfLines={1}>
                  {item.jobTitle ?? item.job?.title ?? `Job #${item.jobId?.slice(0, 8) ?? item.id}`}
                </Text>
                <View style={[styles.badge, { backgroundColor: colors.bg }]}>
                  <Text style={[styles.badgeText, { color: colors.text }]}>{item.status}</Text>
                </View>
              </View>
              <Text style={styles.price}>{item.priceEstimate} RON</Text>
              {item.message ? <Text style={styles.message} numberOfLines={2}>{item.message}</Text> : null}
              <Text style={styles.date}>
                {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  heading: { fontSize: 24, fontWeight: 'bold', color: '#111', padding: 20, paddingBottom: 12 },
  list: { paddingHorizontal: 16, paddingBottom: 40 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#888', fontSize: 15 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  jobTitle: { fontSize: 15, fontWeight: '600', color: '#111', flex: 1, marginRight: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  price: { fontSize: 18, fontWeight: 'bold', color: '#007AFF', marginBottom: 4 },
  message: { fontSize: 13, color: '#666', marginBottom: 6 },
  date: { fontSize: 11, color: '#aaa' },
});
