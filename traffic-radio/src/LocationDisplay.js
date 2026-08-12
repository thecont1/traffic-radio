import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocation } from './useLocation';

// Approximate neighbourhood-level location, printed under the signal light.
export default function LocationDisplay() {
  const { place, status } = useLocation();
  const text =
    status === 'locating' ? 'Locating…' : status === 'ok' ? place : 'Location unavailable';

  return (
    <View style={styles.wrap}>
      <Text data-testid="location-display" testID="location-display" style={styles.place}>
        {text}
      </Text>
      <Text testID="location-attribution" style={styles.attribution}>
        © OpenStreetMap
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    marginTop: 18,
  },
  place: {
    color: '#8a97a8',
    fontSize: 14,
    letterSpacing: 0.4,
  },
  attribution: {
    color: '#5a6673',
    fontSize: 10,
    marginTop: 4,
    letterSpacing: 0.3,
  },
});
