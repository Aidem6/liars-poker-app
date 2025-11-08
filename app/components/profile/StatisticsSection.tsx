import React, { memo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../../lib/ThemeContext';

// Types
interface StatBoxProps {
  emoji: string;
  value: string;
  label: string;
}

interface StreetData {
  value: string;
  label: string;
}

// Constants
const STREET_DATA: StreetData[] = [
  { value: '29%', label: 'Preflop' },
  { value: '14%', label: 'Flop' },
  { value: '19%', label: 'Turn' },
  { value: '16%', label: 'River' },
];

export function StatisticsSection() {
  const { colors } = useTheme();
  // Example loading state - replace with real data fetching
  const isLoading = false;
  const error = null;

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={[styles.error, { color: colors.primary }]}>
          Failed to load statistics
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container} accessible={true} accessibilityLabel="Statistics section">
      <Text style={[styles.title, { color: colors.text }]}>Statistics</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statsRow}>
          <StatBox emoji="👆" value="23%" label="Aggression freq." />
          <StatBox emoji="⌛" value="3.4h" label="Time played" />
        </View>

        <StreetStats />
        <HandStats />
        <TournamentStats />
      </View>
    </View>
  );
}

const StatBox = memo(({ emoji, value, label }: StatBoxProps) => {
  const { colors } = useTheme();
  return (
    <View 
      style={[styles.statsBox, { backgroundColor: colors.secondary }]}
      accessible={true}
      accessibilityLabel={`${label}: ${value}`}
    >
      <Text style={styles.statsEmoji} accessibilityLabel="">{emoji}</Text>
      <View style={styles.statsTextContainer}>
        <Text style={[styles.statsValue, { color: colors.text }]}>{value}</Text>
        <Text style={[styles.statsLabel, { color: colors.secondaryText }]}>{label}</Text>
      </View>
    </View>
  );
});

const StreetStats = memo(() => {
  const { colors } = useTheme();
  
  return (
    <View 
      style={[styles.statsBox, styles.statsBoxWide, { backgroundColor: colors.secondary }]}
      accessible={true}
      accessibilityLabel="Street statistics"
    >
      <Text style={styles.statsEmoji}>👈</Text>
      <View style={styles.statsStreetContainer}>
        {STREET_DATA.map((street, index) => (
          <View key={index} style={styles.streetStat}>
            <Text style={[styles.statsValue, { color: colors.text }]}>{street.value}</Text>
            <Text style={[styles.statsLabel, { color: colors.secondaryText }]}>{street.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
});

const HandStats = memo(() => {
  const { colors } = useTheme();
  return (
    <View 
      style={[styles.statsBox, styles.statsBoxWide, { backgroundColor: colors.secondary }]}
      accessible={true}
      accessibilityLabel="Hand statistics"
    >
      <Text style={styles.statsEmoji}>✋</Text>
      <View style={styles.statsStreetContainer}>
        <View style={styles.streetStat}>
          <Text style={[styles.statsValue, { color: colors.text }]}>148</Text>
          <Text style={[styles.statsLabel, { color: colors.secondaryText }]}>Hands played</Text>
        </View>
        <View style={styles.streetStat}>
          <Text style={[styles.statsValue, { color: colors.text }]}>36</Text>
          <Text style={[styles.statsLabel, { color: colors.secondaryText }]}>Hands won</Text>
        </View>
        <View style={styles.streetStat}>
          <Text style={[styles.statsValue, { color: colors.text }]}>25%</Text>
          <Text style={[styles.statsLabel, { color: colors.secondaryText }]}>Win rate</Text>
        </View>
      </View>
    </View>
  );
});

const TournamentStats = memo(() => {
  const { colors } = useTheme();
  return (
    <View 
      style={[styles.statsBox, styles.statsBoxWide, { backgroundColor: colors.secondary }]}
      accessible={true}
      accessibilityLabel="Tournament statistics"
    >
      <Text style={styles.statsEmoji}>🏆</Text>
      <View style={styles.statsStreetContainer}>
        <View style={styles.streetStat}>
          <Text style={[styles.statsValue, { color: colors.text }]}>2</Text>
          <Text style={[styles.statsLabel, { color: colors.secondaryText }]}>Tourn. played</Text>
        </View>
        <View style={styles.streetStat}>
          <Text style={[styles.statsValue, { color: colors.text }]}>0</Text>
          <Text style={[styles.statsLabel, { color: colors.secondaryText }]}>Tourn. won</Text>
        </View>
        <View style={styles.streetStat}>
          <Text style={[styles.statsValue, { color: colors.text }]}>0%</Text>
          <Text style={[styles.statsLabel, { color: colors.secondaryText }]}>Win rate</Text>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsGrid: {
    gap: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statsBox: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statsBoxWide: {
    marginTop: 12,
  },
  statsEmoji: {
    fontSize: 24,
  },
  statsTextContainer: {
    flex: 1,
  },
  statsStreetContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  streetStat: {
    flex: 1,
  },
  statsValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  statsLabel: {
    fontSize: 12,
  },
  error: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
});

export default StatisticsSection; 