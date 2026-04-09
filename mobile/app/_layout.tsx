import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Slot, useRouter } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StripeProvider } from '@stripe/stripe-react-native';
import { supabase } from '../services/supabase';
import { registerForPushNotifications, setUpNotificationHandlers } from '../services/notifications';
import api from '../services/api';

const queryClient = new QueryClient();

function AppRoot() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        router.replace('/(public)/browse');
      } else {
        try {
          const res = await api.get('/api/users/me');
          const role = res.data?.role;
          router.replace(role === 'worker' ? '/(worker)/browse' : '/(client)');
        } catch (e: any) {
          if (e?.response?.status === 404) {
            router.replace('/(auth)/select-role');
          } else {
            router.replace('/(public)/browse');
          }
        }
        registerForPushNotifications();
        setUpNotificationHandlers(router);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        router.replace('/(public)/browse');
      } else if (event === 'SIGNED_IN' && session) {
        try {
          const res = await api.get('/api/users/me');
          const role = res.data?.role;
          router.replace(role === 'worker' ? '/(worker)/browse' : '/(client)');
        } catch (e: any) {
          if (e?.response?.status === 404) {
            router.replace('/(auth)/select-role');
          }
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <StripeProvider publishableKey={process.env.EXPO_PUBLIC_STRIPE_KEY ?? ''}>
      <QueryClientProvider client={queryClient}>
        <AppRoot />
      </QueryClientProvider>
    </StripeProvider>
  );
}
