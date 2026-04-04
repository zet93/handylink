import { Stack } from 'expo-router';

export default function PublicLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="browse" options={{ title: 'Jobs' }} />
      <Stack.Screen name="job-detail" options={{ title: 'Job Details' }} />
      <Stack.Screen name="workers" options={{ title: 'Workers' }} />
      <Stack.Screen name="worker-detail" options={{ title: 'Worker Profile' }} />
    </Stack>
  );
}
