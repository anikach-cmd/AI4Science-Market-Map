// Deterministic pastel color for a monogram fallback, derived from the name.
const PALETTE = [
  "#7A9E8C", // sage
  "#B08968", // warm tan
  "#8C7A9E", // muted plum
  "#5E8AA6", // muted blue
  "#A67C5E", // clay
  "#7A9E9E", // teal
  "#9E8C7A", // sand
  "#8AA65E", // olive
];

export function monogramColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export function monogramLetter(name: string): string {
  const trimmed = name.trim();
  return trimmed ? trimmed[0].toUpperCase() : "?";
}
