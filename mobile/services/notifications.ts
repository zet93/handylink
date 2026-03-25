import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import api from './api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) return null;
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return null;
  const token = (await Notifications.getExpoPushTokenAsync()).data;
  try {
    await api.put('/api/users/me', { expo_push_token: token });
  } catch {
    // non-fatal
  }
  return token;
}

export function setUpNotificationHandlers(router: any): void {
  Notifications.addNotificationResponseReceivedListener(response => {
    const data = response.notification.request.content.data as any;
    if (data?.type === 'bid_received' && data?.reference_id) {
      router.push({ pathname: '/(client)/job-detail', params: { id: data.reference_id } });
    } else if (data?.type === 'bid_accepted' || data?.type === 'bid_rejected') {
      router.push('/(worker)/my-bids');
    }
  });
}
