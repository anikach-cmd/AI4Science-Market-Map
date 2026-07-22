// ---------------------------------------------------------------------------
// Default two-level axis taxonomy. This is only the *starting point* — the
// live structure (groups, leaves, order, labels) is persisted in app state
// (see useMapState.ts) and is fully editable from the UI: add/remove/reorder
// columns and rows, not just rename them. These DEFAULT_* constants are used
// to seed a fresh install and as a migration fallback for older persisted
// state that predates structural editing. `id` is what Company.domain /
// Company.capabilityRow store, so renaming a label never breaks existing data.
// ---------------------------------------------------------------------------

export interface AxisLeaf {
  id: string;
  label: string;
}

export interface AxisGroup {
  id: string;
  /** null = standalone leaf group with no visible parent bracket/label. */
  label: string | null;
  leaves: AxisLeaf[];
}

// X-axis: Scientific domain.
export const DEFAULT_DOMAIN_AXIS: AxisGroup[] = [
  {
    id: "generalist",
    label: null,
    leaves: [{ id: "generalist", label: "Generalist" }],
  },
  {
    id: "life-sciences",
    label: "Life Sciences",
    leaves: [
      { id: "protein-design", label: "Protein Design" },
      { id: "antibody-design", label: "Antibody Design" },
      { id: "small-molecule-design", label: "Small Molecule Design" },
      { id: "genomics", label: "Genomics" },
      { id: "cell-therapy", label: "Cell Therapy" },
    ],
  },
  {
    id: "physical-sciences",
    label: "Physical Sciences",
    leaves: [
      { id: "materials-science", label: "Materials Science" },
      { id: "physics", label: "Physics" },
      { id: "earth-science", label: "Earth Science" },
    ],
  },
];

// Y-axis: Capability. Listed here in top (most autonomous) -> bottom
// (least autonomous) render order, matching the vertical layout on screen.
export const DEFAULT_CAPABILITY_AXIS: AxisGroup[] = [
  {
    id: "closed-loop",
    label: null,
    leaves: [
      { id: "closed-loop", label: "Closed-Loop Autonomous Science" },
    ],
  },
  {
    id: "experimental-execution",
    label: "Experimental Execution",
    leaves: [
      { id: "autonomous-labs", label: "Autonomous Labs" },
      { id: "cro-cloud-labs", label: "CROs / Cloud Labs" },
      { id: "drug-safety", label: "Drug Safety" },
      { id: "virtual-patients", label: "Virtual Patients/Cells & Clinical Trials" },
      { id: "co-scientists", label: "Co-Scientists" },
    ],
  },
  {
    id: "generative-models",
    label: null,
    leaves: [{ id: "generative-models", label: "Generative Models" }],
  },
];

export function flattenLeaves(axis: AxisGroup[]): AxisLeaf[] {
  return axis.flatMap((g) => g.leaves);
}

export function leafById(axis: AxisGroup[], id: string): AxisLeaf | undefined {
  return flattenLeaves(axis).find((l) => l.id === id);
}

export function labelForLeafId(axis: AxisGroup[], id: string): string {
  return leafById(axis, id)?.label ?? id;
}

export function groupContaining(axis: AxisGroup[], leafId: string): AxisGroup | undefined {
  return axis.find((g) => g.leaves.some((l) => l.id === leafId));
}
