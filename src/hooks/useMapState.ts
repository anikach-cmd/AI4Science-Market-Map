import { useCallback, useEffect, useRef, useState } from "react";
import {
  DEFAULT_CAPABILITY_AXIS,
  DEFAULT_DOMAIN_AXIS,
  type AxisGroup,
} from "../config/taxonomy";
import { SEED_COMPANIES } from "../data/seedCompanies";
import type { Company, CompanyDraft } from "../types";

const STORAGE_KEY = "ai-science-market-map:v3:state";
const DEFAULT_TITLE = "AI for Science market map";
const SAVE_DEBOUNCE_MS = 800;

export type AxisKind = "domain" | "capability";

interface MapState {
  title: string;
  companies: Company[];
  domainAxis: AxisGroup[];
  capabilityAxis: AxisGroup[];
}

const DEFAULT_STATE: MapState = {
  title: DEFAULT_TITLE,
  companies: SEED_COMPANIES,
  domainAxis: DEFAULT_DOMAIN_AXIS,
  capabilityAxis: DEFAULT_CAPABILITY_AXIS,
};

function isMapStateLike(value: unknown): value is Record<string, unknown> & {
  title: string;
  companies: unknown[];
} {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return typeof v.title === "string" && Array.isArray(v.companies);
}

/** Fills in domainAxis/capabilityAxis with defaults for state saved before
 * structural axis editing existed (or any other malformed/missing field). */
function normalizeState(parsed: Record<string, unknown>): MapState {
  const domainAxis =
    Array.isArray(parsed.domainAxis) && parsed.domainAxis.length > 0
      ? (parsed.domainAxis as AxisGroup[])
      : DEFAULT_DOMAIN_AXIS;
  const capabilityAxis =
    Array.isArray(parsed.capabilityAxis) && parsed.capabilityAxis.length > 0
      ? (parsed.capabilityAxis as AxisGroup[])
      : DEFAULT_CAPABILITY_AXIS;
  return {
    title: parsed.title as string,
    companies: parsed.companies as Company[],
    domainAxis,
    capabilityAxis,
  };
}

function loadLocal(): MapState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    return isMapStateLike(parsed) ? normalizeState(parsed) : DEFAULT_STATE;
  } catch {
    return DEFAULT_STATE;
  }
}

function saveLocal(state: MapState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or unavailable — the in-memory state still works this session.
  }
}

