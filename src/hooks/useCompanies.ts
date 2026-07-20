import { useCallback, useEffect, useState } from "react";
import { SEED_COMPANIES } from "../data/seedCompanies";
import type { Company, CompanyDraft } from "../types";

const STORAGE_KEY = "ai-science-market-map:companies";
const TITLE_KEY = "ai-science-market-map:title";
const DEFAULT_TITLE = "AI for Science market map";

function loadCompanies(): Company[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_COMPANIES;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return SEED_COMPANIES;
    return parsed;
  } catch {
    return SEED_COMPANIES;
  }
}

function makeId(): string {
  return `c-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useCompanies() {
  const [companies, setCompanies] = useState<Company[]>(loadCompanies);
  const [title, setTitle] = useState<string>(
    () => localStorage.getItem(TITLE_KEY) ?? DEFAULT_TITLE
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(companies));
  }, [companies]);

  useEffect(() => {
    localStorage.setItem(TITLE_KEY, title);
  }, [title]);

  const addCompany = useCallback((draft: CompanyDraft): Company => {
    const company: Company = { ...draft, id: makeId() };
    setCompanies((prev) => [...prev, company]);
    return company;
  }, []);

  const updateCompany = useCallback((id: string, draft: CompanyDraft) => {
    setCompanies((prev) =>
      prev.map((c) => (c.id === id ? { ...draft, id } : c))
    );
  }, []);

  const deleteCompany = useCallback((id: string) => {
    setCompanies((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const replaceAll = useCallback((next: Company[]) => {
    setCompanies(next);
  }, []);

  const resetToSeed = useCallback(() => {
    setCompanies(SEED_COMPANIES);
    setTitle(DEFAULT_TITLE);
  }, []);

  const exportJson = useCallback(() => {
    const payload = { title, companies };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `market-map-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [title, companies]);

  const importJson = useCallback((file: File) => {
    file.text().then((text) => {
      try {
        const parsed = JSON.parse(text);
        const list: Company[] = Array.isArray(parsed)
          ? parsed
          : Array.isArray(parsed.companies)
          ? parsed.companies
          : [];
        if (!Array.isArray(list)) return;
        setCompanies(list);
        if (parsed.title && typeof parsed.title === "string") {
          setTitle(parsed.title);
        }
      } catch {
        alert("That file doesn't look like a valid market map export.");
      }
    });
  }, []);

  return {
    companies,
    addCompany,
    updateCompany,
    deleteCompany,
    replaceAll,
    resetToSeed,
    exportJson,
    importJson,
    title,
    setTitle,
  };
}
