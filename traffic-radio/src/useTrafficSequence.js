import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';
import { CONFIG } from './config';
import { performAction } from './performAction';
import { playTickBurst } from './sound';

const C = CONFIG.COLORS;

// -----------------------------------------------------------------------------
// Traffic-light state machine.
//
// States:
//   BOOT (power-on flicker, ~0.5s)     -> IDLE_GREEN
//   IDLE_GREEN
//   TRANSITIONING_TO_YELLOW            -> YELLOW_PREPARATION
//   TRANSITIONING_TO_RED               -> RED_ACTIVE   (performAction fires here)
//   TRANSITIONING_TO_YELLOW_COMPLETION -> YELLOW_COMPLETION
//   TRANSITIONING_TO_GREEN             -> IDLE_GREEN
//
// Guarantees:
//   * Only one activation sequence runs at a time (runningRef).
//   * Taps are ignored unless we are in IDLE_GREEN (double-tap in RED_ACTIVE
//     cancels early and flips straight back to green).
//   * Timers are tracked and cleared on unmount/cancel; they cannot overlap.
//   * Every transition drives `progress` fully to 1, so LEDs never get stuck
//     between colours.
// -----------------------------------------------------------------------------
export function useTrafficSequence(waveDelays) {
  const ledCount = waveDelays.length;
  const progress = useRef(new Animated.Value(1)).current;
  const zeros = useMemo(() => new Array(ledCount).fill(0), [ledCount]);

  // A single transition descriptor. Bumping `seq` triggers the animation.
  const [trans, setTrans] = useState({
    from: CONFIG.OFF_COLOR,
    to: CONFIG.OFF_COLOR,
    delays: zeros,
    seq: 0,
  });
  const [phase, setPhase] = useState('BOOT');

  const runningRef = useRef(false);
  const currentRef = useRef(CONFIG.OFF_COLOR); // last settled colour
  const onDoneRef = useRef(null);
  const timers = useRef([]);
  const animRef = useRef(null);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  useEffect(
    () => () => {
      clearTimers();
      if (animRef.current) animRef.current.stop();
    },
    []
  );

  // Run the timing curve whenever a new transition is queued.
  useEffect(() => {
    if (trans.seq === 0) return; // initial unpowered state, nothing to animate
    playTickBurst();
    progress.setValue(0);
    const anim = Animated.timing(progress, {
      toValue: 1,
      duration: CONFIG.TRANSITION_DURATION,
      easing: Easing.linear, // uniform timing => evenly scattered digital flips
      useNativeDriver: false, // color / SVG-fill animation is not native-driver safe
    });
    animRef.current = anim;
    anim.start(({ finished }) => {
      if (finished && onDoneRef.current) onDoneRef.current();
    });
    return () => anim.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trans.seq]);

  // Per-LED switchAt values come from each hex's spatial position (left -> right),
  // so the new colour fills the circle as a wave front instead of random scatter.
  const makeDelays = useCallback(() => waveDelays.slice(), [waveDelays]);

  const runTransition = useCallback(
    (target, onDone) => {
      onDoneRef.current = () => {
        currentRef.current = target;
        onDone();
      };
      setTrans((t) => ({ from: currentRef.current, to: target, delays: makeDelays(), seq: t.seq + 1 }));
    },
    [makeDelays]
  );

  // Boot flicker: unpowered -> green, hexes popping on one at a time (~0.5s).
  useEffect(() => {
    runningRef.current = true;
    runTransition(C.green, () => {
      setPhase('IDLE_GREEN');
      runningRef.current = false;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const start = useCallback(() => {
    if (runningRef.current || phase !== 'IDLE_GREEN') return; // ignore taps mid-sequence
    runningRef.current = true;

    setPhase('TRANSITIONING_TO_YELLOW');
    runTransition(C.yellow, () => {
      setPhase('YELLOW_PREPARATION');
      timers.current.push(
        setTimeout(() => {
          setPhase('TRANSITIONING_TO_RED');
          runTransition(C.red, () => {
            setPhase('RED_ACTIVE');
            performAction(); // exactly once, when the red phase begins
            timers.current.push(
              setTimeout(() => {
                setPhase('TRANSITIONING_TO_YELLOW_COMPLETION');
                runTransition(C.yellow, () => {
                  setPhase('YELLOW_COMPLETION');
                  timers.current.push(
                    setTimeout(() => {
                      setPhase('TRANSITIONING_TO_GREEN');
                      runTransition(C.green, () => {
                        setPhase('IDLE_GREEN');
                        runningRef.current = false;
                      });
                    }, CONFIG.COMPLETION_DURATION)
                  );
                });
              }, CONFIG.ACTIVE_DURATION)
            );
          });
        }, CONFIG.PREPARATION_DURATION)
      );
    });
  }, [phase, runTransition]);

  // Early cancel: only valid during RED_ACTIVE. Clears the pending red timer
  // and flips straight back to interactive green (skips the amber completion).
  const cancel = useCallback(() => {
    if (phase !== 'RED_ACTIVE') return;
    clearTimers();
    setPhase('TRANSITIONING_TO_GREEN');
    runTransition(C.green, () => {
      setPhase('IDLE_GREEN');
      runningRef.current = false;
    });
  }, [phase, runTransition]);

  return { progress, from: trans.from, to: trans.to, delays: trans.delays, phase, start, cancel };
}

// Accessibility state text exposed to assistive technologies.
export const PHASE_A11Y = {
  BOOT: 'Starting',
  IDLE_GREEN: 'Ready',
  TRANSITIONING_TO_YELLOW: 'Preparing',
  YELLOW_PREPARATION: 'Preparing',
  TRANSITIONING_TO_RED: 'Preparing',
  RED_ACTIVE: 'Active, double tap to cancel',
  TRANSITIONING_TO_YELLOW_COMPLETION: 'Completing',
  YELLOW_COMPLETION: 'Completing',
  TRANSITIONING_TO_GREEN: 'Completing',
};
