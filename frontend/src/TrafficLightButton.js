import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text } from 'react-native';
import * as Haptics from 'expo-haptics';
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
// border frames the circle. While idle, a slow shimmer wave drifts across the
// green LEDs; tapping fires a subtle haptic pulse on real devices.
// -----------------------------------------------------------------------------
export default function TrafficLightButton({ size }) {
  const { hexes, center, CR } = useMemo(() => generateHexGrid(size), [size]);
  const { progress, from, to, delays, phase, start } = useTrafficSequence(hexes.length);
  const interactive = phase === 'IDLE_GREEN';

  // Idle shimmer: loop 0 -> 1 while idle, stop (and reset) during sequences.
  const shimmer = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!interactive) return;
    shimmer.setValue(0);
    const loop = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: CONFIG.SHIMMER_DURATION,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    );
    loop.start();
    return () => loop.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interactive]);

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    start();
  };

  return (
    <Pressable
      onPress={handlePress}
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
              shimmer={interactive ? shimmer : null}
              wavePhase={h.wavePhase}
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
