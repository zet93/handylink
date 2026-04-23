import { useEffect, useState } from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePostHog } from 'posthog-react-native';

const CONSENT_KEY = 'consent_decided';

export function ConsentModal() {
  const posthog = usePostHog();
  const [sheetIndex, setSheetIndex] = useState(-1);

  useEffect(() => {
    AsyncStorage.getItem(CONSENT_KEY).then(val => {
      if (!val) setSheetIndex(0);
    });
  }, []);

  async function accept() {
    posthog?.optIn();
    await AsyncStorage.setItem(CONSENT_KEY, 'granted');
    setSheetIndex(-1);
  }

  async function decline() {
    posthog?.optOut();
    await AsyncStorage.setItem(CONSENT_KEY, 'denied');
    setSheetIndex(-1);
  }

  return (
    <BottomSheet
      index={sheetIndex}
      snapPoints={['40%']}
      enablePanDownToClose={false}
    >
      <BottomSheetView style={styles.container}>
        <Text style={styles.heading}>Analytics Consent</Text>
        <Text style={styles.body}>
          We use analytics to improve HandyLink. Your data stays on EU servers. You can change this in Settings.
        </Text>
        <TouchableOpacity style={styles.primaryButton} onPress={accept}>
          <Text style={styles.primaryButtonText}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={decline}>
          <Text style={styles.secondaryButtonText}>Decline</Text>
        </TouchableOpacity>
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 12,
  },
  heading: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  body: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: 15,
    fontWeight: '500',
  },
});
