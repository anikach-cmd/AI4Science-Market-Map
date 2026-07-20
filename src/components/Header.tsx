import { useRef, useState } from "react";
import type { ViewMode } from "../types";

interface HeaderProps {
  title: string;
  onTitleChange: (title: string) => void;
  view: ViewMode;
  onViewChange: (view: ViewMode) => void;
  onAddClick: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onResetToSeed: () => void;
  companyCount: number;
  matchCount: number;
  query: string;
  onQueryChange: (query: string) => void;
}

export function Header({
  title,
  onTitleChange,
  view,
  onViewChange,
  onAddClick,
  onExport,
  onImport,
  onResetToSeed,
  companyCount,
  matchCount,
  query,
  onQueryChange,
}: HeaderProps) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [draftTitle, setDraftTitle] = useState(title);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const commitTitle = () => {
    onTitleChange(draftTitle.trim() || title);
    setEditingTitle(false);
  };

  const searching = query.trim().length > 0;

  return (
    <header className="app-header">
      <div className="app-header-title">
        {editingTitle ? (
          <input
            className="title-input"
            autoFocus
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitTitle();
              if (e.key === "Escape") {
                setDraftTitle(title);
                setEditingTitle(false);
              }
            }}
          />
        ) : (
          <h1
            onClick={() => {
              setDraftTitle(title);
              setEditingTitle(true);
            }}
            title="Click to rename"
          >
            {title}
          </h1>
        )}
        <span className="company-count-badge">
          {searching ? `${matchCount} of ${companyCount} companies` : `${companyCount} companies`}
        </span>
      </div>

      <div className="app-header-controls">
        <input
          className="search-input"
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search companies…"
          aria-label="Search companies"
        />

        <div className="view-toggle">
          <button
            className={view === "map" ? "active" : ""}
            onClick={() => onViewChange("map")}
          >
            Map view
          </button>
          <button
            className={view === "grid" ? "active" : ""}
            onClick={() => onViewChange("grid")}
          >
            Grid view
          </button>
        </div>

        <button className="btn btn-primary" onClick={onAddClick}>
          + Add company
        </button>
        <button className="btn btn-ghost" onClick={onExport}>
          Export JSON
        </button>
        <button
          className="btn btn-ghost"
          onClick={() => fileInputRef.current?.click()}
        >
          Import JSON
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onImport(file);
            e.target.value = "";
          }}
        />
        <button
          className="btn btn-ghost"
          title="Discard current data and reload the built-in seed companies"
          onClick={() => {
            if (
              window.confirm(
                "Reset to the built-in seed companies? This replaces everything currently on the map — export first if you want to keep it."
              )
            ) {
              onResetToSeed();
            }
          }}
        >
          Reset to seed data
        </button>
      </div>
    </header>
  );
}
