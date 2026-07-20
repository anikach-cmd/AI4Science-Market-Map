import { useEffect, useMemo, useRef, useState } from "react";
import { bandForExecution, type Band } from "../config/domains";
import type { Company, CompanyDraft } from "../types";
import { layoutMap, pixelToDomainIndex, pixelToExecution } from "../utils/mapLayout";
import { CompanyChip } from "./CompanyChip";
import { CompanyForm } from "./CompanyForm";
import { EditableText } from "./EditableText";

interface MapViewProps {
  companies: Company[];
  onAdd: (draft: CompanyDraft) => void;
  onUpdate: (id: string, draft: CompanyDraft) => void;
  onDelete: (id: string) => void;
  domains: string[];
  onRenameDomain: (index: number, name: string) => void;
  onAddDomain: (name: string) => void;
  onRemoveDomain: (index: number) => void;
  onMoveDomain: (index: number, dir: -1 | 1) => void;
  bands: Band[];
  onRenameBand: (index: number, name: string) => void;
  onAddBand: () => void;
  onRemoveBand: (index: number) => void;
  onMoveBand: (index: number, dir: -1 | 1) => void;
}

export function MapView({
  companies,
  onAdd,
  onUpdate,
  onDelete,
  domains,
  onRenameDomain,
  onAddDomain,
  onRemoveDomain,
  onMoveDomain,
  bands,
  onRenameBand,
  onAddBand,
  onRemoveBand,
  onMoveBand,
}: MapViewProps) {
  const plotRef = useRef<HTMLDivElement>(null);
  const [plotSize, setPlotSize] = useState({ width: 0, height: 0 });
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [newDraft, setNewDraft] = useState<CompanyDraft | null>(null);

  const bandLabels = useMemo(() => bands.map((b) => b.name), [bands]);

  useEffect(() => {
    const el = plotRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setPlotSize({ width, height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const placedChips = useMemo(
    () => layoutMap(companies, domains, plotSize.width, plotSize.height),
    [companies, domains, plotSize.width, plotSize.height]
  );

  const bandCounts = useMemo(() => {
    const counts = new Map<string, number>(bands.map((b) => [b.name, 0]));
    companies.forEach((c) => {
      const band = bandForExecution(c.execution, bands);
      counts.set(band.name, (counts.get(band.name) ?? 0) + 1);
    });
    return counts;
  }, [companies, bands]);

  const emptyDraft = (domain: string, execution: number): CompanyDraft => ({
    name: "",
    websiteUrl: "",
    domain,
    execution,
    description: "",
    rationale: "",
    tag: "",
  });

  const handlePlotClick = (e: React.MouseEvent) => {
    if (e.target !== e.currentTarget) return;
    const rect = plotRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const execution = pixelToExecution(y, rect.height);
    const domainIdx = pixelToDomainIndex(x, rect.width, domains.length);
    setNewDraft(emptyDraft(domains[domainIdx], execution));
  };

  const handleDragEnd = (company: Company, clientX: number, clientY: number) => {
    const rect = plotRef.current!.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, clientY - rect.top));
    const execution = pixelToExecution(y, rect.height);
    const domainIdx = pixelToDomainIndex(x, rect.width, domains.length);
    const { id, ...rest } = company;
    onUpdate(id, { ...rest, execution, domain: domains[domainIdx] });
  };

  const handleAddDomain = () => {
    const n = domains.filter((d) => d.startsWith("New domain")).length;
    onAddDomain(n === 0 ? "New domain" : `New domain ${n + 1}`);
  };

  return (
    <div className="map-view">
      <div className="map-legend">
        <div className="legend-item">
          <span className="legend-swatch" />
          Logo chip — hover for details, click to pin, drag to reposition
        </div>
        <div className="legend-item">Click empty space to add a company</div>
        <div className="legend-item legend-spacer" />
        <button className="btn btn-ghost btn-sm" onClick={onAddBand}>
          + Add band
        </button>
        <button className="btn btn-ghost btn-sm" onClick={handleAddDomain}>
          + Add domain column
        </button>
      </div>

      <div className="map-grid-wrapper">
        <div className="map-y-axis">
          {bands
            .map((band, index) => ({ band, index }))
            .slice()
            .reverse()
            .map(({ band, index }) => (
              <div
                key={index}
                className="band-label"
                style={{ flex: band.max - band.min }}
              >
                <div className="axis-item-controls">
                  <button
                    title="Move toward top"
                    onClick={() => onMoveBand(index, 1)}
                  >
                    ↑
                  </button>
                  <button
                    title="Move toward bottom"
                    onClick={() => onMoveBand(index, -1)}
                  >
                    ↓
                  </button>
                  {bands.length > 1 && (
                    <button
                      title="Remove band"
                      onClick={() => onRemoveBand(index)}
                    >
                      ×
                    </button>
                  )}
                </div>
                <EditableText
                  className="band-label-text"
                  inputClassName="band-label-input"
                  value={band.name}
                  onCommit={(name) => onRenameBand(index, name)}
                  title="Click to rename band"
                />
                <span className="band-label-count">
                  {bandCounts.get(band.name) ?? 0} co.
                </span>
              </div>
            ))}
        </div>

        <div className="map-main">
          <div className="map-columns-header">
            {domains.map((d, index) => (
              <div key={index} className="map-column-header">
                <EditableText
                  className="map-column-header-text"
                  inputClassName="map-column-header-input"
                  value={d}
                  onCommit={(name) => onRenameDomain(index, name)}
                  title="Click to rename domain"
                />
                <div className="axis-item-controls axis-item-controls-row">
                  <button
                    title="Move left"
                    onClick={() => onMoveDomain(index, -1)}
                  >
                    ←
                  </button>
                  <button
                    title="Move right"
                    onClick={() => onMoveDomain(index, 1)}
                  >
                    →
                  </button>
                  {domains.length > 1 && (
                    <button
                      title="Remove domain"
                      onClick={() => onRemoveDomain(index)}
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="map-plot" ref={plotRef} onClick={handlePlotClick}>
            {/* band gridlines */}
            {bands.slice(0, -1).map((band, i) => (
              <div
                key={i}
                className="band-gridline"
                style={{ top: `${100 - band.max}%` }}
              />
            ))}
            {/* column gridlines */}
            {domains.slice(1).map((_, i) => (
              <div
                key={i}
                className="column-gridline"
                style={{ left: `${((i + 1) / domains.length) * 100}%` }}
              />
            ))}

            {placedChips.map(({ company, x, y }) => (
              <CompanyChip
                key={company.id}
                company={company}
                x={x}
                y={y}
                onEdit={setEditingCompany}
                onDelete={onDelete}
                onDragEnd={handleDragEnd}
              />
            ))}
          </div>

          <div className="map-x-axis-label">
            Scientific domain — narrow specialist → generalist
          </div>
        </div>
      </div>

      {newDraft && (
        <CompanyForm
          initial={newDraft}
          isEditing={false}
          domains={domains}
          bandLabels={bandLabels}
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
          domains={domains}
          bandLabels={bandLabels}
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
