import { useCallback, useEffect, useMemo, useState } from "react";
import {
  buildBands,
  DEFAULT_BAND_LABELS,
  DEFAULT_DOMAINS,
} from "../config/domains";

const DOMAINS_KEY = "ai-science-market-map:domains";
const BAND_LABELS_KEY = "ai-science-market-map:bandLabels";

function loadList(key: string, fallback: string[]): string[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function moveItem(list: string[], index: number, dir: -1 | 1): string[] {
  const target = index + dir;
  if (target < 0 || target >= list.length) return list;
  const next = list.slice();
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function useMapConfig() {
  const [domains, setDomains] = useState<string[]>(() =>
    loadList(DOMAINS_KEY, DEFAULT_DOMAINS)
  );
  const [bandLabels, setBandLabels] = useState<string[]>(() =>
    loadList(BAND_LABELS_KEY, DEFAULT_BAND_LABELS)
  );

  useEffect(() => {
    localStorage.setItem(DOMAINS_KEY, JSON.stringify(domains));
  }, [domains]);

  useEffect(() => {
    localStorage.setItem(BAND_LABELS_KEY, JSON.stringify(bandLabels));
  }, [bandLabels]);

  const renameDomain = useCallback((index: number, name: string) => {
    setDomains((d) => d.map((x, i) => (i === index ? name : x)));
  }, []);

  const addDomain = useCallback((name: string) => {
    setDomains((d) => [...d, name]);
  }, []);

  const removeDomainAt = useCallback((index: number) => {
    setDomains((d) => (d.length > 1 ? d.filter((_, i) => i !== index) : d));
  }, []);

  const moveDomain = useCallback((index: number, dir: -1 | 1) => {
    setDomains((d) => moveItem(d, index, dir));
  }, []);

  const renameBand = useCallback((index: number, name: string) => {
    setBandLabels((b) => b.map((x, i) => (i === index ? name : x)));
  }, []);

  const addBand = useCallback(() => {
    setBandLabels((b) => [...b, "New band"]);
  }, []);

  const removeBandAt = useCallback((index: number) => {
    setBandLabels((b) => (b.length > 1 ? b.filter((_, i) => i !== index) : b));
  }, []);

  const moveBand = useCallback((index: number, dir: -1 | 1) => {
    setBandLabels((b) => moveItem(b, index, dir));
  }, []);

  const bands = useMemo(() => buildBands(bandLabels), [bandLabels]);

  return {
    domains,
    renameDomain,
    addDomain,
    removeDomainAt,
    moveDomain,
    bandLabels,
    bands,
    renameBand,
    addBand,
    removeBandAt,
    moveBand,
  };
}
