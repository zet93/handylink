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

export default function PublicWorkersScreen() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [workers, setWorkers] = useState<any[]>([]);

  const { isFetching } = useQuery({
    queryKey: ['public-workers', page],
    queryFn: async () => {
      const res = await api.get('/api/workers', { params: { page, pageSize: 20 } });
      const items = res.data?.items ?? res.data ?? [];
      setWorkers(prev => (page === 1 ? items : [...prev, ...items]));
      return res.data;
    },
  });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <FlatList
          data={workers}
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
                <Text style={styles.emptyText}>No workers found.</Text>
              </View>
            )
          }
          ListFooterComponent={
            !isFetching || page === 1 ? null : <ActivityIndicator style={{ margin: 16 }} />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push({ pathname: '/(public)/worker-detail', params: { id: item.id } } as any)}
            >
              <Text style={styles.name}>{item.fullName ?? item.full_name ?? 'Worker'}</Text>
              {item.category ? <Text style={styles.category}>{item.category}</Text> : null}
              {item.averageRating != null ? (
                <Text style={styles.rating}>Rating: {item.averageRating.toFixed(1)}</Text>
              ) : null}
            </TouchableOpacity>
          )}
        />
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  list: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40 },
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
  name: { fontSize: 16, fontWeight: '700', color: '#111', marginBottom: 4 },
  category: { fontSize: 13, color: '#666', marginBottom: 4 },
  rating: { fontSize: 13, color: '#D97706', fontWeight: '600' },
});
