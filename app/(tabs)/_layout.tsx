import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: 'Expenses',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="creditcard.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="investments"
        options={{
          title: 'Investments',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="chart.line.uptrend.xyaxis" color={color} />,
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: 'Goals',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="target" color={color} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="ellipsis.circle.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="income"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="bank-accounts"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="assets"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="networth"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="re-investments"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="insurance"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="credit-cards"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="loans"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="friends-ledger"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="friends"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="family"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="family-ledger"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="properties"
        options={{ href: null }}
      />
    </Tabs>
  );
}
