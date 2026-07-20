export interface FoundedYearBucket {
  label: string;
  color: string;
}

const BUCKETS: { test: (year: number) => boolean; bucket: FoundedYearBucket }[] = [
  { test: (y) => y >= 2024, bucket: { label: "2024+", color: "#4f7a5c" } },
  { test: (y) => y >= 2021, bucket: { label: "2021–2023", color: "#c98a3c" } },
  { test: () => true, bucket: { label: "Pre-2021", color: "#5b6b8c" } },
];

export const FOUNDED_YEAR_LEGEND: FoundedYearBucket[] = [
  BUCKETS[0].bucket,
  BUCKETS[1].bucket,
  BUCKETS[2].bucket,
];

/** Returns null when no founded year is set — chip shows no dot at all. */
export function foundedYearBucket(year: number | undefined): FoundedYearBucket | null {
  if (!year) return null;
  return (BUCKETS.find((b) => b.test(year)) ?? BUCKETS[2]).bucket;
}
