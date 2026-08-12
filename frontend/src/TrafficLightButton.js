import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text } from 'react-native';
import * as Haptics from 'expo-haptics';
import Svg, { Defs, ClipPath, Circle, G } from 'react-native-svg';
import { generateHexGrid } from './hex';
import AnimatedLed from './AnimatedLed';
import { useTrafficSequence, PHASE_A11Y } from './useTrafficSequence';
import { CONFIG } from './config';

const C = CONFIG.COLORS;

const AnimatedCircle = Animated.createAnimatedComponent(
  React.forwardRef(function CleanCircle({ collapsable, ...rest }, ref) {
    return <Circle ref={ref} {...rest} />;
  })
);

// Colour-blind shape cue: dim factor for a given hex when showing `color`.
// green/off = all lit, amber = checker pattern, red = large X across the face.
function cueFactor(hex, color) {
  if (!CONFIG.COLOR_BLIND_MODE) return 1;
  if (color === C.yellow) return hex.parity === 1 ? CONFIG.CUE_DIM : 1;
  if (color === C.red) return hex.onX ? CONFIG.CUE_DIM : 1;
  return 1;
}

// -----------------------------------------------------------------------------
// The one and only visible control: a giant circular button built from many
// small hexagonal LEDs, clipped to a perfect circle. Boots with a power-on
// flicker, shimmers while idle, flips digitally between colours, ticks softly
// on web, pulses haptically on device, and supports a double-tap cancel while
// red is active.
// -----------------------------------------------------------------------------
export default function TrafficLightButton({ size }) {
  const { hexes, center, CR } = useMemo(() => generateHexGrid(size), [size]);
  const { progress, from, to, delays, phase, start, cancel } = useTrafficSequence(hexes.length);
  const interactive = phase === 'IDLE_GREEN';
  const cancellable = phase === 'RED_ACTIVE';

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

  const buzz = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
  };

  // Cancel confirmation: one quick bright pulse across the whole face.
  const pulse = useRef(new Animated.Value(0)).current;
  const firePulse = () => {
    pulse.setValue(0);
    Animated.sequence([
      Animated.timing(pulse, {
        toValue: 1,
        duration: CONFIG.PULSE_IN,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
      Animated.timing(pulse, {
        toValue: 0,
        duration: CONFIG.PULSE_OUT,
        easing: Easing.in(Easing.quad),
        useNativeDriver: false,
      }),
    ]).start();
  };

  // Single tap activates from idle; a quick double-tap during red cancels early.
  const lastTapRef = useRef(0);
  const handlePress = () => {
    if (cancellable) {
      const now = Date.now();
      if (now - lastTapRef.current < CONFIG.DOUBLE_TAP_WINDOW) {
        lastTapRef.current = 0;
        buzz();
        firePulse();
        cancel();
      } else {
        lastTapRef.current = now;
      }
      return;
    }
    buzz();
    start();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={!interactive && !cancellable}
      testID="traffic-light-button"
      accessibilityRole="button"
      accessibilityLabel="Traffic light button"
      accessibilityState={{ disabled: !interactive && !cancellable }}
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
              cueFrom={cueFactor(h, from)}
              cueTo={cueFactor(h, to)}
            />
          ))}
        </G>

        {/* Cancel confirmation flash (invisible at rest) */}
        <AnimatedCircle
          cx={center}
          cy={center}
          r={CR}
          fill="#ffffff"
          opacity={pulse.interpolate({ inputRange: [0, 1], outputRange: [0, CONFIG.PULSE_OPACITY] })}
        />

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
