import React from 'react';
import { Animated } from 'react-native';
import { Polygon } from 'react-native-svg';

const AnimatedPolygon = Animated.createAnimatedComponent(Polygon);

// -----------------------------------------------------------------------------
// A single hexagonal LED.
//
// All LEDs share one `progress` Animated.Value (0 -> 1 over TRANSITION_DURATION).
// Each LED has its own `switchAt` point in [0, 1). It stays on the old colour
// until progress crosses that point, then flips (near-instantly) to the target
// colour — a "digital" switch rather than a smooth cross-fade. Because the
// switch points are scattered across the whole window, hexagons change one at a
// time in a randomised wave, and by progress = 1 every LED has flipped, so none
// can get stuck between colours.
// -----------------------------------------------------------------------------
function AnimatedLed({ points, opacity, progress, from, to, switchAt }) {
  const s = Math.min(Math.max(switchAt, 0), 0.998);
  const fill = progress.interpolate({
    inputRange: [s, s + 0.001], // tiny band => hard, digital flip
    outputRange: [from, to],
    extrapolate: 'clamp',
  });

  return <AnimatedPolygon points={points} fill={fill} fillOpacity={opacity} />;
}

export default React.memo(AnimatedLed);
