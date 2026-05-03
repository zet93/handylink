import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { palette } from '../app/constants/design';

type Location = {
  latitude: number | null;
  longitude: number | null;
  address: string | null;
};

type Result = {
  label: string;
  lat: number;
  lng: number;
};

type Props = {
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  onChange: (loc: Location) => void;
};

export default function LocationPickerMobile({ latitude, longitude, address, onChange }: Props) {
  const [query, setQuery] = useState(address ?? '');
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 3) {
      setResults([]);
      setNoResults(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setNoResults(false);
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=ro&limit=5&q=${encodeURIComponent(query)}`;
        const res = await fetch(url, { headers: { 'User-Agent': 'HandyLink/1.0' } });
        const data = await res.json();
        const mapped: Result[] = data.map((r: any) => ({
          label: r.display_name,
          lat: parseFloat(r.lat),
          lng: parseFloat(r.lon),
        }));
        setResults(mapped);
        if (mapped.length === 0) setNoResults(true);
      } catch {
        setResults([]);
        setNoResults(true);
      } finally {
        setLoading(false);
      }
    }, 400);
  }, [query]);

  function selectResult(item: Result) {
    onChange({ latitude: item.lat, longitude: item.lng, address: item.label });
    setQuery(item.label);
    setResults([]);
    setNoResults(false);
  }

  function clearLocation() {
    onChange({ latitude: null, longitude: null, address: null });
    setQuery('');
    setResults([]);
    setNoResults(false);
  }

  return (
    <View>
      <Text style={styles.label}>Job Location (optional)</Text>
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          placeholder="Search address, e.g. Strada Florilor, Cluj"
          placeholderTextColor={palette.muted}
          value={query}
          onChangeText={setQuery}
        />
        {loading && (
          <ActivityIndicator style={styles.spinner} size="small" color={palette.accent} />
        )}
      </View>

      {results.length > 0 && (
        <FlatList
          data={results}
          keyExtractor={(_, i) => String(i)}
          scrollEnabled={false}
          style={styles.resultsList}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.resultItem} onPress={() => selectResult(item)}>
              <Text style={styles.resultText} numberOfLines={2}>{item.label}</Text>
            </TouchableOpacity>
          )}
        />
      )}

      {noResults && (
        <Text style={styles.noResults}>No results found. Try a different address or skip this field.</Text>
      )}

      {latitude && longitude ? (
        <View style={{ marginTop: 8 }}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude,
              longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            scrollEnabled={true}
            zoomEnabled={true}
          >
            <Marker coordinate={{ latitude, longitude }} />
          </MapView>
          <TouchableOpacity onPress={clearLocation}>
            <Text style={styles.clearText}>Remove location</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.text,
    marginBottom: 4,
  },
  inputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: palette.text,
    backgroundColor: palette.panel,
    paddingRight: 40,
  },
  spinner: {
    position: 'absolute',
    right: 12,
  },
  resultsList: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 10,
    marginTop: 4,
    backgroundColor: palette.panel,
    maxHeight: 200,
  },
  resultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  resultText: {
    fontSize: 14,
    color: palette.text,
  },
  noResults: {
    color: palette.muted,
    fontSize: 13,
    marginTop: 4,
  },
  map: {
    height: 250,
    width: '100%',
    borderRadius: 10,
    overflow: 'hidden',
  },
  clearText: {
    color: '#dc2626',
    fontSize: 13,
    marginTop: 4,
  },
});
