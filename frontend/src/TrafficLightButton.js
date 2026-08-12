import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Svg, { Defs, ClipPath, Circle, G } from 'react-native-svg';
import { generateHexGrid } from './hex';
import AnimatedLed from './AnimatedLed';
import { useTrafficSequence, PHASE_A11Y } from './useTrafficSequence';
import { CONFIG } from './config';

// -----------------------------------------------------------------------------
// The one and only visible control: a giant circular button built from many
// small hexagonal LEDs, clipped to a perfect circle. The gaps between LEDs are
// pure black; each hexagon carries the live traffic-light colour and flips
// digitally (one at a time) during a transition. A thin, constant neutral
// border frames the circle.
// -----------------------------------------------------------------------------
export default function TrafficLightButton({ size }) {
  const { hexes, center, CR } = useMemo(() => generateHexGrid(size), [size]);
  const { progress, from, to, delays, phase, start } = useTrafficSequence(hexes.length);
  const interactive = phase === 'IDLE_GREEN';

  return (
    <Pressable
      onPress={start}
      disabled={!interactive}
      testID="traffic-light-button"
      accessibilityRole="button"
      accessibilityLabel="Traffic light button"
      accessibilityState={{ disabled: !interactive }}
      accessibilityValue={{ text: PHASE_A11Y[phase] }}
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
    >
      {/* Off-screen live status for assistive technologies */}
      <Text
        accessibilityLiveRegion="polite"
        accessibilityRole="text"
        testID="traffic-light-status"
        style={styles.srOnly}
      >
        {PHASE_A11Y[phase]}
      </Text>

      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <ClipPath id="circleClip">
            <Circle cx={center} cy={center} r={CR} />
          </ClipPath>
        </Defs>

        {/* Pure-black housing showing through the gaps between LEDs */}
        <Circle cx={center} cy={center} r={CR} fill={CONFIG.GAP_COLOR} />

        <G clipPath="url(#circleClip)">
          {hexes.map((h) => (
            <AnimatedLed
              key={h.id}
              points={h.points}
              opacity={h.opacity}
              progress={progress}
              from={from}
              to={to}
              switchAt={delays[h.id] ?? 0}
            />
          ))}
        </G>

        {/* Thin, constant neutral border */}
        <Circle
          cx={center}
          cy={center}
          r={CR - CONFIG.BEZEL_WIDTH / 2}
          fill="none"
          stroke={CONFIG.BEZEL}
          strokeWidth={CONFIG.BEZEL_WIDTH}
        />
      </Svg>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  srOnly: {
    position: 'absolute',
    left: -9999,
    width: 1,
    height: 1,
  },
});
