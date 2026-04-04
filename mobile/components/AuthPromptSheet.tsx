import { forwardRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import { signInWithGoogle } from '../services/supabase';

interface AuthPromptSheetProps {
  returnTo?: string;
}

const AuthPromptSheet = forwardRef<BottomSheet, AuthPromptSheetProps>(
  ({ returnTo }, ref) => {
    const router = useRouter();

    const handleLogin = useCallback(() => {
      (ref as React.RefObject<BottomSheet>)?.current?.close();
      router.push({ pathname: '/(auth)/login', params: { returnTo: returnTo ?? '' } } as any);
    }, [ref, router, returnTo]);

    const handleRegister = useCallback(() => {
      (ref as React.RefObject<BottomSheet>)?.current?.close();
      router.push({ pathname: '/(auth)/register', params: { returnTo: returnTo ?? '' } } as any);
    }, [ref, router, returnTo]);

    const handleDismiss = useCallback(() => {
      (ref as React.RefObject<BottomSheet>)?.current?.close();
    }, [ref]);

    const handleGoogle = useCallback(async () => {
      (ref as React.RefObject<BottomSheet>)?.current?.close();
      const { error } = await signInWithGoogle();
      if (error) Alert.alert('Google Sign In Failed', error.message);
    }, [ref]);

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={['35%']}
        enablePanDownToClose
      >
        <BottomSheetView style={styles.container}>
          <Text style={styles.heading}>Log in to continue</Text>
          <Text style={styles.body}>
            Create a free account or log in to post a job or submit a bid.
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
            <Text style={styles.primaryButtonText}>Log in</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleRegister}>
            <Text style={styles.secondaryButtonText}>Create account</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.googleButton} onPress={handleGoogle}>
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDismiss}>
            <Text style={styles.dismissText}>Maybe later</Text>
          </TouchableOpacity>
        </BottomSheetView>
      </BottomSheet>
    );
  }
);

AuthPromptSheet.displayName = 'AuthPromptSheet';

export default AuthPromptSheet;

const styles = StyleSheet.create({
  container: { padding: 24, alignItems: 'center' },
  heading: { fontSize: 24, fontWeight: '600', marginBottom: 8 },
  body: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 24 },
  primaryButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
    minHeight: 44,
  },
  primaryButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
    minHeight: 44,
  },
  secondaryButtonText: { fontWeight: '600', fontSize: 16 },
  googleButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
    minHeight: 44,
  },
  googleButtonText: { fontWeight: '600', fontSize: 16 },
  dismissText: { color: '#6b7280', fontSize: 14, paddingVertical: 8 },
});