function makeId(prefix = "c"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ---------------------------------------------------------------------------
// Pure axis-structure helpers. Each takes/returns a fresh AxisGroup[] so they
// drop straight into an immutable state update.
// ---------------------------------------------------------------------------

function renameAxisNodePure(groups: AxisGroup[], id: string, label: string): AxisGroup[] {
  return groups.map((g) =>
    g.id === id
      ? { ...g, label }
      : { ...g, leaves: g.leaves.map((l) => (l.id === id ? { ...l, label } : l)) }
  );
}

function addAxisGroupPure(
  groups: AxisGroup[],
  label: string,
  firstLeafLabel?: string
): AxisGroup[] {
  const leaves = firstLeafLabel ? [{ id: makeId("leaf"), label: firstLeafLabel }] : [];
  return [...groups, { id: makeId("group"), label, leaves }];
}

function addAxisLeafPure(groups: AxisGroup[], groupId: string, label: string): AxisGroup[] {
  const newLeaf = { id: makeId("leaf"), label };
  return groups.map((g) =>
    g.id === groupId ? { ...g, leaves: [...g.leaves, newLeaf] } : g
  );
}

/** Removes a leaf; a group that drops to zero leaves is dropped too. */
function removeAxisLeafPure(groups: AxisGroup[], leafId: string): AxisGroup[] {
  return groups
    .map((g) => ({ ...g, leaves: g.leaves.filter((l) => l.id !== leafId) }))
    .filter((g) => g.leaves.length > 0);
}

function moveAxisLeafPure(groups: AxisGroup[], leafId: string, dir: -1 | 1): AxisGroup[] {
  return groups.map((g) => {
    const idx = g.leaves.findIndex((l) => l.id === leafId);
    if (idx === -1) return g;
    const target = idx + dir;
    if (target < 0 || target >= g.leaves.length) return g;
    const leaves = g.leaves.slice();
    [leaves[idx], leaves[target]] = [leaves[target], leaves[idx]];
    return { ...g, leaves };
  });
}

function moveAxisGroupPure(groups: AxisGroup[], groupId: string, dir: -1 | 1): AxisGroup[] {
  const idx = groups.findIndex((g) => g.id === groupId);
  if (idx === -1) return groups;
  const target = idx + dir;
  if (target < 0 || target >= groups.length) return groups;
  const next = groups.slice();
  [next[idx], next[target]] = [next[target], next[idx]];
  return next;
}

function updateAxis(
  s: MapState,
  axis: AxisKind,
  updater: (groups: AxisGroup[]) => AxisGroup[]
): MapState {
  return axis === "domain"
    ? { ...s, domainAxis: updater(s.domainAxis) }
    : { ...s, capabilityAxis: updater(s.capabilityAxis) };
}

/**
 * Owns the entire map's persisted state (title, companies, and the fully
 * editable domain/capability axis structure). Writes instantly to
 * localStorage as a local cache, and debounces a POST to /api/state so the
 * same data is shared with everyone who opens the deployed site (see
 * api/state.ts + Redis). In plain `npm run dev` there is no /api route, so
 * those requests fail silently and the app runs exactly as it did on
 * localStorage alone.
 */
export function useMapState() {
  const [state, setState] = useState<MapState>(loadLocal);
  const saveTimer = useRef<number | null>(null);
  const skipNextPost = useRef(true);
  // If the user changes anything before the initial server fetch resolves,
  // that fetch must not clobber their edit with the older saved state.
  const hasLocalEdit = useRef(false);

  const setStateAndMarkEdited: typeof setState = useCallback((update) => {
    hasLocalEdit.current = true;
    setState(update);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/state")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || hasLocalEdit.current || !isMapStateLike(data)) return;
        skipNextPost.current = true;
        setState(normalizeState(data));
      })
      .catch(() => {
        // No API reachable (local dev, or offline) — local/seed state stands.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    saveLocal(state);
    if (skipNextPost.current) {
      skipNextPost.current = false;
      return;
    }
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state),
      }).catch(() => {
        // Offline or no API (local dev) — localStorage already has this state.
      });
    }, SAVE_DEBOUNCE_MS);
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [state]);

  const setTitle = useCallback((title: string) => {
    setStateAndMarkEdited((s) => ({ ...s, title }));
  }, [setStateAndMarkEdited]);

  const addCompany = useCallback((draft: CompanyDraft): Company => {
    const company: Company = { ...draft, id: makeId() };
    setStateAndMarkEdited((s) => ({ ...s, companies: [...s.companies, company] }));
    return company;
  }, [setStateAndMarkEdited]);

  const updateCompany = useCallback((id: string, draft: CompanyDraft) => {
    setStateAndMarkEdited((s) => ({
      ...s,
      companies: s.companies.map((c) => (c.id === id ? { ...draft, id } : c)),
    }));
  }, [setStateAndMarkEdited]);

  const deleteCompany = useCallback((id: string) => {
    setStateAndMarkEdited((s) => ({
      ...s,
      companies: s.companies.filter((c) => c.id !== id),
    }));
  }, [setStateAndMarkEdited]);

  const renameAxisNode = useCallback((axis: AxisKind, id: string, label: string) => {
    setStateAndMarkEdited((s) => updateAxis(s, axis, (g) => renameAxisNodePure(g, id, label)));
  }, [setStateAndMarkEdited]);

  const addAxisGroup = useCallback(
    (axis: AxisKind, label: string, firstLeafLabel?: string) => {
      setStateAndMarkEdited((s) =>
        updateAxis(s, axis, (g) => addAxisGroupPure(g, label, firstLeafLabel))
      );
    },
    [setStateAndMarkEdited]
  );

  const addAxisLeaf = useCallback((axis: AxisKind, groupId: string, label: string) => {
    setStateAndMarkEdited((s) => updateAxis(s, axis, (g) => addAxisLeafPure(g, groupId, label)));
  }, [setStateAndMarkEdited]);

  const removeAxisLeaf = useCallback((axis: AxisKind, leafId: string) => {
    setStateAndMarkEdited((s) => updateAxis(s, axis, (g) => removeAxisLeafPure(g, leafId)));
  }, [setStateAndMarkEdited]);

  const moveAxisLeaf = useCallback((axis: AxisKind, leafId: string, dir: -1 | 1) => {
    setStateAndMarkEdited((s) => updateAxis(s, axis, (g) => moveAxisLeafPure(g, leafId, dir)));
  }, [setStateAndMarkEdited]);

  const moveAxisGroup = useCallback((axis: AxisKind, groupId: string, dir: -1 | 1) => {
    setStateAndMarkEdited((s) => updateAxis(s, axis, (g) => moveAxisGroupPure(g, groupId, dir)));
  }, [setStateAndMarkEdited]);

  const resetToSeed = useCallback(() => {
    setStateAndMarkEdited({ ...DEFAULT_STATE });
  }, [setStateAndMarkEdited]);

  const exportJson = useCallback(() => {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `market-map-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [state]);

  const importJson = useCallback((file: File) => {
    file.text().then((text) => {
      try {
        const parsed = JSON.parse(text);
        const companiesList: Company[] = Array.isArray(parsed)
          ? parsed
          : Array.isArray(parsed.companies)
          ? parsed.companies
          : [];
        if (companiesList.length === 0) {
          alert("That file doesn't look like a valid market map export.");
          return;
        }
        const shaped = Array.isArray(parsed)
          ? { title: DEFAULT_TITLE, companies: companiesList }
          : parsed;
        setStateAndMarkEdited(normalizeState({ ...shaped, companies: companiesList }));
      } catch {
        alert("That file doesn't look like a valid market map export.");
      }
    });
  }, [setStateAndMarkEdited]);

  return {
    title: state.title,
    setTitle,
    companies: state.companies,
    addCompany,
    updateCompany,
    deleteCompany,
    domainAxis: state.domainAxis,
    capabilityAxis: state.capabilityAxis,
    renameAxisNode,
    addAxisGroup,
    addAxisLeaf,
    removeAxisLeaf,
    moveAxisLeaf,
    moveAxisGroup,
    resetToSeed,
    exportJson,
    importJson,
  };
}
