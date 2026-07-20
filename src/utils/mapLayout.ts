import type { Company } from "../types";

export interface PlacedChip {
  company: Company;
  x: number;
  y: number;
}

const CHIP_HEIGHT = 34;
const CHIP_WIDTH = 122;

/**
 * Positions companies within their domain column by execution (y), fanning
 * out horizontally around the column center whenever chips would otherwise
 * overlap vertically.
 */
export function layoutMap(
  companies: Company[],
  domains: string[],
  plotWidth: number,
  plotHeight: number
): PlacedChip[] {
  if (plotWidth <= 0 || plotHeight <= 0) return [];
  const colWidth = plotWidth / domains.length;
  const result: PlacedChip[] = [];

  domains.forEach((domain, colIdx) => {
    const colCenterX = colWidth * (colIdx + 0.5);
    const colCompanies = companies
      .filter((c) => c.domain === domain)
      .slice()
      .sort((a, b) => a.execution - b.execution);

    const withY = colCompanies.map((c) => ({
      company: c,
      y: plotHeight * (1 - c.execution / 100),
    }));

    let i = 0;
    while (i < withY.length) {
      let j = i + 1;
      while (j < withY.length && withY[j].y - withY[j - 1].y < CHIP_HEIGHT) {
        j++;
      }
      const cluster = withY.slice(i, j);
      const n = cluster.length;
      const maxSpread = Math.max(0, Math.min(colWidth - CHIP_WIDTH - 8, CHIP_WIDTH * (n - 1)));
      const spacing = n > 1 ? maxSpread / (n - 1) : 0;
      const startX = colCenterX - (spacing * (n - 1)) / 2;
      cluster.forEach((item, k) => {
        result.push({
          company: item.company,
          x: startX + spacing * k,
          y: item.y,
        });
      });
      i = j;
    }
  });

  return result;
}

export function pixelToExecution(y: number, plotHeight: number): number {
  const raw = 100 * (1 - y / plotHeight);
  return Math.max(0, Math.min(100, Math.round(raw)));
}

export function pixelToDomainIndex(
  x: number,
  plotWidth: number,
  domainCount: number
): number {
  const colWidth = plotWidth / domainCount;
  const idx = Math.floor(x / colWidth);
  return Math.max(0, Math.min(domainCount - 1, idx));
}
