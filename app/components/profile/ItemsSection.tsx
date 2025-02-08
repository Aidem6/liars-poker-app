import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function ItemsSection() {
  return (
    <View style={styles.itemsContainer}>
      <View style={styles.inlineContainer}>
        <TouchableOpacity style={styles.itemRow}>
          <View style={styles.itemLeft}>
            <Ionicons name="happy-outline" size={24} color="#fff" />
            <View style={styles.itemTextContainer}>
              <Text style={styles.itemText}>Emotes</Text>
              <Text style={styles.itemCount}>6 (24)</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.itemRow}>
          <View style={styles.itemLeft}>
            <Ionicons name="grid-outline" size={24} color="#fff" />
            <View style={styles.itemTextContainer}>
              <Text style={styles.itemText}>Card backs</Text>
              <Text style={styles.itemCount}>2 (20)</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={[styles.itemRow, { maxWidth: '100%' }]}>
        <View style={styles.itemLeft}>
          <Ionicons name="fish-outline" size={24} color="#fff" />
          <Text style={styles.itemText}>Fish</Text>
        </View>
        <Text style={styles.itemSubtext}>Rank progress</Text>
        <View style={styles.progressBar}>
          <View style={styles.progressFill} />
        </View>
        <Ionicons name="chevron-forward" size={20} color="#666" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  itemsContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  inlineContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 12,
    gap: 8,
    flex: 1,
    maxWidth: '48%',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  itemTextContainer: {
    flex: 1,
  },
  itemText: {
    color: '#fff',
    fontSize: 14,
  },
  itemCount: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
  },
  itemSubtext: {
    color: '#666',
    fontSize: 14,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    width: 100,
    marginHorizontal: 12,
  },
  progressFill: {
    width: '60%',
    height: '100%',
    backgroundColor: '#3498db',
    borderRadius: 2,
  },
}); 