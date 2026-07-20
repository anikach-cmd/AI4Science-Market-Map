import { useMemo, useState } from "react";
import {
  CAPABILITY_AXIS,
  DOMAIN_AXIS,
  flattenLeaves,
  type AxisGroup,
} from "../config/taxonomy";
import type { Company, CompanyDraft } from "../types";
import { cellKey, groupIntoCells, MAX_INLINE_CHIPS } from "../utils/mapLayout";
import { CellDetailPanel } from "./CellDetailPanel";
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
  const [expandedCell, setExpandedCell] = useState<{
    domainId: string;
    capabilityId: string;
  } | null>(null);

  const domainLeaves = useMemo(() => flattenLeaves(DOMAIN_AXIS), []);
  const capabilityLeaves = useMemo(() => flattenLeaves(CAPABILITY_AXIS), []);

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

  const renderGroupSpans = (
    groups: AxisGroup[],
    direction: "row" | "column"
  ) =>
    groups.map((group) => {
      const count = group.leaves.length;
      const label = group.label ? labelFor(labelOverrides, group.id, group.label) : null;
      return (
        <div
          key={group.id}
          className={`axis-group-span axis-group-span-${direction}${
            label ? " axis-group-span-bracket" : ""
          }`}
          style={{ flexGrow: count, flexBasis: 0 }}
        >
          {label && (
            <EditableText
              className="axis-group-label"
              inputClassName="axis-group-label-input"
              value={label}
              onCommit={(name) => onRenameLabel(group.id, name)}
              title="Click to rename"
            />
          )}
        </div>
      );
    });

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

      <div className="map-grid-wrapper">
        <div className="map-y-axis">
          <div className="y-axis-groups">
            {renderGroupSpans(CAPABILITY_AXIS, "column")}
          </div>
          <div className="y-axis-leaves">
            {capabilityLeaves.map((leaf) => (
              <div key={leaf.id} className="band-label" style={{ flexGrow: 1, flexBasis: 0 }}>
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
          </div>
        </div>

        <div className="map-main">
          <div className="map-columns-header">
            <div className="x-axis-groups">
              {renderGroupSpans(DOMAIN_AXIS, "row")}
            </div>
            <div className="x-axis-leaves">
              {domainLeaves.map((leaf) => (
                <div key={leaf.id} className="map-column-header" style={{ flexGrow: 1, flexBasis: 0 }}>
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
            </div>
          </div>

          <div className="map-plot">
            {domainLeaves.map((domainLeaf) => (
              <div
                key={domainLeaf.id}
                className="map-column-track"
                style={{ flexGrow: 1, flexBasis: 0 }}
              >
                {capabilityLeaves.map((capLeaf) => {
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
                  const overflow = ordered.length > MAX_INLINE_CHIPS;
                  const visible = overflow
                    ? ordered.slice(0, MAX_INLINE_CHIPS - 1)
                    : ordered;
                  const hiddenCount = ordered.length - visible.length;

                  return (
                    <div
                      key={capLeaf.id}
                      className="map-cell"
                      data-domain={domainLeaf.id}
                      data-capability={capLeaf.id}
                      onClick={(e) => handleCellClick(e, domainLeaf.id, capLeaf.id)}
                    >
                      {visible.map((company) => (
                        <CompanyChip
                          key={company.id}
                          company={company}
                          query={query}
                          onEdit={setEditingCompany}
                          onDelete={onDelete}
                          onDragEnd={handleDragEnd}
                        />
                      ))}
                      {hiddenCount > 0 && (
                        <button
                          className="cell-more-chip"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedCell({
                              domainId: domainLeaf.id,
                              capabilityId: capLeaf.id,
                            });
                          }}
                        >
                          +{hiddenCount} more
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
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

      {expandedCell && (
        <CellDetailPanel
          domainLabel={labelFor(
            labelOverrides,
            expandedCell.domainId,
            domainLeaves.find((l) => l.id === expandedCell.domainId)?.label ?? ""
          )}
          capabilityLabel={labelFor(
            labelOverrides,
            expandedCell.capabilityId,
            capabilityLeaves.find((l) => l.id === expandedCell.capabilityId)?.label ?? ""
          )}
          companies={cells.get(cellKey(expandedCell.domainId, expandedCell.capabilityId)) ?? []}
          onClose={() => setExpandedCell(null)}
          onEdit={(company) => {
            setExpandedCell(null);
            setEditingCompany(company);
          }}
        />
      )}
    </div>
  );
}
