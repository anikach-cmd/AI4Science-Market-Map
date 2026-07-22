export interface Company {
  id: string;
  name: string;
  websiteUrl: string;
  /** Leaf id from the domain axis (structure lives in app state, see useMapState.ts). */
  domain: string;
  /** Leaf id from the capability axis (structure lives in app state, see useMapState.ts). */
  capabilityRow: string;
  description: string;
  /** Why this company is placed at this domain/capability position. */
  rationale: string;
  tag?: string;
  /** Optional third variable, shown as a corner-dot legend on the chip. */
  foundedYear?: number;
}

export type CompanyDraft = Omit<Company, "id">;

export type ViewMode = "map" | "grid";
