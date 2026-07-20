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

/** Max chips shown inline in a cell before collapsing into a "+N more" chip. */
export const MAX_INLINE_CHIPS = 4;
