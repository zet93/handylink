import { View } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { palette } from '../constants/design';

export default function ClientLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { backgroundColor: palette.panel },
          tabBarActiveTintColor: palette.accent,
          tabBarInactiveTintColor: palette.muted,
          sceneContainerStyle: { backgroundColor: palette.background },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'My Jobs',
            tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={24} color={color} />,
          }}
        />
        <Tabs.Screen name="post-job" options={{ href: null }} />
        <Tabs.Screen name="job-detail" options={{ href: null }} />
        <Tabs.Screen
          name="browse-workers"
          options={{
            title: 'Workers',
            tabBarIcon: ({ color }) => <Ionicons name="search-outline" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => <Ionicons name="person-outline" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="notifications"
          options={{
            title: 'Alerts',
            tabBarIcon: ({ color }) => <Ionicons name="notifications-outline" size={24} color={color} />,
          }}
        />
      </Tabs>
    </View>
  );
}
