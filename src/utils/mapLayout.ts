import type { Company } from "../types";

/** Companies grouped into `${domainLeafId}::${capabilityLeafId}` cells. */
export function groupIntoCells(companies: Company[]): Map<string, Company[]> {
  const cells = new Map<string, Company[]>();
  companies.forEach((c) => {
    const key = cellKey(c.domain, c.capabilityRow);
    if (!cells.has(key)) cells.set(key, []);
    cells.get(key)!.push(c);
  });
  cells.forEach((list) => list.sort((a, b) => a.name.localeCompare(b.name)));
  return cells;
}

export function cellKey(domainLeafId: string, capabilityLeafId: string): string {
  return `${domainLeafId}::${capabilityLeafId}`;
}

/**
 * Column/row track weight for a leaf, biased by how many companies it holds
 * so dense categories (e.g. Generalist) get visibly more space than sparse
 * ones (e.g. Earth Science) without going fully linear (which would make a
 * 90-company column ~90x wider than a 1-company one).
 */
export function trackWeight(count: number): number {
  return Math.sqrt(count) + 1;
}
