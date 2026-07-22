import { useMemo, useState } from "react";
import { type AxisGroup } from "../config/taxonomy";
import type { AxisKind } from "../hooks/useMapState";
import type { Company, CompanyDraft } from "../types";
import { cellKey, groupIntoCells, trackWeight } from "../utils/mapLayout";
import { CompanyChip } from "./CompanyChip";
import { CompanyForm } from "./CompanyForm";
import { EditableText } from "./EditableText";
import { Legend } from "./Legend";

interface MapViewProps {
  companies: Company[];
  domainAxis: AxisGroup[];
  capabilityAxis: AxisGroup[];
  onAdd: (draft: CompanyDraft) => void;
  onUpdate: (id: string, draft: CompanyDraft) => void;
  onDelete: (id: string) => void;
  onRenameAxisNode: (axis: AxisKind, id: string, label: string) => void;
  onAddAxisGroup: (axis: AxisKind, label: string, firstLeafLabel?: string) => void;
  onAddAxisLeaf: (axis: AxisKind, groupId: string, label: string) => void;
  onRemoveAxisLeaf: (axis: AxisKind, leafId: string) => void;
  onMoveAxisLeaf: (axis: AxisKind, leafId: string, direction: -1 | 1) => void;
  onMoveAxisGroup: (axis: AxisKind, groupId: string, direction: -1 | 1) => void;
  query: string;
}

/** Leaves of an axis, each carrying its 0-based position among all leaves. */
function indexedLeaves(axis: AxisGroup[]) {
  let i = 0;
  return axis.flatMap((group) =>
    group.leaves.map((leaf) => ({ leaf, index: i++ }))
  );
}

/** Groups of an axis, each carrying the leaf-index range it spans. */
function indexedGroups(axis: AxisGroup[]) {
  let i = 0;
  return axis.map((group) => {
    const startIndex = i;
    i += group.leaves.length;
    return { group, startIndex, count: group.leaves.length };
  });
}

// Grid line numbers: columns 1-2 and rows 1-2 are reserved for axis
// group/leaf labels; domain/capability leaves start at line 3.
const LABEL_TRACKS = 2;

