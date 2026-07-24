import { createContext } from 'react';

// When true, the consuming player cell is part of the outgoing phase tree
// (the previous body kept mounted while it animates out). Cells swap their
// enter animation for a staggered slide-to-top exit while this is true.
export const PhaseExitContext = createContext(false);

// Tunables shared across the orchestrator and the cells. Keep these in
// lockstep — the orchestrator unmounts the outgoing body after
// PHASE_EXIT_TOTAL_MS, so any per-cell stagger + animation has to land
// before then.
export const CELL_STAGGER_MS = 100;
export const CELL_EXIT_DURATION_MS = 550;
// Total wall time the orchestrator keeps the outgoing body mounted.
// `(MAX_SLOTS - 1) × stagger` + animation duration + a small buffer for
// the layout commit that mounts the outgoing tree under PhaseExitContext.
const MAX_SLOTS = 6;
export const PHASE_EXIT_TOTAL_MS =
  (MAX_SLOTS - 1) * CELL_STAGGER_MS + CELL_EXIT_DURATION_MS + 150;
