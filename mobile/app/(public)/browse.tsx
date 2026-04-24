import { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  open: { bg: '#DBEAFE', text: '#1D4ED8' },
  bidding: { bg: '#FEF3C7', text: '#D97706' },
};

export default function PublicBrowseScreen() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [jobs, setJobs] = useState<any[]>([]);

  const { isFetching } = useQuery({
    queryKey: ['public-jobs', page],
    queryFn: async () => {
      const res = await api.get('/api/jobs', { params: { page, pageSize: 20, status: 'Open' } });
      const items = res.data?.items ?? res.data ?? [];
      setJobs(prev => (page === 1 ? items : [...prev, ...items]));
      return res.data;
    },
  });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.heading}>Browse Jobs</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => router.push('/(auth)/login' as any)}>
              <Text style={styles.headerLink}>Log in</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/(auth)/register' as any)}>
              <Text style={styles.headerLink}>Register</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.workersLink} onPress={() => router.push('/(public)/workers' as any)}>
          <Text style={styles.workersLinkText}>Browse Workers</Text>
        </TouchableOpacity>

        <FlatList
          data={jobs}
          keyExtractor={(item, i) => `${item.id}-${i}`}
          contentContainerStyle={styles.list}
          onEndReached={() => {
            if (!isFetching) setPage(p => p + 1);
          }}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            isFetching ? (
              <ActivityIndicator style={{ marginTop: 40 }} />
            ) : (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>No open jobs available.</Text>
              </View>
            )
          }
          ListFooterComponent={
            !isFetching || page === 1 ? null : <ActivityIndicator style={{ margin: 16 }} />
          }
          renderItem={({ item }) => {
            const colors = STATUS_COLORS[item.status?.toLowerCase()] ?? { bg: '#F3F4F6', text: '#374151' };
            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => router.push({ pathname: '/(public)/job-detail', params: { id: item.id } } as any)}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                  <View style={[styles.badge, { backgroundColor: colors.bg }]}>
                    <Text style={[styles.badgeText, { color: colors.text }]}>{item.status}</Text>
                  </View>
                </View>
                {item.description ? (
                  <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
                ) : null}
                <View style={styles.cardMeta}>
                  {item.city ? <Text style={styles.metaText}>{item.city}</Text> : null}
                  {item.category ? <Text style={styles.metaText}>{item.category}</Text> : null}
                  {item.budgetMax ? (
                    <Text style={styles.metaText}>Up to {item.budgetMax} RON</Text>
                  ) : null}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  heading: { fontSize: 24, fontWeight: 'bold', color: '#111' },
  headerActions: { flexDirection: 'row', gap: 12 },
  headerLink: { color: '#007AFF', fontSize: 14, fontWeight: '600' },
  workersLink: { marginHorizontal: 20, marginBottom: 8 },
  workersLinkText: { color: '#007AFF', fontSize: 14, fontWeight: '500' },
  list: { paddingHorizontal: 16, paddingBottom: 40 },
  empty: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#888', fontSize: 15 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#111', flex: 1, marginRight: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  cardDesc: { fontSize: 13, color: '#666', marginBottom: 8, lineHeight: 18 },
  cardMeta: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  metaText: { fontSize: 12, color: '#888' },
});
