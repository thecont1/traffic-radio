import React, { useMemo } from 'react';
import { Animated } from 'react-native';
import { Polygon } from 'react-native-svg';
import { CONFIG } from './config';

const AnimatedPolygon = Animated.createAnimatedComponent(
  // Strip the RN-only `collapsable` prop Animated injects; it is invalid on SVG DOM nodes.
  React.forwardRef(function CleanPolygon({ collapsable, ...rest }, ref) {
    return <Polygon ref={ref} {...rest} />;
  })
);

// -----------------------------------------------------------------------------
// A single hexagonal LED.
//
// Colour: all LEDs share one `progress` Animated.Value (0 -> 1 over
// TRANSITION_DURATION). Each LED has its own `switchAt` point in [0, 1). It
// stays on the old colour until progress crosses that point, then flips
// (near-instantly) to the target colour — a "digital" switch.
//
// Shimmer: while idle, a shared `shimmer` Animated.Value (0 -> 1 loop) drives a
// slow brightness wave. Each LED samples a triangular crest centred on its own
// `wavePhase` (with wrap-around), so the wave drifts smoothly across the face.
// When `shimmer` is null (any active sequence), the LED uses its static opacity.
// -----------------------------------------------------------------------------
function buildShimmerOpacity(shimmer, base, phase) {
  const N = 12;
  const inputRange = [];
  const outputRange = [];
  for (let i = 0; i <= N; i++) {
    const x = i / N;
    let d = Math.abs(x - phase);
    d = Math.min(d, 1 - d); // wrap-around distance
    const bump = Math.max(0, 1 - d / CONFIG.SHIMMER_WIDTH);
    inputRange.push(x);
    outputRange.push(Math.min(1, base * CONFIG.SHIMMER_DIM + bump * CONFIG.SHIMMER_BOOST));
  }
  return shimmer.interpolate({ inputRange, outputRange });
}

function AnimatedLed({ points, opacity, progress, from, to, switchAt, shimmer, wavePhase }) {
  const s = Math.min(Math.max(switchAt, 0), 0.9998);
  const fill = progress.interpolate({
    inputRange: [s, s + 0.0001], // tiny band => hard, digital flip
    outputRange: [from, to],
    extrapolate: 'clamp',
  });

  const fillOpacity = useMemo(
    () => (shimmer ? buildShimmerOpacity(shimmer, opacity, wavePhase) : opacity),
    [shimmer, opacity, wavePhase]
  );

  return <AnimatedPolygon points={points} fill={fill} fillOpacity={fillOpacity} />;
}

export default React.memo(AnimatedLed);
