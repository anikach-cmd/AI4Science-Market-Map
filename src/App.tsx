import { useState } from "react";
import { GridView } from "./components/GridView";
import { Header } from "./components/Header";
import { MapView } from "./components/MapView";
import { CompanyForm } from "./components/CompanyForm";
import { useCompanies } from "./hooks/useCompanies";
import { useMapConfig } from "./hooks/useMapConfig";
import type { CompanyDraft, ViewMode } from "./types";

function App() {
  const {
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
  } = useCompanies();

  const {
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
  } = useMapConfig();

  const [view, setView] = useState<ViewMode>("map");
  const [showAddForm, setShowAddForm] = useState(false);

  const emptyDraft: CompanyDraft = {
    name: "",
    websiteUrl: "",
    domain: domains[0],
    execution: 50,
    description: "",
    rationale: "",
    tag: "",
  };

  const handleRenameDomain = (index: number, newName: string) => {
    const oldName = domains[index];
    if (oldName === newName) return;
    renameDomain(index, newName);
    replaceAll(
      companies.map((c) =>
        c.domain === oldName ? { ...c, domain: newName } : c
      )
    );
  };

  const handleRemoveDomain = (index: number) => {
    const name = domains[index];
    if (domains.length <= 1) {
      alert("You need at least one domain column.");
      return;
    }
    const count = companies.filter((c) => c.domain === name).length;
    if (count > 0) {
      alert(
        `"${name}" has ${count} compan${
          count === 1 ? "y" : "ies"
        } in it. Move or delete them first (edit each company's domain, or delete it).`
      );
      return;
    }
    removeDomainAt(index);
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
      />

      {view === "map" ? (
        <MapView
          companies={companies}
          onAdd={addCompany}
          onUpdate={updateCompany}
          onDelete={deleteCompany}
          domains={domains}
          onRenameDomain={handleRenameDomain}
          onAddDomain={addDomain}
          onRemoveDomain={handleRemoveDomain}
          onMoveDomain={moveDomain}
          bands={bands}
          onRenameBand={renameBand}
          onAddBand={addBand}
          onRemoveBand={removeBandAt}
          onMoveBand={moveBand}
        />
      ) : (
        <GridView
          companies={companies}
          onUpdate={updateCompany}
          onDelete={deleteCompany}
          domains={domains}
          bandLabels={bandLabels}
        />
      )}

      {showAddForm && (
        <CompanyForm
          initial={emptyDraft}
          isEditing={false}
          domains={domains}
          bandLabels={bandLabels}
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
