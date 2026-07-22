import { useMemo, useState } from "react";
import { CompanyForm } from "./components/CompanyForm";
import { GridView } from "./components/GridView";
import { Header } from "./components/Header";
import { MapView } from "./components/MapView";
import { flattenLeaves } from "./config/taxonomy";
import { useMapState, type AxisKind } from "./hooks/useMapState";
import type { CompanyDraft, ViewMode } from "./types";

function App() {
  const {
    title,
    setTitle,
    companies,
    addCompany,
    updateCompany,
    deleteCompany,
    domainAxis,
    capabilityAxis,
    renameAxisNode,
    addAxisGroup,
    addAxisLeaf,
    removeAxisLeaf,
    moveAxisLeaf,
    moveAxisGroup,
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
    domain: flattenLeaves(domainAxis)[0]?.id ?? "",
    capabilityRow: flattenLeaves(capabilityAxis)[0]?.id ?? "",
    description: "",
    rationale: "",
    tag: "",
  };

  const handleRemoveAxisLeaf = (axis: AxisKind, leafId: string) => {
    const occupied = companies.some((c) =>
      axis === "domain" ? c.domain === leafId : c.capabilityRow === leafId
    );
    if (occupied) {
      alert(
        "Move or delete the companies in this category before removing it."
      );
      return;
    }
    removeAxisLeaf(axis, leafId);
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
          domainAxis={domainAxis}
          capabilityAxis={capabilityAxis}
          onAdd={addCompany}
          onUpdate={updateCompany}
          onDelete={deleteCompany}
          onRenameAxisNode={renameAxisNode}
          onAddAxisGroup={addAxisGroup}
          onAddAxisLeaf={addAxisLeaf}
          onRemoveAxisLeaf={handleRemoveAxisLeaf}
          onMoveAxisLeaf={moveAxisLeaf}
          onMoveAxisGroup={moveAxisGroup}
          query={query}
        />
      ) : (
        <GridView
          companies={companies}
          domainAxis={domainAxis}
          capabilityAxis={capabilityAxis}
          onUpdate={updateCompany}
          onDelete={deleteCompany}
          query={query}
        />
      )}

      {showAddForm && (
        <CompanyForm
          initial={emptyDraft}
          isEditing={false}
          domainAxis={domainAxis}
          capabilityAxis={capabilityAxis}
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
