import { useCallback, useEffect, useRef, useState } from "react";
import { SEED_COMPANIES } from "../data/seedCompanies";
import type { Company, CompanyDraft } from "../types";

const STORAGE_KEY = "ai-science-market-map:v2:state";
const DEFAULT_TITLE = "AI for Science market map";
const SAVE_DEBOUNCE_MS = 800;

interface MapState {
  title: string;
  companies: Company[];
  labelOverrides: Record<string, string>;
}

const DEFAULT_STATE: MapState = {
  title: DEFAULT_TITLE,
  companies: SEED_COMPANIES,
  labelOverrides: {},
};

function isMapState(value: unknown): value is MapState {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return typeof v.title === "string" && Array.isArray(v.companies);
}

function loadLocal(): MapState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    if (isMapState(parsed)) {
      return {
        title: parsed.title,
        companies: parsed.companies,
        labelOverrides: parsed.labelOverrides ?? {},
      };
    }
    return DEFAULT_STATE;
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

function makeId(): string {
  return `c-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Owns the entire map's persisted state (title, companies, axis label
 * overrides). Writes instantly to localStorage as a local cache, and
 * debounces a POST to /api/state so the same data is shared with everyone
 * who opens the deployed site (see api/state.ts + Vercel KV). In plain
 * `npm run dev` there is no /api route, so those requests fail silently and
 * the app runs exactly as it did on localStorage alone.
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
        if (cancelled || hasLocalEdit.current || !isMapState(data)) return;
        skipNextPost.current = true;
        setState({
          title: data.title,
          companies: data.companies,
          labelOverrides: data.labelOverrides ?? {},
        });
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

  const renameLabel = useCallback((id: string, label: string) => {
    setStateAndMarkEdited((s) => ({
      ...s,
      labelOverrides: { ...s.labelOverrides, [id]: label },
    }));
  }, [setStateAndMarkEdited]);

  const resetToSeed = useCallback(() => {
    setStateAndMarkEdited({ title: DEFAULT_TITLE, companies: SEED_COMPANIES, labelOverrides: {} });
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
        setStateAndMarkEdited({
          title: typeof parsed.title === "string" ? parsed.title : DEFAULT_TITLE,
          companies: companiesList,
          labelOverrides:
            parsed && typeof parsed === "object" && parsed.labelOverrides
              ? parsed.labelOverrides
              : {},
        });
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
    labelOverrides: state.labelOverrides,
    renameLabel,
    resetToSeed,
    exportJson,
    importJson,
  };
}
