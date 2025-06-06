import { Tabs } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: '#0a7ea4',
    }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="notification"
        options={{
          title: 'Notifications',
          tabBarIcon: ({ color }) => <IconSymbol name="bell" color={color} />,
        }}
      />
      <Tabs.Screen
        name="policy"
        options={{
          title: 'Policy',
          tabBarIcon: ({ color }) => <IconSymbol name="description" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <IconSymbol name="person" color={color} />,
        }}
      />
    </Tabs>
  );
}