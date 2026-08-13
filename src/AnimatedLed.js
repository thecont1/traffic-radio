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
// Opacity: while idle a shared `shimmer` value drives a slow brightness wave.
// Otherwise the LED shows `opacity * cue`, where the cue factor encodes the
// optional colour-blind pattern (checker for amber, X for red). The cue flips
// digitally at the same `switchAt` moment as the colour.
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

function AnimatedLed({ points, opacity, progress, from, to, switchAt, shimmer, wavePhase, cueFrom, cueTo }) {
  const s = Math.min(Math.max(switchAt, 0), 0.9998);
  const fill = progress.interpolate({
    inputRange: [s, s + 0.0001], // tiny band => hard, digital flip
    outputRange: [from, to],
    extrapolate: 'clamp',
  });

  const fromO = opacity * cueFrom;
  const toO = opacity * cueTo;
  const fillOpacity = useMemo(() => {
    const shimmerOp = buildShimmerOpacity(shimmer, opacity, wavePhase);
    if (fromO === toO) {
      // Constant cue — shimmer alone is correct when cue is 1
      return cueFrom === 1 ? shimmerOp : Animated.multiply(shimmerOp, cueFrom);
    }
    // Cue flips at switchAt — interpolate it on progress, then modulate shimmer
    const cueVal = progress.interpolate({
      inputRange: [s, s + 0.0001],
      outputRange: [cueFrom, cueTo],
      extrapolate: 'clamp',
    });
    return Animated.multiply(shimmerOp, cueVal);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shimmer, opacity, wavePhase, fromO, toO, cueFrom, cueTo, s]);

  return <AnimatedPolygon points={points} fill={fill} fillOpacity={fillOpacity} />;
}

export default React.memo(AnimatedLed);
