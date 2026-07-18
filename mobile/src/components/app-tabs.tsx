import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, spacing } from '../theme';

const TAB_ITEMS = [
  { name: 'index', label: 'Home', icon: 'home-outline', activeIcon: 'home' },
  { name: 'practice', label: 'Practice', icon: 'mic-outline', activeIcon: 'mic' },
  { name: 'feedback', label: 'Feedback', icon: 'chatbubble-outline', activeIcon: 'chatbubble' },
  { name: 'settings', label: 'Settings', icon: 'settings-outline', activeIcon: 'settings' },
];

export default function AppTabs(props: any) {
  const { state, navigation } = props;
  return (
    <View style={styles.container}>
      {TAB_ITEMS.map((tab) => {
        const routeIndex = state.routes.findIndex((r: any) => r.name === tab.name);
        const isFocused = state.index === routeIndex;

        const onPress = () => {
          if (routeIndex === -1) return;
          const event = navigation.emit({
            type: 'tabPress',
            target: state.routes[routeIndex].key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(state.routes[routeIndex].name);
          }
        };

        return (
          <TouchableOpacity
            key={tab.name}
            onPress={onPress}
            activeOpacity={0.7}
            style={styles.tab}
            accessibilityRole="button"
            accessibilityState={{ selected: isFocused }}
            accessibilityLabel={tab.label}
          >
            <View style={[styles.iconWrap, isFocused && styles.iconWrapActive]}>
              <Ionicons
                name={isFocused ? (tab.activeIcon as any) : (tab.icon as any)}
                size={22}
                color={isFocused ? colors.cyan : colors.textMuted}
              />
            </View>
            <Text style={[styles.label, isFocused && styles.labelActive]}>
              {tab.label}
            </Text>
            {isFocused && <View style={styles.indicator} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    paddingBottom: Platform.OS === 'ios' ? 24 : spacing.md,
    paddingTop: spacing.sm,
    height: Platform.OS === 'ios' ? 84 : 70,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: 'rgba(53,215,255,0.08)',
  },
  label: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: '500',
  },
  labelActive: {
    color: colors.cyan,
    fontWeight: '700',
  },
  indicator: {
    position: 'absolute',
    top: -spacing.sm,
    width: 24,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.cyan,
  },
});
