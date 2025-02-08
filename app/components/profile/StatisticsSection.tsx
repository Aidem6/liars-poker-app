import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function StatisticsSection() {
  return (
    <View style={styles.statisticsSection}>
      <Text style={styles.sectionTitle}>Statistics</Text>
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

function StatBox({ emoji, value, label }: { emoji: string; value: string; label: string }) {
  return (
    <View style={styles.statsBox}>
      <Text style={styles.statsEmoji}>{emoji}</Text>
      <View style={styles.statsTextContainer}>
        <Text style={styles.statsValue}>{value}</Text>
        <Text style={styles.statsLabel}>{label}</Text>
      </View>
    </View>
  );
}

function StreetStats() {
  const streets = [
    { value: '29%', label: 'Preflop' },
    { value: '14%', label: 'Flop' },
    { value: '19%', label: 'Turn' },
    { value: '16%', label: 'River' },
  ];

  return (
    <View style={[styles.statsBox, styles.statsBoxWide]}>
      <Text style={styles.statsEmoji}>👈</Text>
      <View style={styles.statsStreetContainer}>
        {streets.map((street, index) => (
          <View key={index} style={styles.streetStat}>
            <Text style={styles.statsValue}>{street.value}</Text>
            <Text style={styles.statsLabel}>{street.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function HandStats() {
  return (
    <View style={[styles.statsBox, styles.statsBoxWide]}>
      <Text style={styles.statsEmoji}>✋</Text>
      <View style={styles.statsStreetContainer}>
        <View style={styles.streetStat}>
          <Text style={styles.statsValue}>148</Text>
          <Text style={styles.statsLabel}>Hands played</Text>
        </View>
        <View style={styles.streetStat}>
          <Text style={styles.statsValue}>36</Text>
          <Text style={styles.statsLabel}>Hands won</Text>
        </View>
        <View style={styles.streetStat}>
          <Text style={styles.statsValue}>25%</Text>
          <Text style={styles.statsLabel}>Win rate</Text>
        </View>
      </View>
    </View>
  );
}

function TournamentStats() {
  return (
    <View style={[styles.statsBox, styles.statsBoxWide]}>
      <Text style={styles.statsEmoji}>🏆</Text>
      <View style={styles.statsStreetContainer}>
        <View style={styles.streetStat}>
          <Text style={styles.statsValue}>2</Text>
          <Text style={styles.statsLabel}>Tourn. played</Text>
        </View>
        <View style={styles.streetStat}>
          <Text style={styles.statsValue}>0</Text>
          <Text style={styles.statsLabel}>Tourn. won</Text>
        </View>
        <View style={styles.streetStat}>
          <Text style={styles.statsValue}>0%</Text>
          <Text style={styles.statsLabel}>Win rate</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  statisticsSection: {
    padding: 16,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
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
    backgroundColor: '#1a1a1a',
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
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  statsLabel: {
    color: '#666',
    fontSize: 12,
  },
}); 