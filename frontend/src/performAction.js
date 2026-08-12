// -----------------------------------------------------------------------------
// Isolated placeholder action.
//
// This is intentionally kept free of any button / animation / state-machine
// dependencies so it can be replaced later with the real functionality without
// touching the rest of the app. It is called exactly once, when the red phase
// begins.
// -----------------------------------------------------------------------------
export function performAction() {
  // Replace this body with the real behaviour later.
  console.log('[performAction] Red phase started at', new Date().toISOString());
}
