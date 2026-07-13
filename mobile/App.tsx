/**
 * PitchPilot AI Mobile App
 * Entry point with simple state-based navigation.
 */

import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ScreenName } from './src/types/pitchpilot';
import { colors } from './src/theme/theme';

import HomeScreen from './src/screens/HomeScreen';
import PracticeScreen from './src/screens/PracticeScreen';
import FeedbackScreen from './src/screens/FeedbackScreen';
import SettingsScreen from './src/screens/SettingsScreen';

export default function App() {
  const [screen, setScreen] = useState<ScreenName>('home');
  const [practiceMode, setPracticeMode] = useState<string>('');
  const [practiceQuestion, setPracticeQuestion] = useState<string>('');
  const [practiceRole, setPracticeRole] = useState<string>('');

  const navigateTo = (target: ScreenName) => setScreen(target);

  const goToFeedback = (mode: string, question: string, role: string) => {
    setPracticeMode(mode);
    setPracticeQuestion(question);
    setPracticeRole(role);
    setScreen('feedback');
  };

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <StatusBar style="light" />

        {screen === 'home' && (
          <HomeScreen
            onStartPractice={() => navigateTo('practice')}
            onNavigate={(s) => navigateTo(s)}
          />
        )}

        {screen === 'practice' && (
          <PracticeScreen
            onBack={() => navigateTo('home')}
            onGoToFeedback={goToFeedback}
          />
        )}

        {screen === 'feedback' && (
          <FeedbackScreen
            onBack={() => navigateTo('practice')}
            mode={practiceMode}
            question={practiceQuestion}
            role={practiceRole}
          />
        )}

        {screen === 'settings' && (
          <SettingsScreen onBack={() => navigateTo('home')} />
        )}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
