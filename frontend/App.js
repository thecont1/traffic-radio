import React from 'react';
import { View, StyleSheet, useWindowDimensions, StatusBar } from 'react-native';
import TrafficLightButton from './src/TrafficLightButton';
import LocationDisplay from './src/LocationDisplay';
import { CONFIG } from './src/config';

// The visible UI: a single circular LED button with the user's approximate
// neighbourhood-level location printed beneath it, on a dark background.
export default function App() {
  const { width, height } = useWindowDimensions();
  const margin = 22;
  const reserved = 70; // space for the location text below the light
  const size = Math.floor(Math.min(width - margin * 2, height - margin * 2 - reserved, 680));

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={CONFIG.BACKGROUND} />
      <TrafficLightButton size={size} />
      <LocationDisplay />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: CONFIG.BACKGROUND,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