export function MapView({
  companies,
  domainAxis,
  capabilityAxis,
  onAdd,
  onUpdate,
  onDelete,
  onRenameAxisNode,
  onAddAxisGroup,
  onAddAxisLeaf,
  onRemoveAxisLeaf,
  onMoveAxisLeaf,
  onMoveAxisGroup,
  query,
}: MapViewProps) {
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [newDraft, setNewDraft] = useState<CompanyDraft | null>(null);
  const [addingAxis, setAddingAxis] = useState<AxisKind | null>(null);
  const [addGroupChoice, setAddGroupChoice] = useState<string>("__new__");
  const [addNewGroupLabel, setAddNewGroupLabel] = useState("");
  const [addLeafLabel, setAddLeafLabel] = useState("");

  const domainLeaves = useMemo(() => indexedLeaves(domainAxis), [domainAxis]);
  const capabilityLeaves = useMemo(() => indexedLeaves(capabilityAxis), [capabilityAxis]);
  const domainGroups = useMemo(() => indexedGroups(domainAxis), [domainAxis]);
  const capabilityGroups = useMemo(() => indexedGroups(capabilityAxis), [capabilityAxis]);

  const cells = useMemo(() => groupIntoCells(companies), [companies]);

  const domainCounts = useMemo(() => {
    const m = new Map<string, number>();
    companies.forEach((c) => m.set(c.domain, (m.get(c.domain) ?? 0) + 1));
    return m;
  }, [companies]);

  const capabilityCounts = useMemo(() => {
    const m = new Map<string, number>();
    companies.forEach((c) =>
      m.set(c.capabilityRow, (m.get(c.capabilityRow) ?? 0) + 1)
    );
    return m;
  }, [companies]);

  const gridTemplateColumns = useMemo(
    () =>
      `minmax(26px, auto) minmax(158px, auto) ${domainLeaves
        .map(
          ({ leaf }) =>
            `minmax(112px, ${trackWeight(domainCounts.get(leaf.id) ?? 0)}fr)`
        )
        .join(" ")}`,
    [domainLeaves, domainCounts]
  );

  const gridTemplateRows = useMemo(
    () =>
      `minmax(22px, auto) minmax(42px, auto) ${capabilityLeaves
        .map(
          ({ leaf }) =>
            `minmax(56px, ${trackWeight(capabilityCounts.get(leaf.id) ?? 0)}fr)`
        )
        .join(" ")}`,
    [capabilityLeaves, capabilityCounts]
  );

  const emptyDraft = (domain: string, capabilityRow: string): CompanyDraft => ({
    name: "",
    websiteUrl: "",
    domain,
    capabilityRow,
    description: "",
    rationale: "",
    tag: "",
  });

  const handleCellClick = (
    e: React.MouseEvent,
    domainId: string,
    capabilityId: string
  ) => {
    if (e.target !== e.currentTarget) return;
    setNewDraft(emptyDraft(domainId, capabilityId));
  };

  const handleDragEnd = (
    company: Company,
    clientX: number,
    clientY: number
  ) => {
    const el = document.elementFromPoint(clientX, clientY);
    const cellEl = (el as HTMLElement | null)?.closest<HTMLElement>(".map-cell");
    if (!cellEl) return;
    const domain = cellEl.dataset.domain;
    const capabilityRow = cellEl.dataset.capability;
    if (!domain || !capabilityRow) return;
    const { id, ...rest } = company;
    onUpdate(id, { ...rest, domain, capabilityRow });
  };

  const openAddForm = (axis: AxisKind) => {
    const axisGroups = axis === "domain" ? domainAxis : capabilityAxis;
    setAddingAxis(axis);
    setAddGroupChoice(axisGroups[0]?.id ?? "__new__");
    setAddNewGroupLabel("");
    setAddLeafLabel("");
  };

  const closeAddForm = () => setAddingAxis(null);

  const confirmAdd = () => {
    if (!addingAxis || !addLeafLabel.trim()) return;
    if (addGroupChoice === "__new__") {
      if (!addNewGroupLabel.trim()) return;
      onAddAxisGroup(addingAxis, addNewGroupLabel.trim(), addLeafLabel.trim());
    } else {
      onAddAxisLeaf(addingAxis, addGroupChoice, addLeafLabel.trim());
    }
    closeAddForm();
  };

  return (
    <div className="map-view">
      <div className="map-legend">
        <div className="legend-item">
          <span className="legend-swatch" />
          Logo chip — hover for details, click to pin, drag to reposition
        </div>
        <div className="legend-item">Click empty space to add a company</div>
        <button
          type="button"
          className="btn-add-axis"
          onClick={() => openAddForm("domain")}
        >
          + Add column
        </button>
        <button
          type="button"
          className="btn-add-axis"
          onClick={() => openAddForm("capability")}
        >
          + Add row
        </button>
        <div className="legend-spacer" />
        <Legend />
      </div>

      {addingAxis && (
        <div className="axis-add-form">
          <span className="axis-add-form-title">
            New {addingAxis === "domain" ? "column" : "row"}
          </span>
          <select
            value={addGroupChoice}
            onChange={(e) => setAddGroupChoice(e.target.value)}
          >
            {(addingAxis === "domain" ? domainAxis : capabilityAxis).map((g) => (
              <option key={g.id} value={g.id}>
                {g.label ?? "(ungrouped)"}
              </option>
            ))}
            <option value="__new__">— New group —</option>
          </select>
          {addGroupChoice === "__new__" && (
            <input
              autoFocus
              placeholder="New group name"
              value={addNewGroupLabel}
              onChange={(e) => setAddNewGroupLabel(e.target.value)}
            />
          )}
          <input
            placeholder={addingAxis === "domain" ? "Column name" : "Row name"}
            value={addLeafLabel}
            onChange={(e) => setAddLeafLabel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && confirmAdd()}
          />
          <button type="button" className="btn btn-primary" onClick={confirmAdd}>
            Add
          </button>
          <button type="button" className="btn btn-ghost" onClick={closeAddForm}>
            Cancel
          </button>
        </div>
      )}

      <div className="map-grid-scroll">
      <div
        className="map-super-grid"
        style={{ gridTemplateColumns, gridTemplateRows }}
      >
        <div
          className="map-corner-spacer"
          style={{
            gridColumn: `1 / span ${LABEL_TRACKS}`,
            gridRow: `1 / span ${LABEL_TRACKS}`,
          }}
        />

        {domainGroups.map(
          ({ group, startIndex, count }) =>
            group.label && (
              <div
                key={group.id}
                className="axis-group-span axis-group-span-row axis-group-span-bracket"
                style={{
                  gridColumn: `${startIndex + LABEL_TRACKS + 1} / span ${count}`,
                  gridRow: 1,
                }}
              >
                <EditableText
                  className="axis-group-label"
                  inputClassName="axis-group-label-input"
                  value={group.label}
                  onCommit={(name) => onRenameAxisNode("domain", group.id, name)}
                  title="Click to rename"
                />
                <span className="axis-item-controls">
                  <button
                    type="button"
                    title="Move left"
                    onClick={() => onMoveAxisGroup("domain", group.id, -1)}
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    title="Move right"
                    onClick={() => onMoveAxisGroup("domain", group.id, 1)}
                  >
                    →
                  </button>
                </span>
              </div>
            )
        )}

        {domainLeaves.map(({ leaf, index }) => (
          <div
            key={leaf.id}
            className="map-column-header"
            style={{ gridColumn: index + LABEL_TRACKS + 1, gridRow: 2 }}
          >
            <EditableText
              className="map-column-header-text"
              inputClassName="map-column-header-input"
              value={leaf.label}
              onCommit={(name) => onRenameAxisNode("domain", leaf.id, name)}
              title="Click to rename"
            />
            <span className="map-column-header-count">
              {domainCounts.get(leaf.id) ?? 0} co.
            </span>
            <span className="axis-item-controls">
              <button
                type="button"
                title="Move left"
                onClick={() => onMoveAxisLeaf("domain", leaf.id, -1)}
              >
                ←
              </button>
              <button
                type="button"
                title="Move right"
                onClick={() => onMoveAxisLeaf("domain", leaf.id, 1)}
              >
                →
              </button>
              <button
                type="button"
                title="Remove column"
                className="axis-item-remove"
                onClick={() => onRemoveAxisLeaf("domain", leaf.id)}
              >
                ×
              </button>
            </span>
          </div>
        ))}

        {capabilityGroups.map(
          ({ group, startIndex, count }) =>
            group.label && (
              <div
                key={group.id}
                className="axis-group-span axis-group-span-column axis-group-span-bracket"
                style={{
                  gridRow: `${startIndex + LABEL_TRACKS + 1} / span ${count}`,
                  gridColumn: 1,
                }}
              >
                <EditableText
                  className="axis-group-label"
                  inputClassName="axis-group-label-input"
                  value={group.label}
                  onCommit={(name) => onRenameAxisNode("capability", group.id, name)}
                  title="Click to rename"
                />
                <span className="axis-item-controls">
                  <button
                    type="button"
                    title="Move up"
                    onClick={() => onMoveAxisGroup("capability", group.id, -1)}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    title="Move down"
                    onClick={() => onMoveAxisGroup("capability", group.id, 1)}
                  >
                    ↓
                  </button>
                </span>
              </div>
            )
        )}

        {capabilityLeaves.map(({ leaf, index }) => (
          <div
            key={leaf.id}
            className="band-label"
            style={{ gridColumn: 2, gridRow: index + LABEL_TRACKS + 1 }}
          >
            <EditableText
              className="band-label-text"
              inputClassName="band-label-input"
              value={leaf.label}
              onCommit={(name) => onRenameAxisNode("capability", leaf.id, name)}
              title="Click to rename"
            />
            <span className="band-label-count">
              {capabilityCounts.get(leaf.id) ?? 0} co.
            </span>
            <span className="axis-item-controls">
              <button
                type="button"
                title="Move up"
                onClick={() => onMoveAxisLeaf("capability", leaf.id, -1)}
              >
                ↑
              </button>
              <button
                type="button"
                title="Move down"
                onClick={() => onMoveAxisLeaf("capability", leaf.id, 1)}
              >
                ↓
              </button>
              <button
                type="button"
                title="Remove row"
                className="axis-item-remove"
                onClick={() => onRemoveAxisLeaf("capability", leaf.id)}
              >
                ×
              </button>
            </span>
          </div>
        ))}

        {domainLeaves.flatMap(({ leaf: domainLeaf, index: di }) =>
          capabilityLeaves.map(({ leaf: capLeaf, index: ci }) => {
            const key = cellKey(domainLeaf.id, capLeaf.id);
            const cellCompanies = cells.get(key) ?? [];
            const q = query.trim().toLowerCase();
            const ordered = q
              ? [...cellCompanies].sort((a, b) => {
                  const aMatch = a.name.toLowerCase().includes(q) ? 0 : 1;
                  const bMatch = b.name.toLowerCase().includes(q) ? 0 : 1;
                  return aMatch - bMatch || a.name.localeCompare(b.name);
                })
              : cellCompanies;

            return (
              <div
                key={key}
                className="map-cell"
                data-domain={domainLeaf.id}
                data-capability={capLeaf.id}
                style={{ gridColumn: di + LABEL_TRACKS + 1, gridRow: ci + LABEL_TRACKS + 1 }}
                onClick={(e) => handleCellClick(e, domainLeaf.id, capLeaf.id)}
              >
                {ordered.map((company) => (
                  <CompanyChip
                    key={company.id}
                    company={company}
                    query={query}
                    onEdit={setEditingCompany}
                    onDelete={onDelete}
                    onDragEnd={handleDragEnd}
                  />
                ))}
              </div>
            );
          })
        )}
      </div>
      </div>

      {newDraft && (
        <CompanyForm
          initial={newDraft}
          isEditing={false}
          domainAxis={domainAxis}
          capabilityAxis={capabilityAxis}
          onCancel={() => setNewDraft(null)}
          onSave={(draft) => {
            onAdd(draft);
            setNewDraft(null);
          }}
        />
      )}

      {editingCompany && (
        <CompanyForm
          initial={editingCompany}
          isEditing
          domainAxis={domainAxis}
          capabilityAxis={capabilityAxis}
          onCancel={() => setEditingCompany(null)}
          onDelete={() => {
            onDelete(editingCompany.id);
            setEditingCompany(null);
          }}
          onSave={(draft) => {
            onUpdate(editingCompany.id, draft);
            setEditingCompany(null);
          }}
        />
      )}
    </div>
  );
}
