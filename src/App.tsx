import { useMemo, useState } from "react";
import { CompanyForm } from "./components/CompanyForm";
import { GridView } from "./components/GridView";
import { Header } from "./components/Header";
import { MapView } from "./components/MapView";
import { useMapState } from "./hooks/useMapState";
import type { CompanyDraft, ViewMode } from "./types";

function App() {
  const {
    title,
    setTitle,
    companies,
    addCompany,
    updateCompany,
    deleteCompany,
    labelOverrides,
    renameLabel,
    resetToSeed,
    exportJson,
    importJson,
  } = useMapState();

  const [view, setView] = useState<ViewMode>("map");
  const [showAddForm, setShowAddForm] = useState(false);
  const [query, setQuery] = useState("");

  const matchCount = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return companies.length;
    return companies.filter((c) => c.name.toLowerCase().includes(q)).length;
  }, [companies, query]);

  const emptyDraft: CompanyDraft = {
    name: "",
    websiteUrl: "",
    domain: "generalist",
    capabilityRow: "generative-models",
    description: "",
    rationale: "",
    tag: "",
  };

  return (
    <div className="app">
      <Header
        title={title}
        onTitleChange={setTitle}
        view={view}
        onViewChange={setView}
        onAddClick={() => setShowAddForm(true)}
        onExport={exportJson}
        onImport={importJson}
        onResetToSeed={resetToSeed}
        companyCount={companies.length}
        matchCount={matchCount}
        query={query}
        onQueryChange={setQuery}
      />

      {view === "map" ? (
        <MapView
          companies={companies}
          onAdd={addCompany}
          onUpdate={updateCompany}
          onDelete={deleteCompany}
          labelOverrides={labelOverrides}
          onRenameLabel={renameLabel}
          query={query}
        />
      ) : (
        <GridView
          companies={companies}
          onUpdate={updateCompany}
          onDelete={deleteCompany}
          query={query}
        />
      )}

      {showAddForm && (
        <CompanyForm
          initial={emptyDraft}
          isEditing={false}
          onCancel={() => setShowAddForm(false)}
          onSave={(draft) => {
            addCompany(draft);
            setShowAddForm(false);
          }}
        />
      )}
    </div>
  );
}

export default App;
