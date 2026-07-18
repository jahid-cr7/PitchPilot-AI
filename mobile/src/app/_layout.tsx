import { Platform, View } from 'react-native';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AppTabs from '../components/app-tabs';
import { colors } from '../theme';
import { initBackendUrl } from '../api/pitchpilotApi';
import { useEffect } from 'react';
import { AuthProvider } from '../context/AuthContext';

export default function RootLayout() {
  useEffect(() => {
    initBackendUrl();
  }, []);

  const tabs = (
    <>
      <StatusBar style="light" />
      <Tabs
        tabBar={(props) => <AppTabs {...props} />}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Home' }} />
        <Tabs.Screen name="practice" options={{ title: 'Practice' }} />
        <Tabs.Screen name="feedback" options={{ title: 'Feedback' }} />
        <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
        <Tabs.Screen name="history" options={{ href: null }} />
        <Tabs.Screen name="dashboard" options={{ href: null }} />
        <Tabs.Screen name="login" options={{ href: null }} />
        <Tabs.Screen name="register" options={{ href: null }} />
      </Tabs>
    </>
  );

  const shell =
    Platform.OS === 'web' ? (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center' }}>
        <View style={{ width: '100%', maxWidth: 480, flex: 1 }}>{tabs}</View>
      </View>
    ) : (
      tabs
    );

  return <AuthProvider>{shell}</AuthProvider>;
}
