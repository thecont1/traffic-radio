import React from 'react';
import { View, StyleSheet, useWindowDimensions, StatusBar } from 'react-native';
import TrafficLightButton from './src/TrafficLightButton';
import { CONFIG } from './src/config';

// The visible UI is limited to a single circular LED button, centered on a
// contrasting dark background, responsive across screen sizes (1:1 aspect).
export default function App() {
  const { width, height } = useWindowDimensions();
  const margin = 22;
  const size = Math.floor(Math.min(width - margin * 2, height - margin * 2, 680));

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={CONFIG.BACKGROUND} />
      <TrafficLightButton size={size} />
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
