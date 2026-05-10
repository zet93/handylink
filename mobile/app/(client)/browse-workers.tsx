import { View, Text, StyleSheet, FlatList } from 'react-native';
import { palette, typography } from '../constants/design';

const WORKERS = [
  { id: '1', name: 'Mihai Popescu', rating: 4.8, reviewCount: 23, jobCount: 88, location: 'Bucharest' },
  { id: '2', name: 'Ioana Ionescu', rating: 4.9, reviewCount: 34, jobCount: 123, location: 'Cluj-Napoca' },
  { id: '3', name: 'Alex Dobre', rating: 4.7, reviewCount: 18, jobCount: 72, location: 'Timisoara' },
];

function WorkerCard({ worker }: { worker: typeof WORKERS[number] }) {
  return (
    <View style={styles.card}>
      <Text style={styles.name}>{worker.name}</Text>
      <Text style={styles.meta}>{worker.location}</Text>
      <Text style={styles.meta}>⭐ {worker.rating.toFixed(1)} • {worker.reviewCount} reviews • {worker.jobCount} jobs</Text>
    </View>
  );
}

export default function BrowseWorkers() {
  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}> 
      <Text style={styles.heading}>Browse Workers</Text>
      <Text style={styles.subtitle}>Tap a worker to see profile details and place a bid.</Text>
      <FlatList
        data={WORKERS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <WorkerCard worker={item} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  heading: { fontSize: typography.headingSize, fontWeight: '700', color: palette.text, marginBottom: 8 },
  subtitle: { fontSize: typography.bodySize, color: palette.muted, marginBottom: 12 },
  list: { paddingBottom: 24 },
  card: { backgroundColor: palette.panel, borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: palette.border },
  name: { fontSize: typography.titleSize, fontWeight: '700', color: palette.text },
  meta: { fontSize: typography.bodySize, color: palette.muted },
});
