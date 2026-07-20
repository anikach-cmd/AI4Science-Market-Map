import { useMemo, useState } from "react";
import {
  CAPABILITY_AXIS,
  DOMAIN_AXIS,
  type AxisGroup,
} from "../config/taxonomy";
import type { Company, CompanyDraft } from "../types";
import { cellKey, groupIntoCells, trackWeight } from "../utils/mapLayout";
import { CompanyChip } from "./CompanyChip";
import { CompanyForm } from "./CompanyForm";
import { EditableText } from "./EditableText";
import { Legend } from "./Legend";

interface MapViewProps {
  companies: Company[];
  onAdd: (draft: CompanyDraft) => void;
  onUpdate: (id: string, draft: CompanyDraft) => void;
  onDelete: (id: string) => void;
  labelOverrides: Record<string, string>;
  onRenameLabel: (id: string, label: string) => void;
  query: string;
}

function labelFor(overrides: Record<string, string>, id: string, fallback: string) {
  return overrides[id] ?? fallback;
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
  onAdd,
  onUpdate,
  onDelete,
  labelOverrides,
  onRenameLabel,
  query,
}: MapViewProps) {
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [newDraft, setNewDraft] = useState<CompanyDraft | null>(null);

  const domainLeaves = useMemo(() => indexedLeaves(DOMAIN_AXIS), []);
  const capabilityLeaves = useMemo(() => indexedLeaves(CAPABILITY_AXIS), []);
  const domainGroups = useMemo(() => indexedGroups(DOMAIN_AXIS), []);
  const capabilityGroups = useMemo(() => indexedGroups(CAPABILITY_AXIS), []);

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
      `26px 158px ${domainLeaves
        .map(({ leaf }) => `${trackWeight(domainCounts.get(leaf.id) ?? 0)}fr`)
        .join(" ")}`,
    [domainLeaves, domainCounts]
  );

  const gridTemplateRows = useMemo(
    () =>
      `22px 42px ${capabilityLeaves
        .map(({ leaf }) => `${trackWeight(capabilityCounts.get(leaf.id) ?? 0)}fr`)
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

  return (
    <div className="map-view">
      <div className="map-legend">
        <div className="legend-item">
          <span className="legend-swatch" />
          Logo chip — hover for details, click to pin, drag to reposition
        </div>
        <div className="legend-item">Click empty space to add a company</div>
        <div className="legend-spacer" />
        <Legend />
      </div>

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
                  value={labelFor(labelOverrides, group.id, group.label)}
                  onCommit={(name) => onRenameLabel(group.id, name)}
                  title="Click to rename"
                />
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
              value={labelFor(labelOverrides, leaf.id, leaf.label)}
              onCommit={(name) => onRenameLabel(leaf.id, name)}
              title="Click to rename"
            />
            <span className="map-column-header-count">
              {domainCounts.get(leaf.id) ?? 0} co.
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
                  value={labelFor(labelOverrides, group.id, group.label)}
                  onCommit={(name) => onRenameLabel(group.id, name)}
                  title="Click to rename"
                />
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
              value={labelFor(labelOverrides, leaf.id, leaf.label)}
              onCommit={(name) => onRenameLabel(leaf.id, name)}
              title="Click to rename"
            />
            <span className="band-label-count">
              {capabilityCounts.get(leaf.id) ?? 0} co.
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

      {newDraft && (
        <CompanyForm
          initial={newDraft}
          isEditing={false}
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
