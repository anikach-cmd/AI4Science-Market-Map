// ---------------------------------------------------------------------------
// DEFAULT domain columns (horizontal axis) and band labels (vertical axis).
// These are only the *initial* values — once the app runs, both axes are
// editable live from the UI (rename/add/remove/reorder) and persist to
// localStorage via useMapConfig. Edit here only to change what a fresh
// browser profile starts with.
// Domain order runs narrow specialist (left) -> generalist (right).
// Band label order runs bottom (least autonomous) -> top (most autonomous).
// ---------------------------------------------------------------------------
export const DEFAULT_DOMAINS: string[] = [
  "Protein design",
  "Small molecules & molecular design",
  "Genomics & DNA",
  "Materials & chemistry",
  "Cell & synthetic biology",
  "Clinical & translational",
  "Neuro & other",
  "Generalist",
];

export const DEFAULT_BAND_LABELS: string[] = [
  "Co-scientists & assistants",
  "Generative platforms",
  "Autonomous labs + generative agents",
];

export interface Band {
  name: string;
  min: number;
  max: number;
}

/** Divides the 0-100 execution axis into equal bands, bottom to top. */
export function buildBands(labels: string[]): Band[] {
  const n = Math.max(labels.length, 1);
  return labels.map((name, i) => ({
    name,
    min: (i / n) * 100,
    max: ((i + 1) / n) * 100,
  }));
}

export function bandForExecution(execution: number, bands: Band[]): Band {
  return (
    bands.find((b) => execution >= b.min && execution <= b.max) ??
    bands[bands.length - 1]
  );
}
