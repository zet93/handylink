import { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePostHog } from 'posthog-react-native';
import api from '../../services/api';

const CATEGORIES = ['all', 'electrical', 'plumbing', 'painting', 'carpentry', 'cleaning', 'other'];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  open: { bg: '#DBEAFE', text: '#1D4ED8' },
  bidding: { bg: '#FEF3C7', text: '#D97706' },
};

export default function WorkerBrowseScreen() {
  const queryClient = useQueryClient();
  const posthog = usePostHog();
  const sheetRef = useRef<BottomSheet>(null);

  const [category, setCategory] = useState('all');
  const [page, setPage] = useState(1);
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [price, setPrice] = useState('');
  const [message, setMessage] = useState('');

  const { isFetching } = useQuery({
    queryKey: ['worker-jobs', category, page],
    queryFn: async () => {
      const params: Record<string, any> = { page, pageSize: 20, status: 'open' };
      if (category !== 'all') params.category = category;
      const res = await api.get('/api/jobs', { params });
      const items = res.data?.items ?? res.data ?? [];
      setJobs(prev => (page === 1 ? items : [...prev, ...items]));
      return res.data;
    },
  });

  function handleCategoryChange(cat: string) {
    setCategory(cat);
    setPage(1);
    setJobs([]);
  }

  function openSheet(job: any) {
    setSelectedJob(job);
    setPrice('');
    setMessage('');
    sheetRef.current?.expand();
  }

  const submitBid = useMutation({
    mutationFn: () =>
      api.post(`/api/jobs/${selectedJob.id}/bids`, {
        price_estimate: Number(price),
        message,
      }),
    onSuccess: () => {
      posthog?.capture('bid_submitted', { job_id: selectedJob.id });
      sheetRef.current?.close();
      queryClient.invalidateQueries({ queryKey: ['worker-jobs'] });
    },
    onError: (err: any) => {
      Alert.alert('Error', err?.response?.data?.error ?? 'Failed to submit bid.');
    },
  });

  function handleSubmitBid() {
    if (!price) {
      Alert.alert('Error', 'Please enter a price.');
      return;
    }
    submitBid.mutate();
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <View style={styles.container}>
        <Text style={styles.heading}>Browse Jobs</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.chip, category === cat && styles.chipSelected]}
              onPress={() => handleCategoryChange(cat)}
            >
              <Text style={[styles.chipText, category === cat && styles.chipTextSelected]}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

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
                <Text style={styles.emptyText}>No open jobs in this category.</Text>
              </View>
            )
          }
          ListFooterComponent={
            !isFetching || page === 1 ? null : <ActivityIndicator style={{ margin: 16 }} />
          }
          renderItem={({ item }) => {
            const colors = STATUS_COLORS[item.status] ?? { bg: '#F3F4F6', text: '#374151' };
            return (
              <TouchableOpacity style={styles.card} onPress={() => openSheet(item)}>
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
                <Text style={styles.tapHint}>Tap to bid</Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      <BottomSheet
        ref={sheetRef}
        index={-1}
        snapPoints={['55%']}
        enablePanDownToClose
      >
        <BottomSheetView style={styles.sheet}>
          {selectedJob ? (
            <>
              <Text style={styles.sheetTitle}>{selectedJob.title}</Text>
              <Text style={styles.sheetSub}>{selectedJob.city} · {selectedJob.category}</Text>

              <Text style={styles.label}>Your Price (RON)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 500"
                placeholderTextColor="#999"
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
              />

              <Text style={styles.label}>Message</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe your approach..."
                placeholderTextColor="#999"
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={3}
              />

              <TouchableOpacity
                style={[styles.button, submitBid.isPending && styles.buttonDisabled]}
                onPress={handleSubmitBid}
                disabled={submitBid.isPending}
              >
                {submitBid.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Submit Bid</Text>
                )}
              </TouchableOpacity>
            </>
          ) : null}
        </BottomSheetView>
      </BottomSheet>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  heading: { fontSize: 24, fontWeight: 'bold', color: '#111', padding: 20, paddingBottom: 8 },
  chips: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  chipSelected: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  chipText: { fontSize: 13, color: '#555', fontWeight: '500' },
  chipTextSelected: { color: '#fff' },
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
  tapHint: { fontSize: 11, color: '#007AFF', marginTop: 8, fontWeight: '500' },
  sheet: { flex: 1, padding: 20 },
  sheetTitle: { fontSize: 18, fontWeight: 'bold', color: '#111', marginBottom: 4 },
  sheetSub: { fontSize: 13, color: '#888', marginBottom: 18 },
  label: { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: '#111',
    marginBottom: 14,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
