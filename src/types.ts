export interface Company {
  id: string;
  name: string;
  websiteUrl: string;
  /** Must be one of the values in DOMAINS (src/config/domains.ts). */
  domain: string;
  /** 0-100 continuous "full-stack execution / autonomy" score. */
  execution: number;
  description: string;
  /** Why this company is placed at this domain/execution position. */
  rationale: string;
  tag?: string;
}

export type CompanyDraft = Omit<Company, "id">;

export type ViewMode = "map" | "grid";
